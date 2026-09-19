import assert from "node:assert/strict";
import test from "node:test";
import {
  activeFilterCount,
  catalogFiltersFromURL,
  catalogHref,
  clearCatalogFilters,
  firstSearchParam,
  isSceneId,
  MAX_SEARCH_LENGTH,
  parseCatalogFilters,
  searchQueryParam,
  selectCatalogItems,
} from "../lib/catalog-query.ts";
import { filterSoftware, searchSoftware, toCatalogItem } from "../lib/items.ts";

function item(overrides = {}) {
  return {
    slug: "test-tool", name: "Test Tool", kind: "app", status: "published",
    aliases: [], tags: [], summary: "", body: "", whoFor: "", whoNot: "",
    scenes: ["code"], platforms: ["windows"], source: "official",
    links: { official: "https://example.com/" }, tutorial: [], alternatives: [],
    previews: [], icon: { letter: "T", color: "#333333" },
    ...overrides,
  };
}

const slugs = (items) => items.map((entry) => entry.slug);

test("repeated and comma-separated filters produce the same server and client selection", () => {
  const params = {
    scene: ["code,docs", "design,code,unknown", " __proto__ , "],
    platform: ["windows", "linux,windows"],
    kind: ["script", "invalid,opensource"],
    discount: ["1", "0"],
    sort: ["name", "updated"],
  };
  const filters = parseCatalogFilters(params);
  assert.deepEqual([...filters.scenes], ["code", "docs", "design"]);
  assert.deepEqual([...filters.platforms], ["windows", "linux"]);
  assert.deepEqual([...filters.kinds], ["script", "opensource"]);
  assert.equal(filters.discountOnly, true);
  assert.equal(filters.sort, "name");
  assert.equal(activeFilterCount(filters), 8);
  const url = new URLSearchParams();
  for (const [key, values] of Object.entries(params)) {
    for (const value of values) url.append(key, value);
  }
  assert.deepEqual(catalogFiltersFromURL(url), filters);
});

test("invalid filters cannot create phantom selections or invalid scene lookups", () => {
  const filters = parseCatalogFilters({ scene: "toString", platform: "android", kind: "constructor", sort: "other" });
  assert.equal(activeFilterCount(filters), 0);
  assert.equal(filters.sort, "featured");
  for (const id of ["toString", "constructor", "__proto__", "unknown", ""]) {
    assert.equal(isSceneId(id), false);
  }
  assert.equal(isSceneId("code"), true);
});

test("clearing filters preserves view and sorting and removes every duplicate", () => {
  const params = new URLSearchParams("scene=code&scene=docs&platform=linux&kind=app&discount=1&sort=name&view=list");
  clearCatalogFilters(params);
  assert.equal(catalogHref(params), "/?sort=name&view=list");
  assert.equal(catalogHref(new URLSearchParams()), "/");
});

test("scalar search parameters choose the first value and normalize full-width input", () => {
  assert.equal(firstSearchParam(undefined), "");
  assert.equal(firstSearchParam([]), "");
  assert.equal(searchQueryParam(["  ＶＳ　 Ｃｏｄｅ  ", "ignored"]), "VS Code");
  assert.equal(searchQueryParam("x".repeat(400)).length, MAX_SEARCH_LENGTH);
});

test("filters are OR within groups and AND across groups without mutating the catalogue", () => {
  const items = [
    item({ slug: "win-code", scenes: ["code"], platforms: ["windows"] }),
    item({ slug: "linux-design", scenes: ["design"], platforms: ["linux"], kind: "opensource" }),
    item({ slug: "mac-design", scenes: ["design"], platforms: ["macos"] }),
    item({ slug: "docs", scenes: ["docs"], platforms: ["linux"] }),
  ];
  const filters = parseCatalogFilters({ scene: "code,design", platform: "linux,windows" });
  assert.deepEqual(slugs(selectCatalogItems(items, filters)), ["win-code", "linux-design"]);
  filters.kinds.add("opensource");
  assert.deepEqual(slugs(selectCatalogItems(items, filters)), ["linux-design"]);
  filters.discountOnly = true;
  assert.deepEqual(selectCatalogItems(items, filters), []);
  assert.deepEqual(slugs(items), ["win-code", "linux-design", "mac-design", "docs"]);
});

test("recommended sorting promotes editorial picks and preserves ties", () => {
  const items = [item({ slug: "first" }), item({ slug: "featured", featured: true }), item({ slug: "last" })];
  assert.deepEqual(slugs(selectCatalogItems(items, parseCatalogFilters({}))), ["featured", "first", "last"]);
  assert.deepEqual(slugs(items), ["first", "featured", "last"]);
});

test("date sorting uses timestamps across time zones and puts missing dates last", () => {
  const items = [
    item({ slug: "missing" }),
    item({ slug: "older", updatedAt: "2026-09-19T09:00:00+08:00" }),
    item({ slug: "newer", updatedAt: "2026-09-19T03:00:00Z" }),
    item({ slug: "invalid", updatedAt: "not-a-date" }),
  ];
  assert.deepEqual(slugs(selectCatalogItems(items, parseCatalogFilters({ sort: "updated" }))), ["newer", "older", "missing", "invalid"]);
});

test("name sorting handles numeric names naturally", () => {
  const items = [item({ slug: "ten", name: "Tool 10" }), item({ slug: "two", name: "Tool 2" })];
  assert.deepEqual(slugs(selectCatalogItems(items, parseCatalogFilters({ sort: "name" }))), ["two", "ten"]);
});

test("search ranks exact localized names and aliases above incidental body matches", () => {
  const items = [
    item({ slug: "body", body: "Supports Blender imports" }),
    item({ slug: "alias", aliases: ["Blender"] }),
    item({ slug: "prefix", name: "Blender Tools" }),
    item({ slug: "exact", name: "Blender" }),
  ];
  assert.deepEqual(slugs(searchSoftware("ＢＬＥＮＤＥＲ", items)), ["exact", "prefix", "alias", "body"]);
  assert.deepEqual(slugs(searchSoftware("建模", [item({ slug: "zh", nameZh: "建模" })])), ["zh"]);
});

test("multi-word search matches every word across fields and prefers the full phrase", () => {
  const items = [
    item({ slug: "partial", name: "VS", summary: "editor" }),
    item({ slug: "split", name: "VS", tags: ["code"] }),
    item({ slug: "phrase", name: "VS Code" }),
  ];
  assert.deepEqual(slugs(searchSoftware("  vs   CODE ", items)), ["phrase", "split"]);
  assert.deepEqual(searchSoftware("vs missing", items), []);
  assert.equal(searchSoftware("   ", items), items);
  assert.deepEqual(slugs(searchSoftware("vs vs", [items[0], items[1]])), ["partial", "split"]);
});

test("list DTO excludes detail fields and sends only the first preview", () => {
  const original = item({ body: "private render payload", previews: ["/first.webp", "/second.webp"], tutorial: ["step"], aliases: ["alias"] });
  const dto = toCatalogItem(original);
  for (const key of ["body", "tutorial", "links", "alternatives", "aliases", "status"]) {
    assert.equal(Object.hasOwn(dto, key), false, key);
  }
  assert.deepEqual(dto.previews, ["/first.webp"]);
  assert.deepEqual(original.previews, ["/first.webp", "/second.webp"]);
  assert.deepEqual(filterSoftware([dto], { platform: "windows" }), [dto]);
  assert.deepEqual(filterSoftware([dto], { platform: "linux" }), []);
});
