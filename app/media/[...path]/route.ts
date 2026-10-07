import { createHash } from "node:crypto";

import {
  decideHotlink,
  hotlinkBlockedResponse,
  hotlinkOptionsFromEnv,
  requestHost,
} from "@/lib/hotlink";
import { mediaParts } from "@/lib/input-validation";
import { getMedia } from "@/lib/media-storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

/**
 * 上传的图片由存储驱动提供（本地 data/media，或 MEDIA_DRIVER=s3 时的对象存储）。
 * 所以不能让 next start 去 public/ 里找 —— 上传发生在构建之后，而且多副本时本机根本没有那份文件。
 */
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const parsed = mediaParts(`/media/${parts.join("/")}`);
  if (!parsed) return new Response(null, { status: 404 });
  // 防盗链在读取之前判定：被拒绝的请求不消耗存储 IO，也不进 ETag 计算。
  // 配置了 NEXT_PUBLIC_SITE_URL 就以它为准；没配则用请求自身的 host 兜底，
  // 否则本地开发时同站 Referer 也会被拒（siteHost 为空时同站判断无从下手）。
  const options = hotlinkOptionsFromEnv();
  if (!options.siteHost) options.siteHost = requestHost(request);
  if (!decideHotlink(request.headers.get("referer"), options).allowed) {
    return hotlinkBlockedResponse();
  }
  try {
    const data = await getMedia(parsed.join("/"));
    if (!data) return new Response(null, { status: 404 });
    const etag = `"${createHash("sha256").update(data).digest("base64url")}"`;
    const headers = {
      "Content-Type": TYPES[parsed[1].split(".").pop()!],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // 防盗链依据 Referer，而 Referer 会被浏览器策略裁剪；CORP 补上浏览器侧的第二道拒绝。
      "Cross-Origin-Resource-Policy": "same-origin",
      ETag: etag,
    };
    if (request.headers.get("if-none-match")?.split(",").some((tag) => tag.trim().replace(/^W\//, "") === etag || tag.trim() === "*")) {
      return new Response(null, { status: 304, headers });
    }
    return new Response(new Uint8Array(data), { headers });
  } catch (error) {
    console.error("[media] Failed to read image", error);
    return new Response(null, { status: 500 });
  }
}
