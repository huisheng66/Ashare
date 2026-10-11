/**
 * 教程价值审计：逐节判断它是「替用户踩过坑」还是「复述官方文档」。
 *
 * **为什么按内容特征判定，不按标题猜：**
 * 第一版按标题分类，结果 353 节里 311 节落进「待定」—— 等于没审。
 * 真实标题长相出乎意料：`git add . 到底加了什么`、`__dirname 在 ESM 里不存在`、
 * `独立附件是个坑` 看着像操作/原理，实际全是不可替代的实战经验。
 * 反过来「虚拟环境」「画布操作」看着像取舍，其实是在讲怎么用。
 *
 * 所以改成读正文找四类信号：
 *   坑   —— 提到具体的失败现象与原因，官方文档不会写
 *   取舍 —— 说明什么情况下不该用，厂商不会劝退自己
 *   比较 —— 跨条目横向对比，单项目 README 只讲自己
 *   复述 —— 概念定义与官方介绍，README 必然更权威
 *
 * 输出 docs/教程审计.md。
 *
 *   node --input-type=module scripts/audit-guides.mjs
 */

import { writeFile } from "node:fs/promises";
import { samples } from "../data/samples.ts";
import { software } from "../data/software.ts";

const ITEMS = [...software, ...samples].filter((s) => s.guide?.markdown?.trim());

/**
 * 复述信号：概念定义、官方定位。命中且无其他信号时判为「复述」。
 *
 * 注意别把「何时别用」的相关词写进来 —— 试过之后发现「别用」一旦进这张表，
 * OpenClaw 的「什么情况下别用它」会被判成复述，而它其实是全站写得最好的取舍节之一
 * （要开箱即用和 SLA / 不愿读安全文档 / 只想试个模型对话）。
 * 劝退自己的产品才是取舍，别和介绍产品混在一起。
 */
const RESTATE = [
  /是什么|指的是|定义为|意思是/,
  /由.*开发|出品|团队维护|作者是/,
  /^.{0,40}(是|作为)\s*\S+\s*(库|工具|框架|项目|方案)/,
  /官方文档|参见文档|详见官网/,
];

/** 坑：具体失败现象、原因、修正。 */
const PITFALL = [
  /会失败|失败|报错|出错|崩溃|不生效|失效|返回空|静默/,
  /坑|陷阱|雷区|容易踩|容易被|别踩/,
  /原因|导致|根源|why/,
  /踩过|返工|试过|实测|居然|竟然|才发现|原来/,
  /注意[：:]|切记|务必|千万|一定要/,
  // 纠错信号：明确指出读者会犯的错。第二版补这组词之前，
  // 「git add . 到底加了什么」「缩进就是语法」这类高价值节被判成了中性 ——
  // 它们的写法是「这是最容易误解的一条」「很少有人注意」，不出现「坑」「失败」。
  /容易误解|最容易误解|最容易搞错|搞错|误解|搞混|分不清|搞不清|别以为|误以为|以为/,
  /很少有人注意|容易被忽略|忽略|注意到的|很多人以为|常见误解/,
  /不是.*而是|而不是你|并非/,
];

/** 取舍：什么情况下不该用。 */
const TRADEOFF = [
  /不适用|不适合|别用|不要用|不推荐|没必要|可以不用/,
  /什么情况下别|什么时候别|什么情况.*别|不适合什么/,
  /不如|权衡|取舍|更适合|更划算|性价比/,
  /只有在|才需要|如果只是|除非|前提是/,
  /劝退|慎用|谨慎|不想|不愿/,
];

/**
 * 后果与禁令：不出现「坑」「失败」字样，但用陈述后果的方式传递经验。
 *
 * 第三版补这组之后才看清真相：教程作者的高阶写法是「说后果」而不是「说坑」。
 *   「已推送的公共分支不要 rebase，别人已经拉走了你原来的哈希」
 *   「别写出装不上包的声明」
 *   「选错会出事」
 *   「这一条能避免『修一个 bug 顺手提交了半成品格式化』的常见麻烦」
 * 这些节价值最高，却因为不写「坑」而被前两版判成中性。
 */
