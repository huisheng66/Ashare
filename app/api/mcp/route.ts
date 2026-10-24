import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getClientIp, rateLimit } from "@/lib/guard";
import { handleRpcPayload, wantsEventStream } from "@/lib/mcp-protocol";
import { createToolInvoker } from "@/lib/mcp-tools";
import { absoluteSiteUrl } from "@/lib/site";

/**
 * MCP 服务端（Streamable HTTP）：`POST /api/mcp`。
 *
 * 目标是**任何支持 Streamable HTTP 的客户端都能接**，不是只伺候某一家：
 *   - 响应默认 `application/json`；客户端只接受 SSE 时回 `text/event-stream`（单条 message 事件）；
 *   - 支持 2025-03-26 及更早客户端会发的**批量请求**（2025-06-18 才取消）；
 *   - 无状态，不下发 `Mcp-Session-Id`；客户端若带着它来，忽略即可（我们本来就不靠会话）；
 *   - `MCP-Protocol-Version` 请求头不参与判定 —— 版本以 initialize 的协商结果为准。
 *
 * 为什么不做 GET 的 SSE 长连接：工具都是一问一答的只读查询，没有服务端推送需求；
 * 站点是自托管 Node + 反向代理，长连接会被代理缓冲与超时折腾。按规范，
 * 不支持 SSE 服务端推送时对 GET 返回 405 即可，客户端会自动只用 POST。
 *
 * 无鉴权、公开可读。三条防线：
 *   - 限流 60 次/分钟/IP —— 一次 search 大约 7 次库查询，不设限就是免费擦库通道；
 *   - 只读，没有任何写接口暴露在这里；
 *   - 正文与链接照实返回，但不返回后台字段（草稿、审计、点击数据一概不碰）。
 */

export const dynamic = "force-dynamic";

/** 每分钟每 IP 的请求上限。MCP 客户端通常是「一轮对话几次调用」，60 足够。 */
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

const CORS = {
  // 只读公开数据，允许任意来源；不带凭据，所以不需要 Access-Control-Allow-Credentials。
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  /**
   * 把各家客户端会发的头都列上：漏一个就会在浏览器型客户端里表现为
   * 「预检通过但真正请求被拦」，而报错是浏览器给的，看不出是 CORS 头不全。
   * Authorization 一并放行 —— 本端点不需要凭据，但有的客户端会无条件带上。
   */
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

function baseHeaders(): Record<string, string> {
  return {
    ...CORS,
    // 工具结果随时会随目录更新变化，别让中间层缓存住。
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
  };
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: baseHeaders() });
}

/** 单条 SSE 消息：发完就关，客户端读到流结束即完成。 */
function sse(body: unknown) {
  return new NextResponse("event: message\ndata: " + JSON.stringify(body) + "\n\n", {
    status: 200,
    headers: { ...baseHeaders(), "Content-Type": "text/event-stream; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const ip = await getClientIp();
  if (!rateLimit("mcp:" + ip, RATE_LIMIT, RATE_WINDOW_MS)) {
    return json(
      { jsonrpc: "2.0", id: null, error: { code: -32000, message: "请求过于频繁，请稍后再试（每分钟 60 次）" } },
      429,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "请求体不是合法 JSON" } }, 400);
  }

  // 站点地址优先取配置的正式域名（分享出去的链接不该带请求头里的 host）；
  // 没配 NEXT_PUBLIC_SITE_URL 时退回归一化后的请求来源，本地开发也能拿到可用链接。
  const base = absoluteSiteUrl("/") ?? request.nextUrl.origin;
  const outcome = await handleRpcPayload(payload, createToolInvoker(base));

  if (outcome.body === null) {
    // 通知类报文：202 + 空体，不能回 200 + 空对象（会被当成对某条请求的响应）。
    return new NextResponse(null, { status: 202, headers: baseHeaders() });
  }
  if (wantsEventStream(request.headers.get("accept"))) return sse(outcome.body);
  return json(outcome.body, outcome.status);
}

/**
 * 不提供服务端推送的 SSE 流，按规范明确拒绝 GET，让客户端知道只用 POST。
 * 405 而不是 404：路径存在，只是不支持这个方法。
 */
export function GET() {
  return new NextResponse(
    JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "本端点只接受 POST（不提供服务端推送流）" } }),
    {
      status: 405,
      headers: { ...baseHeaders(), Allow: "POST, OPTIONS", "Content-Type": "application/json" },
    },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: baseHeaders() });
}
