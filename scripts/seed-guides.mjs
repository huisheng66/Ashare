// 一次性脚本：把种子里的 guide 回填到运行库 catalog.json。
// 走与后台保存相同的收敛逻辑（normalizeGuide），并同步 sha256 旁车。
// 运行库已存在时种子不会自动更新，因此需要这一步才能在本地看到教程区块。
//
// 种子分两个文件：data/samples.ts（5 条）与 data/software.ts（30 条，
// 首次启动时经 seedToItem 灌入运行库）。两个源都要读 —— 只读 samples.ts
// 会漏掉 software.ts 里的 30 条教程。
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const { samples } = await import("../data/samples.ts");
const { software } = await import("../data/software.ts");
const { normalizeGuide } = await import("../lib/guide.ts");

/** slug → 种子条目。samples 与 software 无重叠 slug。 */
const seeds = new Map([...samples, ...software].map((s) => [s.slug, s]));

const file = path.join(process.cwd(), "data", "store", "catalog.json");
const catalog = JSON.parse(await fs.readFile(file, "utf8"));
let changed = 0;

const next = catalog.map((item) => {
  const source = seeds.get(item.slug);
  if (!source?.guide) return item;
  const guide = normalizeGuide(source.guide);
  if (!guide || JSON.stringify(item.guide) === JSON.stringify(guide)) return item;
  changed += 1;
  return { ...item, guide };
});

if (changed) {
  const text = JSON.stringify(next, null, 2);
  await fs.writeFile(file, text, "utf8");
  const digest = createHash("sha256").update(text).digest("hex");
  await fs.writeFile(file.replace(/\.json$/, "") + ".sha256.json", digest, "utf8");
}
console.log(`已回填 ${changed} 条教程，运行库共 ${next.length} 条。`);