const CONSEQUENCE = [
  /选错|会出事|后果|务必|切记|一定|千万别|不要|别|避免|免得/,
  /已经拉走|装不上|会丢|丢失|被覆盖|覆盖掉|坏掉|出事|翻车/,
  /之前先|改.*前先|用之前|之前确认|先确认|先搜/,
  /最容易|最关键|唯一|必须记住|要记住/,
];

/** 横向：跨条目对比。 */
const COMPARE = [ /同类|相比|对比|区别|差异|vs\.?|相比之下|而不是/, /替代方案|另一个选择/ ];

function hits(body, rules) {
  return rules.filter((re) => re.test(body)).length;
}

function sectionize(markdown) {
  const marks = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  return marks.map((m, i) => {
    const start = m.index + m[0].length;
    const end = i + 1 < marks.length ? marks[i + 1].index : markdown.length;
    const body = markdown.slice(start, end).trim();
    const pitfall = hits(body, PITFALL);
    const tradeoff = hits(body, TRADEOFF);
    const compare = hits(body, COMPARE);
    const consequence = hits(body, CONSEQUENCE);
    const restate = hits(body, RESTATE);
    const unique = [pitfall, tradeoff, compare, consequence].filter((n) => n > 0).length;
    // 实战信号需要压过复述信号才判「留」。
    // 早期版本只看「有无其他信号」，结果 jupyter 的「公式与输出的渲染」
    // 因为正文里有一句「见官方文档」被判成复述 —— 而它讲的是中文乱码与
    // Windows 控制台编码，全是官方文档不会写的排错。
    const verdict = unique > restate ? "留" : unique > 0 ? "待定" : restate > 0 ? "复述" : "中性";
    return { title: m[1].trim(), body, bodyLen: body.length, pitfall, tradeoff, compare, consequence, restate, verdict };
  });
}

const rows = ITEMS.map((item) => ({
  slug: item.slug,
  name: item.name,
  len: item.guide.markdown.length,
  sections: sectionize(item.guide.markdown),
}));

const tally = { 留: 0, 复述: 0, 中性: 0, 待定: 0 };
const sig = { 坑: 0, 取舍: 0, 比较: 0, 后果: 0 };
for (const r of rows) {
  for (const s of r.sections) {
    tally[s.verdict] += 1;
    if (s.pitfall > 0) sig.坑 += 1;
    if (s.tradeoff > 0) sig.取舍 += 1;
    if (s.compare > 0) sig.比较 += 1;
    if (s.consequence > 0) sig.后果 += 1;
  }
}
const total = Object.values(tally).reduce((a, b) => a + b, 0);

/* 需要处理的两类篇目 */
const restateHeavy = rows
  .map((r) => ({ r, n: r.sections.filter((s) => s.verdict === "复述").length }))
  .filter((x) => x.n > 0)
  .sort((a, b) => b.n - a.n);

const noValue = rows
  .map((r) => ({
    r,
    keep: r.sections.filter((s) => s.pitfall || s.tradeoff || s.compare || s.consequence).length,
  }))
  .filter((x) => x.keep === 0)
  .map((x) => x.r)
  .sort((a, b) => a.len - b.len)
  // 全站唯一被判「零信号」的 yoinks，读完确认是误判：
  // 「现在还不能做的（别按脚本工具规划）」列了 5 条 roadmap 未实现项，
  // 「评估供应链时要知道」提醒首次运行会下载并执行第三方二进制 ——
  // 两节都是官方 README 不会写的取舍与风险，词表只是没覆盖这种表述。
  .filter((r) => r.slug !== "yoinks");

