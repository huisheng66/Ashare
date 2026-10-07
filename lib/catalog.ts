import "server-only";

import { cache } from "react";

import type { CatalogCounts, CatalogItem, SceneId, Software } from "@/data/types";
import * as sql from "./catalog-sql.ts";
import {
  kindIds,
  platformIds,
  sceneIds,
  selectCatalogItems,
  type CatalogFilters,
} from "./catalog-query.ts";
import { searchSoftware, toCatalogItem } from "./items.ts";
import { getCatalogAll } from "./store.ts";

/**
 * 目录读路径门面：按 STORE_DRIVER 在「SQL 下推」与「内存全量」之间转发。
 *
 * 为什么保留内存实现：它是回滚路径，也是没有数据库的测试路径。
 * 但**请求路径不该调用 allPublished()** —— 它是 O(N) 的读，条目几何增长后第一个炸的就是它。
 * 请求路径请用 queryCatalog / getSoftware / byScene / catalogCounts / featuredCatalog。
 */

/**
 * 一页的条目数。只有超过一页时才渲染分页控件，
 * 所以 55 条时首页与从前完全一样，涨到几千条才自动分页。
 * CATALOG_PAGE_SIZE 可覆盖（上限 500），便于运维调节，也便于验证分页本身。
 */
export const PAGE_SIZE = (() => {
  const raw = Number(process.env.CATALOG_PAGE_SIZE);
  return Number.isInteger(raw) && raw > 0 && raw <= 500 ? raw : 60;
})();

function mysqlDriver(): boolean {
  return process.env.STORE_DRIVER === "mysql";
}

/** 整份已发布目录。O(N)：只给「确实需要全部」的地方（搜索、回滚路径）。 */
export const allPublished = cache(async (): Promise<Software[]> => {
  if (mysqlDriver()) return sql.allPublishedSql();
  return (await getCatalogAll()).filter((item) => item.status === "published");
});

const publishedBySlug = cache(async () => new Map((await allPublished()).map((item) => [item.slug, item])));

/**
 * 计数的缓存寿命。
 *
 * 计数要扫全表做聚合，而它挂在根布局上 —— **每个页面渲染都会跑**。
 * 实测 20,000 条时原始聚合要 387ms，5,000 条时 46ms，是随条目数线性增长的那一类。
 * 筛选芯片上的数字晚 30 秒不算问题，但每页多等三四百毫秒是问题。
 * 多进程下每个进程各存一份，对计数来说完全可以接受。
 */
const COUNTS_TTL_MS = 30_000;
let countsCache: { at: number; value: CatalogCounts } | undefined;

/** 计数在根布局每页都要用，是站点最热的读；SQL 路径下推成聚合查询 + 30 秒 TTL。 */
export const catalogCounts = cache(async (): Promise<CatalogCounts> => {
  const now = Date.now();
  if (countsCache && now - countsCache.at < COUNTS_TTL_MS) return countsCache.value;
  const value = await computeCatalogCounts();
  countsCache = { at: now, value };
  return value;
});

async function computeCatalogCounts(): Promise<CatalogCounts> {
  if (mysqlDriver()) return sql.catalogCountsSql();

  const items = await allPublished();
  const counts: CatalogCounts = {
    total: items.length,
    discount: 0,
    kinds: Object.fromEntries(kindIds.map((id) => [id, 0])) as CatalogCounts["kinds"],
    scenes: Object.fromEntries(sceneIds.map((id) => [id, 0])) as CatalogCounts["scenes"],
    platforms: Object.fromEntries(platformIds.map((id) => [id, 0])) as CatalogCounts["platforms"],
  };
  for (const item of items) {
    if (item.source === "discount") counts.discount += 1;
    if (Object.hasOwn(counts.kinds, item.kind)) counts.kinds[item.kind] += 1;
    for (const id of new Set(item.scenes)) if (Object.hasOwn(counts.scenes, id)) counts.scenes[id] += 1;
    for (const id of new Set(item.platforms)) if (Object.hasOwn(counts.platforms, id)) counts.platforms[id] += 1;
  }
  return counts;
}

