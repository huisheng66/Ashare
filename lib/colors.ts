import type { CSSProperties } from "react";
import type { SceneId } from "@/data/types";

/** 场景色定义在 globals.css（--scene-*，深浅各一套）；组件用 --tone 取用。 */
export function sceneTone(id: SceneId): CSSProperties {
  return { "--tone": `var(--scene-${id})` } as CSSProperties;
}
