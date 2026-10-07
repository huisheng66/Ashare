// 第 16 条：openclaw。内容全部核实自官方 README（安装脚本、Node 版本要求、
// Gateway 架构、安全模型、遥测默认值、基金会治理）与 docs.openclaw.ai 的
// why-openclaw / getting-started / security / telemetry 页面，未凭印象。
export const entries = {
  openclaw: {
    slug: "openclaw",
    name: "OpenClaw",
    nameZh: "本地AI 助手（多渠道）",
    aliases: [
      "openclaw",
      "open claw",
      "本地 ai 助手",
      "自托管 ai 助手",
      "聊天机器人",
      "ai agent",
      "个人助手",
    ],
    summary:
      "跑在自己设备上的开源 AI 助手，接入微信之外的 20 多个聊天渠道；状态与凭据留在本机，默认只做每日版本检查。",
    scenes: ["code", "tools", "social"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["AI 助手", "自托管", "聊天机器人", "Node.js", "开源", "隐私"],
    body:
      "OpenClaw 是一个开源 AI 助手，跑在**你自己的电脑**上，然后出现在你本来就在用的聊天工具里——Discord、iMessage、Slack、Teams、Telegram、WhatsApp，还有 20 多个别的渠道，另有macOS、iOS、Android、Windows、Linux 原生应用。\n**它和常见的「AI 助手」最大的区别是数据落点：状态、记忆和凭据都留在你的硬件上。** README 里那句「Yours, with no catch」是字面意思：模型和 agent harness（Claude、Codex、本地模型）都是可替换的插件，换模型不用改其他任何东西。你的 prompt 会发给你配置的那个模型提供方和你接的那个聊天平台，仅此而已。\n**架构只有一句话：受信任的 Gateway，不可信的执行，确定性的策略。** Gateway 是本地控制平面，管会话、工具、事件和渠道连接；Control UI、CLI、TUI 都连到它；Channels 把助手接到各个消息平台；Companion apps 和 nodes 提供语音、Canvas、摄像头、屏幕和设备本地操作。同一套 Gateway，在笔记本上是个人助手，在团队里是共享部署——**差别只在配置。**\n**安全上有一条必须记住的规则：入站消息一律当作不可信输入。** 支持私信的渠道默认会把陌生发送者拦在配对流程外，需要你用 openclaw pairing approve <channel> <code> 批准。另外，主会话的工具默认**直接跑在宿主机上**，除非你配了沙箱。所以在把 Gateway 暴露给其他人或开放远程访问之前，官方要求先读安全指南、暴露运行手册和沙箱指南。\n遥测这块值得单独说，因为它和同类项目的常见做法不一样：默认**只有每日版本检查**会外发，匿名功能统计是**主动选择加入**的，设 update.checkOnStart: false 可以把这两样一起关掉。治理上由 OpenClaw Foundation 这个独立 501(c)(3) 负责，没有付费层、没有托管服务、没有 token；OpenAI 是捐赠者，不是所有者。\n**上手只有三步。** 装完自动开始引导流程，走完向导就绪；如果你用 npm 直接装的包，手动跑：\n\nopenclaw onboard --install-daemon\n\n之后用 openclaw gateway status 看状态，用 openclaw dashboard 打开 Control UI，发一条消息确认助手活了。\nNode 版本要求是 **24.16+ 或 26.1+，官方推荐 Node 26**。",
    officialUrl: "https://openclaw.ai",
    links: {
      official: "https://openclaw.ai",
      github: "https://github.com/openclaw/openclaw",
    },
    officialLabel: "openclaw.ai",
    whoFor:
      "想自己掌握数据和凭据、在日常聊天工具里用 AI 助手，并且愿意自己装Node、配渠道、看清安全边界的技术用户。",
    whoNot:
      "要求开箱即用、必须有SLA 或托管服务的企业；以及不愿在宿主机上运行第三方工具、不读安全文档就开放端口的人——工具默认跑在主机上。",
    installTips: [
      "最省事的是官方安装脚本：macOS/Linux/WSL2 用 curl -fsSL https://openclaw.ai/install.sh | bash，Windows PowerShell 用 iwr -useb https://openclaw.ai/install.ps1 | iex。脚本会在需要时装好受支持的 Node 运行时。",
      "已经自己管Node.js 就装已发布的包：npm install -g openclaw@latest --allow-scripts=openclaw。要求 Node 24.16+ 或 26.1+，官方推荐 Node 26。",
      "--allow-scripts=openclaw 这个参数需要 npm 12 或 npm 11.16+；npm 11.15 及更早版本要省略它，否则命令会失败。",
      "装完包之后手动初始化：openclaw onboard --install-daemon。引导流程会验证模型访问、创建工作区并配置 Gateway。",
      "接陌生用户之前先读安全指南和暴露运行手册；主会话的工具默认跑在宿主机上，除非你显式配置了沙箱。",
      "想关掉默认的每日版本检查和匿名功能统计，在配置里设 update.checkOnStart: false。",
    ],
    alternatives: [],
    icon: { letter: "O", color: "#C4562A" },
    guide: {
      intro: "从 Gateway 控制平面到入站消息当作不可信输入，讲清这套本地优先架构为什么这样分层，以及暴露给其他用户前必须先读的那三份文档。",
      markdown: `## 一句话定位

跑在你自己设备上的开源 AI 助手，出现在你本来就在用的聊天工具里。

**数据落点是它和同类项目最大的区别：状态、记忆和凭据都留在你的硬件上。** 模型和 agent harness（Claude、Codex、本地模型）是可替换的插件，换模型不动其他东西。

支持渠道包括 Discord、iMessage、Slack、Teams、Telegram、WhatsApp，以及 20 多个其他渠道；原生应用覆盖 macOS、iOS、Android、Windows、Linux。

## 架构只有一句话

官方在 Why OpenClaw 里把它概括为：**受信任的 Gateway、不可信的执行、确定性的策略。**

分层看：

\`\`\`text
聊天平台（WhatsApp / Telegram / Slack / iMessage …）
                │
            Channels              ← 把助手接到消息服务
                │
  ┌─────────── Gateway ───────────┐
  │  会话 · 工具 · 事件 · 渠道连接 │  ← 本地控制平面
  └────────────────────────────────┘
         ││         │
Control UI / CLI / TUI      Companion apps / nodes
（连到 Gateway）              （语音、Canvas、摄像头、
                屏幕、设备本地操作）
\`\`\`

**同一套 Gateway，在笔记本上是个人助手，在团队里是共享部署——差别只在配置。**

模型提供方既可以是托管的也可以是本地的，tools、skills、plugins 三层负责扩展能力。

## 安装：两条路

### 走安装脚本

安装器支持 macOS、Linux 和 Windows，需要时会自己装一个受支持的 Node 运行时。

\`\`\`bash
# macOS / Linux / WSL2
curl -fsSL https://openclaw.ai/install.sh | bash
\`\`\`

\`\`\`powershell
# Windows PowerShell
iwr -useb https://openclaw.ai/install.ps1 | iex
\`\`\`

### 自己管 Node 就装包

**版本要求是 Node 24.16+ 或 26.1+，官方推荐 Node 26。**

\`\`\`bash
npm install -g openclaw@latest --allow-scripts=openclaw
\`\`\`

这里有个容易踩的版本坑，README 写得很清楚：

> \`--allow-scripts=openclaw\` 适用于 npm 12 或 npm 11.16+。**npm 11.15 及更早版本要省略这个参数。**

## 首次配置

全新安装时，安装脚本会自动开始引导流程，把打开的向导走完即可。如果你是直接用 npm、pnpm 或 Bun 装的包，手动跑：

\`\`\`bash
openclaw onboard --install-daemon
\`\`\`

引导流程会做三件事：验证模型访问、创建工作区、配置 Gateway。

之后：

\`\`\`bash
openclaw gateway status
openclaw dashboard
\`\`\`

**\`openclaw dashboard\` 打开的是 Control UI，在那里发一条消息，就确认助手是活的。** 渠道接入和排错看 getting started 指南。

## 安全：有一条规则必须记住

### 入站消息一律当作不可信输入

这是 README 里Security 段落的第一句，也是整个安全模型的起点。支持私信的渠道**默认会把陌生发送者拦在配对流程外**，需要你手动批准：

\`\`\`bash
openclaw pairing approve <channel> <code>
\`\`\`

### 工具默认跑在宿主机上

README 里这句要划重点：

> Tools run on the host for the main session unless you configure sandboxing.

**也就是说主会话的工具默认在你的机器上直接执行**，不是隔离环境。除非你显式配置沙箱。

所以在你把 Gateway 暴露给其他用户或开放远程访问之前，官方明确要求先读这三份：

- [安全指南](https://docs.openclaw.ai/gateway/security)
- [暴露运行手册](https://docs.openclaw.ai/gateway/security/exposure-runbook)
- [沙箱指南](https://docs.openclaw.ai/gateway/sandboxing)

顺序不能省：先读，再暴露。

## 遥测：默认值比同类项目干净

这一段值得单独拿出来看，因为它和同类项目的常见做法不同：

- 默认**只有每日版本检查**会外发，别的一概不发。
- 匿名功能统计是**主动选择加入**的（opt-in），不是默认开。
- 设 \`update.checkOnStart: false\` 可以**把默认检查和匿名统计一起关掉**。

你的 prompt 会发给你配置的那个模型提供方和你接的那个聊天平台——这是功能本身决定的，无法避免。除此之外就是上面那两项。细节在 [telemetry 文档](https://docs.openclaw.ai/gateway/telemetry)。

## 治理结构

由 **OpenClaw Foundation** 负责，这是一个独立的 501(c)(3)：

- 基金会雇用核心团队、签署发布版本。
- 捐赠者和基础设施赞助方支持基金会，**没有任何一方拥有或指挥这个项目**。
- **OpenAI 是捐赠者，不是所有者。**
- 没有付费层、没有托管服务、没有 token。

这条信息对选型有实际意义：它不会因为某个云厂商改产品路线而变向，也不存在「免费额度用完就锁功能」这种风险。

## 想参与开发

仓库是 **pnpm workspace**，README 明确说了**在仓库根目录直接跑 \`npm install\` 是不支持的**：

\`\`\`bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
\`\`\`

提PR 看 CONTRIBUTING.md。README 里说 **AI 辅助的 PR 是受欢迎的**。

新功能通常应该做成插件，走 [plugin SDK](https://docs.openclaw.ai/plugins/building-plugins)，通过 [ClawHub](https://clawhub.ai) 分发——想加能力时先考虑这条路径，而不是直接改核心。

## 文档地图

README 给了一张按目标索引的表，摘几条常用的：

| 想做的事 | 入口 |
|---|---|
| 配模型和鉴权 | [Models](https://docs.openclaw.ai/concepts/models) · [Model providers](https://docs.openclaw.ai/concepts/model-providers) |
| 接一个消息服务 | [Channels](https://docs.openclaw.ai/channels) |
| 加工具、技能、插件 | [Tools](https://docs.openclaw.ai/tools) · [Skills](https://docs.openclaw.ai/tools/skills) · [Plugins](https://docs.openclaw.ai/plugins) |
| 跑应用和设备节点 | [Platforms](https://docs.openclaw.ai/platforms) · [Nodes](https://docs.openclaw.ai/nodes) |
| 用 CLI 和聊天命令 | [CLI reference](https://docs.openclaw.ai/cli) · [Slash commands](https://docs.openclaw.ai/tools/slash-commands) |
| 配置或运维 Gateway | [Configuration](https://docs.openclaw.ai/gateway/configuration) · [Architecture](https://docs.openclaw.ai/concepts/architecture) |

## 什么情况下别用它

- **要开箱即用和SLA** —— 它是自托管项目，托管服务明确不在计划里。
- **不愿读安全文档** —— 工具默认在宿主机上跑，暴露给外部用户前必须自己搞懂沙箱和暴露运行手册。
- **只想试个模型对话** —— 装Node、配渠道、配 Gateway 这几步对只想试一下的人来说偏重。

## 建议的上手顺序

1. 先读 [Why OpenClaw](https://docs.openclaw.ai/start/why-openclaw)，理解「受信任的 Gateway、不可信的执行」这套分层为什么这么设计。
2. 装完跑完引导流程，用 \`openclaw dashboard\` 在 Control UI 里确认助手活了。
3. **只接一个自己的渠道**，先在单机、单用户下用熟。
4. 再读安全指南和沙箱指南，搞清楚工具的执行边界。
5. 确认要沙箱化了，才考虑加第二个用户或开远程访问。
6. 顺手把 \`update.checkOnStart\` 设成你想要的默认值。

第 3 到第 5 步的顺序是这个项目最容易做错的地方——**先单机跑熟，再谈共享。**
`,
      resources: [
        {
          kind: "link",
          title: "Why OpenClaw：受信任的 Gateway、不可信的执行",
          url: "https://docs.openclaw.ai/start/why-openclaw",
          note: "架构理念页。README 把整套设计概括为「受信任的 Gateway、不可信的执行、确定性的策略」，想理解为什么这样分层就从这里进。",
        },
        {
          kind: "link",
          title: "Security：接入其他用户前的必读",
          url: "https://docs.openclaw.ai/gateway/security",
          note: "安全指南。核心事实是主会话的工具默认跑在宿主机上，除非配置沙箱；入站消息一律当作不可信输入。",
        },
        {
          kind: "link",
          title: "Telemetry：默认发什么、怎么关",
          url: "https://docs.openclaw.ai/gateway/telemetry",
          note: "默认只有每日版本检查，匿名统计是选择加入，update.checkOnStart: false 可一并关闭。选型时值得先看这页。",
        },
      ],
    },
  },
};