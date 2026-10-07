// 第 9 条：yoinks。内容全部核实自官方 README（Install / Usage / How it works /
// Roadmap 全表）与 npm registry 元信息，未凭印象。
export const entries = {
  yoinks: {
    slug: "yoinks",
    name: "yoinks",
    nameZh: "yoinks",
    aliases: ["yoinks", "视频下载", "yt-dlp 前端", "命令行下载", "terminal downloader"],
    summary:
      "终端里的视频下载器：粘贴链接、选分辨率或 mp3 就完事，支持 1800 多个站点，UI 是 React 写的终端界面。",
    scenes: ["tools", "social"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["命令行", "视频下载", "yt-dlp", "终端 UI", "开源"],
    body:
      "yoinks 是终端里的视频下载工具：粘贴一个链接、选一个分辨率（或者只要音频的 mp3）、完成。支持 YouTube、X/Twitter、Instagram、Threads、TikTok 和 1800 多个其他站点。\n它解决的痛点不是「能不能下载」——yt-dlp 早就能下载了——而是**yt-dlp 的命令行参数组合有多难记**。yoinks 把它包成一个全屏居中的终端界面：↑/↓（或 j/k，或数字键）选格式，回车确认，esc 返回，^c 退出。鼠标也能用，yoink 按钮、格式列表、页脚提示都可点，点头像回首页。**退出时会恢复你的 scrollback**，这点对经常在终端里干活的人很重要。\n工程上它很克制。底层就是 yt-dlp——**首次运行时下载独立的 yt-dlp 二进制到 \`~/.yoinks/bin\`，不需要装 Python**；你本地已经有 yt-dlp 就用你的。ffmpeg 从 PATH 找，找不到时用打包的 ffmpeg-static 兜底（合并高清流和提取 mp3 需要它）。UI 层用 Ink，也就是「终端里的 React」。\n**默认 auto 主题用的是你自己终端的前景色和背景色**，所以它自动跟随你的明暗主题，不需要猜。按 ^t 或点页脚的主题控件能在 auto / light / dark 之间循环（仅当次会话），\`--theme\` 参数可以指定某次启动的初始主题。\n文件默认存到 \`~/Downloads\`，下完把路径打印到终端。\n要提前知道的是**它现在还不能脚本化**：\`--best\` 和 \`--mp3\` 这类跳过选择器的标志、以及 \`-o <dir>\` 指定输出目录，都还在 roadmap 上。所以现在每次下载都要经过那个交互界面——批量或定时下载的场景它帮不上。roadmap 里还有播放列表/长帖多视频支持、剪贴板检测、自更新内置的 yt-dlp 二进制。\n作者在 README 里写了一段关于合理使用的话，值得原样记住：yoinks 是个人归档工具，下载内容可能违反平台服务条款，只下载你有权保留的内容，并对创作者保持尊重。\n代价：需要 Node 18+；它下载并执行第三方二进制（yt-dlp），介意供应链的话要自己评估。",
    officialUrl: "https://github.com/pablostanley/yoinks",
    links: {
      official: "https://github.com/pablostanley/yoinks",
      github: "https://github.com/pablostanley/yoinks",
    },
    officialLabel: "github.com/pablostanley/yoinks",
    whoFor: "在终端里干活、想下载自己有权保留的视频、不想记 yt-dlp 参数组合的人。",
    whoNot:
      "需要批量或脚本化下载的人——跳过选择器的 --best / --mp3 还在 roadmap；或者介意自动下载并执行第三方二进制的人。",
    installTips: [
      "全局装：npm install -g yoinks。不装也行：npx yoinks 直接跑。",
      "要求 Node 18+。yt-dlp 和 ffmpeg 会被自动获取或打包，不用自己装。",
      "第一次跑会下载独立的 yt-dlp 二进制到 ~/.yoinks/bin；本地已有 yt-dlp 就直接用你的。",
      "默认主题跟随你终端的配色。想固定：yoinks --theme light 或 --theme dark；运行中按 ^t 循环切换。",
      "文件下到 ~/Downloads，完事会把路径打印到终端。",
    ],
    alternatives: [],
    icon: { letter: "Y", color: "#7B3FA0", simpleIcon: "terminal" },
    guide: {
      intro: "从安装到交互界面的按键约定，再讲清它现在还不能做什么（roadmap 里的脚本化能力）。",
      markdown: `# yoinks：终端里的视频下载

## 它包的是什么

底层就是 **yt-dlp**——你已经有 yt-dlp 的话，yoinks 解决的是参数组合难记的问题，不是下载能力本身。

\`\`\`sh
npm install -g yoinks
\`\`\`

或者不装直接跑：

\`\`\`sh
npx yoinks
\`\`\`

要求 Node 18+。其余依赖会自动获取或打包。

## 三条最常用的命令

\`\`\`sh
yoinks https://youtu.be/dQw4w9WgXcQ    # 直接进格式选择
yoinks                                 # 提示你输入 url
yoinks --theme light                   # 强制浅色配色
\`\`\`

## 界面怎么操作

yoinks 会接管终端（全屏、居中，**退出时恢复你的 scrollback**）：

| 操作 | 按键 |
|---|---|
| 选格式 | ↑/↓、j/k，或数字键 |
| 确认 | enter |
| 返回 | esc |
| 退出 | ^c |
| 循环主题 | ^t |

**鼠标也能用**：yoink 按钮、格式列表、页脚提示都可点，点 logo 回首页。

格式列表里除了各档分辨率，还有**只要音频的 mp3**，并标出预计文件大小。

## 主题

默认的 auto 主题**用你自己终端的前景色和背景色**，所以它会跟着你的明暗主题走，不用它猜。

- \`--theme auto\` / \`--theme light\` / \`--theme dark\` —— 指定某次启动的初始主题
- 运行中按 \`^t\` 或点页脚主题控件，在 auto / light / dark 之间循环（仅当次会话有效）

## 它怎么工作

- **yt-dlp** —— 首次运行时 yoinks 把独立的 yt-dlp 二进制下载到 \`~/.yoinks/bin\`，**不需要 Python**。你本地已经装了 yt-dlp 就用你的
- **ffmpeg** —— 从 PATH 找，找不到用打包的 \`ffmpeg-static\` 兜底。合并高清流和提取 mp3 需要它
- **UI** —— [Ink](https://github.com/vadimdemedes/ink)，也就是「终端里的 React」

## 现在还不能做的（别按脚本工具规划）

**roadmap 上还没实现的：**

- \`--best\` / \`--mp3\` 跳过选择器的标志（可脚本化模式）
- \`-o <dir>\` 指定输出文件夹
- 播放列表 / 长帖多视频支持
- 剪贴板检测（直接启动并自动建议你刚复制的 url）
- 内置 yt-dlp 二进制自更新

已完成的是发布到 npm（也就是 \`npm i -g yoinks\` / \`npx yoinks\` 那条）。

**这意味着现在每次下载都要走一遍交互界面。** 批量下载、定时下载、接进自动化流程——这些场景它帮不上。已完成的 checkbox 只有发布到 npm 那项。

## 开发

\`\`\`sh
npm install
npm run build        # 用 tsup 打包到 dist/
npm run dev          # 改动后重建
node dist/cli.js <url>
npm run typecheck
\`\`\`

想不发布就在本地当成全局命令用：\`npm link\`，之后在任何目录跑 \`yoinks\`。

## 合理使用

README 里作者自己写了一段，意思值得原样记住：yoinks 是个人归档工具，**下载内容可能违反某个平台的服务条款**——只下载你有权保留的内容，并对创作者保持尊重。

## 评估供应链时要知道

yoinks 会在首次运行时下载并执行第三方二进制（yt-dlp）。这是它的设计带来的便利（省掉装 Python），但如果你所在环境对供应链有要求，这是需要自己评估的一点。本地已有 yt-dlp 时它会用你的版本。
`,
      resources: [
        {
          kind: "link",
          title: "README 全文：用法、按键约定与 roadmap",
          url: "https://github.com/pablostanley/yoinks/blob/main/README.md",
          note: "Roadmap 那张表是判断「现在能干什么、不能干什么」的关键——脚本化标志和输出目录选项都还没实现。",
        },
        {
          kind: "link",
          title: "yt-dlp：底层下载引擎",
          url: "https://github.com/yt-dlp/yt-dlp",
          note: "yoinks 首次运行会下载它的独立二进制到 ~/.yoinks/bin。直接用 yt-dlp 的话选项更多，代价是要记参数。",
        },
      ],
    },
  },
};
