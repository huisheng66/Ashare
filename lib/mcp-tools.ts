import "server-only";

import { scenes } from "@/data/scenes";
import type { Platform, SceneId } from "@/data/types";

import { alternativesOf, catalogCounts, diagnoseSearch, getSoftware, searchCatalog } from "./catalog";
import { formatDate, kindLabel, platformLabel, sourceLabel } from "./items";
import { describeLicense } from "./license-info";
import type { ToolInvoker, ToolResultText } from "./mcp-protocol";

/**
 * MCP 工具的实现层：把目录读接口包成「给模型看的文本」。
 *
 * 为什么输出是 Markdown 文本而不是 JSON：
 *  - MCP 的 content 是给人/模型读的；JSON 塞进 text 块里模型还要再解析一遍，
 *    而字段顺序、null 之类反而更容易被读错。
 *  - 链接、许可证说明都要拼成人话（「GPL-3.0（分发衍生作品需同样开源）」），
 *    这些在 JSON 里只能拆成两个字段，模型还得自己合成。
 *  - 真需要结构化数据的客户端，可以照 text 里的字段顺序自己解析；反过来做不到。
 *
 * 输出量刻意收窄：搜索每条一行主信息 + 一行元信息，详情带正文但不带 guide 全文
 * （guide 是几千字的长文，进了上下文会把对话挤爆，改为给链接）。
 */

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

export function createToolInvoker(baseUrl: string): ToolInvoker {
  const site = baseUrl.replace(/\/+$/, "");
  return async (name, args): Promise<ToolResultText> => {
    switch (name) {
      case "search_tools":
        return searchTools(site, args);
      case "get_tool":
        return getTool(site, args);
      case "list_scenes":
        return listScenes(site);
      default:
        return { text: `未知工具 ${name}`, isError: true };
    }
  };
}

/** 平台/来源/许可这三个字段在全站都有中文标签，这里必须复用，不能另起一套说法。 */
function licenseLabel(spdx?: string): string | undefined {
  const info = describeLicense(spdx);
  if (!info) return undefined;
  return `${info.spdx}（${info.summary}）`;
}

/**
 * 零结果的归因。
 *
 * 直接回一句「换个说法试试」是最没用的回答 —— 用户/模型无法判断是「词不在库里」
 * 还是「筛选太窄」还是「打错字」，三者的下一步动作完全不同。站内的 /search 页
 * 早就做了这件事（diagnoseSearch），这里必须复用同一套判断，否则 agent 与网页
 * 会对同一个查询给出不同质量的回答。
 *
 * 实测例子：搜「压缩图片」在库里 0 条（没有条目同时写「压缩」和「图片」），
 * 但「压缩」有 12 条、「图片」有 34 条 —— 说清这点，模型立刻知道该拆开搜。
 */
async function explainEmpty(query: string, scene?: SceneId, platform?: Platform): Promise<string> {
  const diagnosis = await diagnoseSearch(query, {
    scenes: scene ? [scene] : undefined,
    platforms: platform ? [platform] : undefined,
  }).catch(() => null);

  const lines: string[] = [];
  if (diagnosis?.reason === "filtered-out" && diagnosis.withoutFilters) {
    lines.push(
      `「${query}」本身能命中 ${diagnosis.withoutFilters} 条，但加上${scene ? "场景 " + scene : ""}${scene && platform ? "、" : ""}${platform ? "平台 " + platform : ""}后被筛光了。`,
      "去掉限定再搜一次即可。",
    );
    return lines.join("\n");
  }

  lines.push(`没有找到同时命中这些词的条目：${query.split(" ").filter(Boolean).map((term) => `「${term}」`).join("、")}。`);

  const perTerm = (diagnosis?.perTerm ?? []).filter((entry) => entry.hits > 0);
  if (perTerm.length) {
    lines.push(
      "分别看的话：" + perTerm.map((entry) => `「${entry.term}」有 ${entry.hits} 条`).join("、") + "——但两者没有交集。",
    );
    lines.push(`可以拆开搜，例如直接用「${perTerm[0].term}」。`);
  } else {
    // 中文短语不会被空格切开，「压缩图片」在诊断里就是一个 0 命中的词 —— 归因等于没说。
    // 这里探一下子串的命中数：能直接告诉模型「压缩 12 条、图片 34 条，但整短语没交集」，
    // 而不是让它盲猜「换个说法」。只探 2 字窗口、最多 4 个，成本可控且只在零结果时发生。
    const probes = await probeSubstrings(query, scene, platform);
    if (probes.length) {
      lines.push("拆开看有命中：" + probes.map((entry) => `「${entry.term}」${entry.hits} 条`).join("、") + "。");
      lines.push(`整串连写会要求字字相邻，所以搜不到；直接用「${probes[0].term}」重搜即可。`);
    } else {
      lines.push("库里的简介用中文写「做什么」，用需求描述比用产品名更容易命中；也可以先调 list_scenes 看看分了几类。");
    }
  }

  if (diagnosis?.suggestions?.length) {
    lines.push("这些词能搜到东西，可能是想找的：" + diagnosis.suggestions.map((word) => `「${word}」`).join("、"));
  }
  return lines.join("\n");
}

