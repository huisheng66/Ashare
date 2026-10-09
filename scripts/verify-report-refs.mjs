/**
 * 报告行号核对：每个引用不仅要在范围内，还要验证该行确实含预期关键词。
 * 用法：node _verify-refs.mjs
 * 预期表写在 EXPECT 里；新增引用时一并补上。
 */
import { readFileSync, existsSync } from "node:fs";

const REPORT = "docs/优化改进报告.md";
const text = readFileSync(REPORT, "utf8");

/** 报告里出现的引用 → 该行必须命中的关键词（任一命中即可） */
const EXPECT = {
  "lib/hotlink.ts:48": ["hostMatches"],
  "lib/hotlink.ts:89": ["NEXT_PUBLIC_SITE_URL"],
  "lib/hotlink.ts:119": ["requestHost"],
  "lib/hotlink.ts:77": ["same-site"],
  "lib/hotlink.ts:71": ["options.disabled"],
  "lib/hotlink.ts:74": ['reason: "no-referrer"'],
  "lib/hotlink.ts:77": ['reason: "same-site"'],
  "lib/hotlink.ts:81": ["hostMatches(host, allowed)"],
  "lib/hotlink.ts:134": ["hotlinkBlockedResponse"],
  "lib/hotlink.ts:136": ["status: 403"],
  "lib/hotlink.ts:139": ["no-store"],
  "lib/hotlink.ts:140": ["X-Robots-Tag"],
  "lib/hotlink.ts:141": ["Cross-Origin-Resource-Policy"],
  "lib/links.ts:48": ["CHANNEL_SPECS"],
  "lib/links.ts:67": ["linkChannels"],
  "lib/links.ts:90": ["primaryChannel"],
  "lib/links.ts:104": ["isVerifiedMirror"],
  "lib/links.ts:103": ["镜像必须附说明"],
  "lib/semantics.ts:16": ["SOURCE_KIND_MATRIX"],
  "lib/semantics.ts:61": ["validateSemantics"],
  "lib/derive.ts:17": ["iconCandidates"],
  "lib/derive.ts:24": ["optimize: false"],
  "lib/derive.ts:42": ["primaryScene"],
  "lib/click-store.ts:11": ["不存 IP"],
  "lib/click-store.ts:99": ["MAX_SCAN_BYTES"],
  "lib/click-store.ts:100": ["MAX_SCAN_LINES"],
  "lib/click-store.ts:41": ["flushToDisk"],
  "lib/click-store.ts:153": ["scanClicks"],
  "lib/click-store.ts:157": ["firstPartial"],
  "lib/click-analytics.ts:2": ["ChannelId"],
  "lib/click-analytics.ts:68": ["itemClickRows"],
  "lib/click-analytics.ts:133": ["dailySeries"],
  "lib/stale.ts:24": ["isRealDate"],
  "lib/stale.ts:93": ['reason: "never"'],
  "lib/store-json.ts:30": ["seedCatalog"],
  "lib/seed.ts:19": ["rest"],
  "data/types.ts:115": ["license"],
  "data/types.ts:86": ["export type Software"],
  "next.config.ts:28": ["Cross-Origin-Resource-Policy"],
  "next.config.ts:30": ["X-Robots-Tag"],
  "scripts/_shared.mjs:169": ["githubApiOf"],
  "scripts/seed-drift.mjs:23": ["COMPARE"],
  "scripts/stale-links.mjs:57": ["联动"],
  "scripts/stale-links.mjs:59": ["checkAll"],
  "scripts/stale-links.mjs:65": ["必须配合"],
  "scripts/stale-links.mjs:87": ["catalogFromSeed"],
  "scripts/stale-links.mjs:88": ["seedToItem"],
  "scripts/stale-links.mjs:251": ["every((r) => r.ok)"],
  "app/media/[...path]/route.ts:18": ["export async function GET"],
  "app/media/[...path]/route.ts:27": ["decideHotlink"],
  "app/media/[...path]/route.ts:25": ["hotlinkOptionsFromEnv"],
  "app/media/[...path]/route.ts:36": ["immutable"],
  "app/icons/[slug]/route.ts:14": ["export async function GET"],
  "app/admin/actions.ts:178": ["license"],
  "app/admin/actions.ts:206": ["semantic.length"],
  "app/admin/actions.ts:182": ["tutorial: checked"],
  "app/admin/items/[id]/page.tsx:337": ["<Field"],
  "app/admin/items/[id]/page.tsx:338": ["教程正文"],
  "app/admin/clicks/page.tsx:133": ["已跳过"],
  "components/ItemLinks.tsx:21": ["isVerifiedMirror"],
  "tests/hotlink.test.mjs:25": ["lookalike"],
  "tests/data-model.test.mjs:21": ["mirror is never"],
  "tests/data-model.test.mjs:31": ["unverifiable mirror"],
  "tests/click-analytics.test.mjs:11": ["whitelist matches"],
  "tests/click-analytics.test.mjs:49": ["shares are computed"],
  "tests/click-analytics.test.mjs:121": ["fills gaps"],
  "tests/stale.test.mjs:32": ["malformed date"],
  "tests/stale.test.mjs:137": ["seedToItem"],
};

let bad = 0;
for (const [ref, keywords] of Object.entries(EXPECT)) {
  const idx = ref.lastIndexOf(":");
  const file = ref.slice(0, idx);
  const line = Number(ref.slice(idx + 1));
  if (!existsSync(file)) {
    console.log(`✗ ${ref}  文件不存在`);
    bad += 1;
    continue;
  }
  const lines = readFileSync(file, "utf8").split("\n");
  if (line > lines.length) {
    console.log(`✗ ${ref}  超出 ${lines.length} 行`);
    bad += 1;
    continue;
  }
  const content = lines[line - 1] ?? "";
  if (!keywords.some((k) => content.includes(k))) {
    console.log(`✗ ${ref}  该行不含预期内容 → 实际：${content.trim().slice(0, 70)}`);
    bad += 1;
  }
}

// 反向：报告里出现的引用是否都在 EXPECT 里（防止新增引用漏验）
const pattern = /`([A-Za-z0-9_./[\]-]+\.(?:ts|tsx|mjs|yml|json)):(\d+)(?:-\d+)?`/g;
const declared = new Set(Object.keys(EXPECT));
for (const match of text.matchAll(pattern)) {
  const file = match[1];
  if (!file.includes("/")) continue; // 短引用（ItemLinks.tsx）已在 EXPECT 里
  if (!declared.has(`${file}:${match[2]}`) && !declared.has(`${file}:${match[2].split("-")[0]}`)) {
    // 范围引用（如 67-84）只核对起点
    if (![...declared].some((d) => d.startsWith(`${file}:${match[2]}`))) {
      console.log(`⚠ ${file}:${match[2]}  未纳入 EXPECT（可能漏验）`);
    }
  }
}

console.log(`\n核对 ${Object.keys(EXPECT).length} 条引用，问题 ${bad} 条`);
process.exitCode = bad ? 1 : 0;
