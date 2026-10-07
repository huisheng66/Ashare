import assert from "node:assert/strict";
import test from "node:test";

import { anchorSlug, inlineText, markdownOutline, parseInline, parseMarkdown, safeHref, safeImageSrc } from "../lib/markdown.ts";
import { formatGuideLines, guideImages, guideUrls, isGuideEmpty, isGuideKind, normalizeGuide, parseGuideLines, validateGuide } from "../lib/guide.ts";

const MEDIA = "/media/vscode/0123456789abcdef.png";
const types = (nodes) => nodes.map((n) => n.type);

test("link targets accept only https and generated media paths", () => {
  assert.equal(safeHref("https://example.com/doc"), "https://example.com/doc");
  assert.equal(safeHref(MEDIA), MEDIA);
  for (const bad of [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>x</script>",
    "//evil.example/x",
    "/relative/path",
    "http://example.com",
    "https://user:pass@example.com",
    "vbscript:msgbox",
    "",
  ]) {
    assert.equal(safeHref(bad), undefined, `${bad} 不该被放行`);
  }
});

test("images are limited to uploaded site media", () => {
  assert.equal(safeImageSrc(MEDIA), MEDIA);
  assert.equal(safeImageSrc("https://example.com/a.png"), undefined);
  // 路径形状必须与上传流程一致，防止 ../ 穿越。
  assert.equal(safeImageSrc("/media/vscode/../../../secret.png"), undefined);
  assert.equal(safeImageSrc("/media/vscode/0123456789abcdef.svg"), undefined);
});

test("dangerous links degrade to plain text instead of rendering", () => {
  const nodes = parseInline("点 [这里](javascript:alert(1)) 就行");
  // 标签文字要留下，但不能产出任何 link 节点，残留的 ) 也不能漏进正文。
  assert.deepEqual(types(nodes), ["text"]);
  assert.equal(inlineText(nodes), "点 这里 就行");
  // 合法链接仍要保留可点形态。
  assert.deepEqual(types(parseInline("[文档](https://example.com)")), ["link"]);
});

test("a link target may contain balanced parentheses", () => {
  // 维基类链接带成对括号，不能在第一个 ) 处截断。
  const [node] = parseInline("[条目](https://zh.wikipedia.org/wiki/Foo_(bar))");
  assert.deepEqual(node, {
    type: "link",
    href: "https://zh.wikipedia.org/wiki/Foo_(bar)",
    children: [{ type: "text", value: "条目" }],
  });
  // 没有收尾括号时整体当纯文本，不吞掉后续内容。
  const broken = parseInline("看 [这里](https://example.com/a 还有下文");
  assert.deepEqual(types(broken), ["text"]);
  assert.equal(inlineText(broken), "看 [这里](https://example.com/a 还有下文");
});

test("inline markup covers code, emphasis and images", () => {
  // 行内代码里的 * _ 不解释为标记。
  const [code] = parseInline("`a * b _ c`");
  assert.deepEqual(code, { type: "code", value: "a * b _ c" });

  const strong = parseInline("**重点**");
  assert.deepEqual(strong, [{ type: "strong", children: [{ type: "text", value: "重点" }] }]);
  const em = parseInline("_强调_");
  assert.deepEqual(em, [{ type: "em", children: [{ type: "text", value: "强调" }] }]);

  const [image] = parseInline(`![界面](${MEDIA})`);
  assert.deepEqual(image, { type: "image", src: MEDIA, alt: "界面" });
  // 外链图退回 alt 文本，不产出 img 节点。
  assert.deepEqual(types(parseInline("![界面](https://evil.example/a.png)")), ["text"]);
});

test("headings become anchors and duplicate names stay unique", () => {
  const blocks = parseMarkdown("## 配置\n\n正文\n\n### 进阶\n\n## 配置");
  const headings = blocks.filter((b) => b.type === "heading");
  assert.equal(headings.length, 3);
  assert.deepEqual(headings.map((h) => h.level), [2, 3, 2]);
  // 同名小节必须有不同 id，否则目录第二条会跳到第一节。
  assert.equal(headings[0].id, "配置");
  assert.equal(headings[2].id, "配置-2");
  assert.equal(anchorSlug("!!!", "fallback"), "fallback");
  assert.equal(anchorSlug("Hello World", "fallback"), "hello-world");
});

