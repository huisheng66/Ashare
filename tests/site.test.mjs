import assert from "node:assert/strict";
import test from "node:test";

import { absoluteSiteUrl, getSiteUrl } from "../lib/site.ts";

function withSiteUrl(value, check) {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = value;
    check();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
}

test("metadata omits absolute URLs when the configured origin is absent or invalid", () => {
  for (const value of [
    undefined,
    "",
    "not a url",
    "javascript:alert(1)",
    "https://user:password@ashare.test",
    "https://ashare.test/path",
    "https://ashare.test?query=1",
    "https://ashare.test/#hash",
  ]) {
    withSiteUrl(value, () => {
      assert.equal(getSiteUrl(), undefined, String(value));
      assert.equal(absoluteSiteUrl("/software/vscode"), undefined);
    });
  }
});

test("canonical and sitemap URLs resolve against the explicit site origin", () => {
  withSiteUrl(" https://ashare.test/ ", () => {
    assert.equal(getSiteUrl().origin, "https://ashare.test");
    assert.equal(absoluteSiteUrl("/software/vscode"), "https://ashare.test/software/vscode");
    assert.equal(absoluteSiteUrl("/"), "https://ashare.test/");
  });
});
