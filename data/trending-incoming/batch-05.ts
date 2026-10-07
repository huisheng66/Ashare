// 第 5 条：effect。内容全部核实自官方 README（Requirements / Packages 表 / LTS 章节）
// 与 effect.website，未凭印象。
export const entries = {
  effect: {
    slug: "effect",
    name: "Effect",
    nameZh: "Effect",
    aliases: ["effect", "effect ts", "effect-ts", "effectts", "typescript 函数式", "effect 4"],
    summary:
      "TypeScript 的生产级函数式框架：用类型表达错误、依赖注入、结构化并发、调度与追踪，4.x 为 LTS 版本。",
    scenes: ["code", "engineering"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["TypeScript", "函数式", "错误处理", "并发", "开源"],
    body:
      "Effect 是用来写生产级 TypeScript 应用的库，核心主张是把「规模化之后难处理的问题」变成类型系统能约束的东西：带类型的错误、依赖注入、结构化并发、调度、追踪、统一的 schema 校验。\n和普通工具库的区别在思路。它不满足于用 try/catch 捕获异常，而是让错误成为数据的一部分——错误通道的类型是显式的，你能穷举、能组合、编译器会检查你处理了没有。并发同理：它给的是结构化并发（Structured Concurrency），作用域结束会等里面所有任务收尾，而不是像 Promise.race 那样悬着。\n**环境要求是硬的，装之前先确认：** TypeScript 5.9 或更新（官方推荐 TypeScript 7，性能与工具链兼容性最好），Node.js 18 起步（部分集成包要更高，比如 @effect/sql-sqlite-node 要 22.16+），而且 tsconfig.json 里 strict 必须打开——不开 strict 基本用不了它。\n**版本这块要特别留意。** 现在是 Effect 4.x，一个 LTS（长期支持）版本：至少三年支持，含 bug 与安全修复；下个大版本发布后再保一年 bug 修复、两年安全修复。3.x 的源码在 v3 分支，跨大版本升级必须读迁移指南。\n生态是它真正的体量所在。这个 monorepo 里核心包 \`effect\` 之外还有 30 多个集成包，全部同步版本发布：五套 platform（browser / bun / deno / node / node-shared）、十一个 SQL 客户端（PostgreSQL、MySQL、ClickHouse、SQL Server、D1、libSQL、SQLite 的多种绑定、Durable Objects）、五个 AI provider（Anthropic、OpenAI、OpenAI-compat、Cloudflare、TypeSafe、OpenRouter）、三套前端状态绑定（React、Solid、Vue），以及 OpenTelemetry 集成、Vitest 测试辅助和文档工具。\n代价是学习曲线。它不是渐进采用的库——要么接受它的编程范式，要么一直写别扭的胶水代码。官方自己也很坦诚地提供了 adoption partners（实施、咨询、培训）和生产支持渠道，说明这是有落地成本的技术选型。",
    officialUrl: "https://effect.website",
    links: {
      official: "https://effect.website",
      github: "https://github.com/Effect-TS/effect",
    },
    officialLabel: "effect.website",
    whoFor:
      "在做长期维护的 TypeScript 后端服务、愿意为了错误处理和并发的可推断性改变编码范式的团队。",
    whoNot:
      "小项目、脚本、或者团队里没人愿意学新范式——Effect 的收益要在系统变复杂之后才显现，前期只会觉得啰嗦。",
    installTips: [
      "先确认三个硬条件：TypeScript ≥ 5.9、Node ≥ 18、tsconfig 里 strict 已开。第三条最容易漏。",
      "npm install effect 就一个包，别一上来装全套集成——按需加 @effect/platform-node 或某个 sql 包。",
      "在用 3.x 就先读 MIGRATION.md 再动，跨大版本有 API 变更。",
      "编辑器里把 Effect 的 LSP 配起来，错误通道的类型信息在 hover 里能省很多查文档的时间。",
    ],
    alternatives: [],
    icon: { letter: "E", color: "#3B4A8C", simpleIcon: "typescript" },
    guide: {
      intro: "从环境要求到 LTS 策略，再到 monorepo 里 30 多个集成包怎么按需选，最后给一个上手顺序。",
      markdown: `# Effect：TypeScript 的生产级框架

## 先确认环境，不满足别装

这三条是硬的，官方原话：

- **TypeScript 5.9 或更新。** 官方推荐 TypeScript 7，说是对 Effect 的 TypeScript 工具链兼容性和性能最好。
- **Node.js 18 或更新**，这是通用最低线。但部分集成包要求更高——比如 \`@effect/sql-sqlite-node\` 要 Node 22.16 以上。
- **\`strict\` 必须打开。** tsconfig.json 里不启用严格类型检查基本没法用。

第三条最容易被漏掉。strict 没开的时候，Effect 的类型层面优势直接消失，你会得到一堆报错和一堆类型断言。

\`\`\`sh
npm install effect
\`\`\`

就这一个包。

## 它到底改变了什么

核心是把难处理的问题挪到类型系统里：

| 问题 | 传统做法 | Effect 的做法 |
|---|---|---|
| 错误 | try/catch + any，漏处理不报错 | 错误是数据，类型里显式表达，漏处理编译不过 |
| 并发 | Promise.race 之后任务悬着 | 结构化并发，作用域结束等所有任务收尾 |
| 依赖 | 手写单例、容器、导入顺序 | 依赖注入，依赖在类型里可见 |
| 追踪 | 手动打点，日志和业务代码缠在一起 | 内建 tracing，接 OpenTelemetry |
| 校验 | 每处手写 zod/joi 调用 | 统一 schema 校验 |

**错误当成值处理**这一点是最需要适应的。写惯 try/catch 的人第一反应是「为什么不能直接抛」，答案是因为抛异常会让调用方无法知道可能发生什么，而类型化的错误通道能穷举、能组合。

## 版本策略：4.x 是 LTS，这是重点

Effect 4.x 是长期支持版本，保证是明确写出来的：

- 至少三年支持，含 bug 修复与安全修复
- 下一个大版本发布后，再保一年 bug 修复
- 下一个大版本发布后，再保两年安全修复

API 分三档：stable 的破坏性变更只在大版本发生；unstable 的可能在小版本变；experimental 的可能在补丁版本变。

v3 的源码在 \`v3\` 分支，v3 的 issue 和 PR 也提到那个分支。**从 3.x 升级必读 [MIGRATION.md](https://github.com/Effect-TS/effect/blob/main/MIGRATION.md)**。

## 包怎么选

这个 monorepo 里有核心包 \`effect\` 加 30 多个集成包，**全部同步版本一起发布**（这一点对依赖管理有意义：不会出现核心和集成包版本错配）。按用途挑：

| 需求 | 包 |
|---|---|
| 运行时适配 | \`@effect/platform-node\`、\`-bun\`、\`-deno\`、\`-browser\`、\`-node-shared\` |
| 数据库 | \`@effect/sql-pg\`、\`-mysql2\`、\`-sqlite-node\`、\`-d1\`、\`-clickhouse\`、\`-mssql\`、\`-libsql\` 等 11 个 |
| AI 接入 | \`@effect/ai-anthropic\`、\`-openai\`、\`-openai-compat\`、\`-openrouter\`、\`-cloudflare\`、\`-typesafe\` |
| 前端状态 | \`@effect/atom-react\`、\`-atom-solid\`、\`-atom-vue\` |
| 可观测性 | \`@effect/opentelemetry\` |
| 测试 | \`@effect/vitest\` |
| 文档 | \`@effect/docgen\`（生成文档）、\`@effect/doctest\`（把 JSDoc 示例当测试跑） |

注意 \`@effect/doctest\` 那一行——把 JSDoc 里的示例当成 Vitest 测试运行，意味着文档里的代码不会烂掉。这个设计比一般文档工具认真。

**不要一上来装全套。** 核心包一个，运行时适配一个，数据库（如果需要）一个，就够开始了。

## 官方也承认它有落地成本

这一点值得单列，因为它比技术点更能决定你该不该用。官方在 README 里直接提供 adoption partners（实施、咨询、团队扩展、培训、商业支持）和生产支持渠道，并明说正在探索如何更好地支持在生产环境运行 Effect 的团队。

翻译成决策语言：**这是一次技术选型，不是一次装包。** 团队里没有人愿意学新范式的时候，落地成本会高于收益。

## 上手顺序

1. 确认 strict 已开，TypeScript ≥ 5.9
2. \`npm install effect\`，只装核心
3. 读官方文档的 Introduction 部分，先建立「错误是值」这个心智
4. 把一个已有的小模块用 Effect 重写，感受类型化错误的写法
5. 需要跨运行时了再加 \`@effect/platform-node\`
6. 需要数据库了再选对应的 \`@effect/sql-*\`
7. 接 \`@effect/opentelemetry\` 上可观测性
8. 生产部署前读一遍 MIGRATION 与 LTS 章节，确认你用的 API 属于 stable 档

## 社区

Discord 是提问和交流的主场，官方核心团队在里面。Community Hub 有 meetup 和把 Effect 引进自己公司的路径。另外有专门的 jobs 页面列在招 Effect 工程师的公司——评估这个技术的团队成熟度时，可以从那里侧面看。
`,
      resources: [
        {
          kind: "link",
          title: "官方文档站：入门、语言指南与 API 参考",
          url: "https://effect.website",
          note: "API 参考按包分开（docs/v4/api/effect 之类），4.x 文档在 /docs/v4/ 路径下。",
        },
        {
          kind: "link",
          title: "3.x → 4.x 迁移指南",
          url: "https://github.com/Effect-TS/effect/blob/main/MIGRATION.md",
          note: "在用 3.x 就必读。4.x 是 LTS，跨大版本升级前先确认哪些 API 变了。",
        },
        {
          kind: "link",
          title: "README：环境要求与 30+ 集成包全表",
          url: "https://github.com/Effect-TS/effect/blob/main/README.md",
          note: "包表带官方 API 文档直链，是按需选包最快的索引；LTS 保证条款也在这一页。",
        },
      ],
    },
  },
};
