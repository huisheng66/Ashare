// 第 6 条：opengym。内容全部核实自官方 README（Features 三段、Quick start、
// Configuration reference 全表、sync 章节），未凭印象。
export const entries = {
  opengym: {
    slug: "opengym",
    name: "openGym",
    nameZh: "openGym",
    aliases: ["opengym", "open gym", "健身记录", "力量训练", "自托管健身", "训练日志"],
    summary:
      "自托管的健身与体重记录：1324 个动作库、引导式训练、渐进规则与 PR 追踪，手机上用 passkey 登录。",
    scenes: ["data", "tools", "social"],
    platforms: ["linux", "windows", "macos"],
    source: "opensource",
    tags: ["健身", "自托管", "Docker", "渐进训练", "开源"],
    body:
      "openGym 是一个自托管的健身与体重追踪应用，一句话概括它的取向：**数据在你自己的机器上，代码你可以 fork，但用起来仍然像个现代 App**。\n它针对的痛点很具体——大多数健身 App 把数据放在别人服务器上、把用户推向订阅、公司倒闭数据就没了。openGym 的对照是：一条 \`docker compose up\` 就跑起来，没有别人的账号、没有订阅、没有广告、没有遥测。\n**规划能力是它最厚的一层。** 1324 个动作的动作库，带动画演示，可以按肌肉部位在身体图上浏览和筛选，也能按你家里有什么器械过滤。四个开箱计划（Push/Pull/Legs、Upper/Lower、Full Body、5×5）加载后就是普通可编辑的例程。细节做得比一般 App 细：单次训练可以移到别的某天而不动周计划；周起始日可选周一或周日；支持超级组、热身组、递减组、rest-pause、计时动作（平板支撑、悬垂、负重行走）、按时间和配速的有氧；杠铃、EZ 杠、六角杠和史密斯机的配重片计算器按你实际拥有的片子算。\n**训练时的取舍也值得说。** 引导式训练会自己开始、重量从上次数预填、组间自动跑休息计时、边练边识别 PR。休息日会告诉你下一次训练什么时候。可选的用力程度列用 RIR 或 RPE 表示并配色，每档配一句人话解释。\n**进阶规则不是写死的。** 每个例程或动作可以选线性、Greyskull LP、经过可见次数范围的双重进阶，或者加时间。每个目标值都会解释「为什么是这个数」；没完成的次数不会加重量，卡住了会触发减量周。这一层是它和普通记录 App 的分界。\n**数据是你自己的。** passkey 登录（Face ID、Touch ID、指纹），每个 profile 的数据跨设备同步；密码登录可以按实例开启，新设备用一次性码或二维码配对。两台设备同时编辑会合并而不是互相覆盖。可以从 FitNotes、Strong、Hevy 导入（CSV 或 API key），从 Apple Health 导入体重，随时导出成一个 JSON 文件。17 种语言，包括从右往左的阿拉伯语。\n**两个可选功能默认关闭，跑在你自己的服务器上，用你自己的 provider key：** AI 教练（起草一周例程，之后根据记录建议调整，每项改动都要你批准；支持 Anthropic、OpenAI、Gemini、任何 OpenAI 兼容端点、也支持 Ollama）和 MCP server（让 Claude Desktop 这类助手回答你的训练历史，只读、本地、不在 Docker 构建里）。\n代价说清楚：需要一台能跑 Docker 的机器（NAS、树莓派、服务器都行），首次启动会下载约 140MB 的动作媒体。手机要用 passkey 访问需要域名的 HTTPS，官方给了 Cloudflare Tunnel、Caddy、Traefik、nginx 四种方案，另有局域网 HTTPS 和 Kubernetes 的专门指南。界面是英文为主的移动端应用，没有桌面原生客户端（但浏览器可用）。",
    officialUrl: "https://opengym.duarte-santos.ch",
    links: {
      official: "https://opengym.duarte-santos.ch",
      github: "https://github.com/DuarteSantos8/openGym",
    },
    officialLabel: "opengym.duarte-santos.ch",
    whoFor:
      "自己做力量训练、认真记录进阶数据、并且不接受把健身历史托管在别人服务器上的人；有 NAS 或小服务器愿意跑 Docker。",
    whoNot:
      "只想记两笔就完事的人（1324 个动作的库和进阶规则是负担）；或者需要桌面原生应用的人——它只有移动端 Web 和 Android APK。",
    installTips: [
      "先试再装：官网的 in-browser demo 就是真实应用加示例数据，https://opengym.duarte-santos.ch/demo/ 打开就能点。",
      "正式部署四条命令走完：git clone、cp .env.example .env、docker compose pull、docker compose up -d。",
      "docker compose pull 拉的是预构建镜像（amd64 和 arm64 都有）；想本地构建加 --build。主机不需要装 Node。",
      "手机用 passkey 访问必须在域名上配 HTTPS，.env 里改两行；官方有 Cloudflare Tunnel / Caddy / Traefik / nginx 四个方案。",
      "首次启动会一次性下载约 140MB 的动作媒体，先知道这件事免得以为卡住了。",
    ],
    alternatives: [],
    icon: { letter: "G", color: "#2E7D5B", simpleIcon: "dumbbell" },
    guide: {
      intro: "从 demo 试用到 Docker 部署，再到进阶规则怎么配，说明哪些配置项值得改、哪些别动。",
      markdown: `# openGym：自托管的健身记录

## 先在浏览器里试，别急着装

官方提供一个 in-browser demo，是**真实应用加示例数据**，不是录屏：

[opengym.duarte-santos.ch/demo/](https://opengym.duarte-santos.ch/demo/)

想看它到底怎么用，先点这个比读文档快。Android 用户也可以直接下 Releases 里的 APK。

## 四条命令部署

前提是有 Docker 和 Compose：

\`\`\`bash
git clone https://github.com/DuarteSantos8/openGym
cd openGym
cp .env.example .env
docker compose pull      # 预构建镜像，amd64 + arm64
docker compose up -d
\`\`\`

打开 \`http://localhost:8080\`，点 **Create profile**，就进来了。首次启动会一次性下载动作媒体（约 140MB）。

\`docker compose pull\` 拉的是预构建镜像。**想本地构建就加 \`--build\`**，主机不需要装 Node。

镜像发布在两个地方，docker-compose.yml 默认拉 GitLab 的：

- \`registry.gitlab.com/duartesantos8/opengym/{api,web}\`（默认）
- \`ghcr.io/duartesantos8/opengym-{api,web}\`

想用 GHCR 就改 \`image:\` 那两行。

## 手机上用要配 HTTPS

**passkey 需要域名的 HTTPS，这是硬要求。** .env 里改两行就行，官方在自托管指南里给了 Cloudflare Tunnel、Caddy、Traefik、nginx 四种方案，另有局域网 HTTPS 和 Kubernetes 的专门文档。

只在家里的局域网用、不需要 passkey，HTTP 就够。

## 配置项：改哪些，别改哪些

全部通过 .env 配置，这几个值得知道：

| 变量 | 作用 | 默认 |
|---|---|---|
| \`RP_ID\` | passkey 绑定的域名 | \`localhost\` |
| \`ORIGIN\` | 应用对外的完整 URL | \`http://localhost:8080\` |
| \`WEB_PORT\` | Web UI 的主机端口 | \`8080\` |
| \`RP_NAME\` | passkey 弹窗里显示的名字 | \`openGym\` |
| \`SESSION_DAYS\` | 登录有效期（天） | \`90\` |
| \`INVITE_ONLY\` | 需要邀请码才能建 profile | 关 |
| \`ALLOW_GUEST\` | 提供「不登录直接用」 | 开 |
| \`PASSWORD_LOGIN\` | 除 passkey 外也提供密码登录 | 关 |
| \`AUDIT_LOG\` | 记录登录与管理操作 | 开 |
| \`AUDIT_MAX\` | 活动日志保留条数 | \`5000\` |

**上手阶段只改前三个。** \`RP_ID\` 和 \`ORIGIN\` 是换域名时必须同步改的两个——只改一个会导致 passkey 验证失败，这是最常见的踩坑。

\`ALLOW_GUEST\` 默认开着，意味着别人访问你的实例可以不建 profile。放到公网的话建议关掉，或者开 \`INVITE_ONLY\`。另外 \`AUDIT_IP\` 默认是 \`off\`，三个档位是 \`off\` / \`net\`（只记网络段）/ \`full\`（完整地址），想要审计又不想存全 IP 就用 \`net\`。

## 进阶规则是它真正的差异点

每个例程或每个动作都能单独配进阶方式：

- **线性**：每次加固定重量
- **Greyskull LP**：线性 + deload 循环
- **双重进阶**：在一个可见的次数范围内涨，达到上限就加重量重置
- **加时间**：适用于计时类动作

关键在于**每个目标值都会解释「为什么是这个数」**。这解决了进阶训练最大的问题——新手不知道为什么该加 2.5 公斤。

两条行为规则也重要：**没完成的次数不会加重量**（不会因为你漏了一次就往上跳），**卡住了会触发减量周**。

配套的追踪有：每个动作的预估 1RM（各用各的曲线）、结构性平衡比例（Poliquin、Thibaudeau、ATG 三种口径）、一年活动热力图。肌肉图有三种模式——训练量分布、还在恢复的部分、长期没练到的部分。

## 记录细节

- 配重片计算支持杠铃、EZ 杠、六角杠、史密斯机，按你实际拥有的片子算
- 自重动作知道「不加载重量」，只记次数；有 dip belt 可以加配重
- 弓步和单侧动作支持单侧次数
- 训练时屏幕不熄灭；休息计时提醒可以让屏幕闪光（嘈杂的健身房里用）
- 可选的用力程度列用 RIR 或 RPE 表示，带颜色，每档配一句人话

## 数据进出

导入：FitNotes、Strong、Hevy（CSV 或 API key）、Apple Health 体重导出。

导出：随时导出一个 JSON 文件。计划可以分享成小文件，或者打印成 PDF。

同步：两台设备同时编辑会合并，不会互相覆盖。密码登录可以按实例开启，新设备用一次性码或二维码配对。

## 两个默认关闭的可选功能

跑在**你自己的服务器**上，用**你自己的 provider key**：

**AI 教练**——起草一周例程，之后根据你记录的内容建议调整，每一项改动都要你批准。支持 Anthropic、OpenAI、Gemini、任何 OpenAI 兼容端点，也支持 Ollama（完全本地）。

**MCP server**——让 Claude Desktop 这类助手回答关于你训练历史的问题。只读、本地，**不在 Docker 构建里**，要单独启用。

## 语言

17 种，包括从右往左书写的阿拉伯语。大部分语言的动作品名和说明都翻译了。

## 什么时候别用它

- 只是想随手记两笔——1324 个动作的库和进阶规则会显得重
- 需要桌面原生客户端——它只有移动端 Web 加 Android APK
- 没有一台能跑 Docker 的机器——这是硬前提
`,
      resources: [
        {
          kind: "link",
          title: "在线 demo：真实应用加示例数据",
          url: "https://opengym.duarte-santos.ch/demo/",
          note: "官方提供的浏览器内试用，是真应用不是录屏。想判断它是否合用先点这个。",
        },
        {
          kind: "link",
          title: "自托管指南：HTTPS 与四种反向代理方案",
          url: "https://github.com/DuarteSantos8/openGym/blob/main/docs/SELF_HOSTING.md",
          note: "手机用 passkey 必须在域名上配 HTTPS。这里有 Cloudflare Tunnel、Caddy、Traefik、nginx 四种走法，另有局域网 HTTPS 与 Kubernetes 的独立文档。",
        },
        {
          kind: "link",
          title: "README：功能全表、配置参考与镜像地址",
          url: "https://github.com/DuarteSantos8/openGym/blob/main/README.md",
          note: "Features 按规划/训练/进展三段列全，Quick start 之后是可折叠的 .env 配置参考全表，还有 AI_COACH.md 与 mcp/README.md 两个可选功能的入口。",
        },
      ],
    },
  },
};
