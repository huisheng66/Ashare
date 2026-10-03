import assert from "node:assert/strict";
import test from "node:test";
import { decideHotlink, hotlinkOptionsFromEnv, hotlinkBlockedResponse, refererHost } from "../lib/hotlink.ts";

test("refererHost only accepts http(s) and strips www and trailing dots", () => {
  assert.equal(refererHost("https://ashare.example/software/vscode"), "ashare.example");
  assert.equal(refererHost("http://www.Ashare.Example./x"), "ashare.example");
  assert.equal(refererHost("HTTPS://ASHARE.EXAMPLE"), "ashare.example");
  // 非 http(s) 与带凭证的地址一律视为无 Referer，交由放行分支处理。
  for (const value of ["file:///etc/passwd", "javascript:alert(1)", "data:text/html,x", "not a url", "", null, undefined]) {
    assert.equal(refererHost(value), undefined);
  }
  assert.equal(refererHost("https://user:pw@evil.example/x"), undefined);
});

test("a missing referer is always allowed so direct opens and crawlers keep working", () => {
  for (const value of [null, undefined, "", "not a url"]) {
    assert.deepEqual(decideHotlink(value, { siteHost: "ashare.example" }), {
      allowed: true,
      reason: "no-referrer",
    });
  }
});

test("same-site subdomains are treated as our own, and lookalike hosts are not", () => {
  const site = { siteHost: "ashare.example" };
  assert.equal(decideHotlink("https://ashare.example/x", site).allowed, true);
  assert.equal(decideHotlink("https://www.ashare.example/x", site).allowed, true);
  // next/image 的优化器回源与静态资源都在同源下。
  assert.equal(decideHotlink("https://img.ashare.example/x", site).allowed, true);
  // 后缀相同但域名不同 —— 最常见的盗链伪装。
  for (const evil of [
    "https://evilashare.example/x",
    "https://ashare.example.evil.com/x",
    "https://notashare.example/x",
  ]) {
    assert.deepEqual(decideHotlink(evil, site), { allowed: false, reason: "cross-site" });
  }
});

test("allowlist entries match exactly or as parent domains, and can be empty", () => {
  const options = { siteHost: "ashare.example", allowlist: "weixin.qq.com, cdn.partner.example ,, " };
  assert.equal(decideHotlink("https://weixin.qq.com/x", options).allowed, true);
  assert.equal(decideHotlink("https://mmbiz.qpic.cn/x", options).allowed, false);
  // 空串不能被当成「匹配所有」。
  assert.equal(decideHotlink("https://anything.example/x", { allowlist: ",," }).allowed, false);
});

test("protection is disabled only by an explicit opt-out flag", () => {
  // 未开启配置时不能因为缺少 siteHost 就全站拒绝。
  assert.equal(decideHotlink("https://evil.example/x", {}).allowed, false);
  assert.equal(decideHotlink("https://evil.example/x", { disabled: true }).allowed, true);
  assert.equal(decideHotlink("https://ashare.example/x", { disabled: true }).reason, "disabled");
});

test("hotlinkOptionsFromEnv reads the opt-out and tolerates a broken site url", () => {
  const base = { NEXT_PUBLIC_SITE_URL: "https://ashare.example" };
  assert.deepEqual(hotlinkOptionsFromEnv(base), {
    siteHost: "ashare.example",
    allowlist: "",
    disabled: false,
  });
  // 非法 URL 不能抛错，否则会让整个图片路由 500。
  assert.equal(hotlinkOptionsFromEnv({ NEXT_PUBLIC_SITE_URL: "not a url" }).siteHost, "");
  assert.equal(hotlinkOptionsFromEnv({ NEXT_PUBLIC_SITE_URL: "" }).siteHost, "");
  const allowlisted = hotlinkOptionsFromEnv({ ...base, ASSET_REFERRER_ALLOWLIST: "weixin.qq.com" });
  assert.equal(allowlisted.allowlist, "weixin.qq.com");
  assert.equal(hotlinkOptionsFromEnv({ ASSET_HOTLINK_PROTECTION: "0" }).disabled, true);
  assert.equal(hotlinkOptionsFromEnv({ ASSET_HOTLINK_PROTECTION: "1" }).disabled, false);
});

test("blocked responses are not cacheable and stay uncrawlable", () => {
  const res = hotlinkBlockedResponse();
  assert.equal(res.status, 403);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("x-robots-tag"), "noindex");
  assert.equal(res.headers.get("cross-origin-resource-policy"), "same-origin");
});
