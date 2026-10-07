// 第 13 条：public-apis。内容全部核实自官方 README（Index 51 个分类、MCP Servers
// 章节、表格实际统计、License），统计数字由脚本实读 README 表格得出，未凭印象。
export const entries = {
  "public-apis": {
    slug: "public-apis",
    name: "Public APIs",
    nameZh: "公开 API 目录",
    aliases: ["public apis", "public-apis", "api 目录", "免费 api", "api 清单", "开放 api"],
    summary:
      "社区维护的公开 API 清单：51 个领域 2000 多条，每条都标了认证方式、HTTPS 与 CORS 支持情况。",
    scenes: ["data", "education", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["API", "数据集", "开源", "编程学习"],
    body:
      "Public APIs 是一个由社区成员手工维护的公开 API 清单，收录了 2000 多条可以自己产品里用的 API，按 51 个领域分类。\n**它真正有价值的不是数量，是那三列元数据。** 每条 API 后面都标了**认证方式、是否支持 HTTPS、是否支持 CORS**。这三项决定了它能不能用：需要 apiKey 的你得去注册，No 认证的可以直接调；不支持 HTTPS 的在生产环境上不了；CORS 决定了能不能在浏览器前端直接调用。**大部分 API 目录只给一个链接，这三个字段才是真正替你省时间的部分。**\n实际分布（读 README 表格统计）：认证方式上不需要认证 979 条、要 apiKey 906 条、OAuth 153 条，其余是 X-Mashape-Key 之类的小众方式；HTTPS 上 1948 条支持、88 条不支持；CORS 上 789 条支持、231 条明确不支持、剩下约一千条是 Unknown——**这一列有近一半是未知，所以前端项目不能默认都能直接调，得逐个确认。**\n它还多了一块内容是同类清单里少见的：**MCP Servers 章节**。这里列的条目不是给你写代码调的，是给 AI 智能体当工具用的——你装进 Claude、Cursor、VS Code 里，而不是在自己的代码里请求。所以这张表列的是**传输方式（transport）和安装位置**，而不是 HTTPS/CORS。目前列了 OpenSwissData、IPstack MCP、Kuro、corpusAI Cloud Pricing、GitHub 等。\n分类覆盖很全，从 Animals、Anime 这类趣味门类，到 Blockchain、Cryptocurrency、Finance、Geocoding、Machine Learning、Open Data、Patent、Science & Math 这种正经技术类目都有。\n**它是人工维护的，不是自动抓取。** 这意味着条目可能失效、字段可能过时——用它做起点很好，**直接当权威数据源不行**。真要依赖某个 API，去它官方文档确认当前的认证方式和配额。\n许可证是 MIT（2022 public-apis），条目内容来自社区贡献。仓库开头有 APILayer 的商业推广（它自家的 IPstack、Mediastack 等产品），**推广和产品列表与社区清单是两回事**，看清单时注意区分。",
    officialUrl: "https://github.com/public-apis/public-apis",
    links: {
      official: "https://github.com/public-apis/public-apis",
      github: "https://github.com/public-apis/public-apis",
    },
    officialLabel: "github.com/public-apis/public-apis",
    whoFor:
      "要做小项目、需要给产品接一个外部 API，但不想一个个搜文档试的人；以及想找练习项目 API 素材的开发者。",
    whoNot:
      "需要权威、可依赖的 API 数据源的人——这是人工维护的清单，字段可能过时，真要依赖得去官方文档核实。",
    installTips: [
      "直接搜分类名 + API 关键词比浏览 51 个分类快，README 顶部有完整 Index 锚点。",
      "看每条的三列元数据再决定：认证方式（No / apiKey / OAuth）、HTTPS、尤其 CORS——大约一千条 CORS 是未知的。",
      "CORS 未知或不支持但想在浏览器前端调用，就得自己加一层后端代理。",
      "仓库顶部的 APILayer 推广和它自家产品列表不是社区清单的一部分，看条目时注意区分。",
      "要提交新 API 的话看 CONTRIBUTING.md；清单是人工维护的，字段质量参差是正常的。",
    ],
    alternatives: [],
    icon: { letter: "P", color: "#2C6E49", simpleIcon: "api" },
    guide: {
      intro: "讲清那三列元数据怎么用、怎么按认证方式筛、以及 MCP Servers 章节为什么和普通清单不一样。",
      markdown: `# Public APIs：2000 多条公开 API 清单

## 先看那三列，别只看链接

这是这个清单和同类最大的区别。每条 API 后面都标了三项：

| 列 | 决定什么 |
|---|---|
| **Auth** | 要不要注册、注册麻烦不麻烦 |
| **HTTPS** | 能不能上生产 |
| **CORS** | 能不能在浏览器前端直接调 |

**大部分 API 目录只给一个链接，这三列才是真正省时间的部分。**

## 实际分布（读表格统计来的）

**认证方式：**

| 方式 | 条数 |
|---|---|
| No（不需要） | 979 |
| apiKey | 906 |
| OAuth | 153 |
| 其他（X-Mashape-Key、User-Agent 等） | 少量 |

不用认证的接近一半——这批最适合快速做原型。

**HTTPS：** 1948 条支持，88 条不支持。

**CORS：789 条支持，231 条明确不支持，约 1000 条是 Unknown。**

**所以 CORS 那一列有近一半是未知。** 这意味着：做浏览器端项目时**不能默认任何 API 都能直接调**，得逐个确认。不支持或未知的话，加一层自己的后端代理最省事。

## 怎么按需求筛

51 个分类，README 顶部有完整 Index 带锚点。几个实用方向：

| 想做什么 | 看这些分类 |
|---|---|
| 地理编码 | Geocoding |
| 金融数据 | Finance、Cryptocurrency、Currency Exchange |
| 开发调试 | Development、Programming、Testing |
| 数据源 | Open Data、Data Validation |
| 校验类 | Data Validation、Email（验证邮箱有效性） |
| 实用工具 | Weather、Dictionaries、Barcode、Address |

趣味类目（Animals、Anime、Personality）也有——做练手项目和 demo 的时候很好用，不必非得找正经 API。

## MCP Servers：和普通条目不是一回事

清单里有一节单独的 **MCP Servers**，这块值得单独理解。

**普通的 API 条目是给你写代码调的；MCP 条目是给 AI 智能体当工具用的。** 你把它装进 Claude、Cursor、VS Code 里，而不是在自己的代码里发请求。

所以这张表的列不一样——**列的是传输方式（transport）和安装位置**，不是 HTTPS / CORS：

| Name | Auth | Transport | 装到哪 |
|---|---|---|---|
| OpenSwissData | No | stdio, HTTP | Glama |
| IPstack MCP | apiKey | stdio, HTTP | Cursor / Glama |
| Kuro | OAuth | HTTP | – |
| corpusAI Cloud Pricing | No | stdio, HTTP | npm / MCP Registry |
| GitHub | OAuth | stdio, HTTP | Glama |

如果你在做智能体应用，这张表比主清单有用得多——**直接把 API 变成工具，不用自己写集成层。**

MCP 规范本身在 [modelcontextprotocol.io](https://modelcontextprotocol.io)。

## 重要前提：人工维护

**这个清单是社区成员手工维护的，不是自动抓取。** 后果是：

- 条目可能已经失效
- 认证方式、配额、字段可能过时
- 质量参差是正常的

**用它做起点很好，当权威数据源不行。** 真要依赖某个 API 的认证方式或配额，去它官方文档确认一遍——这一步花五分钟，能省掉后面几小时的排查。

## 仓库顶部的推广

README 开头是 APILayer 的商业推广（它自家的 IPstack、Mediastack、Aviationstack 等产品，宣称一个账号一个 key 打通）。

**推广部分和产品列表和社区清单是两回事。** 往下翻到 Index 才是社区维护的 2000 多条。找东西时注意别把它的产品列表当成清单内容。

## 提交新 API

看仓库的 CONTRIBUTING.md。清单既然是人工维护的，提交时格式要求比较严——认证方式这三列要填对，填错或不填的条目价值就低很多。

## 一点用法建议

拿它当**灵感库**而不是依赖库：

1. 按分类翻一遍，找到 3-5 个候选
2. 去每个的官方文档核实认证方式和配额
3. 用 No 认证的那批先跑通原型
4. 定了要用哪个，再看它的限流和 SLA
`,
      resources: [
        {
          kind: "link",
          title: "完整清单 README：51 个分类、2000+ 条 API",
          url: "https://github.com/public-apis/public-apis/blob/master/README.md",
          note: "文件本身约 290KB，浏览器里用 Ctrl+F 搜分类或 API 名比滚动快。顶部有 Index 锚点目录。",
        },
        {
          kind: "link",
          title: "CONTRIBUTING.md：提交新 API 的规范",
          url: "https://github.com/public-apis/public-apis/blob/master/CONTRIBUTING.md",
          note: "人工维护意味着格式要求严。Auth / HTTPS / CORS 三列填得准，条目才有用。",
        },
        {
          kind: "link",
          title: "MCP 官方规范",
          url: "https://modelcontextprotocol.io",
          note: "清单里 MCP Servers 那一节列的就是这个协议的 server。装进智能体客户端而不是自己代码里调。",
        },
      ],
    },
  },
};
