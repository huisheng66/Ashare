import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getClientIp, rateLimit } from "@/lib/guard";
import { handleRpcMessage } from "@/lib/mcp-protocol";
import { createToolInvoker } from "@/lib/mcp-tools";
import { absoluteSiteUrl } from "@/lib/site";

/**
 * MCP 服务端（Streamable HTTP 的最小子集）：`POST /api/mcp`。
 *
 * 给用户自己的 agent 用 —— Claude Code、Cursor、WorkBuddy 这类客户端加上一条
 * `http://<站点>/api/mcp` 就能搜这个目录、读条目详情。工具的语义在 lib/mcp-tools.ts。
 *
 * 为什么不开 GET 的 SSE 长连接：工具都是一问一答的只读查询，没有服务端推送需求；
 * 而站点是自托管 Node + 反向代理，长连接会被代理缓冲与超时折腾。按规范，
 * 不支持 SSE 的服务端对 GET 返回 405 即可，客户端会自动只用 POST。
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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, MCP-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...CORS,
      // 工具结果随时会随目录更新变化，别让中间层缓存住。
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
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
  const outcome = await handleRpcMessage(payload, createToolInvoker(base));

  if (outcome.body === null) {
    // 通知类报文：202 + 空体，不能回 200 + 空对象（会被当成对某条请求的响应）。
    return new NextResponse(null, { status: 202, headers: { ...CORS, "X-Robots-Tag": "noindex" } });
  }
  return json(outcome.body, outcome.status);
}

/** 不提供 SSE 流，按规范明确拒绝 GET，让客户端知道只用 POST。 */
export function GET() {
  return new NextResponse(
    JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "本端点只接受 POST（不提供 SSE 流）" } }),
    {
      status: 405,
      headers: { ...CORS, Allow: "POST, OPTIONS", "Content-Type": "application/json", "X-Robots-Tag": "noindex" },
    },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
