import type { Scene } from "./types";

export const scenes: Scene[] = [
  {
    id: "code",
    name: "开发",
    description:
      "从写第一行脚本到接数据库，先把编辑器、Git 和语言运行时装齐。",
  },
  {
    id: "docs",
    name: "文档",
    description:
      "写材料、管文献、排公式、看 PDF。按你的文稿流程选，不必一次装全套。",
  },
  {
    id: "design",
    name: "设计",
    description:
      "做界面稿、改图、建模或手绘。商业订阅之外都有可长期用的开源选项。",
  },
  {
    id: "data",
    name: "数据",
    description:
      "算数、画图、跑分析。有的点选就能出结果，有的需要写一点代码。",
  },
  {
    id: "office",
    name: "办公",
    description:
      "改表格、写邮件、记笔记、把文件拷到另一台电脑。优先选不捆绑的官方渠道。",
  },
  {
    id: "engineering",
    name: "制图",
    description:
      "画零件、布电路、做三维或地图。商业套件很贵时，先看开源能否覆盖这道工序。",
  },
  {
    id: "tools",
    name: "工具",
    description: "压缩、传输、系统维护这类通用小工具。",
  },
  {
    id: "photo",
    name: "摄影与录像",
    description: "看图、修图、剪辑与屏幕录制。",
  },
  {
    id: "games",
    name: "游戏",
    description: "游戏客户端、模拟器与联机平台。",
  },
  {
    id: "education",
    name: "教育",
    description: "课程、刷题、语言学习与教学工具。",
  },
  {
    id: "music",
    name: "音乐",
    description: "播放器、音频编辑与音乐制作。",
  },
  {
    id: "social",
    name: "社交",
    description: "聊天、社区与通讯客户端。",
  },
];

export const sceneById = Object.fromEntries(
  scenes.map((scene) => [scene.id, scene]),
) as Record<Scene["id"], Scene>;
