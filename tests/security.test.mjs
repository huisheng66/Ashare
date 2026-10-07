import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, hashPassword, parseSessionToken, SESSION_MS, verifyPasswordHash, verifySignedSessionToken } from "../lib/auth-crypto.ts";
import { imageExtension, isHttpUrl, mediaParts } from "../lib/input-validation.ts";
import { SlidingWindowLimiter } from "../lib/rate-limiter.ts";

test("password verification validates scrypt hashes before decoding hex", async () => {
  const hash = hashPassword("correct horse battery staple");
  assert.equal(await verifyPasswordHash("correct horse battery staple", hash), true);
  assert.equal(await verifyPasswordHash("wrong", hash), false);
  for (const stored of ["", "zz:zz", "aa:gg", "aa:", `${"ab".repeat(16)}:${"a".repeat(127)}`, `${hash}:extra`]) {
    assert.equal(await verifyPasswordHash("any-password", stored), false);
  }
  assert.equal(await verifyPasswordHash("a".repeat(1025), hash), false);
});

test("session tokens carry identity and reject malformed, expired, and tampered cookies", () => {
  const secret = "test-secret-only-never-used-in-runtime";
  const now = 1_789_804_800_000;
  const subject = { username: "alice", role: "admin" };
  const token = createSessionToken(secret, subject, now);

  assert.equal(verifySignedSessionToken(token, secret, now), true);
  assert.deepEqual(parseSessionToken(token, secret, now), subject, "身份应能原样取回");
  assert.equal(verifySignedSessionToken(token, secret, now + SESSION_MS), false, "过期即失效");
  assert.equal(verifySignedSessionToken(token, "different-secret", now), false);

  // 篡改任一字段都必须失效：有效期、角色、用户名、签名。
  const [exp, role, encoded, signature] = token.split(".");
  for (const bad of [
    `${Number(exp) + 60_000}.${role}.${encoded}.${signature}`,
    `${exp}.editor.${encoded}.${signature}`,
    `${exp}.${role}.${Buffer.from("mallory").toString("base64url")}.${signature}`,
    `${exp}.${role}.${encoded}.${"0".repeat(64)}`,
  ]) {
    assert.equal(parseSessionToken(bad, secret, now), undefined, "篡改应失效：" + bad.slice(0, 24));
  }

  // 非 ASCII 用户名经 base64url 往返。
  const cjk = { username: "编辑一号", role: "editor" };
  assert.deepEqual(parseSessionToken(createSessionToken(secret, cjk, now), secret, now), cjk);

  for (const invalid of [undefined, "", `${token}.suffix`, "a.b.c", `NaN.${"0".repeat(64)}`, `${token.slice(0, -1)}x`]) {
    assert.equal(verifySignedSessionToken(invalid, secret, now), false);
  }
});

test("sliding windows enforce expiry boundaries and bound unique keys", () => {
  const limiter = new SlidingWindowLimiter(2);
  assert.equal(limiter.allow("a", 2, 100, 1000), true);
  assert.equal(limiter.allow("a", 2, 100, 1001), true);
  assert.equal(limiter.allow("a", 2, 100, 1002), false);
  assert.equal(limiter.allow("b", 2, 100, 1002), true);
  assert.equal(limiter.allow("c", 2, 100, 1003), false);
  assert.equal(limiter.allow("a", 2, 100, 1100), true);
  assert.equal(limiter.allow("c", 2, 100, 1102), true);
});

test("external links reject script protocols, embedded credentials and oversized values", () => {
  assert.equal(isHttpUrl("https://example.com/tool?q=1"), true);
  assert.equal(isHttpUrl("http://example.com", true), true);
  for (const url of ["javascript:alert(1)", "data:text/html,test", "https://user:pass@example.com", "http://example.com", "https://example.com/" + "x".repeat(2048)]) {
    assert.equal(isHttpUrl(url), false);
  }
});

test("uploads require a matching image signature and generated media paths", () => {
  assert.equal(imageExtension("image/png", Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "png");
  assert.equal(imageExtension("image/jpeg", Buffer.from([255, 216, 255])), "jpg");
  assert.equal(imageExtension("image/gif", Buffer.from("GIF89a")), "gif");
  assert.equal(imageExtension("image/webp", Buffer.from("RIFF1234WEBP")), "webp");
  assert.equal(imageExtension("image/png", Buffer.from("<html>not an image</html>")), undefined);
  assert.equal(imageExtension("image/svg+xml", Buffer.from("<svg></svg>")), undefined);
  assert.deepEqual(mediaParts("/media/test-item/0123456789abcdef.png"), ["test-item", "0123456789abcdef.png"]);
  for (const value of ["/media/test-item/../../secret", "/media/test-item/0123456789abcdef.png/extra", "/media/../0123456789abcdef.png", "/media/test-item/x.png", "/media/test-item/0123456789abcdef.svg"]) {
    assert.equal(mediaParts(value), undefined);
  }
});
