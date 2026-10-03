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
