import assert from "node:assert/strict";
import test from "node:test";
import { bodyParagraphs, displayName, iconCandidates, primaryScene, resolveIcon } from "../lib/derive.ts";
import { describeSourceKind, inferKind, isValidSourceKind, needsRepoEvidence, resolveKind, validateSemantics } from "../lib/semantics.ts";
import { isChannelId, isVerifiedMirror, linkChannels, otherChannels, primaryChannel } from "../lib/links.ts";

const baseLinks = { official: "https://example.com", github: "https://github.com/a/b" };

test("link channels keep a fixed order and drop empty slots", () => {
  assert.deepEqual(linkChannels({}).map((c) => c.id), []);
  assert.deepEqual(linkChannels({ official: "  " }).map((c) => c.id), []);
  assert.deepEqual(
    linkChannels({ disk: "https://d.example", github: "https://github.com/a/b", official: "https://o.example", homepage: "https://h.example" }).map((c) => c.id),
    ["official", "homepage", "github", "disk"],
  );
  // 顺序必须与 CHANNEL_SPECS 一致：官网 → 主页 → GitHub → 镜像。
  assert.deepEqual(linkChannels({ disk: "https://d.example" }).map((c) => c.role), ["mirror"]);
  assert.equal(linkChannels({ official: "  https://o.example " })[0].url, "https://o.example");
});

test("the mirror is never the primary call to action", () => {
  assert.equal(primaryChannel({ official: "https://o.example", disk: "https://d.example" })?.id, "official");
  // 只有镜像时也不能选它 —— 主 CTA 必须是可核验的来源方。
  assert.equal(primaryChannel({ disk: "https://d.example" }), undefined);
  // 官网缺位时按 GitHub → 主页 顺延。
  assert.equal(primaryChannel({ github: "https://github.com/a/b", disk: "https://d.example" })?.id, "github");
  assert.equal(primaryChannel({ homepage: "https://h.example" })?.id, "homepage");
  assert.equal(primaryChannel({}), undefined);
});

test("an unverifiable mirror is treated as untrusted and hidden", () => {
  const [mirror] = linkChannels({ disk: "https://d.example" });
  assert.equal(isVerifiedMirror(mirror), false);
  assert.equal(isVerifiedMirror(linkChannels({ disk: "https://d.example", diskNote: "作者提供" })[0]), true);
  // 非镜像渠道不受说明缺失影响。
  assert.equal(isVerifiedMirror(linkChannels({ official: "https://o.example" })[0]), true);
  // 空白说明等同于没有说明。
  assert.equal(isVerifiedMirror(linkChannels({ disk: "https://d.example", diskNote: "   " })[0]), false);
});

test("otherChannels excludes the primary one", () => {
  assert.deepEqual(otherChannels({ official: "https://o.example", github: "https://github.com/a/b" }).map((c) => c.id), ["github"]);
  assert.deepEqual(otherChannels({}).map((c) => c.id), []);
});

test("channel ids are a closed whitelist for click tracking", () => {
  for (const id of ["official", "homepage", "github", "disk"]) assert.equal(isChannelId(id), true);
  // 统计上报只接受白名单值，任意用户输入都不能落库。
  for (const id of ["", "x", "Official", "official ", "../../etc", "__proto__"]) {
    assert.equal(isChannelId(id), false);
  }
});

test("source and kind must agree, which is the GeoGebra rule", () => {
  assert.equal(isValidSourceKind("official", "app"), true);
  assert.equal(isValidSourceKind("opensource", "opensource"), true);
  // 源码公开但许可闭源：必须显式写 official + app，否则会挂出错误的「开源」徽章。
  assert.equal(isValidSourceKind("opensource", "app"), true);
  assert.equal(isValidSourceKind("official", "opensource"), false);
  assert.equal(isValidSourceKind("discount", "opensource"), false);
  assert.match(describeSourceKind("official", "app"), /厂商正式版/);
  assert.equal(describeSourceKind("official", "opensource").includes("official"), true);
});

