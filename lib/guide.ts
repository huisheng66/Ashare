import type { Guide, GuideResource, GuideResourceKind } from "@/data/types";
import { isHttpUrl, mediaParts } from "./input-validation.ts";
import { safeHref, safeImageSrc } from "./markdown.ts";

/**
 * 教程资源的形状、校验与行式编解码。
 *
 * 后台表单只能提交字符串，所以资源在表单里是「一行一个」的紧凑写法
 * （`类型 | 标题 | 链接 | 说明`）。这层编解码与校验放在纯函数里，
 * 后台保存与 ingest 脚本共用，避免同一套规则写两遍后各自跑偏。
 */

/** 合法资源类型即白名单：表单、种子、脚本三处都只能填这些值。 */
export const GUIDE_KIND_LABELS: Record<GuideResourceKind, string> = {
  markdown: "Markdown 文档",
  pdf: "PDF 手册",
  html: "HTML 网页",
  image: "插图",
  link: "延伸链接",
};

/** 供后台 <select> 与校验共用的顺序表。 */
export const GUIDE_KINDS = Object.keys(GUIDE_KIND_LABELS) as GuideResourceKind[];

export function isGuideKind(value: string): value is GuideResourceKind {
  return GUIDE_KINDS.includes(value as GuideResourceKind);
}

/** 与 next.config.ts 的 36mb 请求上限配套，给单篇教程留足余量。 */
export const GUIDE_LIMITS = {
  intro: 300,
  markdown: 40_000,
  resources: 12,
  title: 100,
  url: 2048,
  note: 300,
} as const;

/**
 * 图片只能是站内上传路径。
 *
 * 与 `safeImageSrc` 同一口径，但这里要**报错**而不是降级：填了外链图却不提示，
 * 编辑只会看到前台缺图，不会知道原因。
 */
export function checkResourceUrl(kind: GuideResourceKind, url: string, allowHttp: boolean): string | undefined {
  if (!url) return "资源链接不能为空";
  if (kind === "image") {
    return mediaParts(url) ? undefined : "插图只能用本站已上传的图片（/media/ 路径）";
  }
  // markdown 允许指向站内已上传的文件，与图片共用 mediaParts 白名单。
  if (mediaParts(url)) {
    return kind === "markdown" ? undefined : `${GUIDE_KIND_LABELS[kind]}请填写 https 链接，不要填站内图片路径`;
  }
  if (!isHttpUrl(url, allowHttp)) return "资源链接格式不正确，请使用不含账户密码的 HTTPS 地址";
  return undefined;
}

/**
 * 校验一个教程对象，返回问题列表（空数组表示通过）。
 *
 * 与 `validateSemantics` 同一形状：一次返回全部问题，
 * 否则编辑要提交好几次才知道自己错了几处。
 */
export function validateGuide(guide: Guide | undefined, options: { allowHttp?: boolean } = {}): string[] {
  if (!guide) return [];
  const allowHttp = options.allowHttp ?? false;
  const problems: string[] = [];

  if ((guide.intro?.length ?? 0) > GUIDE_LIMITS.intro) {
    problems.push(`教程导读过长（最多 ${GUIDE_LIMITS.intro} 字）`);
  }
  if ((guide.markdown?.length ?? 0) > GUIDE_LIMITS.markdown) {
    problems.push(`教程正文过长（最多 ${GUIDE_LIMITS.markdown} 字）`);
  }
  if (!guide.resources) return problems;

  if (guide.resources.length > GUIDE_LIMITS.resources) {
    problems.push(`教程资源最多 ${GUIDE_LIMITS.resources} 条`);
  }
  for (const [position, resource] of guide.resources.entries()) {
    const at = `第 ${position + 1} 条资源`;
    if (!isGuideKind(resource.kind)) problems.push(`${at}的类型无效`);
    if (!resource.title?.trim()) problems.push(`${at}缺少标题`);
    else if (resource.title.length > GUIDE_LIMITS.title) problems.push(`${at}标题过长`);
    const urlProblem = checkResourceUrl(resource.kind, resource.url, allowHttp);
    if (urlProblem) problems.push(`${at}：${urlProblem}`);
    if ((resource.note?.length ?? 0) > GUIDE_LIMITS.note) problems.push(`${at}说明过长`);
  }
  return problems;
}