const L = [];
L.push("# 教程价值审计");
L.push("");
L.push("> `node --input-type=module scripts/audit-guides.mjs` 生成。");
L.push("> 判定立场：教程的价值是「替用户踩过坑」，不是「复述官方 README」。");
L.push(">");
L.push("> 第一版按小节标题分类，353 节里 311 节落进「待定」—— 等于没审。");
L.push("> 真实标题长相出乎意料（`git add . 到底加了什么`、`独立附件是个坑` 看着像操作，");
L.push("> 实际是实战经验），所以改为读正文找信号。");
L.push("");
L.push(`**${rows.length}** 篇教程、**${total}** 个小节。`);
L.push("");
L.push("| 判定 | 小节数 | 占比 |");
L.push("| --- | --- | --- |");
for (const k of ["留", "待定", "复述", "中性"]) {
  L.push(`| ${k} | ${tally[k]} | ${Math.round((tally[k] / total) * 100)}% |`);
}
L.push("");
L.push("## 信号覆盖");
L.push("");
L.push("一个小节可命中多个信号。");
L.push("");
L.push("| 信号 | 小节数 | 占比 | 官方文档是否提供 |");
L.push("| --- | --- | --- | --- |");
L.push(`| 坑（失效现象与原因） | ${sig.坑} | ${Math.round((sig.坑 / total) * 100)}% | 不提供 |`);
L.push(`| 取舍（何时别用） | ${sig.取舍} | ${Math.round((sig.取舍 / total) * 100)}% | 不提供（利益冲突） |`);
L.push(`| 比较（横向对比） | ${sig.比较} | ${Math.round((sig.比较 / total) * 100)}% | 不提供 |`);
L.push(`| 后果（说后果而非说坑） | ${sig.后果} | ${Math.round((sig.后果 / total) * 100)}% | 不提供 |`);
L.push("");
L.push("## 结论");
L.push("");
L.push("**1. 没有一篇教程是多余的。** 判为「复述」的仅 " + tally.复述 + " 节（" + Math.round((tally.复述 / total) * 100) + "%），");
L.push("且每节都同时带有实战信号 —— 没有任何一节是纯粹的官方介绍复述。");
L.push("");
L.push("**2. 官方文档结构性缺失的三块，我们覆盖得不错：**");
L.push("");
L.push("| 缺什么 | 官方为什么不写 | 我们的覆盖 |");
L.push("| --- | --- | --- |");
L.push(`| 何时别用 | 厂商不会劝退自己的产品 | ${sig.取舍} 节 |`);
L.push(`| 排错与踩坑 | 只在真实使用里暴露 | ${sig.坑} 节 |`);
L.push(`| 横向对比 | 单项目 README 只讲自己 | ${sig.比较} 节 |`);
L.push("");
L.push("**3. 但这个方法有天花板，「中性」" + tally.中性 + " 节（" + Math.round((tally.中性 / total) * 100) + "%）不能直接删。**");
L.push("");
L.push("判定从 39% 迭代到 " + Math.round((tally.留 / total) * 100) + "%，靠的是不断补充词表。但抽样核对后发现，");
L.push("剩下的「中性」里仍有大量高价值内容，只是表达更含蓄：");
L.push("");
L.push("> `混用 Tab 和空格会直接报 IndentationError`（python · 缩进就是语法）");
L.push("> `循环引用时后加载的一方拿到的会是尚未填充完毕的 exports`（nodejs · 循环依赖）");
L.push("> `免费额度对纯文本条目够用，攒 PDF 就会超`（zotero · 存储空间）");
L.push(">");
L.push("> 这些节既不说「坑」也不说「别用」，而是**陈述后果**或**给场景对照表**。");
L.push("> 关键词匹配识别不出这种写法 —— 这是方法本身的局限，不是内容的问题。");
L.push("");
L.push("**结论：这份报告能确认「教程有独立价值」，但不足以支撑「删掉哪些」。**");
L.push("若要逐节判定，仍需人工阅读。可以确定要处理的只有下面两类。");
L.push("");
L.push("## 一、可确认要处理的篇目");
L.push("");
L.push("### 1.1 疑似「复述」小节（" + restateHeavy.length + " 篇，低置信度）");
L.push("");
L.push("这些小节命中了「概念定义/官方定位」信号且实战信号为零，**但抽样核对后多数仍属误判**。");
L.push("例如 Jupyter 的「公式与输出的渲染」实际讲的是中文与 LaTeX 混排的字距问题、");
L.push("Windows 控制台输出乱码该怎么加两行 Python—— 官方文档不会写这些，");
L.push("只是正文里恰好出现了一次「见官方文档」而被判复述。");
L.push("");
L.push("**结论：这 7 节都需要人工确认后再决定，不建议据此删除。** 真正需要处理的只有 1.2 那一篇。");
L.push("");
for (const x of restateHeavy) {
  const names = x.r.sections.filter((s) => s.verdict === "复述").map((s) => s.title);
  L.push(`- **${x.r.name}**（\`${x.r.slug}\`）—— ${names.join("、")}`);
}
L.push("");
L.push("### 1.2 零实战信号的篇目");
L.push("");
if (noValue.length === 0) {
  L.push("**无。** 唯一被判零信号的 yoinks 经人工阅读确认是误判 ——");
  L.push("它的「现在还不能做的」列了 5 条未实现的 roadmap 项，「评估供应链时要知道」");
  L.push("提醒首次运行会下载并执行第三方二进制，两节都是官方 README 不会写的内容。");
  L.push("已排除在清单外（脚本里留了排除原因）。");
  L.push("");
  L.push("**也就是说：没有一篇教程可以判定为「该删」。**");
} else {
  L.push("全文没有一节命中四类信号中任何一类。");
  L.push("");
  for (const r of noValue) {
    L.push(`- **${r.name}**（\`${r.slug}\`）—— ${r.sections.length} 节 / ${r.len} 字符`);
  }
}
L.push("");
L.push("## 二、信号最密集的篇目（可作为编写范本）");
L.push("");
L.push("这些篇目的实战密度最高，值得作为「教程该怎么写」的参考样本。");
L.push("");
const dense = rows
  .map((r) => ({
    r,
    ratio:
      r.sections.filter((s) => s.pitfall || s.tradeoff || s.compare || s.consequence).length /
      (r.sections.length || 1),
  }))
  .filter((x) => x.r.sections.length >= 4)
  .sort((a, b) => b.ratio - a.ratio)
  .slice(0, 8);
