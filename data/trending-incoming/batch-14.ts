// 第 14 条：free-programming-books。内容全部核实自官方 README（Books 语言分册表、
// 7 个资源小节、Intro、Translations、License）与 docs 目录文件列表，未凭印象。
export const entries = {
  "free-programming-books": {
    slug: "free-programming-books",
    name: "Free Programming Books",
    nameZh: "免费编程书籍",
    aliases: [
      "free programming books",
      "free books",
      "免费书籍",
      "免费教材",
      "编程书单",
      "open books",
    ],
    summary:
      "社区维护的免费编程学习资源清单，45 种语言分册含中文专版，另有速查表、在线课程、题集与编程环境。",
    scenes: ["education", "code", "docs"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["学习资源", "免费书籍", "编程入门", "开源"],
    body:
      "Free Programming Books 是一份社区维护的免费编程学习资源清单，收录合法免费可读的书和课程。\n**它最大的价值是分语言。** 主 README 的 Books 章节按语言分成 45 个分册，其中**有中文专版**（free-programming-books-zh.md，独立的 37KB 文件）——不是把英文书翻译成中文，而是**专门收集中文出版、中文作者、中文可免费读的编程书**。这一点和「翻译英文书」的性质完全不同：读中文书对中文母语者的理解成本低得多。\n除了书籍，README 还有六个资源小节：**Cheat Sheets**（速查表）、**Free Online Courses**（免费在线课程）、**Interactive Programming Resources**（交互式编程资源）、**Problem Sets and Competitive Programming**（题集与竞赛编程）、**Podcast - Screencast**（播客与录屏）、**Programming Playgrounds**（编程练习场）。合起来它不止是书单，而是一条自学路径的各环节都能找到材料。\n**它有搜索和网页版。** 除了在 GitHub 上翻，官方提供了动态搜索站（free-programming-books-search）和易读网页版。书单文件本身不小（按语言分册最大的有 200KB），搜索比浏览更实际。\n**质量控制靠社区，但机制是明确的**：仓库有 CONTRIBUTING、HOWTO、CODE_OF_CONDUCT 三份文档，**而且大多有中文翻译**（CONTRIBUTING-zh、HOWTO-zh、CODE_OF_CONDUCT-zh），想提交条目的话有中文规则可读。贡献指南带 specific 的要求（哪些算免费、怎么写条目格式），不是随便往里塞链接。\n来源值得知道：这份清单最初是 StackOverflow 上「List of Freely Available Programming Books」的克隆，由 Victor Felder 迁到 GitHub 协作维护，现在由非营利组织 Free Ebook Foundation 托管。它已经是 GitHub 最受欢迎的仓库之一。\n**它的性质是「筛选过的索引」，不是内容本身。** 每本书都还是要去各自的地方读——好处是链接都指向合法免费资源，坏处是没有统一质量保证：任何一本书的价值还是得自己判断。",
    officialUrl: "https://ebookfoundation.github.io/free-programming-books/",
    links: {
      official: "https://ebookfoundation.github.io/free-programming-books/",
      github: "https://github.com/EbookFoundation/free-programming-books",
    },
    officialLabel: "ebookfoundation.github.io/free-programming-books",
    whoFor:
      "想系统自学编程、需要一份筛过的免费书单，并且中文读者优先找中文书的人。",
    whoNot:
      "想找「最新最全技术文档」的人——它收的是可免费读的完整书籍，不是 API 文档或速查手册那种即时查询用途。",
    installTips: [
      "中文读者先看中文专版：books/free-programming-books-zh.md。它收的是中文出版/中文可免费读的书，不是英文书翻译。",
      "别在 GitHub 里翻大文件——按语言分册最大有 200KB，用官方搜索站 free-programming-books-search 或本地 Ctrl+F 更快。",
      "按主题找书用 English, By Subject 那份分册（110KB），按语言用 English, By Programming Language（200KB）。",
      "不只书：Cheat Sheets、Free Online Courses、Problem Sets、Programming Playgrounds 四个小节是自学路径的其他环节。",
      "要提交条目的话有中文版贡献指南（docs/CONTRIBUTING-zh.md），先读它再提 PR。",
    ],
    alternatives: [],
    icon: { letter: "B", color: "#4A5D23", simpleIcon: "book" },
    guide: {
      intro: "中文读者从哪个入口进、六个资源小节分别解决什么，以及怎么用搜索站而不是硬翻文件。",
      markdown: `# 免费编程书籍清单

## 中文读者从哪进

**先看中文专版。** 主 README 的 Books 章节按语言分成 45 个分册，其中中文是独立的一份：

\`books/free-programming-books-zh.md\`（约 37KB）

**这份清单收的是中文出版、中文作者、中文可免费读的书** —— 不是把英文书翻译过来。性质完全不同：中文母语者读中文书理解成本低得多，而且有些书本身就是中文作者写的，只存在于中文语境。

繁体中文有单独分册（\`_zh_TW\`）。

## 别硬翻文件，用搜索

分册文件不小：按语言那份有 200KB，按主题那份有 110KB。在浏览器里翻不现实。

官方提供了两个入口：

- **动态搜索站** —— 搜书名或作者，实时出结果
- **易读网页版** —— 排版好的静态页面，适合通读

## 六个资源小节

它不止是书单。README 的 Resources 章节下面有七个小节，覆盖自学路径的各环节：

| 小节 | 解决什么 |
|---|---|
| **Books** | 完整书籍，按语言或主题 |
| **Cheat Sheets** | 速查表——语法、命令、快捷键 |
| **Free Online Courses** | 免费的在线课程 |
| **Interactive Programming Resources** | 交互式教程，边做边学 |
| **Problem Sets and Competitive Programming** | 题集与竞赛编程 |
| **Podcast - Screencast** | 播客与录屏 |
| **Programming Playgrounds** | 在线编程练习场 |

**组合起来看它的用法**：想系统学一门语言，用 Books 打基础；查语法用 Cheat Sheets；想练手用 Playgrounds；准备面试或提升用 Problem Sets。这比只找一本书效率高。

## 两种分类方式

主 README 给了两份英文清单：

- **By Programming Language** —— 按编程语言分。200KB，最大的一份。要学某个语言直接翻它。
- **By Subject** —— 按主题分。110KB。主题是横跨语言的（算法、数据库、系统设计、机器学习……），想补某个领域看它。

按语言 + 按主题两份配合用，比只按语言找更灵活。

## 贡献与治理

**要提交新书的话有三份规则文档，而且大多有中文翻译：**

- \`docs/CONTRIBUTING-zh.md\` —— 贡献指南（中文）
- \`docs/HOWTO-zh.md\` —— 新手向的 GitHub 使用说明（中文）
- \`docs/CODE_OF_CONDUCT-zh.md\` —— 行为准则（中文）

**先读贡献指南再提 PR。** 清单靠社区维护但有明确规范——什么算「免费可读」、条目怎么写格式，都写在 CONTRIBUTING 里。随便塞链接会被拒。

翻译也不完整——README 的 Translations 一节自己就说明了「有些翻译还缺，也许你可以帮忙补」。**想帮忙翻译文档也是贡献方式之一。**

## 它是什么，不是什么

**它是一份筛选过的索引。** 每本书仍然要去各自的地方读。

好的一面：链接都指向合法免费资源——这一点比在搜索结果里翻靠谱得多，很多「免费电子书」站实际上要么是盗版要么是骗下载。

要留意的一面：**没有统一质量保证。** 清单保证「免费可合法读」，不保证「内容准确或适合你」。书的价值还得自己判断——看目录里的章节覆盖、看最近更新时间、看读者的评价。

另外条目是社区提交的，**可能有已经过时或链接失效的**。读到一本打不开的书，浪费时间的是你自己。

## 组织背景

这份清单最初是 StackOverflow 上「List of Freely Available Programming Books」的克隆，由 Karan Bhangui 和 George Stocker 参与，**由 Victor Felder 迁到 GitHub 做协作维护**，现在由非营利组织 **Free Ebook Foundation** 托管（该组织专注促进免费电子书的创作、分发、存档与可持续性，在美国的捐赠可抵税）。

它已经是 GitHub 最受欢迎的仓库之一——这也是它条目质量相对可靠的原因之一：关注度高，贡献者多。

## 上手路径

1. 打开搜索站，搜你想学的方向
2. 中文读者先翻中文专版分册
3. 选定 1-2 本主读，不要一次开十本
4. 配一个 Playground 边学边练
5. 语法忘了查 Cheat Sheets
6. 想深入某个领域切到 By Subject 那份
`,
      resources: [
        {
          kind: "link",
          title: "中文书籍分册：free-programming-books-zh.md",
          url: "https://github.com/EbookFoundation/free-programming-books/blob/main/books/free-programming-books-zh.md",
          note: "中文读者的直接入口。收录中文出版/中文作者的免费编程书，不是英文书的翻译版本。",
        },
        {
          kind: "link",
          title: "官方搜索站：按书名或作者实时搜",
          url: "https://ebookfoundation.github.io/free-programming-books-search/",
          note: "分册文件最大 200KB，在浏览器里翻不现实。这个搜索站是官方提供的入口。",
        },
        {
          kind: "link",
          title: "中文贡献指南 CONTRIBUTING-zh.md",
          url: "https://github.com/EbookFoundation/free-programming-books/blob/main/docs/CONTRIBUTING-zh.md",
          note: "想提交新书先读它——什么算免费可读、条目格式要求都写着。也有 HOWTO-zh 和 CODE_OF_CONDUCT-zh。",
        },
      ],
    },
  },
};
