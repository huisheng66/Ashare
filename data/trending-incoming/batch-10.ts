// 第 10 条：stremio-web。内容全部核实自官方 README（Features / How it works /
// Getting started 命令表 / Ecosystem 表 / License），未凭印象。
export const entries = {
  "stremio-web": {
    slug: "stremio-web",
    name: "Stremio Web",
    nameZh: "Stremio 网页版",
    aliases: ["stremio", "stremio web", "web.stremio", "媒体中心", "影视聚合", "追剧"],
    summary:
      "Stremio 官方网页版媒体中心：addon 驱动的影视目录、跨设备同步、Chromecast 投屏、可装成 PWA。",
    scenes: ["tools", "social"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["媒体中心", "影视", "PWA", "开源", "投屏"],
    body:
      "Stremio Web 是 Stremio 的官方网页版界面，一个现代媒体中心——它的定位是「视频娱乐的一站式方案」。直接打开 https://web.stremio.com 就能用，不需要安装桌面客户端。\n**它的核心机制是 addon（插件）驱动的。** 电影、剧集、频道的目录来自 addon 提供的目录数据，而不是内置数据库。这决定了 Stremio 和传统媒体库应用的根本差别：**内容来源是可替换的**，装什么 addon 就有什么内容。字幕也走 addon，或者用本地的，并且样式可自定义。\n实用功能上：库（Library）和「继续观看」跟着 Stremio 账号跨设备同步；支持 Chromecast 投到电视；**播放器是键盘优先的**，不放鼠标也能控制全部播放；50 多种语言，由社区通过 stremio-translations 翻译；可作为独立 PWA 安装（装完有自己的图标，不走浏览器标签页）。\n**架构上它是一个「React 外壳 + Rust 内核」的组合，这一点值得单独说**，因为它不是纯前端项目：\n- 界面是 React（本仓库）\n- 真正干活的是 **stremio-core** —— Stremio 的 Rust 引擎，编译成 WebAssembly 跑在 Web Worker 里\n- 播放走 **stremio-video**，它会按当前环境挑选合适的播放器实现\n\n一句话概括分工：**UI 渲染状态，core 计算状态。** 所以它的性能特征更接近原生应用而不是网页。\n生态是它最强的部分，围绕它有一整套仓库：stremio-core（状态、addon 协议、库、同步）、stremio-video（播放器抽象）、stremio-translations（社区翻译）、**stremio-addon-sdk（用 Node.js 写自己的 addon）**。最后一个意味着你可以自己做一个 addon 加进任何 Stremio 客户端，包括网页版。\n要提前知道的两件事：一是**它需要账号**——同步功能依赖 Stremio 账号，本地播放不需要；二是**内容来源取决于你装的 addon**，官方不提供内容，它是目录和播放器的框架。所以「装上就能看」这个预期要调整：需要自己找到合适的 addon 并配置，这是它生态的运作方式。\n想自己部署一份的话也有官方 Docker 镜像。许可证是 GPL-2.0。",
    officialUrl: "https://web.stremio.com",
    links: {
      official: "https://web.stremio.com",
      github: "https://github.com/Stremio/stremio-web",
    },
    officialLabel: "web.stremio.com",
    whoFor:
      "想要一个不装客户端、开浏览器就能用、能投屏、能装成 PWA，并且愿意自己配置 addon 生态的媒体中心用户。",
    whoNot:
      "期待「装完就有影视库」的人——它不提供内容，内容来自你配置的 addon；或者不想注册账号的人——同步功能需要 Stremio 账号。",
    installTips: [
      "直接用：打开 https://web.stremio.com 就能用，不需要安装任何东西。",
      "想当原生应用用：在浏览器里把它装成 PWA，装完有独立图标、独立窗口。",
      "第一次用先解决 addon——内容目录全部来自 addon，官方不提供内容库。装完 addon 才有东西可看。",
      "要投屏用 Chromecast；键盘优先的播放器不放鼠标也能控制全部播放。",
      "想自己部署：docker build -t stremio-web . 然后 docker run -p 8080:8080 stremio-web。",
    ],
    alternatives: [],
    icon: { letter: "S", color: "#7B5BF5", simpleIcon: "film" },
    guide: {
      intro: "从直接打开网页版到理解它的 Rust 内核架构，再说明 addon 生态该怎么上手。",
      markdown: `# Stremio Web：浏览器里的媒体中心

## 先用起来

打开 [web.stremio.com](https://web.stremio.com) 就能用，不用装任何东西。

**但第一次用会看到一个空界面，这是正常的。** Stremio 不提供影视内容——它的目录数据全部来自 addon。你需要先装 addon，才会有东西可看。

## 为什么内容要靠 addon

这是理解 Stremio 最关键的一点。它不是一个「影视库应用」，而是一个**媒体中心框架**：

- 电影、剧集、频道的目录来自 addon 提供的目录数据
- 字幕也来自 addon，或者用本地文件（样式可自定义）
- 内容来源是**可替换的**——装什么 addon 就有什么内容

所以「装上就能看」这个预期要调整。找 addon、装 addon、配 addon 是使用它的一部分。

## 功能清单

| 功能 | 说明 |
|---|---|
| Addon 驱动 | 从 addon 目录发现电影、剧集和频道 |
| 跨设备同步 | 库和「继续观看」跟着 Stremio 账号走 |
| 投屏 | 通过 Chromecast 播到大屏 |
| 字幕 | addon 提供或本地，样式可定制 |
| 键盘优先播放器 | 不碰鼠标也能控制全部播放 |
| 50+ 语言 | 社区通过 stremio-translations 翻译 |
| 可安装 | 作为独立 PWA 运行 |

**装成 PWA 值得试**：装完有独立图标和独立窗口，用起来更像本地应用而不是网页标签页。

## 架构：React 外壳 + Rust 内核

这不是一个纯前端项目，搞清楚分工有助于理解它的行为：

- 界面是 **React**（本仓库）
- 真正干活的是 **stremio-core** —— Stremio 的 Rust 引擎，**编译成 WebAssembly 跑在 Web Worker 里**
- 播放走 **stremio-video**，它会按当前环境挑选合适的播放器实现

\`\`\`text
React UI  <-->  stremio-core (Rust → WASM, Web Worker)
                ↕                ↕
           Stremio API        Addons
React UI  -->  stremio-video
\`\`\`

一句话：**UI 渲染状态，core 计算状态。** 所以它的性能特征更接近原生应用而不是网页——后台计算不阻塞界面。

## 账号这件事

**需要 Stremio 账号**，同步功能（库、继续观看）依赖它。本地播放不需要账号。

如果只是在一台设备上看看不同步，其实可以先不管账号——但跨设备接着看是它比较实用的一个能力，值得注册。

## 生态：它最强的地方

围绕 stremio-web 有一整套官方仓库：

| 仓库 | 是什么 |
|---|---|
| [stremio-core](https://github.com/Stremio/stremio-core) | Rust 引擎：状态、addon 协议、库、同步 |
| [stremio-video](https://github.com/Stremio/stremio-video) | 这个界面用的播放器抽象 |
| [stremio-translations](https://github.com/Stremio/stremio-translations) | 社区翻译 |
| [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk) | **用 Node.js 写自己的 addon** |

**最后一行是重点。** 有了 SDK 你可以自己做一个 addon，加进任何 Stremio 客户端——包括这个网页版。这说明它的 addon 生态是开放的，不是封闭的官方商店。

## 自己跑一份

**直接用 Docker：**

\`\`\`bash
docker build -t stremio-web .
docker run -p 8080:8080 stremio-web
\`\`\`

## 从源码开发

需要 Node.js 22+ 和 pnpm 11+：

\`\`\`bash
pnpm install
pnpm start
\`\`\`

开发服务器跑在 \`http://localhost:8080\`。

| 命令 | 作用 |
|---|---|
| \`pnpm start\` | 开发服务器，带热重载 |
| \`pnpm run start-prod\` | 生产模式的开发服务器 |
| \`pnpm run build\` | 生产构建 |
| \`pnpm test\` | 跑测试 |
| \`pnpm run lint\` | 代码检查 |
| \`pnpm run scan-translations\` | 检查缺失的翻译键 |

最后一条对做汉化的人有用——它能告诉你哪些文案还没有中文。

## 参与贡献

Bug 报告和 PR 都欢迎，官方推荐从 \`good first issue\` 标签开始。想把 Stremio 翻译成你的语言，去 stremio-translations 贡献。

## 许可证

GPL-2.0，版权归 Smart Code OOD（2017-2026）。
`,
      resources: [
        {
          kind: "link",
          title: "在线版 web.stremio.com",
          url: "https://web.stremio.com",
          note: "官方网页版本体，不用安装即可使用。首次打开是空界面属正常——需要先装 addon 才有内容目录。",
        },
        {
          kind: "link",
          title: "stremio-addon-sdk：用 Node.js 写自己的 addon",
          url: "https://github.com/Stremio/stremio-addon-sdk",
          note: "生态开放的证据。写好的 addon 能加进任何 Stremio 客户端，包括网页版。",
        },
        {
          kind: "link",
          title: "stremio-core：Rust 引擎的源码",
          url: "https://github.com/Stremio/stremio-core",
          note: "理解它的性能特征要先看这个：状态、addon 协议、库和同步都在这里，编译成 WASM 跑在 Web Worker 里。",
        },
      ],
    },
  },
};
