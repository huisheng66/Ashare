// 详情页渲染冒烟：抓页面 HTML，检查正文分段、链接、徽章与分类是否如实呈现。
// 用法：node scripts/smoke-detail.mjs [--base http://127.0.0.1:3000] [slug ...]
import process from "node:process";

import { readCatalog } from "./_shared.mjs";
const BASE = "http://127.0.0.1:3000";

const args = process.argv.slice(2);
const slugs = args.filter((a) => !a.startsWith("--"));
const base = args.find((a) => a.startsWith("--base="))?.slice(7) ?? BASE;

const catalog = await readCatalog();
const targets = slugs.length ? slugs : catalog.map((i) => i.slug);

const strip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
const norm = (text) => text.replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

let failed = 0;
for (const slug of targets) {
  const item = catalog.find((i) => i.slug === slug);
  if (!item) {
    console.log(`跳过 ${slug}：不在目录中`);
    continue;
  }
  const response = await fetch(`${base}/software/${slug}`, { redirect: "follow" });
  const html = await response.text();
  const text = norm(strip(html));
  const problems = [];

  if (response.status !== 200) problems.push(`HTTP ${response.status}`);
  if (item.body?.trim()) {
    const paragraphs = item.body.split(/\n+/).filter((p) => p.trim());
    for (const [index, paragraph] of paragraphs.entries()) {
      const probe = paragraph.slice(0, 12);
      if (!text.includes(probe)) problems.push(`正文第 ${index + 1} 段未渲染（${probe}…）`);
    }
    if (/\*\*|^#{1,6}\s/m.test(item.body)) problems.push("正文含 Markdown，会原样显示");
  }
  if (item.links?.official && !html.includes(item.links.official)) problems.push("官网链接未出现");
  if (item.links?.github && !html.includes(item.links.github)) problems.push("Git 链接未出现");
  if (item.price && !text.includes(item.price)) problems.push(`价格「${item.price}」未展示`);
  // 徽章按 CSS 类判断，不要全文搜「开源」——页脚与「同类替代」里都有这个词，会误报。
  const badge = { official: "text-official", opensource: "text-opensource", discount: "text-discount" };
  const expected = badge[item.source];
  if (!html.includes(expected)) problems.push(`未渲染 ${item.source} 徽章（${expected}）`);
  for (const [kind, className] of Object.entries(badge)) {
    if (kind !== item.source && html.includes(`${className}/10`)) problems.push(`出现了不该有的 ${kind} 徽章`);
  }

  if (problems.length) {
    failed += 1;
    console.log(`异常 ${slug.padEnd(20)} ${problems.join("；")}`);
  } else {
    console.log(`正常 ${slug.padEnd(20)} 正文分段、链接、徽章均符合预期`);
  }
}

console.log(`\n合计 ${targets.length} 个详情页，异常 ${failed} 个。`);
if (failed) process.exitCode = 1;