/**
 * 探中文短语的子串命中数。
 *
 * 只处理「连续汉字、长度 ≥3」的词：更短的词本身就是原词，切不出新信息。
 * ngram 查询要求字字相邻（「压缩图片」必须与文本里连续出现），
 * 而目录里写的是「图片压缩」—— 整串搜 0 条，两个子串却各自有若干条。
 * 这个事实只能靠实际查一遍才知道，不能猜。
 */
async function probeSubstrings(
  query: string,
  scene?: SceneId,
  platform?: Platform,
): Promise<{ term: string; hits: number }[]> {
  const terms = query.split(" ").filter((term) => /^[\u4e00-\u9fff]{3,}$/.test(term));
  if (!terms.length) return [];

  const windows = new Set<string>();
  for (const term of terms.slice(0, 2)) {
    for (let index = 0; index + 2 <= term.length && windows.size < 4; index += 1) {
      windows.add(term.slice(index, index + 2));
    }
  }

  const filters = { scenes: scene ? [scene] : undefined, platforms: platform ? [platform] : undefined };
  const results = await Promise.all(
    [...windows].map(async (term) => {
      const page = await searchCatalog(term, 1, filters).catch(() => null);
      return { term, hits: page?.total ?? 0 };
    }),
  );
  return results.filter((entry) => entry.hits > 0).sort((a, b) => b.hits - a.hits);
}

async function searchTools(site: string, args: Record<string, unknown>): Promise<ToolResultText> {
  const query = String(args.query ?? "").trim();
  if (!query) return { text: "query 不能为空", isError: true };

  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(args.limit ?? DEFAULT_LIMIT) || DEFAULT_LIMIT));
  const scene = typeof args.scene === "string" ? (args.scene as SceneId) : undefined;
  const platform = typeof args.platform === "string" ? (args.platform as Platform) : undefined;

  const page = await searchCatalog(query, 1, {
    scenes: scene ? [scene] : undefined,
    platforms: platform ? [platform] : undefined,
  });
  const sliced = page.items.slice(0, limit);

  if (!sliced.length) {
    return { text: await explainEmpty(query, scene, platform) };
  }

  // 搜索结果只带卡片字段，许可证、外链要逐条取详情 —— 最多 12 条，成本可控。
  const details = await Promise.all(sliced.map((item) => getSoftware(item.slug)));
  const lines: string[] = [];

  const scope = [scene ? "场景 " + scene : null, platform ? "平台 " + platform : null].filter(Boolean).join("，");
  lines.push(`「${query}」匹配 ${page.total} 条${scope ? "（" + scope + "）" : ""}，返回前 ${sliced.length} 条：`);

  sliced.forEach((item, index) => {
    const detail = details[index];
    const tags = [
      item.platforms.map((value) => platformLabel[value]).join(" · "),
      sourceLabel[item.source],
      detail?.license ? `许可 ${detail.license}` : null,
      item.price ?? "免费",
    ].filter(Boolean);
    lines.push("");
    const zh = item.nameZh && item.nameZh !== item.name ? "（" + item.nameZh + "）" : "";
    lines.push(`${index + 1}. ${item.name}${zh} — ${item.summary}`);
    lines.push(`   ${tags.join(" ｜ ")}`);
    lines.push(`   ${site}/software/${item.slug}`);
  });

  if (page.corrected) {
    // 悄悄换掉查询词是不诚实的：模型据此回答「搜的是 X」会与用户输入不符。
    lines.push("");
    lines.push(`注：原查询无结果，已按「${page.corrected}」重搜。`);
  }
  lines.push("");
  lines.push(`需要完整信息（适合谁、安装步骤、同类替代）时调 get_tool，slug 见上面链接末尾。`);

  return { text: lines.join("\n") };
}

