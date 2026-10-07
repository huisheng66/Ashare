import type { Software } from "./types";

/** 新数据形态样例：脚本与开源项目（随首次灌入一起进 store） */
export const samples: Software[] = [
  {
    license: "Unlicense",
    version: "2026.08.19",
    slug: "yt-dlp",
    linksCheckedAt: "2026-10-03",
    name: "yt-dlp",
    aliases: ["ytdlp", "视频下载", "命令行下载"],
    kind: "opensource",
    status: "published",
    tags: ["CLI", "视频", "开源"],
    summary: "命令行视频下载脚本，支持大量站点，可只下音频或指定清晰度。",
    body: "yt-dlp 是一个持续维护的命令行下载脚本，用来把网页视频存成本地文件。它不做界面，所有能力都通过参数表达：只取音频、限最高清晰度、批量按列表下载都可以一条命令完成。\n适合愿意开终端、想要可重复命令的人；偶尔下一次视频、只想点按钮的话，它不是最顺手的选择。\n项目开源且更新频繁，建议从 GitHub Releases 获取最新版，旧版常因站点改版失效。",
    scenes: ["code", "design"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    links: {
      official: "https://yt-dlp.org",
      github: "https://github.com/yt-dlp/yt-dlp",
    },
    tutorial: [
      "从 GitHub Releases 下载对应系统的可执行文件，放到 PATH 目录里。",
      "终端运行 yt-dlp --version 确认可用。",
      "基本用法：yt-dlp「视频链接」；只要音频加 -x。",
      "清晰度限制用 -f「bv*[height<=1080]+ba」这类格式表达式，避免下到 8K。",
    ],
    guide: {
      intro: "把最常用的几种下载写成可复用的命令，覆盖音频、画质与批量三种场景。",
      markdown: `## 只取音频

只要声音时用 \`-x\`，它会自动转成 m4a：

\`\`\`bash
yt-dlp -x "视频链接"
\`\`\`

转成 mp3 需要本机装有 ffmpeg，这是 yt-dlp 的硬依赖，缺了会直接报错。

## 限制画质

不限格式时默认取源站提供的最高画质，常常是几个 GB。加 \`-f\` 表达式限制高度：

\`\`\`bash
yt-dlp -f "bv*[height<=1080]+ba/b" "视频链接"
\`\`\`

前半段优先取 1080p 视频轨并合并音频；\`+b\` 表示同时取音频轨，末尾的 \`/b\` 是兜底格式。

## 常用参数

| 参数 | 作用 |
| --- | --- |
| \`-x\` | 只下音频并转 m4a |
| \`-f 表达式\` | 按格式选择器挑画质 |
| \`-o 模板\` | 自定义文件名，如 \`-o "%(title)s.%(ext)s"\` |
| \`--no-playlist\` | 只下单个视频，跳过合集 |
| \`--write-subs\` | 连带下载字幕 |

## 批量下载

把链接逐行写进文件，用 \`-a\` 批量处理；已下过的会自动跳过：

\`\`\`bash
yt-dlp -a urls.txt --no-playlist -o "%(title)s.%(ext)s"
\`\`\`

站点常改版，解析失败时先更新版本：\`yt-dlp -U\`，或重新下载 Releases 里的可执行文件。`,
      resources: [
        {
          kind: "html",
          title: "官方 README：完整选项与格式选择器",
          url: "https://github.com/yt-dlp/yt-dlp/blob/master/README.md",
          note: "格式选择器的完整语法在这里，本页只列了最常用的几种。",
        },
        {
          kind: "html",
          title: "FFmpeg-Builds：Windows 与 macOS 预编译包说明",
          url: "https://github.com/yt-dlp/FFmpeg-Builds/blob/master/README.md",
          note: "要转 mp3 或合并音视频轨时必须先装 ffmpeg，这份构建不需自行编译。",
        },
      ],
    },
    whoFor: "愿意用终端、需要批量或可重复下载的人。",
    whoNot: "只想点一下按钮偶尔存个视频，命令行会觉得麻烦。",
    alternatives: [],
    featured: true,
    previews: [],
    icon: { letter: "Y", color: "#7A57D1" },
  },
  {
    license: "MPL-2.0",
    version: "2.1.5",
    slug: "syncthing",
    linksCheckedAt: "2026-10-03",
    name: "Syncthing",
    aliases: ["sync", "文件同步"],
    kind: "opensource",
    status: "published",
    tags: ["同步", "P2P", "自托管"],
    summary: "开源的设备间文件同步工具，点对点直传，不经第三方服务器。",
    body: "Syncthing 在你自己的设备之间建立点对点同步：文件夹在 A 电脑改动，B 电脑和手机自动跟上，数据只在设备之间流动，不经过厂商服务器。\n适合在意数据位置、有固定几台常用设备的人；需要「把链接发给同事即可访问」的多人协作盘，它不是同类替代。\n第一次配置要互相交换设备 ID，之后基本免维护。国内访问官方发布较慢时，可用项目方列出的已核验镜像。",
    scenes: ["office"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    links: {
      official: "https://syncthing.net",
      github: "https://github.com/syncthing/syncthing",
    },
    tutorial: [
      "官网下载安装包，启动后浏览器打开本地管理页 127.0.0.1:8384。",
      "两台设备分别添加对方的设备 ID，完成信任。",
      "添加要同步的文件夹，勾选共享给对方设备。",
      "手机端用官方 App，扫码即可加入。",
    ],
    guide: {
      intro: "从设备 ID 与文件夹 ID 的对应关系讲起，讲到中继机制在断网时到底发生了什么，以及用命令行做无界面部署与自动备份的实操。",
      markdown: `## 设备 ID 与文件夹 ID：两套独立标识

Syncthing 的标识体系是理解它的关键，也是新手最搞混的地方：

- **设备 ID**：每台机器一个，形如 \`ABCD-EFGH-IJKL-MNPQ-1234-5678-9ABC-DEFG-HIJK-MNOP\`，由证书派生、永久不变，等价于设备指纹。
- **文件夹 ID**：每个同步目录一个名字，默认取目录名，全网唯一。它是同步的命名空间。

配对的完整流程是：两台机器交换设备 ID（扫码或复制粘贴），然后**双方各自添加对方并选择「共享」该文件夹**。注意「添加设备」和「共享文件夹」是两个独立动作——只添加设备不同步任何东西，勾上文件夹的共享复选框才真正开始同步。

> 坑：只在一端勾了共享，另一端没勾，文件夹会显示为「未共享 / Remote Unshared」，一直不开始传输。检查两端都要有该文件夹且状态为 Active。

## 中继机制：断网时它真的能传吗

当两台设备不在同一局域网且互相无法直连时，Syncthing 会借助**中继服务器（Relay）** 交换连接信息，传输本身仍是端到端的。

| 连接状态 | 含义 |
| --- | --- |
| Connected Directly | 局域网内直连，最快 |
| Connected Relayed | 通过中继转发，延迟明显更高 |
| Introducing (relay) | 正在通过中继互相发现，还没建链 |
| Paused | 文件夹被暂停 |

关键点：**中继不存储你的文件**，只转发握手包。中继服务器由社区运营，也可能不可用。所以只要你的服务器有公网 IP 并做了端口转发，就应该优先走直连。

在 Web 界面的远程设备上点「Connection Type」可以看到当前走的哪条路。打开 \`设置 - 调试\` 面板还能看到 NAT 探测结果和候选地址列表。

## 版本控制与冲突副本

Syncthing 在同步时自带一套简化的版本控制，配置在文件夹的 \`File Versioning\`：

- **Trash Can**：删除的文件放进回收站，默认 30 天后清理
- **Simple**：只保留历史修改版本，数量可设
- **Staggered**：只在特定时间点保留版本，省空间
- **No File Versioning**：关闭（不推荐）

收到「Local Additions/Deletions」类型的冲突时，同步会在文件名后加 \`~sync-conflict-...\` 后缀生成副本而不是覆盖。要减少冲突，**规则是两边都不要同时改同一个文件**。

## 大文件与忽略规则

先把忽略规则配好，不然 node_modules 或视频目录会直接把同步拖死。忽略规则走 \`.stignore\` 文件，语法接近 gitignore：

\`\`\`
# 临时文件与系统垃圾
*.tmp
~$*
.DS_Store
Thumbs.db
# 大目录与二进制产物
node_modules/
.git/
*.iso
\`\`\`

放在文件夹的「忽略模式」设置里，\`忽略\` 标签页可以看哪些规则命中了哪些文件，调试很方便。配置生效需要重启该文件夹的同步。

## 命令行与无界面部署

服务端二进制 \`syncthing\` 自带 CLI，容器化与服务器部署时用它最省事。**设备 ID 必须在启动前生成并保存**，因为 ID 由证书决定，重新生成就变了：

\`\`\`bash
# 1. 首次生成配置（含设备 ID 与 TLS 证书）
syncthing generate --home=/var/syncthing/config
# ----
# 2. 之后一律用 serve 启动，不会覆盖已生成的 ID
syncthing serve --home=/var/syncthing/config --no-browser
# ----
# 3. 查本机设备 ID
syncthing --home=/var/syncthing/config cli show system
# ----
# 4. 列出已连接的设备
syncthing --home=/var/syncthing/config cli show connections
\`\`\`

\`generate\` 和 \`serve\` 的区别是易错点：\`generate\` 会**重新生成配置与证书**，误用会导致设备 ID 变更、所有设备都需要重新配对。正确做法是首次部署用 \`generate\`，之后重启一律用 \`serve\`。

验证与修复（\`--repair\`）只在文件真的损坏时才用，它会用本地副本覆盖其他节点的数据，代价是**以本地为准、丢弃远端较新的版本**，用之前先确认本地数据是完整的。

配置目录由 \`--home\` 参数决定，systemd 部署时建议显式指定，避免 root 与普通用户配置混淆。`,
      resources: [
        {
          kind: "html",
          title: "Syncthing 项目 README",
          url: "https://github.com/syncthing/syncthing/blob/main/README.md",
          note: "官方仓库说明，含各平台安装方式与特性列表。",
        },
        {
          kind: "link",
          title: "Syncthing 官方文档",
          url: "https://docs.syncthing.net/",
          note: "官方文档站，含 CLI 完整命令、relay 机制原理、忽略规则与版本控制配置。",
        },
      ],
    },
    whoFor: "有几台常设备、想自己掌握数据位置的人。",
    whoNot: "要和多人共享链接协作，或不想管任何配置的人。",
    alternatives: ["localsend"],
    featured: false,
    previews: [],
    icon: { letter: "S", color: "#0891B1", simpleIcon: "syncthing" },
  },
  {
    slug: "mineradio",
    license: "GPL-3.0",
    linksCheckedAt: "2026-10-03",
    name: "Mineradio",
    aliases: ["音乐播放器", "歌词舞台", "粒子视觉"],
    kind: "opensource",
    status: "published",
    tags: ["音乐", "播放器", "歌词", "视觉"],
    summary:
      "以电影镜头、粒子视觉和歌词舞台为核心的沉浸式桌面音乐播放器。",
    body: "Mineradio 是一款 Windows 桌面沉浸式音乐播放器，把搜索播放、歌词舞台、粒子视觉、3D 歌单架和桌面模式组合成一个更接近现场感的私人音乐空间。\n视觉是它的核心：播放后会进入电影镜头式的节奏视觉，歌词舞台与粒子舞台同步工作，长播客和 DJ 曲目另有专属模式，右键可唤起 3D 歌单架浏览队列。\n它接入网易云音乐与 QQ 音乐的账号、搜索与歌单，因此登录态和可用性依赖这些平台的接口，也会随作者更新而变化。安装包未签名，Windows SmartScreen 首次运行会提示风险。\n项目以 GPL-3.0 在 GitHub 开源，安装包由 GitHub Releases 发布。",
    scenes: ["music"],
    platforms: ["windows", "macos"],
    source: "opensource",
    price: "免费",
    links: {
      github: "https://github.com/XxHuberrr/Mineradio",
    },
    tutorial: [
      "从 GitHub Releases 下载 Mineradio-2.2.0-Setup.exe（macOS 用对应的 .dmg）。",
      "运行安装包；未签名，SmartScreen 提示时点「更多信息」→「仍要运行」。",
      "首次启动后在软件内登录音乐账号，才能使用搜索与歌单。",
      "更新用软件内入口，它只会打开浏览器下载页，不会自动装补丁。",
    ],
    guide: {
      intro: "讲清 Mineradio 的桌面模式、歌词与粒子视觉怎么配合、账号登录与更新机制的真实边界，以及未签名安装包被拦时该怎么处理。",
      markdown: `## 先看清项目状态

这是个**长期停更**的个人项目，这一点必须先说清：README 明确写了「目前因个人原因，Mineradio 项目处于长期停更状态」，仓库保留源码、历史版本和下载说明，供个人玩家 Fork 或做二创。当前可用的历史稳定版是 \`2.2.0\`。把它当持续演进的产品去期待更新会落空，当成「一次装好、慢慢用」的播放器则没问题。

许可证是 GPL-3.0，作者已明确保留 Logo、名称与界面视觉设计的所有权。

## 视觉系统怎么配合

Mineradio 的卖点是视觉，但视觉不是一套东西而是几套按场景切换的系统：

- **完整桌面模式**把播放器、主页、歌单和桌面交互放在一起，可以当"桌面播放器"用。
- **歌词舞台**与**粒子舞台**同步工作，支持自定义歌词、歌词位置与视觉控制。
- **电影镜头视觉系统**基于节奏驱动，面向长播客和 DJ 曲目另有专属模式。
- **3D 歌单架**通过右键唤起，用于浏览歌单队列。
- 支持本地 MP4 与 Wallpaper Engine 视觉内容，也可以自己上传并裁剪专辑封面。

首次启动内置一个「默认测试」视觉用户存档，软件内的默认视觉参数与该存档一致——调乱了大可以从这里恢复。

## 安装被拦是正常现象

安装包未签名，被浏览器、Windows Defender 或 SmartScreen 拦下属于预期内：

1. 浏览器下载栏提示风险时，打开下载列表，点这条下载右侧的 \`...\` 三个点，选「保留」/「仍要保留」/「显示更多」后继续保留。
2. SmartScreen 弹出蓝色窗口时，点「更多信息」，再点「仍要运行」。
3. 如果杀毒软件**明确**报木马、高危或已经隔离，不要强行运行。删掉文件重新从官方公告的网盘入口下载，仍异常就带截图反馈给作者。

注意认准文件名：正式安装包是 \`Mineradio-2.2.0-Setup.exe\`。**不要把 \`.blockmap\`、\`latest.yml\` 或 \`win-unpacked\` 目录当成正式安装包**——这三个是构建中间产物，不是给用户装的。

## 更新机制的真相

软件内的更新入口**只会用系统浏览器打开下载页**，不会在客户端内下载、安装或应用任何补丁。即使 GitHub Release 上挂着完整安装包，\`2.0.3+\` 客户端也不会去读取那个附件。更新是手动动作。

要本地验证这条链路，可以把环境变量 \`MINERADIO_UPDATE_MANIFEST\` 指向一个本地 manifest JSON 或 HTTP 地址，模拟线上 Release。

自己跑源码的话是三条命令：

\`\`\`bash
npm install
npm start
npm run build:win
\`\`\`

桌面版入口由 Electron 主进程加载本地服务，\`npm run build:win\` 生成 Windows NSIS 安装包，产物在 \`dist/\`。

## 登录与隐私

网易云音乐、QQ 音乐的账号、搜索、歌单体验都是**第三方平台接入**，不是官方客户端。这意味着：接口变动就会失效，可用性不由项目方掌握。项目方也明确说明不提供绕过付费、绕过会员、破解音质或重新分发音乐内容的能力。

数据方面，登录 Cookie、搜索历史、自定义封面、自定义歌词、节奏分析缓存都只应保存在本机用户数据目录或浏览器本地存储中，**不要提交到仓库**。`,
      resources: [
        {
          kind: "html",
          title: "项目 README：下载入口、视觉特性与更新机制",
          url: "https://github.com/XxHuberrr/Mineradio/blob/main/README.md",
          note: "安装包网盘入口、SmartScreen 处理步骤、视觉特性清单与开发运行命令都在这里。",
        },
      ],
    },
    whoFor: "想要强烈视觉与歌词舞台体验、在 Windows 上听歌的人。",
    whoNot: "只需要安静省电的播放器，或不愿登录第三方音乐账号，或用 Linux。",
    alternatives: [],
    featured: false,
    previews: [],
    icon: { letter: "M", color: "#6D28D9" },
  },
  {
    version: "4.0.1",
    license: "GPL-3.0",
    slug: "audacity",
    linksCheckedAt: "2026-10-03",
    name: "Audacity",
    aliases: ["音频剪辑", "录音剪辑", "Audacity 音频编辑器"],
    kind: "opensource",
    status: "published",
    tags: ["音频编辑", "录音", "播客", "降噪"],
    summary: "开源的多轨音频编辑器，录音、剪辑、降噪一条龙，跨平台且没有订阅费。",
    body: "Audacity 是开源跨平台的多轨音频编辑器，用来录音、剪切拼接、降噪和导出常见音频格式。它解决的是「把一段声音整理干净」这类工作：播客口播、网课录音、采访素材、从视频里抠出来的音轨。\n编辑在波形上直接进行：选中区域就能剪切、拼接、调整音量包络；内置的降噪、压缩器与均衡器可以按效果链叠加，也支持加载 VST / LV2 等插件格式。批量处理与多轨混导出都能在一个界面里完成，不需要工程概念。\n代价要提前知道：它面向波形编辑，不是编曲工具，没有 MIDI 与虚拟乐器；插件需要自己找，且不同系统的插件格式不通用。许可证为 GPL 系列——GitHub 未自动识别到具体版本（仓库 topics 标注 gplv2），商用与二次分发前请自行核对仓库内的 LICENSE 文件。\n发布渠道有两个：官网下载页与 GitHub Releases。Windows 提供 .msi，macOS 提供 .dmg（含 universal 版本），Linux 提供 AppImage，发布页附 CHECKSUMS.txt 可校验。",
    scenes: ["music"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    links: {
      official: "https://www.audacityteam.org/",
      github: "https://github.com/audacity/audacity",
    },
    tutorial: [
      "从官网下载页或 GitHub Releases 取对应系统的安装包：Windows 用 .msi，macOS 用 .dmg，Linux 用 AppImage。",
      "首次启动会询问是否检查更新，按需选择。",
      "用「文件 → 导入」载入音频，选中波形后套用降噪等效果。",
      "用「文件 → 导出」选择格式；需要 mp3 时确认已按提示准备好编码器。",
    ],
    guide: {
      intro: "以「录一段口播并导出 mp3」为主线，串起降噪、剪切与导出的完整流程。",
      markdown: `## 降噪：先处理再剪辑

人声录音的底噪是后期最花时间的一环。做法是截取一小段**只有底噪**的波形，选中它，套用「效果 → 降噪/修复 → 降噪」，点「获取噪声配置」，再选中整段音频重新套一次。

顺序反了会把人声一起削掉：噪声配置必须来自没有人说话的那一小段。

## 常用效果链

| 场景 | 效果链（按顺序） |
| --- | --- |
| 口播去底噪 | 降噪 → 噪声抑制 → 均衡器 |
| 响度统一 | 压缩器 → 响度标准化 |
| 剪辑拼接 | 剪切 → 淡入淡出 |

## 导出格式

「文件 → 导出」选目标格式。导出 mp3 需要本机装有 LAME 编码器，Audacity 会提示下载地址；不装就只能导出 wav。

批量处理整个目录用「文件 → 批量处理」，选一个链式预设即可。

## 快捷键

| 操作 | 快捷键 |
| --- | --- |
| 播放 / 停止 | 空格 |
| 放大到选区 | Ctrl + 1 |
| 裁剪到选区 | Ctrl + T |
| 撤销 | Ctrl + Z |

插件是另一条路径：「效果 → 插件管理器」可安装 VST / LV2。注意 Windows 与 macOS 的插件格式不通用，装之前先确认来源平台的版本。`,
      resources: [
        {
          kind: "html",
          title: "官网首页（下载与文档入口）",
          url: "https://www.audacityteam.org/",
          note: "各系统安装包与校验文件都在官网下载区，文档也从此处进入。",
        },
        {
          kind: "html",
          title: "官方支持：降噪与去噪的完整步骤",
          url: "https://support.audacityteam.org/au3/repairing-audio/noise-reduction-removal",
          note: "「获取噪声配置」到调整参数的每一步说明，与本页流程一致。",
        },
      ],
    },
    whoFor: "要剪掉录音里的杂音、拼接多轨声音、批量导出固定格式的人；不想为剪辑工具付订阅费的人。",
    whoNot: "要做多轨音乐混音、需要 MIDI 与虚拟乐器的人（那是 DAW 的活）；只想要一键自动成片、不想学波形编辑的人。",
    alternatives: [],
    featured: true,
    previews: [],
    icon: { letter: "A", color: "#0056B3" },
  },
  {
    license: "GPL-2.0",
    version: "2.13.3",
    slug: "musicbrainz-picard",
    linksCheckedAt: "2026-10-03",
    name: "MusicBrainz Picard",
    aliases: ["Picard", "音乐标签", "MusicBrainz"],
    kind: "opensource",
    status: "published",
    tags: ["音乐标签", "元数据整理", "音乐库", "AcoustID"],
    summary: "按 MusicBrainz 数据库自动识别曲目并补全标签与封面，把散乱的音乐库整理成一致的元数据。",
    body: "MusicBrainz Picard 是跨平台的音乐标签编辑器。它用音频指纹（AcoustID）去 MusicBrainz 数据库匹配曲目，自动补上标题、艺术家、专辑、年份与封面，并按自定义脚本重命名和归档文件。\n用法是拖入：把文件或整个目录拖进左侧待匹配区，点扫描后它会给出候选，确认无误再保存。标签格式覆盖 ID3、FLAC、Vorbis 等常见种类，命名与目录结构可以用脚本规则自定义，适合一次整理几千个文件。\n识别质量取决于数据库是否收录这张专辑——欧美主流发行的匹配率很高，中文、日韩与小众独立发行经常匹配不上，这时只能手动挑或放弃。匹配过程需要联网，MusicBrainz 服务不可用时它会退化为纯手工工具；最新正式版为 2.13.3（2025 年 2 月发布），仓库仍在活跃维护。\n项目以 GPL-2.0 开源，官网提供 Windows 安装包（.exe）与 macOS 的 .dmg，Linux 用发行版仓库或源码安装。",
    scenes: ["music"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    links: {
      official: "https://picard.musicbrainz.org",
      github: "https://github.com/metabrainz/picard",
    },
    tutorial: [
      "从官网下载页取 Windows 的 .exe 或 macOS 的 .dmg；Linux 用发行版包管理器安装。",
      "把音乐文件或整个目录拖进左侧「未匹配」区，点「扫描」按音频指纹识别。",
      "在右侧核对匹配结果与封面，不确定时手动挑选候选项。",
      "确认后点「保存」，需要整理目录结构时再启用文件命名脚本。",
    ],
    guide: {
      intro: "从拖入文件、指纹识别、核对匹配到保存标签与重命名目录，走通 Picard 整理音乐库的完整主线，并讲清 AcoustID 匹配不到时该怎么办。",
      markdown: `## 四个阶段，缺一不可

Picard 的工作流是固定的四段：先从 MusicBrainz 取得专辑信息，再把单个文件匹配到具体曲目，然后确认封面，最后保存。理解这个顺序很重要——**保存只写标签，不会替你选对发行版**，匹配错了照样会写进去。

匹配有三条路径，可靠性差别很大：

| 方式 | 依据 | 可靠性 |
| --- | --- | --- |
| 扫描（Scan） | AcoustID 音频指纹 | 最高，不受文件名与标签影响 |
| 查表（Lookup） | 文件里已有的标签 | 中，取决于原标签质量 |
| 手动搜索 | 你输入的标题与艺术家 | 最低，全靠人工判断 |

优先用扫描。指纹由 AcoustID 提供的 \`fpcalc\` 工具生成，描述的是录音本身的特征，因此同一首曲目的不同编码、不同码率会得到略有差异的指纹——AcoustID 服务器会把足够相似的指纹归并到同一个 ID 下，这正是它能工作的原因。

## 快捷键：按阶段记

工具栏按钮和菜单太多，记住这几个就够日常用了。

| 操作 | Windows / Linux | macOS |
| --- | --- | --- |
| 保存选中文件 | \`Ctrl\`+\`S\` | \`⌘\`+\`S\` |
| 扫描 | \`Ctrl\`+\`Y\` | \`⌘\`+\`Y\` |
| 聚类（Cluster） | \`Ctrl\`+\`U\` | \`⌘\`+\`U\` |
| 查表 | \`Ctrl\`+\`L\` | \`⌘\`+\`L\` |
| 打开文件命名脚本编辑器 | \`Ctrl\`+\`Shift\`+\`S\` | \`⌘\`+\`⇧\`+\`S\` |
| 查 CD | \`Ctrl\`+\`K\` | \`⌘\`+\`K\` |
| 查相似专辑 | \`Ctrl\`+\`T\` | \`⌘\`+\`T\` |

## 命名脚本：\`%\` 取值，\`$\` 是函数

脚本最容易劝退人，是因为它和常见的「用 \`$\` 引用变量」直觉相反。在 Picard 里，**变量用百分号包起来，函数才用美元号**。

想实现「艺术家 - (年份) 专辑名/音轨号 - 曲名」，脚本写成这样：

\`\`\`bash
$if2(%albumartist%,%artist%) - \\($if(%date%,$left(%date%,4),0000)\\) %album%/$num(%tracknumber%,2) - %title%
\`\`\`

拆开看：

- \`%albumartist%\` 是取值，\`$if2(%albumartist%,%artist%)\` 取第一个非空的值，解决老文件没写专辑艺术家的问题。
- \`$left(%date%,4)\` 取日期前四位。MusicBrainz 的日期固定是 \`YYYY-MM-DD\`，而**没有 \`year\` 这个标签**。
- \`$num(%tracknumber%,2)\` 把音轨号补零到两位，否则第 10 轨会排在第 2 轨前面。
- 字符串里的 \`/\` 分隔目录与文件名，**最后一个 \`/\` 之前全是目录**。想要多级目录就多写几个斜杠。
- 圆括号、\`$\`、逗号、反斜杠都是特殊字符，字面量要用反斜杠转义，如 \`\\(\`。

脚本在「选项 → 打开文件命名脚本编辑器…」里编辑（macOS 是「Picard → 偏好设置…」），对应配置页上的「Edit script…」按钮。

## 易错点

**匹配上了不等于对。** 同一首歌曲常有多个发行版（不同年份、不同地区、Remaster 版本），它们共享同一个 AcoustID。Picard 会列出候选让你选，别跳过这步直接保存。

**扫描失败不一定是文件坏了。** 查不到 AcoustID 有三种原因：服务器没这个指纹、指纹没有关联到任何 MusicBrainz 录音、指纹匹配上了但没挂到录音上。前两种只能靠手动搜索或从文件名猜。指纹识别对**未收录的独立发行、地方语种发行**命中率明显偏低，这是数据库覆盖度问题，不是操作问题。

**提交指纹有前置条件。** 手动匹配上正确的录音之后，「Submit」按钮才会可用。扫描过的文件若再点「Generate Fingerprints」，提交按钮会重新变灰——Picard 记住了「这个指纹已提交过」。

**保存不等于整理文件。** 默认只改标签，文件名和目录不动。要改名必须在选项里启用文件重命名；想搬到别处还得单独开启移动操作。这两件事默认都是关的。`,
      resources: [
        {
          kind: "link",
          title: "Picard 官网",
          url: "https://picard.musicbrainz.org",
          note: "各系统安装包与项目动向的入口，文档也从这里进入。",
        },
        {
          kind: "html",
          title: "官方文档：文件命名脚本写法",
          url: "https://picard-docs.musicbrainz.org/en/latest/tutorials/naming_script.html",
          note: "从零推导一条完整命名脚本，含转义规则与 /$num 用法。",
        },
        {
          kind: "html",
          title: "官方文档：快捷键全表",
          url: "https://picard-docs.musicbrainz.org/en/latest/appendices/keyboard_shortcuts.html",
          note: "主窗口、标签编辑器、脚本编辑器三处快捷键的权威清单。",
        },
        {
          kind: "html",
          title: "官方文档：AcoustID 指纹原理",
          url: "https://picard-docs.musicbrainz.org/en/latest/tutorials/acoustid.html",
          note: "解释指纹为何能跨码率匹配，以及查询失败的三种原因。",
        },
      ],
    },
    whoFor: "本地存了几百上千个音频文件、标签混乱或封面缺失，想一次性批量整理的人。",
    whoNot: "只关心播放、不在意元数据的人；曲库以未被 MusicBrainz 收录的小众或地方语种发行为主的人（匹配率会让人失望）。",
    alternatives: [],
    featured: false,
    previews: [],
    icon: { letter: "P", color: "#BA478F" },
  },
];
