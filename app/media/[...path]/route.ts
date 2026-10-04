import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  decideHotlink,
  hotlinkBlockedResponse,
  hotlinkOptionsFromEnv,
  requestHost,
} from "@/lib/hotlink";
import { mediaParts } from "@/lib/input-validation";

const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

/** Uploaded files added after build are served here because next start does not discover them in public/. */
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  if (!mediaParts(`/media/${parts.join("/")}`)) return new Response(null, { status: 404 });
  // 防盗链在读盘之前判定：被拒绝的请求不消耗磁盘 IO，也不进 ETag 计算。
  // 配置了 NEXT_PUBLIC_SITE_URL 就以它为准；没配则用请求自身的 host 兜底，
  // 否则本地开发时同站 Referer 也会被拒（siteHost 为空时同站判断无从下手）。
  const options = hotlinkOptionsFromEnv();
  if (!options.siteHost) options.siteHost = requestHost(request);
  if (!decideHotlink(request.headers.get("referer"), options).allowed) {
    return hotlinkBlockedResponse();
  }
  try {
    const data = await readFile(path.join(process.cwd(), "public", "media", ...parts));
    const etag = `"${createHash("sha256").update(data).digest("base64url")}"`;
    const headers = {
      "Content-Type": TYPES[parts[1].split(".").pop()!],
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
    if (["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) return new Response(null, { status: 404 });
    console.error("[media] Failed to read image", error);
    return new Response(null, { status: 500 });
  }
}
