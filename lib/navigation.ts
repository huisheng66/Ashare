import { scenes } from "@/data/scenes";
import { sceneColors } from "@/lib/colors";

export const navigationGroups = [
  { label: "浏览", items: [{ href: "/", label: "探索", id: "explore", color: "#007AFF" }] },
  { label: "类别", items: scenes.map((scene) => ({ href: `/scenes/${scene.id}`, label: scene.name, id: scene.id, color: sceneColors[scene.id] })) },
  { label: "更多", items: [
    { href: "/about", label: "收录标准", id: "about", color: "#30B0C7" },
    { href: "/feedback", label: "反馈", id: "feedback", color: "#FF9500" },
    { href: "/submit", label: "提交推荐", id: "submit", color: "#5856D6" },
  ] },
];
