export type SceneId =
  | "code"
  | "docs"
  | "design"
  | "data"
  | "office"
  | "engineering";

export type Platform = "windows" | "macos" | "linux";

export type SourceKind = "official" | "opensource" | "discount";

export type Scene = {
  id: SceneId;
  name: string;
  tagline: string;
  description: string;
};

export type Software = {
  slug: string;
  name: string;
  nameZh?: string;
  aliases: string[];
  summary: string;
  scenes: SceneId[];
  platforms: Platform[];
  source: SourceKind;
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
