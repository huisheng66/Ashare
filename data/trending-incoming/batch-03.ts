// 第 3 条：voicestudio。内容全部核实自官方 README_CN.md、docs/engines/README.md、
// docs/feature-catalog.md、docs/performance.md，未凭印象。
export const entries = {
  voicestudio: {
    slug: "voicestudio",
    name: "VoiceStudio",
    nameZh: "VoiceStudio",
    aliases: ["voicestudio", "voice studio", "声音克隆", "语音克隆", "配音", "有声书", "tts"],
    summary:
      "开源本地语音工作台：声音克隆、声音设计、视频配音、听写转录，646 种语言，Electron 桌面应用。",
    scenes: ["music", "tools", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["语音合成", "声音克隆", "视频配音", "开源", "本地运行"],
    body:
      "VoiceStudio 是一个 Electron 桌面应用，把语音相关的工作收进一个本地工作台：克隆一个已有声音、用文字描述设计一个新声音、给视频配时间轴对齐的配音、随时听写、转录，以及批量生成有声书。官方声明支持 646 种语言。\n它的架构值得先说清楚，因为这决定了它和别的工具怎么比。语音生成（文本转语音）和转录（语音转文本）是两套独立的引擎池，不是绑在一起的。生成侧有 16 个引擎可选，默认是 VoiceStudio 本身（底层基于 k2-fsa/OmniVoice）；转录侧有 9 个，默认 WhisperX。你可以只装其中一部分，也可以按引擎换。\n算力路由是自动的：NVIDIA 走 CUDA、Apple Silicon 走 Metal（MPS）、其他情况落到 CPU。落回 CPU 不会报错，只是慢很多倍。有两个硬件判断要提前知道：一是官方明确写了 Windows 上 PyTorch 只有 NVIDIA/CUDA 加速，AMD 和 Intel 显卡在 Windows 上跑 PyTorch 引擎仍然走 CPU（audio.cpp 可以通过 Vulkan 用上 Radeon）；二是显存，官方建议 16GB 以上才能并行跑 3-4 路生成，10GB 以下会被自动限制为单路——不要手动调高，这个自动 sizing 就是为了防崩溃。\n它还有一层别家没有的东西：面向智能体的本地 API 和 MCP，可以把配音流程接进 Claude Code 这类工具；README 里甚至给了一段提示词，让编码智能体自己完成硬件检测和安装验证。\n代价是明确的：模型要先下载、磁盘占用可观，官方给纯 CPU 路线报的是 PyTorch CPU 版约 5GB；功能密度高意味着设置项多，官方性能指南开头列的五类「变慢」原因基本都是配置或版本历史问题，需要读文档才能定位。此外应用是 AGPL-3.0，克隆他人声音前必须取得对方许可。",
    officialUrl: "https://voicestudio.sh",
    links: {
      official: "https://voicestudio.sh",
      github: "https://github.com/debpalash/VoiceStudio",
    },
    officialLabel: "voicestudio.sh",
    whoFor: "要在自己机器上做声音克隆、视频配音或批量有声书，并且愿意先下载几个模型、接受显卡依赖的人。",
    whoNot: "只想在线上快速出一段配音的人（要装模型、吃显存）；或者在 Windows 上只有 AMD/Intel 显卡又期待 GPU 加速的人——官方写明那是 CPU。",
    installTips: [
      "macOS 与 Linux 一条命令：curl -fsSL https://voicestudio.sh/install | sh，同一条命令加 --main 可构建主干分支，加 --version X.Y.Z 可指定版本。",
      "Windows 用 PowerShell：irm https://voicestudio.sh/install | iex，或去 Releases 下 .exe。",
      "装完先去 设置 → Performance & Device 看一眼当前算力设备（cuda / mps / cpu），这一栏能直接告诉你有没有真的在用显卡。",
      "第一次生成一定是最慢的（模型权重懒加载约 8 秒、CUDA 要编译内核），从第二次生成的耗时判断性能才有意义。",
    ],
    alternatives: [],
    icon: { letter: "V", color: "#5B4B8A", simpleIcon: "audacity" },
    guide: {
      intro: "从四个工作区到引擎选择与硬件判断，讲清怎么把 VoiceStudio 装起来并跑通第一次合成。",
      markdown: `# VoiceStudio：本地语音工作台怎么用

## 它解决什么问题

做视频要配音、自己写的东西要转成有声书、或者需要把一段音频转成文字——这些活以前要么上云端（有隐私和费用问题），要么拼一堆脚本。VoiceStudio 把它们放进一个 Electron 桌面应用，本地跑模型。

四个工作区：

- **声音克隆**：选一个已有声音，或上传一段清晰的参考录音
- **视频配音**：生成时间轴对齐的音轨
- **声音设计**：用文字描述你想要的声音
- **本地模型**：安装和管理语音模型

## 最小可用路径

打开应用，进声音克隆工作区，选一个内置演示声音，或者加一段自己的参考录音。输入文字，点生成。应用会提示你安装所需模型——第一次必须等下载完。

就这样，一次完整的合成就跑通了。

## 安装

macOS 与 Linux 一键安装：

\`\`\`sh
# 最新版本
curl -fsSL https://voicestudio.sh/install | sh

# 指定已发布版本（替换 X.Y.Z）
curl -fsSL https://voicestudio.sh/install | sh -s -- --version X.Y.Z

# 构建当前 main 分支并安装
curl -fsSL https://voicestudio.sh/install | sh -s -- --main

# 卸载（保留你的数据）
curl -fsSL https://voicestudio.sh/install | sh -s -- --uninstall
\`\`\`

Windows 用 PowerShell：

\`\`\`powershell
irm https://voicestudio.sh/install | iex
\`\`\`

也可以直接去 Releases 拿现成包：macOS 是 .dmg，Windows 是 .exe，Linux 是 .AppImage 或 .deb。

想先看看界面而不装，可以看 [官网演示](https://voicestudio.sh) 上的 GIF。

## 让编码智能体帮你装

官方提供了一条提示词，粘给 Claude Code、Codex、Cursor 这类工具即可：

\`\`\`text
Install the VoiceStudio Electron app on this device and verify it works, following
https://github.com/debpalash/VoiceStudio/blob/main/docs/install/agent.md
\`\`\`

这份智能体安装指南覆盖硬件检测、复用已有数据、下载模型前先征得同意，以及跑一次测试生成。支持技能的智能体也可以直接跑 \`npx skills add debpalash/VoiceStudio\`。

## 硬件：先看这两个硬事实

**一、Windows 上只有 NVIDIA 能加速。** 官方原话：PyTorch GPU acceleration on Windows is NVIDIA/CUDA-only。AMD 和 Intel 显卡在 Windows 上跑 PyTorch 引擎仍然走 CPU——功能正常，只是慢很多倍。例外是 audio.cpp，它可以通过 Vulkan 用上 Radeon。

**二、显存决定并行度。** 官方建议 16GB 以上显存可以并行 3-4 路生成；10GB 以下的卡被刻意限制为单路。这个限制是自动的（按每 5GB 显存一个 worker，上限 4），别手动调高。

**三、参考录音的长度。** Voice Clone 接受最长 75 秒的录音，推荐 5-15 秒干净语音。不同引擎取用方式不同：默认的 OmniVoice 取前 20 秒里语音最多的片段并自动转写；VoxCPM2 取去静音后的前 30 秒；其余引擎是整段传入、长度未验证。

所以如果你的转写文本和引擎实际取用的片段对不上，生成会被拒绝（\`[clone_ref_too_long]\`）。最省事的做法是不带转写文本。

## 引擎：两套池子，别混

生成（TTS）侧 16 个引擎，转录（ASR）侧 9 个，它们是独立的：

| 侧 | 默认 | 几个可选项 |
|---|---|---|
| 语音生成 | VoiceStudio（基于 k2-fsa/OmniVoice） | VoxCPM2（带声音设计）、CosyVoice 3、GPT-SoVITS、IndexTTS 2.5、MOSS-TTS 系列、KittenTTS（纯 CPU，8 个预设声音） |
| 语音转录 | WhisperX | Faster-Whisper、MLX Whisper、Parakeet TDT、Moonshine、FunASR、sherpa-onnx（实时听写） |

有些引擎自带限制要留意：MLX-Audio 只在 Apple Silicon 上跑；MOSS-TTS-v1.5 是 8B 模型，很重；dots.tts 和 PocketTTS 不支持 Windows 或 Intel Mac。

在 **模型目录**（Model Catalogue）里选引擎，或者按 Ctrl/Cmd+E 快速切换。想固定某个引擎可以设 \`OMNIVOICE_TTS_BACKEND\` / \`OMNIVOICE_ASR_BACKEND\`。

## 遇到「变慢了」怎么查

性能指南开篇列的五类原因，按顺序排查：

1. **声音档案的 Transcript 字段是空的。** 克隆需要参考录音的转写文本，空的会让应用跑一次完整 Whisper 转写。v0.3.15 之前每次生成都会重跑一遍（就是那个「更新后 TTS 变慢、CPU 跑满」的回归问题）。修法：打开声音编辑器看 Transcript 框，空就填上内容。
2. **重启后第一次生成总是最慢。** 权重懒加载约 8 秒，CUDA 要编译内核。从第二次开始计时。
3. **内存压力。** 16GB 统一内存的机器上，旁边开 40 个标签页的浏览器就够把模型挤出内存。设置 → Performance 能看空闲内存，也有不重启释放模型的 Flush 操作。
4. **你以为在用显卡，其实在 CPU 上。** 三个地方会告诉你真相：设置 → Performance → Device & compute 里的实时设备名、设置 → About → Run self-check、以及模型目录里每个引擎的路由徽章（GPU active / CPU fallback / CPU，悬停能看到原因）。
5. **之前取消过一次配音。** 配音会把 TTS 模型临时挪到 CPU 给 ASR 腾显存，完成后再挪回来。v0.3.23 之前这条回迁只在完全成功时执行，中途取消或报错就会把 TTS 模型留在 CPU 上，之后每次生成都慢 10-50 倍。v0.3.23 修了。

## 接入你的智能体

它提供本地 API 和 MCP 接口，可以把配音流程接进自动化。配置看官方文档的 Local API 与 MCP 两页。

## 心里有数的限制

- **模型要先下载，磁盘吃得下。** 纯 CPU 路线 PyTorch 本体就约 5GB，模型另算。
- **AGPL-3.0。** 应用是开源的，模型各有各的条款——商用前挨个确认。克隆别人的声音必须先拿到对方许可。
- **只做本地。** 远程 worker 是可选功能，使用情况分析要同意才启用。
- **0.5.3 是最后一个 Tauri 版本。** 现在的桌面应用和 Web UI 全部是 Electron，Tauri 时代的用户需要单独迁移。

想读原文，中文 README 在仓库根目录，引擎与硬件细节在 docs/engines 和 docs/performance。
`,
      resources: [
      {
        kind: "link",
        title: "中文 README：安装、文档索引与许可说明",
        url: "https://github.com/debpalash/VoiceStudio/blob/main/README_CN.md",
        note: "官方维护的简体中文版，四工作区说明、一键安装命令、文档表格与赞助/许可段落都在这里；日文版另有 README_JA.md。",
      },
      {
        kind: "link",
        title: "引擎指南：16 个 TTS 引擎与 9 个 ASR 引擎的逐个说明",
        url: "https://github.com/debpalash/VoiceStudio/blob/main/docs/engines/README.md",
        note: "一张表列出每个引擎跑在什么设备上、支不支持克隆、需要什么才能启用（多数是 pip install 一行）；末尾的参考录音长度表解释了为什么转写文本可能被拒。",
      },
      {
        kind: "link",
        title: "性能指南：变慢的五类原因与可调项",
        url: "https://github.com/debpalash/VoiceStudio/blob/main/docs/performance.md",
        note: "最该先读的一篇。开头五类「变慢」原因按排查顺序排列，后半是环境变量表（显存自动 sizing、统一内存让位、生成超时预算）。",
      },
      ],
    },
  },
};
