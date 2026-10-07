// 第 12 条：n8n。内容全部核实自官方 README（Key Capabilities / Quick Start /
// License / 名称由来），未凭印象。
export const entries = {
  n8n: {
    slug: "n8n",
    name: "n8n",
    nameZh: "n8n",
    aliases: ["n8n", "nodemation", "工作流自动化", "自动化编排", "低代码", "workflow"],
    summary:
      "可视化工作流自动化平台：拖拽画布加自定义代码，1500+ 集成与 9000+ 模板，可自托管或用云。",
    scenes: ["tools", "engineering", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["自动化", "工作流", "低代码", "自托管", "Docker"],
    body:
      "n8n 是一个用来搭 AI 智能体和工作流的平台。它的形态是**可视化画布 + 自定义代码**的组合：简单步骤拖拽，复杂逻辑直接写 JavaScript、Python 或引入 npm 包。\n**核心卖点是不锁定模型供应商。** 它接 OpenAI、Anthropic、Google 或开源模型，换 provider 不用改架构。对不想被某一家模型绑死的人来说这是关键。\n它的能力线是「从原型到生产」：多步 AI 工作流、逻辑分支、工具调用、**人工审批环节**、完整的可观测性。企业侧有基于角色的访问控制、审计日志、敏感数据处理支持。\n生态规模是它最实的优势：1500+ 集成，加上 9000+ 工作流模板。集成不是「导入配置」那种脆弱粘贴，通常是官方维护的节点。\n部署两种：一条安装脚本（需要 Docker），或者手动 Docker；也可以用官方的 n8n Cloud。\n**但有一件事必须说清楚：n8n 不是 OSI 意义上的开源软件。** 它的许可证是 fair-code 模式下的 **Sustainable Use License** 加上 n8n Enterprise License。官方自己列的三点是：源码始终可见、可自托管部署、可扩展（能加自己的节点和功能）。这三条是 fair-code 的定义，**它不等于 MIT/Apache 那种可以随便拿去改改再发布的许可证**。商业使用、嵌入到产品里对外提供服务这类场景，要自己去读 LICENSE.md 确认边界，必要时联系官方买企业许可。评估「能不能用」之前先看许可，这是选型里最容易事后翻车的一步。\n名字的来历也挺有意思：n8n = \"nodemation\"（Node-View + Node.js + automation），但作者觉得太长不适合命令行，最后取了 n8n。发音是 n-eight-n。",
    officialUrl: "https://n8n.io",
    links: {
      official: "https://n8n.io",
      github: "https://github.com/n8n-io/n8n",
    },
    officialLabel: "n8n.io",
    whoFor:
      "要把多个 SaaS、数据库、AI 模型串成一条自动流程，并且希望流程可视化、可审计、能自托管的人。",
    whoNot:
      "需要 MIT/Apache 那种可自由修改再分发的许可的项目方；或者只想写脚本、不想碰可视化界面的开发者。",
    installTips: [
      "最快路径（需要 Docker）：curl -fsSL https://get.n8n.io | sh。",
      "手动 Docker：先 docker volume create n8n_data，再 docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n，然后开 http://localhost:5678。",
      "用之前先读 LICENSE.md：它是 fair-code（Sustainable Use License），不是 MIT/Apache，商业与嵌入场景要自己确认边界。",
      "从模板起步比自己从零搭快得多——9000+ 工作流模板在 n8n.io/workflows。",
    ],
    alternatives: [],
    icon: { letter: "n", color: "#EA4B71", simpleIcon: "workflow" },
    guide: {
      intro: "从一条命令跑起来开始，讲清它强在哪、许可上要注意什么，以及怎么用模板起步。",
      markdown: `# n8n：可视化工作流自动化

## 一条命令跑起来

需要 Docker：

\`\`\`sh
curl -fsSL https://get.n8n.io | sh
\`\`\`

手动 Docker（想控制数据卷时更清楚）：

\`\`\`bash
docker volume create n8n_data
docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
\`\`\`

打开 http://localhost:5678 就是编辑器。

数据在 \`n8n_data\` 这个卷里——**备份就是备份这个卷**，这一条要记住。

## 许可：先看这个再决定

**n8n 不是 OSI 意义上的开源软件。** 它是 fair-code 模式，许可由 Sustainable Use License 和 n8n Enterprise License 两份组成。

官方自己列的三条是：

- **Source Available** —— 源码始终可见
- **Self-Hostable** —— 可以部署在任何地方
- **Extensible** —— 能加自己的节点和功能

这三条是 fair-code 的定义，**和 MIT/Apache 那种「随便改、随便闭源分发」不是一回事**。

商业使用、把 n8n 嵌进你自己的产品对外提供服务这类场景，**要自己读仓库里的 LICENSE.md 确认边界**，或者联系官方买企业许可。这一步在选型阶段就该做完，事后翻车成本很高。

## 它强在哪

**一是不锁定模型供应商。** 接 OpenAI、Anthropic、Google 或开源模型，换 provider 不用改架构。对不想被某一家绑死的人这是决定性优势。

**二是从原型到生产是连着的。** 多步 AI 工作流、逻辑分支、工具调用、**人工审批环节**、完整可观测性都在产品里，不是让你自己拼。人工审批这一项在处理实际业务时很关键——自动化发出去之前插一道人确认，比全自动但不敢用强。

**三是画布和代码可以混用。** 简单步骤拖拽，复杂的直接写 JavaScript、Python 或引 npm 包。不用在「可视化工具不够用」和「写代码太繁琐」之间二选一。

**四是生态规模。** 1500+ 集成加 9000+ 工作流模板。而且集成通常有官方维护，不是那种复制粘贴配置。

**五是企业特性。** 基于角色的访问控制、审计日志、敏感数据处理支持。

## 从模板起步

**别从空白画布开始。** 9000+ 模板在 [n8n.io/workflows](https://n8n.io/workflows)，找一个接近你要的流程改，比自己从头搭快得多。

集成目录在 [n8n.io/integrations](https://n8n.io/integrations)，1500 多个，按需找。

## AI 相关

n8n 有专门的 AI 与 LangChain 指南：[docs.n8n.io/advanced-ai](https://docs.n8n.io/advanced-ai/)。多步智能体、工具调用这类模式在那里。

主要文档在 [docs.n8n.io](https://docs.n8n.io)。

## 什么时候别用它

- **需要 MIT 或 Apache 许可** —— fair-code 不是。看清 LICENSE.md 的边界。
- **不想用可视化界面** —— 如果你只想写脚本，n8n 的画布反而是额外的一层。
- **一次性任务** —— 它是给持续运行的工作流用的，跑一次就完的脚本用 cron 加脚本更轻。

## 名字的来历

n8n 是 \"nodemation\" 的缩写：Node-View + Node.js + automation。作者觉得太长不适合命令行，于是取了 n8n。**发音是 n-eight-n**，不是 n-and-n。

## 遇到问题

社区论坛在 [community.n8n.io](https://community.n8n.io)，官方 README 直接说那里是获取支持的主要地方。
`,
      resources: [
        {
          kind: "link",
          title: "官方文档：安装、节点参考与 AI 指南",
          url: "https://docs.n8n.io",
          note: "主文档入口。Docker 部署在 hosting/installation/docker/，AI 与 LangChain 模式在 advanced-ai/。",
        },
        {
          kind: "link",
          title: "集成目录：1500+ 集成",
          url: "https://n8n.io/integrations",
          note: "选型时先查这里有没有你要连的系统，能省掉大量自建节点的工作。",
        },
        {
          kind: "link",
          title: "LICENSE.md：Sustainable Use License 全文",
          url: "https://github.com/n8n-io/n8n/blob/master/LICENSE.md",
          note: "评估商业使用或嵌入产品前必读。n8n 是 fair-code 不是 OSI 开源，边界在这里。",
        },
      ],
    },
  },
};