test("outline only lists h2 and h3", () => {
  const blocks = parseMarkdown("## 一\n\n### 一点一\n\n#### 太细\n\n## 二");
  assert.deepEqual(markdownOutline(blocks), [
    { id: "一", text: "一", level: 2 },
    { id: "一点一", text: "一点一", level: 3 },
    { id: "二", text: "二", level: 2 },
  ]);
  assert.deepEqual(markdownOutline(parseMarkdown("")), []);
});

test("lists, quotes, rules and fenced code parse as blocks", () => {
  const blocks = parseMarkdown([
    "- 第一项",
    "- 第二项",
    "",
    "1. 步骤一",
    "2. 步骤二",
    "",
    "> 注意：先备份。",
    "",
    "---",
    "",
    "```bash",
    "yt-dlp -x '链接'",
    "```",
  ].join("\n"));
  assert.deepEqual(blocks.map((b) => b.type), ["list", "list", "quote", "rule", "code"]);

  const unordered = blocks[0];
  assert.equal(unordered.ordered, false);
  assert.equal(unordered.items.length, 2);
  assert.equal(blocks[1].ordered, true);
  // 代码块内容原样保留，不解析其中的行内标记。
  assert.deepEqual(blocks[4], { type: "code", lang: "bash", value: "yt-dlp -x '链接'" });
});

test("an unclosed fence still yields a code block without eating the document", () => {
  const blocks = parseMarkdown("```\nline\n\n后面还有内容");
  assert.equal(blocks[0].type, "code");
  assert.equal(blocks[0].value, "line");
  assert.equal(blocks[1].type, "paragraph");
});

// 回归：围栏内的空行曾被当成「未闭合」信号而提前收尾，导致闭合代码块
// 从空行之后的全部内容丢失（bash 分段、Python 多段都常见这种写法）。
test("a closed fence keeps blank lines and everything after them", () => {
  const blocks = parseMarkdown(
    ["```bash", "first-cmd", "", "second-cmd", "```", "", "## 后续小节", "", "正文。"].join("\n"),
  );
  assert.deepEqual(blocks.map((b) => b.type), ["code", "heading", "paragraph"]);
  assert.equal(blocks[0].value, "first-cmd\n\nsecond-cmd");
  assert.equal(blocks[1].level, 2);
  assert.equal(blocks[2].children[0].value, "正文。");
});

test("tables need both a pipe row and a divider row", () => {
  const [table] = parseMarkdown("| 参数 | 说明 |\n| --- | --- |\n| `-f` | 格式 |");
  assert.equal(table.type, "table");
  assert.equal(table.head.length, 2);
  assert.equal(table.rows.length, 1);
  assert.equal(inlineText(table.rows[0][0]), "-f");
  // 只有竖线没有分隔行，是普通段落而不是表格。
  assert.equal(parseMarkdown("| a | b |")[0].type, "paragraph");
});

test("empty and blank-only sources produce nothing", () => {
  assert.deepEqual(parseMarkdown(""), []);
  assert.deepEqual(parseMarkdown("   \n\n  "), []);
});

test("guide kinds are a closed whitelist", () => {
  for (const kind of ["markdown", "pdf", "html", "image", "link"]) assert.equal(isGuideKind(kind), true);
  for (const kind of ["", "PDF", "doc", "video", "__proto__", "markdown "]) assert.equal(isGuideKind(kind), false);
});

