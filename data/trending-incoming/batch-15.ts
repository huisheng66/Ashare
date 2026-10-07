// 第 15 条：thealgorithms-python。内容全部核实自官方 README、DIRECTORY.md
// （45 个分类、条目统计）与 CONTRIBUTING.md（命名与提交流程），未凭印象。
export const entries = {
  thealgorithms: {
    slug: "thealgorithms",
    name: "The Algorithms (Python)",
    nameZh: "算法实现集（Python）",
    aliases: [
      "the algorithms",
      "thealgorithms",
      "算法实现",
      "算法大全",
      "数据结构",
      "algorithm",
      "算法练习",
    ],
    summary:
      "1360 多个 Python 算法与数据结构实现，分45 个类别，附 DIRECTORY 导航与 doctest 校验，仅供学习。",
    scenes: ["education", "code", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["算法", "数据结构", "Python", "学习资源", "开源"],
    body:
      "The Algorithms - Python 是社区维护的 Python 算法实现集，按 DIRECTORY.md 统计有 45 个类别、1300 多个实现文件，从排序、图论、动态规划一路到密码学、图形学、量子计算。\n**但它的定位必须先说清楚，这是官方在 README 顶部就写明的：这些实现只用于学习目的，效率可能不如 Python 标准库里的实现，自行斟酌使用。**\n这句话不是客套，是选型时最关键的信息。标准库有 \`sorted\`、\`heapq\`、\`bisect\`，性能是 C 实现的；这里的实现是为了让你看懂算法怎么写，不是为了直接拿去做生产里的热路径。**当成教科书和练习集用，不要当成库用。**\n**它的真正价值在两点：**\n- **每份实现都带 doctest。** 贡献规范明确要求 docstring 里要有清晰说明和/或来源 URL，并且 **doctest 要同时覆盖有效输入和错误输入**。这意味着你读代码时看到的示例是能直接跑的，而且不会只演示顺利路径。\n- **分类完整。** 45 个类别里有些是标准算法教材不会覆盖的：ciphers（密码学）、fractals（分形）、cellular_automata（元胞自动机）、boolean_algebra（布尔代数）、quantum（量子计算）、financial（金融）、geodesy（测地学）。想找某个冷门算法的实现，这里往往比搜索引擎更快。\n**工程规范相当严，这一点从 CONTRIBUTING 能看出来：** 遵循 Python 命名约定（变量函数小写、常量全大写、类名驼峰），PEP 8，代码风格用 ruff，格式用 pre-commit 自动处理。命名上有一条原则我觉得很值得单独说：**展开缩写**——\`gcd()\` 不好懂，\`greatest_common_divisor()\` 就懂。规范里明确写「用描述性命名帮你省掉冗余注释」。\n提交流程有两条容易踩的：\n- **不接受重复实现。** 已有同一算法的实现就别再提一个功能相同的；允许的是新解法、不同表示、不同复杂度。提交前先搜一遍。\n- **不要为贡献算法去开 issue，直接提 PR。** 仓库不分配 issue，官方明说了不用先问。\n所有提交会过 GitHub Actions 的 \`ruff check\` 和测试，测试跑的是 doctest。\n想找导航从 [DIRECTORY.md](https://github.com/TheAlgorithms/Python/blob/master/DIRECTORY.md) 进，那份文件有 85KB，分类目录比在仓库里翻更清楚。仓库支持 Gitpod 一键在线改代码。",
    officialUrl: "https://the-algorithms.com/",
    links: {
      official: "https://the-algorithms.com/",
      github: "https://github.com/TheAlgorithms/Python",
    },
    officialLabel: "the-algorithms.com",
    whoFor:
      "学算法时想要可运行、可验证（doctest）的标准实现当参照，或者要找某个冷门算法现成实现的人。",
    whoNot:
      "要在生产代码里直接用的——官方明说这些实现可能不如标准库；也不适合需要高性能或经过生产验证的库的场景。",
    installTips: [
      "不用装，这是仓库不是 pip 包。直接读代码，或者 Gitpod 一键在浏览器里改。",
      "先看 DIRECTORY.md 导航，85KB 里按 45 个分类列全，比在仓库里翻快。",
      "读每份实现时留意 doctest——它同时测有效和错误输入，比只给顺利路径的示例可靠。",
      "想跑某个文件里的 doctest：python -m doctest <文件路径> -v。",
      "要提 PR 之前先搜一遍有没有同样的实现，重复实现不接受——但新解法、不同复杂度、不同表示是欢迎的。",
    ],
    alternatives: [],
    icon: { letter: "A", color: "#1F6F8B", simpleIcon: "python" },
    guide: {
      intro: "从 DIRECTORY 导航到读懂一份实现的 doctest，讲清它的定位边界和贡献规范里值得学的命名原则。",
      markdown: `# The Algorithms - Python

## 先接受一件事：这是教科书，不是库

README 顶部原话：**这些实现只用于学习目的，效率可能不如 Python 标准库里的实现，自行斟酌使用。**

这不是客套。标准库的 \`sorted\`、\`heapq\`、\`bisect\` 是 C 实现的，性能不在一个量级。

**当成教科书和练习集用，不要当成生产库用。** 装进热路径之前，先找个正经的库。

## 从 DIRECTORY.md 进

[DIRECTORY.md](https://github.com/TheAlgorithms/Python/blob/master/DIRECTORY.md) 是导航入口，85KB，按 **45 个类别**列全所有实现。比在仓库文件树里翻清楚得多。

分类里有些是标准算法教材不会覆盖的：

| 类别 | 内容 |
|---|---|
| ciphers | 密码学算法 |
| fractals | 分形 |
| cellular_automata | 元胞自动机 |
| boolean_algebra | 布尔代数 |
| quantum | 量子计算 |
| financial | 金融计算 |
| geodesy | 测地学 |
| neural_network | 神经网络 |
| computer_vision | 计算机视觉 |

**想找冷门算法的现成实现，这里往往比搜索引擎快。**

## 读一份实现时留意 doctest

这是这个项目比一般算法集认真的地方。贡献规范要求每份实现：

- docstring 里要有清晰说明**和/或来源 URL**
- **doctest 要同时测试有效输入和错误输入**

「同时测错误输入」这一条意味着你看到的示例不是只演示顺利路径——异常分支也有覆盖。读代码时可以直接信它给的例子。

自己跑一下某个文件的 doctest：

\`\`\`bash
python -m doctest <文件路径> -v
\`\`\`

## 它的工程规范值得学

规范严到有点不必要，但其中一条原则我认为是精华：

> **展开缩写。** \`gcd()\` 不好懂，\`greatest_common_divisor()\` 就懂。规范里明确写「用描述性命名帮你省掉冗余注释」。

意思是：与其写注释解释 \`gcd\` 是什么意思，不如把它叫 \`greatest_common_divisor\`。**命名做好了，注释就省了。**

其他可借鉴的：

- 遵循 Python 命名约定：变量和函数小写、常量全大写、类名驼峰（PEP 8）
- 代码风格检查用 \`ruff\`
- 格式用 \`pre-commit\` 自动处理，不用手改

## 要提 PR 的话，两条硬规则

**一、不接受重复实现。** 已有同一算法的实现就别再提一个功能相同的。但官方明确欢迎这几种：

- 同一问题的新解法
- 同一数据结构的不同表示
- 不同复杂度的算法设计

**提交前先搜一遍。**

**二、不要为贡献算法去开 issue，直接提 PR。** 仓库官方明说「我们不在这个仓库分配 issue，所以不要请求许可」。开 issue 问「我可以贡献吗」是白费功夫。

## 测试怎么跑

所有提交会过 GitHub Actions：\`ruff check\` 加测试（跑的是 doctest）。提 PR 后页面底部会显示运行状态，失败点 details 能看输出。

## 在线改

仓库有 Gitpod 支持，徽章就在 README 顶部。**不用配环境就能在浏览器里改一个算法练手**，对想快速试一段代码很方便。

## 怎么用它学

推荐顺序：

1. 从 DIRECTORY.md 找一个你正在学的概念
2. 读那份实现的 docstring——它会给你来源链接，那往往是原始论文或教科书
3. **照着它自己写一遍**，不要复制
4. 跑 doctest 确认你的理解没错
5. 想贡献就按上面的规范改，命名那一条认真做

第3 步是关键：**这个项目的价值在于让你看懂并自己写出实现，复制粘贴等于没学。**

## 什么时候别用它

- **生产代码** —— 官方明说可能不如标准库
- **需要性能保证** —— 这些实现是清晰优先，不是性能优先
- **需要长期维护的库** —— 它是学习集合，不承诺 API 稳定

社区在 Discord（the-algorithms.com/discord），有问题可以在那里问。
`,
      resources: [
        {
          kind: "link",
          title: "DIRECTORY.md：45 个分类的完整导航",
          url: "https://github.com/TheAlgorithms/Python/blob/master/DIRECTORY.md",
          note: "85KB 的分类目录，是找特定算法的第一入口。含 ciphers、fractals、quantum 这些教材不覆盖的冷门类别。",
        },
        {
          kind: "link",
          title: "CONTRIBUTING.md：命名规范与提交流程",
          url: "https://github.com/TheAlgorithms/Python/blob/master/CONTRIBUTING.md",
          note: "不只是提交规则。「展开缩写、用描述性命名省掉冗余注释」这条原则本身就值得读。含「不接受重复实现」「不要开 issue 直接提 PR」两条硬规则。",
        },
        {
          kind: "link",
          title: "官方站点与 Discord 社区",
          url: "https://the-algorithms.com/discord",
          note: "TheAlgorithms 组织的站点入口，Discord 是提问和交流的主要场所。",
        },
      ],
    },
  },
};
