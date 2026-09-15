export type SceneId =
  | "code"
  | "docs"
  | "design"
  | "data"
  | "office"
  | "engineering";

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
  icon: {
    letter: string;
    color: string;
    simpleIcon?: string;
  };
};

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
};
