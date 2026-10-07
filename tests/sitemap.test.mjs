import assert from "node:assert/strict";
import { test } from "node:test";

import { chunkLocations, renderSitemapIndex, renderUrlset, softwareEntries, staticEntries } from "../lib/sitemap.ts";

/**
 * 站点地图是手写的 XML（Next 的 generateSitemaps 不提供 /sitemap.xml，见 lib/sitemap.ts 注释），
 * 所以结构合法性与转义必须自己测。
 */

const SITE = new URL("https://example.com/");

test("urlset：空集合也产出合法 XML", () => {
  const xml = renderUrlset([]);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(xml.endsWith("</urlset>"));
  assert.equal(xml.includes("<url>"), false);
});

test("urlset：可选字段只在有值时出现，priority 固定一位小数", () => {
  const xml = renderUrlset([{ loc: "https://example.com/a", changefreq: "weekly", priority: 1 }]);
  assert.ok(xml.includes("<loc>https://example.com/a</loc>"));
  assert.ok(xml.includes("<changefreq>weekly</changefreq>"));
  assert.ok(xml.includes("<priority>1.0</priority>"));
  assert.equal(xml.includes("<lastmod>"), false);

  const dated = renderUrlset([{ loc: "https://example.com/b", lastmod: "2026-01-02T03:04:05.000Z" }]);
  assert.ok(dated.includes("<lastmod>2026-01-02T03:04:05.000Z</lastmod>"));
});

test("转义：URL 里的 & 不能破坏 XML", () => {
  const xml = renderUrlset([{ loc: "https://example.com/?a=1&b=2", lastmod: 'x"y<z>' }]);
  assert.ok(xml.includes("https://example.com/?a=1&amp;b=2"), xml);
  assert.equal(xml.includes("<z>"), false, "尖括号必须被转义");
  assert.ok(xml.includes("&quot;"));
});

test("slug 编码：斜杠与空格都要编码进 loc", () => {
  const [entry] = softwareEntries(SITE, [{ slug: "a/b c" }]);
  assert.equal(entry.loc, "https://example.com/software/a%2Fb%20c");
});

test("索引：每个分片一条 sitemap，地址可解析", () => {
  const xml = renderSitemapIndex(chunkLocations(SITE, 3));
  assert.equal((xml.match(/<sitemap>/g) ?? []).length, 3);
  assert.ok(xml.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(xml.includes("<loc>https://example.com/sitemaps/2</loc>"));
  assert.ok(renderSitemapIndex([]).endsWith("</sitemapindex>"));
});

test("固定页面：首页优先级 1，场景页齐全", () => {
  const entries = staticEntries(SITE);
  assert.equal(entries.find((entry) => entry.loc === "https://example.com/")?.priority, 1);
  assert.ok(entries.some((entry) => entry.loc === "https://example.com/scenes/code"));
  assert.ok(entries.length >= 16, "固定页面应含首页、收录标准、投稿、反馈与 12 个场景");
});
