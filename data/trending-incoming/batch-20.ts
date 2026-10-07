// 第 20 条：anydoc。内容全部核实自官方 README：五套接入方式（agent skill / CLI /
// Node / Python / WASM / Rust）、14 种格式的基准对比表（含 anydoc 4.4ms、得分 81、
//逐格式全项领先）、内容式格式识别、单文档模型 + 单序列化器的架构、OCR 走
// Firecrawl Parse 的边界（整份上传、无页码选择、Rust crate 不联网）、MIT 许可。
// 基准的评分为LLM 盲评、482 次裁决、语料不可再分发等限定条件亦如实保留。
export const entries = {
  anydoc: {
    slug: "anydoc",
    name: "AnyDoc",
    nameZh: "Office 文档转 Markdown",
    aliases: [
      "anydoc",
      "docx 转 markdown",
      "office 转 markdown",
      "pptx 转 markdown",
      "xlsx 转 markdown",
      "文档转换",
      "epub 转 markdown",
      "pdf 转 markdown",
    ],
    summary:
      "Rust 写的 Office 文档转 GitHub Markdown 库，中位 4.4ms、14 种格式全覆盖；扫描版 PDF 需显式走 Firecrawl Parse。",
    scenes: ["docs", "data", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["文档转换", "Markdown", "Rust", "Office", "开源", "PDF"],
    body:
      "anydoc 是 Firecrawl 做的 Rust 库，把 Word、PowerPoint、Excel、OpenDocument、RTF、EPUB、CSV 和 PDF 转成干净的 GitHub-Flavored Markdown。**它的定位是「单文档级别」的转换，不需要起服务。**\n**核心设计只有一句话：所有格式解析成一个共享的文档模型，再经过同一个 Markdown 序列化器输出。** 这意味着转义、表格、标题锚点、脚注的行为在所有格式上完全一致——不管输入是 2003 年的 .doc 还是昨天的 .pptx。而且**输出端的怪癖只修一次**：给 docx 修的表格转义问题，rtf、odt 和其他格式自动也就好了。\n**速度是它的硬指标之一：纯 Rust、无ML 模型、无外部服务，单文档中位转换时间 4.4 毫秒。** README 里的基准对比（100 份真实文档、14 种格式、LLM 盲评、482 次裁决）显示：anydoc 是**唯一覆盖全部 14 种格式**的工具，得分 81，且每个被评判的格式都是最高分。\n**格式识别看内容不看扩展名。** 格式是从字节本身读出来的——PDF 文件头、RTF 起始组、OLE 流名、ZIP 包 mimetype。**所以扩展名标错的文件照样能正确转换。** CSV 没有这类标记，才需要靠扩展名或显式指定格式。\n**结构保留做得比同类彻底**，包括：带锚点的标题、粗体/斜体/删除线、行内代码与代码块、链接与内部交叉引用、保留源文档编号的有序列表、合并单元格的表格、引用块、脚注与尾注、演讲者备注。公式会转成 LaTeX（Word/PPT 的 OMML、OpenDocument/EPUB 的 MathML、RTF 公式）。\n**五条接入路径，按你的场景选：**\n- **agent skill** —— 一条 \`npx skills add firecrawl/anydoc\`，让 Claude Code、Codex、Cursor、OpenCode 等 agent 能直接读 office 文档\n- **CLI** —— \`npx @firecrawl/anydoc report.docx\`，首次运行会下预编译二进制\n- **Node.js** —— \`npm install @firecrawl/anydoc\`，跑在 libuv 线程池上，不阻塞事件循环\n- **Python** —— 绑定会释放 GIL，其他线程照常跑\n- **浏览器** —— \`@firecrawl/anydoc-wasm\`，**文件在本地转换，完全不离开机器**\n\n**有一条边界必须先说清楚：本地读文本型 PDF，但不做 OCR。** 扫描件或纯图片的 PDF 会以 \`NeedsOcr\` 失败。**显式选择加入后，这类文档才会发给 Firecrawl Parse 做 OCR。** 要注意三点：**只有需要 OCR 的文档会离开机器，但整份文档都上传**（Parse 没有页码选择功能）；Parse 转不了的话 Node 会抛 \`code: 'hosted'\`、Python 抛 \`HostedError\`；**Rust crate 根本没有 ocr 选项，也从不联网。**\nMIT 许可。\n**怎么选：** 只需要本地把 office 文档变成干净 Markdown，它是最快的那个；需要在浏览器里离线处理，选 WASM 版；遇到扫描版 PDF 且不能接受上传，就说明这个场景不适合它。",
    officialUrl: "https://github.com/firecrawl/anydoc",
    links: {
      official: "https://github.com/firecrawl/anydoc",
      github: "https://github.com/firecrawl/anydoc",
    },
    officialLabel: "github.com",
    whoFor:
      "需要把混合来源的 Office 文档批量转成结构化 Markdown 喂给 LLM 的开发者，尤其是要求本地处理、不想上传文档的场景。",
    whoNot:
      "处理扫描版或纯图片 PDF 且要求文件不出本机的场景——OCR 必须显式走托管服务且整份上传；也不适合只转一两个文件的偶发需求，npx 首次下载二进制反而更慢。",
    installTips: [
      "最快试用：npx @firecrawl/anydoc report.docx。首次运行会下载对应平台的预编译二进制；想永久命令就npm install -g @firecrawl/anydoc。",
      "让 agent 直接读 office 文档：npx skills add firecrawl/anydoc，兼容 Claude Code、Codex、Cursor、OpenCode。",
      "Node：npm install @firecrawl/anydoc，然后import { toMarkdown } from '@firecrawl/anydoc'。转换跑在 libuv线程池上，不阻塞事件循环。",
      "Python 用 maturin develop 本地构建；绑定会释放 GIL，多线程场景友好。",
      "要完全离线（含浏览器内）：装 @firecrawl/anydoc-wasm，或直接开https://firecrawl.github.io/anydoc/ 的演示页，文件不出本机。",
      "扫描版 PDF 默认会失败并报 NeedsOcr。确认可以上传后才加 --ocr hosted，并注意整份文档都会离开机器。",
    ],
    alternatives: [],
    icon: { letter: "A", color: "#B85C1E" },
    guide: {
      intro: "从共享文档模型的架构到基准表的读法，讲清4.4 毫秒和 14 种格式背后的设计，以及 OCR 那条边界为什么必须提前确认。",
      markdown: `## 它解决的是哪一层问题

它是**单文档级别的转换库**，不是抓取服务，不起服务、不跑模型。

定位一句话：**把 office 文档变成 LLM 能直接用的干净 Markdown。**

MIT 许可，Firecrawl 出品。它也是 [Firecrawl Parse](https://firecrawl.dev/parse) 的底层实现——不想自己跑就用托管 API。

## 架构：一个模型，一个序列化器

这是理解它全部优势的钥匙：

\`\`\`text
文档字节
  │
  ├─► 格式识别      → 看内容标记，不是看扩展名
  │
  ├─► 格式解析器     → 每种格式一个（doc, docx, ppt, pptx, xls,
  │                   xlsx, odt/ods/odp, rtf, epub, csv）
  │         │
  │         └─► Document  → 共享模型：块、行内元素、表格、
  │                          脚注、资源
  │               │
  │               └─► GFM 序列化器 → Markdown
  │
  └─► PDF → pdf-inspector → 直接出 Markdown
\`\`\`

**所有格式都汇进同一个文档模型和同一个序列化器**，所以输出端的怪癖只修一次。

README 里那句原文很值得记住：

> a table-escaping fix for docx is automatically a table-escaping fix for rtf, odt, and everything else.

**给 docx 修的表格转义问题，对rtf、odt 和其他所有格式同时生效。**

## 五套接入方式

### Agent skill

\`\`\`bash
npx skills add firecrawl/anydoc
\`\`\`

装完agent 就能读它遇到的任何 office 文档。兼容 Claude Code、Codex、Cursor、OpenCode 等。

### CLI

\`\`\`bash
npx @firecrawl/anydoc report.docx               # 输出到stdout
npx @firecrawl/anydoc slides.pptx -o slides.md  # 输出到文件
npx @firecrawl/anydoc - --format csv < data.csv # 从 stdin 读
npx @firecrawl/anydoc scan.pdf --ocr hosted     # 扫描版走托管 OCR
\`\`\`

\`npx\` 首次运行会下载对应平台的预编译二进制。要永久命令就 \`npm install -g @firecrawl/anydoc\`。

### Node.js

\`\`\`bash
npm install @firecrawl/anydoc
\`\`\`

\`\`\`javascript
import { toDocument, toMarkdown, toMarkdownBytes } from "@firecrawl/anydoc";

// 从文件路径
const markdown = await toMarkdown("report.docx");

// 开OCR
const withOcr = await toMarkdown("report.docx", { ocr: "hosted" });

// 从字节，格式靠内容识别
const fromBytes = await toMarkdownBytes(bytes);

// 显式指定格式，CSV 这类无签名格式需要
const fromCsv = await toMarkdownBytes(bytes, "csv");

// 只要文档模型（内含嵌入资源）
const document = await toDocument(bytes);
\`\`\`

**Node 的转换跑在 libuv 线程池上，不阻塞事件循环。** TypeScript 类型随包发布。

### Python

\`\`\`bash
pip install firecrawl-anydoc
\`\`\`

\`\`\`python
import anydoc

# 从文件路径
markdown = anydoc.to_markdown("report.docx")

# 开 OCR
markdown = anydoc.to_markdown("scan.pdf", ocr="hosted")

# 从字节，按内容识别格式
markdown = anydoc.to_markdown_bytes(data)

# 无签名格式需要显式指明
markdown = anydoc.to_markdown_bytes(data, "csv")
\`\`\`

**绑定会释放 GIL，所以其他线程照常运行。** 带类型存根。

### 浏览器（WebAssembly）

\`\`\`bash
npm install @firecrawl/anydoc-wasm
\`\`\`

\`\`\`javascript
import init, { toMarkdownBytes, toDocument } from "@firecrawl/anydoc-wasm";

await init();

const markdown = toMarkdownBytes(bytes);
const fromCsv = toMarkdownBytes(bytes, "csv");
const document = toDocument(bytes);
\`\`\`

**这一条对隐私敏感场景最有用。** 官方有个[浏览器演示页](https://firecrawl.github.io/anydoc/)，跑的就是 WASM 版本，**文件在本地转换，完全不离开机器。**

### Rust

\`\`\`bash
cargo add anydoc
\`\`\`

crate 版本**没有任何 OCR 选项，也从不联网**——这一点后面还会再说。

## 支持的格式

| 类别 | 扩展名 |
|---|---|
| Word | \`.doc\` \`.docx\` \`.docm\` |
| PowerPoint | \`.ppt\` \`.pps\` \`.pot\` \`.pptx\` \`.pptm\` \`.ppsx\` \`.ppsm\` |
| Excel | \`.xls\` \`.xlsx\` \`.xlsm\` \`.xlsb\` |
| OpenDocument | \`.odt\` \`.ods\` \`.odp\` |
| Rich Text Format | \`.rtf\` |
| EPUB | \`.epub\` |
| CSV | \`.csv\` |
| PDF | \`.pdf\` |

**14 种格式全覆盖是它在这轮基准里的唯一性优势**——下面会看到其他工具都漏掉一部分。

## 格式识别：看内容，不看扩展名

格式从文件内容里读出来，用的是各规范指定的标记：

- PDF 的文件头
- RTF 的起始组
- OLE 流名
- ZIP 包的 mimetype 和 content types

**所以扩展名标错的文件照样能正确转换。** 这是真实世界里很常见的情况——从邮件附件或下载站拿到的文件，名字经常是错的。

CSV 没有这类标记，所以靠扩展名或显式指明格式。

\`\`\`rust
Format::from_bytes(&bytes);      // Some(Format::Docx)，或None
Format::from_extension("pptm"); // Some(Format::Pptx)
Format::from_path(Path::new("report.odt")); // Some(Format::Odt)
\`\`\`

Node 和 Python 里有对应的三个函数。

## 基准：怎么读这张表

100 份真实文档、14 种格式、和其他6 个工具对比。**任何一项分数都不能脱离它的评测方法看**，所以先说方法：

- **LLM 盲评**：用 Claude Sonnet 5 把两个工具的输出**匿名**对照真值比较；真值是文档前六页用 LibreOffice 渲染成的图片。
- **每个输出按四个维度打分**：completeness（完整性）、structure（结构）、formatting（格式）、cleanliness（洁净度）。
- **每对评判两次并交换输出顺序**，以抵消位置偏差，共 482 次裁决。
- \`score\` 是该工具在它支持的格式上的均分。**所以每一行平均的是不同的格式集合**——mammoth 的 69 只来自 docx，anydoc 的 81 覆盖全部14 种。
- 速度是在 Ryzen 9 9950X3D 上每个文档一次预热转换的中位数。

### 总榜

| 工具 | 格式覆盖 | 中位 ms | 被评判文档数 | 总分 | 完整性 | 结构 | 格式 | 洁净度 |
|---|---|---|---:|---:|---:|---:|---:|---:|
| **anydoc** | **14/14** | **4.4** | 94 | **81** | **87** | **79** | **78** | **81** |
| libreoffice | 12/14 | 1129.5 | 87 | 40 | 59 | 42 | 40 | 24 |
| unstructured | 8/14 | 572.9 | 58 | 63 | 76 | 59 | 51 | 63 |
| markitdown | 6/14 | 134.8 | 33 | 65 | 78 | 66 | 60 | 52 |
| pandoc | 5/14 | 102.1 | 34 | 56 | 74 | 57 | 56 | 38 |
| docling | 4/14 | 513.6 | 21 | 57 | 60 | 60 | 57 | 51 |
| mammoth | 1/14 | 52.5 | 8 | 70 | 84 | 71 | 75 | 51 |

**两个数字要一起看：格式覆盖和速度。**

- 覆盖上只有它做到 14/14，其他工具都漏格式。
- 速度 4.4ms，比次快的 mammoth（52.5ms）快一个数量级，比 pandoc（102ms）快约 23 倍。
- 总分 81 也是最高。

### 逐格式（公平比较要看这张）

| 格式 | anydoc | libreoffice | unstructured | markitdown | pandoc | docling | mammoth |
|---|---:|---:|---:|---:|---:|---:|---:|
| doc | **87** | 57 | 67 | - | - | - | - |
| docm | **84** | 48 | - | - | - | - | - |
| docx | **88** | 56 | 53 | 71 | 68 | 71 | 70 |
| epub | **77** | - | 72 | 72 | 52 | - | - |
| odp | **86** | 23 | - | - | - | - | - |
| ods | **82** | 38 | - | - | - | - | - |
| odt | **80** | 51 | 68 | - | 60 | - | - |
| ppt | **80** | 26 | - | - | - | - | - |
| pptx | **74** | 24 | - | 66 | - | 52 | - |
| rtf | **88** | 53 | 46 | - | 45 | - | - |
| xls | **80** | 38 | 66 | 62 | - | - | - |
| xlsm | **76** | 32 | - | - | - | - | - |
| xlsx | **72** | 30 | 66 | 55 | - | 47 | - |

**这一张表才是真正公平的对比**，因为所有工具在同一格式上直接比拼。

**结论：它不是「某一类最强」，而是「每一类都最强」。** ODP 上86 对 libreoffice 的 23、RTF 上 88 对 53、XLSM 上 76 对 32，差距都很大。

### 这张基准的局限

要客观看，也得知道它测不出什么：

- **语料不可再分发，也不在仓库里**，所以你没法自己复现这个结果。
- 评测是 LLM 盲评，不是人工评审，可能与你的实际判断有偏差。
- 语料构成未知。如果某一种格式占比很高，均分会受影响——**这也是作者同时给出逐格式表的原因**。

**所以别只看那一个 81 分，看它在你的实际输入上的表现。** 好在 WASM 版可以在浏览器里试跑真实文件。

## OCR：这条边界必须提前确认

这是整份README 里最需要谨慎读的一节。

**默认行为：本地读文本型 PDF，但完全不做 OCR。** 扫描件或纯图片的 PDF 会以 \`NeedsOcr\` 失败。

**显式选择加入后**，这类文档才会发给 [Firecrawl Parse](https://firecrawl.dev/parse) 做OCR，返回同样格式的 Markdown。

三个必须知道的事实：

1. **只有需要 OCR 的文档会离开机器**——其他文档全程本地。
2. **但整份文档都上传**，因为 Parse **没有页码选择功能**。你不能只发第 5 页。
3. **Rust crate 根本没有 \`ocr\` 选项，也从不联网。**

如果 Parse 也转不了，Node 会以 \`code: "hosted"\` 拒绝，Python 抛 \`HostedError\`。

\`--api-url\`（或 \`apiUrl\`、\`api_url\`，也可用环境变量 \`FIRECRAWL_API_URL\`）可以指向别的 Parse 部署。不用注册也能用，只是额度低；要更高额度设 \`FIRECRAWL_API_KEY\`。

**做隐私评估时记住这一条：一旦开了 OCR，粒度是整份文档。** 一个100 页的扫描件里你只关心第 5 页，也得整份发出去。

## 错误处理

**只有当完全无法从文件产出完整 Markdown 时才返回 \`Err\`。** \`ConvertError\` 会说明具体问题：

\`\`\`rust
match anydoc::to_markdown(path) {
    Ok(markdown) => Some(markdown),
    Err(e) => {
        // 这类文件产不出文档，记录下来处理下一个
        None
    }
}
\`\`\`

**这个设计对批处理很友好**：单个文件失败可以跳过并记录，不用中断整批。

## 质量保证

工程上的三件事值得知道：

- \`tests/fixtures/\` 下有一套固定语料做快照测试。
- \`tests/robustness.rs\` 对每个 fixture 做变异测试。
- \`fuzz/\` 按格式各有 cargo-fuzz 目标。

**「按格式分别做 fuzz」这一点说明作者清楚解析器的风险在哪儿**——畸形输入导致的崩溃是这类库的常见问题。

## 开发

\`\`\`bash
cargo test
cd node && npm install && npm run build && npm test
cd python && pip install maturin && maturin develop && python -m unittest discover -s tests
\`\`\`

版本号住在三个地方，发布时一起升：\`Cargo.toml\`（crate）、\`node/package.json\`（npm 包）、\`python/Cargo.toml\`（wheel）。

## 怎么选

1. **先在浏览器里试。** 打开[演示页](https://firecrawl.github.io/anydoc/)，传几个你真实要处理的文档，看输出质量。**这一步不用装任何东西，文件也不出本机。**
2. 质量可以接受，就按你的技术栈选绑定：Node 用 libuv 线程池不阻塞，Python 会释放 GIL，都适合服务端。
3. 只需要 CLI 就用 \`npx\`，别为偶发转换装全套。
4. **如果输入里有扫描版 PDF，先确认「整份上传」你能接受。** 不能接受就换 WASM 版并在本地做OCR。
5. 输入格式混杂且要统一输出，它是最合适的——**别用格式覆盖不全的工具拼管线。**

## 什么情况下别用它

- **扫描版 PDF 且文件不能出本机** —— 必须整份上传，没有页码选择。
- **只需要转一两个文件** —— \`npx\` 首次下载二进制反而更慢。
- **要它做 OCR** —— 它本身不做，Rust crate更是完全不联网。
- **需要微调转换规则** —— 它是通用转换器，不提供可插拔的解析策略。
`,
      resources: [
        {
          kind: "link",
          title: "浏览器演示页：本地试跑，文件不出机器",
          url: "https://firecrawl.github.io/anydoc/",
          note: "用 WASM 版在浏览器里转换，文件不离开本机。评估输出质量的最快方式——不用装任何依赖，也不涉及上传。",
        },
        {
          kind: "link",
          title: "bench/README.md：基准的评测方法与局限",
          url: "https://github.com/firecrawl/anydoc/blob/main/bench/README.md",
          note: "说明 100 份真实文档、LLM 盲评、交换顺序抵消位置偏差、482 次裁决的具体做法。同时说明语料不可再分发——想客观看这张表就必读这份。",
        },
        {
          kind: "link",
          title: "agent skill：让 agent 直接读 office 文档",
          url: "https://github.com/firecrawl/anydoc/blob/main/skills/convert-documents-to-markdown/SKILL.md",
          note: "npx skills add firecrawl/anydoc 装的就是它。兼容 Claude Code、Codex、Cursor、OpenCode。想在 agent 工作流里用文档转换能力，从这里进。",
        },
      ],
    },
  },
};