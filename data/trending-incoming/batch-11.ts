// 第 11 条：markitdown。内容全部核实自官方 README（支持格式列表、可选依赖全表、
// Plugins、markitdown-ocr、Azure Content Understanding 选型表、Security Considerations），
// 未凭印象。
export const entries = {
  markitdown: {
    slug: "markitdown",
    name: "MarkItDown",
    nameZh: "MarkItDown",
    aliases: ["markitdown", "mark it down", "文档转 markdown", "pdf 转 markdown", "office 转 markdown"],
    summary:
      "微软的轻量 Python 工具，把 PDF、Office、图片、音频等文件转成保留结构的 Markdown，专为喂给 LLM 设计。",
    scenes: ["docs", "office", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["文档转换", "Markdown", "Python", "LLM", "开源"],
    body:
      "MarkItDown 是微软开源的一个轻量 Python 工具，把各种文件转成 Markdown，目标是给 LLM 和文本分析流水线用。\n**它的定位是「保留结构的 LLM 输入」，不是「高保真文档转换」。** README 说得直接：输出虽然通常还算可读、适合人看，但它是为了给文本分析工具消费的，**高保真转换不是它的目标**。想做版式保留的转换，它不合适。\n和同类的 textract 相比，它的差别在「保留重要文档结构」：标题、列表、表格、链接这些都尽量保住。为什么选 Markdown，README 给了理由——Markdown 极接近纯文本、标记极少，但仍能表达文档结构；而主流 LLM 原生就说 Markdown，且训练数据里大量是 Markdown，所以它理解得好；另外 Markdown 约定在 token 上很省。\n**支持范围很宽**：PDF、PowerPoint、Word、Excel、图片（EXIF 与 OCR）、音频（EXIF 与语音转录）、HTML、文本类（CSV/JSON/XML）、ZIP（遍历内容）、YouTube URL、EPUB，以及更多。\n**依赖可以只装一部分**，这点很实用——`[all]` 全装，或者只装你需要的格式（`[pdf, docx, pptx]`）。可选依赖一共十项：pptx、docx、xlsx、xls、pdf、outlook（Outlook 邮件）、az-doc-intel、az-content-understanding、audio-transcription、youtube-transcription。\n**要更强能力时有三层加码路径**：\n- **插件**（默认关闭）——GitHub 上搜 `#markitdown-plugin`  hashtag 就能找到社区插件，官方也给了示例插件工程\n- **markitdown-ocr 插件**——给 PDF/DOCX/PPTX/XLSX 加 OCR，用 LLM Vision 提取图片里的文字，**不需要新的 ML 库或二进制依赖**。注意一个坑：没传 `llm_client` 时插件仍会加载，但 **OCR 会被静默跳过**，回退到内置转换器\n- **Azure Content Understanding**——唯一一个支持**视频**的选项，也支持音频，能做结构化字段提取（发票金额、收据日期、合同条款，输出成 YAML front matter），还能配自定义分析器。代价是按量计费的云服务\n\n**安全上有一条必须知道的前提**，README 开头就警告了：MarkItDown 的 I/O 权限就是当前进程的权限，和 open() 或 requests.get() 一样，会访问进程本身能访问的资源。**在不受信任的环境里要清洗输入，并只调用你用例需要的那个最窄的函数**（\`convert_stream()\` 或 \`convert_local()\`），不要图省事用宽接口。这是把文件解析器接进服务时的通用风险，但它明确写出来了。\n环境要求是 Python 3.10 到 3.14，官方建议装在虚拟环境里以避免依赖冲突。",
    officialUrl: "https://pypi.org/project/markitdown/",
    links: {
      official: "https://pypi.org/project/markitdown/",
      github: "https://github.com/microsoft/markitdown",
    },
    officialLabel: "pypi.org/project/markitdown",
    whoFor:
      "要把 PDF/Office/音频等文件批量转成 Markdown 喂给 LLM 或做文本分析的人；以及需要在 pipeline 里做格式转换的开发者。",
    whoNot:
      "要做版式级高保真转换的人（官方明说不是这个目标）；或者不想装 Python 环境的人——它是纯 Python 工具，没有独立 GUI。",
    installTips: [
      "一条命令装全：pip install 'markitdown[all]'。只要常用几种格式的话用 pip install 'markitdown[pdf, docx, pptx]' 更省依赖。",
      "装在虚拟环境里。官方推荐 uv：uv venv --python=3.12 .venv 之后用 uv pip install（注意不是 pip install）。",
      "要 OCR 就装 markitdown-ocr 并传 llm_client——不传的话 OCR 会被静默跳过，命令照样成功但图片里的文字没了。",
      "转换不可信来源的文件时只调 convert_stream() 或 convert_local() 这类最窄的函数，别用宽接口。",
    ],
    alternatives: [],
    icon: { letter: "M", color: "#2B579A", simpleIcon: "markdown" },
    guide: {
      intro: "从最小可用的安装开始，讲清三种用法、可选依赖怎么挑，以及 OCR 那个静默跳过的坑。",
      markdown: `# MarkItDown：把各种文件转成 Markdown

## 先认清它做什么、不做什么

MarkItDown 是**给 LLM 和文本分析流水线准备输入**的工具，不是文档转换器。

README 写得很直白：输出「虽然通常还算可读、适合人看，但它是为了被文本分析工具消费的，高保真转换不是它的目标」。

想做版式级保留（比如排版、字体、精确分页），它不合适。

## 为什么是 Markdown

官方给的三条理由都值得记：

- Markdown 极接近纯文本，标记极少，但仍能表达文档结构（标题、列表、表格、链接都保得住）
- 主流 LLM 原生就说 Markdown，训练数据里大量是 Markdown，理解得好
- Markdown 约定在 token 上很省

## 安装

全装：

\`\`\`bash
pip install 'markitdown[all]'
\`\`\`

**只装你要的格式**（更推荐，依赖少很多）：

\`\`\`bash
pip install 'markitdown[pdf, docx, pptx]'
\`\`\`

从源码装：

\`\`\`bash
git clone git@github.com:microsoft/markitdown.git
cd markitdown
pip install -e 'packages/markitdown[all]'
\`\`\`

## 装在虚拟环境里

要求 Python 3.10 到 3.14。官方建议用虚拟环境避免依赖冲突。

标准方式：

\`\`\`bash
python -m venv .venv
source .venv/bin/activate
\`\`\`

用 uv（注意最后那行是 \`uv pip install\`，不是 \`pip install\`）：

\`\`\`bash
uv venv --python=3.12 .venv
source .venv/bin/activate
\`\`\`

用 conda：

\`\`\`bash
conda create -n markitdown python=3.12
conda activate markitdown
\`\`\`

## 三种用法

\`\`\`bash
# 1. 重定向到文件
markitdown path-to-file.pdf > document.md

# 2. 用 -o 指定输出文件
markitdown path-to-file.pdf -o document.md

# 3. 管道输入
cat path-to-file.pdf | markitdown
\`\`\`

## 支持哪些格式

PDF、PowerPoint、Word、Excel、图片（EXIF 与 OCR）、音频（EXIF 与语音转录）、HTML、文本类（CSV/JSON/XML）、ZIP（遍历内容）、YouTube URL、EPUB。

## 十种可选依赖

\`[all]\` 全装，或者挑着装：

| 参数 | 用途 |
|---|---|
| \`[pptx]\` | PowerPoint |
| \`[docx]\` | Word |
| \`[xlsx]\` | Excel |
| \`[xls]\` | 老版 Excel |
| \`[pdf]\` | PDF |
| \`[outlook]\` | Outlook 邮件 |
| \`[az-doc-intel]\` | Azure Document Intelligence |
| \`[az-content-understanding]\` | Azure Content Understanding |
| \`[audio-transcription]\` | wav / mp3 语音转录 |
| \`[youtube-transcription]\` | 取 YouTube 视频转录 |

## 插件（默认关闭）

插件默认是关的。先看装了什么：

\`\`\`bash
markitdown --list-plugins
\`\`\`

启用：

\`\`\`bash
markitdown --use-plugins path-to-file.pdf
\`\`\`

找现成插件：在 GitHub 搜 \`#markitdown-plugin\` hashtag。官方仓库里有 \`packages/markitdown-sample-plugin\` 可以当开发模板。

## OCR：有个会静默失败的坑

\`markitdown-ocr\` 插件给 PDF、DOCX、PPTX、XLSX 加 OCR，用 LLM Vision 提取图片里的文字，**不需要新的 ML 库或二进制依赖**（复用 MarkItDown 已有的 \`llm_client\` / \`llm_model\` 模式）。

\`\`\`bash
pip install markitdown-ocr
pip install openai  # 或任何 OpenAI 兼容客户端
\`\`\`

\`\`\`python
from markitdown import MarkItDown
from openai import OpenAI

md = MarkItDown(
    enable_plugins=True,
    llm_client=OpenAI(),
    llm_model="gpt-4o",
)
result = md.convert("document_with_images.pdf")
print(result.markdown)
\`\`\`

**坑在这里：没传 \`llm_client\` 时插件仍然会加载，但 OCR 会被静默跳过，直接回退到内置转换器。** 命令不报错、文件也有输出，只是图片里的文字全丢了。所以 OCR 没生效时先检查这个参数传了没。

## 什么时候需要 Azure Content Understanding

三个内置的层级，能力递增、代价也递增：

| 能力 | 内置转换器 | Azure Document Intelligence | Azure Content Understanding |
|---|---|---|---|
| 文档转换 | 离线、按格式提取 | 云端版面提取 | 云端多模态提取 |
| 结构化字段 | 不支持 | 该集成未暴露 | 分析器字段转成 YAML front matter |
| 自定义分析器 | 不支持 | 该集成不可配 | 支持 \`cu_analyzer_id\` |
| 音频视频 | 基础音频，**无视频** | 不支持 | 音频和视频分析器 |
| 成本 | 纯本地算力 | 按量计费 | 按量计费 |

**需要这些才上 CU：** 视频（CU 是唯一支持视频的选项）、结构化字段提取（发票金额、收据日期、合同条款）、扫描 PDF 和复杂表格的更高质量提取。

\`\`\`bash
markitdown path-to-file.pdf --use-cu --cu-endpoint "<endpoint>"
\`\`\`

也可以设一次环境变量，之后只写 \`--use-cu\`：

\`\`\`bash
export MARKITDOWN_CU_ENDPOINT="<content_understanding_endpoint>"
markitdown path-to-file.pdf --use-cu
\`\`\`

## 安全：接进服务前必读

README 开头就警告了：**MarkItDown 的 I/O 权限就是当前进程的权限**，和 \`open()\`、\`requests.get()\` 一样，会访问进程本身能访问的任何资源。

两条实践：

- **在不受信任的环境里清洗输入**
- **只调你用例需要的那个最窄的函数**——\`convert_stream()\` 或 \`convert_local()\`，而不是宽接口

这是所有文件解析器的通用风险（zip 炸弹、路径遍历、超大文件），但 MarkItDown 明确写出来了，值得在设计时就想清楚。

## 上手顺序

1. 虚拟环境装好，按需要选依赖项
2. \`markitdown 文件.pdf > out.md\` 跑通一次
3. 扫一遍输出，看结构（标题、表格、列表）保住了没
4. 图片里的文字没出来 → 装 markitdown-ocr 并检查 \`llm_client\` 有没有传
5. 质量不够再考虑 Azure Document Intelligence，字段提取或视频再上 Content Understanding
6. 要接进服务 → 按安全那节改成最窄的函数调用
`,
      resources: [
        {
          kind: "link",
          title: "README 全文：支持格式、可选依赖、插件与选型对照表",
          url: "https://github.com/microsoft/markitdown/blob/main/README.md",
          note: "十种可选依赖、三层能力递增方案（内置 / Doc Intel / Content Understanding）的对照表、OCR 插件用法、以及结尾的 Security Considerations 都在这里。",
        },
        {
          kind: "link",
          title: "markitdown-ocr 插件文档",
          url: "https://github.com/microsoft/markitdown/blob/main/packages/markitdown-ocr/README.md",
          note: "接 LLM Vision 做 OCR，不需要新 ML 依赖。务必确认传了 llm_client——没传会静默跳过 OCR。",
        },
        {
          kind: "link",
          title: "示例插件工程：开发自己的插件",
          url: "https://github.com/microsoft/markitdown/blob/main/packages/markitdown-sample-plugin/README.md",
          note: "官方提供的插件模板。想给某种格式加支持的话，从这个起步比从零写快。",
        },
      ],
    },
  },
};
