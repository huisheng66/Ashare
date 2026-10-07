import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  decideHotlink,
  hotlinkBlockedResponse,
  hotlinkOptionsFromEnv,
  requestHost,
} from "@/lib/hotlink";
import { SLUG_PATTERN } from "@/lib/input-validation";

const ICON_DIR = path.join(process.cwd(), "data", "icons");

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) return new Response(null, { status: 404 });
  // 配置了 NEXT_PUBLIC_SITE_URL 就以它为准；没配则用请求自身的 host 兜底，
  // 否则本地开发时同站 Referer 也会被拒（siteHost 为空时同站判断无从下手）。
  const options = hotlinkOptionsFromEnv();
  if (!options.siteHost) options.siteHost = requestHost(request);
  if (!decideHotlink(request.headers.get("referer"), options).allowed) {
    return hotlinkBlockedResponse();
  }
  try {
    const svg = await readFile(path.join(ICON_DIR, `${slug}.svg`));
    const etag = `"${createHash("sha256").update(svg).digest("base64url")}"`;
    const headers = {
      "Content-Type": "image/svg+xml",
      // Icon URLs are stable across deployments; revalidate instead of caching forever.
      "Cache-Control": "public, max-age=86400, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "Cross-Origin-Resource-Policy": "same-origin",
      ETag: etag,
    };
    if (request.headers.get("if-none-match")?.split(",").some((tag) => tag.trim().replace(/^W\//, "") === etag || tag.trim() === "*")) {
      return new Response(null, { status: 304, headers });
    }
    return new Response(new Uint8Array(svg), { headers });
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) return new Response(null, { status: 404 });
    console.error("[icons] Failed to read icon", error);
    return new Response(null, { status: 500 });
  }
}
