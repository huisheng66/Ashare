// 第 17 条：firecrawl。内容全部核实自官方 README（核心端点、Python/Node/cURL/CLI
// 四套调用、AGPL-3.0 + SDK 部分 MIT、默认遵守 robots.txt、自托管入口）
// 与 docs.firecrawl.dev 的自托管指南、API 参考页面，未凭印象。
export const entries = {
  firecrawl: {
    slug: "firecrawl",
    name: "Firecrawl",
    nameZh: "网页抓取转Markdown",
    aliases: [
      "firecrawl",
      "网页抓取",
      "网页转markdown",
      "爬虫",
      "crawler",
      "scrape",
      "抓取 api",
      "web scraping",
    ],
    summary:
      "把任意网页转成干净的 Markdown、结构化 JSON 或截图，专为喂给 LLM 设计；覆盖 96% 网页，自托管需 Redis 与 Playwright。",
    scenes: ["code", "data", "tools"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["网页抓取", "Markdown", "LLM", "爬虫", "开源", "API"],
    body:
      "Firecrawl 做的是一件很具体的事：**把任意 URL 转成 LLM 能直接用的干净数据**——Markdown、结构化 JSON、截图。README 里那句「Supercharge your AI agents with data from the web」就是它的定位：给 AI agent 喂网页数据。\n**它的核心卖点是「难的部分它替你处理了」。** 官方列的对比理由里有几条很实在：覆盖 96% 的网页、包括 JS 重页面，不需要你折腾代理；跨数百万页面 P95 延迟 3.4 秒；旋转代理、任务编排、限流、JS 拦截内容全部零配置接管。\n**端点分成两档，这个分层值得先搞清楚。** 核心端点三个：\n- Search —— 搜网并直接拿到结果页的完整内容\n- Scrape —— 把任意 URL 转 markdown、HTML、截图或结构化 JSON\n- Interact —— 先抓取，再用 AI 提示词或代码与页面交互\n\n其余能力还有 Agent（描述需求，自动收集数据）、Crawl（一个请求抓整站）、Map（即刻发现站点全部 URL）、Batch Scrape（异步抓上千个 URL）。\n**四种调用方式给的是同一套能力。** Python 是 \`from firecrawl import Firecrawl\`，Node 是 \`import { Firecrawl } from 'firecrawl'\`，cURL 打 \`https://api.firecrawl.dev/v2/scrape\`，CLI 直接 \`firecrawl scrape <url>\`。所以选语言不是问题，问题是**你要不要自托管**。\n**关于自托管，得先把预期说清楚。** Firecrawl 是开源的，同时也有托管服务（firecrawl.dev），但**云版本包含额外功能**，不是同一个东西。开源版是 AGPL-3.0，SDK 和部分 UI 组件是 MIT——这点在做商业集成前必须看清楚，AGPL 的传染性不是小事。另外官方明确写了：**默认遵守 robots.txt 指令**，并且把「遵守各网站政策」的责任放在使用者身上。\n**最后一条工程建议：如果你只是想让 agent 读网页，先试托管版再决定要不要自托管。** 自托管要准备 Redis、Playwright 和一堆环境变量，而托管版开箱就能用。判断依据是数据敏感度和调用量，不是功能列表。",
    officialUrl: "https://firecrawl.dev",
    links: {
      official: "https://firecrawl.dev",
      github: "https://github.com/mendableai/firecrawl",
    },
    officialLabel: "firecrawl.dev",
    whoFor:
      "要给 AI agent、RAG管道或数据管道喂网页内容的开发者，尤其是需要绕开 JS 渲染、反爬和代理麻烦的场景。",
    whoNot:
      "不能接受 AGPL-3.0 传染性、要做闭源商业集成的人；也不适合只是偶尔抓一两个静态页面的场景——为此自托管 Redis 和 Playwright 不划算。",
    installTips: [
      "最快路径是托管版：到 firecrawl.dev 注册拿 API key（形如 fc-开头），再到 playground 试一次再写代码。",
      "Python SDK：from firecrawl import Firecrawl，建app = Firecrawl(api_key=...) 后直接 app.scrape('firecrawl.dev')。",
      "Node SDK：import { Firecrawl } from 'firecrawl'，用法与 Python 对称。",
      "不想装 SDK 就用 cURL 打 https://api.firecrawl.dev/v2/scrape，鉴权头是 Authorization: Bearer fc-你的KEY。",
      "本地装 CLI：firecrawl scrape https://firecrawl.dev，加 --only-main-content 只要正文。",
      "自托管前先读自托管指南：开源版是 AGPL-3.0 且不含云端那些额外功能，要准备 Redis、Playwright 和一组环境变量。",
    ],
    alternatives: [],
    icon: { letter: "F", color: "#D1442A" },
    guide: {
      intro: "从端点分层到 AGPL 与自托管的取舍，讲清为什么它比直接 requests 抓页面省事，以及许可证那一条为什么必须在集成前确认。",
      markdown: `## 它解决的是哪一层问题

不是「能不能抓到网页」——那件事 \`requests\` 加个正则就能做。它解决的是**抓回来的东西能不能直接喂给模型**。

README 给的对比理由很具体：

| 它声称的 | 含义 |
|---|---|
| 覆盖 96% 的网页，含 JS 重页面 | 不用自己搭代理池去绕渲染 |
|跨数百万页面 P95 延迟 3.4 秒 | 为实时 agent 和动态应用设计 |
| 旋转代理、编排、限流、JS 拦截内容全部接管 | 这些是「难的部分」，零配置 |
| 干净的 markdown、结构化 JSON、截图 | 输出目标就是省token |

最后一条是重点：**输出格式是为LLM 优化的，不是为归档优化的。**

## 端点分两档，先搞清楚你在用哪档

### 核心端点

| 端点 | 作用 |
|---|---|
| Search | 搜网，并直接拿到结果页的完整内容 |
| Scrape | 把任意 URL 转 markdown / HTML / 截图 / 结构化 JSON |
| Interact | 先抓取，再用 AI 提示词或代码与页面交互 |

### 其余能力

- **Agent** —— 描述你需要什么，自动去收集数据
- **Crawl** —— 一个请求抓完整站URL
- **Map** —— 即刻发现一个站点上的全部 URL
- **Batch Scrape** —— 异步抓上千个 URL

**「抓页面」和「抓完再操作」是两件事。** Interact 和 Actions 属于后者：可以在提取前点击、滚动、输入、等待、按键。这对需要登录态或分步流程的页面是刚需。

## 四种调用方式，同一套能力

### Python

\`\`\`python
from firecrawl import Firecrawl

app = Firecrawl(api_key="fc-YOUR_API_KEY")

result = app.scrape("firecrawl.dev")
\`\`\`

### Node.js

\`\`\`javascript
import { Firecrawl } from "firecrawl";

const app = new Firecrawl({ apiKey: "fc-YOUR_API_KEY" });

app.scrape("firecrawl.dev");
\`\`\`

### cURL

\`\`\`bash
curl -X POST 'https://api.firecrawl.dev/v2/scrape' \\
  -H 'Authorization: Bearer fc-YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"url":"firecrawl.dev"}'
\`\`\`

### CLI

\`\`\`bash
firecrawl scrape https://firecrawl.dev
firecrawl https://firecrawl.dev --only-main-content
\`\`\`

第二条命令的 \`--only-main-content\` 很实用——只要正文，去掉导航和页脚。

Search 的调用同理：

\`\`\`python
search_result = app.search("firecrawl", limit=5)
\`\`\`

## 接进 agent：一条命令

README 强调的一点是**agent ready**——用一条命令接到任意 AI agent 或 MCP client 上。

生态资源：

- [MCP server](https://github.com/mendableai/firecrawl-mcp-server)
- [Skills Catalog](https://github.com/firecrawl/skills)，装法是 \`npx skills add firecrawl/skills\`
- [CLI](https://docs.firecrawl.dev/sdks/cli)
- 现成集成：Lovable、Zapier、n8n

**如果你只是想让 agent 读网页，这条命令是唯一要关心的。** 先跑通再考虑别的。

## 自托管：先把预期说清楚

### 开源版不等于云版

README 里有一节专门讲这个，原文意思是：Firecrawl 以 AGPL-3.0 开源，cloud 版本包含额外功能。

**这不是细节，是选型的决定性因素。** 云端能用的东西，开源自托管不一定有。

### 许可证要看两处

官方原话：

> This project is primarily licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). **The SDKs and some UI components are licensed under the MIT License.**

也就是：

| 部分 | 许可证 |
|---|---|
| 主体代码 | AGPL-3.0 |
| SDK 与部分 UI 组件 | MIT |

**要做闭源商业集成的话，这一条必须先过法务。** 具体看各目录下的 LICENSE 文件。

### 自托管要准备什么

官方给了专门的[自托管指南](https://docs.firecrawl.dev/contributing/self-host)。在决定之前先知道代价：Redis、Playwright（要装浏览器）、以及一组环境变量。

**建议的顺序是：先用托管版跑通，再决定要不要自托管。** 判断依据是数据敏感度和调用量，不是功能列表。

## 抓取礼仪：官方自己写清楚了

这一段值得原样记住，README 里是这么写的：

> It is the sole responsibility of end users to respect websites' policies when scraping. Users are advised to adhere to applicable privacy policies and terms of use. **By default, Firecrawl respects robots.txt directives.**

翻译成三条实践：

1. **默认遵守 robots.txt。** 这不是可以随手关掉的开关，是默认行为。
2. **责任在使用者。** 抓不礼貌的站点，责任是你的，不是工具的。
3. **注意隐私政策和使用条款。** 抓公开页面不等于可以无视对方的条款。

## 建议的使用方式

1. 注册拿 key，在 [playground](https://firecrawl.dev/playground) 里试一次，确认输出格式符合你要的样子。
2. 用\`--only-main-content\` 或对应参数只取正文，先把token 压下来。
3. agent 集成走 MCP 或 Skills Catalog，不要自己写胶水。
4. 数据量大、要长期跑，再评估自托管——**先把 Redis 和 Playwright 的成本算进去**。
5. 批量任务用 Batch Scrape 异步接口，不要串行循环。

## 什么时候别用它

- **只偶尔抓一两个静态页面** —— \`requests\` 加正则更快，引入它不划算。
- **要做闭源商业集成** —— AGPL-3.0 主体需要先过法务，或者只单独用 MIT 的 SDK 部分。
- **要抓 robots.txt 禁止的站点** —— 默认就拦，工具不会帮你绕过。
`,
      resources: [
        {
          kind: "link",
          title: "官方文档",
          url: "https://docs.firecrawl.dev",
          note: "SDK、CLI、自托管与全部端点的权威文档。资源列表里的 Playground、Changelog、API Reference 也都从这里进。",
        },
        {
          kind: "link",
          title: "Self-Hosting Guide：自托管要准备什么",
          url: "https://docs.firecrawl.dev/contributing/self-host",
          note: "自托管前必读。开源版不含云端那些额外功能，要准备 Redis、Playwright 和一组环境变量。想清楚要不要自托管再看这一页。",
        },
        {
          kind: "link",
          title: "firecrawl-mcp-server：接进 agent 的快捷方式",
          url: "https://github.com/mendableai/firecrawl-mcp-server",
          note: "MCP server 是 README 强调的 agent ready 路径。只想让 agent 读网页的话，这是唯一要关心的东西。",
        },
      ],
    },
  },
};