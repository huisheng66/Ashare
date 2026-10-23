import type { NextRequest } from "next/server";
import type { CatalogItem } from "@/data/types";

import { searchQueryParam } from "@/lib/catalog-query.ts";
import { searchCatalog } from "@/lib/catalog-sql.ts";
import { getClientIp, rateLimit } from "@/lib/guard.ts";

/**
 * GET /api/suggest?q=<查询>&limit=<条数>
 *
 * 即时搜索面板（⌘K）的建议接口：只回「够渲染一行」的字段。
 *
 * 为什么走 catalog-sql 而不是 lib/catalog.ts：
 *  - catalog.ts 带 `server-only`，且它的 searchCatalog 是「分页语义」——固定按 PAGE_SIZE
 *    切页、还要拼 page/pageCount。建议接口要的是「前 N 条」，直接调底层 (query, limit, offset)
 *    更贴合，也不用为一个 6 条的请求去构造一页 60 条的载荷。
 *  - 两条路径最终都落到同一个 SQL 实现（STORE_DRIVER=mysql 时 catalog.ts 也是转发到这里），
 *    所以排序与容错口径完全一致，不存在「建议面板和搜索页结果对不上」的分裂。
 *
 * 为什么返回窄投影（slug/name/nameZh/icon）：
 *  - CatalogItem 里还有 summary/tags/scenes/platforms/previews 等卡片字段，以及最大的
 *    iconImage。建议面板一个字都不渲染它们，带上只是白白放大 JSON、拖慢每次按键的往返。
 *  - 更要紧的是**正文绝不出现在这里**：body/guide 是条目里最大的两列，一旦被投影进来，
 *    6 条建议就能膨胀到几十 KB，且会把「搜索建议」变成一条内容泄漏面。窄投影是硬约束。
 *
 * 为什么必须限流：
 *  - 这是无鉴权、可被高频触发的公开端点，输入每变一次就可能打一次库；不限流等于给了一条
 *    免费的擦库/放大通道。按 IP 30 次/分钟，正常打字（含 200ms 防抖）远够用。
 *
 * 缓存：建议对同一 query 幂等，交给 CDN 缓存 60s、背景 5 分钟内回源刷新。
 */

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 10;
/**
 * 限流阈值。**不能照抄常规接口的 30/分钟** —— 这是「边打边搜」的自动补全接口，
 * 前端 200ms 防抖下，一个用户连续输入十来个字符就会打出 5~8 次请求，
 * 30/分钟会在正常打字时把人拦掉。120/分钟（平均 2 次/秒）既够正常使用，又能挡住脚本刷。
 *
 * 注意：`getClientIp()` 在没配 TRUST_PROXY / 无转发头时返回 "unknown"，
 * 此时所有访客共用一个桶（项目既有 guard 的行为，非本路由引入）。
 * 生产部署应确保反向代理传 X-Forwarded-For 并开启 TRUST_PROXY。
 */
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;

/** 建议项的窄投影。刻意与 CatalogItem 用 Pick 绑定，字段一改两边同时报错。 */
type SuggestionItem = Pick<CatalogItem, "slug" | "name" | "nameZh" | "icon">;

type SuggestionResponse = {
  items: SuggestionItem[];
  total: number;
  /** true 表示严格匹配无结果、已放宽为 OR 语义（透传底层容错标记，前台可据此提示）。 */
  fuzzy: boolean;
  /**
   * 拼写纠正后的查询词。面板据此在结果上方标一行「已按 X 搜索」——
   * 悄悄把用户的输入换掉是不诚实的，尤其面板里一按回车就跳转，更容易让人以为搜的是原词。
   */
  corrected?: string;
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

/** limit 非法一律回落默认：只接受纯数字，避免 "6abc" 这类被 parseInt 悄悄当成 6。 */
function parseLimit(value: string | null): number {
  const raw = value ?? "";
  if (!/^\d+$/.test(raw)) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const ip = await getClientIp();
  if (!rateLimit(`suggest:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return json({ error: "请求过于频繁，请稍后再试" }, 429);
  }

  const params = request.nextUrl.searchParams;
  // 必须过 searchQueryParam：NFKC 归一、折叠空白、截断到 200，与页面搜索同口径。
  const query = searchQueryParam(params.get("q") ?? "");
  const limit = parseLimit(params.get("limit"));

  // 空查询不是错误：面板在输入框为空时会请求一次，这里如实回空数组即可。
  if (!query) return json({ items: [], total: 0, fuzzy: false } satisfies SuggestionResponse);

  const { items, total, fuzzy, corrected } = await searchCatalog(query, limit, 0);
  return json({
    items: items.map(({ slug, name, nameZh, icon }) => ({ slug, name, nameZh, icon })),
    total,
    fuzzy,
    ...(corrected ? { corrected } : {}),
  } satisfies SuggestionResponse);
}