test("kind defaults to a source-derived guess but can be overridden", () => {
  assert.equal(inferKind("opensource"), "opensource");
  assert.equal(inferKind("official"), "app");
  assert.equal(resolveKind("opensource"), "opensource");
  assert.equal(resolveKind("opensource", "app"), "app");
});

test("an open-source claim without a repository has nothing to verify", () => {
  assert.equal(needsRepoEvidence({ source: "opensource", kind: "opensource", links: {} }), true);
  assert.equal(needsRepoEvidence({ source: "opensource", kind: "opensource", links: baseLinks }), false);
  // 标为 official + app 的闭源工具不受此约束。
  assert.equal(needsRepoEvidence({ source: "official", kind: "app", links: {} }), false);
});

test("validateSemantics collects every inconsistency in one pass", () => {
  const ok = { source: "official", kind: "app", links: { official: "https://o.example" } };
  assert.deepEqual(validateSemantics(ok), []);

  const bad = validateSemantics({
    source: "discount",
    kind: "opensource",
    links: { disk: "https://d.example" },
  });
  // 来源与类型不匹配；镜像缺说明；镜像无官网。一次返回全部问题，
  // 否则用户要提交三次才知道自己错了几处。
  assert.ok(bad.length >= 3, `期望至少 3 条问题，实际 ${bad.length}`);
  assert.ok(bad.some((p) => p.includes("不匹配")));
  assert.ok(bad.some((p) => p.includes("镜像说明")));
  assert.ok(bad.some((p) => p.includes("唯一来源")));

  // 单字段必填不在此处校验：场景、平台的空值由 saveItem 与 ingest 各自负责，
  // 语义层只管跨字段一致性，重复校验会让同一问题在两处以不同措辞报错。
  assert.deepEqual(validateSemantics({ source: "official", kind: "app", links: {} }), []);
});

test("icon resolution falls back from upload to svg to letter", () => {
  const item = { iconImage: "/media/vscode/0123456789abcdef.png", icon: { letter: "V", color: "#0071e3", simpleIcon: "visualstudiocode" } };
  const kinds = iconCandidates(item).map((c) => c.kind);
  assert.deepEqual(kinds, ["image", "image", "letter"]);
  // /icons/ 下的 svg 不走 next/image 优化。
  assert.equal(iconCandidates(item)[1].optimize, false);
  assert.equal(iconCandidates(item)[0].optimize, true);

  // 加载失败要能顺延，而不是变成空图标。
  assert.equal(resolveIcon(item, ["/media/vscode/0123456789abcdef.png"]).src, "/icons/visualstudiocode");
  assert.equal(resolveIcon(item, ["/media/vscode/0123456789abcdef.png", "/icons/visualstudiocode"]).kind, "letter");
  const bare = { icon: { letter: "G", color: "#000" } };
  assert.deepEqual(resolveIcon(bare), { kind: "letter", letter: "G" });
  assert.deepEqual(resolveIcon(bare, ["/nope"]), { kind: "letter", letter: "G" });
});

test("the primary scene is scenes[0] by definition", () => {
  assert.equal(primaryScene(["docs", "office"]), "docs");
  assert.equal(primaryScene([]), undefined);
  // 批量归属规则依赖这个约定：跨场景条目归 scenes[0]，否则两边都会跳过。
  assert.equal(primaryScene(["office", "docs"]), "office");
});

test("body paragraphs drop blank runs and keep the four-part shape", () => {
  assert.deepEqual(bodyParagraphs("一\n\n二\n\n\n三"), ["一", "二", "三"]);
  assert.deepEqual(bodyParagraphs("  \n\n  "), []);
  assert.equal(bodyParagraphs("①是什么\n\n②特性\n\n③代价\n\n④许可").length, 4);
  assert.deepEqual(bodyParagraphs(""), []);
});

test("display name only appends a Chinese name when there is one", () => {
  assert.equal(displayName({ name: "Blender", nameZh: "布兰德" }), "Blender（布兰德）");
  assert.equal(displayName({ name: "Git" }), "Git");
});
