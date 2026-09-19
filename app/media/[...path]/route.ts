import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { mediaParts } from "@/lib/input-validation";

const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

/** Uploaded files added after build are served here because next start does not discover them in public/. */
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  if (!mediaParts(`/media/${parts.join("/")}`)) return new Response(null, { status: 404 });
  try {
    const data = await readFile(path.join(process.cwd(), "public", "media", ...parts));
    const etag = `"${createHash("sha256").update(data).digest("base64url")}"`;
    const headers = {
      "Content-Type": TYPES[parts[1].split(".").pop()!],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
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
