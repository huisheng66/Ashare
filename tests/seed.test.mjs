import assert from "node:assert/strict";
import test from "node:test";

import { software as seed } from "../data/software.ts";
import { SEED_DRIFT_FIELDS, SEED_SYNC_FIELDS, seedToItem } from "../lib/seed.ts";
import { formatSha256, isValidSha256, isVerifiedMirror, linkChannels, mirrorChecksum, primaryChannel } from "../lib/links.ts";
import { describeSourceKind, isValidSourceKind } from "../lib/semantics.ts";

const baseSeed = {
  slug: "x-tool",
  name: "X Tool",
  aliases: [],
  summary: "s",
  scenes: ["code"],
  platforms: ["windows"],
  source: "official",
  officialUrl: "https://example.com/",
  officialLabel: "example.com",
  whoFor: "a",
  whoNot: "b",
  installTips: ["t1"],
  alternatives: [],
  icon: { letter: "X", color: "#111111" },
};

test("seedToItem 缺省行为与历史一致：空正文空标签，links 取 officialUrl", () => {
  const item = seedToItem({ ...baseSeed });
  assert.equal(item.body, "");
  assert.deepEqual(item.tags, []);
  assert.deepEqual(item.links, { official: "https://example.com/" });
  assert.equal(item.kind, "app");
  assert.equal(item.status, "published");
  assert.deepEqual(item.tutorial, ["t1"]);
});

test("seedToItem 透传种子自带的 body / tags / kind / links", () => {
  const item = seedToItem({
    ...baseSeed,
    tags: ["a", "b"],
    body: "第一段。\n第二段。",
    kind: "script",
    links: { official: "https://example.com/", github: "https://github.com/a/b" },
  });
  assert.deepEqual(item.tags, ["a", "b"]);
  assert.equal(item.body, "第一段。\n第二段。");
  assert.equal(item.kind, "script");
  assert.deepEqual(item.links, { official: "https://example.com/", github: "https://github.com/a/b" });
});

test("source 为 opensource 时 kind 默认推导为 opensource，显式 kind 优先", () => {
  assert.equal(seedToItem({ ...baseSeed, source: "opensource" }).kind, "opensource");
  assert.equal(seedToItem({ ...baseSeed, source: "opensource", kind: "app" }).kind, "app");
});

test("种子里写了正文的条目，全新部署后仍然带正文（不再被 seedToItem 清空）", () => {
  const withBody = seed.filter((entry) => typeof entry.body === "string" && entry.body.length > 0);
  assert.ok(withBody.length > 0, "至少应有一条种子带正文");
  const built = seed.map(seedToItem);
  for (const entry of withBody) {
    const item = built.find((candidate) => candidate.slug === entry.slug);
    assert.ok(item, `${entry.slug} 应出现在种子目录里`);
    assert.equal(item.body, entry.body, `${entry.slug} 的正文在灌库时被丢了`);
    assert.deepEqual(item.tags, entry.tags, `${entry.slug} 的标签在灌库时被丢了`);
  }
});

test("显式写了 kind 的种子，其 source/kind 组合必须在语义矩阵内", () => {
  // 早先的版本断言「source=opensource 就必须是 kind=opensource」，
  // 那条约束过严：opensource + app 是 lib/semantics.ts 里明确允许的组合
  // （「开源但以应用形态分发的工具」），也是覆盖 inferKind推导值的正规手段。
  //
  // n8n 就是这个用法：它是 fair-code，不是 OSI 开源，却因源码公开
  // 而标了 source=opensource；若不加显式 kind，就会被推成 kind=opensource、
  // 前台挂出「开源」徽章，与正文「n8n 不是 OSI 意义上的开源软件」矛盾。
  //
  // 真正该守的是**组合合法**，而不是某个字段的固定搭配 ——
  // 合法性由 validateSemantics() 判定，不在这里重写一遍矩阵。
  for (const entry of seed) {
    if (!entry.kind) continue;
    assert.ok(
      isValidSourceKind(entry.source, entry.kind),
      `${entry.slug} 的 source=${entry.source} + kind=${entry.kind} 不是合法组合` +
        `（${describeSourceKind(entry.source, entry.kind)}）`,
    );
  }
});

test("种子条目的正文若非空，至少两段且不含 Markdown 标题", () => {
  for (const entry of seed) {
    if (!entry.body) continue;
    const paragraphs = entry.body.split("\n").filter((p) => p.trim().length > 0);
    assert.ok(paragraphs.length >= 2, `${entry.slug} 的正文只有 ${paragraphs.length} 段`);
    assert.ok(!entry.body.includes("##"), `${entry.slug} 的正文不应含 Markdown 标题`);
  }
});