/** 教程是否为空：三个字段都没内容时前台不渲染，也无需写进 store。 */
export function isGuideEmpty(guide: Guide | undefined): boolean {
  if (!guide) return true;
  return !guide.intro?.trim() && !guide.markdown?.trim() && !guide.resources?.length;
}

/** 收敛成可直接落库的形态：空教程返回 undefined，资源去空白。 */
export function normalizeGuide(guide: Guide | undefined): Guide | undefined {
  if (!guide || isGuideEmpty(guide)) return undefined;
  return {
    ...(guide.intro?.trim() ? { intro: guide.intro.trim() } : {}),
    ...(guide.markdown?.trim() ? { markdown: guide.markdown.trim() } : {}),
    resources: (guide.resources ?? [])
      .map((resource) => ({
        kind: resource.kind,
        title: resource.title.trim(),
        url: resource.url.trim(),
        ...(resource.note?.trim() ? { note: resource.note.trim() } : {}),
      }))
      .filter((resource) => resource.title && resource.url),
  };
}

/**
 * 教程正文的安全外链集合，供死链巡检探活。
 *
 * 正文里的链接同样是会烂掉的链接。这里只收能通过 `safeHref` 的目标 ——
 * 解析不出目标的部分前台根本不渲染成链接，探它没有意义。
 */
export function guideUrls(guide: Guide | undefined): string[] {
  if (!guide) return [];
  const urls: string[] = [];
  const add = (raw: string) => {
    const href = safeHref(raw);
    // 站内 /media/ 是上传的图片文件，由 guideImages 单独负责，
    // 混进外链清单只会让探活脚本拿到一个空 host。
    if (href && !href.startsWith("/")) urls.push(href);
  };
  for (const resource of guide.resources) add(resource.url);
  // 图片语法 ![](x) 不会被这个模式匹配到，它归 guideImages 管。
  for (const match of (guide.markdown ?? "").matchAll(/\[[^\]]*\]\(([^()\s]*(?:\([^()]*\)[^()\s]*)*)\)/g)) add(match[1]);
  return [...new Set(urls)];
}

/** 正文里的站内插图路径，供图片失效巡检复用。 */
export function guideImages(guide: Guide | undefined): string[] {
  if (!guide?.markdown) return [];
  const images: string[] = [];
  for (const match of guide.markdown.matchAll(/!\[[^\]]*\]\(([^()\s]*(?:\([^()]*\)[^()\s]*)*)\)/g)) {
    const src = safeImageSrc(match[1]);
    if (src) images.push(src);
  }
  return [...new Set(images)];
}

/**
 * 一行一个资源的紧凑格式：`类型 | 标题 | 链接 | 说明`。
 * 说明可省略。返回「资源 + 无法解析的行」，让调用方能报错而不是静默丢内容。
 */
export function parseGuideLines(raw: string): { resources: GuideResource[]; invalid: string[] } {
  const resources: GuideResource[] = [];
  const invalid: string[] = [];

  raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const [kind, ...rest] = line.split("|").map((part) => part.trim());
      if (!isGuideKind(kind)) {
        invalid.push(`第 ${index + 1} 行：类型「${kind}」无效，可用 ${GUIDE_KINDS.join(" / ")}`);
        return;
      }
      // 末段是说明，只有三段时说明可省；用剩余段数判断，避免链接里的 | 被误切。
      const tail = rest[rest.length - 1] ?? "";
      const hasNote = rest.length >= 3;
      const note = hasNote ? tail : undefined;
      const head = hasNote ? rest.slice(0, -1) : rest;
      const [title, url] = head;
      if (!title || !url) {
        invalid.push(`第 ${index + 1} 行：需要「类型 | 标题 | 链接」，说明可省略`);
        return;
      }
      resources.push({ kind, title, url, ...(note ? { note } : {}) });
    });

  return { resources, invalid };
}

/** 行式格式回填给表单。 */
export function formatGuideLines(resources: readonly GuideResource[] | undefined): string {
  return (resources ?? [])
    .map((resource) =>
      // 说明为空时不留尾随分隔符，否则回填后每次保存都会多出一段空白。
      [resource.kind, resource.title, resource.url, resource.note].filter(Boolean).join(" | "),
    )
    .join("\n");
}