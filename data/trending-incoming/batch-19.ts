// 第 19 条：watermarks-remover。内容全部核实自官方 README：
// 三层处理模型（A层 Unicode / B层 统计水印 / 文件元数据）、支持格式与厂商清单、
// CLI 与 HTTP 服务用法、detect 与 clean 的区别、"unrecognized formats never
// auto-cleaned" 与"text tools refuse binary input"两处安全设计、
// 以及 README 中"Ethics and disclaimer"和"what removing a text watermark costs"
// 两节的原话立场。伦理边界如实呈现，未做美化。
export const entries = {
  watermarksremover: {
    slug: "watermarksremover",
    name: "watermarks-remover",
    nameZh: "AI 溯源标记清除",
    aliases: [
      "watermarks remover",
      "watermarks-remover",
      "ai 水印",
      "去除水印",
      "ai 标记",
      "c2pa",
      "exif 清除",
      "元数据清理",
      "invisible characters",
    ],
    summary:
      "清除文本与文件里的多厂商 AI 溯源标记；分A/B/文件三层，但 B层改写会损伤文风，项目自己写明不保证骗过官方检测。",
    scenes: ["code", "docs", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["AI 水印", "元数据", "隐私", "C2PA", "EXIF", "开源"],
    body:
      "watermarks-remover 处理的是 AI 生成内容里的**溯源标记**——分三层，各自有明确的可靠性差异。\n**A 层是确定性的，也是最可靠的一层。** 移除不可见 Unicode 字符、异形空格、双向文本控制符和 tag 字符。这一层可验证，改动确定，不影响可读内容。\n**B 层针对统计水印，性质完全不同，必须先看清代价。** 文本水印藏在**用词本身**里——信号分散在 token 选择上，几乎每句话都带一点。项目自己的说法是：移除统计标记**需要逐句改写相当一部分文本，而不是整段调换**；而且任何改写都会把原作者的措辞换成改写模型的措辞，**语气、声音和精确度都会被抹平**。在 SEO、营销、客户交付这类正式文案上，这种退化对最在意文字的人来说是看得出来的。项目给的建议很直接：如果你的计划本来就是用便宜模型重写，**那为什么不一开始就用便宜模型生成？** 更简单、更便宜、结果一样或更好。\n**文件层清除的是 C2PA、EXIF、XMP 和文档属性**，覆盖 PNG、JPEG、WebP、AVIF、HEIC、TIFF、PDF、DOCX、XLSX、PPTX、EPUB、MP4/WAV/MP3/FLAC 等一批格式。\n**项目对自身能力的表述是我见过最诚实的一类，这里必须原样传达：既然厂商还没公开检测器和密钥，任何工具都无法诚实地担保「这个能通过官方检测」。** 报告必须区分可验证的部分和尽力而为的部分。它还提醒：Layer B 最好用**非原始来源的模型**改写——用 Claude 改写 Claude 的文本可能反而重新盖章。\n**两处工程设计值得单独说，因为它们体现的是「不毁数据」的思路。** 文本工具遇到二进制输入会**拒绝处理**并告诉你该用哪个工具，而不是解码压缩字节后把乱码写回去毁掉文件；无法识别的格式会被标为 unknown，**绝不自动当文本处理**——auto 模式下直接退出，不写任何输出。\n**最后是使用边界。** 项目自带一份 ethics 文档，原文划得很清楚：用于**你拥有或获授权处理**的内容的隐私与研究，**不用于学术造假，也不用于虚假声明「这是人工撰写的」**。项目声明用户需遵守当地法规并负责任地使用。这条边界不是装饰——移除溯源标记在合规、审计和披露场景里可能是违规行为，所以「我拥有这个内容」是使用前提，不是客套话。",
    officialUrl: "https://github.com/guillaumemeyer/watermarks-remover",
    links: {
      official: "https://github.com/guillaumemeyer/watermarks-remover",
      github: "https://github.com/guillaumemeyer/watermarks-remover",
    },
    officialLabel: "github.com",
    whoFor:
      "处理自己拥有或获授权内容的创作者和研究者，需要清除误入的不可见字符、图片EXIF 或文档元数据的人。",
    whoNot:
      "需要靠它冒充人工撰写来通过审查、规避披露义务或做学术造假的人——项目自己明确划了这条线；另外也不适合要求「保证通过官方检测」的场景，它做不到也不声称能做到。",
    installTips: [
      "纯脚本用法不需要任何依赖，只要 Python 3.10+ 标准库——直接跑 service/scripts 下的脚本即可。",
      "作为 agent skill 安装：python3 install_skill.py --skill remove-ai-marks --target claude-code，--list 可列出全部可用 skill。Windows 上用 py install_skill.py ...。",
      "skill 本身不含代码，只是通过 HTTP 驱动服务；所以还要另起服务，并按需设 WATERMARKS_SERVICE_URL。",
      "起服务：python3 service/scripts/server.py，默认只绑定 loopback（127.0.0.1:8765），需要设 WATERMARKS_SERVER_API_KEY 才要求鉴权。",
      "先用 inspect_file.py 看清楚再动手：python3 service/scripts/inspect_file.py draft.md。确认干净后再跑 clean_file.py。",
      "Layer B 默认只打印提示词、不需要模型；要用本地 Ollama 需显式设置 WATERMARKS_REWRITE_BACKEND=ollama，且远程端点默认禁止。",
    ],
    alternatives: [],
    icon: { letter: "W", color: "#2E7D6F" },
    guide: {
      intro: "从三层可靠性差异到「移除水印到底损失了什么」，讲清哪些部分可以放心用、哪些部分项目自己都说做不到，以及使用前必须想清楚的那条线。",
      markdown: `## 先说结论：三层，可靠性完全不同

这个项目处理 AI 生成内容里的溯源标记，但**三层的能力和代价差别很大**，混在一起用会出问题。

| 层 | 目标 | 手段 | 可靠吗 |
|---|---|---|---|
| **A** | 不可见 Unicode、异形空格、双向控制符、tag 字符 | 确定性 Python 脚本 | **确定，可验证** |
| **B** | 统计式（token 采样）文本水印 | Agent 改写 + 可选 \`rewrite_text.py\` | **尽力而为** |
| **文件** | C2PA / EXIF / XMP / 文档属性 | 各格式清理器 | 确定，但只覆盖列出的格式 |

覆盖的厂商与生态（按类别）：Claude、Gemini / SynthID-Text、OpenAI 的溯源面、开源模型的 Kirchenbauer 式（green-list）与 keyed-Gumbel / EXP（Aaronson）标记。

**实践上的含义：能用 A 层和文件层就别碰 B 层。** 下面会说清原因。

## A 层：确定性，可以放心用

处理的是那些**藏起来的字符**：零宽字符、异形空格、双向文本覆盖符、tag 字符。

这些字符的问题是它们会在你复制粘贴、跨软件传输时悄悄改变文本内容，肉眼看不见但影响比对、搜索和渲染。A 层的清理是**确定性的**——同样的输入给同样的输出，而且**不改变可读内容**。

这是这个项目里最没有争议、最该优先用的部分。

## B 层：先读完这一节再用

### 它为什么要改写，而不是删除

项目对文本水印的机制说得很直白：

> Text watermarks live in **the wording itself**: the signal is spread across token choices, so nearly every sentence carries a little of it.

信号在**用了哪些词**里，不是藏在某个字符位置。所以移除它只有一条路：**换词**。而且项目给了两条具体结论：

1. **移除等于改写，不是重排。** 打乱段落顺序、改标题、做轻度润色，几乎不移动信号。**要剥离统计标记必须逐句改写相当一部分文本。**
2. **改写会让文案退化。** 任何改写都会把原措辞换成改写模型的措辞，**语气、声音和精确度都会被压平**。在 SEO、营销、客户交付的文案上，这种退化是真实存在的，而且**对最在意文字的人最明显**。

项目用了一个类比：相当于拿顶级模型产出的文本，让一个能力更弱的模型从头重写一遍——**结果不可能超过改写模型的上限**。

### 项目自己给的反问

这一段是整个README 里最诚实的地方，原文：

> If the plan is to rewrite the text with a cheaper model anyway, why pay for a premium model in the first place? Generating directly with the cheaper model is simpler, cheaper, and produces the same — or better — end result.

翻译：**如果你本来就打算用便宜模型重写，为什么一开始要付钱用贵的？** 直接用便宜模型生成更简单、更便宜，结果相同或更好。

**所以 B 层的适用场景很窄：** 你确实需要那个强模型的**思路和起草**，并接受之后有一次改写来满足隐私或合规要求。B 层**不是**一条「低成本拿到无标记文本」的路线。

### 什么时候该跳过 B 层

项目给的判断很直接：

- **质量比卫生更重要** —— 走无损路线：**只要 A 层的 Unicode 清理加文件元数据清理，保留原文。**
- **反正要重写** —— 用**非原始来源的模型**（用来源模型重写可能重新盖章），并且记住**残留风险仍然存在**。

### 一条实操提醒

要避开某个来源模型的标记，就**不要用那个模型去改写它的输出**。项目建议 Layer B 用非来源模型，原因就在这里。

## 能力边界的诚实声明

这一段必须原样记住：

> Until vendors ship public detectors and keys, **no tool can honestly certify** "this fails the official check." Reports must separate verifiable vs best-effort work.

意思是：**在厂商公开检测器和密钥之前，没有任何工具能诚实地担保「这个能通过官方检测」。** 所以它的报告会区分「可验证」和「尽力而为」两部分——这个区分本身就是一个负责任的信号，值得信任。

## 使用边界：这不是免责声明，是使用前提

项目自带一份 ethics 文档，README 里引用的原话：

> For privacy and research on **your** content — not academic fraud or false "human-written" claims.

以及：

> **Responsible use:** This project is for content you own or are authorized to process. Users must adhere to local regulations and use it responsibly. The developers disclaim any liability for potential misuse by users.

翻译成实践上的三条：

1. **只处理你拥有或获授权处理的内容。** 这是前提，不是建议。
2. **不要用于学术造假，也不要用于虚假声明「这是人工撰写的」。**
3. **遵守当地法规。**

**第三条经常被跳过，但它最实际：** 在某些司法辖区和平台规则下，移除 AI 溯源标记以规避披露义务可能直接违规。工具不违法，**用法可能违法**。

## 两处「不毁数据」的设计

这两处设计比功能列表更能说明项目的成熟度，值得单独看。

### 文本工具拒绝二进制输入

文本工具如果指向 \`.docx\`、\`.pdf\` 或图片，早期版本会去解码压缩字节，然后报告掉出来的码点——**那噪声追踪的是压缩而不是内容**，而 \`clean_text.py\` 还会把那些乱码写回去，**直接毁掉文件**。

现在的行为是拒绝并指名该用哪个工具：

\`\`\`bash
python3 service/scripts/inspect_text.py report.docx
# refusing to treat report.docx as text: it looks like a ZIP container (DOCX, ODT, …).
# Use inspect_file.py / clean_file.py, which route by format,
# or pass --force-text to scan the raw bytes anyway.
\`\`\`

判定方式是**magic number 加控制字节比例**，所以非 UTF-8 编码的文本仍然能用。

### 无法识别的格式绝不自动清理

匹配不到任何已知文本/图片/容器格式的字节会被标为 **\`unknown\`**，不再回退当成文本。auto 模式下 \`clean_file.py\` 对这类文件**拒绝执行**（退出码 2，不写任何输出），而不是解码成 UTF-8 再写回乱码。

需要强制处理的话，\`--as text\` 或 \`--force-text\` 是显式开关。

**「宁可什么都不做，也不要毁掉文件」——这个默认值是对的。**

## 怎么用

### 直接跑脚本

\`\`\`bash
SCRIPTS=service/scripts

# 统一入口：先看，再动
python3 "$SCRIPTS/inspect_file.py" draft.md
python3 "$SCRIPTS/clean_file.py" draft.md -o draft.cleaned.md

# 文本 A 层
python3 "$SCRIPTS/inspect_text.py" draft.md
python3 "$SCRIPTS/clean_text.py" draft.md -o draft.cleaned.md --stats

# B 层改写钩子：默认只打印提示词，不需要模型
python3 "$SCRIPTS/rewrite_text.py" draft.md --backend print-prompt --tactic paraphrase
\`\`\`

**建议的顺序：先inspect，再 clean。** inspect 是只读的，看清楚有什么再决定要不要动。

### B 层接本地模型

默认 \`print-prompt\` 只输出提示词，**不调用任何模型**。要用本地 Ollama：

\`\`\`bash
WATERMARKS_REWRITE_BACKEND=ollama WATERMARKS_REWRITE_MODEL=llama3.2 \\
  python3 "$SCRIPTS/rewrite_text.py" draft.md -o draft.rewritten.md
\`\`\`

**默认只允许 loopback。** 远程端点需要显式开 \`WATERMARKS_REWRITE_ALLOW_REMOTE=1\` 或 \`--allow-remote\`。API key 只从 \`WATERMARKS_REWRITE_API_KEY\` 读，**绝不从命令行参数读**。

## HTTP 服务

skill 实际驱动的是一个标准库 HTTP 服务，网页应用也能直接接，不用把代码 vendor 进来。

\`\`\`bash
WM="http://127.0.0.1:8765"
curl -s "$WM/health"
curl -s "$WM/openapi.json"
\`\`\`

默认**只绑定 loopback**，按信任网络设计。要设 \`WATERMARKS_SERVER_API_KEY\` 才会要求 \`Authorization: Bearer <key>\`。

主要端点：

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | \`/health\` | 存活与版本 |
| GET | \`/capabilities\` | 可用的工具与后端（逐个探测版本，不只是看 PATH 里有没有） |
| GET | \`/openapi.json\` | 动态生成的 OpenAPI 3.0.3 契约 |
| POST | \`/inspect\` | 查看文件类型与可疑标记 |
| POST | \`/detect\` | 跑水印检测器 |
| POST | \`/clean\` | 清理 |
| POST | \`/watermark\` | 生成带水印文本（用于基准测试和往返测试） |

批处理端点有 \`WATERMARKS_MAX_BATCH_FILES\` 上限（默认 50）。**单个条目出错只标记那一项的 \`"ok": false\`，不会中断整批。**

### 检测与清理是分开的两步

这一点很重要：**服务不会在你没要求时调用任何厂商 API。**

- \`/detect\` —— 跑配置好的检测器。文本走厂商检测器加文体分析，图片走 SynthID 像素评分。
- \`/inspect\` 可以带 \`"detect": true\`，把检测结果附到报告里。
- \`/clean\` 支持 \`"detect_before"\` / \`"detect_after"\`，**分别给输入和输出打分，这样你能测出一次清理到底改动了什么。**

**\`detect_before\` / \`detect_after\` 是这个项目里最实用的一个设计**——它让「我到底消掉了多少」变成可测量的，而不是靠感觉。

检测器也标注了自己的性质：\`markllm\` 是研究工具、\`gumbel\` 是同密钥重放、\`claude-text\` 目前是**占位符**（等 Anthropic 发布水印检测 API 后才启用）。**没有哪个是厂商预言机。** 检测是 fail-soft的：未配置、超时或出错的检测器会报告 \`{"available": false}\`，**不会阻塞清理**。

## 推荐的使用流程

1. **先确认你有权处理这个内容。** 这是前提。
2. 先跑 A 层和文件层的无损清理，保留原文。
3. 用 \`detect_before\` / \`detect_after\` 测一下清理效果。
4. **只有在确实必须做 B 层时才做**，并接受文风损失。
5. 做 B 层用非来源模型。
6. **不要指望它担保通过官方检测**——项目自己都不这么声称。

## 什么情况下别用它

- **想冒充人工撰写** —— 项目明确划了这条线，也明确不支持。
- **规避披露义务或合规要求** —— 在很多司法辖区这本身就违规。
- **要「保证通过官方检测」** —— 它做不到，也不声称做得到。
- **正式文案追求文风** —— B 层会压平语气和声音；走A 层加文件层的无损路线更好。
`,
      resources: [
        {
          kind: "link",
          title: "Ethics 文档：使用边界的第一手说明",
          url: "https://github.com/guillaumemeyer/watermarks-remover/blob/main/skills/remove-ai-marks/references/ethics.md",
          note: "README 的「Ethics and disclaimer」一节直接引用它。写明适用于你拥有或获授权处理的内容，不用于学术造假或虚假的人工撰写声明。决定要不要用之前应该先读这一份。",
        },
        {
          kind: "link",
          title: "README：三层的可靠性与代价说明",
          url: "https://github.com/guillaumemeyer/watermarks-remover",
          note: "含「what removing a text watermark costs」一节——项目坦白说明 B 层改写会损失什么，以及为什么它无法担保通过官方检测。是全文信息量最大的一节。",
        },
        {
          kind: "link",
          title: "vendor-notes.md：按厂商与标记类别的能力矩阵",
          url: "https://github.com/guillaumemeyer/watermarks-remover/blob/main/skills/remove-ai-marks/references/vendor-notes.md",
          note: "逐厂商列出哪些标记在支持范围内、哪些明确超出范围（像素级图像标记、训练后门等都在范围外）。评估某个具体场景能不能用之前先看这份矩阵。",
        },
      ],
    },
  },
};