test("种子里的许可证与核验日期格式合法", async () => {
  // SPDX 标识的常见形态；核验不到时应当整字段留空，而不是填「未知」之类占位。
  // 表达式（A OR B、A WITH B）交给 describeLicense 判定，不自己写正则 ——
  // 自写的那版漏掉了 OR，LibreOffice 的双许可被误判为非法。
  const { describeLicense } = await import("../lib/license-info.ts");
  for (const entry of seed) {
    if (entry.license !== undefined) {
      assert.ok(entry.license, `${entry.slug} 的 license 不应为空字符串`);
      // 单个标识必须能被认出来；双许可允许无法推断（AND/WITH），
      // 但至少不能是空白或明显不是标识的东西。
      const looksLikeSpdx = /^[A-Za-z0-9.+-]+(\s+(OR|AND|WITH)\s+[A-Za-z0-9.+-]+)*$/.test(entry.license);
      assert.ok(
        looksLikeSpdx,
        `${entry.slug} 的 license「${entry.license}」不像 SPDX 标识`,
      );
      // 凡是单个（非表达式）标识，都必须有对应的展示文案，否则前台会静默不显示。
      if (!/\s+(OR|AND|WITH)\s+/.test(entry.license)) {
        assert.ok(describeLicense(entry.license), `${entry.slug} 的 license「${entry.license}」缺少展示文案`);
      }
    }
    if (entry.linksCheckedAt !== undefined) {
      assert.match(entry.linksCheckedAt, /^\d{4}-\d{2}-\d{2}$/, `${entry.slug} 的 linksCheckedAt 应为 YYYY-MM-DD`);
    }
    if (entry.version !== undefined) {
      assert.ok(entry.version.trim(), `${entry.slug} 的 version 不应为空字符串`);
    }
  }
});

test("漂移检测的字段清单覆盖全部可透传字段", async () => {
  // 背景：加 linksCheckedAt 时只把它加进了类型与种子，忘了加进 seed-drift 的
  // COMPARE 清单，于是运行库 35 条都有值、种子全空，脚本却报「0 不一致」。
  // **漂移检测的失明是静默的，不会报错** —— 只能靠这类测试兜住。
  //
  // 清单本身已不再手写（guide 就是漏在旧的手写清单里的），改由 lib/seed.ts 的登记表提供。
  // 这条测试保证脚本真的取了登记表，而不是又悄悄写回一份。
  const { readFile } = await import("node:fs/promises");
  const script = await readFile(new URL("../scripts/seed-drift.mjs", import.meta.url), "utf8");
  assert.match(script, /const COMPARE = SEED_DRIFT_FIELDS/, "seed-drift 必须从登记表取比对字段");
  for (const field of ["license", "version", "linksCheckedAt", "guide"]) {
    assert.ok(SEED_DRIFT_FIELDS.includes(field), `漂移比对漏了 ${field}，该字段的漂移将无法被发现`);
  }
});

test("seed-sync 的同步字段覆盖漂移检测的全部字段", async () => {
  // 背景：seed-sync 早期只同步 guide，于是改了 body / summary 会被静默忽略——
  // 运行库留旧值，seed:drift 报出不一致，而 seed-sync 又说「已是最新」，
  // 两个脚本互相甩锅，只能靠人肉比对 JSON 才发现。
  //
  // 锁住不变量：**漂移能查出来的，同步就必须能修。**
  const { readFile } = await import("node:fs/promises");
  const sync = await readFile(new URL("../scripts/seed-sync.mjs", import.meta.url), "utf8");
  assert.match(sync, /const SYNCED_FIELDS = SEED_SYNC_FIELDS/, "seed-sync 必须从登记表取同步字段");
  for (const field of SEED_SYNC_FIELDS) {
    assert.ok(SEED_DRIFT_FIELDS.includes(field), `同步会写 ${field}，漂移检查却看不见它`);
  }
});

test("镜像必须附说明，且永不作主 CTA", () => {
  // 这条断言是在 disk 槽位真正投入使用之后才补上的。
  // 此前 50 条种子没有一条填 disk，lib/links.ts 的镜像规则只被
  // tests/data-model.test.mjs 用构造出来的假数据测过——
  // 也就是说，「真实条目里的镜像是否合规」从来没被检查过。
  //
  // 风险在于镜像链接是唯一一种「填错了会误导读者去下载不明文件」的字段：
  // 官网链接填错只是打不开，镜像链接填错可能拿到被篡改的安装包。
  // 所以规则要在真实数据上守着，不能只在单元测试的假数据里守着。
  for (const entry of seed) {
    const links = entry.links;
    if (!links?.disk) continue;

    // 1. 必须有说明。后台 actions.ts 有同样的硬校验，
    //    这里是种子层的防线——后台只拦运行库，拦不住种子。
    const mirror = linkChannels(links).find((c) => c.role === "mirror");
    assert.ok(mirror, `${entry.slug}:填了 disk 却没被识别为镜像渠道`);
    assert.ok(
      isVerifiedMirror(mirror),
      `${entry.slug}:镜像必须写diskNote（来源与校验方式），否则按不可信处理、不予展示`,
    );

    // 2. 镜像不得作主 CTA。primaryChannel() 本来就不会选镜像，
    //    但那条只保证「有官网时用官网」；这条额外保证
    //    「就算镜像被写成唯一渠道，也不会有任何人把它当主要入口推荐」。
    assert.notEqual(
      primaryChannel(links)?.role,
      "mirror",
      `${entry.slug}:镜像不得作为主 CTA`,
    );

    // 3. 必须同时有官网或GitHub。后台的 hint 也这么要求：
    //    只有一个镜像链接的条目，读者无从判断镜像是否值得信。
    assert.ok(
      links.official || links.homepage || links.github,
      `${entry.slug}:填了 disk 却没有官网或仓库，读者无从交叉核验`,
    );
  }
});

