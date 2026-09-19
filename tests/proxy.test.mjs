import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import fs from "node:fs";
import Module, { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Next normally initializes this in its server bootstrap.
globalThis.AsyncLocalStorage = AsyncLocalStorage;
const require = createRequire(import.meta.url);
// The installed 16.3.4 testing package still exports the original middleware name.
const { unstable_doesMiddlewareMatch } = require("next/experimental/testing/server");
const { NextRequest } = require("next/server");

function loadTypeScript(relativePath) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(outputText, filename);
  return loaded.exports;
}

const { proxy, config } = loadTypeScript("../proxy.ts");
const nextConfig = loadTypeScript("../next.config.ts").default;

test("page CSP applies to pages, while files use their own response policies", () => {
  for (const url of ["/", "/software/vscode", "/scenes/code", "/admin", "/admin/login", "/administrator", "/media-library", "/faviconXico"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig, url }), true, url);
  }
  for (const url of ["/_next/static/chunks/a.js", "/_next/image?url=%2Fmedia%2Ftest.png", "/favicon.ico", "/icon?icon.hash", "/media/vscode/abcdef.png", "/icons/visualstudiocode", "/robots.txt", "/sitemap.xml"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig, url }), false, url);
  }
});

test("each rendered page receives its own nonce and forwards the matching CSP", () => {
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    const first = proxy(new NextRequest("https://ashare.test/"));
    const second = proxy(new NextRequest("https://ashare.test/"));
    const csp = first.headers.get("Content-Security-Policy");
    assert.ok(csp.includes("'strict-dynamic'"));
    assert.ok(csp.includes("form-action 'self'"));
    assert.ok(!csp.includes("'unsafe-eval'"));
    assert.notEqual(csp, second.headers.get("Content-Security-Policy"));
    const nonce = first.headers.get("x-middleware-request-x-nonce");
    assert.ok(nonce);
    assert.ok(csp.includes("'nonce-" + nonce + "'"));
    assert.equal(first.headers.get("x-middleware-request-content-security-policy"), csp);
    process.env.NODE_ENV = "development";
    const developmentCsp = proxy(new NextRequest("http://localhost:3000/")).headers.get("Content-Security-Policy");
    assert.ok(developmentCsp.includes("'unsafe-eval'"));
    assert.ok(!developmentCsp.includes("upgrade-insecure-requests"));
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test("unsupported admin methods return 405 with Allow without matching unrelated prefixes", () => {
  for (const pathname of ["/admin", "/admin/items/new"]) {
    const response = proxy(new NextRequest("https://ashare.test" + pathname, { method: "DELETE" }));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "GET, HEAD, POST");
  }
  for (const method of ["GET", "HEAD", "POST"]) {
    assert.equal(proxy(new NextRequest("https://ashare.test/admin", { method })).status, 200);
  }
  assert.equal(proxy(new NextRequest("https://ashare.test/administrator", { method: "DELETE" })).status, 200);
});

test("base security headers cover files and image responses have a document sandbox", async () => {
  const rules = await nextConfig.headers();
  const globalHeaders = rules.find((rule) => rule.source === "/:path*").headers;
  assert.ok(globalHeaders.some((header) => header.key === "X-Content-Type-Options" && header.value === "nosniff"));
  assert.ok(globalHeaders.some((header) => header.key === "X-Frame-Options" && header.value === "DENY"));
  for (const source of ["/media/:path*", "/icons/:path*"]) {
    const policy = rules.find((rule) => rule.source === source).headers.find((header) => header.key === "Content-Security-Policy").value;
    assert.ok(policy.includes("default-src 'none'"));
    assert.ok(policy.includes("sandbox"));
  }
});

test("proxy and actions accept the complete advertised seven-image upload", async () => {
  const form = new FormData();
  const image = new Blob([new Uint8Array(5 * 1024 * 1024)], { type: "image/png" });
  for (let index = 0; index < 6; index++) form.append("previews", image, `preview-${index}.png`);
  form.append("iconImage", image, "icon.png");
  form.set("body", "中".repeat(50_000));
  const request = new Request("https://ashare.test/admin/items/new", { method: "POST", body: form });
  const bytes = (await request.arrayBuffer()).byteLength;
  const toBytes = (limit) => {
    if (typeof limit === "number") return limit;
    const [, count, unit] = /^(\d+)(b|kb|mb|gb)$/i.exec(limit);
    return Number(count) * ({ b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 }[unit.toLowerCase()]);
  };
  assert.ok(toBytes(nextConfig.experimental.serverActions.bodySizeLimit) >= bytes, "action must receive the full form");
  assert.ok(toBytes(nextConfig.experimental.proxyClientMaxBodySize) >= bytes, "proxy must not truncate the form");
});
