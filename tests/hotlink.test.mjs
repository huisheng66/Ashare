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

test("requestHost falls back to the request host when the site url is unset", async () => {
  // 回归：NEXT_PUBLIC_SITE_URL 未配置时 siteHost 为空，同站判断直接失效 ——
  // 本地开发时首屏图标全部 403。请求自身的 host 正是「谁在访问我」，不需要配置。
  const { requestHost } = await import("../lib/hotlink.ts");
  const req = (headers) => new Request("https://ashare.example/icons/a.svg", { headers });

  assert.equal(requestHost(req({ host: "localhost:3000" })), "localhost:3000");
  // normalizeHost 会剥掉 www. 与末尾的点，端口保留（localhost:3000 要能对上 origin）。
  assert.equal(requestHost(req({ host: "www.Ashare.Example." })), "ashare.example");
  // X-Forwarded-Host 默认不采纳：它由客户端可伪造，只在 TRUST_PROXY=1 时可信。
  assert.equal(requestHost(req({ host: "a.example", "x-forwarded-host": "b.example" })), "a.example");
  assert.equal(
    requestHost(req({ host: "a.example", "x-forwarded-host": "b.example" }), { TRUST_PROXY: "1" }),
    "b.example",
  );
  // 代理链取第一段。
  assert.equal(
    requestHost(req({ host: "a.example", "x-forwarded-host": "b.example, c.example" }), { TRUST_PROXY: "1" }),
    "b.example",
  );
  // 没有 host 头时不应抛错。
  assert.equal(requestHost(req({})), "");
});

test("decideHotlink allows a same-site referer once the host is filled in", async () => {
  // 路由的接法：配置缺失时用 requestHost 补上，然后同站必须放行。
  const { decideHotlink, hotlinkOptionsFromEnv, requestHost } = await import("../lib/hotlink.ts");
  const req = new Request("http://localhost:3000/icons/a.svg", {
    headers: { host: "localhost:3000", referer: "http://localhost:3000/software/vscode" },
  });
  const options = hotlinkOptionsFromEnv({});
  assert.equal(options.siteHost, "", "前提：未配置时 siteHost 为空");
  options.siteHost = requestHost(req, {});
  assert.equal(decideHotlink(req.headers.get("referer"), options).allowed, true);

  // 补上 host 之后，跨站仍然必须被拒。
  const cross = new Request("http://localhost:3000/icons/a.svg", {
    headers: { host: "localhost:3000", referer: "https://evil.example.com/" },
  });
  const options2 = hotlinkOptionsFromEnv({});
  options2.siteHost = requestHost(cross, {});
  assert.equal(decideHotlink(cross.headers.get("referer"), options2).allowed, false);
});