test("校验值必须是完整、格式正确、且绑定具体文件", () => {
  // 校验值是给读者「照着跑一遍」用的，坏掉的校验比没有校验更糟：
  // 读者按错误的哈希核对必然失败，而失败原因不明显，
  // 最后要么被误当成「文件有问题」，要么干脆不再信任页面上的所有校验提示。
  //
  // 为什么坚持「哈希与文件名成对」：磁盘槽位填的往往是 LatestRelease/
  // 这类随上游发版浮动的目录，哈希只在具体某个版本上成立。
  // 只写哈希不写文件，读者不知道该比对哪个包；只写文件不给哈希，
  // 读者会以为有校验而跳过核对 —— 后者比明确写「未提供校验」危险得多。
  for (const entry of seed) {
    const links = entry.links;
    const sha = links?.diskSha256?.trim();
    const file = links?.diskFile?.trim();

    if (sha) {
      assert.ok(
        isValidSha256(sha),
        `${entry.slug}:SHA-256 必须是 64 位十六进制，实际长度 ${sha.length}`,
      );
    }
    if (sha || file) {
      assert.ok(
        sha && file,
        `${entry.slug}:校验值与对应文件名必须成对填写（sha256=${Boolean(sha)} file=${Boolean(file)}）`,
      );
      assert.ok(links?.disk, `${entry.slug}:填了校验值却没有镜像链接，等于挂了个无从核对的文件`);
    }

    // 解析函数必须与原始字段保持一致：合法数据一定能取出展示形态，
    // 不合法数据必须被解析成 undefined（而不是半截数据）。
    const parsed = mirrorChecksum(links ?? {});
    if (!sha && !file) {
      assert.equal(parsed, undefined, `${entry.slug}:没有校验字段时不应解析出校验信息`);
    } else {
      assert.ok(parsed, `${entry.slug}:合法的校验字段却解析不出展示信息`);
      assert.equal(parsed.sha256, sha.toLowerCase(), `${entry.slug}:解析出的哈希应与存储值一致（大小写归一后）`);
      assert.ok(parsed.command.includes(file), `${entry.slug}:校验命令里应带上文件名，否则读者不知道跑什么`);
    }
  }
});

test("半截校验信息不得渲染（宁可显示未提供）", ()=> {
  // 这几条是上面那条规则的反面：数据漏填一半时，
  // 前台必须表现为「没有校验」，而不是渲染出一个残缺的校验块。
  // 分开写是因为这是渲染侧的独立承诺，混在一起会被前面的断言覆盖不到。
  for (const bad of [
    { disk: "https://m.example/", diskNote: "n", diskSha256: "a".repeat(64) },
    { disk: "https://m.example/", diskNote: "n", diskFile: "x.exe" },
    { disk: "https://m.example/", diskNote: "n", diskSha256: "not-a-hash", diskFile: "x.exe" },
    { disk: "https://m.example/", diskNote: "n", diskSha256: "a".repeat(63), diskFile: "x.exe" },
    { disk: "https://m.example/", diskNote: "n", diskSha256: "a".repeat(65), diskFile: "x.exe" },
  ]) {
    assert.equal(
      mirrorChecksum(bad),
      undefined,
      `残缺或非法的校验信息不应被解析：${JSON.stringify(bad)}`,
    );
  }
});

test("哈希分组只影响展示，不影响比对值", ()=> {
  // formatSha256 给的是给人逐位核对的分组形式，
  // 页面拿它做展示时绝不能顺手把带空格的值当成比对依据。
  const raw = "845f7101d33faf257a82a0cadc5f4f3804441f46ee493eb32b92fcf9c7147a24";
  assert.equal(formatSha256(raw).replace(/\s/g, ""), raw);
  assert.equal(formatSha256(raw.toUpperCase()), formatSha256(raw), "大写小写应归一后分组一致");
  assert.equal(formatSha256("  " + raw + "  ").replace(/\s/g, ""), raw, "首尾空白不应影响结果");
});
