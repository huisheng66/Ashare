import assert from "node:assert/strict";
import test from "node:test";
import { describeLicense } from "../lib/license-info.ts";

test("permissive licenses allow closed-source commercial use", () => {
  for (const spdx of ["MIT", "BSD-3-Clause", "Apache-2.0", "PSF-2.0", "Unlicense"]) {
    const info = describeLicense(spdx);
    assert.ok(info, `${spdx} 应有说明`);
    assert.equal(info.tier, "permissive", `${spdx} 应为宽松`);
    assert.equal(info.allowsClosedSource, true, `${spdx} 应允许闭源`);
    assert.match(info.summary, /允许商用|公有领域/);
  }
});

test("strong copyleft blocks closed-source distribution", () => {
  for (const spdx of ["GPL-2.0-only", "GPL-3.0-only", "GPL-3.0-or-later", "AGPL-3.0-or-later"]) {
    const info = describeLicense(spdx);
    assert.ok(info, `${spdx} 应有说明`);
    assert.equal(info.allowsClosedSource, false, `${spdx} 不应允许闭源分发`);
    assert.equal(info.tier, "strong-copyleft");
  }
});

test("AGPL is called out separately because plain usage is fine", () => {
  // AGPL 的特别之处：不是「用了就犯规」，而是「让用户通过网络访问」就触发开源义务。
  // 提示语必须区分这两种情况，否则读者会以为下载来用也有问题。
  const agpl = describeLicense("AGPL-3.0-or-later");
  const gpl = describeLicense("GPL-3.0-only");
  assert.match(agpl.summary, /联网服务/);
  assert.doesNotMatch(gpl.summary, /联网服务/);
});

test("weak copyleft distinguishes changed files from the whole work", () => {
  const lgpl = describeLicense("LGPL-2.1");
  assert.equal(lgpl.tier, "weak-copyleft");
  // LGPL 动态链接不传染整体，与 GPL 的关键差别不能混为一谈。
  assert.match(lgpl.summary, /改动需开源/);
  const mpl = describeLicense("MPL-2.0");
  assert.match(mpl.summary, /改动的文件需开源/);
});

test("a bare GPL gets a hedge because it does not state which versions are allowed", () => {
  // SPDX 允许写 GPL-3.0，但那只说明「是 GPL-3」，不表态能否用 GPL-4。
  // 条目里确实存在这种写法（早期回填的），提示语不能替它做决定。
  const info = describeLicense("GPL-3.0");
  assert.ok(info);
  assert.equal(info.allowsClosedSource, false);
  assert.match(info.summary, /版本选择看原文/);
});

test("only and or-later are distinguished in the returned spdx", () => {
  // 提示语相同，但 spdx 原样返回 —— 前端要能逐字显示，不被归一化掉。
  assert.equal(describeLicense("GPL-2.0-only").spdx, "GPL-2.0-only");
  assert.equal(describeLicense("GPL-2.0-or-later").spdx, "GPL-2.0-or-later");
  assert.notEqual(describeLicense("GPL-2.0-only").spdx, describeLicense("GPL-2.0-or-later").spdx);
});

test("unknown and missing identifiers yield undefined rather than a guess", () => {
  // 宁可页面不显示，也不要给一个可能错误的判断。
  for (const bad of [undefined, "", "   ", "Proprietary", "Custom", "GPL-9.9", "MIT-like"]) {
    assert.equal(describeLicense(bad), undefined, `${JSON.stringify(bad)} 应返回 undefined`);
  }
});

test("whitespace around the identifier is tolerated", () => {
  assert.equal(describeLicense("  MIT  ")?.spdx, "MIT");
});

test("every license recorded in the catalog has a human-readable summary", async () => {
  // 防止以后新增条目时页面静默不显示：映射表漏一个键，LicenseNote 就返回 null，
  // 而数据侧一切正常 —— 这类失配只有靠交叉核对才发现。
  const { readFile } = await import("node:fs/promises");
  const catalog = JSON.parse(await readFile(new URL("../data/store/catalog.json", import.meta.url), "utf8"));

  const missing = [];
  const seen = new Set();
  for (const item of catalog) {
    if (!item.license) continue;
    seen.add(item.license);
    if (!describeLicense(item.license)) missing.push(`${item.slug} → ${item.license}`);
  }

  assert.deepEqual(missing, [], `这些许可证没有对应说明，前台不会显示：\n  ${missing.join("\n  ")}`);
  assert.ok(seen.size >= 8, `实际用到的许可证种类应 ≥8，实际 ${seen.size}：${[...seen].join(" ")}`);
});

test("dual licensing takes the more permissive of the two options", () => {
  // LibreOffice 是 MPLv2 OR LGPLv3+ —— 两条都属弱 copyleft，整体可闭源。
  // 读者关心的是「能不能闭源」，因此取两者中更宽松的那个。
  const info = describeLicense("MPL-2.0 OR LGPL-3.0-or-later");
  assert.ok(info, "双许可应能解析");
  assert.equal(info.spdx, "MPL-2.0 OR LGPL-3.0-or-later", "spdx 应原样返回供逐字显示");
  assert.equal(info.allowsClosedSource, true);
  assert.match(info.summary, /或选其一/);
  assert.match(info.summary, /MPL-2\.0/);
  assert.match(info.summary, /LGPL-3\.0-or-later/);
});

test("dual licensing where one option is strict still reports closed source as possible", () => {
  // MIT OR GPL-3.0-only：可以选 MIT，所以答案是允许闭源。
  const info = describeLicense("MIT OR GPL-3.0-only");
  assert.ok(info);
  assert.equal(info.allowsClosedSource, true);
});

test("AND and WITH expressions are not guessed at", () => {
  // AND（双许可同时适用）与 WITH（附加例外，例如字体嵌入到商业产品）都需要
  // 逐个读原文才能判断。一条通用提示语会给出错误的宽松/严格结论。
  assert.equal(describeLicense("GPL-2.0-only WITH Classpath-exception-2.0"), undefined);
  assert.equal(describeLicense("MIT AND GPL-3.0-only"), undefined);
});
