export type SceneId =
  | "code"
  | "docs"
  | "design"
  | "data"
  | "office"
  | "engineering"
  | "tools"
  | "photo"
  | "games"
  | "education"
  | "music"
  | "social";

export type Platform = "windows" | "macos" | "linux";

export type SourceKind = "official" | "opensource" | "discount";

export type ItemKind = "app" | "script" | "opensource";

export type PublishStatus = "draft" | "published";

export type Scene = {
  id: SceneId;
  name: string;
  description: string;
};

export type ItemLinks = {
  official?: string;
  homepage?: string;
  github?: string;
  disk?: string;
  diskNote?: string;
  /**
   * 镜像里某个具体文件的 SHA-256，64 位小写十六进制、不含分隔符。
   *
   * 为什么单独加字段而不是塞进 diskNote：校验值是**机器可校验**的信息，
   * 说明文字是人读的。混在一段散文里读者没法直接复制去比对。
   * 前台会把它渲染成独立的一行，并附上可直接粘贴的校验命令。
   */
  diskSha256?: string;
  /**
   * diskSha256 对应的文件名（含版本号）。
   *
   * 必须与 diskSha256 成对出现：哈希不指明文件，读者无从校验；
   * 只写文件名不给哈希，则等于没校验。两个都缺才是正常的「未提供校验」。
   */
  diskFile?: string;
};

/**
 * 教程资源形态。决定图标、角标与打开方式，不影响存储结构。
 *
 * 分成这五种而不是笼统的「附件」，是因为读者的动作不同：
 * markdown 要在页面上读，pdf / html 要新标签打开看，
 * image 是插图（只能站内，外链图会被 CSP 挡掉），link 只是延伸阅读。
 */
export type GuideResourceKind = "markdown" | "pdf" | "html" | "image" | "link";

export type GuideResource = {
  kind: GuideResourceKind;
  /** 展示标题，如「官方使用手册」 */
  title: string;
  /** https 外链；markdown 另允许站内 /media/ 文件，image 只允许站内 */
  url: string;
  /** 一句话说明：这个资源解决什么问题 */
  note?: string;
};

/**
 * 详细教程。放在「上手步骤」之后、「同类替代」之前：
 * 步骤回答「怎么开始」，教程回答「遇到具体问题怎么办」。
 *
 * `markdown` 是站内渲染的正文（不是纯文本 —— 需要小标题、代码块与行内链接），
 * `resources` 是配套的 PDF / HTML 手册与插图。
 */
export type Guide = {
  /** 一句话导读，说明这篇教程覆盖到哪一步 */
  intro?: string;
  markdown?: string;
  resources: GuideResource[];
};

export type Software = {
  slug: string;
  name: string;
  nameZh?: string;
  aliases: string[];
  kind: ItemKind;
  status: PublishStatus;
  tags: string[];
  summary: string;
  body: string;
  scenes: SceneId[];
  platforms: Platform[];
  source: SourceKind;
  /** 卡片价格位展示；留空视为免费，可填「会员 ¥68/月」这类短文案 */
  price?: string;
  links: ItemLinks;
  tutorial: string[];
  /** 详细教程。缺省即前台不渲染该区块，无需迁移存量数据。 */
  guide?: Guide;
  whoFor: string;
  whoNot: string;
  discountNote?: string;
  alternatives: string[];
  featured?: boolean;
  previews: string[];
  iconImage?: string;
  createdAt?: string;
  updatedAt?: string;
  /** SPDX 许可证标识，如 GPL-3.0-only。核验不到时留空，不要猜。 */
  license?: string;
  /** 条目描述的版本号，如 4.9.8。 */
  version?: string;
  /** 链接最近一次人工核验的日期（YYYY-MM-DD），用于发现死链。 */
  linksCheckedAt?: string;
  icon: {
    letter: string;
    color: string;
    simpleIcon?: string;
  };
};

/** 列表跨服务端/客户端边界时只发送卡片所需字段。 */
export type CatalogItem = Pick<Software,
  | "slug" | "name" | "nameZh" | "kind" | "tags" | "summary"
  | "scenes" | "platforms" | "source" | "price" | "featured"
  | "previews" | "iconImage" | "icon"
>;

export type Submission = {
  id: string;
  at: string;
  kind: ItemKind;
  name: string;
  url: string;
  need: string;
};

export type FeedbackEntry = {
  id: string;
  at: string;
  type: "correction" | "issue" | "other";
  slug?: string;
  contact?: string;
  content: string;
  read?: boolean;
};

export type CatalogCounts = {
  total: number;
  discount: number;
  kinds: Record<ItemKind, number>;
  scenes: Record<SceneId, number>;
  platforms: Record<Platform, number>;
};

/** data/software.ts 的原始形态（首次启动灌入 store 前的静态种子） */
export type SeedSoftware = {
  slug: string;
  name: string;
  nameZh?: string;
  aliases: string[];
  summary: string;
  scenes: SceneId[];
  platforms: Platform[];
  source: SourceKind;
  price?: string;
  officialUrl: string;
  officialLabel: string;
  discountNote?: string;
  whoFor: string;
  whoNot: string;
  installTips: string[];
  alternatives: string[];
  /** 可选：详细教程。缺省即前台不渲染该区块。 */
  guide?: Guide;
  featured?: boolean;
  icon: {
    letter: string;
    color: string;
    simpleIcon?: string;
  };
  /** 可选：种子里直接写正文，缺省为空串（历史行为）。写了才能让全新部署也有内容。 */
  body?: string;
  /** 可选：种子里直接写标签，缺省为空数组。 */
  tags?: string[];
  /** 可选：缺省由 source 推导；source 标 opensource 但实际闭源时（如 GeoGebra）必须显式写。 */
  kind?: ItemKind;
  /** 可选：SPDX 许可证标识。与 Software.license 同名对应。 */
  license?: string;
  /** 可选：条目描述的版本号。与 Software.version 同名对应。 */
  version?: string;
  /** 可选：链接最近一次人工核验的日期（YYYY-MM-DD）。与 Software.linksCheckedAt 同名对应。 */
  linksCheckedAt?: string;
  /** 可选：缺省为 `{ official: officialUrl }`。需要额外给 github / mirror 时填写。 */
  links?: ItemLinks;
};
