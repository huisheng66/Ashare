import type { Scene } from "./types";

export const scenes: Scene[] = [
  {
    id: "code",
    name: "写代码",
    tagline: "编辑器、版本、运行时",
    description:
      "从写第一行脚本到接数据库，先把编辑器、Git 和语言运行时装齐。",
  },
  {
    id: "docs",
    name: "写文档",
    tagline: "长文、文献、公式、PDF",
    description:
      "写材料、管文献、排公式、看 PDF。按你的文稿流程选，不必一次装全套。",
  },
  {
    id: "design",
    name: "做设计",
    tagline: "界面、图像、三维、绘图",
    description:
      "做界面稿、改图、建模或手绘。商业订阅之外都有可长期用的开源选项。",
  },
  {
    id: "data",
    name: "做数据",
    tagline: "表格、统计、可视化",
    description:
      "算数、画图、跑分析。有的点选就能出结果，有的需要写一点代码。",
  },
  {
    id: "office",
    name: "办公协作",
    tagline: "文档、邮件、笔记、传输",
    description:
      "改表格、写邮件、记笔记、把文件拷到另一台电脑。优先选不捆绑的官方渠道。",
  },
  {
    id: "engineering",
    name: "工程制图",
    tagline: "CAD、电路、仿真、地图",
    description:
      "画零件、布电路、做三维或地图。商业套件很贵时，先看开源能否覆盖这道工序。",
  },
];

export const sceneById = Object.fromEntries(
  scenes.map((scene) => [scene.id, scene]),
) as Record<Scene["id"], Scene>;