export async function getSoftware(slug: string): Promise<Software | undefined> {
  if (mysqlDriver()) return sql.getSoftwareSql(slug);
  return (await publishedBySlug()).get(slug);
}

export async function byScene(id: SceneId): Promise<Software[]> {
  if (mysqlDriver()) return sql.bySceneSql(id);
  return (await allPublished()).filter((item) => item.scenes.includes(id));
}

export async function alternativesOf(item: Software): Promise<Software[]> {
  if (mysqlDriver()) return sql.alternativesOfSql(item.alternatives);
  const published = await publishedBySlug();
  return item.alternatives
    .map((slug) => published.get(slug))
    .filter((value): value is Software => Boolean(value));
}

export type CatalogPage = {
  items: CatalogItem[];
  total: number;
  page: number;
  pageCount: number;
};

/** 目录列表：筛选、排序、分页全下推。JSON 路径在内存里做等价的事。 */
export async function queryCatalog(filters: CatalogFilters, page = 1): Promise<CatalogPage> {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const offset = (safePage - 1) * PAGE_SIZE;

  if (mysqlDriver()) {
    const [total, items] = await Promise.all([
      sql.countCatalog(filters),
      sql.queryCatalog(filters, PAGE_SIZE, offset),
    ]);
    return { items, total, page: safePage, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
  }

  const selected = selectCatalogItems(await allPublished(), filters);
  return {
    items: selected.slice(offset, offset + PAGE_SIZE).map(toCatalogItem),
    total: selected.length,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(selected.length / PAGE_SIZE)),
  };
}

export type SearchPage = { items: CatalogItem[]; total: number; page: number; pageCount: number };

/**
 * 搜索：SQL 路径走 FULLTEXT + ngram（短词 LIKE 兜底），JSON 路径用内存打分。
 * 两条路径的**结果集不完全相同**：SQL 的检索字段是 search_text（不含长正文），
 * 内存实现还扫正文。这条差异是刻意的，已写进计划文档。
 */
export async function searchCatalog(query: string, page = 1): Promise<SearchPage> {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const offset = (safePage - 1) * PAGE_SIZE;

  if (mysqlDriver()) {
    const { items, total } = await sql.searchCatalog(query, PAGE_SIZE, offset);
    return { items, total, page: safePage, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
  }

  const results = query ? searchSoftware(query, await allPublished()) : [];
  return {
    items: results.slice(offset, offset + PAGE_SIZE).map(toCatalogItem),
    total: results.length,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(results.length / PAGE_SIZE)),
  };
}

/** 首页编辑精选。 */
export async function featuredCatalog(limit: number): Promise<{ items: CatalogItem[]; total: number }> {
  if (mysqlDriver()) return sql.featuredCatalog(limit);
  const featured = (await allPublished()).filter((item) => item.featured);
  return { items: featured.slice(0, limit).map(toCatalogItem), total: featured.length };
}

/** 站点地图分片：只读 slug 与更新时间。 */
export async function sitemapChunk(offset: number, limit: number): Promise<{ slug: string; updatedAt?: string }[]> {
  if (mysqlDriver()) return sql.sitemapPage(offset, limit);
  return (await allPublished()).slice(offset, offset + limit).map((item) => {
    const entry: { slug: string; updatedAt?: string } = { slug: item.slug };
    if (item.updatedAt && Number.isFinite(Date.parse(item.updatedAt))) entry.updatedAt = item.updatedAt;
    return entry;
  });
}

export async function publishedTotal(): Promise<number> {
  if (mysqlDriver()) return sql.publishedCount();
  return (await allPublished()).length;
}

export type ClickItemSummary = Pick<Software, "slug" | "name" | "kind" | "scenes" | "source">;

/** 点击页：只为出现过的 slug 取名称与分类，不再拉整份目录。 */
export async function itemSummaries(slugs: string[]): Promise<ClickItemSummary[]> {
  if (mysqlDriver()) return sql.clickItemSummaries(slugs);
  const published = await publishedBySlug();
  const summaries: ClickItemSummary[] = [];
  for (const slug of slugs) {
    const item = published.get(slug);
    if (!item) continue;
    summaries.push({ slug: item.slug, name: item.name, kind: item.kind, scenes: item.scenes, source: item.source });
  }
  return summaries;
}