async function getTool(site: string, args: Record<string, unknown>): Promise<ToolResultText> {
  const slug = String(args.slug ?? "").trim();
  if (!slug) return { text: "slug 不能为空", isError: true };

  const item = await getSoftware(slug);
  if (!item) {
    return {
      text: `目录里没有 slug 为「${slug}」的条目。先用 search_tools 搜一下，slug 是详情页链接的最后一段。`,
      isError: true,
    };
  }

  const alternatives = await alternativesOf(item).catch(() => []);
  const lines: string[] = [];
  const zh = item.nameZh && item.nameZh !== item.name ? "（" + item.nameZh + "）" : "";
  lines.push(`# ${item.name}${zh}`);
  lines.push("");
  lines.push(item.summary);
  lines.push("");

  const meta = [
    "平台：" + item.platforms.map((value) => platformLabel[value]).join(" · "),
    "类型：" + kindLabel[item.kind] + " ｜ 来源：" + sourceLabel[item.source],
    item.version ? "版本：" + item.version : null,
    item.price ? "价格：" + item.price : "价格：免费",
    licenseLabel(item.license) ? "许可：" + licenseLabel(item.license) : null,
    item.linksCheckedAt ? "链接核验：" + item.linksCheckedAt : null,
    item.updatedAt ? "更新：" + formatDate(item.updatedAt) : null,
  ].filter(Boolean) as string[];
  for (const line of meta) lines.push("- " + line);

  const linkLabels: Record<string, string> = { official: "官网", homepage: "主页", github: "源码", disk: "镜像" };
  for (const [key, label] of Object.entries(linkLabels)) {
    const url = (item.links as Record<string, string | undefined>)[key];
    if (url) lines.push(`- ${label}：${url}`);
  }
  lines.push(`- 详情页：${site}/software/${item.slug}`);

  if (item.whoFor) {
    lines.push("");
    lines.push("## 适合");
    lines.push(item.whoFor);
  }
  if (item.whoNot) {
    lines.push("");
    lines.push("## 不适合");
    lines.push(item.whoNot);
  }
  if (item.tutorial.length) {
    lines.push("");
    lines.push("## 上手步骤");
    item.tutorial.forEach((step, index) => lines.push(`${index + 1}. ${step}`));
  }
  if (item.body.trim()) {
    lines.push("");
    lines.push("## 正文");
    lines.push(item.body.trim());
  }
  if (alternatives.length) {
    lines.push("");
    lines.push("## 同类替代");
    for (const alt of alternatives) lines.push(`- ${alt.name}（${site}/software/${alt.slug}）：${alt.summary}`);
  }
  if (item.guide?.markdown) {
    lines.push("");
    lines.push(`详细教程（约 ${Math.round(item.guide.markdown.length / 500) * 500} 字）在详情页，这里不展开：${site}/software/${item.slug}`);
  }

  return { text: lines.join("\n") };
}

async function listScenes(site: string): Promise<ToolResultText> {
  const counts = await catalogCounts();
  const lines = ["Ashare 按使用场景组织，共 " + counts.total + " 条：", ""];
  for (const scene of scenes) {
    lines.push(`- ${scene.id}（${scene.name}，${counts.scenes[scene.id] ?? 0} 条）：${scene.description}`);
  }
  lines.push("");
  lines.push(`场景页示例：${site}/scenes/code`);
  return { text: lines.join("\n") };
}
