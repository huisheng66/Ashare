import {
  BriefcaseBusiness,
  Camera,
  ChartColumn,
  CodeXml,
  DraftingCompass,
  FileText,
  Gamepad2,
  GraduationCap,
  MessagesSquare,
  Music,
  PenTool,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { SceneId } from "@/data/types";
import { sceneTone } from "@/lib/colors";

export const sceneIcons: Record<SceneId, LucideIcon> = {
  code: CodeXml,
  docs: FileText,
  design: PenTool,
  data: ChartColumn,
  office: BriefcaseBusiness,
  engineering: DraftingCompass,
  tools: Wrench,
  photo: Camera,
  games: Gamepad2,
  education: GraduationCap,
  music: Music,
  social: MessagesSquare,
};

/** 场景贴纸：场景色图标 + 同色浅底，颜色见 claudedesign.md 3.4。 */
export function SceneIcon({
  id,
  size = 32,
  className = "",
}: {
  id: SceneId;
  size?: number;
  className?: string;
}) {
  const Icon = sceneIcons[id];
  const glyph = Math.round(size * 0.5);
  return (
    <span
      aria-hidden="true"
      className={`tone-soft inline-flex shrink-0 items-center justify-center rounded-[30%] ${className}`}
      style={{ ...sceneTone(id), width: size, height: size }}
    >
      <Icon strokeWidth={1.75} style={{ width: glyph, height: glyph }} />
    </span>
  );
}
