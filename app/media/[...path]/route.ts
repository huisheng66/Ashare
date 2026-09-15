import { readFile } from "node:fs/promises";
import path from "node:path";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** 后台上传的预览图/图标。构建后新增的 public 文件不被 next start 服务，从这里读。 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  // 目录 = 条目 slug，文件 = 随机 hex 名 + 扩展名；精确匹配生成格式，杜绝路径穿越
  const [dir, file, ...rest] = parts;
  if (
    !dir ||
    !file ||
    rest.length ||
    !/^[a-z0-9-]+$/.test(dir) ||
    !/^[a-f0-9]+\.(jpe?g|png|webp|gif)$/.test(file)
  ) {
    return new Response(null, { status: 404 });
  }
  try {
    const data = await readFile(
      path.join(process.cwd(), "public", "media", ...parts),
    );
    const ext = (parts[parts.length - 1].split(".").pop() ?? "").toLowerCase();
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
