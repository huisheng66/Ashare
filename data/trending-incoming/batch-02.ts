// 第 2 条：tuios。内容全部核实自官方 README 与 tuios.dev，未凭印象。
export const entries = {
  tuios: {
    slug: "tuios",
    name: "TUIOS",
    nameZh: "TUIOS",
    aliases: ["tuios", "tui os", "终端复用器", "窗口管理器", "终端多路复用"],
    summary: "终端里的平铺窗口管理器，vim 式模态操作加 9 个工作区，关掉终端窗口会话还在。",
    scenes: ["code", "tools"],
    platforms: ["linux", "macos", "windows"],
    source: "opensource",
    tags: ["终端", "窗口管理", "平铺", "开源"],
    body:
      "TUIOS 是用 Go 写的终端复用器与窗口管理器，跑在你已有的终端里（不接管终端模拟器）。它提供 vim 式模态界面：窗口管理模式下按 n 开新窗、z 放大窗口，终端模式下正常敲命令。\n最实用的两点是工作区与守护进程。9 个工作区互相隔离，切换是瞬间的；会话由一个 daemon 托管，关掉终端窗口进程还在，可以从另一台机器 attach 回来。这解决了 tmux 新手最常撞的「关掉窗口就丢会话」。\n它还额外做了 coding agent 的集成——窗格里的 agent 可以上报状态、互相发消息，有审批与收件箱。代价要提前知道：概念比 tmux 多（模态、prefix key、布局模板、hooks），学习曲线明显更陡；要求终端支持真彩色，kitty graphics 与 sixel 是加分项而非必需；功能密度高意味着配置文件项也多，配置页很长。\n如果只是要会话持久化，tmux 更省心；如果要的是「终端里的可视化工作区 + agent 协同」，它做的事 tmux 不做。",
    officialUrl: "https://tuios.dev",
    links: {
      official: "https://tuios.dev",
      github: "https://github.com/Gaurav-Gosain/tuios",
    },
    officialLabel: "tuios.dev",
    whoFor: "同时开很多终端窗口、想用平铺而不是叠放，并且希望关掉终端会话不丢的人。",
    whoNot: "只会开一个终端窗口；或者已经在用 tmux 且不打算重新学一套键位——概念多是有成本的。",
    installTips: [
      "macOS 与 Linux 走 Homebrew 最省事：brew install tuios。",
      "Windows 与 FreeBSD/OpenBSD 走 GitHub Releases 的预编译二进制，别自己编译——从源码构建要 Go 1.26.6 以上。",
      "第一次用先跑 tuios --show-keys，它会盖一层键位提示在界面上，照着按几遍比读文档快。",
    ],
    alternatives: [],
    icon: { letter: "T", color: "#4A4A6A", simpleIcon: "gnome-terminal" },
    guide: {
      intro: "以「两个模式怎么切」和「会话为什么不会丢」为主线讲清最常用的操作，再说明 daemon 模式与布局模板怎么用。",
      markdown: `## 先分清两个模式

tuios 有两种模式，**分不清这一点后面全乱**：

- **窗口管理模式（WM）** — 挪窗口、分屏、切工作区。按 \`n\` 开新窗、\`z\` 放大当前窗。
- **终端模式** — 就是普通 shell，键盘直接进程序。

默认落在 WM 模式。按 \`i\` 或 \`Enter\` 进终端模式，回到 WM 模式按 \`Prefix\`+\`Esc\` 或 \`Alt\`+\`Esc\`。

**一个坑：光按 \`Esc\` 是回到 shell，不是回到 WM 模式。** 想回 WM 模式必须带 prefix（默认 \`Ctrl\`+\`B\`）。新手按了 \`Esc\` 发现「怎么还在终端里」，多半是这个。

## 三个最该记的键

| 键 | 作用 |
| --- | --- |
| \`Ctrl\`+\`P\` | 命令面板，搜任意动作 |
| \`Alt\`+\`Space\` | 启动器，搜程序名，\`Enter\` 直接跑、\`Tab\` 敲出来 |
| \`Prefix\`+\`?\` | 帮助浮层 |

命令面板是**先学这个**的命令。键位表记不住很正常，\`Ctrl\`+\`P\` 里能搜到所有动作，包括临时改布局、切主题。

\`Alt\`+\`Space\` 比手动敲路径快：输入路径后按 \`Tab\` 会把整个路径补出来并留在输入行，直接 \`Enter\` 就执行。

## 平铺不是叠放

\`Prefix\`+\`Space\` 切换 BSP 平铺。BSP 的意思是**二分分割**：每次切分把当前区域对半分，新窗占一半、原窗占一半。

\`z\` 放大当前窗（再按一次还原），适合临时专注某一个窗。

## 会话为什么关不掉

默认 \`tuios\` 启动会连到一个 daemon 托管的会话，**所以关掉终端窗口，进程还在**。重新打开终端 \`tuios\` 就回来了。

\`\`\`bash
tuios new mysession          # 新建具名会话
tuios attach mysession       # 重新接上
tuios ls                     # 列出所有会话
tuios kill-session mysession # 干掉某个会话
\`\`\`

具名会话的价值在于**从另一台机器接回来**。这也是它和 tmux 最像的地方。

不想让会话持久化就用 \`--standalone\`，这次关掉就没了：

\`\`\`bash
tuios --standalone
\`\`\`

## 更新：先搞清谁在管这个二进制

\`\`\`bash
tuios update --check    # 只看有没有新版，不动
tuios update            # 拉新版并替换
\`\`\`

**这条命令只对「用安装脚本或 release 二进制」的人有效。** 用包管理器装的（Homebrew、Arch、Nix）不要用它，会和包管理器打架。\`tuios update\` 会自己检测你用的是哪种安装方式，并打印对应的正确命令，而不是硬覆盖。

从源码构建需要 **Go 1.26.6 或更新版本**——版本号很新，机器上 Go 旧了会直接编译失败。

## 布局模板

同一套窗格布局反复用，可以存成模板。

\`\`\`bash
tuios layout list            # 列出已存布局
tuios layout delete mysetup  # 删掉
tuios layout export mysetup  # 导出成 tape 脚本
\`\`\`

应用内操作：\`Ctrl\`+\`B\` 然后 \`L\` 再 \`l\` 加载、\`s\` 保存。

导出成 tape 脚本这一项值得留意——**布局能导出成可执行的脚本**，意味着可以把窗格布局接进自动化流程，而不只是手动摆一次。

## 配置

\`\`\`bash
tuios config edit      # 用 $EDITOR 打开配置
tuios keybinds list    # 看常用键位
tuios list-options     # 所有可调项
\`\`\`

可调项里几个常用的：\`show_clock\`、\`show_cpu\`、\`show_ram\`（状态栏显示什么）、\`shared_borders\`、\`window_button_style\`、\`window_button_position\`，以及自定义主题与键位绑定。

## 试用不用装

不想装可以先试：[tuios.dev/learn](https://tuios.dev/learn) 上是编译成 WebAssembly 的真实应用，每个窗格里配了一个练习 shell。
`,
      resources: [
        {
          kind: "html",
          title: "官方文档站：安装、配置与全部指令",
          url: "https://tuios.dev",
          note: "getting-started 页给的是完整的安装方式与首次会话流程；配置参考在 docs/configuration。README 里的 Quick Links 指的就是这些页。",
        },
        {
          kind: "html",
          title: "README：安装命令全表与架构说明",
          url: "https://github.com/Gaurav-Gosain/tuios/blob/main/README.md",
          note: "Homebrew / AUR / Nix / 脚本 / go install / Docker 六种安装方式，以及 daemon 模式与架构章节都在这里。",
        },
      ],
    },
  },
};
