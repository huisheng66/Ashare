// 录入脚本用到的枚举与常量。
//
// 单独抽出来是因为 data/types.ts 里的类型是**类型**（编译期），
// 运行时拿不到值；而校验新条目需要真实的取值列表。
//
// 这里从 data/types.ts 手工同步。**改 types.ts 的枚举时必须同步改这里** ——
// 漏改的后果是校验放行了非法值，tsc 才报错，而录入流程已经写完文件了。
// tests/guide.test.mjs 里有断言守着两者的同步关系。
export const SCENE_IDS = [
  "code", "docs", "design", "data", "office",
  "engineering", "tools", "photo", "games", "education", "music", "social",
];

export const PLATFORMS = ["windows", "macos", "linux"];

export const SOURCE_KINDS = ["official", "opensource", "discount"];

/** data/types.ts 里 SceneId 联合类型中枚举字面量的出现次数，用来检测漏同步。 */
export const SCENE_ID_COUNT_IN_TYPES = 12;