test("validateGuide reports every problem in one pass", () => {
  assert.deepEqual(validateGuide(undefined), []);
  const ok = {
    intro: "从零配好。",
    markdown: "## 步骤",
    resources: [
      { kind: "pdf", title: "手册", url: "https://example.com/a.pdf" },
      { kind: "image", title: "界面", url: MEDIA },
    ],
  };
  assert.deepEqual(validateGuide(ok), []);

  const problems = validateGuide({
    markdown: "x".repeat(40_001),
    resources: [
      { kind: "pdf", title: "", url: "javascript:alert(1)" },
      { kind: "image", title: "外链图", url: "https://example.com/a.png" },
    ],
  });
  assert.ok(problems.length >= 4, `期望至少 4 条问题，实际 ${problems.length}`);
  assert.ok(problems.some((p) => p.includes("正文过长")));
  assert.ok(problems.some((p) => p.includes("缺少标题")));
  assert.ok(problems.some((p) => p.includes("HTTPS")));
  assert.ok(problems.some((p) => p.includes("本站已上传")));
  assert.ok(problems.some((p) => p.startsWith("第 2 条资源")));
});

test("an empty guide collapses to undefined instead of storing blanks", () => {
  assert.equal(isGuideEmpty(undefined), true);
  assert.equal(isGuideEmpty({ intro: "  ", markdown: "", resources: [] }), true);
  assert.equal(isGuideEmpty({ intro: "有内容", resources: [] }), false);
  assert.equal(normalizeGuide({ intro: "  ", markdown: " \n ", resources: [] }), undefined);
  assert.deepEqual(normalizeGuide({ intro: " 导读 ", resources: [] }), { intro: "导读", resources: [] });
  // 缺 resources 的旧数据也要能归一，不能抛。
  assert.deepEqual(normalizeGuide({ markdown: "## 标题" }), { markdown: "## 标题", resources: [] });
});

test("resource lines round-trip through the compact form", () => {
  const raw = [
    "pdf | 官方手册 | https://example.com/a.pdf | 离线可读",
    "html | 配置文档 | https://example.com/docs",
    `image | 界面截图 | ${MEDIA}`,
  ].join("\n");
  const { resources, invalid } = parseGuideLines(raw);
  assert.deepEqual(invalid, []);
  assert.equal(resources.length, 3);
  assert.deepEqual(resources[0], { kind: "pdf", title: "官方手册", url: "https://example.com/a.pdf", note: "离线可读" });
  // 三段时末段是链接而不是说明。
  assert.deepEqual(resources[1], { kind: "html", title: "配置文档", url: "https://example.com/docs" });
  assert.equal(resources[2].note, undefined);
  assert.equal(formatGuideLines(resources), raw);
  assert.equal(formatGuideLines(undefined), "");
});

test("bad resource lines are reported instead of silently dropped", () => {
  const { resources, invalid } = parseGuideLines(
    ["docx | 错误类型 | https://example.com", "pdf | 缺链接", "", "  ", "link | 正常 | https://example.com"].join("\n"),
  );
  assert.equal(resources.length, 1);
  assert.equal(invalid.length, 2);
  assert.ok(invalid[0].includes("类型"));
  assert.ok(invalid[1].includes("类型 | 标题 | 链接"));
});

test("guide links and images are collected for link checking, invalid ones excluded", () => {
  const urls = guideUrls({
    markdown: `见 [文档](https://example.com/doc)、[伪协议](javascript:alert(1))、![图](${MEDIA}) 与 [站内文件](/media/x/0123456789abcdef.png)。`,
    resources: [
      { kind: "pdf", title: "手册", url: "https://example.com/a.pdf" },
      { kind: "image", title: "图", url: MEDIA },
      { kind: "link", title: "重复", url: "https://example.com/a.pdf" },
    ],
  });
  // 站内 /media/ 路径不进外链清单（由 guideImages 负责），伪协议被丢弃，重复去重。
  assert.deepEqual(urls, ["https://example.com/a.pdf", "https://example.com/doc"]);
  assert.deepEqual(guideImages({ markdown: `![界面](${MEDIA}) 与 ![外链](https://evil.example/a.png)` }), [MEDIA]);
  assert.deepEqual(guideUrls(undefined), []);
  assert.deepEqual(guideImages(undefined), []);
});
// 回归：种子里的配套资料链接曾出现 404（wiki.audacityteam.org/wiki/Noise_Reduction
// 会 302 到 support.audacityteam.org/troubleshooting/missing-features 再 404）。
// 这里锁定「种子教程不得再指向已下线的旧 Wiki」，避免同类死链再次被写进种子。
test("种子教程链接不使用 Audacity 已下线的旧 Wiki 域路径", async () => {
  const { samples } = await import("../data/samples.ts");
  const dead = [];
  for (const sample of samples) {
    for (const url of guideUrls(sample.guide)) {
      if (url.includes("wiki.audacityteam.org/wiki/Noise_Reduction")) dead.push(`${sample.slug} → ${url}`);
    }
  }
  assert.deepEqual(dead, [], `发现指向已下线页面的种子链接：\n${dead.join("\n")}`);
});

