import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * 本地 Simple Icons：SVG 提交在 data/icons/<slug>.svg，运行时不再访问 CDN。
 * slug 字符白名单 + 固定目录，无路径穿越；缺文件返回 404，前端回退字母块。
 */
const ICON_DIR = path.join(process.cwd(), "data", "icons");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return new Response(null, { status: 404 });
  }
  try {
    const svg = await readFile(path.join(ICON_DIR, `${slug}.svg`));
    return new Response(new Uint8Array(svg), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