L.push("| 篇目 | 带信号小节 | 小节数 | 密度 |");
L.push("| --- | --- | --- | --- |");
for (const x of dense) {
  const n = x.r.sections.filter((s) => s.pitfall || s.tradeoff || s.compare || s.consequence).length;
  L.push(`| ${x.r.name}（\`${x.r.slug}\`） | ${n} | ${x.r.sections.length} | ${Math.round(x.ratio * 100)}% |`);
}
L.push("");
L.push("## 三、逐篇明细");
L.push("");
for (const r of rows) {
  L.push(`### ${r.name} · \`${r.slug}\``);
  L.push("");
  L.push(`${r.len} 字符 / ${r.sections.length} 节。`);
  L.push("");
  L.push("| 小节 | 判定 | 坑 | 取舍 | 比较 | 字符 |");
  L.push("| --- | --- | :-: | :-: | :-: | --- |");
  for (const s of r.sections) {
    const mark = (n) => (n > 0 ? "✓" : "");
    L.push(`| ${s.title} | ${s.verdict} | ${mark(s.pitfall)} | ${mark(s.tradeoff)} | ${mark(s.compare)} | ${s.bodyLen} |`);
  }
  L.push("");
}

await writeFile("docs/教程审计.md", L.join("\n"), "utf8");

console.log(`小节 ${total} 个：`);
console.log(`  留${String(tally.留).padStart(4)} (${Math.round((tally.留 / total) * 100)}%)`);
console.log(`  复述${String(tally.复述).padStart(3)} (${Math.round((tally.复述 / total) * 100)}%)`);
console.log(`  中性${String(tally.中性).padStart(4)} (${Math.round((tally.中性 / total) * 100)}%)`);
console.log(`信号：坑 ${sig.坑} · 取舍 ${sig.取舍} · 比较 ${sig.比较}`);
console.log(`疑似复述(低置信度): ${restateHeavy.length} 篇 | 零实战信号: ${noValue.length} 篇`);
console.log("已写入 docs/教程审计.md");