test("种子教程的外链全部是 https 且带说明，便于人工复核", async () => {
  const { samples } = await import("../data/samples.ts");
  for (const sample of samples) {
    for (const resource of sample.guide?.resources ?? []) {
      assert.ok(resource.url.startsWith("https://"), `${sample.slug} 的「${resource.title}」不是 https：${resource.url}`);
      assert.ok(resource.note?.trim(), `${sample.slug} 的「${resource.title}」缺少说明，无法判断链接是否对口`);
    }
  }
});

// 回归：配套资料里曾放过下载页（audacity 的 /download/）。下载属于「上手步骤」的
// 内容，配套资料应当指向官网首页或精确文档页 —— 用户明确要求过这条口径。
test("种子配套资料不放下载页，只放官网首页或文档页", async () => {
  const { samples } = await import("../data/samples.ts");
  const offenders = [];
  for (const sample of samples) {
    for (const resource of sample.guide?.resources ?? []) {
      const { pathname } = new URL(resource.url);
      if (/(^|\/)download(s)?(\/|$)/i.test(pathname) || /\/releases(\/|$)/i.test(pathname)) {
        offenders.push(`${sample.slug}：「${resource.title}」→ ${resource.url}`);
      }
    }
  }
  assert.deepEqual(offenders, [], `配套资料里不应出现下载/发布页：\n${offenders.join("\n")}`);
});

// 回归：GitHub 资源要指向精确的 README 文件，不能只给仓库首页 —— 仓库首页会
// 跳到 issues 或 releases，与「看文档」无关。
test("种子配套资料的 GitHub 链接精确到 README 文件", async () => {
  const { samples } = await import("../data/samples.ts");
  const loose = [];
  for (const sample of samples) {
    for (const resource of sample.guide?.resources ?? []) {
      if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(resource.url)) continue;
      loose.push(`${sample.slug}：「${resource.title}」→ ${resource.url}`);
    }
  }
  assert.deepEqual(loose, [], `GitHub 链接应精确到 README 文件：\n${loose.join("\n")}`);
});

// 回归：seedToItem / validateGuide 都查不出模板字符串转义问题——它们只看
// 解析后的 AST，不看代码块里的字面量。若 \\n 被 TS 吞成真实换行、\\( 被吞成
// ( ，校验器全绿但页面上的命令是错的。这里直接断言渲染后的字面量。
test("种子教程代码块里的反斜杠转义不被 TS 模板字符串吞掉", async () => {
  const { samples } = await import("../data/samples.ts");
  const { parseMarkdown } = await import("../lib/markdown.ts");
  for (const sample of samples) {
    const guide = sample.guide;
    if (!guide?.markdown) continue;
    for (const block of parseMarkdown(guide.markdown)) {
      if (block.type !== "code") continue;
      // 代码块里不该出现裸的真实换行符以外的转义残留：printf 的 \n 必须还在。
      if (/printf\s+'[^']*\\n/.test(block.value) === false && block.value.includes("printf '")) {
        assert.fail(`${sample.slug}：printf 的 \\n 转义被吞，渲染出来是断行而不是换行符`);
      }
      // Picard 命名脚本的 \( 是字面量括号，丢了会让读者抄错脚本。
      if (block.value.includes("$if2(") && !block.value.includes("\\(")) {
        assert.fail(`${sample.slug}：命名脚本的 \\( 转义被吞`);
      }
    }
  }
});
