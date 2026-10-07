// 第 18 条：vorssaint。内容全部核实自官方 README（功能清单逐条、Homebrew 安装、
// Apple Silicon + macOS 14+ 硬要求、隐私与权限说明、GPL 与商标分离、商标条款）
// 与仓库内docs/PRIVACY.md、docs/PERMISSIONS.md、TRADEMARKS.md 等文件（均经Contents
// API 逐个确认存在），未凭印象。
export const entries = {
  vorssaint: {
    slug: "vorssaint",
    name: "Vorssaint",
    nameZh: "Mac 菜单栏工具箱",
    aliases: [
      "vorssaint",
      "vorssaint utils",
      "mac 工具箱",
      "菜单栏工具",
      "menu bar",
      "mac 优化",
      "系统监控 mac",
      "剪贴板历史",
    ],
    summary:
      "一个菜单栏图标顶 dozen 付费 Mac 应用：分应用音量、系统监控、窗口布局、剪贴板历史、卸载器；仅 Apple Silicon 且需 macOS 14+。",
    scenes: ["tools", "office", "design"],
    platforms: ["macos"],
    source: "opensource",
    tags: ["macOS", "菜单栏", "效率工具", "剪贴板", "系统监控", "开源"],
    body:
      "Vorssaint 的自我定位很直白：**一个菜单栏图标，干掉 dozen 个付费 Mac 应用的事。** 免费、开源、本地优先——没有账号、没有遥测、没有订阅。\n**它的功能范围大到需要分类看，我按 README 的分区说。** 声音类有分应用音量混音器（能把quiet 音频推过 100%）、每应用输出设备、输出切换器、麦克风工具、音乐 App 拦截器。系统监控类有 CPU/GPU/内存/温度/电池健康，带历史曲线和耗电应用排行，还有 beta 版风扇控制（可设手动转速或温度曲线）。窗口与 Dock 类有带实时预览的应用切换器、窗口布局吸附、跨桌面 Dock 预览、点 Dock 图标最小化、绿键全屏不新建 Space。\n**有几个功能对长期使用者来说价值最高，值得单独点出来。**剪贴板历史支持搜索文本、图片和文件，能钉 favorites、能预览；文本片段（snippets）能用剪贴板、日期时间变量展开；Clean URL 能去掉链接里的追踪参数，可以手动也可以自动；Command Bar 是一个输入框搜应用、窗口、文件、剪贴板、片段和应用菜单命令，还能算数、换单位、找 emoji、跑脚本。\n**安装方式只有一种，但它有「只装你要的」这个设计。** Homebrew 一条命令，或者从releases 拉磁盘镜像拖进Applications。构建用 Apple Developer ID 签名并做了 notarization，所以 macOS 不会拦你的权限设置。功能层面可以逐个选，也可以用预设；**卸载的功能会停止加载并从界面消失，重装会恢复原来的设置**，安装时只问你要的权限。\n**平台限制要先说，这是选型的第一道门槛：必须有 Apple Silicon 的 Mac，且macOS 14 Sonoma 或更新。** Intel Mac 完全不在支持范围内。\n**隐私这块的做法是我认为它最值得学的地方。** 它是本地优先，没有账号、没有分析、没有追踪；联网只发生在你能看见的地方——更新检查、测速、Homebrew 操作、可选的在线歌词查询、临时的截图或录屏分享链接，以及你主动发送的反馈。权限同理：**每一个权限都是可选的**，应用会用大白话解释每个权限干什么、哪些功能真的用到它，甚至会告诉你**某个已授予的权限现在已经没有任何功能需要了**，并给出撤销的快捷入口。这种「主动告诉你权限用不上」的设计比多数同类工具更诚实。\n**最后一条法务信息，做二次开发前必须知道：GPL 3.0 or later 只覆盖源代码，Vorssaint 这个名字、图标和外观由 TRADEMARKS.md 单独约束。** 所以 fork 之后必须换成自己的标识，不能沿用名字和图标。官方构建也只有维护者发布。",
    officialUrl: "https://vorssaint.com",
    links: {
      official: "https://vorssaint.com",
      github: "https://github.com/vorssaint/vorssaint-utils",
    },
    officialLabel: "vorssaint.com",
    whoFor:
      "用 Apple Silicon Mac、愿意装第三方系统级工具，且明确知道自己需要哪些权限、愿意用功能换精度的技术用户。",
    whoNot:
      "Intel Mac 或 macOS 13 及更早系统的用户（完全不支持）；以及要求零权限、完全不装第三方系统工具的人——它功能多，必然要申请较多权限。",
    installTips: [
      "Homebrew 安装：brew install --cask vorssaint。卸载同样是 brew uninstall --cask vorssaint。",
      "不想用 Homebrew 就去releases 页下磁盘镜像，把 Vorssaint 拖进 Applications。",
      "完全卸载（含设置与权限）：在项目目录里跑 ./Tools/uninstall.sh。只用 brew uninstall 会留下设置和授权。",
      "硬门槛：Apple Silicon Mac + macOS 14 Sonoma 或更新。Intel Mac 不在支持范围内。",
      "安装时按需选功能——卸载的功能会停止加载并从界面消失，重装会恢复设置；只授予当前选择真正需要的权限。",
      "想自己构建：git clone 后跑 ./build.sh --dev（单独的 Developer变体），加 --install 可安装并启动。唯一依赖是 Xcode Command Line Tools。",
    ],
    alternatives: [],
    icon: { letter: "V", color: "#4C8DFF" },
    guide: {
      intro: "从功能分区到权限与商标这两道真实边界，讲清这个菜单栏工具箱适合谁，以及为什么它的权限说明值得单独看一遍。",
      markdown: `## 它把自己定位成什么

README 第一句很直白：**一个菜单栏图标，干掉 dozen 个付费 Mac 应用的事。**

免费、开源、本地优先——**没有账号、没有遥测、没有订阅。**

这不是营销话术，后面第三节的隐私机制能对上。

## 先看硬门槛

**这是选型的第一道门槛，不满足就不用往下看了：**

- 需要 **Apple Silicon** 的 Mac
- 需要 **macOS 14 Sonoma** 或更新

Intel Mac 完全不在支持范围内。这不是「性能差一点」，是跑不了。

## 功能分区

README 把功能分了组，这里挑重点说。

### 声音

- **分应用音量混音器** —— 每个应用单独调音量，还能**把安静的音频推过 100%**，钉住或重排常用项。**不需要装音频驱动。**
- **每应用输出** —— 音乐走扬声器，通话走耳机。
- **输出切换器** —— 快捷键切设备，耳机断开时自动降音量。
- **麦克风工具** —— 指定输入、调电平、一键静音所有麦克风。
- **音乐 App 拦截器** —— 检测到播放键误触时阻止 Music 启动（需要辅助功能权限）。

### 知道你的 Mac 在干什么

- **系统监控** —— CPU、GPU、内存、温度、电池健康、功耗，带历史曲线和耗电应用视图。
- **风扇控制（beta）** —— 设手动转速或温度曲线，实时看 RPM。
- **菜单栏读数** —— 把选定指标、用量条、电池时间或风扇转速直接放进菜单栏。
- **网络** —— 实时流量、会话总量、本地 IP，或跑测速。
- **告警** —— 持续高 CPU、高温、内存压力、磁盘不足、电量低时通知。

### 窗口和 Dock

- **应用切换器** —— 带实时预览、搜索和按显示筛选；**简易模式不需要屏幕录制权限。**
- **窗口布局** —— 窗口吸附成布局、跨显示器移动、用快捷键/屏幕边缘/修饰键拖拽恢复之前的位置。
- **Dock 预览** —— 悬停预览跨桌面的窗口，能在预览里切换、关闭、移动、吸附。
- **Dock 点击** —— 点已激活应用的图标可最小化、隐藏或循环它的窗口。
- **最大化窗口** —— 绿键铺满屏幕而**不新建 Space**。
- **固定 Space 顺序** —— 保持你设的顺序而不是按最近使用重排，关掉可恢复原设置。
- **退出保护** —— 防误按 ⌘Q / ⌘W，按住、双击或加修饰键确认，可按应用配置。

### 键盘和鼠标

这一组数量最多，挑实用的：

- **文本片段** —— 短触发词展开成文本，支持剪贴板、日期时间变量
- **平滑滚动** —— 鼠标滚轮给 fluidity，速度和响应可调
- **线性滚动** —— 无论滚轮转多快，每一格滚相同行数
- **关闭指针加速** —— 关掉后还能恢复之前的设置
- **焦点跟随鼠标** —— 指针停留可调时间后，窗口置前
- **侧键** —— 鼠标后退前进键在 Finder、浏览器和兼容应用里可用
- **按键去抖** —— 过滤磨损键盘造成的重复字母
- **Super 键** —— 用 Caps Lock 或右侧修饰键当快捷键组合，可单独设轻点动作
- **要放过的应用** —— 把指定应用排除在鼠标增强之外

### 剪贴板、文件和链接

- **剪贴板历史** —— 搜索本地文本、图片和文件历史，钉 favorites、预览、用快捷键粘贴。
- **自动清空剪贴板** —— 延时、睡眠或锁屏后清空系统剪贴板，**但保留已保存的历史。**
- **粘贴为纯文本** —— 去掉格式粘贴，同时保留原剪贴板内容。
- **Shelf 文件架** —— 拖动时把文件、文本和链接停在光标附近，之后再放下或分享。
- **Finder 快捷键** —— ⌘X/⌘V 移动文件、F2 重命名、复制图片粘贴为 PNG。
- **Clean URL** —— 去掉链接里的追踪参数，可手动也可自动。**这个功能在日常使用里出现频率比想象中高。**
- **磁盘镜像安装器** —— 从挂载的镜像安装应用并弹出，可选清理下载文件。

### 日常工具

- **Dynamic Island** —— 把音乐、通知、日历、计时器、下载和常用控件放在摄像头挖孔周围，其他 Mac 上可模拟。可选歌词、实时均衡器、摄像头预览和文件工具。
- **AI agents 跟随** —— 在 Dynamic Island 里看 Claude、Codex、OpenCode 和 GitHub Copilot 的额度与重置时间、token、API 价值、模型、项目和进行中的工作，长任务完成时给通知。
- **Command Bar** —— 一个输入框搜应用、窗口、文件、剪贴板、片段和应用菜单命令；能算数、换单位、找 emoji、跑保存的脚本。
- **快速面板** —— ⌃⌘V 打开收藏工具的浮动面板。
- **径向菜单** —— 以指针为中心展开的轮盘，可配置、支持配置档和子菜单。
- **Scratchpad** —— 自动保存的笔记分标签页，带 Markdown 预览和导出。
- **清洁模式** —— 清洁时锁住键盘输入，全黑屏或只留一个小指示器。

### 截屏和创作

- **截屏** —— 区域、窗口、屏幕或滚动页面；可标注、裁剪、打码、加背景和水印、钉住，走分享菜单或发临时链接。
- **录屏** —— 系统音频和麦克风**分轨录制**；裁剪、加自动变焦、模糊隐私信息，导出视频或 GIF。
- **屏幕取字** —— **离线**识别任意屏幕区域的文字，或读二维码。
- **取色器** —— 复制为 HEX、RGB、HSL 或 SwiftUI 代码。
- **媒体工具** —— 本地压缩剪辑视频、批量转图片、加水印、做 GIF、提取文字。

### 应用管理

- **应用更新** —— 商店应用、包管理器应用和开发者更新源放一个列表里，可一起装或交给应用自己的更新器。
- **Cleaner** —— 清缓存、日志和应用残留，手动或按计划。
- **消息下载管理** —— 按保留规则审阅、整理或移到废纸篓。
- **卸载器** —— 卸载应用前先给你看相关的缓存、偏好设置和辅助程序，再一起移到废纸篓。**这个「先看后删」的设计比直接删安全。**
- **Homebrew 管理器** —— 搜装删 formulae 和 cask，不用开终端。
- **端口管理** —— 找出监听网络端口的进程，可直接 Kill Process（需先安装该功能）。

## 安装：两种方式，一个设计亮点

\`\`\`bash
brew install --cask vorssaint
\`\`\`

或者从 [releases 页](https://github.com/vorssaint/vorssaint-utils/releases) 下磁盘镜像，拖进 Applications。

构建**用 Apple Developer ID 签名并做了 notarization**，所以 macOS 不会拦权限弹窗，**你的权限设置也能在更新后保留**。

### 「只装你要的」

这是这个项目设计上最值得学的一点：

- 可以逐个选功能，也可以从预设开始。
- **卸载的功能会停止加载并从界面消失。**
- **重装会恢复它原来的设置。**
- 安装时**只问你要的权限**。

面板分区可以重排或隐藏，可以选紧凑布局，设置能导出到另一台 Mac，支持十几种语言。

## 隐私：这一节建议读完再装

README 里的说法是：本地优先，**没有账号、没有分析、没有追踪**。联网只发生在你能看见的地方：

- 更新检查
- 测速
- Homebrew 操作
- **可选的**在线歌词查询
- 临时截图或录屏链接
- 你明确发送的反馈

完整说明在仓库的 \`docs/PRIVACY.md\`。

### 权限的处理方式值得学

原文这段：

> Every one is optional, the app explains each in plain words, shows which features actually use it, and even **tells you when a permission you granted is no longer needed by anything**, with a shortcut to revoke it.

拆成三条：

1. **每一个权限都是可选的**，且用大白话解释这个权限干什么。
2. **告诉你哪些功能真的用到它。**
3. **主动告诉你某个已授予的权限现在已经没功能需要了**，并给撤销入口。

**第3 条是多数同类工具不会做的。** 装多了功能之后权限越堆越多，很少有工具会提醒你哪些已经没用了。

每个特性需要什么权限、不给会失去什么功能，看 \`docs/PERMISSIONS.md\`。

## 卸载：记得清干净

\`\`\`bash
brew uninstall --cask vorssaint
\`\`\`

但这只删应用。要连设置和权限一起清掉：

\`\`\`bash
./Tools/uninstall.sh
\`\`\`

**只跑 brew uninstall 会留下设置残留。** 对这类高权限工具，完整卸载很重要。

## 自己构建

\`\`\`bash
git clone https://github.com/vorssaint/vorssaint-utils.git
cd vorssaint-utils
./build.sh --dev            # 构建单独的 Developer 变体
./build.sh --dev --install  # 安装并启动
\`\`\`

**唯一的要求是 Xcode Command Line Tools。**

## 两个关键约束

### 平台限制

再强调一次：**Apple Silicon + macOS 14 Sonoma 或更新。** Intel Mac 跑不了。

### 商标与许可证是分开的

README 里的原话：

> The GPL covers the source, while the Vorssaint name, icon and look are covered by [TRADEMARKS.md](https://github.com/vorssaint/vorssaint-utils/blob/main/TRADEMARKS.md), so **forks need their own identity**.

意思是：

| 覆盖对象 | 条款 |
|---|---|
| 源代码 | GPL 3.0 or later |
| 名字、图标、外观 | TRADEMARKS.md，单独约束 |

**所以 fork 之后必须换成自己的标识，不能沿用名字和图标。** 官方构建也只有维护者发布。

这一条对二次开发很关键，容易被忽略。

## 出问题了看哪里

-启动问题、权限、预览缺失 → [troubleshooting](https://github.com/vorssaint/vorssaint-utils/blob/main/docs/TROUBLESHOOTING.md)
- 需要帮助 → [support](https://github.com/vorssaint/vorssaint-utils/blob/main/SUPPORT.md)
- 报漏洞 → [SECURITY.md](https://github.com/vorssaint/vorssaint-utils/blob/main/SECURITY.md)

## 什么情况下别用它

- **Intel Mac 或 macOS 13 及更早** —— 硬门槛，不支持。
- **要求零权限** —— 它功能多，必然要申请较多权限。介意就别装。
- **想要跨平台** —— 只有 macOS，没有 Windows 或 Linux 版。
- **想 fork 后沿用原名** —— 商标不允许，得换标识。
`,
      resources: [
        {
          kind: "link",
          title: "隐私说明：什么会离开你的 Mac、什么不会",
          url: "https://github.com/vorssaint/vorssaint-utils/blob/main/docs/PRIVACY.md",
          note: "本地优先、无账号无追踪的具体承诺。联网只发生在更新检查、测速、Homebrew 操作、可选歌词查询和临时分享链接上。",
        },
        {
          kind: "link",
          title: "权限指南：每个 macOS 权限的大白话说明",
          url: "https://github.com/vorssaint/vorssaint-utils/blob/main/docs/PERMISSIONS.md",
          note: "这类系统级工具最该先读的一页。写明每个特性需要什么权限、以及不给权限会失去哪些功能。",
        },
        {
          kind: "link",
          title: "TRADEMARKS.md：为什么 fork 必须换标识",
          url: "https://github.com/vorssaint/vorssaint-utils/blob/main/TRADEMARKS.md",
          note: "GPL 只覆盖源代码，名字、图标和外观另行约束。准备 fork 之前必看，否则会直接踩商标问题。",
        },
      ],
    },
  },
};