/** 顶栏与移动菜单共用的主导航；场景列表由 data/scenes.ts 生成。 */
export const primaryNav = [
  { href: "/", label: "探索" },
  { href: "/about", label: "收录标准" },
] as const;

/** 首页「试试」：只放能搜出结果的任务词，改目录后用 searchSoftware 复核。 */
export const taskSuggestions = ["论文", "笔记", "修图", "建模", "统计", "电路", "PDF", "传文件"];

export const nameSuggestions = ["VS Code", "Python", "Zotero", "Blender", "Obsidian", "LibreOffice", "KiCad", "JASP"];
