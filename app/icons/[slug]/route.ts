import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SLUG_PATTERN } from "@/lib/input-validation";

const ICON_DIR = path.join(process.cwd(), "data", "icons");

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) return new Response(null, { status: 404 });
  try {
    const svg = await readFile(path.join(ICON_DIR, `${slug}.svg`));
    const etag = `"${createHash("sha256").update(svg).digest("base64url")}"`;
    const headers = {
      "Content-Type": "image/svg+xml",
      // Icon URLs are stable across deployments; revalidate instead of caching forever.
      "Cache-Control": "public, max-age=86400, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
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
