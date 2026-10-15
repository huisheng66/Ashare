import type { SeedSoftware } from "./types";

/** 静态种子：首次启动灌入 data/store/catalog.json 后即以 store 为准 */
export const software: SeedSoftware[] = [
  {
    license: "MIT",
    slug: "vscode",
    linksCheckedAt: "2026-10-12",
    name: "Visual Studio Code",
    nameZh: "VS Code",
    aliases: ["vscode", "vs code", "代码编辑器"],
    summary: "写脚本、网页和多数语言都能先用它，扩展多、启动快。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://code.visualstudio.com/",
    links: {
      official: "https://code.visualstudio.com/",
      github: "https://github.com/microsoft/vscode",
    },
    officialLabel: "code.visualstudio.com",
    whoFor: "需要一个编辑器覆盖多种语言，并且愿意装扩展。",
    whoNot: "只改几行配置，或不想维护扩展；已经在用完整 IDE 工作流也可以不换。",
    installTips: ["从 code.visualstudio.com 下载，不要用第三方「增强包」或绿色修改版。", "第一次打开先装语言包和你正在用的语言扩展，不必一次装齐。", "Git 要单独安装，编辑器不会自带完整 Git。", "如果介意内置遥测与商标条款，可以用 VSCodium，它是去掉这些内容的同源构建。"],
    guide: {
      intro: "以「配置优先级」为主线，说明 VS Code 的用户设置、工作区设置与语言特定设置如何互相覆盖，并给出排查设置不生效的方法。",
      markdown: `## 设置放在哪里

VS Code 的配置是一个 JSON 文件。命令行面板（\`Ctrl\`+\`Shift\`+\`P\`）里输入 \`Preferences: Open User Settings (JSON)\` 直接打开用户设置。

| 范围 | 位置 |
| --- | --- |
| 用户设置 | Windows \`%APPDATA%\\Code\\User\\settings.json\` |
| 用户设置 | macOS \`$HOME/Library/Application Support/Code/User/settings.json\` |
| 用户设置 | Linux \`$HOME/.config/Code/User/settings.json\` |
| 工作区设置 | 项目根目录下的 \`.vscode/settings.json\` |

工作区设置会跟着 Git 一起提交，所以它天然是团队共享的——改之前先确认这个键该不该让全项目都吃到。

## 优先级：后面覆盖前面

这是最容易搞错的部分。后面的范围覆盖前面的：

1. 默认设置
2. 用户设置
3. 远程设置
4. 工作区设置
5. 工作区文件夹设置（多根工作区）
6. 语言特定的默认设置
7. 语言特定的用户设置
8. 语言特定的远程设置
9. 语言特定的工作区设置
10. 语言特定的工作区文件夹设置
11. 策略设置（管理员下发，永远最高）

**最关键的一条：语言特定设置永远覆盖非语言特定设置，哪怕非语言特定设置的范围更窄。** 也就是说，用户设置里的 \`"[python]"\` 块会压过工作区设置里的普通 \`"editor.tabSize"\`。写 \`"[python]": { "editor.formatOnSave": true }\` 时要意识到这一层。

语言块可以合并：\`"[javascript][typescript]"\` 同时对两种语言生效。但合并时按完整语言串比较，\`"[typescript][javascript]"\` 的工作区设置**盖不住** \`"[javascript]"\` 的用户设置——顺序不同就是不同的键。

## 值的合并方式也不一样

这一点很少有人注意，但它解释了「我明明改了却只生效一半」：

- **原始值和数组是整体覆盖**。高优先级范围配了就用它的，低优先级的那个值直接作废。
- **对象类型是逐键合并**。这正是 \`workbench.colorCustomizations\` 的行为：用户设置改了背景色，工作区设置改了前景色，最后两个都在，同名键才由工作区赢。

所以「换了主题颜色只变了一半」通常不是 bug，是合并语义本该如此。

## 排查设置不生效

设置没生效时按这个顺序查：

1. 搜索框加 \`@modified\` 过滤。它只列出值与默认值不同、或在对应 JSON 里被显式写过的设置项——你改过什么一目了然。
2. 检查是不是被语言块覆盖了（上面那条优先级）。
3. 确认写对了范围。用户设置和工作区设置分开放，同一个键写错地方不会有任何提示。

\`settings.json\` 里带注释和尾逗号是合法的（JSONC），但多一个逗号或少一个括号会导致整个文件写不进去，VS Code 只报一句 \`Unable to write settings.\` 加上几个红波浪线。实在乱了就把 \`{}\` 里清空，立刻回到默认值。

## 值要写对类型

设置项的取值是强类型的，写错类型不会生效：

\`\`\`json
{
  "files.autoSave": "afterDelay",
  "editor.minimap.enabled": true,
  "files.autoSaveDelay": 1000,
  "editor.rulers": [80, 120],
  "search.exclude": { "**/node_modules": true }
}
\`\`\`

\`"files.autoSave": "afterDelay"\` 是字符串，\`"editor.minimap.enabled": true\` 是布尔值。把布尔值写成字符串 \`"true"\` 是常见错误。\`settings.json\` 里有 IntelliSense，输入时会列出合法取值。`,
      resources: [
        {
          kind: "link",
          title: "VS Code 官网",
          url: "https://code.visualstudio.com/",
          note: "各平台安装包与全部官方文档的入口。",
        },
        {
          kind: "html",
          title: "官方文档：设置优先级完整列表",
          url: "https://code.visualstudio.com/docs/getstarted/settings",
          note: "11 级优先级的权威顺序、值的合并语义与 settings.json 路径全在这页。",
        },
      ],
    },
    alternatives: ["git"],
    featured: true,
    icon: { letter: "V", color: "#007ACC", simpleIcon: "visualstudiocode" },
    tags: ["代码编辑器", "扩展", "调试", "开源"],
    body: "Visual Studio Code 是一个跨平台的代码编辑器，Windows、macOS、Linux 都有，内核是 Electron。它的定位很明确：不追求开箱即用的完整 IDE，而是把「装扩展」当成主要的扩展手段。写脚本、改配置、前端页面，多数语言的工作流都能靠官方或社区扩展补齐到够用，启动比重型 IDE 快，这是它被广泛采用的原因。\n调试与终端的整合是它区别于纯文本编辑器的地方。装对应语言扩展后可以直接在编辑器里设断点、单步、看变量，不必切回命令行；内置终端省掉一个窗口；Git 面板把 diff、暂存、提交做成了可视化操作，但底层仍是 Git 命令，概念没变。设置分成用户、工作区、语言三层 JSON，后者优先级高，这个覆盖顺序是配置不生效时第一个要查的地方。\n有两个常见误解要拆开。第一，MIT 许可证只覆盖源码，微软官方的发行版在源码之外还带商标条款、一份专有的遥测实现和连接到自家扩展市场的默认配置；介意这些的话可以用 VSCodium，它是去掉商标与遥测的同源构建，扩展市场换成 Open VSX。第二，它基于 Electron，同样功能下内存占用高于原生编辑器，开很大的文件或大量项目时会感觉到，这与它快启动的优点是同一枚硬币的两面。\n许可证为 MIT，源码在 GitHub 的 microsoft/vscode，星数近二十万，是目前最活跃的编辑器项目之一。安装包只从 code.visualstudio.com 下载，第三方「绿色修改版」既不是官方构建，也可能夹带别的东西。",
  },
  {
    license: "GPL-2.0-only",
    version: "2.56.0",
    slug: "git",
    linksCheckedAt: "2026-10-03",
    name: "Git",
    aliases: ["git scm", "版本控制", "代码版本", "版本管理"],
    summary: "记录改动、分支和协作的基础工具，写代码几乎都会用到。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["版本控制", "Git", "协作开发", "开源"],
    body:
      "Git 是分布式版本控制系统，记录每一次改动、支持分支与合并，是代码协作的基础设施。它解决的是「改坏了要能退回去，多人改同一份代码要能对得上」。\n工作方式是把历史存在本地仓库里：提交形成一条可回退的时间线，分支只是指向某个提交的可移动指针，合并与变基用来把两条线合起来。因为每个克隆都是完整仓库，断网也能提交和查看历史，推送只是同步。\n代价要提前知道：概念多且抽象，工作区 / 暂存区 / 版本库三层和 detached HEAD 会劝退不少人；冲突解决需要真的读懂差异；历史一旦推送到共享仓库，再用变基或强制推送改写会影响别人——共享分支上别这么做。\n许可证为 GPL-2.0-only（仓库 COPYING 明确：本项目只认 GPL 第二版这一份，不是 v2 或更高版本）。安装包从 git-scm.com 下载；Windows 建议连 Git Bash 一起装，macOS 用 Xcode 命令行工具或 Homebrew，Linux 用发行版包管理器。",
    officialUrl: "https://git-scm.com/downloads",
    links: {
      official: "https://git-scm.com/downloads",
      github: "https://github.com/git/git",
    },
    officialLabel: "git-scm.com",
    whoFor: "需要版本历史、分支，或要和远程仓库同步。",
    whoNot: "只做单次、不保留历史的改文件，可以先不装。",
    installTips: [
      "Windows 用 git-scm.com 的安装包，安装时可选「Git Bash」。",
      "装完在终端运行 git --version 确认进入 PATH。",
      "用户名和邮箱用 git config --global 设一次即可。",
    ],
    guide: {
      intro: "以暂存区的三条 add 命令差异为主线，讲清 Git 的三个区域、提交与回退的常用命令，以及 clone、rebase、ignore 这些最常踩坑的地方。",
      markdown: `## 三个区域

一切命令都围绕三个区域转：**工作区**（你正在编辑的文件）、**暂存区 / 索引**（\`git add\` 后的快照）、**仓库**（\`git commit\` 后的历史）。\`git commit\` 不带参数时**只提交暂存区的内容**，工作区里改了但没 add 的东西不会被带进去。

## \`git add .\` 到底加了什么

这是最容易误解的一条。差别在于**给了路径参数还是没给**，以及**有没有带 \`-\` 标志**。

| 命令 | 新文件 | 修改的文件 | 删除的文件 | 范围 |
| --- | --- | --- | --- | --- |
| \`git add <路径>\` | 加 | 加 | 旧版本忽略，新版本会记录 | 只有指定路径 |
| \`git add .\` | 加 | 加 | 加 | 当前目录及其子目录 |
| \`git add -A\` | 加 | 加 | 加 | 整个工作区 |
| \`git add -u\` | 不加 | 加 | 加 | 整个工作区内的已跟踪文件 |

关键在最后两行的注释：\`-A\` 和 \`-u\` **不带路径参数时作用于整个工作区**，官方文档明确写了「旧版本 Git 曾把它们限制在当前目录及其子目录」，但新版本不再如此。所以 \`cd\` 到子目录再 \`git add -A\` 和在根目录执行是等价的。

而 \`git add .\` 永远只看当前目录——**在子目录里执行它，加不到父目录的改动**。这是最常见的「我明明改了却没被加进去」。

还有个更细的点：给**目录**作路径参数时，Git 会把该目录的索引项整体更新为与工作树一致，因此目录下的删除也会被记录。

## 不想整个提交就挑着加

\`git add -p\` 逐块（hunk）询问，选 \`y\` 收下、\`n\` 跳过、\`s\` 拆得更细、\`e\` 直接改。这一条能避免「修一个 bug 顺手提交了半成品格式化」的常见麻烦。

另外 \`git add\` 只把**执行那一刻**的内容写进索引，之后再改还得再 add 一次。

## 回退的三种粒度

\`\`\`bash
# 只把某个文件移出暂存区，内容不变
git restore --staged file.c

# 丢弃工作区的修改，回到最近一次提交的状态
git restore file.c

# 移动 HEAD，分三个级别
git reset --soft HEAD~1   # 改动留在暂存区
git reset --mixed HEAD~1  # 改动退回工作区（默认）
git reset --hard HEAD~1   # 改动全部丢弃，慎用
\`\`\`

\`--hard\` 丢的是工作区里**未提交**的改动，没有确认提示。绝大多数情况下 \`--soft\` 或 \`--mixed\` 就够了。

被 \`--hard\` 误伤过还有救：\`git reflog\` 记录了 HEAD 的移动轨迹，找到那个哈希后 \`git reset --hard <哈希>\` 就能回到当时的状态。

## 换行符与忽略

跨平台协作必须配 \`core.autocrlf\`：Windows 上设 \`true\`，Linux/macOS 上设 \`input\` 或 \`false\`，否则同一份文件在两边提交会满屏都是整文件改动。仓库里可以放 \`.gitattributes\` 覆盖这个设置，它优先级更高。

\`\`\`bash
git config --global core.autocrlf input
printf 'node_modules/\\n.env\\n' >> .gitignore
\`\`\`

**\`git add\` 默认不添加被忽略的文件。** 明确指定某个被忽略的文件名会让 \`git add\` 直接失败并列出它；给目录时则静默跳过。要强行添加得用 \`git add -f\`。

另一个坑：文件**已经被跟踪**之后，往 \`.gitignore\` 里加规则对它无效——忽略规则只对未跟踪的文件生效。这种要先 \`git rm --cached <文件>\` 取消跟踪，再提交一次。

## rebase 与 merge

\`merge\` 保留真实历史，多出一个合并提交；\`rebase\` 把你的提交摘下来重放到目标分支顶端，历史是一条直线，**但会改写提交哈希**。

已推送的公共分支不要 rebase，别人已经拉走了你原来的哈希。要改写自己的历史用 \`git rebase -i\` 压成一条；只挑某几个提交搬过去用 \`git cherry-pick <哈希>\`。`,
      resources: [
        {
          kind: "link",
          title: "Git 官网",
          url: "https://git-scm.com/",
          note: "安装方式与最新版下载，以及全部命令手册的索引。",
        },
        {
          kind: "html",
          title: "官方手册：git-add",
          url: "https://git-scm.com/docs/git-add",
          note: "`.`、`-A`、`-u` 范围差异与 `-p` 交互模式的权威依据。",
        },
        {
          kind: "html",
          title: "Pro Git（中文版）",
          url: "https://git-scm.com/book/zh/v2",
          note: "免费完整中文教程，从记录重置到分支管理讲得比手册连贯。",
        },
        {
          kind: "html",
          title: "官方仓库 README",
          url: "https://github.com/git/git/blob/master/README.md",
          note: "源码仓库说明与编译依赖，追踪具体版本行为时用得上。",
        },
      ],
    },
    alternatives: ["vscode"],
    featured: true,
    icon: { letter: "G", color: "#F05032", simpleIcon: "git" },
  },
  {
    license: "PSF-2.0",
    version: "3.15.0",
    slug: "python",
    linksCheckedAt: "2026-10-03",
    name: "Python",
    aliases: ["python3", "pip", "py", "python 解释器"],
    summary: "脚本、数据分析、爬虫和不少课程作业的默认语言。",
    scenes: ["code", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["Python", "脚本", "数据分析", "开源"],
    body:
      "Python 是一门以可读性见长的通用编程语言，写脚本、做数据分析、爬网页、自动化重复操作和教学都常用它。它解决的是「想用尽量少的代码把一件事先跑通」。\n生态是它最大的资本：标准库覆盖文件、网络、正则、日期这些日常需求，pip 加上 PyPI 的第三方包能直接接上数值计算（NumPy、pandas）、绘图、网页请求、自动化测试与机器学习框架；语法接近伪代码，改起来也快。\n代价要提前知道：它是解释执行，纯计算性能不如编译型语言，重计算的场景通常靠 C 扩展或换语言；包与环境管理是新手最容易踩坑的地方，每个项目建议用虚拟环境隔离；另外 Python 2 已停止维护，遇到还在用 2 语法的教程要换掉。\n许可证为 PSF License Version 2（Python 软件基金会许可第二版，条款与常见的 MIT / GPL 不同，商用前建议读一遍原文）。安装包从 python.org 下载；Windows 安装时勾选 Add python.exe to PATH，macOS 与 Linux 多数自带但版本可能偏旧。",
    officialUrl: "https://www.python.org/downloads/",
    links: {
      official: "https://www.python.org/downloads/",
      github: "https://github.com/python/cpython",
    },
    officialLabel: "python.org",
    whoFor: "要写脚本、做分析，或课程指定 Python。",
    whoNot: "只想点选出统计图，不必先装语言，可看 JASP。",
    installTips: [
      "从 python.org 装官方版；Windows 勾选 Add python.exe to PATH。",
      "不要用来路不明的「Python 合集」安装器。",
      "装完用 python --version 和 pip --version 检查。",
    ],
    guide: {
      intro: "围绕虚拟环境、包管理与解释器调用方式三条主线，讲清 Python 项目该怎么组织依赖，以及 `python -m` 与虚拟环境的常见错误。",
      markdown: `## 永远用 \`python -m pip\`

\`\`\`bash
python -m pip install requests
\`\`\`

而不是直接 \`pip install\`。原因是 \`pip\` 这个命令在 Windows 上可能指向另一个解释器装的版本——尤其当你同时装了多个 Python，或者用 \`--user\` 装过东西之后。\`python -m pip\` 里的 \`python\` 就是当前解释器，装的包一定落在它自己的 site-packages 里。

判断当前解释器是谁：

\`\`\`bash
python -c "import sys; print(sys.executable)"
python --version
python -m pip --version
\`\`\`

最后一条同时给出 pip 自身路径和它绑定的解释器版本，是排查「装到哪儿去了」最快的办法。

## 虚拟环境

**每个项目一个虚拟环境**，不要往基础解释器里堆包：

\`\`\`bash
python -m venv .venv
\`\`\`

激活方式分平台：

\`\`\`bash
# Windows (PowerShell / CMD)
.venv\\Scripts\\activate

# macOS / Linux
source .venv/bin/activate
\`\`\`

激活后提示符会变（PowerShell 上通常是 \`(.venv)\` 前缀），此时 \`python\` 和 \`pip\` 都指向 \`.venv\` 里的版本。

三个易错点：

- **别把 \`.venv\` 提交进 Git。** 加进 \`.gitignore\`。
- **别用 \`virtualenv\` 替代 \`venv\`。** \`venv\` 是标准库自带的，无需额外安装；\`virtualenv\` 是第三方包，功能更强但多一个依赖。
- **每个项目独立创建，不要共用一个全局 venv。** 共用会让依赖冲突在很晚才暴露，且无法复现。

迁移环境或交付给别人时，导出依赖清单：

\`\`\`bash
python -m pip freeze > requirements.txt
\`\`\`

对方用 \`python -m pip install -r requirements.txt\` 还原。

## \`py\` 启动器（Windows）

Windows 上的 \`py\` 启动器可以挑具体版本，且**不依赖 \`PATH\` 配置**：

\`\`\`bash
py -3.12 script.py
py -3.12 -m venv .venv
py -0p        # 列出本机所有可用版本
\`\`\`

在需要指定 Python 版本的脚本里，用 \`py\` 比用 \`python\` 可靠——后者可能命中 Microsoft Store 的别名，或者压根不存在。

## 项目的目录与配置

现代项目用 \`pyproject.toml\` 声明元数据与依赖，而不是 \`setup.py\`：

\`\`\`toml
[project]
name = "myproject"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "requests>=2.31",
]

[project.scripts]
mytool = "myproject.cli:main"
\`\`\`

开发模式安装（改代码即时生效，代替反复手动重装）：

\`\`\`bash
python -m pip install -e .
\`\`\`

目录上把包放成 \`src/\` 布局比平铺更清晰：项目根下只留配置，代码全在 \`src/包名/\` 里。平铺布局里，测试目录容易被误当成包导入。

## 缩进就是语法

Python 用缩进划分代码块，没有花括号。所以**混用 Tab 和空格会直接报 IndentationError**，同一文件内必须统一用空格（官方规范是 4 个）。

多行字符串用三引号，四个单引号或三个双引号都可以，缩进会原样保留，常用于写 SQL 或 HTML 模板：

\`\`\`python
query = """
    SELECT id, name
    FROM users
    WHERE created_at > %s
"""
\`\`\`

## 版本差异要说清

\`match\` 语句需要 3.10 以上，\`X | Y\` 形式的类型标注需要 3.10 以上，\`:=\` 海象运算符需要 3.8。写 \`pyproject.toml\` 里的 \`requires-python\` 之前先确认下限，别写出装不上包的声明。`,
      resources: [
        {
          kind: "link",
          title: "Python 官网",
          url: "https://www.python.org/",
          note: "各版本下载与文档入口，右上角可直接切到 Docs。",
        },
        {
          kind: "html",
          title: "官方 README：源码获取与编译",
          url: "https://github.com/python/cpython/blob/main/README.rst",
          note: "从源码构建 CPython 的依赖与步骤（README 是 rst 格式，不是 md）。",
        },
        {
          kind: "html",
          title: "官方文档：venv 模块",
          url: "https://docs.python.org/3/library/venv.html",
          note: "虚拟环境的创建参数、激活原理与目录布局都在这页。",
        },
      ],
    },
    alternatives: ["jupyter", "jasp"],
    featured: true,
    icon: { letter: "P", color: "#3776AB", simpleIcon: "python" },
  },
  {
    license: "MIT",
    version: "26.10.0",
    slug: "nodejs",
    linksCheckedAt: "2026-10-03",
    name: "Node.js",
    aliases: ["node", "npm", "node.js", "javascript 运行时"],
    summary: "在电脑上跑 JavaScript，前端工具链和不少开发服务器都靠它。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["JavaScript", "运行时", "npm", "开源"],
    body:
      "Node.js 让 JavaScript 能跑在浏览器之外：服务端、命令行工具、构建脚本都用它。它解决的是「前端项目需要一套本地运行环境，以及一个装包和跑脚本的入口」。\n装了它就同时有了 node 与 npm：npm install 装依赖，npx 直接跑工具，package.json 记录脚本和版本。绝大多数前端构建工具、脚手架和本地开发服务器都建立在它之上，做网页开发基本绕不开。\n代价要提前知道：版本迭代快，老项目在新版 Node 上可能跑不起来，通常要配 nvm 这类版本管理器来切换；node_modules 体积大、依赖树深，装包前看清来源——供应链风险主要出在这一层；另外它是单线程事件循环，CPU 密集任务是短板。\n许可证为 MIT（仓库内含第三方组件，各自另有许可）。安装包从 nodejs.org 下载，一般选 LTS 比 Current 更稳；Windows、macOS、Linux 都有。",
    officialUrl: "https://nodejs.org/",
    links: {
      official: "https://nodejs.org/",
      github: "https://github.com/nodejs/node",
    },
    officialLabel: "nodejs.org",
    whoFor: "做网页、用 npm 装工具，或课程要求 Node。",
    whoNot: "只写 Python 或只改静态 HTML，可以后装。",
    installTips: [
      "官网选 LTS 版本，一般比 Current 更稳。",
      "装完用 node -v 和 npm -v 确认。",
      "Windows 若命令找不到，重开一次终端。",
    ],
    guide: {
      intro: "以 ESM 与 CommonJS 的判定规则为主线，说明 `type` 字段、扩展名与 `__dirname` 的关系，并给出 `npm ci`、循环依赖等工程实践要点。",
      markdown: `## Node 怎么决定一个文件是哪种模块

这是两套系统并存带来的最大困惑。判定规则看**扩展名**和**最近的 \`package.json\` 里的 \`type\` 字段**：

| 情况 | 结果 |
| --- | --- |
| \`.cjs\` 文件 | 一定是 CommonJS |
| \`.mjs\` 文件 | 一定是 ESM |
| \`.js\`，最近的 \`package.json\` 有 \`"type": "module"\` | ESM |
| \`.js\`，最近的 \`package.json\` 有 \`"type": "commonjs"\` | CommonJS |
| \`.js\`，往上找不到 \`package.json\` 或没有 \`type\` | CommonJS（但若含 ESM 语法会按 ESM 解析） |

关键点：**\`type\` 只看最近的祖先 \`package.json\`**，不会向上合并。所以子目录放一个自己的 \`package.json\` 就能让该目录下的 \`.js\` 变成另一种模块——这既是灵活的隔离手段，也是「为什么这个文件突然报 \`require is not defined\`」的常见原因。

官方明确建议：**即使全是 CommonJS 的包，也把 \`"type": "commonjs"\` 写进 \`package.json\`**，写明确比让构建工具猜要省事。

\`require()\` 永远走 CommonJS 加载器，\`import()\` 永远走 ESM 加载器，两者互不切换。

## \`__dirname\` 在 ESM 里不存在

\`__dirname\` 和 \`__filename\` 是 CommonJS 的模块作用域变量，ESM 里没有。报错就长这样：

\`\`\`text
ReferenceError: __dirname is not defined
\`\`\`

ESM 的等价物：

\`\`\`javascript
// __dirname 的替代
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'data.db')
\`\`\`

## 两种模块的语法差异

CommonJS 用 \`require\`/\`module.exports\`，ESM 用 \`import\`/\`export\`。混写会直接报错：

\`\`\`javascript
// ESM 里没有 module
export const x = 1   // 正确

// CommonJS 里没有 import
const y = require('./y')  // 正确
\`\`\`

三个实际会撞上的点：

- **顶层 \`await\` 只有 ESM 有。** CommonJS 里用 \`await\` 会语法错误。
- **相对路径在 ESM 里必须带扩展名。** \`import './utils'\` 在 ESM 里会报错，要写 \`import './utils.js'\`——ESM 不做扩展名补全。
- **内置模块用 \`node:\` 前缀更稳。** \`require('node:fs')\` 明确走内置，不受 \`name\` 字段之类的影响。

## \`require\` 加载 ESM

较新版本 Node 支持用 \`require()\` 加载 ESM（有版本下限要求），但有两个硬限制：模块必须**完全同步**（不含顶层 \`await\`），否则抛 \`ERR_REQUIRE_ASYNC_MODULE\`。此时应改用 \`import()\`。

返回值是**模块命名空间对象**，默认导出会落在 \`.default\` 属性上：

\`\`\`javascript
// point.mjs
export default class Point {}
\`\`\`

\`\`\`javascript
const point = require('./point.mjs')
point           // [Module: null prototype] { default: [class Point] }
point.default   // class Point  ← 真正的类在这里
\`\`\`

这一点最容易让人以为加载失败了。ESM 里若显式导出 \`'module.exports'\` 名字，可以指定 \`require()\` 返回什么，但那会让命名导出对 CommonJS 消费者不可见。

## 依赖安装

\`\`\`bash
npm install          # 按 package.json 装，必要时更新 lock
npm ci               # 严格按 lock 装，不改 lock，CI 与 Docker 里用这个
\`\`\`

**CI、构建产物、Docker 里一律用 \`npm ci\`。** 它要求 \`package-lock.json\` 与 \`package.json\` 一致，不一致就直接失败——这比装出一个与开发机不同的依赖树要好。\`package-lock.json\` 必须提交进版本库。

排查依赖问题：

\`\`\`bash
npm ls                 # 看依赖树，找重复版本
npm ls <包名>
npm audit
\`\`\`

## 循环依赖

\`\`\`bash
# a.js
const b = require('./b')
module.exports = 'a'

# b.js
const a = require('./a')   # 此时拿到的是 b 里的空 exports
module.exports = 'b'
\`\`\`

CommonJS 的加载是同步递归的，循环引用时后加载的一方拿到的会是尚未填充完毕的 \`exports\`（可能是 \`{}\`）。ESM 有hoisting 机制，能处理一部分循环，但仍会触发访问未初始化的绑定。**能拆就拆开，循环依赖是设计问题不是绕得过去的技术限制。**`,
      resources: [
        {
          kind: "link",
          title: "Node.js 官网",
          url: "https://nodejs.org/",
          note: "LTS 与 Current 版本下载、发行周期说明都在首页。",
        },
        {
          kind: "html",
          title: "官方文档：CommonJS 模块加载规则",
          url: "https://nodejs.org/docs/latest/api/modules.html",
          note: "`type` 字段与扩展名的判定表、`__dirname` 说明、require(esm) 的限制条件。",
        },
        {
          kind: "html",
          title: "官方仓库 README",
          url: "https://github.com/nodejs/node/blob/main/README.md",
          note: "平台支持矩阵、构建依赖与各 LTS 版本的差异说明。",
        },
      ],
    },
    alternatives: ["vscode", "python"],
    icon: { letter: "N", color: "#339933", simpleIcon: "nodedotjs" },
  },
  {
    slug: "dbeaver",
    license: "Apache-2.0",
    linksCheckedAt: "2026-10-03",
    name: "DBeaver",
    aliases: ["数据库客户端", "sql 客户端", "DBeaver CE", "数据库工具", "SQL 客户端"],
    summary: "连上各类数据库看表、跑 SQL，社区版免费。",
    scenes: ["code", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://dbeaver.io/download/",
    officialLabel: "dbeaver.io",
    links: {
      official: "https://dbeaver.io/download/",
      disk: "https://pan.quark.cn/s/6ee5d2df3b7b",
      diskNote:
        "夸克网盘上的固定版本副本，26.2.2社区版 Windows 安装包。文件取自 dbeaver/dbeaver 官方 Release 附件，经高校镜像站转发后下载到本地、再转存到网盘，中间每一步都比对过大小与哈希。注意：dbeaver 的 Release 未提供官方校验文件，这里的 SHA-256 是本地计算值，只能证明「这份文件自上传起未被改动」，没有官方值可供对照——想要更强保证请从官网 dbeaver.io 直接下载。网盘里是固定版本的快照，上游发新版不会自动更新。",
      diskFile: "dbeaver-ce-26.2.2-windows-x86_64.exe",
      diskSha256: "6de2427f0ea760424c1f34b9ec056b1f18878576bd5054850daa0cefbfb90a79",
    },
    tags: ["数据库", "SQL", "数据库客户端", "跨平台"],
    body:
      "DBeaver 是跨平台的数据库客户端，用一个界面连上 MySQL、PostgreSQL、SQLite、Oracle、SQL Server 等几十种数据库，看表结构、写 SQL、导数据都在里面完成。它解决的是「同时用好几种数据库，不想每个都装一个官方客户端」。\n社区版（Community）开源免费，覆盖日常绝大多数操作：ER 图、数据导入导出、带自动补全的 SQL 编辑器、结果集直接编辑。企业版（PRO）额外支持云数据库、NoSQL 与更多导出格式，按订阅收费——如果只需要连关系型数据库，社区版就够。\n代价是它基于 Eclipse 平台、打包了 Java 运行时，启动偏慢、占用内存偏高，老旧机器上会明显感觉到。安装包从 dbeaver.io 的下载页获取，Windows、macOS、Linux 都有。",
    whoFor: "需要图形界面看库、写查询，而不想只待在命令行。",
    whoNot: "还没有数据库可连，或只用电子表格就够。",
    installTips: [
      "下载 Community 版即可，不必买 EE。",
      "第一次连库要准备主机、端口、账号；本地库先确认服务已启动。",
      "驱动缺失时按软件提示下载官方驱动。",
    ],
    guide: {
      intro: "以 SQL 编辑器的执行方式与自动提交开关为主线，讲清 DBeaver 里跑脚本的正确姿势、结果面板的组织，以及手工提交模式下的事务收尾。",
      markdown: `## 执行：单条还是整个脚本

这是最关键的一个区分，选错会出事。

| 动作 | 快捷键 | 作用 |
| --- | --- | --- |
| Execute SQL Statement | \`Ctrl\`+\`Enter\` | 只跑光标所在的那条语句 |
| Execute SQL in new tab | \`Ctrl\`+\`\\\` | 单条，但在新结果标签页里执行 |
| Execute SQL Script | \`Alt\`+\`X\` | 整个脚本按分号切分，逐条依次执行 |
| Execute Statements In Separate Tabs | \`Ctrl\`+\`Alt\`+\`Shift\`+\`X\` | 每条各开一个标签页，**并行执行** |

前三个都能在工具栏、右键菜单「Execute」和主菜单「SQL Editor」下找到同一入口。

脚本的切分依据是语句分隔符，**默认是 \`;\`**，可在 SQL 编辑器右键的「Preferences」里改。这意味着把多条语句挤在一行用分号隔开，再用 \`Alt\`+\`X\` 就会一次全跑掉——写迁移脚本时先确认分号位置。

**最后那个「分标签页并行执行」要慎用。** 每条语句跑在各自线程里同时执行，语句数量一多就可能把客户端 UI 卡住、把数据库压垮，甚至触发事务死锁。官方文档专门为此加了警告。

## 打开编辑器的几个入口

| 场景 | 做法 |
| --- | --- |
| 从连接打开已有脚本 | 选中连接按 \`F4\`，或右键「Open SQL script」 |
| 打开该连接最近的脚本 | 右键连接 →「SQL Editor」→「Recent SQL script」，或 \`Ctrl\`+\`Enter\` |
| 新建脚本 | 主菜单「SQL Editor → New SQL Editor」，或 \`F3\` |

**SQL Editor 和 SQL console 不是一回事。** console 是针对某张表或视图的临时会话，**不保存脚本**；Editor 可以保存脚本，存在 Project Explorer 的 Scripts 文件夹里下。要留存的就用 Editor。

## 活动连接与布局

SQL 文本和连接是两回事，可以随时换：

| 操作 | 快捷键 |
| --- | --- |
| 切换活动数据源 | \`Ctrl\`+\`9\` |
| 切换活动 Catalog / Schema | \`Ctrl\`+\`0\` |
| 与当前焦点连接关联 | \`Ctrl\`+\`Shift\`+\`,\` |
| 显示/隐藏结果面板 | \`Ctrl\`+\`6\` |
| 最大化结果面板 | \`Ctrl\`+\`Shift\`+\`T\` |
| 在脚本与结果面板间切换 | \`Ctrl\`+\`Alt\`+\`T\` |

布局方向在右键「Layout」里选 Horizontal 或 Vertical。面板排布存在个人配置里，多显示器下切横竖屏各存一套更顺手。

结果标签页默认按查询里的主表命名；有 join 时会显示成 \`表名(+.md)\`。想自己指定名字，在脚本里加一行特殊注释即可：

\`\`\`sql
-- title: 本月新增用户
SELECT * FROM users WHERE created_at >= '2026-10-01';
\`\`\`

这个注释只影响标签页标题，不会被当成注释忽略掉吗——会，DBeaver 专门解析它。这也是个易错点：以为它只是普通注释，随手删掉后标签页就变回表名了。

## 错误提示与动态参数

语义分析打开时（关系型数据库才生效），编辑器会在语句左侧标出错误图标，悬停能看到错误列表，鼠标移到某条错误上会高亮对应片段。这不是语法高亮，是真的在跑前检查。

带动态参数的语句执行时会弹窗要求填值，格式是 \`:名字\`，也支持匿名参数 \`?\`。导出查询结果不必等它跑完：右键「Execute → Export From Query」直接进数据导出向导。

## 快捷键可以自己改

按 \`F1\` 打开文档。若某个键位和系统或其他软件冲突，走「Window → Preferences → User Interface → Keys」，选中命令后在 Binding 行改。改键前先在这里搜一下有没有现成默认项。

**提交按钮旁边那个小图标是自动提交开关。** 手工关掉自动提交时，DBeaver 不自动 commit，改动会留在事务里——记得手动提交或回滚，别让它一直挂着。`,
      resources: [
        {
          kind: "link",
          title: "DBeaver 官网",
          url: "https://dbeaver.io/",
          note: "社区版安装包与各商业版本功能对比。",
        },
        {
          kind: "html",
          title: "官方文档：SQL Editor",
          url: "https://dbeaver.com/docs/dbeaver/SQL-Editor/",
          note: "面板构成、活动连接切换、布局调整、错误指示与动态参数绑定。",
        },
        {
          kind: "html",
          title: "官方文档：快捷键全表",
          url: "https://dbeaver.com/docs/dbeaver/Shortcuts/",
          note: "SQL Editor、Data Editor、搜索与通用操作的完整键位，含 Windows 与 macOS 两列。",
        },
      ],
    },
    alternatives: ["vscode"],
    icon: { letter: "D", color: "#382923" },
  },
  {
    slug: "zotero",
    license: "AGPL-3.0",
    linksCheckedAt: "2026-10-12",
    name: "Zotero",
    aliases: ["文献管理", "论文引用"],
    summary: "抓文献、生引用、插到 Word 或 Markdown 里。",
    scenes: ["docs"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://www.zotero.org/download/",
    links: {
      official: "https://www.zotero.org/download/",
      github: "https://github.com/zotero/zotero",
    },
    officialLabel: "zotero.org",
    whoFor: "写长文或论文，需要管参考文献和引用格式。",
    whoNot: "只写短通知、不引用文献。",
    installTips: ["桌面端之外还要装浏览器连接器（Zotero Connector），否则抓取网页文献这一步没法用。", "官方同步只有 300MB 免费空间，放 PDF 很快会满；大库建议用 WebDAV 或只用本地存储。", "引用样式如果内置列表里没有，去 Zotero Style Repository 搜期刊名，装 .csl 文件即可。", "卸载前先确认库文件位置（「编辑 → 首选项 → 高级 → 文件和文件夹」），数据默认在个人目录下，重装不会自动找回。"],
    guide: {
      intro: "从「加什么、怎么存、怎么不重复」三件事出发，讲清 Zotero 条目与附件的存放差异、重复检测的真实判据，以及 Word 引文插件的工作方式。",
      markdown: `## 条目与附件是两回事

Zotero 存两类东西：**元数据条目**（书、论文、网页）和**文件附件**。文件有三种放法，选错会导致换设备后找不到文件：

| 附件类型 | 文件在哪 | 会同步吗 | 删除条目时 |
| --- | --- | --- | --- |
| 存储副本（Stored File） | 复制进 Zotero 数据目录 | 同步 | 文件一起删 |
| 链接文件（Linked File） | 只存路径，指向你原来的位置 | **不同步** | 文件保留 |
| 链接 URI（Linked URI） | 只存网址或 onenote:// 之类的地址 | 同步链接本身 | — |

官方推荐优先用**存储副本**：文件被复制进数据目录，Zotero 全权管理，还能跟着条目一起同步到别的设备。拖文件进 Zotero 默认就是存副本；要改成链接，得按住 \`Ctrl\`+\`Shift\`（macOS 是 \`⌘\`+\`⌥\`）再拖。

链接文件有两个硬限制：**不参与同步**，也**不能用在群组库里**——没法保证其他成员能访问到你机器上那个路径。想跨设备用链接文件，就得自己同步那个目录（比如网盘），并设置「链接附件基础目录」让 Zotero 在每台机器上找到对应的位置。

需要从链接转为存储副本，走「工具 → 管理附件」。

## 独立附件是个坑

直接拖一个 PDF 进来，Zotero 会尝试检索它的元数据并自动建一个父条目。检索失败就会留下一个**独立附件**——它没有书目元数据，因此**不能被引用、不出现在「我的出版物」里、大部分检索也找不到它**。

所以能建父条目就建：抓到网页条目后把 PDF 拖到它上面，或者右键 PDF 选「Create Parent Item」填 DOI 或 ISBN，再不行才手动录入。养成「文件必须挂在父条目下」的习惯，否则这个库以后没法用。

## 重复检测的真实判据

Zotero 靠**标题、DOI、ISBN** 判断重复。这三个字段相同或都缺失时，它还会比对年份（相差一年以内）和作者列表（至少一位作者的姓加名字首字母相同）。

由此推出几个必然结论：

- **同一篇文章的不同 DOI 不会被判为重复。** 预印本与正式版、不同数据库的记录可能各有一个 DOI。
- **检测只在单个库内进行。** 群组库之间的条目互不比较。
- **目前无法把误判标记为「非重复」。** 所以这个视图要定期看，看完手动合并。

**合并永远优于删除。** 合并会保留所有被合并条目的分类和标签，删掉一个就丢了。合并后文字处理插件也能识别，已插入的引文和参考文献不受影响。

在「Duplicate Items」集合里选一个条目，Zotero 会自动把认为重复的其它条目一并选中，点右栏的「Merge Items」按钮。字段不一致时可以在顶部选一个「master」，再用各字段右侧的图标挑替代值。按标题排序后更好分辨；按住 \`Alt\` 可只选单个条目，按住 \`Ctrl\`（macOS 是 \`⌘\`）可从一组里取消某个。

任意位置选中**同类型**的两个以上条目，右键也有「Merge Items…」。

## 存储空间

| 容量 | 价格 |
| --- | --- |
| 300 MB | 免费 |
| 2 GB | 20 美元/年 |
| 6 GB | 60 美元/年 |
| 无限 | 120 美元/年 |

群组库用群组所有者的存储额度，不额外收费。免费额度对纯文本条目够用，攒 PDF 就会超。

## Word 与 LibreOffice 引文

插件随 Zotero 一起安装，首次启动时自动装好，之后可在首选项的「Cite → Word Processor Plugins」里重装。

用法是**动态**的：插入一条引文后，参考文献会自动包含被引条目；你在 Zotero 里改对了标题，文档里点刷新也跟着变。不需要手动重排。

相关操作：添加/编辑引文、添加/编辑参考文献、编辑文档首选项（选引文样式）、刷新。快捷键 \`Ctrl\`+\`Alt\`+\`C\` 插入引文。

选样式在「编辑 → 文档首选项」里，选 APA、Chicago 等；样式由独立的 CSL 文件定义，改样式不用动 Zotero 本身。

**动笔前先设样式。** 事后从 APA 改到 GB/T 7714，所有正文引文都要重排。`,
      resources: [
        {
          kind: "link",
          title: "Zotero 官网",
          url: "https://www.zotero.org/",
          note: "下载安装与账号注册，文档从顶部 Support 进入。",
        },
        {
          kind: "html",
          title: "官方文档：重复检测与合并",
          url: "https://www.zotero.org/support/duplicate_detection",
          note: "判重用的具体字段、群组库不参与判重的说明，以及合并操作步骤。",
        },
        {
          kind: "html",
          title: "官方文档：添加与管理附件",
          url: "https://www.zotero.org/support/attaching_files",
          note: "存储副本与链接文件的区别、拖拽时的修饰键、网页快照机制。",
        },
        {
          kind: "html",
          title: "官方文档：Word 插件使用",
          url: "https://www.zotero.org/support/word_processor_plugin_usage",
          note: "插入引文、编辑引文、刷新与文档首选项的具体操作。",
        },
        {
          kind: "html",
          title: "官方文档：存储空间与定价",
          url: "https://www.zotero.org/support/storage",
          note: "免费额度与各档价格表，以及群组库的额度归属规则。",
        },
      ],
    },
    alternatives: ["obsidian", "pandoc"],
    featured: true,
    icon: { letter: "Z", color: "#CC2936" },
    tags: ["文献管理", "论文引用", "参考文献", "开源"],
    body: "Zotero 是文献管理工具，用来收集、组织、标注和引用研究资料。它最省事的一环是浏览器连接器：在期刊页面、书店页面或知网页面上点一下，标题、作者、期刊、年份、DOI 这些元数据就被抓进库里，PDF 也一并存下。手工录入书目是文献管理里最枯燥的部分，这一步自动化之后，攒库的成本才真正降下来。\n引用是它的第二个核心。库里选中条目，在 Word 或 LibreOffice 的插件里插入引文，文末参考文献表自动生成；换期刊投稿时改一下样式文件，全书的引用格式和条目顺序一起重排，不用逐条手改。引用格式走 CSL 标准，内置样式覆盖主流期刊，缺的可以去样式库搜期刊名装 .csl 文件。笔记与 PDF 标注挂在条目下，写综述时能直接定位到当初划的那一句。\n要区分清楚哪部分是免费的。桌面客户端是开源软件，许可证 AGPL-3.0，源码在 GitHub 的 zotero/zotero；但官方同步服务只有 300MB 免费额度，PDF 存多了必然超，超出要订阅。替代方案是配 WebDAV，或者只用本地库与群组库。另外 Zotero 这个名字是注册商标，衍生分发不能沿用。数据默认存在个人目录下，卸载不会删库，但重装后要在首选项里指回原来的数据目录。\n同类里它的取舍是「够用的自动化 + 开放的数据」。比 Obsidian 强在元数据抓取与引用生成，那是文献工作流的刚需；比 EndNote 强在不要钱且数据不被锁在专有格式里。代价是它的组织逻辑偏书目而非笔记，如果你真正想要的是一个互联的知识网络而不是一份引用清单，它给不了。",
  },
  {
    slug: "obsidian",
    linksCheckedAt: "2026-10-03",
    name: "Obsidian",
    aliases: ["笔记", "markdown 笔记", "双向链接", "知识库", "obsidian md"],
    summary: "本地 Markdown 笔记，适合长期积累和双向链接。",
    scenes: ["docs", "office"],
    platforms: ["windows", "macos", "linux"],
    source: "official",
    price: "个人免费",
    tags: ["笔记", "Markdown", "知识管理", "双链笔记"],
    body:
      "Obsidian 是本地 Markdown 笔记软件，笔记以 .md 文件存在你自己选的文件夹里，靠双向链接把零散笔记连成一张网。它解决的是「笔记要放很多年、文件要握在自己手里、还想看出想法之间的联系」这类需求。\n所谓库就是一个普通文件夹，Obsidian 只是把它渲染出来：笔记是纯文本，Ctrl/Cmd 点击进入反向链接面板能看到谁引用了当前页，图谱视图把整库的关系画成图；社区插件上千，看板、日历、任务、Dataview 式查询、Canvas 白板都能装；Windows、macOS、Linux 和移动端都有，搜索在本地跑，几千篇笔记也能秒出结果。\n代价要提前想清楚：主程序是专有软件，不是开源项目；官方同步和 Publish 站点是付费的，不想掏钱就得自己拿网盘或 Git 同步库目录，而多端同时编辑会产生冲突文件；插件质量参差，装多了会拖慢启动，版本升级也可能让某个插件暂时失效；库目录要自己备份，误删就是真删，没有厂商替你兜底；移动端能力明显弱于桌面端。\n许可证方面，个人使用免费，商业使用需要购买商业许可证；绝大多数插件是开源的，但主程序不是。安装包从 obsidian.md/download 获取。",
    officialUrl: "https://obsidian.md/download",
    links: { official: "https://obsidian.md/download" },
    officialLabel: "obsidian.md",
    whoFor: "要用本地文件做长期笔记，并能接受 Markdown。",
    whoNot: "只想要微信式云笔记、不想管文件夹。",
    installTips: [
      "个人使用免费，从 obsidian.md 下载。",
      "库就是一个文件夹，先选一个你能备份的位置。",
      "同步不是必须；官方同步收费，也可用你自己的网盘同步库目录。",
    ],
    guide: {
      intro: "从建立仓库结构开始，把Obsidian 用成可长期维护的本地知识库：链接语法、属性、模板与插件安装。",
      markdown: `##仓库是普通文件夹，不是什么魔法容器

Obsidian 里的一切都发生在 **vault（仓库）** 上，而vault 就是一个磁盘上的普通文件夹：里面是你的 \`.md\` 笔记，外加一个 Obsidian 自己生成的 \`.obsidian/\` 配置目录。\`.obsidian\` 目录绝对不要手动编辑或提交到公开仓库——它会记录窗口尺寸、最近打开的文件等本地状态。想换台机器继续写，只要把整个文件夹拷过去，用「打开本地仓库」指到它即可。

新建仓库的入口是启动页的 **Open folder as vault**；已有一个 Obsidian 仓库，也可以从仓库文件夹直接用「Open folder as vault」挂载。养成两个习惯：

- 附件、模板、附件目录都放进仓库内，用相对路径引用，换机器不会丢。
- 仓库顶层用一层子目录分类（如 \`daily/\`、\`projects/\`），不要让上千个文件平铺在根目录。

## 链接语法：优先用wikilink，而不是路径

双链 \`[[笔记名]]\` 是Obsidian 的核心：写 \`[[费曼学习法]]\`，Obsidian 会自动解析成指向仓库内同名的 \`.md\` 文件（不必写 \`.md\` 后缀）。链接标题可改写：\`[[费曼学习法|学习笔记]]\`。它会在后台悄悄建好文件，标题对不上时会在右侧关系面板列出「未解析链接」，这是全库最实用的自查入口。

其他三种常用变体：

| 语法 | 作用 |
| --- | --- |
| \`[[笔记名]]\` | 链接到整篇笔记 |
| \`[[笔记名#小节标题]]\` | 链接到笔记内的一个小节 |
| \`[[笔记名#^块ID]]\` | 链接到某个被引用块标识的块 |
| \`![[图片.png]]\` | 直接嵌入文件而不是链接过去 |

嵌入语法是易错高发区：在方括号内的笔记名前加感叹号，就是**嵌入笔记内容**（而非只是链接），写反了会让整篇笔记被拖进正文。

## 常用快捷键

| 快捷键 | 作用 |
| --- | --- |
| \`Ctrl/Cmd + O\` | 快速切换器，按名字跳笔记 |
| \`Ctrl/Cmd + P\` | 命令面板，所有命令都搜得到 |
| \`Ctrl/Cmd + N\` | 新建笔记 |
| \`Ctrl/Cmd + E\` | 在编辑视图与阅读视图之间切换 |
| \`Ctrl/Cmd + Shift + F\` | 全库搜索，搜索结果里可直接新建笔记 |
| \`Ctrl/Cmd + 鼠标滚轮\` | 调整字号 |

## 属性与模板

在笔记正文最前面加一段 YAML 属性块，Obsidian 会把它识别为结构化元数据，并在下方自动渲染成属性表格：

\`\`\`yaml
---
tags: [方法论, 学习]
created: 2026-03-01
status: draft
---
\`\`\`

属性是 Dataview 这类插件的查询基础，也是按 \`#标签\` 和属性做筛选的依据。注意属性块必须紧贴文件开头，中间隔一个空行就会失效、整段被当成普通正文。

模板则负责批量复用这种开头：**设置 → 核心插件 → 模板**里指定模板文件夹位置，再从命令面板执行「模板：插入模板」。日常笔记建议配一个日记模板，自动带上日期和 \`daily\` 标签。

## 插件：先关安全模式，再动手

社区插件默认不加载。需要先在 **设置 → 第三方插件** 里关闭「安全模式」，然后点「浏览」安装。装之前先想清楚一件事：插件是整个仓库范围生效的，一个插件读遍全库文件，信任成本比想象中大，建议只装确有用途的少数几个。

初次配置里值得先确认的两项：**File & Links → New link format**（决定新粘贴的链接用什么格式）和 **Appearance → Theme**，后者决定跟随系统还是自定深色浅色。`,
      resources: [
        {
          kind: "link",
          title: "Obsidian 官网",
          url: "https://obsidian.md/",
          note: "产品首页，说明编辑器定位与各平台下载入口。",
        },
        {
          kind: "link",
          title: "Obsidian 帮助文档",
          url: "https://help.obsidian.md/",
          note: "官方手册，查仓库结构、链接语法、插件机制最权威。",
        },
      ],
    },
    alternatives: ["joplin", "vscode"],
    icon: { letter: "O", color: "#7C3AED", simpleIcon: "obsidian" },
  },
  {
    slug: "texstudio",
    license: "GPL-3.0",
    linksCheckedAt: "2026-10-12",
    name: "TeXstudio",
    aliases: ["latex", "tex", "论文排版"],
    summary: "写 LaTeX 的编辑器，公式和论文模板常用它。",
    scenes: ["docs"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://www.texstudio.org/",
    officialLabel: "texstudio.org",
    links: {
      official: "https://www.texstudio.org/",
      github: "https://github.com/texstudio-org/texstudio",
      disk: "https://pan.quark.cn/s/6ee5d2df3b7b",
      diskNote: "夸克网盘上的固定版本副本，4.9.8 Windows 安装包（官方签名版）。文件取自 texstudio-org/texstudio 官方 Release 附件。校验值可信：虽然本地算的是 SHA-256（上游只提供 SHA1），但与上游 hashes.txt 中同名文件的记录逐字一致。网盘里是固定版本的快照，上游发新版不会自动更新。",
      diskSha256: "243d64e65bbefff706c92b58fb1a56b6e024fbb1fb11dffc623e59c18b0ab397",
      diskFile: "texstudio-4.9.8-win-qt6-signed.exe",
    },
    whoFor: "要排公式、用会议或期刊 LaTeX 模板。",
    whoNot: "只写短文档、不需要精确排版，用普通文档软件即可。",
    installTips: ["编辑器只负责写与编译，排版引擎要另外装：TeX Live（全平台）或 MiKTeX（Windows 为主）。", "中文文档用 XeLaTeX 编译，配合 ctex 宏包；用 pdfLaTeX 会遇到字体与编码问题。", "在「选项 → 构建 → 默认编译器」里把 XeLaTeX 设为默认，之后按 F5 即可，不必每次手动切。", "安装后第一次编译如果找不到 pdflatex，检查排版引擎的 bin 目录是否在 PATH 里。"],
    guide: {
      intro: "从编译器配置讲到补全、快捷键与项目结构，讲清TeXstudio 这套跨平台 LaTeX IDE 到底该怎么配。",
      markdown: `## 它是什么：从 TeXworks 分叉出来的编辑器

TeXstudio 最早是 TeXworks 的一个分支，如今是独立维护的跨平台 LaTeX 集成编辑器，Windows / macOS / Linux 都有。定位是「编辑器 + 编译调度台」：它本身不排版，排版引擎（pdfLaTeX、XeLaTeX、LuaLaTeX）需要你另外装好，TeXstudio 只负责把你的 \`.tex\` 交给它、把错误信息抓回来显示。

安装后的第一件事是告诉它引擎在哪：**Options → Configure → Build**，把 \`pdflatex\`、\`xelatex\`、\`lualatex\` 的路径填对。这一步没配好，按编译键只会得到「command not found」。

## 选编译器：中文文档必须用XeLaTeX

这是新手最常踩的坑。默认的 pdfLaTeX 不支持系统字体，遇到中文直接报 \`Unicode character\` 类错误。

| 场景 | 引擎 | 说明 |
| --- | --- | --- |
| 纯英文LaTeX | pdfLaTeX | 速度最快，默认即可 |
| 需要中文 | XeLaTeX | 配合 \`ctex\` 宏包，系统字体可直接用 |
| 需要更现代的排版特性 | LuaLaTeX | 字体模型更灵活，速度略慢 |

中文文档的最小可用骨架：

\`\`\`latex
\\documentclass[UTF8]{ctexart}
\\begin{document}
中文正文。
\\end{document}
\`\`\`

在 **Options → Configure → Build → Default Compiler** 里把它切成 XeLaTeX 之后，全局默认就变了；单个文件可以右键 → **Compile** 临时换引擎，不必改全局。

## 快捷键

| 快捷键 | 作用 |
| --- | --- |
| \`F5\` | 编译并刷新内置 PDF 预览 |
| \`Ctrl + Shift + B\` | 只编译，不刷新预览 |
| \`Alt + Tab\` | 在编辑器与 PDF 预览间来回切换焦点 |
| \`Ctrl + Space\` | 触发代码补全 |
| \`Ctrl + Shift + Space\` | 单词补全（补全整个术语） |
| \`Ctrl + Shift + F\` | 全局搜索 |
| \`Ctrl + B\` | 加粗 / 取消加粗 |
| \`F1\` | 打开帮助 |

右键边栏的 **Compile** 可以把当前命令复制成命令串，比在设置里猜选项快得多。

## 补全从命令行改成字典

默认补全是命令补全：敲 \`\\\\section\` 出提示、敲 \`\\\\begin\` 会自动成对给出 \`\\\\end\`。更实用的是词典式补全——写 \`sec\` 出 \`\\\\subsection\`。

去 **Options → Configure → Auto Completion** 里加词典，加完点 **Update all**。有几个细节值得注意：

- 补全是**上下文敏感**的，在数学环境里输 \`\\\\alpha\` 不会被当成正文单词。
- 词典里的 \`#\` 表示「需要参数」，如 \`\\\\ref{#}\`，提示里会留一个占位框。
- 上一句漏了 \`\\\\begin\` 会导致后面整段都不弹提示——先修好配对，再怪补全。

## 多文档项目与清理

主文件用 \`\\\\input{}\` / \`\\\\include{}\` 拆章节时，在 **Options → Configure → Build → Main document** 里指定 \`\\\\input\` 编译的根文件，不要靠目录里哪个 .tex 最新来判断。章节文件的语法检查依赖根文件存在，否则 \`\\\\ref{}\` 全是问号。

另一个反复出现的困惑是「明明改了却编译出旧结果」：LaTeX 会缓存辅助文件（\`.aux\`、\`.toc\`）。**Options → Configure → Build → Clean** 里可以配一组清理规则，或直接用 \`Ctrl + Shift + F12\` 做一次彻底清理，代价是下次编译会明显变慢。`,
      resources: [
        {
          kind: "html",
          title: "TeXstudio 项目 README",
          url: "https://github.com/texstudio-org/texstudio/blob/master/README.md",
          note: "官方仓库说明，含各平台构建方式与版本要求。",
        },
        {
          kind: "html",
          title: "TeXstudio 项目 Wiki",
          url: "https://github.com/texstudio-org/texstudio/wiki",
          note: "官方 wiki，配置技巧、常见编译错误的排查思路都在这里。",
        },
      ],
    },
    alternatives: ["pandoc", "libreoffice"],
    icon: { letter: "T", color: "#008080" },
    tags: ["LaTeX", "论文排版", "公式编辑", "开源"],
    body: "TeXstudio 是一个专门写 LaTeX 的编辑器，跨平台，基于 Qt。它解决的是「写源码 + 编译 + 看 PDF」这个循环里的摩擦：左边写 .tex，右边直接显示编译出来的 PDF，在 PDF 上双击某个词，光标跳到对应源码行；反过来编译报错时点错误信息也能跳回去。这一个双向跳转省掉的是在编辑器、命令行、PDF 阅读器三个窗口之间来回切的时间。\n它把编译流程收成了一个按钮。默认配置下按 F5 就能依次完成编译和刷新，顶部菜单可以切 pdfLaTeX、XeLaTeX、LuaLaTeX，换引擎不用改命令行。语法高亮认得常见宏包的命令和环境，命令补全在你打反斜杠时弹出候选，配合几百个可点选的数学符号面板，排公式主要靠点而不是靠记。左侧还有结构视图，按章节和标签列出全文大纲，长文档里跳节比滚动快得多。\n要提前知道它不做什么。TeXstudio 不是所见即所得编辑器，你始终在看源码，排版效果要等编译；它也不自带排版引擎，LaTeX 本身（TeX Live 或 MiKTeX）要另外安装，它只负责调用。中文文档这条链更容易绊住人：用 pdfLaTeX 配 CJK 会踩字体和编码的坑，实际可行路线是 XeLaTeX 加 ctex 宏包，并且要在「选项 → 构建」里把默认编译器改成 XeLaTeX，否则每次都得手动切。\n许可证是 GPL-3.0，Windows、macOS、Linux 都有安装包，源码在 GitHub 的 texstudio-org/texstudio。有一处对不上要说明：仓库里的 COPYING 文件是 GPL-3.0 全文（2018 年 7 月那次变更的提交标题就是 license），但部分源文件的头注释仍写着「version 2 of the License, or at your option any later version」这个旧模板。以许可证文件为准，实际交付的授权是 GPL-3.0。",
  },
  {
    license: "GPL-3.0",
    version: "3.6.1",
    slug: "sumatrapdf",
    linksCheckedAt: "2026-10-03",
    name: "Sumatra PDF",
    aliases: ["pdf 阅读", "pdf", "pdf 阅读器", "轻量 pdf", "epub 阅读"],
    summary: "Windows 上很轻的 PDF 阅读器，打开快、广告没有。",
    scenes: ["docs"],
    platforms: ["windows"],
    source: "opensource",
    tags: ["PDF", "阅读器", "轻量", "开源"],
    body:
      "Sumatra PDF 是 Windows 上的轻量 PDF 阅读器，安装包只有几 MB，启动几乎瞬时，没有广告也没有遥测。它解决的是「只是想把 PDF 打开看完，不想被一个沉重的套件拖住」这类需求。除了 PDF，它还支持 EPUB、MOBI、CBZ、DjVu、XPS 等格式。\n它把力气都花在读这件事上：界面极简、冷启动快、内存占用低；提供便携版（portable），可以放 U 盘随身带，不写注册表；支持命令行参数调用；和 LaTeX 编辑器的协作做得不错，靠 SyncTeX 做正向与反向搜索，改完编译能直接跳回对应位置；可以自定义背景色和深色模式，长时间看文档眼睛舒服些；也支持标签页和基础的 PDF 表单填写。\n代价很明确：只做 Windows，macOS 和 Linux 没有官方版本；批注和高亮功能很基础，指望多人协作批注或复杂审阅流程它做不到；没有账户、没有云同步，换机器要自己搬；界面朴素，触摸屏和手写笔体验弱；更新节奏慢，几个月才发一版；它不是编辑器，改 PDF 内容不是它的活。\n许可证为 GPL-3.0，源码在 github.com/sumatrapdfreader/sumatrapdf，安装包从官网 sumatrapdfreader.org 获取，installer 和 portable 两种都要从官网下，别从第三方站拿。",
    officialUrl: "https://www.sumatrapdfreader.org/download-free-pdf-viewer",
    links: {
      official: "https://www.sumatrapdfreader.org/download-free-pdf-viewer",
      github: "https://github.com/sumatrapdfreader/sumatrapdf",
    },
    officialLabel: "sumatrapdfreader.org",
    whoFor: "在 Windows 上大量读 PDF，想要启动快、界面干净。",
    whoNot: "用 Mac 或 Linux，或需要重度批注协作。",
    installTips: [
      "只从官网下载 installer 或 portable。",
      "可设为默认 PDF 程序。",
      "便携版适合 U 盘，不写注册表。",
    ],
    guide: {
      intro: "把 Sumatra PDF 当成一个可脚本化的阅读器来用：界面快捷键、书签管理，以及真正能写进脚本的命令行参数。",
      markdown: `## 轻，但不只是「能打开」

Sumatra PDF 是 Windows 上的开源阅读器，同时支持 PDF、EPUB、MOBI、CBZ、XPS、DjVu、CHM 等格式。它的卖点是启动快、内存占用低，而且带一套完整的命令行工具，可以挂进脚本里做批量转换和提取。

界面是单窗口多标签：\`Ctrl + N\` 开新窗口，\`Ctrl + O\` 打开文件，中键点标签页可以左右拖动排序。所有设置都存在 \`SumatraPDF-settings.txt\` 里，可以直接手改。

## 快捷键：官方手册为准

| 快捷键 | 作用 |
| --- | --- |
| \`Ctrl + 0\` / \`1\` / \`2\` / \`3\` | 适合页面 / 实际大小 / 适合宽度 / 适合内容 |
| \`F11\` / \`F5\` | 全屏 / 演示模式 |
| \`F12\` | 显示或隐藏书签栏 |
| \`F8\` | 显示或隐藏工具栏 |
| \`Ctrl + B\` | 把当前页加入收藏 |
| \`Ctrl + F\` / \`Ctrl + G\` | 搜索 / 跳页 |
| \`Ctrl + 6\` / \`7\` / \`8\` | 单页 / 对开 / 书籍视图 |
| \`n\` / \`p\` / \`g\` | 下一页 / 上一页 / 跳页 |
| \`j\` \`k\` \`h\` \`l\` | 按行与按列滚动 |

一个实用组合：用 \`Ctrl + 7\` 切到对开模式做文献对照，翻页按「左页右页」成对跳，比单页模式省一半按键。快捷键可在 **Settings → Keyboard shortcuts** 里逐条改，也能输入命令名搜索。

## 书签与收藏是两套东西

这是最容易混的地方：**收藏（Favorites）** 是 \`Ctrl + B\` 加的当前页快照，存在应用数据里；**书签（Bookmarks）** 是你写入文件内部、随文件分发的。两者存储位置完全不同，导出给别人时只会带走书签。书签面板空着多半是文档本身没有书签大纲——Sumatra 不会自己从目录生成。

## 命令行：真正能进脚本的部分

调用形式是 \`SumatraPDF [参数...] [文件...]\`。未被识别的参数一律当文件路径，所以参数和文件可以混着写。常用参数：

\`\`\`bash
# 打开并直接跳到第 12 页
SumatraPDF.exe -page 12 "D:\\docs\\report.pdf"

# 以对开模式、按适合宽度打开
SumatraPDF.exe -view facing -zoom "fit width" "D:\\docs\\report.pdf"

# 打开即搜索关键词
SumatraPDF.exe -search "结论" "D:\\docs\\report.pdf"

# 打印后立即退出，适合接计划任务
SumatraPDF.exe -print-to-default -print-settings "1-6,portrait,duplex,paper=A4,fit" "D:\\docs\\report.pdf"
\`\`\`

几个要点：

- \`-print-to-default\` 打印完**立即退出**，返回码可用来判断是否失败。
- \`-print-settings\` 的页码范围支持倒序与倒数（\`-3--1\` 表示最后三页），\`，\` 分隔每一项。
- \`-view\` 和 \`-zoom\` 的取值含空格时必须加双引号。
- \`-appdata <目录>\` 可以把配置文件和缩略图缓存挪到别处，绿色软件或多版本并存时很有用。
- \`-restrict\` 进入受限模式，禁掉一切需要写注册表和联网的功能，适合放到公用电脑上。

## 批量转换与提取

3.7 预览版起主程序也能当工具用，语法是 \`sumatrapdf-tool.exe <工具> <选项> <文件>\`，主程序侧对应 \`SumatraPDF.exe <工具>\`。可用的工具名包括 convert、extract、merge、pages、poster、trim、recolor、sign、grep 等。其中 \`merge\` 合并、\`pages\` 抽取指定页、\`extract\` 抽图或附文、\`grep\` 全文检索，都是搭自动化流水线时用得上的。`,
      resources: [
        {
          kind: "link",
          title: "Sumatra PDF 官网",
          url: "https://www.sumatrapdfreader.org/",
          note: "项目首页，介绍支持的格式与各平台版本。",
        },
        {
          kind: "html",
          title: "Sumatra PDF 官方使用手册",
          url: "https://www.sumatrapdfreader.org/manual",
          note: "逐条列出快捷键、命令行参数与自动化工具用法。",
        },
        {
          kind: "html",
          title: "Sumatra PDF 仓库说明",
          url: "https://github.com/sumatrapdfreader/sumatrapdf/blob/master/readme.md",
          note: "源码仓库 README，含构建依赖与目录结构说明。",
        },
      ],
    },
    alternatives: ["libreoffice"],
    icon: { letter: "S", color: "#C0392B" },
  },
  {
    license: "GPL-2.0-or-later",
    version: "3.12",
    slug: "pandoc",
    linksCheckedAt: "2026-10-03",
    name: "Pandoc",
    aliases: ["markdown 转换", "文档转换", "格式转换", "docx 转换", "命令行转换"],
    summary: "Markdown、Word、HTML、LaTeX 之间互转。",
    scenes: ["docs", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["文档转换", "Markdown", "命令行", "开源"],
    body:
      "Pandoc 是命令行文档转换工具，常被叫做文档转换界的瑞士军刀，能把 Markdown、Word、HTML、LaTeX、EPUB、reStructuredText 等几十种格式互相转换。它解决的是「同一份稿件要在不同格式之间来回切换，且希望这件事能脚本化重跑」的问题。\n它的核心是一套统一的文档模型：先把输入格式解析成抽象语法树，再渲染成目标格式，所以组合数量远多于逐个两两转换；用 Lua 过滤器可以在转换过程中改写内容，模板系统控制输出骨架，内置 citeproc 支持 CSL 引文与参考文献，还能输出 reveal.js 或 Beamer 幻灯片。最常用的就是一条命令：pandoc 输入.md -o 输出.docx，能直接塞进构建脚本或 CI。\n代价也要说：它是纯命令行，没有图形界面，参数得记；复杂排版不可能百分百保真，精细的表格、页眉页脚、套既有 Word 模板这类需求转换后仍需人工收拾；导出 PDF 还要另外装引擎，LaTeX 体积大，wkhtmltopdf 或 WeasyPrint 是轻量替代；默认模板处理中文要显式指定字体，否则容易出方块或回退字体。\n许可证为 GPL-2.0-or-later，源码在 github.com/jgm/pandoc，安装包从 pandoc.org 获取。它由 Haskell 编写，分发的是单个可执行文件，不需要装运行时；GPL 约束的是再分发，日常用它转自己的文档不受影响。",
    officialUrl: "https://pandoc.org/installing.html",
    links: {
      official: "https://pandoc.org/installing.html",
      github: "https://github.com/jgm/pandoc",
    },
    officialLabel: "pandoc.org",
    whoFor: "稿件要在 Markdown 和 Word / PDF 之间切换。",
    whoNot: "只在一个软件里写到底，从不导出其他格式。",
    installTips: [
      "按官网安装对应系统版本。",
      "转 PDF 通常还要一个引擎，例如 TeX 或 wkhtmltopdf。",
      "常用命令记一条即可：pandoc 输入.md -o 输出.docx",
    ],
    guide: {
      intro: "讲清 Pandoc 的输入输出模型、模板机制与引用处理：一条命令完成格式转换，以及那些容易踩的隐式规则。",
      markdown: `## 一条命令的骨架

Pandoc 的核心是「读入一种标记语言，写出另一种」。最简形式：

\`\`\`bash
pandoc notes.md -o notes.docx
pandoc notes.md -o notes.html
pandoc notes.md -o notes.pdf --pdf-engine=xelatex
\`\`\`

不写 \`-o\`（或 \`--output\`）时，结果直接打到标准输出，所以 \`pandoc notes.md | pbcopy\` 能直接把 HTML 塞进剪贴板。

显式指定格式用 \`-f\`（from，读入）和 \`-t\`（to，写出）：

\`\`\`bash
# docx 转回 markdown，保留标题层级
pandoc -f docx -t markdown --extract-media=./media notes.docx -o notes.md
\`\`\`

Pandoc 会**猜测**输入格式，但中文环境里 \`.txt\`、\`.md\` 的猜测经常出错，与其猜不如显式写。写 PDF 时 \`--pdf-engine\` 必填，否则 Pandoc 只产出中间的 \`.tex\`。

## 最容易忘的一条：\`-s\` 与模板

不写 \`-s\`（\`--standalone\`）时，Pandoc 只输出正文**片段**，没有 \`<head>\`、没有标题。生成完整 HTML 文档必须加上它：

\`\`\`bash
pandoc notes.md -s --toc --toc-depth=3 -o notes.html
\`\`\`

\`--standalone\` 会去套一个**默认模板**。想换模板就用 \`--template\`，模板里最重要的两个变量是 \`$body$\`（正文落点）和 \`$if(title)$ ... $endif$\` 这种条件块。LaTeX 输出的样式靠 \`--variable=mainfont\` 传进去：

\`\`\`bash
pandoc notes.md -o notes.pdf \\
  --pdf-engine=xelatex \\
  --variable mainfont="Noto Serif CJK SC" \\
  -V lang=zh-CN
\`\`\`

用 \`--print-default-template=latex\` 可以把当前默认模板完整打印出来改，这份模板就是所有 \`--template\` 定制的基础。

## 元数据：标题、作者、日期

优先用**元数据块**——写在文件最开头的 YAML 区域，位置错了会被当成普通段落：

\`\`\`yaml
---
title: 三月市场回顾
author: 研究组
date: 2026-03-31
lang: zh-CN
---
\`\`\`

命令行里也能临时覆盖，用 \`-M\`（\`--metadata\`）或 \`-V\`（\`--variable\`）。区别是：\`-M\` 接受任意值，值不是字符串时按 YAML 解析；\`-V\` 一律当字符串，不做类型推断。日期尤其要注意这一点，用 \`-M date=2026-03-31\` 才是日期，用 \`-V\` 可能被原样打印。

## 引用与参考文献

Pandoc 内置 citeproc，管 \`@key\` 语法和参考文献排版：

\`\`\`bash
pandoc paper.md -o paper.docx \\
  --citeproc \\
  --bibliography=refs.bib \\
  --csl=chicago-author-date.csl
\`\`\`

\`@key\` 会被替换成引用，文献表自动附在末尾。CSL 样式文件决定引文格式，风格名字要和 \`--csl\` 指向的文件对得上。缺 \`--citeproc\` 时，\`@key\` 会原样留在正文里——这是新手最常遇到的现象。

## 模板与过滤器的分工

想改的是外观（页眉、字体、版式），走 \`--template\`；想改的是内容（自动加目录标题、转换某种写法），走 \`--filter\`，或用 \`--lua-filter\` 跑一段 Lua 脚本。两者作用范围完全不同：过滤器看到的是 Pandoc 的 AST，不依赖输出格式，所以跨格式通用；模板只对最终格式负责。`,
      resources: [
        {
          kind: "link",
          title: "Pandoc 官网",
          url: "https://pandoc.org/",
          note: "项目首页，含各平台安装方式与格式支持矩阵。",
        },
        {
          kind: "html",
          title: "Pandoc 用户手册",
          url: "https://pandoc.org/MANUAL.html",
          note: "官方完整手册，选项、模板语法、过滤器 API 都在这里。",
        },
        {
          kind: "html",
          title: "Pandoc 仓库说明",
          url: "https://github.com/jgm/pandoc/blob/main/README.md",
          note: "源码仓库 README，含构建方式与版本要求。",
        },
      ],
    },
    alternatives: ["obsidian", "texstudio"],
    icon: { letter: "P", color: "#5B0888" },
  },
  {
    slug: "figma",
    linksCheckedAt: "2026-10-03",
    name: "Figma",
    aliases: ["界面设计", "ui", "原型", "Figma 设计", "UI 设计", "原型工具"],
    summary: "浏览器里做界面和原型，个人档免费，也有教育优惠。",
    scenes: ["design"],
    platforms: ["windows", "macos"],
    source: "discount",
    price: "个人档免费",
    officialUrl: "https://www.figma.com/downloads/",
    officialLabel: "figma.com",
    discountNote:
      "个人档可免费用。符合条件的教育邮箱可在官网申请教育计划，不要买来路不明的「共享账号」。",
    tags: ["界面设计", "原型", "协作设计", "UI"],
    body:
      "Figma 是运行在浏览器里的界面设计与原型工具，文件存在云端，多人可以同时编辑同一份稿子并在画板上留言。它解决的是「设计师和开发要对着同一份最新稿子说话」——分享链接即是最新版本，不用传来传去对版本号。\n价值集中在协作与交接：组件和变量可以复用，原型能直接点开演示，开发模式下能看尺寸、导出资源与代码片段。代价是它依赖联网和账号，离线场景基本不可用；免费的个人档有文件数与项目数限制，多人协作需要付费席位，教育用途另有优惠通道。\n官方提供 Windows 与 macOS 的桌面端安装包（本质上是本地套壳应用），Linux 用户直接用浏览器即可。",
    whoFor: "做界面稿、组件和可点击原型，需要和别人同时看同一文件。",
    whoNot: "只做印刷排版或像素级修图；或完全不想注册账号。可看 Penpot / Inkscape。",
    installTips: [
      "浏览器就能用；桌面端从 figma.com/downloads 安装。",
      "登录官方账号，不要用第三方「团队账号」。",
      "离线场景再考虑 Inkscape 或 Penpot 自建。",
    ],
    guide: {
      intro: "从画布操作讲到组件、自动布局与原型：怎么把 Figma 用成团队的设计源文件，而不只是画图工具。",
      markdown: `## 先分清四个概念

Figma 里最贵的错误是把所有东西都画成碎片再靠对齐硬凑。上手前先认清这几层：

| 概念 | 是什么 | 什么时候用 |
| --- | --- | --- |
| Frame | 一个有尺寸的容器 | 画板、组件、手机界面 |
| Section | 画板上的一组 Frame | 同一屏的多状态稿|
| Component | 做了主组件的 Frame | 按钮、卡片等重复元素 |
| Instance | 组件的实例 | 复用到不同位置的副本 |

Frame 和普通矩形最大的区别是：**Frame 有独立画布**，可以在里面锁定滚动、独立裁切。这是做多状态界面的基础。

## 画布操作

| 快捷键 | 作用 |
| --- | --- |
| \`V\` / \`A\` / \`F\` | 移动 / 画框 / 画 Frame |
| \`R\` / \`O\` / \`L\` / \`P\` | 矩形 / 椭圆 / 直线 / 钢笔 |
| \`T\` / \`I\` | 文本 / 吸管 |
| \`Ctrl + G\` / \`Ctrl + Shift + G\` | 编组 / 取消编组 |
| \`Ctrl + D\` | 原位复制（也可 \`Alt\` 拖拽） |
| \`Shift + D\` | 检查设计稿 |
| \`Ctrl + /\` | 添加评论 |
| \`Space\` + 拖动 / 滚轮 | 平移 / 缩放画布 |
| \`Shift + H\` / \`Shift + V\` | 加水平 / 垂直自动布局 |
| \`Ctrl + R\` | 设置圆角 |

属性栏右边的**布局**下拉决定子元素的排列方式：自由定位、水平、垂直、网格。选自动布局后可以调 \`Gap\`（间距）、\`Padding\`（内边距）、\`Primary axis align\`、\`Counter axis align\`。**能自动布局就别用绝对定位**——布局一变，约束再好也要逐个微调。

## Auto layout 与Constraints 的分工

两者常被搞混，但用途完全不同：

- **Auto layout** 管容器**内部**的子元素排列，父容器尺寸变了它自己会重排。
- **Constraints**（属性栏最下方那排 \`Left / Center / Right / Scale\`）管子元素在**父容器**里怎么跟随变化，父容器变了它按左右、上下或等比缩放贴边。

一套可维护的规则：选「哪个框会先改变尺寸」，让它的子元素用自动布局；其余层级的对齐关系用约束补齐。两者混用且父子都有约束，是布局「跳一下才对」的典型原因。

## 组件与变体

把一个 Frame 转成组件：选中 → 属性栏左上角 **Combine as variants**（一组变体）或 **Create component**（单个）。变体适合「同一个组件的多种状态或尺寸」，比如按钮的 default / hover / disabled，属性栏里用属性图标切换实例的属性。

改主组件，所有实例跟着变；只改一个实例，会自动 Detach 出一份独立副本。**Detach 是设计系统的裂缝**——detach 过的实例此后不再跟随主组件更新，交付前应当搜一遍有没有意外的 detach。

## 原型与交付

在顶部的 **Prototype** 标签里设置连线：从一个 Frame 拉一条线到另一个，选触发方式 \`On click\` / \`On hover\` / \`While pressing\`，动作多为 \`Navigate to\` / \`Open overlay\`。演示时点右上角 **Present**。

交付前的检查清单：

- 用 \`Ctrl + Alt + G\` 之类？没有这条命令，实际是点属性栏的 **Export** 选 Local file 导出 \`.fig\`，或 Publish 到团队项目。
- 设 \`File → Save local copy\` 保留一份本地可编辑副本，不依赖云端。
- 交付前跑一次 **Design check**（\`Shift + D\`）看有没有间距、字号不一致的硬伤。`,
      resources: [
        {
          kind: "link",
          title: "Figma 官网",
          url: "https://www.figma.com/",
          note: "产品首页，说明编辑器、FigJam 与 Dev Mode 的定位。",
        },
        {
          kind: "link",
          title: "Figma 帮助中心",
          url: "https://help.figma.com/hc/en-us",
          note: "官方文档，组件、约束、原型的完整说明都在这里。",
        },
      ],
    },
    alternatives: ["inkscape", "krita"],
    featured: true,
    icon: { letter: "F", color: "#F24E1E", simpleIcon: "figma" },
  },
  {
    slug: "inkscape",
    license: "GPL-2.0-or-later",
    linksCheckedAt: "2026-10-03",
    name: "Inkscape",
    aliases: ["svg", "矢量", "ai 替代", "illustrator 替代"],
    summary: "开源矢量绘图，做图标、海报和 SVG。",
    scenes: ["design"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["矢量绘图", "SVG", "图标", "开源"],
    body:
      "Inkscape 是开源矢量绘图工具，用来画图标、示意图、海报和插画，原生格式是 SVG。它解决的是「要一个放大不糊的图，或者要一个能被代码和印刷流程复用的图形」。\n工作在路径和节点上：贝塞尔曲线、布尔运算、渐变与网格、描边转路径都齐备，导出可以给 PNG、PDF、EPS，也能输出供激光切割和刻字机使用的路径。做界面稿时它能出资源，但没有组件复用和多人协作。\n代价是两条：一是复杂渐变和滤镜的渲染结果与浏览器、Illustrator 可能不一致，交付前要在目标环境里过一眼；二是文字排版能力有限，长文本海报不该在这里排。\n许可证为 GPL 系列——上游仓库用 REUSE 规范管理许可证，LICENSES 目录里同时包含 GPL-2.0-or-later 与 GPL-3.0-or-later，整体以官网声明为准。本次核验时 inkscape.org 对本机自动化请求返回 403（Cloudflare 拦截），具体版本未能在线确认，需要的话请自行打开官网核对。安装包从 inkscape.org 发布，Windows、macOS、Linux 都有。",
    // 上游在 gitlab.com（不是自托管的 gitlab.gnome.org），在 Git host 白名单内。
    officialUrl: "https://inkscape.org/release/",
    links: {
      official: "https://inkscape.org/release/",
      github: "https://gitlab.com/inkscape/inkscape",
    },
    officialLabel: "inkscape.org",
    whoFor: "要做图标、示意图、可缩放的印刷稿，不想订 Illustrator。",
    whoNot: "主要做界面组件协作，Figma 更合适；主要修照片，看 GIMP。",
    installTips: [
      "从 inkscape.org 下对应系统包。",
      "macOS 若打不开，看官网对系统版本的说明。",
      "默认保存 SVG，交稿前确认对方能否打开。",
    ],
    guide: {
      intro: "讲清 Inkscape 的节点模型、吸附系统与导出流程，重点解释「另存为」为什么必须选Inkscape SVG。",
      markdown: `## 一切都是对象 + 节点

Inkscape 的操作模型是两层：**对象**是外壳，**节点**是骨架。选中的矩形、路径、文本都是对象，用节点工具（N）才能碰到里面的控制点和线段。绝大多数「软件不会用」的问题，根源都是一直在对象层面操作，而问题其实出在节点上。

| 快捷键 | 作用 |
| --- | --- |
| \`S\` / \`N\` | 选择工具 / 节点工具 |
| \`F1\` / \`F2\` / \`F3\` | 缩放到选中 / 页面 / 全部绘图 |
| \`B\` / \`P\` / \`R\` / \`E\` | 钢笔与贝塞尔 / 铅笔 / 矩形 / 椭圆 |
| \`T\` / \`G\` | 文本 / 渐变与网格 |
| \`Ctrl + Z\` / \`Ctrl + Y\` | 撤销 / 重做 |
| \`Shift + Ctrl + C\` / \`V\` | 复制 / 粘贴（**不带样式**） |
| \`Ctrl + Shift + E\` | 导出 PNG 等位图 |

上面最后一行是最要紧的：Inkscape 有两套导出，**保存**（Ctrl+S，进 Inkscape SVG）和**导出位图**（Ctrl+Shift+E，进 PNG），两者不是一回事。

## 节点工具的四个必备操作

- **选中全部节点**：\`Ctrl + A\`。先把所有点选中再拖，才能整条路径跟着变形；只点一个点拖，拖出来的往往是单个控制点。
- **断开节点**：\`Alt\` + 点击节点。
- **对称编辑**：按住 \`Shift\` 拖动节点，相邻段的控制点镜像联动。
- **转直角 / 转平滑**：\`Shift\` + 点击路径段在直线与曲线间切换；\`Alt\` + 点击在平滑与不平滑间切换。

一个高频动作是 **Ctrl+B 打断点**——让一条平滑曲线出现弯折而不断开对象。找不到命令时，在命令搜索（\`/\`）里输入关键词比翻菜单快。

## 吸附：精度活命线

画精确图必开吸附。**对象 → 吸附** 里逐项开关：吸附线、吸附节点、吸附到路径、吸附到像素网格、吸附到页框，默认快捷键 \`Shift + Ctrl\` 切换全局吸附。吸附框（snap bar）把各类吸附点列成小按钮，用颜色区分：青色是线、红色是节点、灰色是页框——记住颜色比记按钮位置快。

坐标单位建议统一：文档属性（\`Ctrl + Shift + D\`）里把单位设成 **mm** 或 **px** 二选一。Inkscape 的 Y 轴默认向上，而大多数设计软件向下，导入外部素材时经常整体上下颠倒，在文档属性里翻转 Y 轴能省掉这类反复。

## 另存为与格式：最大的坑

**必须选「Inkscape SVG」（\`Inkscape.svg\`）作为保存格式，不能选「普通 SVG」。** 差别在于 Inkscape 会把 \`sodipodi:*\` 命名空间（版本号、作者）一并写进文件。后果是：纯 SVG 只保证别的软件能打开，Inkscape SVG 则保证 Inkscape 自己能完整恢复工作状态（其中保存了栅格化的位图数据，体积会明显变大）。用纯 SVG 保存会悄悄丢掉这部分，撤销历史和位图嵌入一并消失。

- **保存/另存为**：整个文档，保留可编辑状态，格式选 Inkscape SVG。
- **导出位图**：\`File → Export PNG\`，只输出图形，勾上「导出面积为页面」可以按画布尺寸出图。
- **另存的合理用法**：\`File → Save a Copy\` 存一份可交付的普通 SVG 或 PDF，原工程继续用 Inkscape SVG 维护。

## 布尔运算与路径操作

**路径（Path）** 菜单下有并集、差集、交集、对称差、分割等运算。注意：**布尔运算只处理对象轮廓，对没有填充的路径无效**。需要先给对象设填充色（哪怕是 \`none\` 之外的任意颜色），运算才有意义。

要拆开一个复合对象，\`Shift + Ctrl + C\` 复制并 \`Shift + Ctrl + V\` 粘贴到原位会去掉全部样式，再配合 \`Path → 拆解\`（\`Shift + Ctrl + K\`）逐个拆开即可。`,
      resources: [
        {
          kind: "html",
          title: "Inkscape 项目 README",
          url: "https://gitlab.com/inkscape/inkscape/-/blob/master/README.md",
          note: "官方仓库说明，介绍 SVG 特性与导入导出格式。",
        },
        {
          kind: "link",
          title: "Inkscape Wiki 入门页",
          url: "https://wiki.inkscape.org/wiki/About_Inkscape",
          note: "官方 wiki 入口，工具详解与常见问题都从这里进。",
        },
      ],
    },
    alternatives: ["figma", "krita", "gimp"],
    icon: { letter: "I", color: "#000000", simpleIcon: "inkscape" },
  },
  {
    license: "GPL-3.0",
    slug: "gimp",
    linksCheckedAt: "2026-10-03",
    name: "GIMP",
    aliases: ["修图", "photoshop 替代", "图像处理", "位图编辑"],
    summary: "开源位图编辑，裁切、合成、修照片。",
    scenes: ["design"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["图像编辑", "修图", "抠图", "开源"],
    body:
      "GIMP 是开源位图编辑器，裁切、抠图、合成、调色与批量处理都在里面完成。它解决的是「要改照片或做一张海报，但不想为偶尔用一次订阅一套商业图像软件」。\n能力集中在像素层面：图层与蒙版、路径抠图、色彩曲线与色阶、脚本批处理（Script-Fu 与 Python-Fu），插件能扩展滤镜和文件格式。PSD 可以导入，但智能对象、部分调整层和复杂图层效果会丢。\n代价要提前知道：界面是单文档多窗口模式，与主流图像软件的操作习惯差别很大，第一次上手会觉得别扭；它面向位图，做矢量图标该用 Inkscape，画画该用 Krita，硬拿它顶替只会两头别扭。\n许可证为 GPL-3.0（上游仓库 COPYING 文件明确为 GPL 第三版）。安装包与源码都从 gimp.org 发布，Windows、macOS、Linux 三平台同步更新——只从官网下，第三方打包常捆绑安装器。",
    officialUrl: "https://www.gimp.org/downloads/",
    officialLabel: "gimp.org",
    whoFor: "要修图、抠图、做海报而不订 Photoshop。",
    whoNot: "只做矢量图标，用 Inkscape；只做绘画，用 Krita 更顺。",
    installTips: [
      "从 gimp.org 下载，避免捆绑安装器。",
      "第一次启动语言可在界面偏好里改成中文。",
      "PSD 能打开一部分，复杂图层效果可能丢。",
    ],
    guide: {
      intro: "从图层模型讲到选区、蒙版与破坏性滤镜：把 GIMP 用成可回溯的非破坏性工作流。",
      markdown: `## 图层是唯一的地基

GIMP 的一切操作都作用在「当前图层」上。工具选项栏最下方的 \`Layer\` 一栏永远显示当前层，动手前先确认它没选错——这是 GIMP 里绝大多数「怎么改不动了」的来源。

| 快捷键 | 作用 |
| --- | --- |
| \`Ctrl + Shift + N\` | 新建图层 |
| \`Ctrl + Shift + D\` | **复制**图层 |
| \`Ctrl + Shift + C\` / \`V\` | 复制 / 粘贴为新选择 |
| \`M\` / \`Shift + Ctrl + N\` | 矩形选择 / 浮动选择转图层 |
| \`Ctrl + A\` / \`Ctrl + Shift + A\` | 全选 / 取消全选 |
| \`Ctrl + Shift + I\` | 反选 |
| \`B\` / \`E\` | 画笔 / 橡皮擦 |
| \`Q\` | 切换前景色与背景色 |
| \`Ctrl + Z\` / \`Ctrl + Y\` | 撤销 / 重做 |

##破坏性滤镜：先复制图层

GIMP 2.10 之后大部分滤镜仍是**破坏性**的：它们直接改像素数据，\`Ctrl + Z\` 只能一步步退回，且历史记录会被压缩。好用的滤镜（色彩平衡、锐化、模糊）大多如此。

规范做法是先复制图层再施加滤镜，这样破坏性与非破坏性（带 GEGL 操作符的图层）可以并存，随时对比：

\`\`\`text
# 典型流程：底图 + 调整层 + 蒙版
1. Ctrl+Shift+D 复制图层
2. 选中新图层，Filters → Distorts → 应用滤镜
3. 右键图层 → 添加图层蒙版（白色全显）
4. 在蒙版上用黑笔刷擦掉不需要滤镜的区域
\`\`\`

第 4 步是蒙版的核心用法：**白=保留，黑=隐藏，灰=半透明**。蒙版是非破坏性的，随时能改回来。

## 选区与通道

**通道（Channel）** 在概念上等同于蒙版，区别在于通道是灰度图、专门存「选区信息」，可以增删；蒙版专门控制图层显示。一个图层只能有一枚蒙版，但可以有多个通道。

从精确路径得到选区的标准流程：

\`\`\`text
1. 用 Paths 工具（工具箱里的路径图标）描出闭合路径
2. Paths → 选择该路径
3. 选择 → None 取消当前选区
4. 路径对话框点「转换为选区」按钮，路径变成蚂蚁线选区
   做完可以 Path → 删除该路径，不必保留
\`\`\`

用钢笔工具画的路径最准，但需要按住 Ctrl 吸附到已有点上闭合。这一套「路径 → 选区」是抠图和局部调色最可靠的方式，比手动涂抹精确得多。

## Script-Fu 批处理

**Filters → Script-Fu → Console** 是个能直接执行 Scheme 的窗口，适合做机械操作：

\`\`\`scheme
;; 给当前图层加 10px 高斯模糊
(gimp-drawable-filters-apply
  (car (gimp-image-get-active-drawable (car (gimp-image-list))))
  (car (gimp-blur-gauss-dialog 10 10 1))
)
\`\`\`

批处理走 **File → Export As**，把同目录图片批量转格式、加水印，加个循环就够。Python 用户则用 Filters → Python-Fu → Console，绑定更直观。

## 导出的两个概念

- **File → Save / Save As**：保存为 **XCF 工程文件**，保留图层、通道、路径。XCF 是 GIMP 自己的格式，别的软件打不开，务必把它当主文件。
- **File → Export As / Overwrite**：导出成 PNG、JPG、TIFF、WebP 等通用格式。**Export As** 会弹对话框可调参数，**Overwrite** 直接用上次参数覆盖，适合反复导出。

交付前顺手检查：图层有没有合并错、蒙版有没有遗留、文字层是否需要转成路径。`,
      resources: [
        {
          kind: "link",
          title: "GIMP 官网",
          url: "https://www.gimp.org/",
          note: "项目首页，介绍版本特性与各平台安装包。",
        },
        {
          kind: "link",
          title: "GIMP 官方文档库",
          url: "https://www.gimp.org/docs/",
          note: "官方文档汇总入口，教程、参考手册与插件说明都在这里。",
        },
      ],
    },
    alternatives: ["krita", "inkscape"],
    icon: { letter: "G", color: "#5C5543", simpleIcon: "gimp" },
  },
  {
    slug: "blender",
    license: "GPL-2.0-or-later",
    linksCheckedAt: "2026-10-03",
    name: "Blender",
    aliases: ["三维", "3d", "建模", "Blender 3D", "三维建模", "建模软件"],
    summary: "开源三维：建模、动画、渲染、视频剪辑都能做。",
    scenes: ["design", "engineering"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://www.blender.org/download/",
    officialLabel: "blender.org",
    tags: ["三维建模", "动画", "渲染", "开源"],
    body:
      "Blender 是开源三维创作套件，建模、雕刻、动画、渲染、合成与视频剪辑都在同一个软件里完成。它解决的是「想做三维但不想先付一套商业套件的订阅费」——个人和小团队可以零成本用上完整管线。\n功能覆盖面是它最大的特点：内置 Cycles 与 EEVEE 两个渲染器，几何节点可以做程序化建模， grease pencil 能做二维动画，Python 脚本可以把重复流程批处理化。代价是学习曲线陡：界面逻辑与 Maya / 3ds Max 差异很大，快捷键体系要重新练，插件和工程文件在跨大版本时偶尔不兼容。\n项目由 Blender 基金会维护，采用 GPL 许可，安装包与源码都从 blender.org 发布，Windows、macOS、Linux 三平台同步更新，每隔几个月一个大版本。",
    whoFor: "要建模、渲染或做短动画，机器显卡还过得去。",
    whoNot: "只画 2D，或电脑核显很弱只想做简单示意图。",
    installTips: [
      "从 blender.org 下稳定版，不必先追每日构建。",
      "第一次建议跟着官方或 Blender 基金会教程过一遍导航。",
      "工程文件 .blend 自己备份，自动保存可在偏好里打开。",
    ],
    guide: {
      intro: "从选择模式与活动集合讲起，串起建模、材质、渲染与命令行批渲染：Blender 里最影响效率的两个概念。",
      markdown: `## 选择模式与活动集合：效率的两个命门

Blender 新手最常见的困惑是「明明选中了却操作不了」。根源是**模式（Mode）**和**活动集合（Active Collection）**。

模式决定当前工具的语义。默认在物体模式，按 \`Tab\` 进编辑模式。在编辑模式下还有一层**元素选择模式**，用三键切换：

| 快捷键 | 作用 |
| --- | --- |
| \`Tab\` | 物体模式 ↔ 编辑模式 |
| \`1\` / \`2\` / \`3\` | 顶点 / 边 / 面 模式 |
| \`Ctrl + Tab\` | 在同层级的选择模式间循环 |
| \`A\` / \`Alt + A\` | 全选 / 取消全选 |
| \`Shift + G\` | 取消选中 |
| \`G\` / \`R\` / \`S\` | 移动 / 旋转 / 缩放 |
| \`E\` | 挤出边或面 |
| \`Ctrl + R\` | 环挤出（Loop Cut） |
| \`I\` | 插入（连接边） |
| \`Ctrl + B\` | 倒角|
| \`Shift + S\` | 缩放轴心菜单 |
| \`Space\` + 拖动 | 平移视图 |
| \`Z\` → 滚轮 | 缩放视图；\`Z\` 后 \`M\` 可调视图角度 |

活动集合决定**哪些对象能被选中**。大纲视图（Outliner）顶部那排漏斗图标就是过滤器，被关掉的集合里的对象**不显示、也不可选中**。改层级结构后突然选不到对象，先检查这里。要临时改变操作范围，最直接的办法是用大纲视图的眼睛图标临时显示别的集合。

**可编辑性**还有一个层级：大纲视图里的灯泡图标（物体模式开关）和小箭头（编辑模式开关）控制单个对象的可见与可选。善用 \`Shift + 选中\` 多选后可以批量切换。

## 建模工作流

常用拓扑操作：

- **挤出** \`E\`：挤出后按 \`X\` 限定轴向，按 \`S\` 再收缩。挤出多边形用 \`Shift + S\`。
- **环挤出** \`Ctrl + R\`：先 \`R\` 定圈数再 \`左键\` 定位。鼠标悬停在面上时该圈高亮，圈数确认前随时按右键取消。
- **桥接** \`Ctrl + E\`：连接两段类似拓扑的边。做不到通常是因为两侧边数不同。
- **加环（Inset）** \`I\`：往内插一圈，是做边框、分离面与平面的关键。
- **吸附** \`G\` \`Tab\`： \`Tab\` 切换吸附元素（顶点/边/面/体素/吸附目标），比手动敲坐标精确得多。

布尔类操作要留意：布尔修改器是**非破坏性**的，在大纲视图右边的修改器面板里可以调顺序、关掉、甚至删除返回。直接用 \`Ctrl + B\` 的布尔（快捷键菜单）则会真的改网格。

## 渲染与命令行

引擎在右上角下拉切换：EEVEE（实时预览）、Cycles（路径追踪）、Workbench（实体着色）。首次配置选 Cycles 时先看采样数，采样 32 够预览、成品一般 128 以上并开去噪。

**批渲染是最值得学会的自动化**。写个脚本让命令行走一遍即可：

\`\`\`bash
# 渲染单帧
blender -b scene.blend -o "//render_####" -F PNG -f 1

# 用 Python 脚本生成场景再渲染，-f 传帧号
blender -b -P setup.py -o "//out_####" -F PNG -f 1-24

# 只渲动画序列，跳过加载界面（-t 线程数，-E 指定引擎）
blender -b scene.blend -t 8 -E CYCLES -a
\`\`\`

Windows 上如果 \`blender\` 不在 PATH，务必用**全路径加引号**（\`"C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe"\`），这是脚本「找不到命令」的最常见原因。输出路径里的 \`#\` 是帧号占位符，\`//\` 表示相对于 \`.blend\` 文件的目录。

## 场景组织与保存

- **Outliner** 负责层级，集合（Collection）既是分组也是选择范围，两者共用一套机制。
- **File → Save** 存 \`.blend\`；**File → Export → glTF 2.0 / FBX** 导出给引擎。需要打包（**File → External Data → Pack Resources**）才是自包含文件。`,
      resources: [
        {
          kind: "link",
          title: "Blender 官网",
          url: "https://www.blender.org/",
          note: "项目首页，介绍版本特性、下载与各平台构建。",
        },
        {
          kind: "link",
          title: "Blender 支持中心",
          url: "https://www.blender.org/support/",
          note: "官方支持入口，教程、常见问题与社区资源汇总。",
        },
      ],
    },
    alternatives: ["freecad", "krita"],
    featured: true,
    icon: { letter: "B", color: "#E87D0D", simpleIcon: "blender" },
  },
  {
    license: "GPL-3.0",
    version: "5.3.4",
    slug: "krita",
    linksCheckedAt: "2026-10-03",
    name: "Krita",
    aliases: ["绘画", "板绘", "插画", "数位板绘画"],
    summary: "开源绘画软件，笔刷和分层适合插画、分镜。",
    scenes: ["design"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["绘画", "插画", "数位板", "开源"],
    body:
      "Krita 是开源绘画软件，面向数位板创作：笔刷引擎、图层、蒙版、色彩管理都按画画的习惯设计。它解决的是「要画插画、概念图或分镜，而不是修照片」。\n笔刷是它的强项：内置像素、形变、滤镜、纹理等多种引擎，可调参数很多，配合压感数位板能画出接近传统媒介的笔触；另有矢量图层、参考图工具、逐帧动画时间轴和 Python 脚本扩展。色彩管理支持 CMYK，能直接用于印刷稿。\n代价要提前知道：它不做照片精修（那是 GIMP 的活），也不做矢量 logo（那是 Inkscape 的活）；大画布叠高分辨率笔刷很吃内存，画布尺寸要按输出用途提前定好，别铺开了再改。\n许可证为 GPL-3.0。安装包从 krita.org 发布，Windows、macOS、Linux 都有；有数位板的话先在系统里装好压感驱动再画。",
    // 旧地址 https://krita.org/download/ 已 404，现下载页在 /en/download/。
    officialUrl: "https://krita.org/en/download/",
    links: {
      official: "https://krita.org/en/download/",
      github: "https://github.com/KDE/krita",
    },
    officialLabel: "krita.org",
    whoFor: "用数位板画画、做概念图或逐帧。",
    whoNot: "主要做矢量 logo 或照片精修。",
    installTips: [
      "从 krita.org 下载。",
      "有数位板先在系统里把压感驱动装好。",
      "画布分辨率按输出用途设，不要默默用过大画布卡死。",
    ],
    guide: {
      intro: "讲清 Krita 的图层栈、画笔引擎与稳定性抖动控制，以及动画与矢量图层这两条进阶路线。",
      markdown: `## 三种图层要用对

Krita 的图层栈比同类软件更复杂，因为它同时支持**绘画图层**、**矢量图层**和**组图层**：

- **绘画图层**：只存像素，是实际作画的地方。支持透明、锁定透明像素、Alpha 锁定。
- **矢量图层**：存路径和描边，矢量工具的产物。缩放不糊，适合做线稿。
- **组图层**：纯粹的整理手段，可嵌套，不影响绘制。

| 图层操作 | 快捷键 |
| --- | --- |
| 新建绘画图层 | \`Ctrl + N\` |
| 新建组 | \`Ctrl + G\` |
| 下移 / 上移图层 | \`Ctrl + [\` / \`Ctrl + ]\` |
| 复制图层 | \`Ctrl + Shift + D\` |
| 合并可见图层 | \`Ctrl + E\` |
| 锚定浮层 | \`Ctrl + H\` |

「锁定透明像素」和「Alpha 锁定」是 Krita 的特色：前者禁止在空白处落笔（适合上第二层色，不会在底下留噪点），后者锁定已有像素的 alpha 只改颜色。做数字上色时这两个功能能省掉大量清理工作。

## 画笔引擎

选中画笔后在画笔编辑条（底部）上直接拖可以改**大小和硬度**，按住 \`Shift\` 拖则是改**流量或不透明度**。这是 Krita 少有的「不用打开面板就能调」的设计。

笔刷预设存放在画笔预设面板，右键 → **Import resources** 可导入第三方笔刷包（.bundle）。图层的「绘画锁定」（铅笔图标）能防止在该层上误用某些笔刷。

**稳定性（Stabilizer）** 是 Krita 手感的关键。工具选项里的 Stabilizer 分两档：Stabilizer 管笔迹的抖动抑制，Predictive 接管后连规划线段都会自动补，精度更高但有延迟。写长曲线时开 Stabilizer，勾轮廓时开 Predictive。

## 选区与变换

选区工具有矩形、椭圆、多边形、套索、**轮廓**和**魔棒**（相邻选区）。绘制时按住 \`Shift\` 是加选、按住 \`Alt\` 是减选。

- \`Ctrl + Shift + I\` 反选
- 选区转成路径：选区菜单 → **Convert to Path**；路径转回选区：**Select Path Tool**（工具栏里那把钳子图标）点路径
- 有选区时按 \`Ctrl + C\` \`Ctrl + Shift + V\` 是「粘贴到新图层并置于选区」
- **Select Mask Tool**（漏斗图标）可以在选区和蒙版之间快速切换显示与编辑目标

## 视图与辅助

| 快捷键 | 作用 |
| --- | --- |
| 中键拖动 / 滚轮 | 平移 / 缩放画布 |
| \`Tab\` | 切换显示/隐藏所有面板，全屏作画 |
| \`Shift + 逗号\` | 切到下一工作区 |
| \`E\` | 调色板（前后景色切换） |
| \`X\` | 交换前景/背景色 |
| \`Ctrl + 滚轮\` | 画笔工具下调整画笔大小 |
| \`1\` \`…\` \`9\` \`0\` | 前景色不透明度调到 10%…100% |

**参考图**用 **助手图层（Assistant Layers）**：右键图层 → Add Assistant Layer → 图像，即可在绘画时参考色稿，它会跟随画布缩放但不会被导出。**对称与网格**同在右键菜单里：画对称的线稿很实用。

## 动画与矢量

动画在独立工作区完成：右键工作区 → 动画。流程是：新建动画工作区 → 在时间线上 **Add Frame** 首帧 → 逐帧作画（每帧一个绘画图层）→ 设置每帧时长（通常 100ms，即 10fps 手绘感）→ 预览 → **File → Export → Animated** 导出 GIF、WebP 或帧序列。

矢量路线：视图 → **路径工具**可以精细调整贝塞尔节点。矢量图层的**描边属性**（缩放半径、连接样式）藏在属性面板里，描边不随缩放变形，这是它相对绘画图层的核心优势。

导出时注意区分：**File → Save** 存 \`.krita\` 工程（保留图层、动画、矢量），**File → Export** 才出 PNG/JPEG/WebP。中文项目名和路径在某些平台上可能出问题，出图时用英文名最保险。`,
      resources: [
        {
          kind: "link",
          title: "Krita 官网",
          url: "https://krita.org/",
          note: "项目首页，介绍版本特性、下载与捐赠渠道。",
        },
        {
          kind: "html",
          title: "Krita 官方用户手册",
          url: "https://docs.krita.org/user_manual.html",
          note: "官方手册总入口，画笔、图层、动画、矢量都有系统章节。",
        },
        {
          kind: "html",
          title: "Krita 仓库说明",
          url: "https://github.com/KDE/krita/blob/master/README.md",
          note: "源码仓库 README，说明编译依赖与 KDE 镜像关系。",
        },
      ],
    },
    alternatives: ["gimp", "inkscape"],
    icon: { letter: "K", color: "#3E8AF0", simpleIcon: "krita" },
  },
  {
    slug: "jasp",
    license: "AGPL-3.0",
    linksCheckedAt: "2026-10-12",
    name: "JASP",
    aliases: ["统计", "spss 替代", "假设检验"],
    summary: "点选做常见统计，界面接近教材，开源免费。",
    scenes: ["data"],
    platforms: ["windows", "macos", "linux"],
    body: "JASP 是免费开源的统计分析软件，形态像一张 Excel 表加一排菜单：把数据粘进去，点选「独立样本 t 检验」，结果表、图、效应量和该做的解释一起出来。\n它和 SPSS、R、Python 的根本差别在于把统计默认值替你选好了。同一份数据，系统按学界惯例默认用哪种检验、是否假设方差齐性、效应量报哪个，这种判断对初学者是纯负担。菜单里能改，改完自动重算，所以它既是「点两下出结果」的工具，也是「想清楚自己为什么这么算」的课堂演示工具。\n它的可视化与文字输出是它的第二个强项：直接生成 APA 格式的表格与可发布质感的图，写作时不用再回Excel 拼表格。Bayes 因子、贝叶斯区间估计这些在 R 里要手写的东西它有现成菜单，教学场景里很省事。\n代价是它的数据量有上限。JASP 是桌面应用，几万行以内体验正常，上十万行会明显变慢，这时候该换 R 或 Python。而且它的分析项目是封闭的，自定义统计量、复杂混合模型、贝叶斯建模的灵活性都远不如 R 与 Python——它是把常见分析做到极顺手，不是通用统计引擎。学习曲线也不是零：它把假设检验的前提条件直接做成选项，不解释为什么，看到「Welch's t-test」和「Student's t-test」两个选项时仍需要知道差别。\n许可证是 AGPL-3.0，Windows、macOS、Linux 都有安装包，官网 https://jasp-stats.org/download/ 提供下载（该站对自动化请求返回 403，浏览器打开正常）。它基于 R 内核构建，所以需要系统里有 R 环境。",
    tags: ["统计","假设检验","可视化","教学","开源"],
    source: "opensource",
    officialUrl: "https://jasp-stats.org/download/",
    links: {
      official: "https://jasp-stats.org/download/",
      github: "https://github.com/jasp-stats/jasp-desktop",
    },
    officialLabel: "jasp-stats.org",
    whoFor: "要做 t 检验、方差、回归等常见分析，不想先写代码。",
    whoNot: "已经在用 Python / R 做流水线，或要做生产级 BI 看板。",
    installTips: [
      "从 jasp-stats.org 下载对应系统。",
      "数据用 CSV 或表格导出再导入最省事。",
      "结果可以复制为 APA 风格表格，按课程要求再改。",
    ],
    guide: {
      intro: "从把宽表整成长格式开始，到用 R 语法模式复现分析、导出 APA 表格，把 JASP 从「点点看」变成可交付的统计流程。",
      markdown: `## 第一步不是分析，是把数据摆对

JASP 是按「每行一个观测、每列一个变量」来设计的。教程里常见的「宽格式」（每个条件一列）在 JASP 里几乎所有分析都用不了，必须先转成长格式（tidy format）：一列是分组变量，一列是被测量的数值。

| 你手上的表 | JASP 能直接用吗 | 要做什么 |
| --- | --- | --- |
| 宽格式：\`A组\` \`B组\` \`C组\` 三列分数 | 不行 | 用「数据 > 逆向重构」或外部脚本转成长格式 |
| 长格式：\`group\` + \`score\` 两列 | 可以 | 无需处理 |
| 已经是 R data.frame | 可以 | 直接用 R 语法模式，无需再导入 |

逆向重构在 JASP 里位于数据编辑器工具栏的「宽转长」图标，选中要堆叠的列、填入分组标签即可。转换后务必检查：**分组变量的标签**是否正确（\`group\` 列里是 \`1/2/3\` 还是 \`A/B/C\`，取决于填的标签文本），以及**样本量**是否与原始一致 —— 堆叠时少了几行不会有任何报错提示。

## 频数派与贝叶斯派是两条并行的路

JASP 的招牌是同一个分析同时给出两套结论。以独立样本 t 检验为例，菜单里是「Independent Samples T-Test」和「Bayesian Independent Samples T-Test」两个独立入口，选错不会报错，只会拿到你并不想要的那一套。

- **频数派**：p 值、置信区间、Cohen's d
- **贝叶斯派**：贝叶斯因子 BF、后验分布、区间估计

两者的结论方向可能相反。BF 的解读看量级：1/10 到 1/3 之间是「支持无效应」的弱证据，3 到 10 之间是弱支持，超过 100 才算强证据。**别把 BF 当 p 值那样只看是否小于 0.05**。

## 先验设定是最容易被忽略的一步

贝叶斯结论完全取决于先验。JASP 默认用弱信息先验（r = 0.707、df = 3 一类的形式），多数场景够用，但正式分析应显式打开「Prior scale」按研究设计设定：设计偏保守、样本量小时把 r 设小（如 0.3），先验更宽松，BF 不会虚高。回归与结构方程模块里的先验面板藏在折叠的高级选项里，容易漏。

**不要在看完结果之后再调先验**，那是 p-hacking 的贝叶斯版本。

## 用 R 语法模式换取可复现性

JASP 内置的 R 语法模式是它最有价值的功能，也是最被低估的。点击分析面板右上角的代码图标，就能看到该分析的等价 R 调用；反过来，手写 R 代码按 \`Ctrl + Enter\` 也能直接在 JASP 里出图。

\`\`\`r
# 语法模式下 JASP 生成的真实调用形如
data <- read.csv("data.csv")
jaspResults <- jaspTools::runAnalysis(
  "IndependentSamplesTTest",
  list(data = data, variables = "score", group = "group")
)
\`\`\`

这条路径的价值在**批量分析**：几十个因变量逐个点面板极易漏项，脚本则可以循环：

\`\`\`r
for (v in c("score", "mood", "sleep")) {
  print(jaspTools::runAnalysis(
    "IndependentSamplesTTest",
    list(data = data, variables = v, group = "group")
  ))
}
\`\`\`

导出时勾选「包含语法」，文件末尾就带上完整代码，别人可以逐行复现。这是把「点出来的结果」变成「可审计的结果」最快的方式。

## 导出与交付的坑

- **导出 APA 表格**：结果面板右上角有 APA 格式开关，表格和图注按 APA 第 7 版排版
- **图片导出**：导出 PNG 时把缩放拉到 200% 以上，否则投稿时字会糊
- **数据与结果分离**：\`.jasp\` 格式存的是分析状态而非原始数据，回调时仍要保留原始 CSV
- **版本记录**：JASP 更新会改变默认先验与输出格式，投稿前注明所用的版本号`,
      resources: [
        {
          kind: "link",
          title: "JASP 官网首页",
          url: "https://jasp-stats.org/",
          note: "项目主页，含版本公告与模块列表，确认新版本改动了哪些分析。",
        },
        {
          kind: "html",
          title: "How to Use JASP 官方教程入口",
          url: "https://jasp-stats.org/how-to-use-jasp/",
          note: "官方整理的上手与分模块教程入口，比站内旧教程更贴近当前版本。",
        },
      ],
    },
    alternatives: ["rstudio", "python"],
    featured: true,
    icon: { letter: "J", color: "#28A5DC" },
  },
  {
    slug: "rstudio",
    license: "AGPL-3.0",
    linksCheckedAt: "2026-10-12",
    name: "RStudio",
    nameZh: "Posit Desktop",
    aliases: ["r 语言", "rstudio", "posit"],
    summary: "写 R 的桌面环境，统计课和可重复分析常用。",
    scenes: ["data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://posit.co/download/rstudio-desktop/",
    links: {
      official: "https://posit.co/download/rstudio-desktop/",
      github: "https://github.com/rstudio/rstudio",
    },
    officialLabel: "posit.co",
    whoFor: "课程或论文用 R，需要脚本、图表和包管理在一个窗口。",
    whoNot: "完全不想写代码，只想点选，先看 JASP。",
    installTips: ["先装 R（cran.r-project.org），再装 RStudio Desktop，顺序不能反。", "两个都要从官方渠道下，发行版仓库里的版本常偏旧。", "国内如 CRAN 慢，可在 R 里换镜像源。", "每个课题建一个 Project，工作目录与环境变量会跟着项目走。"],
    guide: {
      intro: "用 Project 管项目、renv 锁依赖、Quarto 出报告，串起 RStudio 从「能跑脚本」到「可复现协作」的完整链路。",
      markdown: `## 一切从 Project 开始，而不是从脚本开始

新手最常见的错误是在默认工作目录里写脚本，然后把数据丢在桌面。结果换台电脑就找不到文件。RStudio 的解法是 Project：一个 \`.Rproj\` 文件加一个文件夹，把工作目录自动切到该文件夹。

\`\`\`
my-analysis/
  my-analysis.Rproj
  data/        # 原始数据，只读
  scripts/     # 脚本
  output/      # 生成的结果
  renv/        # 依赖锁文件
\`\`\`

关键是**原始数据与产出分离**：\`data/\` 只放原封不动的原始文件，清洗结果写到别处。这样数据被污染时能立刻回退。「Session > Set Working Directory > To Source File Location」能临时解决路径问题，但依赖打开方式，不适合长期方案。**项目内一律用相对路径**，配合 here 包更稳：

\`\`\`r
library(here)
dat <- read.csv(here("data", "survey.csv"))
\`\`\`

## renv：让依赖跟着项目走

R 的包生态繁荣，但版本冲突是日常痛点 —— 同事跑得通的脚本在你机器上报错，八成是包版本不同。\`renv\` 为每个项目建立独立的包库：

\`\`\`r
install.packages("renv")
renv::init()             # 首次初始化，扫描现有依赖
renv::install("dplyr")   # 装包并记录到项目库
renv::snapshot()         # 依赖变更后重新拍快照
renv::restore()          # 在新机器上还原
\`\`\`

协作时把 \`renv.lock\` 提交进 Git，队友 clone 后执行 \`renv::restore()\` 即可。**不要提交 \`renv/library\`**，那个目录体积巨大且平台相关。

项目涉及 Python 包时，\`reticulate\` 可以在同一个 Project 里管双语言依赖，但它依赖本机已装好的 Python 发行版，遇到 \`libpython\` 报错多半是这一步没配对。

## Quarto 取代 R Markdown

新版 RStudio 内置了 Quarto（File > New File > Quarto Document）。相比 R Markdown 有两点优势：输出格式更多（HTML、PDF、DOCX、Reveal.js），且执行引擎独立于 RStudio，能在命令行用 \`quarto render\` 跑，适合放进 CI。

图表在 R 里生成后存文件，再由报告以相对路径引用：

\`\`\`r
library(ggplot2)
p <- ggplot(dat, aes(group, score)) + geom_boxplot()
ggsave("output/boxplot.png", p, width = 6, height = 4, dpi = 300)
\`\`\`

\`dpi: 300\` 这一步别省，低分辨率图在印刷或投影时会明显发虚。

## 排查问题的顺序

遇到行为异常，按这个顺序排除，比直接搜 Stack Overflow 有效：

1. **Session > Restart R and Clear Output**：清掉残留变量，\`x\` 这类名字被反复赋值是常见污染源
2. **Environment 面板**：看变量究竟存成了什么，因子 \`c("a","b")\` 与字符 \`"a"\` 后续行为差异很大
3. **用 \`?lm\` 查函数**：直接打开帮助页，比搜索引擎准
4. **看 Warnings 栏**：R 遇问题会降级处理并给出 warning，不看 warning 常常是错误结果的根源`,
      resources: [
        {
          kind: "link",
          title: "Posit 官网首页",
          url: "https://posit.co/",
          note: "RStudio 的官方产品页，含商业版与开源版的功能差异对比。",
        },
        {
          kind: "html",
          title: "Posit 官方 IDE 用户文档",
          url: "https://docs.posit.co/ide/user/",
          note: "RStudio 各功能面板的权威文档，Project、renv、调试都有专门章节。",
        },
      ],
    },
    alternatives: ["jasp", "jupyter"],
    icon: { letter: "R", color: "#75AADB", simpleIcon: "rstudio" },
    tags: ["R 语言", "统计", "IDE", "开源"],
    body: "RStudio Desktop 是写 R 的集成环境，现在由 Posit 维护，名称也已从 RStudio 改为 Posit Desktop（开源版仍常被叫作 RStudio）。它把四件事放进一个窗口：脚本编辑器、控制台、环境变量与历史、文件与绘图面板。对用 R 做统计或数据分析的人，这四件事本来分散在终端、编辑器、文件管理器之间，合到一起之后「改一行、跑一下、看图、再改」的循环明显变短。\n它的价值主要在工程化而不是语言本身。项目（Project）机制把工作目录、打开的文件、环境变量绑在一起，切换课题不用重新设路径；R Markdown 与后来的 Quarto 让代码、结果、文字排在同一份文档里，论文与报告可以直接从分析过程生成；包管理、调试器、Git 面板也都是为「把分析做成可复现的东西」服务的。想少写代码只看结果，JASP 更合适；要在浏览器里跑，Jupyter 更合适。\n安装顺序有个坑：必须先装 R 本身（cran.r-project.org），再装 RStudio，反了打不开。两个都要从官方渠道下，发行版仓库里的 rstudio 有时版本偏旧。国内访问 CRAN 慢，可以在 R 里 options(repos=...) 换清华或中科大的镜像，装包时注意有些包需要编译工具链。\n许可证是 AGPL-3.0。仓库 COPYING 写得很直接：除非你与 Posit 签了商业许可，RStudio 按 AGPLv3 授权给你。也就是说 Posit 同时提供商业版，网络服务场景用开源版要留意 AGPL 的 copyleft 要求。源码在 GitHub 的 rstudio/rstudio，星标约 5,084。Windows、macOS、Linux 都有构建。",
  },
  {
    license: "GPL-3.0",
    slug: "octave",
    linksCheckedAt: "2026-10-12",
    name: "GNU Octave",
    aliases: ["matlab 替代", "矩阵", "数值计算"],
    summary: "开源数值计算，语法接近 MATLAB，适合作业和原型。",
    scenes: ["data", "engineering", "code"],
    platforms: ["windows", "macos", "linux"],
    body: "GNU Octave 是和 MATLAB 语法基本兼容的开源数值计算语言。它的定位很清楚：让你在有 MATLAB 许可的机器上也能跑那些矩阵、拟合、绘图的代码。\n它和 MATLAB 的兼容程度比想象的深：绝大多数 .m 文件可以直接跑，矩阵运算与数学函数的写法一致，绝大多数绘图函数同名同参。差别集中在几处：Octave 没有 MATLAB 的工具箱（工具箱对应的东西叫 Octave Forge，是社区另写的包，质量与覆盖度都不能比）；脚本语言层的差别会导致「本该是矩阵乘的地方我写了 * 」这类语义不一致，Octave 里 `a * b` 与 MATLAB 一样是矩阵乘但对向量维度的报错更早；还有就是 `end` 关键字、匿名函数、子函数这些语法细节有差异。真要跨平台共用同一份代码，Octave 官方有一份详尽的「与 MATLAB 的差异」清单可以对照。\n它的短板也要说清。图形后端是 gnuplot 或 fltk，出的图能看但没有 MATLAB 那么精细的渲染质量与交互；并行计算、性能优化工具链、IDE 集成都弱一代；社区规模比 MATLAB 小得多，遇到冷门问题搜不到答案。数据处理生态上它也基本被 Python 的 NumPy / SciPy / pandas 取代了——如果从零开始选工具而不是维护 MATLAB 存量代码，Python 那条路通常更宽。\n它真正的使用场景因此主要是两个：跑课程或文献里给定的 MATLAB 代码，以及在不允许 MATLAB 许可的环境里顶替它。许可证是 GPL-3.0，Windows、macOS、Linux 都有官方安装包，官网 https://octave.org/download 提供下载，Windows 版也可以配合 MinGW 与图形环境装。",
    tags: ["数值计算","矩阵运算","MATLAB 替代","绘图","免费"],
    source: "opensource",
    officialUrl: "https://octave.org/download",
    links: {
      official: "https://octave.org/download",
      github: "https://github.com/gnu-octave/octave",
    },
    officialLabel: "octave.org",
    whoFor: "要跑矩阵、绘图、数值作业，没有 MATLAB 许可。",
    whoNot: "必须使用某个 MATLAB 独家工具箱，或只要电子表格。",
    installTips: [
      "从 octave.org 装官方构建。",
      "很多 .m 脚本能直接跑，工具箱差异要逐个试。",
      "图形界面第一次启动可能慢，等包加载完。",
    ],
    guide: {
      intro: "讲清 Octave 与 MATLAB 的关键语法差异、pkg 包管理、脚本函数化与向量化写法，让从 MATLAB 迁移的代码能真正跑起来。",
      markdown: `## 与 MATLAB 的差异集中在语法细节

Octave 的目标是与 MATLAB 兼容，绝大多数基础函数能直接跑，但语法细节差异足以让脚本静默出错。

| 事项 | MATLAB | Octave |
| --- | --- | --- |
| 注释符 | \`%\` | \`%\` 或 \`#\` |
| 不等于 | \`~=\` | \`~=\` 或 \`!=\` 都行 |
| 块结束 | 必须 \`end\` | 可省略，\`end\` 也接受 |
| 字符串 | \`'\` 是字符，\`"\` 是字符串 | \`'\` 与 \`"\` 等价 |
| 清屏 | \`clc\` | \`clc\` 一样用 |
| 函数定义文件 | 必须单独成文件 | 可在脚本中直接定义 |

最危险的是**字符串**：MATLAB 里 \`'\` 是字符向量，Octave 里两者都是字符串。这会导致 \`sprintf('%c', 65)\` 在两边行为不同。

另一个坑是**隐式扩展**：Octave 从 4.4 起支持 \`A.^B\` 形式的隐式扩展，但 \`A + B\` 这种标量扩展仍要自己写 \`A + scalar\`，不能指望自动广播。MATLAB 里写惯的隐式扩展在 Octave 中可能给出维度错误或**静默的错误结果**，这是最常见的迁移问题。

## 布尔真值：不要用 if 数组

\`if\` 的条件必须是标量布尔值，不能直接传数组。正确写法是用 \`any\` / \`all\`：

\`\`\`octave
% 错误：条件是数组
% if A > 0

% 正确
if any(A(:) > 0)
  disp("有正数");
end

if all(A > 0)
  disp("全部为正");
end
\`\`\`

## pkg 包管理：先加载后使用

社区包称 Octave Forge，必须先安装再 load，命令是 \`pkg\`：

\`\`\`octave
pkg list                 % 查看已安装的包
pkg install -forge io    % 安装包（需要联网）
pkg load io              % 加载后才能调用其函数
\`\`\`

**最容易忘的是 \`pkg load\`**：装完包直接调用函数会报 undefined。新建会话后要重新 load，可以写进脚本开头，或用 \`~/.octaverc\` 放全局配置。常用统计包：\`statistics\`（描述统计、分布拟合）、\`io\`（读写 CSV/Excel）。安装失败时先 \`pkg update\` 升级包索引。

## 向量化优先

Octave 的解释器循环性能弱，批量运算应尽量向量化：

\`\`\`octave
% 逐元素用循环，慢
n = 10000;
y = zeros(n, 1);
for k = 1:n
  y(k) = sin(k) + k^2;
end

% 向量化，快很多
k = (1:n)';
y = sin(k) + k.^2;
\`\`\`

注意 \`^2\` 是矩阵幂（维度必须吻合），\`.^2\` 才是逐元素幂。数据是行向量时 \`k^2\` 会直接报非方阵错误。

## 函数化与脚本

脚本直接执行、变量留在工作区，出问题难追溯。函数有独立作用域，调试与复用都更好：

\`\`\`octave
function [m, se] = mystats(x)
  x = x(:);          % 强制成列向量，避免行向量传进来出错
  n = numel(x);
  m = sum(x) / n;
  if n < 2
    se = NaN;
  else
    se = std(x, 0) / sqrt(n);
  end
end
\`\`\`

两个易错点：一是忘了 \`end\` 收尾导致后续代码被当函数体吃掉；二是函数文件**文件名必须与函数名一致**且同目录。函数内调另一个函数时确认文件已在路径上（\`addpath\` 加入，\`path\` 查看）。

### 调试与查文档

\`dbstop\` 单步调试、\`keyboard\` 插入断点、\`dbstack\` 看调用栈，与 MATLAB 一致。查函数用法用 \`help\`、\`doc\`、\`lookfor\`（如 \`doc hist\`）。在线手册在 [Octave 官方文档](https://docs.octave.org/latest/)，函数索引按字母排列，与 MATLAB 文档结构对应，找函数几乎零成本。`,
      resources: [
        {
          kind: "link",
          title: "GNU Octave 官网首页",
          url: "https://octave.org/",
          note: "项目主页，含各平台安装包与 Octave Forge 包索引入口。",
        },
        {
          kind: "html",
          title: "Octave 官方在线手册",
          url: "https://docs.octave.org/latest/",
          note: "与手册配套的 HTML 版文档，函数索引齐全且可直接站内搜索。",
        },
      ],
    },
    alternatives: ["python", "jupyter"],
    icon: { letter: "O", color: "#0790C0", simpleIcon: "gnuoctave" },
  },
  {
    license: "BSD-3-Clause",
    slug: "jupyter",
    linksCheckedAt: "2026-10-12",
    name: "Jupyter",
    aliases: ["notebook", "ipynb"],
    summary: "在浏览器里交错写代码和说明，数据和教学演示常用。",
    scenes: ["data", "code"],
    platforms: ["windows", "macos", "linux"],
    body: "Jupyter 是把代码、运行结果、图片和说明文字放在同一个文档里的交互式环境。最常见的形式是 Notebook：一个由单元格组成的 .ipynb 文件，写 Python 代码的单元格旁边紧挨着显示输出结果的单元格，边写边跑。\n它的实际用法常被误解成「学 Python 的玩具」，但在数据探索里它是更合适的选择：一次分析往往是「算个统计量→ 看图→ 换个假设再算」，Notebook 的交错结构让这个循环不用来回跳文件。打开浏览器就能接着上次的分析现场继续，不用先起环境。数据与代码在同一个文件里，发给别人就能原样跑一遍——这对教学作业和需要别人复核的分析是实打实的价值。\n代价要说清。它的定位是探索与交付，不是长期维护的软件工程：没有版本控制的 diff 友好性（改错了不容易看出改了什么），单元测试与模块划分也不顺手，写到几千行就该搬进 .py 文件了。它也不是零安装——Jupyter 只是界面，跑什么语言取决于 kernel 是否装了对应包（kernel 与环境不匹配是新手第一个坑）。启动一个本地服务默认会监听所有网卡，公共网络上裸跑 JupyterLab 要格外小心。\n许可证是 BSD-3-Clause（各组件另有条款），官网 https://jupyter.org/install 提供安装说明。它可以本地装（Anaconda 一键带上），也可以用 Google Colab 这类云端服务（免费但依赖 Google 环境）。",
    tags: ["notebook","数据探索","教学演示","Python","可复现"],
    source: "opensource",
    officialUrl: "https://jupyter.org/install",
    links: {
      official: "https://jupyter.org/install",
      github: "https://github.com/jupyter/notebook",
    },
    officialLabel: "jupyter.org",
    whoFor: "分析要边写边看图，或要交可运行的笔记作业。",
    whoNot: "只写长期项目代码，普通编辑器可能更合适。",
    installTips: [
      "先有 Python，再用 pip 或官方文档装 JupyterLab。",
      "在项目目录启动，避免笔记本散落各处。",
      "内核找不到时，确认当前环境里已装 ipykernel。",
    ],
    guide: {
      intro: "从环境与 kernel 隔离讲到 nbconvert 批量导出与 LaTeX 公式渲染，解决 notebook 装了却跑不起来、以及怎么变成可交付文档。",
      markdown: `## kernel 必须与环境匹配

Jupyter 内核（kernel）是「运行 notebook 的那个解释器」。**装了 Jupyter 并不等于任何语言能跑** —— 每种语言都要有对应的 kernel 包，安装在同一个环境里。

Python 内核：

\`\`\`bash
pip install ipykernel
python -m ipykernel install --user --name py311 --display-name "Python 3.11"
\`\`\`

\`--name\` 是内部标识（字母数字与连字符，不能有空格），\`--display-name\` 是界面上显示的名字。R 内核同理：\`install.packages('IRkernel')\` 后执行 \`IRkernel::installspec(user = TRUE, name = 'ir', displayname = 'R')\`。

**最常见的报错**是 \`Jupyter kernel not found\` 或内核一直停在「connecting」：多半是 notebook 元信息里记录的 kernel 名与本机已安装的不一致。用 \`jupyter kernelspec list\` 列出清单，对不上的名字要么补装、要么在 Notebook 界面里手动换。

## 虚拟环境与内核的分工

conda / venv 解决「依赖版本冲突」，kernel 解决「Jupyter 能找到解释器」，两者正交。**conda 环境不会自动出现在 JupyterLab 里**，需要在每个环境里各装一次内核：

\`\`\`bash
conda create -n stat python=3.11
conda activate stat
pip install ipykernel
python -m ipykernel install --user --name stat --display-name "stat (py3.11)"
\`\`\`

换 kernel 比想象中麻烦 —— 它会重启内核，**内存中的变量全部丢失**，运行中的长任务尤其要当心。

## nbconvert：批量导出才是正经用法

notebook 本质是 JSON（格式由 nbformat 定义），\`nbconvert\` 负责把它转成别的形态：

\`\`\`bash
jupyter nbconvert --to html --execute report.ipynb      # 执行后导出 HTML
jupyter nbconvert --to markdown --execute report.ipynb  # 导出为 Markdown 文档
jupyter nbconvert --to python --stdout report.ipynb     # 导出为可执行脚本
jupyter nbconvert --to notebook --clear-output --inplace report.ipynb
\`\`\`

最后一个用于清理输出，把 notebook 显著压小。

| 参数 | 作用 |
| --- | --- |
| \`--execute\` | 执行所有单元格后再导出 |
| \`--no-input\` | 导出结果但隐藏代码，适合对外分享 |
| \`--stdout\` | 输出到标准输出而非文件 |
| \`--inplace\` | 覆盖原文件 |
| \`--clear-output\` | 清掉输出缓存 |
| \`--ExecutePreprocessor.timeout=600\` | 单个单元格超时秒数 |

**导出 PDF 报错**多半是缺 LaTeX（\`.tex\` 找不到），装 TeX Live 即可，或改用 \`--to html\` 再用浏览器打印成 PDF。

## 版本控制上的麻烦

notebook 存的是含大量输出与执行计数的 JSON，Git diff 几乎无法阅读，两边各跑一次就会冲突。实用做法是**输出不入库**：把 \`*.ipynb\` 加进 \`.gitignore\`，把 notebook 当草稿、成品放 \`.py\`/\`.qmd\`。若必须提交，加一行 \`.gitattributes\` 写 \`*.ipynb binary\` 关闭 diff。

## 公式与输出的渲染

Markdown 单元格支持 LaTeX：行内用 \`$...$\`，独立公式用 \`$$...$$\`。常见问题是中文与公式混排时字间距不理想，或者 \`\\text{}\` 里的中文显示为方块 —— 需要 \`\\usepackage{ctex}\` 或改用 \`\\mathrm{}\`。

输出乱码是另一类问题：Python 侧 \`print\` 的中文在 Windows 控制台常变问号，加两行即可：

\`\`\`python
import sys
sys.stdout.reconfigure(encoding='utf-8')
\`\`\`

需要更系统的说明时，官方文档站有完整的 [Jupyter 文档](https://docs.jupyter.org/en/latest/)，安装、内核、notebook 格式都有独立章节。`,
      resources: [
        {
          kind: "link",
          title: "Jupyter 官网首页",
          url: "https://jupyter.org/",
          note: "项目主页，汇总 JupyterLab、Notebook、Hub 等子项目的定位与下载入口。",
        },
        {
          kind: "html",
          title: "Jupyter 官方文档",
          url: "https://docs.jupyter.org/en/latest/",
          note: "涵盖安装、kernel 管理、notebook 格式与 nbconvert 工具的权威文档。",
        },
      ],
    },
    alternatives: ["python", "vscode", "rstudio"],
    icon: { letter: "J", color: "#F37626", simpleIcon: "jupyter" },
  },
  {
    slug: "geogebra",
    linksCheckedAt: "2026-10-03",
    name: "GeoGebra",
    aliases: ["几何", "函数图像", "数学", "GeoGebra 数学", "函数画图", "数学工具"],
    summary: "几何、代数和函数图像，课堂演示和自己推导都能用。",
    scenes: ["data"],
    platforms: ["windows", "macos", "linux"],
    // 源码公开但采用自家非商业许可，不是开源软件：source 不能标 opensource，否则会渲染成「开源」。
    source: "official",
    kind: "app",
    price: "非商业免费",
    officialUrl: "https://www.geogebra.org/download",
    officialLabel: "geogebra.org",
    tags: ["数学", "函数图像", "几何", "教学演示"],
    body:
      "GeoGebra 是把几何、代数、表格、函数图像和统计放在同一个界面里的数学工具。它解决的是「把一个数学关系画出来看」——拖动一个点，图形、方程和数值同时跟着变，适合课堂演示和自己推导验证。\n用法是输入即所得：在输入框写函数或点坐标，代数区与图形区同步更新；另有 CAS 视图做符号运算、3D 视图看立体关系。网页版、桌面版与移动端共用同一套文件格式，课件可以直接分享链接。\n许可要留意：它不是开源软件——源码公开但采用自家的非商业许可，个人学习与教学免费，商业用途（付费课程、商业出版物等）需要单独获得授权。安装包从 geogebra.org 下载，Windows、macOS、Linux 都有。",
    whoFor: "要画函数、几何或动态演示，不想写绘图代码。",
    whoNot: "做统计推断或大规模数据处理。",
    installTips: [
      "桌面版从 geogebra.org/download 安装，浏览器版也能应急。",
      "按计算器 / 几何 / 3D 选对应应用，不必全装。",
    ],
    guide: {
      intro: "从自由对象与从属对象的区别讲到命令行的精确构造与导学工作坊的做法，帮你避开 GeoGebra 最常见的动态失效问题。",
      markdown: `## 一切都是对象，自由对象与从属对象

GeoGebra 里每个图形都是一个**对象**，带自己的属性。理解这套对象模型是避免「一拖就散」的关键。

- **自由对象（Free Object）**：你直接用绘图工具画出来的，可以随便拖
- **从属对象（Dependent Object）**：由其他对象推导而来，删除源对象会一起消失
- **衍生对象（Derived Object）**：显示上被隐藏的辅助对象，不影响作图

画三角形内三条高时，用「高」工具直接点顶点和对边，得到的是**从属对象**；如果改用垂线工具画出后再随意移动，它就变成了自由对象 —— 三角形一变，高不再经过顶点。**判断方法**：拖动源对象，如果它不动，就是从属的。

在设置面板的对象列表里，Free 一栏列出所有自由对象，随时能看出哪些是意外产生的。

## 命令行是精确构造的工具

工具箱画得再快，也不如输入一行命令确定。GeoGebra 的输入栏接受两种语法：赋值与命令。

\`\`\`
A = (0, 0)
B = (4, 0)
C = (1, 3)
a = Polygon(A, B, C)
M = Midpoint(B, C)
p = PerpendicularLine(A, M)
d = Distance(A, p)
alpha = Angle(B, A, C)
\`\`\`

常用命令：

| 命令 | 作用 |
| --- | --- |
| \`Midpoint(A, B)\` | 两点连线的中点 |
| \`PerpendicularLine(A, l)\` | 过点 A 作直线 l 的垂线 |
| \`Intersect(f, g)\` | 两条曲线的交点 |
| \`Angle(A, B, C)\` | 三点构成的角，单位为弧度 |
| \`Polygon(A, B, n)\` | 以 AB 为边构造正 n 边形 |
| \`Circumcircle(A, B, C)\` | 三点的外接圆 |
| \`Segment(A, B)\` | 线段而非直线 |

角度默认以**弧度**返回，要在设置里把「角度单位」改成度，否则算出来的数值看不懂。

## 斜率与方程：代数视图与图形视图联动

代数视图里的表达式会实时驱动图形，这是 GeoGebra 相对其他绘图工具的优势。

\`\`\`
f(x) = x^2 - 4*x + 3
S = Solve(f(x) = 0)
\`\`\`

改一下 \`f(x)\` 的系数，图形与解立刻同步。想用鼠标反过来「抓」出方程：选中抛物线后打开设置里的「拖动模式」改为 Polynomial，拖动控制点，方程自动更新。

## 导学工作坊的做法

GeoGebra 的教育价值在于**学生自己拖动参数看变化**。工作坊的标准流程：

1. 先做「猜想版本」：给出可以拖动的点和参数，让学生发现规律
2. 再做「证明版本」：隐藏图形只留代数表达式，让学生论证为什么
3. 最后用「构造阶梯」按难度排序的问题逐步推进

关键技巧是**用条件显示制造「惊喜」**：

\`\`\`
a = Slider(0, 5, 0.1)
b = If(a > 3, 1, 0)
SetVisibleInView(b, 1, true)
\`\`\`

滑块拖过某个值时对象才出现，学生的反馈会明显强于一次性全展示。

导出课堂材料用「文件 > 下载为 > PNG」导出单张图，或导出 \`.ggb\` 文件让对方在 GeoGebra 里继续编辑。导出 PNG 时勾选「透明背景」在投影仪上更清晰。

想快速上手可以直接开 [GeoGebra Classic 网页版](https://www.geogebra.org/classic)，无需安装插件即可建文件与分享。`,
      resources: [
        {
          kind: "link",
          title: "GeoGebra 官网首页",
          url: "https://www.geogebra.org/",
          note: "项目主页，可在线查看社区资源、教材与教学法材料。",
        },
        {
          kind: "html",
          title: "GeoGebra Classic 在线版",
          url: "https://www.geogebra.org/classic",
          note: "免安装的浏览器版本，直接建文件、分享与导出，适合课堂临时演示。",
        },
      ],
    },
    alternatives: ["octave", "jasp"],
    icon: { letter: "G", color: "#990000" },
  },
  {
    slug: "libreoffice",
    license: "MPL-2.0 OR LGPL-3.0-or-later",
    linksCheckedAt: "2026-10-12",
    name: "LibreOffice",
    aliases: ["writer", "calc", "office 替代", "文档"],
    summary: "开源办公套件：文档、表格、演示，能开常见 Office 文件。",
    scenes: ["office", "docs", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://www.libreoffice.org/download/download-libreoffice/",
    links: {
      official: "https://www.libreoffice.org/download/download-libreoffice/",
      github: "https://github.com/LibreOffice/core",
    },
    officialLabel: "libreoffice.org",
    whoFor: "要离线改文档和表格，不想订 Microsoft 365。",
    whoNot: "必须使用仅在 Microsoft 365 里的协作功能或宏生态。",
    installTips: ["从 libreoffice.org 下稳定版，别用第三方镜像。", "复杂 PPT 或带宏的 Excel 可能有差异，交稿前用对方软件打开检查。", "默认可另存为 .docx / .xlsx，按接收方要求选。", "默认保存格式建议保持 .odt / .ods，需要交付时再导出。"],
    guide: {
      intro: "讲清 ODF 与 MS 格式的兼容边界、字体替换的排版陷阱、宏与 PDF 导出流程，解决「文档发出去版式全乱」的问题。",
      markdown: `## 格式兼容的真实边界

LibreOffice 原生格式是 ODF（\`.odt\` \`.ods\` \`.odp\`），同时能读写 MS 格式。但「能打开」不等于「完全一致」。

| 格式 | 保真度 | 说明 |
| --- | --- | --- |
| \`.odt\` / \`.ods\` | 最高 | 原生格式，LibreOffice 内部无损 |
| \`.docx\` / \`.xlsx\` | 较高 | 复杂排版与部分图表可能有偏差 |
| \`.doc\` / \`.xls\` | 一般 | 旧版二进制格式，特性被砍掉很多 |
| \`.rtf\` | 中等 | 通用但会丢结构 |

**稳妥的做法**：内部编辑用 ODF，交付时另存为目标格式，并**打开另存后的文件检查一遍**。另存为的位置是「文件 > 另存为」，选好格式后记得勾上「编辑过滤器设置」以控制细节。

批量转换可以走命令行，适合没有界面或需要脚本化的场景：

\`\`\`bash
soffice --headless --convert-to pdf *.docx --outdir ./out
soffice --headless --convert-to "xlsx:Calc MS Excel 2007 XML" *.ods
\`\`\`

\`--headless\` 在部分版本下会因 profile 冲突报错，需要显式指定：\`soffice -env:UserInstallation=file:///tmp/lo --headless --convert-to pdf report.docx\`。

## 字体替换：版式乱掉的真凶

打开别人文档后行距、页数、换行全变，几乎都是字体缺失导致的。LibreOffice 找不到原字体时会自动替换，替换字体的字宽不同，排版随之全乱。

排查顺序：先在「工具 > 选项 > LibreOffice > 字体」的替换表里看哪些字体被换了；目标机器没装的字体要么装上、要么映射到度量相近的字体；**发送前先导出 PDF** —— PDF 会嵌入字体子集，是唯一能保证版式不跑的做法。

长期稳定协作时，字体管理比软件选择更关键 —— 团队统一字体，或用 Google Fonts 这类可自由分发的字体。

## 宏与自动化

宏的入口是「工具 > 宏 > 编辑宏」或 Basic IDE。用 Basic 写与 Office 的 VBA 略有差别，UNO API 的典型写法如下：

\`\`\`basic
Sub 插入页码
  Dim oDoc As Object, oStyle As Object
  oDoc = ThisComponent
  ' 取当前页样式并打开页脚
  oStyle = oDoc.StyleFamilies.getByName("PageStyles") _
            .getByName(oDoc.CurrentController.ViewCursor.PageStyleName)
  oStyle.FooterIsOn = True
  oStyle.FooterIsShared = True
  oStyle.FooterText.setString("第 &P 页 / 共 &N 页")
End Sub
\`\`\`

\`ThisComponent\` 是当前文档对象，\`&P\` \`&N\` 是页码与总页数的字段占位符。跨平台路径用 \`ThisComponent.getURL()\` 取，不硬编码盘符。

宏存在文档里会触发安全提示，收件人需手动启用。要免提示就得把宏放进用户配置目录（\`~/.config/libreoffice/4/user/basic/\`），但这样别人就拿不到宏。

## Calc 的公式与兼容性

公式分隔符在各地区默认不同：英文区域用逗号，中文区域常用分号，用逗号可能报 \`Err:508\`。改法：「工具 > 选项 > Calc > 公式 > 公式语法」切换为 Excel A1 或 Calc A1。

跨软件读 CSV 时，日期与数字格式最容易出错。明确指定分隔符与编码更稳：

\`\`\`bash
soffice --headless --convert-to "csv:Text - txt - csv (StarCalc):44,34,76" data.xlsx
\`\`\`

末尾参数依次是分隔符（44 为逗号）、文本分隔符（34 为双引号）、字符集（76 为 UTF-8）。这串数字不好记，更实际的做法是用 Python 的 pandas 直接读写。

## 导出 PDF 的关键选项

「文件 > 导出为 > 导出为 PDF」里几项值得留意：

- **范围**：全部 / 页面范围 / 选择内容
- **PDF/A 格式**：勾上后是归档标准，长期保存用
- **字体嵌入**：不要关，关了字体就丢了

需要更细的说明时，[LibreOffice 帮助中心](https://help.libreoffice.org/) 有每个功能的完整文档。`,
      resources: [
        {
          kind: "link",
          title: "LibreOffice 官网首页",
          url: "https://www.libreoffice.org/",
          note: "项目主页，含各平台版本、路线图与 LibreOffice 社区入口。",
        },
        {
          kind: "html",
          title: "LibreOffice 官方帮助中心",
          url: "https://help.libreoffice.org/",
          note: "全功能官方文档，按模块组织，格式兼容与宏开发查这里最准。",
        },
      ],
    },
    alternatives: ["wps", "obsidian"],
    featured: true,
    icon: { letter: "L", color: "#18A303", simpleIcon: "libreoffice" },
    tags: ["办公套件", "开源", "文档兼容", "pdf"],
    body: "LibreOffice 是开源办公套件，Writer 管文档、Calc 管表格、Impress 管演示，另有 Draw 与 Base。它能打开并保存 .docx / .xlsx / .pptx，也能导出 PDF。对多数人它解决的是「不订 Microsoft 365 也能把 Office 文件改完」：格式能对上大部分，日常改个段落、调个公式、换个页边距不需要另找软件。\n兼容性的边界要提前知道。简单到中等复杂度的文档基本无损，但复杂 PPT 动画、带 VBA 宏的 Excel、SmartArt 以及某些老模板会出错位或丢内容——不是打不开，是打开后样子不对。稳妥做法是交稿前用对方实际使用的软件再打开核对一遍。另外它的默认格式是开放文档格式（.odt / .ods / .odp），这个格式本身是优势：不绑定单一厂商，长期可读性比专有格式好。\n想参与开发的话有个坑：GitHub 上的 LibreOffice/core 是只读镜像，提交走 Gerrit（gerrit.libreoffice.org），而且仓库描述里明确写了别直接下载 zip、要用 dev-www.libreoffice.org 的构建包。找源码可以，提 PR 要去对地方。\n许可证是 MPL-2.0，项目同时要求贡献者按 MPL-2.0 与 LGPL-3.0+ 双许可授权（官方许可证页原文：license your code to us jointly under both the Mozilla Public License v2 and the GNU Lesser GPL v3+ licenses），所以交付给用户的二进制按 MPL-2.0。Windows、macOS、Linux 都有安装包。",
  },
  {
    slug: "wps",
    linksCheckedAt: "2026-10-12",
    name: "WPS Office",
    aliases: ["wps", "金山"],
    summary: "国内常用办公套件，兼容常见 Office 格式，个人基础功能免费。",
    scenes: ["office", "docs"],
    platforms: ["windows", "macos", "linux"],
    source: "official",
    price: "基础免费",
    officialUrl: "https://www.wps.cn/",
    links: {
      official: "https://www.wps.cn/",
    },
    officialLabel: "wps.cn",
    whoFor: "主要在国内环境交 .docx / .xlsx，需要高兼容。",
    whoNot: "不想要广告和账号体系，或需要完全开源。可看 LibreOffice。",
    installTips: ["从 wps.cn 官方站下载，安装时取消不需要的附加组件。", "个人版和商业授权不是一回事，按使用场景看条款。", "交稿前用对方指定的软件打开核对一遍复杂格式。", "广告与登录提示在设置里能关掉一部分，但关不干净。"],
    guide: {
      intro: "拆清 WPS 免费版与会员的功能边界，讲透 docx 兼容、字体替换与 PDF 编辑的坑，帮你判断哪些钱该花、哪些坑能绕。",
      markdown: `## 先分清会员边界

WPS 是「基础功能全免费 + 增值功能收费」的组合，划清边界能省掉不必要的开通。

| 功能 | 免费可用 | 需要会员 |
| --- | --- | --- |
| 文字/表格/演示编辑 | 是 | — |
| docx/xlsx/pptx 打开与编辑 | 是 | — |
| PDF 阅读 | 是 | 高级编辑 |
| 模板中心 | 部分模板 | 全部模板与会员专享 |
| 云空间 | 有限额度 | 扩容 |
| 广告去除 | 否 | 需要会员 |
| 论文查重 | 否 | 增值服务 |
| AI 助手 | 有限额度 | 更高额度 |

**免费版的主要限制**：启动时有推广位、云空间容量小、部分模板带水印、PDF 编辑受限。这几条不构成阻止使用，但会在正式场合（如提交文档、对外交付）时产生影响。

WPS 还有「超级会员」与「会员」的区分，前者包含文档恢复、U 盘加速等功能。年付通常更便宜，但**不要为了短期需求开通长期订阅**。

## 兼容性：WPS 是 docx 的原生编辑器

WPS 的核心优势就是与 MS Office 高度兼容，绝大多数 docx/xlsx/pptx 文件在两边往返不会出问题。以下情况反而要小心：

- **复杂公式对象**：Word 里嵌入的公式在 WPS 中可能被转成图片或出现排版偏移
- **SmartArt 与高级图表**：pptx 的 SmartArt 在 WPS 里可能被替换成静态图形，编辑后无法还原
- **宏与 ActiveX**：含 VBA 的文档打开时宏默认被禁用
- **字体**：这是最大的变量，见下节

需要最严格的保真时，用 MS Office 打开 WPS 文件做最终检查。

## 字体缺失与排版

和 LibreOffice 同理，字体替换是排版跑版的主因。WPS 内置了大量字体，但中文用户常用的宋体、仿宋、楷体等系统字体版本间字宽不同，跨机器交换文档会换行错位。

处理办法：先在「文件 > 选项 > 常规」里看「替换字体」设置；长期方案是把字体文件随文档一起打包发送（压缩包，不是嵌入）；**真正要求版式一致的场合先导出 PDF** —— 「文件 > 输出为 PDF」，发送 PDF 而非源文档。

WPS 的云文档支持在线协同编辑，但**上传到云端的是云文档版本，本地文件不会自动同步改**。多人协作时务必统一在一个云空间里操作，否则容易出现「我改了但对方看不到」。

### PDF 编辑的真实能力

WPS 的 PDF 工具箱是它最实用的增值功能之一：修改文字图片与页面顺序、拆分合并旋转裁剪页面、添加签名图章水印、OCR 识别图片中的文字。

**边界要清楚**：修改后的文字不会自动匹配原字体的大小与颜色，容易看起来「贴上去」的。涉及合同、签章、法律效力的文件，**不能用 WPS 编辑过的 PDF 作为最终版** —— 它不是电子签章工具，修改痕迹在专业鉴定下可被识别。需要正式签章请使用 CA 证书方案。另外 PDF 编辑功能多数属于会员权益，免费版只能阅读和打印。

## 什么时候不该用 WPS

- **需要宏与二次开发**：LibreOffice 的 UNO API 更开放
- **批量脚本化转换**：LibreOffice 的 \`soffice --convert-to\` 更可靠，WPS 的命令行接口不够统一
- **纯文本/编程工作**：WPS 明显不合适
- **涉及敏感文档**：优先考虑本地部署、无云端上传能力的方案

反过来，只想把 docx 批量转 PDF 时，WPS 的 GUI 够用：批量选中文件 → 右键「输出为 PDF」，一次生成多个文件。这是它相对开源方案的实际优势。

[WPS 官方帮助中心](https://help.wps.com/) 有各功能的完整说明与版本对比。`,
      resources: [
        {
          kind: "link",
          title: "WPS Office 官网首页",
          url: "https://www.wps.cn/",
          note: "官方产品页，可查各版本功能差异与会员权益说明。",
        },
        {
          kind: "html",
          title: "WPS 官方帮助中心",
          url: "https://help.wps.com/",
          note: "覆盖文字、表格、演示、PDF 各模块的操作手册与常见问题。",
        },
      ],
    },
    alternatives: ["libreoffice"],
    icon: { letter: "W", color: "#C53929" },
    tags: ["办公套件", "文档兼容", "pdf", "免费"],
    body: "WPS Office 是金山办公的办公套件，含文字、表格、演示三个主组件，另有 PDF 工具。它解决的核心问题不是「能不能做文档」，而是「在国内的文档往来里少出意外」：对方发来的 .docx 带着 tracked changes、表格里嵌着复杂合并单元格、页眉页脚挂着公司模板，这些在开源办公软件里最容易错位的细节，是 WPS 投入最多的地方。个人基础功能免费，这是它装机量大的直接原因。\n与 Microsoft Office 的关系要说清楚：它兼容 Office 格式，但不是 Office。复杂文档双向转换仍可能错位——尤其是带宏的 Excel、SmartArt、以及多年迭代下来的老模板。常见做法是日常用它，交稿前用对方指定的软件打开核对一遍，别默认「看起来一样就是一样」。广告与账号体系是免费版的代价，弹窗和登录提示可以在设置里关掉一部分，但关不干净。\n它不是开源软件。这是它与 LibreOffice 的根本差别，也决定了适用场景：公司统一部署、需要签采购合同、或者对数据出境与账号体系有合规要求时，闭源商业软件的授权条款反而是明确的一方；反过来，如果你在意的是「软件本身可审查、格式不被单一厂商绑定」，那 LibreOffice 更合适。两者不是谁替代谁，是不同约束下的选择。\n许可证为专有商业许可，个人版与商业授权条款不同，具体以 wps.cn 的最终用户许可协议为准。Windows、macOS、Linux 都有客户端，移动端与在线文档另算。",
  },
  {
    license: "AGPL-3.0-or-later",
    version: "3.7.21",
    slug: "joplin",
    linksCheckedAt: "2026-10-03",
    name: "Joplin",
    aliases: ["开源笔记", "markdown", "笔记软件", "evernote 替代"],
    summary: "开源笔记，Markdown、待办、可自己选同步方式。",
    scenes: ["office", "docs"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["笔记", "Markdown", "知识管理", "开源"],
    body:
      "Joplin 是开源笔记应用，用 Markdown 写笔记和待办，同步方式由自己选。它解决的是「笔记要能自己掌握、能整包导出，不想锁进一家云服务」。\n内容是纯文本的：笔记以 Markdown 存在本地，支持待办、标签、笔记本层级和端到端加密；导出直接给 Markdown 或 HTML 文件，换软件不用求人。同步不绑单一厂商——可以接 WebDAV、文件系统、Dropbox、OneDrive，也可以用官方的 Joplin Cloud；桌面、手机和命令行客户端共用同一套数据。\n代价要提前知道：同步配置是新手最容易卡住的地方；多端同时编辑可能产生冲突副本（它会保留冲突笔记而不是静默覆盖，但清理要自己来）；插件与主题生态不如商业笔记丰富，界面偏朴素，没有数据库式的多维视图。\n许可证为 AGPL-3.0-or-later（仓库默认许可，部分子目录另有单独声明）。Joplin 名称与商标归 JOPLIN SAS，图标与 logo 需授权才能使用——做二次分发或换皮发布前请注意这一点。安装包从 joplinapp.org 下载，Windows、macOS、Linux 与移动端都有。",
    officialUrl: "https://joplinapp.org/",
    links: {
      official: "https://joplinapp.org/",
      github: "https://github.com/laurent22/joplin",
    },
    officialLabel: "joplinapp.org",
    whoFor: "要笔记可导出、可自己同步，不想锁进一家云。",
    whoNot: "只要系统自带备忘录，或完全依赖某个商业云笔记生态。",
    installTips: [
      "从 joplinapp.org 下载桌面端。",
      "同步可选用官方 Joplin Cloud，或 WebDAV / 文件系统。",
      "先导出一份备份，再试验同步。",
    ],
    guide: {
      intro: "讲清 Markdown 语法与属性、笔记本标签体系、端到端加密同步与导入导出，解决笔记迁入后格式走样和多端冲突的问题。",
      markdown: `## 两种编辑模式要选对

Joplin 默认是 **Markdown 编辑器**（所见即所得的富文本在「切换到富文本」后启用）。Markdown 模式的好处是可移植：导出的 \`.md\` 文件在别处也能用 Git 管理。

常用语法与 Joplin 的对应：

| 用途 | Markdown | Joplin 扩展 |
| --- | --- | --- |
| 标题 | \`# 标题\` | 自动生成目录 |
| 待办 | \`- [ ] 未完成\` | 渲染成可勾选复选框 |
| 标签 | 无原生语法 | \`#标签名\` |
| 提醒 | 无 | \`[提醒事项:: 明天上午]::提醒\` |
| 时间戳 | 无 | 内置时间戳格式 |
| 内嵌笔记 | \`[标题](:/笔记id)\` | 内部链接 |
| 附加文件 | 无 | \`![](:/资源id)\` |

**属性（Note Properties）是 Joplin 的核心机制**，写在笔记开头、单独一段 \`key: value\` 里：

\`\`\`
title: 2024 年 Q1 复盘
tags: 工作, 复盘
created: 2024-04-01
status: 进行中
\`\`\`

属性让笔记可被搜索语法 \`#status:进行中\` 检索，是长期积累笔记的关键。只用标签不打属性，笔记超过一千条后基本无法筛选。

## 附件与链接

Joplin 有两类资源：**内部资源**（上传的文件、笔记内部链接）和**外部链接**。附件默认存为内部资源，会随笔记一起同步。

**易错点**：

- 从网页复制粘贴时 HTML 会被转成 Markdown，复杂排版（多栏、嵌套表格、公式）常常丢失。重要内容建议以纯文本粘贴再手工加格式
- 内部链接用 \`:/笔记id\` 格式，移动笔记不会断链；但**导出成单个 \`.md\` 文件时内部链接会失效**，变成死链

## 同步：端到端加密的取舍

| 方式 | 加密 | 适用 |
| --- | --- | --- |
| Joplin Cloud | E2EE | 最省事，官方托管 |
| WebDAV（坚果云等） | E2EE | 已有网盘 |
| Nextcloud | E2EE | 自建 |
| Dropbox / OneDrive | E2EE | 第三方同步目录 |
| 文件系统 | 无 | 本地备份 |

**关键点：开启 E2EE（端到端加密）后，同步的数据在服务器上是密文**。这意味着：忘记密码或加密密钥，**数据永久无法找回**；多设备首次同步需要在**每台设备**上分别输入同一个加密密钥；附件一并加密，占用空间比明文大。

**不要把同步目录放在 OneDrive / Dropbox 这类自动同步文件夹里**，会造成数据库文件被同步进程反复锁死甚至损坏 —— Joplin 官方明确警告过这一点。

## 导入导出

从别的工具迁入或在换设备时用命令行：

\`\`\`bash
joplin export --format md --output notes.md   # 导出为 Markdown
joplin import Evernote.enex                  # 从 Evernote 导入（enex）
joplin import ./markdown-folder              # 从 Markdown 文件夹导入
\`\`\`

导出格式选择有坑：\`--format md\` **保留属性与内部链接**，而 \`--format raw\` 是原始 Markdown、不含元数据。要迁移请用 \`md\`。

## 日常维护

- **笔记检索**：\`Ctrl + P\` 打开命令面板，可用 \`type:note created:2024-01-01..2024-03-31\` 这类语法按时间筛
- **回收站**：删除的笔记进回收站，30 天后彻底清除
- **备份**：「文件 > 导出 > 导出为 JEX」生成完整归档文件（含附件），是换设备或备份的正确方式
- **插件**：搜索增强视图、Markdown 表格、Todo 统计等，注意插件也会同步到其他设备

更多同步与迁移细节见 [Joplin 官方帮助](https://joplinapp.org/help/)。`,
      resources: [
        {
          kind: "link",
          title: "Joplin 官网首页",
          url: "https://joplinapp.org/",
          note: "项目主页，含各平台客户端下载、同步方案对比与路线图。",
        },
        {
          kind: "html",
          title: "Joplin 仓库 README",
          url: "https://github.com/laurent22/joplin/blob/dev/README.md",
          note: "开发者视角的说明，含架构、自建服务端与贡献指南。",
        },
      ],
    },
    alternatives: ["obsidian", "libreoffice"],
    icon: { letter: "J", color: "#1073D6" },
  },
  {
    license: "Apache-2.0",
    version: "1.18.2",
    slug: "localsend",
    linksCheckedAt: "2026-10-03",
    name: "LocalSend",
    aliases: ["传文件", "隔空投送", "局域网", "本地传输", "airdrop 替代"],
    summary: "同一网络里互传文件，开源，不用账号。",
    scenes: ["office"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["文件传输", "局域网", "跨平台", "开源"],
    body:
      "LocalSend 是开源的局域网传文件工具，同一网络下两台设备直接互传，不需要账号、不经过服务器。它解决的是「手机和电脑之间传个文件，不想先上传到网盘再下载，也不想找数据线」。\n用法是打开即看见：两端都运行软件后，对方会出现在列表里，选中文件发送，接收端确认即可。本地传输走 HTTPS 加密，图片、视频、文件和文本都能发，也可以直接把一段文字推到对方剪贴板。Windows、macOS、Linux、Android、iOS 都有客户端。\n代价要提前知道：它只能在同一局域网内工作——设备不在同一个 Wi-Fi、跨网段或被 AP 隔离就看不见对方，要发给外网的人得换别的工具；公司网络或防火墙若拦了设备间通信也会失败；实际速度取决于局域网本身。\n许可证为 Apache-2.0。安装包从 localsend.org 下载。",
    officialUrl: "https://localsend.org/",
    links: {
      official: "https://localsend.org/",
      github: "https://github.com/localsend/localsend",
    },
    officialLabel: "localsend.org",
    whoFor: "手机和电脑互传文件，不想走网盘或数据线。",
    whoNot: "两台设备不在同一局域网，或必须发给外网同事。",
    installTips: [
      "两台设备都要从 localsend.org 安装。",
      "防火墙若拦了，允许本地网络通信。",
      "两边都打开软件后才能在列表里看到对方。",
    ],
    guide: {
      intro: "从零配对两台设备讲起，讲到跨网段传输、端口被拦时的排查，以及如何用命令行在无界面环境里发送文件。",
      markdown: `## 它到底怎么工作

LocalSend 不走云端，也不做账号。它靠两件事完成传输：UDP 广播宣告自己存在，HTTP 在局域网上直接传数据。所以同一网段内只要两台设备都开着，它就能互相发现。

这决定了它的能力边界：

| 场景 | 能否直连 | 说明 |
| --- | --- | --- |
| 同一 Wi-Fi / 同一局域网 | 能 | 默认路径，速度最快 |
| 跨子网（路由器隔离） | 需手动 | 要在接收端设置里手动填写对方 IP |
| 跨公网 | 需中继 | 借助社区中继服务器握手，文件仍端到端加密 |

设备列表里每台机器都有一个**设备 ID**，是一段形如 \`123-456\` 的短编号，由 MAC 地址推导而来。这不是账号、不上传服务器、换网也不会变，可以当作局域网内的固定标识来认机器。

## 三种配对模式怎么选

- **快速模式（默认）**：两台设备都保持默认设置，看到对方后直接确认接收。最省事，适合临时传文件。
- **已保存设备**：确认过一次后互相标记为「Trusted」，之后直接可见，不需要每次确认。家里固定的几台机器建议用这个。
- **热重发现不可用时手动输入 IP**：路由器开了 AP 隔离或防火墙拦了 UDP 广播时，用这个。在接收方的「设置 - 快速模式」里把发现方式改成「手动」，然后在对方列表点「添加」直接填 IP:53317。

> 端口 53317 是 LocalSend 的默认 TCP/UDP 端口。Windows 首次启动会弹防火墙申请，务必允许「专用网络」，否则表现为「一直搜索不到设备」。

## 排查搜索不到设备

按这个顺序查，八成能定位：

1. 确认两台机器连的是**同一个** Wi-Fi，不是手机热点和家宽 Wi-Fi 混用。
2. 确认网络类型是「专用网络」，公司或校园网常被 Windows 归为「公用网络」，防火墙会直接拦掉广播。
3. 关掉手机上的 VPN / 代理类 App，这类工具普遍会劫持 UDP。
4. 实在不行就切手动 IP，见上一节。

## 大文件与只读模式

传输大视频时建议在接收端打开**只读模式**（设置里的「只读」开关）：接收端会变成一个只提供下载、不接受上传的临时站点，避免误传覆盖本地文件。

命令行用法适合批量脚本，比如把一份安装包发到同网段的另一台机器：

\`\`\`bash
# 发送单个文件（会弹出确认，等待对方接收）
localsend-cli --file ./release.zip --name server-01
# ----
# 指定目标 IP 直接发，跳过 UDP 发现
localsend-cli --file ./release.zip --dest 192.168.1.42
\`\`\`

批量发送整个目录用 \`--directory\` 参数。CLI 与桌面端协议一致，可以互发。`,
      resources: [
        {
          kind: "html",
          title: "LocalSend 项目 README",
          url: "https://github.com/localsend/localsend/blob/main/README.md",
          note: "官方仓库说明，含各平台安装包与 CLI 参数列表。",
        },
        {
          kind: "link",
          title: "官网与使用指南",
          url: "https://localsend.org/#/guide",
          note: "官网首页与上手指南，说明设备 ID、热重发现与跨网段配置。",
        },
      ],
    },
    alternatives: ["thunderbird"],
    icon: { letter: "L", color: "#12BC9A" },
  },
  {
    slug: "thunderbird",
    license: "MPL-2.0",
    linksCheckedAt: "2026-10-03",
    name: "Thunderbird",
    aliases: ["邮件客户端", "邮箱", "邮件", "outlook 替代"],
    summary: "开源桌面邮件客户端，多账号、本地归档。",
    scenes: ["office"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["邮件客户端", "IMAP", "本地归档", "开源"],
    body:
      "Thunderbird 是开源桌面邮件客户端，把多个邮箱账号收进同一个界面，并在本地留一份完整副本。它解决的是「要在电脑上集中处理邮件，做本地归档和全文检索，而不是开一堆网页邮箱」。\n配置以标准协议为准：IMAP 或 POP 收信、SMTP 发信，多个账号并列显示，标签、过滤器、搜索与本地归档都能用；日历和通讯录由内置功能补齐，加密邮件可配合 OpenPGP。邮件存在本地意味着归档不依赖服务商是否继续提供网页版。\n代价要提前知道：它面向标准协议，各家网页邮箱的专有功能用不上；企业或学校邮箱常要求「应用专用密码」或干脆限制第三方客户端，得按对方的文档配置；长期归档会占用不少磁盘，备份要自己安排。\n许可证为 MPL-2.0。安装包从 thunderbird.net 下载，Windows、macOS、Linux 都有。",
    // 源码在 hg.mozilla.org，不在 Git host 白名单内，因此只有官网链接。
    officialUrl: "https://www.thunderbird.net/",
    officialLabel: "thunderbird.net",
    whoFor: "要在电脑上集中收多个邮箱，并保留本地副本。",
    whoNot: "只用网页邮箱而且很满意。",
    installTips: [
      "从 thunderbird.net 安装。",
      "添加账号时用 IMAP，除非你明确要 POP 下载后删除。",
      "学校或公司邮箱可能要按对方文档开「应用专用密码」。",
    ],
    guide: {
      intro: "从建邮箱账号讲起，讲到本地文件夹与 IMAP 的取舍、配置文件 profile 备份迁移，以及排查邮件发不出去的双重验证问题。",
      markdown: `## 装好后第一件事：建一个独立 profile

Thunderbird 启动后会让你创建**个人资料（Profile）**。很多人图省事直接用默认目录，结果以后加第二个邮箱、或想重装系统时就全乱了。

正确做法是进 \`菜单 - 设置 - 通用\` 滑到最底，点「配置编辑器」旁边的「配置文件夹」按钮，为每个账号建独立目录。目录结构长这样：

\`\`\`
Thunderbird/
└── profiles.ini
└── Profiles/
    ├── xxxxxxxx.default-release/     ← 默认，不建议放正式数据
    └── work.default/                 ← 自己建的，名字带 .default 才被识别
\`\`\`

要加多个账号就再点一次「创建配置文件」。\`profiles.ini\` 是纯文本，可以直接编辑，写错了改这个文件比在界面里点更省事。

## 本地文件夹还是 IMAP

这是用 Thunderbird 最大的一个决策点。账户设置里选「IMAP 账户」还是「POP3 账户」，决定邮件存在哪：

| | POP3 | IMAP |
| --- | --- | --- |
| 存储位置 | 默认下载到本地 | 留在服务器，客户端同步 |
| 多设备 | 需手动同步，易冲突 | 天然一致 |
| 适合 | 单一设备、归档旧邮件 | 手机电脑多端同看 |

判断标准很简单：**多个设备同时看同一个邮箱就必须用 IMAP**。QQ 邮箱、163 邮箱都默认走 IMAP，Exchange/Office 365 则要看公司是否开了 Exchange ActiveSync。

## 文件格式：mbox 与 mbox 的坑

邮件本地存成 mbox 目录，也就是**一个文件里塞几千封信**。删信时 Thunderbird 只做标记（改 mbox 里的状态位），不会立刻从文件里删字节。要真正压缩体积，得在文件夹上右键选「压缩」。长期不压缩，邮箱文件会膨胀到几百 MB。

导出单封信用「另存为」存成 \`.eml\`，这是单封邮件的标准封装格式，可以直接拖回 Thunderbird 打开。

## 迁移到新电脑

整个 profile 目录打包走即可，注意三点：

1. 目录名里的 \`.default\` 后缀要保留，否则新环境不认。
2. 迁移前**完全退出** Thunderbird，否则 mbox 还在写入，拷出来的文件不完整。
3. 复制后如果提示「配置文件已在使用」，删掉 profile 目录里的 \`.lock\` 文件。

## 发不出邮件的排查顺序

按这个顺序查，能覆盖九成情况：

1. **SMTP 认证没配**。账户设置 -「服务器设置 - 发送邮件 (SMTP)」里选对应服务器，点「编辑」，勾选「使用安全连接」并选对端口。QQ 邮箱的 SMTP 是 465 或 587，都不是 25。
2. **开启了两步验证但没生成授权码**。163、QQ、Outlook 都要用「客户端授权码」当密码，不是你的登录密码。授权码在邮箱网页版的设置里生成。
3. **证书或时间不对**。系统时间偏差超过几分钟会导致 SSL 握手失败。

顺手一个通用技巧：任何邮件问题都可以在原始邮件头里看真实原因。按 \`Ctrl+U\`（或菜单「显示邮件源代码」）能看到 \`SMTP-Status\` 和服务端返回的原始报错，比猜快得多。`,
      resources: [
        {
          kind: "link",
          title: "Thunderbird 官方支持中心",
          url: "https://support.mozilla.org/products/thunderbird",
          note: "Mozilla 官方知识库，含 profile 备份、IMAP 设置与发信故障的排障文章。",
        },
      ],
    },
    alternatives: ["libreoffice"],
    icon: { letter: "T", color: "#0A84FF", simpleIcon: "thunderbird" },
  },
  {
    license: "GPL-2.0",
    version: "2.2.1.5",
    slug: "librecad",
    linksCheckedAt: "2026-10-03",
    name: "LibreCAD",
    aliases: ["cad", "二维绘图", "autocad 替代", "二维 cad", "dxf"],
    summary: "开源二维 CAD，画平面图、零件轮廓。",
    scenes: ["engineering"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["CAD", "二维绘图", "工程图", "开源"],
    body:
      "LibreCAD 是开源二维 CAD，用来画平面图、零件轮廓和工程草图，原生格式是 DXF。它解决的是「要一张能标注尺寸的二维图纸，但不需要三维建模那一整套」。\n用法接近传统 CAD：可以直接输入坐标或长度，图层与线型分开管理，尺寸标注和图块都能用，正交与捕捉能把线画得很准。它启动快、占用小，老旧机器上也能跑。\n代价要提前知道：它只做二维，需要三维装配或参数化零件就去 FreeCAD；DWG 是 AutoCAD 的私有格式，LibreCAD 对它的读写只能算有限兼容，交换文件用 DXF 最稳；另外单位和图层要在开工前定好，画到一半再改很麻烦。\n许可证为 GPL-2.0（上游仓库 LICENSE 明确为 GPLv2，GitHub 自动识别为 NOASSERTION）。安装包从 librecad.org 下载，Windows、macOS、Linux 都有。",
    officialUrl: "https://librecad.org/",
    links: {
      official: "https://librecad.org/",
      github: "https://github.com/LibreCAD/LibreCAD",
    },
    officialLabel: "librecad.org",
    whoFor: "做二维工程图，没有 AutoCAD 许可。",
    whoNot: "要做三维装配或参数化零件，看 FreeCAD。",
    installTips: [
      "从 librecad.org 下载。",
      "单位和图层先设好再画，后期改很烦。",
      "DXF 交换最稳，DWG 兼容有限。",
    ],
    guide: {
      intro: "从图层与捕捉设置讲起，讲到 DXF 版本兼容这个最常见的丢图原因，以及块、打印布局和脚本自动化的实际做法。",
      markdown: `## 图层、块与捕捉：先把这三件事理顺

LibreCAD 的界面是经典 CAD 布局，右侧**图层**面板管理显示与打印可见性。上方工具栏的**捕捉（Snap）**按钮决定光标吸附到哪几类几何点：端点、中点、圆心、交叉点、象限点。画图时如果捕捉没开对，会出现「线段接不上去」「圆心偏了半个像素」这类问题。

建议的作图习惯：

- 一个**图层**只放一类对象，比如轮廓、标注、中心线分开，便于后续隐藏与出图。
- 尺寸标注单独放一个图层，打印时用关闭该图层的方法只出图形。
- 按 \`F5\` 呼出**捕捉**菜单，F6 是「让捕捉优先级低于对象捕捉」的开关。

## DXF 版本兼容：最常见的坑

这是 LibreCAD 用户踩得最多的地方。DXF 有多个版本，AutoCAD 2018+ 保存的文件在老版本 LibreCAD 里打开，常表现为**丢图层、丢块、圆变成多段线、标注变形**。

原因是 DXF 各版本支持的实体类型不同：新版本写入的 \`ACAD_2018_*\` 代理对象、样条拟合数据老版本解析不了。处理办法：

1. 存盘时在「文件 - 另存为」里选 \`AutoCAD 2000 (DXF)\` 或 \`R14\`，这是兼容性最好的通用档位。
2. 打开时若发现内容丢失，先在 \`编辑 - 首选项 - 导入/导出\` 里把 \`dxf\` 的导入精度（Import DXF accuracy）从 0.01 调小，容差过大时细小圆弧会被当成直线丢弃。
3. 用 LibreCAD 附带的 \`dxf2svg\` / \`dwg2dxf\` 工具做批量格式转换，别手工一个个转。

| 需求 | 建议格式 |
| --- | --- |
| 给下游程序读取 | DXF R14 / 2000 |
| 保留完整精度给同行 | DXF 2013 以上 |
| 只为查看与打印 | SVG 或 PDF |

## 块（Block）与外部参照

把常用图形存成**块**能让文件小很多。选中图形后 \`Ctrl+B\` 创建块，生成 \`*.dxf\` 里的一段定义。插入时用 \`B\` 命令，可以指定基点插入、按比例缩放，或整个块炸开（explode）回普通实体。

需要引用别人图纸里的图形时，用**外部参照（XRef）**：\`文件 - 导入 - 参照\`，选另一个 dxf，勾选只读插入。参照进来后源文件改了，参照不会自动更新，需要在图层树里右键「重新加载」。

## 命令行导出与自动化

LibreCAD 自带 Qt 脚本，扩展名 \`.py\`，用「文件 - 运行脚本」执行。常用的几何查询可以直接写：

\`\`\`python
# 打印当前文档的实体数量与图元类型分布
from FreeCAD import Base  # LibreCAD 分支沿用 FreeCAD 的部分命名
doc = App.getDocument("drawing")
from collections import Counter
c = Counter(o.TypeId for o in doc.Objects)
for k, v in c.items():
    App.Console.PrintMessage("%s: %d\\n" % (k, v))
\`\`\`

打印出图走「文件 - 打印」，在打印对话框里设置打印范围（当前视口 / 整个图框）、比例与图层过滤。生成的 PDF 可以作为交付件直接发出去。`,
      resources: [
        {
          kind: "html",
          title: "LibreCAD 项目 README",
          url: "https://github.com/LibreCAD/LibreCAD/blob/master/README.md",
          note: "官方仓库说明，含编译依赖、脚本接口与已知问题列表。",
        },
        {
          kind: "link",
          title: "LibreCAD 官网与教程",
          url: "https://librecad.org/#learning",
          note: "官网首页，含入门教程与 DXF 格式兼容问题的官方说明。",
        },
      ],
    },
    alternatives: ["freecad", "openscad"],
    icon: { letter: "L", color: "#2B57A2" },
  },
  {
    slug: "kicad",
    license: "GPL-3.0",
    linksCheckedAt: "2026-10-03",
    name: "KiCad",
    aliases: ["电路", "pcb", "原理图", "电路板设计", "EDA"],
    summary: "开源电子设计：原理图和 PCB。",
    scenes: ["engineering"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["电路设计", "PCB", "原理图", "开源"],
    body:
      "KiCad 是开源电子设计自动化套件，从画原理图到布 PCB、出生产文件都在同一套工具里完成。它解决的是「要把一块电路板从想法做到能发给工厂打样」。\n流程是连着的：eeschema 画原理图 → 关联封装 → pcbnew 布线 → 3D 预览检查干涉 → 生成 Gerber 与钻孔文件。自带封装库和 3D 模型库覆盖了常见器件，符号库编辑器可以自己补件；差分对、长度匹配和高速规则也都有，多层板能胜任。\n代价要提前知道：它不做电路仿真，需要仿真得配合 ngspice 这类外部工具；自动布线和推挤不如商业 EDA 顺手，复杂板大量时间花在手工调整上；库管理是新手最容易卡住的地方。\n许可证为 GPL-3.0（上游仓库 LICENSE 文件为 GPL 第三版）。安装包从 kicad.org 下载，Windows、macOS、Linux 都有；建议装完整包，只装主程序会缺封装库。",
    // 上游在 gitlab.com/kicad/code/kicad（gitlab.com 在 Git host 白名单内）。
    officialUrl: "https://www.kicad.org/download/",
    links: {
      official: "https://www.kicad.org/download/",
      github: "https://gitlab.com/kicad/code/kicad",
    },
    officialLabel: "kicad.org",
    whoFor: "画原理图、布 PCB，要交生产文件。",
    whoNot: "只画机械结构，或只做纯软件。",
    installTips: [
      "从 kicad.org 装完整包，含封装库。",
      "第一次建议跟官方入门把原理图到 PCB 走通。",
      "交工厂前用设计规则检查，不要只看 3D 预览。",
    ],
    guide: {
      intro: "从符号库与封装库的分工讲起，讲到 ERC/DRC 两道检查、网表与 PCB 的对应关系，以及 3D 视图与 Gerber 导出里最常见的翻车点。",
      markdown: `## 符号库和封装库是两回事

新手最常卡在这里：**符号（Symbol）是原理图上的电气表示，封装（Footprint）是 PCB 上的实际焊盘**。画完原理图只是第一步，每个符号还得绑一个封装，否则导入 PCB 时会看到一堆「footprint not found」。

绑定在**符号属性 - Footprint** 字段里，填库名加封装名，例如 \`Resistor_SMD:R_0603_1608Metric\`。校验方法：原理图里选中一个符号按 \`E\`，属性窗口底部会显示当前绑定的封装。

标准库的位置：

- 符号库：\`/usr/share/kicad/symbols/\`（Linux），Windows 在安装目录的 \`share\\kicad\\symbols\\\`
- 封装库：同级的 \`footprints/\`
- 库管理器入口：**Preferences - Manage Footprint Libraries** 和 \`Tools - Symbol Library Table\`

## ERC 和 DRC 解决的是不同阶段的问题

| | ERC | DRC |
| --- | --- | --- |
| 检查对象 | 原理图 | PCB 布局 |
| 抓典型错误 | 电源脚未接、输出短路 | 走线太近、悬空焊盘 |
| 触发位置 | 原理图编辑器 | PCB 编辑器 |
| 快捷键 | 编辑器内 \`Inspect\` | PCB 内 \`Inspect\` |

两道检查都必须在导出 Gerber 之前跑通。DRC 的忽略项要慎用：在 \`Board Setup - Violation Severity\` 里把某条规则设成忽略，等于放弃该保护，网表密集的板子容易出现间距不足导致短路。

## 布线前的设定不能省

打开 PCB 编辑器第一件事是 \`File - Board Setup\`，确认这几项：

1. **设计规则**（Design Rules）：最小线宽、最小间距、孔径大小。默认值是按 1.6mm 双层板给的，密度高就得改小。
2. **层叠（Stackup）**：决定板厚与阻抗。多层板务必把内层厚度算对，否则高速信号会有问题。
3. **网络（Net Classes）**：默认类（Default）通常是走电源线，新建一个 \`Power\` 类把线宽加粗，比全局改线宽干净。

## 3D 视图的局限

\`View - 3D Viewer\` 能显示模型，但它是**近似渲染**：3D 模型来自封装里的 step 模型，缺模型就只能显示成空的焊盘。批量生成 3D 装配文件时更稳的做法是用 \`kicad-cli\`：

\`\`\`bash
# 导出 Gerber（生产文件，按层分别输出）
kicad-cli pcb export gerbers board.kicad_pcb -o ./gerber/
# ----
# 导出 3D 模型（STEP，用于装配验证）
kicad-cli pcb export step board.kicad_pcb -o ./step/
# ----
# 导出原理图 PDF，交付用
kicad-cli sch export pdf schematic.kicad_sch -o ./sch.pdf
\`\`\`

Gerber 导出后再打开 CAM 工具复查一遍，KiCad 自带的 GerbView 可以直接把导出的文件读回来做视觉核对。

## 封装自己画时的坑

自己画封装时，新版本提供了封装编辑器（\`Place - Footprint Editor\`），比老版本在图元编辑器里改靠谱得多。要点：

- 焊盘编号必须与符号的引脚号**逐一对应**，编号错了板子就废了。
- 丝印（Silkscreen）不要压到焊盘上，丝印阻焊会让焊点位置看不见。
- 焊盘外径要比所在封装的手工焊盘尺寸大 0.1~0.2mm，给阻焊开窗留余量。`,
      resources: [
        {
          kind: "html",
          title: "KiCad 源码仓库 README",
          url: "https://gitlab.com/kicad/code/kicad/-/blob/master/README.md",
          note: "官方主仓库说明，含编译依赖、版本要求与开发流程。",
        },
        {
          kind: "link",
          title: "KiCad 官方文档",
          url: "https://docs.kicad.org/",
          note: "各版本官方手册，覆盖库管理、规则设定与 CLI 工具的完整参考。",
        },
      ],
    },
    alternatives: ["freecad"],
    featured: true,
    icon: { letter: "K", color: "#314CB0", simpleIcon: "kicad" },
  },
  {
    slug: "freecad",
    license: "LGPL-2.1",
    linksCheckedAt: "2026-10-03",
    name: "FreeCAD",
    aliases: ["三维 cad", "参数化", "FreeCAD 建模", "三维 CAD", "零件设计"],
    summary: "开源参数化三维 CAD，适合零件和简单装配。",
    scenes: ["engineering", "design"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://www.freecad.org/downloads.php",
    officialLabel: "freecad.org",
    links: {
      official: "https://www.freecad.org/downloads.php",
      disk: "https://pan.quark.cn/s/6ee5d2df3b7b",
      diskNote:
        "夸克网盘上的固定版本副本，1.1.4 Windows 安装包。文件取自 FreeCAD/FreeCAD 官方 Release 附件，SHA-256 直接取自上游随发布提供的 -SHA256.txt 官方校验文件，下载后本地重算与之逐字一致。网盘里是固定版本的快照，上游发新版不会自动更新。同目录另有 SHA256SUMS.txt 与 README.md，含三个文件的校验值与来源说明。",
      diskFile: "FreeCAD_1.1.4-Windows-x86_64-py311-installer.exe",
      diskSha256: "845f7101d33faf257a82a0cadc5f4f3804441f46ee493eb32b92fcf9c7147a24",
    },
    tags: ["CAD", "参数化建模", "工程制图", "开源"],
    body:
      "FreeCAD 是开源的参数化三维 CAD，用来画零件、做简单装配并导出工程图。它解决的是「只需要画几个能加工的零件，没必要买一套商业 CAD」。\n参数化是它的工作方式：草图上标注尺寸，后面改尺寸会驱动整个模型更新；工作台按用途划分（零件、草图、装配、路径、有限元等），可以只装常用的几个。代价要提前知道：装配与工程图环节不如商业套件顺手，复杂模型容易出现拓扑命名问题导致报错，界面与术语沿用传统 CAD 概念，第一次上手需要跟着教程走一遍。\n项目以 LGPL 许可开源，安装包从 freecad.org 发布，Windows、macOS、Linux 都有，稳定版与开发版分开提供。",
    whoFor: "要参数化零件、出工程图，没有 SolidWorks / Fusion 许可。",
    whoNot: "只做影视级造型渲染，Blender 更合适；只画 2D 看 LibreCAD。",
    installTips: [
      "从 freecad.org 下稳定版。",
      "工作台很多，零件从 Part Design 开始即可。",
      "保存 .FCStd，导出 STEP 给别人最不容易丢特征。",
    ],
    guide: {
      intro: "从 Part 与 PartDesign 两套工作台的分工讲起，讲到布尔运算的失败排查、参数化约束怎么用，以及 FreeCADCAD 与 STEP/IGES 的导出取舍。",
      markdown: `## 先搞清工作台分工

FreeCAD 最容易让新手迷糊的地方是它有**多套并行的工作台**，不是「一个软件加插件」的结构。核心区分：

| 工作台 | 建模方式 | 适合 |
| --- | --- | --- |
| Part | 直接对实体做布尔、加减 | 一次性零件、导入的形状处理 |
| PartDesign | 草图 + 特征，特征按顺序叠加 | 需要参数化、可反复改尺寸的零件 |
| Draft | 二维线框工具 | 画草图轮廓、简单线条 |
| Sketcher | 参数化草图编辑器 | 带尺寸约束的精确轮廓 |

**选错工作台的典型症状**：用 Part 手动画了 20 个实体，改尺寸时得一个个重做；正确做法是 PartDesign 里画一个带约束的草图，加一个 Pad（拉伸），改草图约束整个模型就跟着变。

> 易错点：PartDesign 的实体必须**连续相接**才能合并。新加的特征如果和已有实体没接触，Pad 会长成一个悬空实体并报 warning。

## 参数化的关键是草图约束

PartDesign 的价值全在草图。画草图时**不要靠鼠标点位置**，要加约束：

- 固定/水平/垂直约束锁定方向
- 尺寸约束（Distance、X、Y、Radius）锁定数值
- 约束冲突会在草图编辑器左侧列出，红色的要必须解掉

约束加对了，改一个半径就整个模型联动。约束没加，就会出现「孔跑到板子外面了」这种问题。

## 布尔运算失败怎么查

Cut / Fusion / Common 之后的形状不对，是 FreeCAD 里最耗时的排查。常见原因与对策：

1. **实体自相交（self-intersection）**：拉伸时选了两条相交轮廓。先用 Draft 里的 \`Sketcher\` 检查草图闭合。
2. **切完没剩下东西**：切面和目标完全不相交，或目标已被前面的布尔消耗掉。
3. **结果变成多实体**：布尔输入的是 Compound。用 \`Part\` 菜单里的 \`Part - Shape\` 工具检查实体数量。

排查手段是直接选中失败的布尔特征按 \`Edit\` 回退到出错的那一步，改完再重做。开启 \`偏好设置 - Part/PartDesign - 高亮\` 系列选项后，出错的边会以红色标出。

## 导出格式怎么选

\`File - Export\` 里的格式各有用途，选错会导致下游打不开：

| 格式 | 特征 | 用于 |
| --- | --- | --- |
| STEP | 国际标准，保留 B-Rep 精确曲面 | 对外交付、导入 CAD/CAM |
| IGES | 老标准，只传多面体近似 | 老系统兼容 |
| STL | 三角网格，丢失参数与精度 | 3D 打印 |
| BREP | FreeCAD 原生，完整保留 | 存档、再打开继续编辑 |

给 3D 打印用 STL 时，\`Mesh - Export\` 里可以调网格偏差（deviation），偏差越小面数越多。曲面区域偏差别超过 0.1mm，否则打印出来会有可见的棱。

## 脚本化建模

FreeCAD 的命令行和 \`FreeCADCmd\` 支持纯脚本批处理，适合参数化出图：

\`\`\`python
# 建一个 60x40x5 的板子，四个 M3 通孔
import Part, FreeCAD as App
# ----
box = Part.makeBox(60, 40, 5)
for x in (5, 55):
    for y in (5, 35):
        hole = Part.makeCylinder(1.7, 6, App.Vector(x, y, -0.5))
        box = box.cut(hole)
# ----
doc = App.newDocument("plate")
obj = doc.addObject("Part::Feature", "plate")
obj.Shape = box
doc.recompute()
doc.saveAs("plate.step")
\`\`\`

无界面运行：\`FreeCADCmd script.py\`。批量生成标准件库时比在界面里点快几个数量级。`,
      resources: [
        {
          kind: "link",
          title: "FreeCAD 官方 Wiki",
          url: "https://wiki.freecad.org/Main_Page",
          note: "官方 wiki 主页面，含各工作台教程、脚本接口与布尔运算故障的排查文章。",
        },
      ],
    },
    alternatives: ["librecad", "blender", "openscad"],
    icon: { letter: "F", color: "#418FDE", simpleIcon: "freecad" },
  },
  {
    license: "GPL-2.0",
    slug: "qgis",
    linksCheckedAt: "2026-10-12",
    name: "QGIS",
    aliases: ["gis", "地图", "地理信息"],
    summary: "开源地理信息桌面软件，看图层、做专题图。",
    scenes: ["engineering", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://qgis.org/download/",
    links: {
      official: "https://qgis.org/download/",
      github: "https://github.com/qgis/QGIS",
    },
    officialLabel: "qgis.org",
    whoFor: "要处理地图图层、做空间分析和出图。",
    whoNot: "只需要在网页上看一眼地图。",
    installTips: ["从 qgis.org 选长期发布版（LTR）更稳，可与最新版共存。", "先确认每个图层的坐标系（CRS），再叠图层。", "大数据量图层不要一上来做全局渲染，先缩到范围再刷新。", "想要底图或批量处理能力，去插件库里找 QuickMapServices 与 Processing。"],
    guide: {
      intro: "从图层与坐标系的区别讲起，讲到投影 CRS 怎么选、栅格与矢量各自的坑，以及用 Processing 批处理与插件安装的实际流程。",
      markdown: `## 图层 vs 数据源

QGIS 的核心心智模型：**一个图层（Layer）= 一份数据 + 一套渲染样式**。往项目里加数据不会改原文件，只是建立引用。

数据源分两类，工具栏上那两个图标就是它们：

| | 矢量（Vector） | 栅格（Raster） |
| --- | --- | --- |
| 数据结构 | 几何 + 属性表 | 像素矩阵（像栅格） |
| 常见格式 | GeoJSON / Shapefile / GeoPackage | GeoTIFF / ECK / JPEG |
| 主要操作 | 按属性查询、拓扑分析 | 按像元分析、重采样 |
| 缩放表现 | 任意缩放不失真 | 放大后有像素块 |

**工程上优先用 GeoPackage（\`.gpkg\`）**：它是 SQLite 数据库，一个文件里能存多个图层和字段，替代了 Shapefile 那个「一个图层一套文件」的麻烦。

## 坐标系与投影：最容易错的一环

QGIS 里有两个独立概念，混淆会导致所有东西偏移几公里：

- **数据自带 CRS**：数据文件里记录自己用哪个坐标系（定义性的，属于数据本身）
- **项目 CRS（Project CRS）**：当前项目用哪个坐标系来显示和计算

按 \`Ctrl+Alt+T\` 打开「重新投影图层」工具做转换，**必须选对目标 CRS**。判断依据：做全球概览用 \`EPSG:4326\`（WGS84 经纬度），做局部量算用当地 UTM 带（如北京为 \`EPSG:32650\`，WGS84 / UTM zone 50N）。

> 经典事故：把 EPSG:4326 的数据当成 32650 用，\`WGS84 / UTM\` 下经纬度值会被当成米，图形直接飞到几千里之外。「图层看起来完全不对且离谱」时，先查 CRS，这是第一嫌疑人。

## 属性表与连接表

属性表（Attribute Table）里每一行是一个要素、每一列是一个字段。字段类型必须在建字段时定好：把数字字段存成文本，排序会按字典序排，导致 \`10\` 排在 \`2\` 前面。

多张表按共同字段合并用 \`Join attributes by location\` 或 \`Join attributes by field\`。连接后可把临时字段 \`Join field\` 设为空，避免污染原始数据。

## 用 Processing 批处理

\`Processing\` 工具箱是 QGIS 的自动化入口。菜单 \`Processing - Toolbox\` 打开，常用的几类：

- \`Vector\`：裁剪 clip、缓冲区 buffer、重投影 reproject、融合 dissolve
- \`Raster\`：重采样 resample、按掩膜裁剪 clip by mask
- \`CRUD\`：从文本文件创建图层、按属性筛选
- \`GDAL\`：格式转换、栅格计算

命令行等价物是 \`qgis_process\`，能写脚本流水线：

\`\`\`bash
# 列出所有可用算法
qgis_process list
# ----
# 矢量裁剪：切出研究范围
qgis_process run native:clip --INPUT_ZONES=zones.shp --INPUT_OVERLAY=aoi.geojson --OUTPUT=clipped.gpkg
# ----
# 栅格按矢量边界裁剪
qgis_process run gdal:cliprasterbymasklayer --INPUT=dem.tif --MASK=boundary.gpkg --OUTPUT=dem_clip.tif
\`\`\`

## 插件与自定义布局

插件在 \`插件 - 管理并安装插件\` 里装，二进制依赖（GDAL、GRASS）在 Windows 版是随包提供的，因此**优先用官方安装包而不是自己编译**，省掉一整类问题。

出图要区分两个概念：**布局（Layout）** 里放的是地图框、图例、指北针这些排版元素，和图层内容分开。静态出图流程是：新建布局 → 插入地图框 → 锁定图层与范围 → 插入图例/比例尺 → 导出为 PDF 或 SVG。手工拖地图框范围太慢时，可以在布局里绑定一个项目中的书签（Bookmark）来快速切换范围。`,
      resources: [
        {
          kind: "link",
          title: "QGIS 官方文档",
          url: "https://docs.qgis.org/3.44/en/docs/index.html",
          note: "当前 LTR 版本的官方用户手册，覆盖坐标参考、Processing 全部算法与布局出图。",
        },
      ],
    },
    alternatives: ["python"],
    icon: { letter: "Q", color: "#589632", simpleIcon: "qgis" },
    tags: ["GIS", "地图", "空间分析", "开源"],
    body: "QGIS 是开源的地理信息系统桌面软件，做的是把图层叠在一起看、分析、出图。它能读 shapefile、GeoJSON、GeoPackage、PostGIS 数据库，也能连 WMS、WMTS、XYZ 瓦片服务；矢量与栅格图层、标注、符号化都在一个画布里完成，最后导出成图片或可直接打印的地图布局。日常用途从「把几个省的边界和点位叠起来看一眼」到「做缓冲分析、字段计算、地形剖面」都覆盖。\n它与「在网页上看地图」是两回事。网页地图给你的是现成的底图和检索，QGIS 给你的是图层控制权：每个图层用什么符号、按哪个字段分级、标签放哪、坐标系怎么转，都能定。这也是它的门槛所在——上手前需要先接受一套概念：图层、要素、属性表、坐标系。坐标系尤其容易绊人：两个图层的 CRS 不一致时叠加会偏，报错却不明显，往往是图层对不上位置而不是数据坏了。\n版本选择上，qgis.org 同时提供最新版与长期发布版（LTR）。生产环境与教学用 LTR 更稳，插件生态对 LTR 的支持也更及时；想试新功能再装最新版，两者可共存。插件是它的另一半能力：QuickMapServices 提供底图、Processing 把 GDAL 与 GRASS 的一堆工具包进图形界面，很多「QGIS 能做吗」的答案其实在插件里。\n许可证是 GPL-2.0（仓库 COPYING 与 GitHub 检测一致），源码在 GitHub 的 qgis/QGIS，星标约 1.45 万，更新活跃。Windows、macOS、Linux 都有安装包。",
  },
  {
    license: "GPL-2.0",
    version: "2021.01",
    slug: "openscad",
    linksCheckedAt: "2026-10-03",
    name: "OpenSCAD",
    aliases: ["代码建模", "3d 打印", "脚本建模", "参数化建模"],
    summary: "用代码描述三维模型，适合精确尺寸和可重复零件。",
    scenes: ["engineering", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["代码建模", "3D打印", "参数化", "开源"],
    body:
      "OpenSCAD 用代码描述三维模型：写脚本定义形状和尺寸，再渲染成网格导出。它解决的是「要一个尺寸精确、可复用、能进版本管理的零件」。\n工作方式是纯文本的：用 cube、cylinder 这类基本体做布尔运算和变换，变量可以参数化，改一个数字就重新生成整个模型——同一份脚本调参数就能出一整套规格。它特别适合 3D 打印件、夹具这类以尺寸为准的零件。\n代价要提前知道：它不是交互式建模，没有鼠标拖拽雕塑，想做有机曲面应该去 Blender 或 FreeCAD；复杂模型渲染要等，F5 只是预览、F6 才真正计算网格；导出 STL 前要检查是否流形，破面会让切片软件报错。\n许可证为 GPL-2.0（上游 COPYING 为 GPL 第二版，并附带 CGAL 链接例外；GitHub 自动识别为 NOASSERTION）。安装包从 openscad.org 下载，Windows、macOS、Linux 都有。",
    officialUrl: "https://openscad.org/downloads.html",
    links: {
      official: "https://openscad.org/downloads.html",
      github: "https://github.com/openscad/openscad",
    },
    officialLabel: "openscad.org",
    whoFor: "喜欢用代码控制尺寸，做可参数化的打印件。",
    whoNot: "想靠鼠标雕塑有机外形，看 Blender 或 FreeCAD。",
    installTips: [
      "从 openscad.org 安装。",
      "F5 预览、F6 渲染；复杂模型渲染要等。",
      "导出 STL 前检查流形，避免打印软件报破面。",
    ],
    guide: {
      intro: "从 CSG 建模的思路讲起，讲到 render 与 preview 的差别、布尔运算的常见失败，以及命令行批量导出模型的方法。",
      markdown: `## CSG 思维：代码不是画图，是做运算

OpenSCAD 不是 CAD 建模器，**没有草图、没有特征树**。它是一个 CSG（实体构造几何）解释器：你写的每个对象都可以用 \`difference()\` \`union()\` \`intersection()\` 组合成一个新实体。

这决定了写法上的根本差别——尺寸参数化的方式只有两种：直接给常量，或者引用 \`局部变量\`。约束驱动的建模（孔距随边长自动变化）在这里做不了，得自己在代码里算：

\`\`\`openscad
// 参数化挂架：所有尺寸由 width 推导，改一个数整体联动
width = 60;  depth = 40;  thickness = 5;  hole_d = 4;
wall  = 8;                 // 边到孔中心的距离
// ----
module bracket() {
    difference() {
        cube([width, depth, thickness]);
        // 四个安装孔，位置随 width/depth 自动算
        for (x = [wall, width - wall])
            for (y = [wall, depth - wall])
                translate([x, y, -1])
                    cylinder(h = thickness + 2, d = hole_d, $fn = 32);
    }
}
bracket();
\`\`\`

## $fn、$fa、$fs：圆弧精度

只要用到 \`cylinder()\` 或 \`circle()\`，就必须搞清这三个特殊变量：

- \`$fn\`：固定的分段数。\`$fn=32\` 就是 32 段。
- \`$fa\`：最小角度（默认 12°）。
- \`$fs\`：最小弦长（默认 2）。

\`$fn\` 是**全局**的，写在后面会影响前面所有圆。局部用要自己收敛作用域——在 module 内部写 \`$fn = 48;\`，只对该 module 内的 \`cylinder()\` 生效。

漏写 \`$fn\` 是最常见的错误，表现为圆孔渲染成多边形。默认值下小圆可能只有 5~6 段，肉眼能看出棱角。

## render 与 preview 的关键差异

F5 是 **preview**，F6 是 **render**，两者行为不同：

| | Preview (F5) | Render (F6) |
| --- | --- | --- |
| 实现 | CSG 预览，近似 | 实际几何计算 |
| \`%\` 修饰符 | 按 CSG 处理 | 忽略，只作标记 |
| \`#\` 修饰符 | 隐藏但参与运算 | 只显示，不参与运算 |
| \`!\` 修饰符 | 忽略修饰作用 | 真的只显示不参与 |
| 模块化 | 局部变量可能不更新 | 准确 |
| 速度 | 快 | 慢 |

**preview 下 \`!\` 修饰符不生效**，会让本该排除的调试对象参与运算，导致画面里凭空多出东西。所以预览结果和 F6 不一致时，先去掉调试用的 \`!\` 修饰符再试。

## 布尔运算失败排查

\`difference()\` 出来的东西不对，排查顺序：

1. **减的对象没真正相交**。两个面刚好接触（共面共边）时结果可能不可预期。技巧是把被减对象略微超出：\`translate([0,0,-1]) cylinder(h = height + 2, ...)\`。
2. **$fn 不一致**。被减对象和工件的圆分段数不同，边界会出现残留薄片。统一 \`$fn\`。
3. **悬空几何**。用 preview 看 \`union()\` 后的形状是否连成一体。
4. **minkowski 太慢**。它是最慢的运算，\`$fn\` 一大就基本卡死。改成先做二维轮廓布尔再 \`linear_extrude()\` 拉伸，同样效果快一个数量级。

## 命令行批量导出

预览是给看的，真正要交付的是网格文件。用 \`-o\` 指定输出格式，扩展名决定导出类型：

\`\`\`bash
# 导出 STL（3D 打印）；导出 3MF 用 -o part.3mf，可保留颜色
openscad -o part.stl part.scad
# ----
# 输出 PNG 渲染图做几何检查（需要图形环境）
openscad -o preview.png --render --camera=0,0,0,55,0,45,140 part.scad
# ----
# 用 -D 覆盖代码里的默认值，批量出不同尺寸
openscad -D width=80 -D depth=50 -o custom.stl part.scad
\`\`\`

\`--render\` 走 F6 的真实几何计算，比默认预览慢但结果准确，批量生产时应该加上。导出的 STL 是二进制还是 ASCII 可用 \`--export-format\` 控制，二进制体积小很多。`,
      resources: [
        {
          kind: "html",
          title: "OpenSCAD 项目 README",
          url: "https://github.com/openscad/openscad/blob/master/README.md",
          note: "官方仓库说明，含编译步骤、命令行参数完整列表与依赖说明。",
        },
        {
          kind: "link",
          title: "OpenSCAD 官方文档",
          url: "https://openscad.org/documentation.html",
          note: "官方 User Manual，涵盖全部内置模块、修饰符语义与变换操作。",
        },
      ],
    },
    alternatives: ["freecad", "blender"],
    icon: { letter: "O", color: "#EAD818" },
  },
  {
    slug: "caddy",
    license: "Apache-2.0",
    linksCheckedAt: "2026-10-06",
    name: "Caddy",
    nameZh: "Caddy",
    aliases: ["caddy", "caddyserver", "web 服务器", "https 服务器", "反向代理"],
    summary: "写几行配置就自动拿到 HTTPS 证书，反代和静态文件一起搞定，不需要碰证书续期。",
    scenes: ["code", "engineering"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["Web 服务器", "HTTPS", "反向代理", "开源"],
    body: "Caddy 是用 Go 写的 HTTP 服务器，主打「HTTPS 不用配」。传统做法是 certbot：申请证书、配续期定时任务、处理续期失败。少一步就掉链子——续期任务静默失败，证书过期那天才发现。Caddy 把这件事写进了协议本身：Caddyfile 里出现一个真实域名，它就自动申请并续期证书，没有定时任务可配。\n配置是单文件 Caddyfile，语法接近 nginx 但短得多。常见需求——静态目录、反向代理、自动跳转 https、gzip——各是一两行。反向代理开箱支持 WebSocket，不用额外配置。\n代价要提前知道：配置文件位置不统一，官方不强制，macOS 与 Windows 随安装方式变；模块多但概念少，碰到冷门需求可能要落到 JSON 配置；数据目录里存着 TLS 私钥，不能当缓存清。适合已经决定「就用它」的人——从 nginx 迁过来要重写配置，收益未必抵得上重写成本。",
    officialUrl: "https://caddyserver.com/",
    officialLabel: "caddyserver.com",
    links: {
      official: "https://caddyserver.com/",
      github: "https://github.com/caddyserver/caddy",
    },
    whoFor: "要把自己的服务暴露到公网、需要一张可信的 HTTPS 证书，又不想学 certbot 与续期 cron 的人。",
    whoNot: "只在本机跑个开发服务器；或者已经在同一台机器上用 nginx 跑得顺，不打算为自动证书换掉它。",
    installTips: [
      "Debian/Ubuntu 别直接用 apt 源里的包，版本往往落后好几轮。官方仓库要先导入 signing key 再装。",
      "装完先看 systemctl status caddy 有没有起来。装包会自动注册并启动 systemd 服务，不需要手动 run。",
      "证书要放在数据目录里，那个目录不能当缓存清——里面有私钥和 OCSP staple，清了要重新申请。",
    ],
    alternatives: ["nodejs"],
    icon: {
      letter: "C",
      color: "#2D3142",
      simpleIcon: "caddy",
    },
    guide: {
      intro: "以「第一次部署会卡在哪」为主线：自动 HTTPS 到底做了什么、80/443 端口为什么必须留着、改配置为什么不能重启、以及数据目录为什么不能清。",
      markdown: `## 自动 HTTPS 到底省掉了什么

传统做法是 certbot 或 acme.sh：申请证书、配置续期定时任务、处理续期失败。少一步就掉链子——续期任务静默失败，证书过期那天才发现。

Caddy 把这件事写进了协议本身：**Caddyfile 里出现一个真实域名，Caddy 就自动去申请证书并自己续期**，不用配任何定时任务。

最小配置只有一行：

\`\`\`caddy
example.com {
    root * /var/www/html
    file_server
}
\`\`\`

这一个块做了三件事：监听 80 与 443、为 \`example.com\` 申请并续期证书、把 \`/var/www/html\` 当静态目录发出去。

## 端口不能省

80 和 443 要同时留着。80 端口不是「http 的备用口」，验证和跳转都要用：Let's Encrypt 的 HTTP-01 验证走 80 端口，所有 http 请求也靠它跳到 https。

Caddy 默认在这两个端口上监听。改端口配置去做非标准端口当然可以，但那样就**失去了自动 HTTPS**——证书验证和跳转都依赖标准端口。

容器里要注意：镜像默认不会占用宿主机的 80/443，映射时显式写出来。

\`\`\`bash
docker run -d -p 80:80 -p 443:443 -p 443:443/udp \\
  -v $PWD/Caddyfile:/etc/caddy/Caddyfile \\
  caddy
\`\`\`

443 的 **UDP 也要映射**。这是 HTTP/3（基于 QUIC）用的，只映射 TCP 的话 HTTP/3 不会生效——不会坏，只是回落成 HTTP/2。追求完整行为才需要它。

## 内网地址不申请证书

\`localhost\`、IP 地址、\`.local\` 结尾的域名这类**内部主机名不触发证书申请**，Caddy 直接按 HTTP 处理。所以本地调试不需要任何证书配置。

想让内网域名也用上正规证书，用 \`tls internal\` 签一张自签证书：

\`\`\`caddy
nas.lan {
    tls internal
    reverse_proxy localhost:8080
}
\`\`\`

自签证书浏览器会警告，要手动信任。用 \`caddy trust\` 可以装进本机信任库。

## 改配置不要重启

**生产环境改配置用 \`caddy reload\`，不要 stop 再 start。** 重启意味着几秒到几十秒的连接中断，reload 是平滑的。

\`\`\`bash
caddy validate --config /etc/caddy/Caddyfile
caddy reload  --config /etc/caddy/Caddyfile
\`\`\`

\`caddy validate\` 值得单独说一句：它不只检查语法，还会**真的加载并初始化所有模块**，因此能抓出「语法对但证书文件不存在」这类问题。\`caddy adapt\` 只做语法转换，抓不到。

写完先 validate 再 reload，比 reload 失败后回滚省事。

\`\`\`bash
caddy fmt --overwrite /etc/caddy/Caddyfile
\`\`\`

\`caddy fmt --overwrite\` 会把 Caddyfile 按规范缩进整理好。手写的 Caddyfile 缩进常常乱七八糟，格式化之后 diff 清晰得多。

## 反向代理

代理到本地服务，\`reverse_proxy\` 一行就够：

\`\`\`caddy
api.example.com {
    reverse_proxy localhost:3000
}
\`\`\`

WebSocket 不需要额外配置，Caddy 会自动处理 Upgrade 头。

前面挂静态资源、后面兜 API，一个文件里写完：

\`\`\`caddy
example.com {
    handle /api/* {
        reverse_proxy localhost:3000
    }
    handle {
        root * /var/www/html
        file_server
    }
}
\`\`\`

\`handle\` 块**按顺序匹配，第一个命中的生效**，所以具体的放前面，兜底的放最后。这个顺序和 nginx 的 \`location\` 相反，写反了会全被兜底块吃掉。

## 文件在哪

| 内容 | Linux | macOS | Windows |
| --- | --- | --- | --- |
| 配置文件 | \`/etc/caddy/Caddyfile\` | 无固定位置 | 无固定位置 |
| 数据目录 | \`$HOME/.local/share/caddy\` | \`$HOME/Library/Application Support/Caddy\` | \`%AppData%\\Caddy\` |
| 配置目录 | \`$HOME/.config/caddy\` | \`$HOME/Library/Application Support/Caddy\` | \`%AppData%\\Caddy\` |

Caddy 官方**没有强制配置文件的统一位置**——除了当前目录下的 \`Caddyfile\` 会被自动找到。包管理器安装的版本把配置文件放在 \`/etc/caddy/Caddyfile\`。

macOS 与 Windows 用 Homebrew / Chocolatey / Scoop 装的，配置文件位置随安装方式变，用 \`caddy adapt\` 不带参数跑一次能看出它当前读的是哪个文件。

**数据目录不能当缓存清。** 里面有 TLS 私钥、证书、OCSP staple。删掉不会立刻坏，但下次启动要重新走一遍验证和申请。
`,
      resources: [
        {
          kind: "html",
          title: "安装：各系统的官方仓库与命令",
          url: "https://caddyserver.com/docs/install",
          note: "Debian/Fedora/Arch 的仓库导入步骤、macOS 与 Windows 的包管理器命令都在这一页。第三方包管理器单列且标注了「社区维护」。",
        },
        {
          kind: "html",
          title: "命令行：validate / reload / fmt 的用法差异",
          url: "https://caddyserver.com/docs/command-line",
          note: "解释了为什么 validate 比 adapt 更强（会真的初始化模块），以及 reload 依赖 admin 端点的原因。",
        },
      ],
    },
  },
  {
    slug: "tuios",
    license: "MIT",
    linksCheckedAt: "2026-10-06",
    name: "TUIOS",
    nameZh: "TUIOS",
    aliases: ["tuios", "tui os", "终端复用器", "窗口管理器", "终端多路复用"],
    summary: "终端里的平铺窗口管理器，vim 式模态操作加 9 个工作区，关掉终端窗口会话还在。",
    scenes: ["code", "tools"],
    platforms: ["linux", "macos", "windows"],
    source: "opensource",
    tags: ["终端", "窗口管理", "平铺", "开源"],
    body: "TUIOS 是用 Go 写的终端复用器与窗口管理器，跑在你已有的终端里（不接管终端模拟器）。它提供 vim 式模态界面：窗口管理模式下按 n 开新窗、z 放大窗口，终端模式下正常敲命令。\n最实用的两点是工作区与守护进程。9 个工作区互相隔离，切换是瞬间的；会话由一个 daemon 托管，关掉终端窗口进程还在，可以从另一台机器 attach 回来。这解决了 tmux 新手最常撞的「关掉窗口就丢会话」。\n它还额外做了 coding agent 的集成——窗格里的 agent 可以上报状态、互相发消息，有审批与收件箱。代价要提前知道：概念比 tmux 多（模态、prefix key、布局模板、hooks），学习曲线明显更陡；要求终端支持真彩色，kitty graphics 与 sixel 是加分项而非必需；功能密度高意味着配置文件项也多，配置页很长。\n如果只是要会话持久化，tmux 更省心；如果要的是「终端里的可视化工作区 + agent 协同」，它做的事 tmux 不做。",
    officialUrl: "https://tuios.dev",
    officialLabel: "tuios.dev",
    links: {
      official: "https://tuios.dev",
      github: "https://github.com/Gaurav-Gosain/tuios",
    },
    whoFor: "同时开很多终端窗口、想用平铺而不是叠放，并且希望关掉终端会话不丢的人。",
    whoNot: "只会开一个终端窗口；或者已经在用 tmux 且不打算重新学一套键位——概念多是有成本的。",
    installTips: [
      "macOS 与 Linux 走 Homebrew 最省事：brew install tuios。",
      "Windows 与 FreeBSD/OpenBSD 走 GitHub Releases 的预编译二进制，别自己编译——从源码构建要 Go 1.26.6 以上。",
      "第一次用先跑 tuios --show-keys，它会盖一层键位提示在界面上，照着按几遍比读文档快。",
    ],
    alternatives: ["vscode", "git"],
    icon: {
      letter: "T",
      color: "#4A4A6A",
    },
    guide: {
      intro: "以「两个模式怎么切」和「会话为什么不会丢」为主线讲清最常用的操作，再说明 daemon 模式与布局模板怎么用。",
      markdown: `## 先分清两个模式

tuios 有两种模式，**分不清这一点后面全乱**：

- **窗口管理模式（WM）** — 挪窗口、分屏、切工作区。按 \`n\` 开新窗、\`z\` 放大当前窗。
- **终端模式** — 就是普通 shell，键盘直接进程序。

默认落在 WM 模式。按 \`i\` 或 \`Enter\` 进终端模式，回到 WM 模式按 \`Prefix\`+\`Esc\` 或 \`Alt\`+\`Esc\`。

**一个坑：光按 \`Esc\` 是回到 shell，不是回到 WM 模式。** 想回 WM 模式必须带 prefix（默认 \`Ctrl\`+\`B\`）。新手按了 \`Esc\` 发现「怎么还在终端里」，多半是这个。

## 三个最该记的键

| 键 | 作用 |
| --- | --- |
| \`Ctrl\`+\`P\` | 命令面板，搜任意动作 |
| \`Alt\`+\`Space\` | 启动器，搜程序名，\`Enter\` 直接跑、\`Tab\` 敲出来 |
| \`Prefix\`+\`?\` | 帮助浮层 |

命令面板是**先学这个**的命令。键位表记不住很正常，\`Ctrl\`+\`P\` 里能搜到所有动作，包括临时改布局、切主题。

\`Alt\`+\`Space\` 比手动敲路径快：输入路径后按 \`Tab\` 会把整个路径补出来并留在输入行，直接 \`Enter\` 就执行。

## 平铺不是叠放

\`Prefix\`+\`Space\` 切换 BSP 平铺。BSP 的意思是**二分分割**：每次切分把当前区域对半分，新窗占一半、原窗占一半。

\`z\` 放大当前窗（再按一次还原），适合临时专注某一个窗。

## 会话为什么关不掉

默认 \`tuios\` 启动会连到一个 daemon 托管的会话，**所以关掉终端窗口，进程还在**。重新打开终端 \`tuios\` 就回来了。

\`\`\`bash
tuios new mysession          # 新建具名会话
tuios attach mysession       # 重新接上
tuios ls                     # 列出所有会话
tuios kill-session mysession # 干掉某个会话
\`\`\`

具名会话的价值在于**从另一台机器接回来**。这也是它和 tmux 最像的地方。

不想让会话持久化就用 \`--standalone\`，这次关掉就没了：

\`\`\`bash
tuios --standalone
\`\`\`

## 更新：先搞清谁在管这个二进制

\`\`\`bash
tuios update --check    # 只看有没有新版，不动
tuios update            # 拉新版并替换
\`\`\`

**这条命令只对「用安装脚本或 release 二进制」的人有效。** 用包管理器装的（Homebrew、Arch、Nix）不要用它，会和包管理器打架。\`tuios update\` 会自己检测你用的是哪种安装方式，并打印对应的正确命令，而不是硬覆盖。

从源码构建需要 **Go 1.26.6 或更新版本**——版本号很新，机器上 Go 旧了会直接编译失败。

## 布局模板

同一套窗格布局反复用，可以存成模板。

\`\`\`bash
tuios layout list            # 列出已存布局
tuios layout delete mysetup  # 删掉
tuios layout export mysetup  # 导出成 tape 脚本
\`\`\`

应用内操作：\`Ctrl\`+\`B\` 然后 \`L\` 再 \`l\` 加载、\`s\` 保存。

导出成 tape 脚本这一项值得留意——**布局能导出成可执行的脚本**，意味着可以把窗格布局接进自动化流程，而不只是手动摆一次。

## 配置

\`\`\`bash
tuios config edit      # 用 $EDITOR 打开配置
tuios keybinds list    # 看常用键位
tuios list-options     # 所有可调项
\`\`\`

可调项里几个常用的：\`show_clock\`、\`show_cpu\`、\`show_ram\`（状态栏显示什么）、\`shared_borders\`、\`window_button_style\`、\`window_button_position\`，以及自定义主题与键位绑定。

## 试用不用装

不想装可以先试：[tuios.dev/learn](https://tuios.dev/learn) 上是编译成 WebAssembly 的真实应用，每个窗格里配了一个练习 shell。
`,
      resources: [
        {
          kind: "html",
          title: "官方文档站：安装、配置与全部指令",
          url: "https://tuios.dev",
          note: "getting-started 页给的是完整的安装方式与首次会话流程；配置参考在 docs/configuration。README 里的 Quick Links 指的就是这些页。",
        },
        {
          kind: "html",
          title: "README：安装命令全表与架构说明",
          url: "https://github.com/Gaurav-Gosain/tuios/blob/main/README.md",
          note: "Homebrew / AUR / Nix / 脚本 / go install / Docker 六种安装方式，以及 daemon 模式与架构章节都在这里。",
        },
      ],
    },
  },
  {
    slug: "voicestudio",
    license: "AGPL-3.0-only",
    linksCheckedAt: "2026-10-06",
    name: "VoiceStudio",
    nameZh: "VoiceStudio",
    aliases: ["voicestudio", "voice studio", "声音克隆", "语音克隆", "配音", "有声书", "tts"],
    summary: "开源本地语音工作台：声音克隆、声音设计、视频配音、听写转录，646 种语言，Electron 桌面应用。",
    scenes: ["music", "tools", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["语音合成", "声音克隆", "视频配音", "开源", "本地运行"],
    body: "VoiceStudio 是一个 Electron 桌面应用，把语音相关的工作收进一个本地工作台：克隆一个已有声音、用文字描述设计一个新声音、给视频配时间轴对齐的配音、随时听写、转录，以及批量生成有声书。官方声明支持 646 种语言。\n它的架构值得先说清楚，因为这决定了它和别的工具怎么比。语音生成（文本转语音）和转录（语音转文本）是两套独立的引擎池，不是绑在一起的。生成侧有 16 个引擎可选，默认是 VoiceStudio 本身（底层基于 k2-fsa/OmniVoice）；转录侧有 9 个，默认 WhisperX。你可以只装其中一部分，也可以按引擎换。\n算力路由是自动的：NVIDIA 走 CUDA、Apple Silicon 走 Metal（MPS）、其他情况落到 CPU。落回 CPU 不会报错，只是慢很多倍。有两个硬件判断要提前知道：一是官方明确写了 Windows 上 PyTorch 只有 NVIDIA/CUDA 加速，AMD 和 Intel 显卡在 Windows 上跑 PyTorch 引擎仍然走 CPU（audio.cpp 可以通过 Vulkan 用上 Radeon）；二是显存，官方建议 16GB 以上才能并行跑 3-4 路生成，10GB 以下会被自动限制为单路——不要手动调高，这个自动 sizing 就是为了防崩溃。\n它还有一层别家没有的东西：面向智能体的本地 API 和 MCP，可以把配音流程接进 Claude Code 这类工具；README 里甚至给了一段提示词，让编码智能体自己完成硬件检测和安装验证。\n代价是明确的：模型要先下载、磁盘占用可观，官方给纯 CPU 路线报的是 PyTorch CPU 版约 5GB；功能密度高意味着设置项多，官方性能指南开头列的五类「变慢」原因基本都是配置或版本历史问题，需要读文档才能定位。此外应用是 AGPL-3.0，克隆他人声音前必须取得对方许可。",
    officialUrl: "https://voicestudio.sh",
    officialLabel: "voicestudio.sh",
    links: {
      official: "https://voicestudio.sh",
      github: "https://github.com/debpalash/VoiceStudio",
    },
    whoFor: "要在自己机器上做声音克隆、视频配音或批量有声书，并且愿意先下载几个模型、接受显卡依赖的人。",
    whoNot: "只想在线上快速出一段配音的人（要装模型、吃显存）；或者在 Windows 上只有 AMD/Intel 显卡又期待 GPU 加速的人——官方写明那是 CPU。",
    installTips: [
      "macOS 与 Linux 一条命令：curl -fsSL https://voicestudio.sh/install | sh，同一条命令加 --main 可构建主干分支，加 --version X.Y.Z 可指定版本。",
      "Windows 用 PowerShell：irm https://voicestudio.sh/install | iex，或去 Releases 下 .exe。",
      "装完先去 设置 → Performance & Device 看一眼当前算力设备（cuda / mps / cpu），这一栏能直接告诉你有没有真的在用显卡。",
      "第一次生成一定是最慢的（模型权重懒加载约 8 秒、CUDA 要编译内核），从第二次生成的耗时判断性能才有意义。",
    ],
    alternatives: ["audacity"],
    icon: {
      letter: "V",
      color: "#5B4B8A",
    },
    guide: {
      intro: "从四个工作区到引擎选择与硬件判断，讲清怎么把 VoiceStudio 装起来并跑通第一次合成。",
      markdown: `# VoiceStudio：本地语音工作台怎么用

## 它解决什么问题

做视频要配音、自己写的东西要转成有声书、或者需要把一段音频转成文字——这些活以前要么上云端（有隐私和费用问题），要么拼一堆脚本。VoiceStudio 把它们放进一个 Electron 桌面应用，本地跑模型。

四个工作区：

- **声音克隆**：选一个已有声音，或上传一段清晰的参考录音
- **视频配音**：生成时间轴对齐的音轨
- **声音设计**：用文字描述你想要的声音
- **本地模型**：安装和管理语音模型

## 最小可用路径

打开应用，进声音克隆工作区，选一个内置演示声音，或者加一段自己的参考录音。输入文字，点生成。应用会提示你安装所需模型——第一次必须等下载完。

就这样，一次完整的合成就跑通了。

## 安装

macOS 与 Linux 一键安装：

\`\`\`sh
# 最新版本
curl -fsSL https://voicestudio.sh/install | sh

# 指定已发布版本（替换 X.Y.Z）
curl -fsSL https://voicestudio.sh/install | sh -s -- --version X.Y.Z

# 构建当前 main 分支并安装
curl -fsSL https://voicestudio.sh/install | sh -s -- --main

# 卸载（保留你的数据）
curl -fsSL https://voicestudio.sh/install | sh -s -- --uninstall
\`\`\`

Windows 用 PowerShell：

\`\`\`powershell
irm https://voicestudio.sh/install | iex
\`\`\`

也可以直接去 Releases 拿现成包：macOS 是 .dmg，Windows 是 .exe，Linux 是 .AppImage 或 .deb。

想先看看界面而不装，可以看 [官网演示](https://voicestudio.sh) 上的 GIF。

## 让编码智能体帮你装

官方提供了一条提示词，粘给 Claude Code、Codex、Cursor 这类工具即可：

\`\`\`text
Install the VoiceStudio Electron app on this device and verify it works, following
https://github.com/debpalash/VoiceStudio/blob/main/docs/install/agent.md
\`\`\`

这份智能体安装指南覆盖硬件检测、复用已有数据、下载模型前先征得同意，以及跑一次测试生成。支持技能的智能体也可以直接跑 \`npx skills add debpalash/VoiceStudio\`。

## 硬件：先看这两个硬事实

**一、Windows 上只有 NVIDIA 能加速。** 官方原话：PyTorch GPU acceleration on Windows is NVIDIA/CUDA-only。AMD 和 Intel 显卡在 Windows 上跑 PyTorch 引擎仍然走 CPU——功能正常，只是慢很多倍。例外是 audio.cpp，它可以通过 Vulkan 用上 Radeon。

**二、显存决定并行度。** 官方建议 16GB 以上显存可以并行 3-4 路生成；10GB 以下的卡被刻意限制为单路。这个限制是自动的（按每 5GB 显存一个 worker，上限 4），别手动调高。

**三、参考录音的长度。** Voice Clone 接受最长 75 秒的录音，推荐 5-15 秒干净语音。不同引擎取用方式不同：默认的 OmniVoice 取前 20 秒里语音最多的片段并自动转写；VoxCPM2 取去静音后的前 30 秒；其余引擎是整段传入、长度未验证。

所以如果你的转写文本和引擎实际取用的片段对不上，生成会被拒绝（\`[clone_ref_too_long]\`）。最省事的做法是不带转写文本。

## 引擎：两套池子，别混

生成（TTS）侧 16 个引擎，转录（ASR）侧 9 个，它们是独立的：

| 侧 | 默认 | 几个可选项 |
|---|---|---|
| 语音生成 | VoiceStudio（基于 k2-fsa/OmniVoice） | VoxCPM2（带声音设计）、CosyVoice 3、GPT-SoVITS、IndexTTS 2.5、MOSS-TTS 系列、KittenTTS（纯 CPU，8 个预设声音） |
| 语音转录 | WhisperX | Faster-Whisper、MLX Whisper、Parakeet TDT、Moonshine、FunASR、sherpa-onnx（实时听写） |

有些引擎自带限制要留意：MLX-Audio 只在 Apple Silicon 上跑；MOSS-TTS-v1.5 是 8B 模型，很重；dots.tts 和 PocketTTS 不支持 Windows 或 Intel Mac。

在 **模型目录**（Model Catalogue）里选引擎，或者按 Ctrl/Cmd+E 快速切换。想固定某个引擎可以设 \`OMNIVOICE_TTS_BACKEND\` / \`OMNIVOICE_ASR_BACKEND\`。

## 遇到「变慢了」怎么查

性能指南开篇列的五类原因，按顺序排查：

1. **声音档案的 Transcript 字段是空的。** 克隆需要参考录音的转写文本，空的会让应用跑一次完整 Whisper 转写。v0.3.15 之前每次生成都会重跑一遍（就是那个「更新后 TTS 变慢、CPU 跑满」的回归问题）。修法：打开声音编辑器看 Transcript 框，空就填上内容。
2. **重启后第一次生成总是最慢。** 权重懒加载约 8 秒，CUDA 要编译内核。从第二次开始计时。
3. **内存压力。** 16GB 统一内存的机器上，旁边开 40 个标签页的浏览器就够把模型挤出内存。设置 → Performance 能看空闲内存，也有不重启释放模型的 Flush 操作。
4. **你以为在用显卡，其实在 CPU 上。** 三个地方会告诉你真相：设置 → Performance → Device & compute 里的实时设备名、设置 → About → Run self-check、以及模型目录里每个引擎的路由徽章（GPU active / CPU fallback / CPU，悬停能看到原因）。
5. **之前取消过一次配音。** 配音会把 TTS 模型临时挪到 CPU 给 ASR 腾显存，完成后再挪回来。v0.3.23 之前这条回迁只在完全成功时执行，中途取消或报错就会把 TTS 模型留在 CPU 上，之后每次生成都慢 10-50 倍。v0.3.23 修了。

## 接入你的智能体

它提供本地 API 和 MCP 接口，可以把配音流程接进自动化。配置看官方文档的 Local API 与 MCP 两页。

## 心里有数的限制

- **模型要先下载，磁盘吃得下。** 纯 CPU 路线 PyTorch 本体就约 5GB，模型另算。
- **AGPL-3.0。** 应用是开源的，模型各有各的条款——商用前挨个确认。克隆别人的声音必须先拿到对方许可。
- **只做本地。** 远程 worker 是可选功能，使用情况分析要同意才启用。
- **0.5.3 是最后一个 Tauri 版本。** 现在的桌面应用和 Web UI 全部是 Electron，Tauri 时代的用户需要单独迁移。

想读原文，中文 README 在仓库根目录，引擎与硬件细节在 docs/engines 和 docs/performance。
`,
      resources: [
        {
          kind: "link",
          title: "中文 README：安装、文档索引与许可说明",
          url: "https://github.com/debpalash/VoiceStudio/blob/main/README_CN.md",
          note: "官方维护的简体中文版，四工作区说明、一键安装命令、文档表格与赞助/许可段落都在这里；日文版另有 README_JA.md。",
        },
        {
          kind: "link",
          title: "引擎指南：16 个 TTS 引擎与 9 个 ASR 引擎的逐个说明",
          url: "https://github.com/debpalash/VoiceStudio/blob/main/docs/engines/README.md",
          note: "一张表列出每个引擎跑在什么设备上、支不支持克隆、需要什么才能启用（多数是 pip install 一行）；末尾的参考录音长度表解释了为什么转写文本可能被拒。",
        },
        {
          kind: "link",
          title: "性能指南：变慢的五类原因与可调项",
          url: "https://github.com/debpalash/VoiceStudio/blob/main/docs/performance.md",
          note: "最该先读的一篇。开头五类「变慢」原因按排查顺序排列，后半是环境变量表（显存自动 sizing、统一内存让位、生成超时预算）。",
        },
      ],
    },
  },
  {
    slug: "tilelang",
    license: "MIT",
    linksCheckedAt: "2026-10-06",
    name: "TileLang",
    nameZh: "TileLang",
    aliases: ["tilelang", "tile lang", "tile language", "tvm", "gpu kernel", "算子开发"],
    summary: "写 GPU kernel 的专用语言：Python 语法写 GEMM、FlashAttention 这类算子，编译器自动做分块与流水线调度。",
    scenes: ["code", "engineering", "data"],
    platforms: ["linux", "windows", "macos"],
    source: "opensource",
    tags: ["GPU", "算子", "编译器", "Python", "开源"],
    body: "TileLang 是一门写计算内核的领域特定语言，目标是让高性能 GPU/CPU/NPU kernel（GEMM、反量化 GEMM、FlashAttention、LinearAttention 这类）写起来短一点，同时不放弃底层优化。它用 Python 语法，底层编译器架在 TVM 上。\n它解决的问题很具体。你要用 CUDA C++ 写一个带分块、多级流水、Tensor Core 的 GEMM，光是共享内存布局、线程映射、向量化就得写几百行；TileLang 把这些变成声明：分块大小写成参数，流水线写成 `T.Pipelined(...)`，矩阵乘写成 `T.gemm`，剩下的交给编译器。\n生态位是「PyTorch 之下的那一层」。PyTorch 负责搭模型，TileLang 负责其中几个 kernel 跑得比库里快。如果整个模型都是你的，你大概不需要它；如果你在调优某个卡住的算子，它就是那把工具。\n后端覆盖是它目前最厚的一层：CUDA、ROCm（AMD）、Metal（Apple）、LLVM（CPU），2026-09-30 起还官方支持了华为昇腾 950 NPU。Windows 支持在 2026-05-25 的 v0.1.10 里明确提到有改进，Linux 是主力平台。\n几个要提前知道的：一是**版本号还在 0.1.x**，2026-08-03 的 v0.1.13 明确写着移除了若干旧 API，升级前要读兼容性说明；二是**@tilelang.jit 会在首次调用时按输入形状做特化编译**，也就是第一次调用是编译而不是执行；三是**它不是玩具级项目**——官方自己在 README 里推荐从 examples/quickstart.py 起步，然后看 gemm 目录里的布局与自动调优，配套还有独立的 LSP 服务器。",
    officialUrl: "https://tilelang.com",
    officialLabel: "tilelang.com",
    links: {
      official: "https://tilelang.com",
      github: "https://github.com/tile-ai/tilelang",
    },
    whoFor: "在写或调优 GPU 算子、已经会用 PyTorch 但卡在某个 kernel 性能上的人；以及想做 Tile 级调度实验的研究者。",
    whoNot: "刚入门深度学习、只想把模型跑起来的人——它不是模型框架，替代不了 PyTorch；也没有可视化调试界面，调试全靠打印 IR 和 pass diff。",
    installTips: [
      "PyPI 装稳定版就行：pip install tilelang，然后 python -c \"import tilelang; print(tilelang.__version__)\" 验证。",
      "想提前用新特性可以装 nightly：pip install tilelang --find-links https://tile-ai.github.io/whl/nightly，但官方明说 nightly 不如正式版稳。",
      "AMD 卡上先装 ROCm 版 PyTorch（pip install torch --index-url https://download.pytorch.org/whl/rocm7.0）再装 tilelang，运行时还需要主机侧装了 ROCm。",
      "源码构建、editable install、Docker、pip 提供的 CUDA 工具链、自定义 TVM checkout —— 这五种情况才需要看完整安装指南，装 PyPI 版的人不用看。",
    ],
    alternatives: ["python", "jupyter"],
    icon: {
      letter: "T",
      color: "#1F6F6B",
      simpleIcon: "nvidia",
    },
    guide: {
      intro: "从 pip 安装到跑通第一个 GEMM + ReLU 内核，再说明 T.Pipelined 与自动特化分别解决什么问题。",
      markdown: `# TileLang：写 GPU kernel 的专用语言

## 它站在哪一层

先用一张图定位关系，否则容易搞错用法：

- **PyTorch** 负责搭模型、跑训练、给张量
- **TileLang** 负责其中**少数几个 kernel** 写得更准更快
- **TVM** 底层的编译基础设施，TileLang 是架在它上面的 Python 前端

所以它的场景是「PyTorch 已经能跑，但某个算子成了瓶颈」。整个模型都是你自己的话，大概不需要它。

## 三种安装

稳定版（推荐）：

\`\`\`bash
pip install tilelang
python -c "import tilelang; print(tilelang.__version__)"
\`\`\`

Nightly（要新特性时用）：

\`\`\`bash
pip install tilelang --find-links https://tile-ai.github.io/whl/nightly
\`\`\`

AMD 卡（ROCm）需要两步，顺序不能反：

\`\`\`bash
pip install torch --index-url https://download.pytorch.org/whl/rocm7.0
pip install tilelang
\`\`\`

运行时主机侧必须已装 ROCm。同样的 Linux wheel 可以直接用。

如果你是源码构建、editable install、Docker、想让 pip 装 CUDA 工具链、或者要用自定义的 TVM checkout —— 这五种才需要读[完整安装指南](https://tilelang.com/get_started/Installation.html)，只从 PyPI 装的人跳过。

## 跑通第一个 kernel

这是官方 Quick Start 的完整代码，一个 FP16 GEMM 带 FP32 累加和融合的 ReLU 尾处理。读它比读文档快：

\`\`\`python
import torch
import tilelang
import tilelang.language as T


@tilelang.jit
def matmul_relu(A, B, block_M: int = 128, block_N: int = 128, block_K: int = 32):
    M, N, K = T.const("M, N, K")
    A: T.Tensor((M, K), T.float16)
    B: T.Tensor((K, N), T.float16)
    C = T.empty((M, N), T.float16)

    with T.Kernel(T.ceildiv(N, block_N), T.ceildiv(M, block_M), threads=128) as (bx, by):
        A_shared = T.alloc_shared((block_M, block_K), T.float16)
        B_shared = T.alloc_shared((block_K, block_N), T.float16)
        C_local = T.alloc_fragment((block_M, block_N), T.float32)

        T.clear(C_local)
        for k in T.Pipelined(T.ceildiv(K, block_K), num_stages=3):
            T.copy(A[by * block_M, k * block_K], A_shared)
            T.copy(B[k * block_K, bx * block_N], B_shared)
            T.gemm(A_shared, B_shared, C_local)

        for i, j in T.Parallel(block_M, block_N):
            C_local[i, j] = T.max(C_local[i, j], 0)

        T.copy(C_local, C[by * block_M, bx * block_N])

    return C


M = N = K = 1024
a = torch.randn((M, K), device="cuda", dtype=torch.float16)
b = torch.randn((K, N), device="cuda", dtype=torch.float16)
c = matmul_relu(a, b)
torch.testing.assert_close(c, torch.relu(a @ b), rtol=1e-2, atol=1e-2)
print("GEMM + ReLU passed.")
\`\`\`

跑起来会看到 \`GEMM + ReLU passed.\`。注意 PyTorch 在 ROCm 系统上用的设备名也叫 \`cuda\`，TileLang 会从当前环境自动选目标后端。

## 这段代码在说什么

四个关键构造，恰好是 TileLang 的全部心智负担：

- \`T.Kernel(..., threads=128)\` 声明网格与线程数，得到 \`(bx, by)\` 两个 block 索引
- \`T.alloc_shared\` / \`T.alloc_fragment\` 分别申请共享内存和寄存器片段——这两个名字对应了 CUDA 里手动写 \`__shared__\` 和局部数组
- \`T.Pipelined(..., num_stages=3)\` 是**流水**：三次数据搬运与计算重叠，CUDA 里要手写双缓冲或多缓冲，编译器帮你做
- \`T.gemm\` 把 tile 级的矩阵乘映射到目标后端；\`T.Parallel\` 表达逐元素的 ReLU 尾处理

**@tilelang.jit 值得单独说。** 它会按输入形状和编译期参数做特化，第一次调用触发的是编译不是执行。所以切换一个形状等于换一次编译——调试时别把第一次的慢当成性能问题。

## 从哪个例子开始

官方给的路线是：先跑 \`examples/quickstart.py\` 和 elementwise kernels，再进 gemm 目录看布局和自动调优。目录里值得知道的几类：

| 类别 | 目录 |
|---|---|
| 入门 | quickstart、elementwise |
| GEMM 与量化 | gemm、grouped_gemm、gemm_fp8、dequantize_gemm |
| 注意力 | flash_attention、flash_decoding、blocksparse_attention、linear_attention |
| 模型负载 | deepseek_mla、deepseek_v32、deepseek_v4 |
| 架构专用 | amd、gemm_tcgen05、gemm_sm120 |
| 编译器与调试 | analyze、plot_layout、autodd、iket |

注意 GEMM 那几个是**不同类别的量化/缩放路径**，不是同一件事的五个版本——dequantize、FP8、block-scaled 各对应一种数值格式。

## 后端覆盖

CUDA、ROCm、Metal、LLVM（CPU），2026-09-30 起官方支持华为昇腾 950 NPU。目标平台从环境自动判断，一般不用手选。

## 两个版本相关的提醒

一是**它还在 0.1.x**。2026-08-03 的 v0.1.13 移除了若干旧 API，跨版本升级前读兼容性说明。

二是**nightly 别当稳定版用**。官方原话是 nightly 可能不如正式发布稳。

## 调试工具

仓库里 \`examples/analyze\`、\`examples/plot_layout\`、\`examples/iket\` 分别对应分析、布局可视化、时间线插桩。社区另有独立的 LSP 实现（tile-ai/tilelang-lsp），提供 buffer 形状、dtype、scope 和推断布局的 inlay hint 以及精确诊断——写 TileLang 时把编辑器支持打开会省不少事。

## 上手顺序

1. \`pip install tilelang\`
2. 跑上面那段 GEMM + ReLU，确认输出 passed
3. 读语言基础（language_basics）
4. 复制 \`examples/quickstart.py\` 到本地改参数，先改 block_M/block_N 看性能怎么变
5. 打开 LSP，理解自己写的那几行分别对应什么硬件操作
`,
      resources: [
        {
          kind: "link",
          title: "官方文档站：安装指南与语言基础",
          url: "https://tilelang.com/get_started/Installation.html",
          note: "PyPI 装法之外的五种场景（源码、Docker、editable、自定义 TVM checkout、pip 版 CUDA 工具链）都在这里；AMD ROCm 的主机侧要求也有专节。",
        },
        {
          kind: "link",
          title: "examples 目录：按算子类别分的全部示例",
          url: "https://github.com/tile-ai/tilelang/tree/main/examples",
          note: "先跑 quickstart.py，再进 gemm 看布局与自动调优。另有 analyze / plot_layout / iket 三个调试工具目录。",
        },
        {
          kind: "link",
          title: "README 全文：更新日志、Quick Start 与 Examples 索引",
          url: "https://github.com/tile-ai/tilelang/blob/main/README.md",
          note: "更新日志本身就是版本兼容信息——每条都注明了是哪个 PR 和哪个版本引入的，升级前值得翻一遍。",
        },
      ],
    },
  },
  {
    slug: "effect",
    license: "MIT",
    linksCheckedAt: "2026-10-06",
    name: "Effect",
    nameZh: "Effect",
    aliases: ["effect", "effect ts", "effect-ts", "effectts", "typescript 函数式", "effect 4"],
    summary: "TypeScript 的生产级函数式框架：用类型表达错误、依赖注入、结构化并发、调度与追踪，4.x 为 LTS 版本。",
    scenes: ["code", "engineering"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["TypeScript", "函数式", "错误处理", "并发", "开源"],
    body: "Effect 是用来写生产级 TypeScript 应用的库，核心主张是把「规模化之后难处理的问题」变成类型系统能约束的东西：带类型的错误、依赖注入、结构化并发、调度、追踪、统一的 schema 校验。\n和普通工具库的区别在思路。它不满足于用 try/catch 捕获异常，而是让错误成为数据的一部分——错误通道的类型是显式的，你能穷举、能组合、编译器会检查你处理了没有。并发同理：它给的是结构化并发（Structured Concurrency），作用域结束会等里面所有任务收尾，而不是像 Promise.race 那样悬着。\n**环境要求是硬的，装之前先确认：** TypeScript 5.9 或更新（官方推荐 TypeScript 7，性能与工具链兼容性最好），Node.js 18 起步（部分集成包要更高，比如 @effect/sql-sqlite-node 要 22.16+），而且 tsconfig.json 里 strict 必须打开——不开 strict 基本用不了它。\n**版本这块要特别留意。** 现在是 Effect 4.x，一个 LTS（长期支持）版本：至少三年支持，含 bug 与安全修复；下个大版本发布后再保一年 bug 修复、两年安全修复。3.x 的源码在 v3 分支，跨大版本升级必须读迁移指南。\n生态是它真正的体量所在。这个 monorepo 里核心包 `effect` 之外还有 30 多个集成包，全部同步版本发布：五套 platform（browser / bun / deno / node / node-shared）、十一个 SQL 客户端（PostgreSQL、MySQL、ClickHouse、SQL Server、D1、libSQL、SQLite 的多种绑定、Durable Objects）、五个 AI provider（Anthropic、OpenAI、OpenAI-compat、Cloudflare、TypeSafe、OpenRouter）、三套前端状态绑定（React、Solid、Vue），以及 OpenTelemetry 集成、Vitest 测试辅助和文档工具。\n代价是学习曲线。它不是渐进采用的库——要么接受它的编程范式，要么一直写别扭的胶水代码。官方自己也很坦诚地提供了 adoption partners（实施、咨询、培训）和生产支持渠道，说明这是有落地成本的技术选型。",
    officialUrl: "https://effect.website",
    officialLabel: "effect.website",
    links: {
      official: "https://effect.website",
      github: "https://github.com/Effect-TS/effect",
    },
    whoFor: "在做长期维护的 TypeScript 后端服务、愿意为了错误处理和并发的可推断性改变编码范式的团队。",
    whoNot: "小项目、脚本、或者团队里没人愿意学新范式——Effect 的收益要在系统变复杂之后才显现，前期只会觉得啰嗦。",
    installTips: [
      "先确认三个硬条件：TypeScript ≥ 5.9、Node ≥ 18、tsconfig 里 strict 已开。第三条最容易漏。",
      "npm install effect 就一个包，别一上来装全套集成——按需加 @effect/platform-node 或某个 sql 包。",
      "在用 3.x 就先读 MIGRATION.md 再动，跨大版本有 API 变更。",
      "编辑器里把 Effect 的 LSP 配起来，错误通道的类型信息在 hover 里能省很多查文档的时间。",
    ],
    alternatives: ["nodejs", "vscode"],
    icon: {
      letter: "E",
      color: "#3B4A8C",
      simpleIcon: "typescript",
    },
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
  {
    slug: "opengym",
    license: "AGPL-3.0",
    linksCheckedAt: "2026-10-06",
    name: "openGym",
    nameZh: "openGym",
    aliases: ["opengym", "open gym", "健身记录", "力量训练", "自托管健身", "训练日志"],
    summary: "自托管的健身与体重记录：1324 个动作库、引导式训练、渐进规则与 PR 追踪，手机上用 passkey 登录。",
    scenes: ["data", "tools", "social"],
    platforms: ["linux", "windows", "macos"],
    source: "opensource",
    tags: ["健身", "自托管", "Docker", "渐进训练", "开源"],
    body: "openGym 是一个自托管的健身与体重追踪应用，一句话概括它的取向：**数据在你自己的机器上，代码你可以 fork，但用起来仍然像个现代 App**。\n它针对的痛点很具体——大多数健身 App 把数据放在别人服务器上、把用户推向订阅、公司倒闭数据就没了。openGym 的对照是：一条 `docker compose up` 就跑起来，没有别人的账号、没有订阅、没有广告、没有遥测。\n**规划能力是它最厚的一层。** 1324 个动作的动作库，带动画演示，可以按肌肉部位在身体图上浏览和筛选，也能按你家里有什么器械过滤。四个开箱计划（Push/Pull/Legs、Upper/Lower、Full Body、5×5）加载后就是普通可编辑的例程。细节做得比一般 App 细：单次训练可以移到别的某天而不动周计划；周起始日可选周一或周日；支持超级组、热身组、递减组、rest-pause、计时动作（平板支撑、悬垂、负重行走）、按时间和配速的有氧；杠铃、EZ 杠、六角杠和史密斯机的配重片计算器按你实际拥有的片子算。\n**训练时的取舍也值得说。** 引导式训练会自己开始、重量从上次数预填、组间自动跑休息计时、边练边识别 PR。休息日会告诉你下一次训练什么时候。可选的用力程度列用 RIR 或 RPE 表示并配色，每档配一句人话解释。\n**进阶规则不是写死的。** 每个例程或动作可以选线性、Greyskull LP、经过可见次数范围的双重进阶，或者加时间。每个目标值都会解释「为什么是这个数」；没完成的次数不会加重量，卡住了会触发减量周。这一层是它和普通记录 App 的分界。\n**数据是你自己的。** passkey 登录（Face ID、Touch ID、指纹），每个 profile 的数据跨设备同步；密码登录可以按实例开启，新设备用一次性码或二维码配对。两台设备同时编辑会合并而不是互相覆盖。可以从 FitNotes、Strong、Hevy 导入（CSV 或 API key），从 Apple Health 导入体重，随时导出成一个 JSON 文件。17 种语言，包括从右往左的阿拉伯语。\n**两个可选功能默认关闭，跑在你自己的服务器上，用你自己的 provider key：** AI 教练（起草一周例程，之后根据记录建议调整，每项改动都要你批准；支持 Anthropic、OpenAI、Gemini、任何 OpenAI 兼容端点、也支持 Ollama）和 MCP server（让 Claude Desktop 这类助手回答你的训练历史，只读、本地、不在 Docker 构建里）。\n代价说清楚：需要一台能跑 Docker 的机器（NAS、树莓派、服务器都行），首次启动会下载约 140MB 的动作媒体。手机要用 passkey 访问需要域名的 HTTPS，官方给了 Cloudflare Tunnel、Caddy、Traefik、nginx 四种方案，另有局域网 HTTPS 和 Kubernetes 的专门指南。界面是英文为主的移动端应用，没有桌面原生客户端（但浏览器可用）。",
    officialUrl: "https://opengym.duarte-santos.ch",
    officialLabel: "opengym.duarte-santos.ch",
    links: {
      official: "https://opengym.duarte-santos.ch",
      github: "https://github.com/DuarteSantos8/openGym",
    },
    whoFor: "自己做力量训练、认真记录进阶数据、并且不接受把健身历史托管在别人服务器上的人；有 NAS 或小服务器愿意跑 Docker。",
    whoNot: "只想记两笔就完事的人（1324 个动作的库和进阶规则是负担）；或者需要桌面原生应用的人——它只有移动端 Web 和 Android APK。",
    installTips: [
      "先试再装：官网的 in-browser demo 就是真实应用加示例数据，https://opengym.duarte-santos.ch/demo/ 打开就能点。",
      "正式部署四条命令走完：git clone、cp .env.example .env、docker compose pull、docker compose up -d。",
      "docker compose pull 拉的是预构建镜像（amd64 和 arm64 都有）；想本地构建加 --build。主机不需要装 Node。",
      "手机用 passkey 访问必须在域名上配 HTTPS，.env 里改两行；官方有 Cloudflare Tunnel / Caddy / Traefik / nginx 四个方案。",
      "首次启动会一次性下载约 140MB 的动作媒体，先知道这件事免得以为卡住了。",
    ],
    alternatives: ["immich", "esp32-c3-adblock"],
    icon: {
      letter: "G",
      color: "#2E7D5B",
    },
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
  {
    slug: "esp32-c3-adblock",
    license: "MIT",
    linksCheckedAt: "2026-10-06",
    name: "esp32-c3-adblock",
    nameZh: "ESP32-C3 广告拦截器",
    aliases: ["esp32-c3-adblock", "esp32 c3", "esp32", "adblock", "pi-hole", "pihole", "dns 拦截", "广告拦截"],
    summary: "跑在 2 美元 ESP32-C3 上的 DNS 广告拦截器：哈希存 flash 不用 PSRAM，14 万域名占 0.7MB 闪存、约 50KB 内存。",
    scenes: ["tools", "code", "data"],
    platforms: ["linux", "windows", "macos"],
    source: "opensource",
    tags: ["DNS", "广告拦截", "ESP32", "IoT", "开源"],
    body: "这是一个 Pi-hole 式的 DNS 广告拦截器，跑在一块 2 美元的 ESP32-C3 上，而且**不需要 PSRAM**。\n**技术上真正有意思的地方是它怎么存列表。** 多数 ESP32 DNS sinkhole 把域名列表（字符串）读进内存，所以要求外加 PSRAM；这个项目把域名存成**排序后的 40 位哈希写进 flash**，再二分查找。14 万多个域名占约 0.7MB flash，查询约 10 毫秒（含 WiFi 往返），内存只吃约 50KB。\n为什么是 40 位？这是那份 flash 预算下的甜点。碰撞按生日界算：14 万域名约 0 个碰撞，53.7 万时约 1 个（也就是有一个倒霉域名被误拦）。降到 32 位能省 20% flash，但 25 万域名时就会撞约 7 次；上 64 位则每个域名多浪费 3 字节去解决一个你不存在的问题。\n作者还说明这**不是 C3 的将就方案**：同样的技巧在更大的芯片上更划算——16MB flash 的 ESP32-S3 上用哈希能放约 270 万域名，而用字符串配 8MB PSRAM 只能放约 46.6 万。「哈希存 flash」在多数场景下都胜过「字符串存 PSRAM」，C3 只是把这个差距变得无法忽视。\n**功能上它做完了该做的事。** 屏蔽一个域名会连带屏蔽其子域名。支持 hosts 文件、纯域名列表、AdGuard/Adblock 基础规则（`||ads.example.com^` 屏蔽、`@@||ok.example.com^` 解除）三种格式的混合输入；正则、通配符、`$` 修饰符、双井号开头的装饰性规则这类 DNS 哈希列表表达不了的会被跳过并计数。首次 USB 烧录之后，固件和列表都能走 WiFi 更新——列表可以上传新构建的 blocklist.bin，也可以配一个 URL 让设备定期拉取，而默认列表每周一由 GitHub Actions 重新构建发布。WiFi 配网有开放热点 `C3-AdBlock-XXXX` 加捕获门户，不用重新烧录。\n**安全这一节要读，它写得比多数同类项目诚实。** 所有会改状态的端点都需要 HTTP Basic Auth；更关键的是每个变更端点还要求一个自定义 `X-Requested-With: c3-adblock` 头——因为浏览器会把缓存的 Basic Auth 凭据自动附到任何后续请求上，包括别的网页用一个图片标签指向 c3adblock.local/forgetwifi 触发的请求，没有 JS 也能做到。README 明说了 Basic Auth 在这里是**局域网信任边界控制，不是加密**：所有东西跑在 80 端口的明文 HTTP 上，这颗芯片没有现实预算跑 TLS；能嗅到你局域网流量的人可以离线读到 base64 的凭据。它防的是「同一网络里某个设备无凭据地调 API」和「浏览器标签页 CSRF」，不防路径上的攻击者。默认密码 `CHANGE_ME_WEB_PASSWORD` 是仓库里公开的值，固件会告警但**仍会正常启动**。\n代价与取舍：一块 ESP32-C3（SuperMini 约 2 美元）、需要稳定的 USB 供电（廉价松垮的转接头会在 WiFi 发射时让射频掉电）。4MB flash 有个硬取舍：固件 OTA 需要两个应用槽，留给列表约 1.3MB（**最多约 25 万域名**）；53.7 万的激进列表只装得下单应用分区表，那就**没有固件 OTA**了。这个选择在 partitions.csv 里。",
    officialUrl: "https://github.com/M-Abozaid/esp32-c3-adblock",
    officialLabel: "github.com/M-Abozaid/esp32-c3-adblock",
    links: {
      official: "https://github.com/M-Abozaid/esp32-c3-adblock",
      github: "https://github.com/M-Abozaid/esp32-c3-adblock",
    },
    whoFor: "有 ESP32-C3 或愿意买一块 SuperMini、想用一个不占内存的本地 DNS 拦掉全网广告，并且愿意自己烧录和配置列表的人。",
    whoNot: "要开箱即用图形界面的人（它是固件加一个网页面板，没有桌面应用）；或者对明文 HTTP 广播密码不放心的人——它明确说了这不是加密方案。",
    installTips: [
      "买 ESP32-C3 SuperMini（约 2 美元，4MB flash），不要买需要 PSRAM 的经典 ESP32——这套方案就是冲着「不用 PSRAM」去的。",
      "供电要稳：手机充电器或路由器 USB 口都行，廉价松垮的 USB-C→A 转接头会在 WiFi 发射时让射频掉电。USB-A→USB-C 转头可以直接插路由器背后的空闲 USB 口，不用电源和额外盒子。",
      "PlatformIO 必须用新版。发行版/apt 里的 platformio（比如 4.3.4）太老，会报 AttributeError: ... 'resultcallback'。",
      "烧录前先 cp src/secrets.example.h src/secrets.h 改密码。默认密码是仓库里公开的值，固件只告警不阻止启动。",
      "装外壳时天线端要留空：C3 的 PCB 天线是 USB-C 口对面短边上的折线，不要埋进塑料或靠近金属，否则 RSSI 会掉。层高 0.2mm、约 15% 填充，不需要支撑。",
    ],
    alternatives: ["immich", "opengym"],
    icon: {
      letter: "E",
      color: "#2B6CB0",
      simpleIcon: "espressif",
    },
    guide: {
      intro: "从烧录一次到之后只走 WiFi 更新，重点讲清 4MB flash 那个必须自己做的取舍。",
      markdown: `# esp32-c3-adblock：2 美元硬件上的 DNS 拦截

## 它凭什么不用 PSRAM

一句话：把域名存成**排序后的 40 位哈希写进 flash**，查询时二分查找。

\`\`\`text
查询进来 ──▶ 提取域名 ──▶ FNV-1a 哈希（含父后缀）
         ──▶ 二分查找 flash 哈希表
              ├─ 命中 ──▶ 回 0.0.0.0   （已拦截）
              └─ 未命中 ──▶ 转发给上游解析器，原样带回结果
\`\`\`

对比一下两种做法：

| | 字符串读进内存 | 本项目（哈希进 flash） |
|---|---|---|
| 硬件 | ESP32 + PSRAM（约 8 美元） | ESP32-C3，无 PSRAM（约 2 美元） |
| 14.1 万域名 | 约 2.5MB 内存 | **0.67MB flash** |
| 内存占用 | 大部分内存 | **约 50KB** |
| 查询方式 | 字符串比较 | 约 18 次 flash 读（含 WiFi 往返约 10ms） |
| 碰撞 | 不存在 | 14.1 万时 0 个，53.7 万时 1 个 |

**为什么是 40 位？** 这是那份 flash 预算下的甜点，碰撞按生日界算。降到 32 位省 20% flash，但 25 万域名时约 7 个碰撞；上 64 位每个域名多浪费 3 字节解决一个你不存在的问题。

这个技巧在更大的芯片上更划算，不是 C3 的将就：16MB flash 的 ESP32-S3 上哈希能放约 270 万域名，字符串配 8MB PSRAM 只能放约 46.6 万。

## 硬件

- 任意 **ESP32-C3** 开发板（测试用 C3 SuperMini），4MB flash，**不需要 PSRAM**
- 经典 ESP32（DevKit / WROOM，4MB）也能编：\`pio run -e esp32dev -t upload\`（社区贡献、仅编译验证，C3 才是测试目标）
- **供电要稳**：手机充电器或路由器 USB 口。廉价松垮的 USB-C→A 转接头会在 WiFi 发射时让射频掉电
- **USB-A → USB-C 转头**可以直接插路由器背后的空闲 USB 口，不需要电源、不需要额外盒子

仓库里有个 C3 SuperMini 的可打印外壳（\`hardware/esp32-c3-supermini-enclosure.stl\`）。打印要点：不需要支撑，层高 0.2mm、约 15% 填充；**天线端必须留空**——C3 的 PCB 天线是 USB-C 口对面短边上的折线，埋进塑料或靠近金属会掉 RSSI；通风口留着，板子空闲时约 45-55°C。

## 烧录（一次性）

需要较新的 PlatformIO：VSCode 的 PlatformIO 扩展自带的内核，或在 venv 里 \`pip install -U platformio\`。**发行版/apt 里的 platformio（比如 4.3.4）太老**，会报 \`AttributeError: ... 'resultcallback'\`。

\`\`\`bash
# 1. 复制 secrets 模板（已 gitignore，留在本地）并编辑
cp src/secrets.example.h src/secrets.h

# 2. 构建列表哈希表（默认 = StevenBlack base + Hagezi Light，约 10 万条）
python3 tools/build_blocklist.py data/blocklist.bin

# 3. 烧录固件 + 列表文件系统（唯一一次需要 USB）
pio run -t upload
pio run -t uploadfs

# 4. 看它启动，记下 IP / 打开面板
pio device monitor          # -> http://c3adblock.local
\`\`\`

\`WIFI_SSID\` / \`WIFI_PASS\` 可以留占位符，用设备上的配网门户。但 **\`WEB_USER\` / \`WEB_PASS\` / \`OTA_PASS\` 不是可选的**——它们守着面板上所有会改状态的端点和网络 OTA，必须填真值。

## 配网不用重烧

连不上（或者从没设过 \`secrets.h\`）时，它会开一个开放热点 **\`C3-AdBlock-XXXX\`** 带捕获门户。手机连上，选你的网络，输密码，完成。

换网络时：面板上点 **Forget WiFi**，或者开机时按住 **BOOT** 键，门户会重新出现。

## 之后只走 WiFi

面板（\`http://c3adblock.local\`）里都能做：

- **列表更新** —— 把新构建的 \`blocklist.bin\` 传到 Blocklist → Upload；或者在 Remote auto-update 里设一个 URL，设备按计划拉取。默认列表**每周一**由 GitHub Actions 重建并发布到固定地址，贴一次之后设备自己保持新鲜
- **固件更新** —— 把 \`.pio/build/c3/firmware.bin\` 传到 Firmware → OTA update，设备校验后重启进新镜像；也可以从命令行推：

\`\`\`bash
pio run -t upload --upload-port c3adblock.local --upload-protocol espota
\`\`\`

## 你必须自己做的取舍

**4MB flash 装不下所有东西。** 固件 OTA 需要两个应用槽，这会留下约 1.3MB 给列表，也就是**最多约 25 万域名**。而 53.7 万域名的激进版「ultimate」列表只装得下单应用分区表，**代价是没有固件 OTA**。

这个选择写在 \`partitions.csv\` 里。默认配置下 25 万域名是安全的选择。

## 自定义列表

\`build_blocklist.py OUT.bin [SOURCE ...]\` 接受 URL 和本地文件的任意混合，支持三种格式：

- **hosts 文件** —— \`0.0.0.0 ads.example.com\`
- **纯域名列表** —— 每行一个域名
- **AdGuard / Adblock 基础规则** —— \`||ads.example.com^\` 屏蔽，\`@@||ok.example.com^\` 解除

两个行为要知道：屏蔽一个域名会连带屏蔽其子域名；\`@@\` 规则**只解除那一条精确记录**，不能从被屏蔽的父域名下把某个子域挖出来。

DNS 哈希列表表达不了的规则（正则、通配符、\`$\` 修饰符、\`##\` 装饰性规则）会被跳过并计数。某个源下载不到时构建会**直接停止**，不会静默产出一个更短的列表（要跳过用 \`--allow-missing\`）。

## 安全：先读这一段

**所有改状态的端点都要 HTTP Basic Auth**：\`/ban\`、\`/addblock\`、\`/unblock\`、\`/forgetwifi\`、\`/upload\`、\`/update\`、\`/setupdate\`、\`/fetchnow\`。只读的 \`/\` 和 \`/stats.json\` 保持开放。

**但 Basic Auth 在这里是局域网信任边界控制，不是加密。** README 自己说得很直白：所有东西跑在 80 端口明文 HTTP 上，这颗芯片没有现实预算跑 TLS；凭据是 base64 每次请求都发，能嗅你局域网流量的人（开放 WiFi、ARP 欺骗）可以离线读到。它防的是「同网络某个设备无凭据调 API」和「浏览器标签页 CSRF」，**不防路径上的攻击者**。

还有一个更隐蔽的洞已经修了：浏览器会把缓存的 Basic Auth 凭据自动附到任何后续请求上——包括别的网页用一个 \`<img src="http://c3adblock.local/forgetwifi">\` 触发的请求，不需要 JS。所以每个变更端点还要求一个自定义 \`X-Requested-With: c3-adblock\` 头，\`<img>/自动提交的 \`<form>\` 附不上，只有同源 \`fetch()\` 能附。这也是为什么 \`/forgetwifi\` 不再是一个能直接访问的裸 URL，要用面板上的按钮。

**默认密码必须改。** 如果 \`secrets.h\` 里还是示例文件的 \`CHANGE_ME_WEB_PASSWORD\` / \`CHANGE_ME_OTA_PASSWORD\`，设备会带着一个公开的密码启动——固件会在串口打警告、在面板上显示横幅，但**它照样启动运行**。

配网门户的开放热点（\`C3-AdBlock-XXXX\`）是设计如此、不加密的：它得能在你还不知道密码的时候被连上。

## 验证

把设备的 DNS 指向 C3 的 IP，或者把它作为主 DNS 后面的**备用解析器**加进去。然后：

\`\`\`bash
dig @<c3-ip> doubleclick.net   # -> 0.0.0.0  （已拦截）
dig @<c3-ip> github.com        # -> 真实 IP  （已转发）
\`\`\`

## 硬件侧的两个提示

第一，**别用松垮的转接头**。第二，外壳打印时**天线端留空**——C3 的 PCB 天线是 USB-C 对面短边上的折线。这两个是这类小项目最容易踩、也最难排查的坑。
`,
      resources: [
        {
          kind: "link",
          title: "README 全文：技术原理、烧录步骤与安全模型",
          url: "https://github.com/M-Abozaid/esp32-c3-adblock/blob/main/README.md",
          note: "最该读的是 Security 一节——README 明说 Basic Auth 是局域网信任边界控制而非加密，并解释了为什么每个变更端点还要额外要求 X-Requested-With 头。",
        },
        {
          kind: "link",
          title: "build_blocklist.py：把各种格式的列表编译成 flash 哈希表",
          url: "https://github.com/M-Abozaid/esp32-c3-adblock/blob/main/tools/build_blocklist.py",
          note: "支持 hosts 文件、纯域名列表、AdGuard 基础规则三种输入混合；源下载失败会直接中止而不是静默产出更短的列表。",
        },
        {
          kind: "link",
          title: "Releases：预构建固件与每周一的列表构建产物",
          url: "https://github.com/M-Abozaid/esp32-c3-adblock/releases",
          note: "blocklist 标签下的 blocklist.bin 是固定的周期性产物 URL，贴进面板的 Remote auto-update 就能保持列表自动新鲜。",
        },
      ],
    },
  },
  {
    slug: "anyps5",
    license: "GPL-2.0-only",
    linksCheckedAt: "2026-10-06",
    name: "AnyPS5",
    nameZh: "AnyPS5",
    aliases: ["anyps5", "ps5", "ps5 移植", "游戏移植", "主机模拟", "relinker"],
    summary: "把 PS5 可执行文件自动转成 Linux/Windows 原生程序的移植工具：重链接器加系统库实现，无模拟无额外运行时。",
    scenes: ["code", "games", "engineering"],
    platforms: ["linux", "windows"],
    source: "opensource",
    tags: ["PS5", "移植", "逆向", "C++", "开源"],
    body: "AnyPS5 是一个把 PS5 可执行文件自动移植到 Linux 和 Windows 的工具。核心是一个 **relinker（重链接器）**，把可执行文件转换成目标系统的原生格式，加上供动态链接用的**系统 prx 库实现**。关键在最后一句：**没有模拟，也没有额外的运行时进程**。\n和模拟器路线（比如 PCSX2、RPCS3 那类）的区别是根本性的：它不是解释执行，而是把程序翻译成你机器的原生指令直接跑。代价是兼容性完全取决于「这个游戏用到的东西有没有被实现」。\n**当前状态要如实看，而且它比 README 给人的印象乐观得多。** 官方 README 里那张「测试过的游戏只有一款」的表格，以及独立的 `docs/user/COMPATIBILITY.md`，都已经从仓库移除；兼容性改由社区维护的 blocker map 承接，逐游戏给出所处阶段、卡在哪个未解 issue 上，以及库与 GPU 的覆盖情况。截至 2026-10-14，它跟踪 215 款游戏，其中 4 款已到 **Playable**（Animal Well、Dreaming Sarah、Hollow Knight: Silksong、Road of Death），23 款进到菜单，71 款仍有未解阻塞项；阶段序列是 Converts → Loads → Starts → First draw → Presents → Menus → Ingame → Playable。Dreaming Sarah 那条老实测也没被丢掉，被地图当成「存档自已移除的 COMPATIBILITY.md」保留了：GTX 1050 Ti / i5-7500 稳定 60 FPS，Intel HD Graphics 620 / i5-7200 36 FPS。要留意它自己的声明——社区项目，建在公开 GitHub 数据上，不是官方页面。系统库和着色器的完成度仍用徽章展示，进度页在 boykopovar.github.io/AnyPS5/progress.html，官方标明那只是「项目已知函数的比例」，不是固件导出的全量，也不等于 ABI 兼容或可玩。\n架构上还有一条硬约束：**遇到不支持或不符合预期的状态会严格抛 `std::runtime_error`，what() 打到 stderr 然后进程终止。** 不做静默降级——这是研究型项目的常见选择，代价是任何未实现的系统调用都会让程序直接崩。\n着色器这块有实打实的产出：shader 重编译器能成功生成 SPIR-V，并且在开启 `ANYPS5_ENABLE_SPIRV_TOOLS` 构建时用 Spirv-Tools 做校验。\n手柄支持是完整的：SDL 映射的游戏手柄都支持，包括摇杆和扳机。键鼠要在 `anyps5-input.ini` 里配置。\n**必须说清的前提：** 官方声明该项目面向互操作性、研究、保存与兼容性用途，**不包含、不分发、也不需要任何受版权保护的软件、固件、加密密钥或专有库**。用户需要自己确保手上的二进制来源合法且符合许可条款。翻译成实际使用：\n**能不能跑完全取决于那款游戏的兼容情况**，请先查社区 blocker map 里你的目标游戏处在哪个阶段、卡在什么上面，再决定投入时间。",
    officialUrl: "https://github.com/boykopovar/AnyPS5",
    officialLabel: "github.com/boykopovar/AnyPS5",
    links: {
      official: "https://github.com/boykopovar/AnyPS5",
      github: "https://github.com/boykopovar/AnyPS5",
    },
    whoFor: "做逆向工程与跨平台移植研究的开发者；或者想在自己 Linux/Windows 机器上原生跑某个特定 PS5 游戏、且愿意接受只有少数游戏可用的现实的人。",
    whoNot: "想找「PS5 游戏全兼容」方案的人——社区地图跟踪的 215 款里只有 4 款到 Playable，大多数停在启动或开场画面上；也不适合不懂命令行、不愿意自己准备合法二进制的人。",
    installTips: [
      "先查兼容列表再动手。官方原先的 docs/user/COMPATIBILITY.md 已被上游删除，README 的 Compatibility 一节现在指向社区维护的 blocker map 与 Game bring-up 讨论区；确认你的目标游戏不在阻塞项里再投入时间。",
      "relinker 没有 --help。不带参数运行会打印用法语法并以错误码退出——这就是它的帮助信息。",
      "所有开关默认关闭，unused-filter 默认 0、--rpath 默认 $ORIGIN/libs。别照抄别人的命令行，选项是逐个叠加的。",
      "在 Windows 上用 --rpath 时要加引号，PowerShell 里写 '$ORIGIN/libs'，否则 $ORIGIN 会被 shell 展开掉。",
    ],
    alternatives: [],
    icon: {
      letter: "A",
      color: "#4A5568",
      simpleIcon: "gamepad",
    },
    guide: {
      intro: "从 relinker 的输入组织、关键选项到运行目录布局，说明这个工具的硬约束在哪。",
      markdown: `# AnyPS5：PS5 可执行文件移植

## 它在做什么

两个部件：

- **relinker** —— 把 PS5 的 ELF 可执行文件重链接成目标系统的原生格式
- **系统 prx 库实现** —— 提供动态链接所需的 prx

**没有模拟，没有单独的运行时进程。** 程序最终是原生指令直接跑在你机器上。

对照一下就明白代价：模拟器路线是「实现一整套主机行为」，这条路是「翻译这一个程序用到的那部分」。后者快、也干净，但任何游戏用到未实现的东西就会撞墙。

## 准备输入

用一个**干净的** ELF 可执行文件。把它自带的 ELF 模块放到可执行文件旁边的 \`sce_module/\`、\`sce_modules/\` 或 \`prx/\` 目录里：

\`\`\`text
source/
    input.elf
    sce_module/
        <自带的 ELF 模块>
\`\`\`

**目录规则有两条容易踩的：**

- \`prx/\` 可以和 \`sce_module/\` 或 \`sce_modules/\` 其中之一共存
- \`sce_module/\` 和 \`sce_modules/\` **同时存在**是错误；三个都不存在也是错误

## 转换

Linux 输出：

\`\`\`sh
relinker source/input.elf app.elf
\`\`\`

Windows 输出：

\`\`\`sh
relinker --windows source/input.elf app.exe
\`\`\`

Intel 主机（AMD 专属指令转换）加 \`--to-intel\`。

**两个容易误解的点：**

- 输出格式默认是 Linux ELF，**跟文件名无关**。光写 \`.exe\` 不会选 Windows，必须显式 \`--windows\`。
- **没有 \`--help\` 标志。** 不带参数运行会打印用法语法并以错误码退出——这就是它的帮助。

## 选项

所有开关**默认关闭**。\`unused-filter\` 默认 0，\`--rpath\` 默认 \`$ORIGIN/libs\`。

| 选项 | 作用 |
|---|---|
| \`--windows\` | 产出 Windows PE 可执行文件 |
| \`--windows-diagnostics\` | 包含启动依赖诊断（需要 \`--windows\`） |
| \`--windows-gui\` | 选 Windows GUI 子系统而非控制台（需要 \`--windows\`） |
| \`--to-intel\` | 转换可支持的 AMD 专属指令；不支持的指令或转换桩不可达会报错 |
| \`unused-filter=0/1/2\` | 0 保留全部导入引用；1 用控制流与 GOT 访问分析过滤未用的非 PLT 导入；2 严格未用导入分析并压缩 PLT（不支持的分析场景会报错） |
| \`--registry\` | 在输出可执行文件旁写 \`<名字>.registry.json\` |
| \`--rpath <path>\` | 系统库搜索路径 |
| \`--autorun\` | 转换后运行输出、打印退出码、等 Enter |
| \`--skip-sce-module\` 等 | **已废弃**，仅用于调试 |

**关于废弃标志：** \`--skip-sce-module\`、\`--exclude-sce-module <file>\`、\`--skip-syscall-check\`、\`--lazy-binding\` 都已废弃。官方明确说带着这些标志运行会**极不稳定、不适合一般使用**，它们只用来调试。

\`unused-filter\` 不带 \`--\`，最多给一次。未知选项和多余的位置参数都是错误。

## 运行目录布局

路径相对于输出可执行文件：

\`\`\`text
app.elf (Linux) 或 app.exe (Windows)
libs/
    *.prx
app0/
    <应用资源>
    sce_module/
        <已转换的模块>
\`\`\`

要做三件事：把构建好的系统库从 \`build/core/libs/libs/*.prx\` 复制到 \`libs/\`（**注意用为目标系统构建的那份**）；把应用资源放进 \`app0/\`；relinker 会保留每个模块在 \`app0/\` 下的目录并打印它的准确路径。

输入目录如果叫 \`sce_modules/\` 或 \`prx/\`，对应地用它们。

## Windows 上一个容易踩的坑

Windows 上直接内存（\`sceKernelAllocateDirectMemory\`，每个标题最高 13824 MiB）是**在标题申请时全额提交**，不是按首次使用的页提交。系统提交上限（已装内存 + 页面文件大小，也就是任务管理器「已提交」那一行的第二个值）必须和其他所有已提交内存一起覆盖它。

不够的话会抛 \`create direct memory backing of 0x<n> bytes (<m> MiB)\` 并带 Windows 错误码。解法是加大页面文件或者关掉其他应用。

## 运行

Linux：

\`\`\`sh
chmod +x app.elf
./app.elf
\`\`\`

## 手柄与键鼠

SDL 映射的游戏手柄都支持，**包括摇杆和扳机**。键鼠要在 \`anyps5-input.ini\` 里配置，支持的设备和配置格式在 \`docs/user/INPUT_MAPPING.md\`。

## 出错时会怎样

**遇到不支持或不符合预期的状态，它会严格抛 \`std::runtime_error\`，把 what() 打到 stderr 然后终止进程。**

不静默降级、不假装成功。这对研究工具是正确取舍（你不会以为跑通了其实没跑），但也意味着任何未实现的系统调用都会让程序直接崩掉。

## 现在能跑什么

官方 README 里那张「只有一款测试过」的表格已经不在了，原先单独的 \`docs/user/COMPATIBILITY.md\` 也被删除。逐游戏的现状改由社区维护的 [blocker map](https://alxcbtw.github.io/anyps5-roadmap/) 承接：它从公开 GitHub 数据（issue、PR、discussion）里挖出每款游戏走到哪个阶段、卡在哪个未解的问题上。

截至 2026-10-14 它跟踪 215 款游戏，阶段序列是 Converts → Loads → Starts → First draw → Presents → Menus → Ingame → Playable，落在各阶段的款数是：

| 阶段 | 款数 |
|---|---|
| Playable | 4 |
| Ingame | 3 |
| Menus | 16 |
| Presents | 69 |
| First draw | 2 |
| Starts | 53 |
| Converts | 26 |

已到 **Playable** 的 4 款是 Animal Well、Dreaming Sarah、Hollow Knight: Silksong、Road of Death；另有 23 款进到菜单，71 款仍有未解阻塞项。Dreaming Sarah 那条老实测没被丢掉，地图把它作为「存档自已移除的 COMPATIBILITY.md」保留了下来：GTX 1050 Ti / i5-7500 稳定 60 FPS，Intel HD Graphics 620 / i5-7200 36 FPS。

要留意地图自己的声明：**社区项目，建在公开 GitHub 数据上，不是官方页面**，每个阶段都能追到它的来源。

库函数和着色器的完成度仍在官方进度页上有徽章（boykopovar.github.io/AnyPS5/progress.html），系统库那个百分比是「已声明的函数里项目已知的比例」，不是「所有 PS5 系统函数的比例」——总数会随着函数声明增加而涨。

**看这个百分比要理解它的增长方式。** 它衡量的是已知覆盖，不是完成度目标。

## 前提与边界

项目声明面向互操作性、研究、保存与兼容性用途，**不包含、不分发、也不需要受版权保护的软件、固件、加密密钥或专有库**。你需要自己确保手上的二进制来源合法、符合许可条款。

## 开发

仓库里还带了三份工程文档：\`docs/dev/BUILD.md\`（构建）、\`docs/dev/TechnicalDebt.md\`（技术债清单，53KB，是了解项目真实状态最有价值的一份）、\`docs/dev/CONVENTIONS.md\`（代码风格约定）。shader 重编译器在 \`core/shader/recompiler/Recompiler.cpp\`，能生成 SPIR-V，开 \`ANYPS5_ENABLE_SPIRV_TOOLS\` 构建时用 Spirv-Tools 校验。
`,
      resources: [
        {
          kind: "link",
          title: "使用文档：输入组织、全部选项与运行目录布局",
          url: "https://github.com/boykopovar/AnyPS5/blob/main/docs/user/USAGE.md",
          note: "含那张完整的选项表（每条都注明了前置条件和失败行为）、废弃标志清单，以及 Windows 直接内存提交那个坑的解法。",
        },
        {
          kind: "link",
          title: "已验证游戏兼容列表",
          url: "https://github.com/boykopovar/AnyPS5#compatibility",
          note: "原先是独立的 docs/user/COMPATIBILITY.md（只有 Dreaming Sarah 一行），该文件已被上游删除；现在改由 README 的 Compatibility 一节指向社区维护的 blocker map 与 Game bring-up 讨论区。",
        },
        {
          kind: "link",
          title: "技术债清单（53KB）",
          url: "https://github.com/boykopovar/AnyPS5/blob/main/docs/dev/TechnicalDebt.md",
          note: "了解项目真实状态最有价值的一份文档：哪些部分还是近似实现、哪些会抛 runtime_error，都在这里。",
        },
        {
          kind: "link",
          title: "社区 blocker map：逐游戏阶段、阻塞项与库/GPU 覆盖",
          url: "https://alxcbtw.github.io/anyps5-roadmap/",
          note: "非官方页面，但比官方 README 那句「只有一款测试过」准确得多：截至 2026-10-14 跟踪 215 款、4 款到 Playable、71 款仍有未解阻塞项。Dreaming Sarah 的老实测也被它存档保留。",
        },
      ],
    },
  },
  {
    slug: "yoinks",
    license: "MIT",
    linksCheckedAt: "2026-10-06",
    name: "yoinks",
    nameZh: "yoinks",
    aliases: ["yoinks", "视频下载", "yt-dlp 前端", "命令行下载", "terminal downloader"],
    summary: "终端里的视频下载器：粘贴链接、选分辨率或 mp3 就完事，支持 1800 多个站点，UI 是 React 写的终端界面。",
    scenes: ["tools", "social"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["命令行", "视频下载", "yt-dlp", "终端 UI", "开源"],
    body: "yoinks 是终端里的视频下载工具：粘贴一个链接、选一个分辨率（或者只要音频的 mp3）、完成。支持 YouTube、X/Twitter、Instagram、Threads、TikTok 和 1800 多个其他站点。\n它解决的痛点不是「能不能下载」——yt-dlp 早就能下载了——而是**yt-dlp 的命令行参数组合有多难记**。yoinks 把它包成一个全屏居中的终端界面：↑/↓（或 j/k，或数字键）选格式，回车确认，esc 返回，^c 退出。鼠标也能用，yoink 按钮、格式列表、页脚提示都可点，点头像回首页。**退出时会恢复你的 scrollback**，这点对经常在终端里干活的人很重要。\n工程上它很克制。底层就是 yt-dlp——**首次运行时下载独立的 yt-dlp 二进制到 `~/.yoinks/bin`，不需要装 Python**；你本地已经有 yt-dlp 就用你的。ffmpeg 从 PATH 找，找不到时用打包的 ffmpeg-static 兜底（合并高清流和提取 mp3 需要它）。UI 层用 Ink，也就是「终端里的 React」。\n**默认 auto 主题用的是你自己终端的前景色和背景色**，所以它自动跟随你的明暗主题，不需要猜。按 ^t 或点页脚的主题控件能在 auto / light / dark 之间循环（仅当次会话），`--theme` 参数可以指定某次启动的初始主题。\n文件默认存到 `~/Downloads`，下完把路径打印到终端。\n要提前知道的是**它现在还不能脚本化**：`--best` 和 `--mp3` 这类跳过选择器的标志、以及 `-o <dir>` 指定输出目录，都还在 roadmap 上。所以现在每次下载都要经过那个交互界面——批量或定时下载的场景它帮不上。roadmap 里还有播放列表/长帖多视频支持、剪贴板检测、自更新内置的 yt-dlp 二进制。\n作者在 README 里写了一段关于合理使用的话，值得原样记住：yoinks 是个人归档工具，下载内容可能违反平台服务条款，只下载你有权保留的内容，并对创作者保持尊重。\n代价：需要 Node 18+；它下载并执行第三方二进制（yt-dlp），介意供应链的话要自己评估。",
    officialUrl: "https://github.com/pablostanley/yoinks",
    officialLabel: "github.com/pablostanley/yoinks",
    links: {
      official: "https://github.com/pablostanley/yoinks",
      github: "https://github.com/pablostanley/yoinks",
    },
    whoFor: "在终端里干活、想下载自己有权保留的视频、不想记 yt-dlp 参数组合的人。",
    whoNot: "需要批量或脚本化下载的人——跳过选择器的 --best / --mp3 还在 roadmap；或者介意自动下载并执行第三方二进制的人。",
    installTips: [
      "全局装：npm install -g yoinks。不装也行：npx yoinks 直接跑。",
      "要求 Node 18+。yt-dlp 和 ffmpeg 会被自动获取或打包，不用自己装。",
      "第一次跑会下载独立的 yt-dlp 二进制到 ~/.yoinks/bin；本地已有 yt-dlp 就直接用你的。",
      "默认主题跟随你终端的配色。想固定：yoinks --theme light 或 --theme dark；运行中按 ^t 循环切换。",
      "文件下到 ~/Downloads，完事会把路径打印到终端。",
    ],
    alternatives: ["yt-dlp", "stremio-web"],
    icon: {
      letter: "Y",
      color: "#7B3FA0",
    },
    guide: {
      intro: "从安装到交互界面的按键约定，再讲清它现在还不能做什么（roadmap 里的脚本化能力）。",
      markdown: `# yoinks：终端里的视频下载

## 它包的是什么

底层就是 **yt-dlp**——你已经有 yt-dlp 的话，yoinks 解决的是参数组合难记的问题，不是下载能力本身。

\`\`\`sh
npm install -g yoinks
\`\`\`

或者不装直接跑：

\`\`\`sh
npx yoinks
\`\`\`

要求 Node 18+。其余依赖会自动获取或打包。

## 三条最常用的命令

\`\`\`sh
yoinks https://youtu.be/dQw4w9WgXcQ    # 直接进格式选择
yoinks                                 # 提示你输入 url
yoinks --theme light                   # 强制浅色配色
\`\`\`

## 界面怎么操作

yoinks 会接管终端（全屏、居中，**退出时恢复你的 scrollback**）：

| 操作 | 按键 |
|---|---|
| 选格式 | ↑/↓、j/k，或数字键 |
| 确认 | enter |
| 返回 | esc |
| 退出 | ^c |
| 循环主题 | ^t |

**鼠标也能用**：yoink 按钮、格式列表、页脚提示都可点，点 logo 回首页。

格式列表里除了各档分辨率，还有**只要音频的 mp3**，并标出预计文件大小。

## 主题

默认的 auto 主题**用你自己终端的前景色和背景色**，所以它会跟着你的明暗主题走，不用它猜。

- \`--theme auto\` / \`--theme light\` / \`--theme dark\` —— 指定某次启动的初始主题
- 运行中按 \`^t\` 或点页脚主题控件，在 auto / light / dark 之间循环（仅当次会话有效）

## 它怎么工作

- **yt-dlp** —— 首次运行时 yoinks 把独立的 yt-dlp 二进制下载到 \`~/.yoinks/bin\`，**不需要 Python**。你本地已经装了 yt-dlp 就用你的
- **ffmpeg** —— 从 PATH 找，找不到用打包的 \`ffmpeg-static\` 兜底。合并高清流和提取 mp3 需要它
- **UI** —— [Ink](https://github.com/vadimdemedes/ink)，也就是「终端里的 React」

## 现在还不能做的（别按脚本工具规划）

**roadmap 上还没实现的：**

- \`--best\` / \`--mp3\` 跳过选择器的标志（可脚本化模式）
- \`-o <dir>\` 指定输出文件夹
- 播放列表 / 长帖多视频支持
- 剪贴板检测（直接启动并自动建议你刚复制的 url）
- 内置 yt-dlp 二进制自更新

已完成的是发布到 npm（也就是 \`npm i -g yoinks\` / \`npx yoinks\` 那条）。

**这意味着现在每次下载都要走一遍交互界面。** 批量下载、定时下载、接进自动化流程——这些场景它帮不上。已完成的 checkbox 只有发布到 npm 那项。

## 开发

\`\`\`sh
npm install
npm run build        # 用 tsup 打包到 dist/
npm run dev          # 改动后重建
node dist/cli.js <url>
npm run typecheck
\`\`\`

想不发布就在本地当成全局命令用：\`npm link\`，之后在任何目录跑 \`yoinks\`。

## 合理使用

README 里作者自己写了一段，意思值得原样记住：yoinks 是个人归档工具，**下载内容可能违反某个平台的服务条款**——只下载你有权保留的内容，并对创作者保持尊重。

## 评估供应链时要知道

yoinks 会在首次运行时下载并执行第三方二进制（yt-dlp）。这是它的设计带来的便利（省掉装 Python），但如果你所在环境对供应链有要求，这是需要自己评估的一点。本地已有 yt-dlp 时它会用你的版本。
`,
      resources: [
        {
          kind: "link",
          title: "README 全文：用法、按键约定与 roadmap",
          url: "https://github.com/pablostanley/yoinks/blob/main/README.md",
          note: "Roadmap 那张表是判断「现在能干什么、不能干什么」的关键——脚本化标志和输出目录选项都还没实现。",
        },
        {
          kind: "link",
          title: "yt-dlp：底层下载引擎",
          url: "https://github.com/yt-dlp/yt-dlp",
          note: "yoinks 首次运行会下载它的独立二进制到 ~/.yoinks/bin。直接用 yt-dlp 的话选项更多，代价是要记参数。",
        },
      ],
    },
  },
  {
    slug: "stremio-web",
    license: "GPL-2.0",
    linksCheckedAt: "2026-10-06",
    name: "Stremio Web",
    nameZh: "Stremio 网页版",
    aliases: ["stremio", "stremio web", "web.stremio", "媒体中心", "影视聚合", "追剧"],
    summary: "Stremio 官方网页版媒体中心：addon 驱动的影视目录、跨设备同步、Chromecast 投屏、可装成 PWA。",
    scenes: ["tools", "social"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["媒体中心", "影视", "PWA", "开源", "投屏"],
    body: "Stremio Web 是 Stremio 的官方网页版界面，一个现代媒体中心——它的定位是「视频娱乐的一站式方案」。直接打开 https://web.stremio.com 就能用，不需要安装桌面客户端。\n\n**它的核心机制是 addon（插件）驱动的。** 电影、剧集、频道的目录来自 addon 提供的目录数据，而不是内置数据库。这决定了 Stremio 和传统媒体库应用的根本差别：**内容来源是可替换的**，装什么 addon 就有什么内容。字幕也走 addon，或者用本地的，并且样式可自定义。\n\n实用功能上：库（Library）和「继续观看」跟着 Stremio 账号跨设备同步；支持 Chromecast 投到电视；**播放器是键盘优先的**，不放鼠标也能控制全部播放；50 多种语言，由社区通过 stremio-translations 翻译；可作为独立 PWA 安装（装完有自己的图标，不走浏览器标签页）。\n\n**架构上它是一个「React 外壳 + Rust 内核」的组合，这一点值得单独说**，因为它不是纯前端项目：界面是 React（本仓库）；真正干活的是 **stremio-core**——Stremio 的 Rust 引擎，编译成 WebAssembly 跑在 Web Worker 里；播放走 **stremio-video**，它会按当前环境挑选合适的播放器实现。\n\n一句话概括分工：**UI 渲染状态，core 计算状态。** 所以它的性能特征更接近原生应用而不是网页。\n\n生态是它最强的部分，围绕它有一整套仓库：stremio-core（状态、addon 协议、库、同步）、stremio-video（播放器抽象）、stremio-translations（社区翻译）、**stremio-addon-sdk（用 Node.js 写自己的 addon）**。最后一个意味着你可以自己做一个 addon 加进任何 Stremio 客户端，包括网页版。\n\n要提前知道的两件事：一是**它需要账号**——同步功能依赖 Stremio 账号，本地播放不需要；二是**内容来源取决于你装的 addon**，官方不提供内容，它是目录和播放器的框架。所以「装上就能看」这个预期要调整：需要自己找到合适的 addon 并配置，这是它生态的运作方式。\n\n想自己部署一份的话也有官方 Docker 镜像。许可证是 GPL-2.0。",
    officialUrl: "https://web.stremio.com",
    officialLabel: "web.stremio.com",
    links: {
      official: "https://web.stremio.com",
      github: "https://github.com/Stremio/stremio-web",
    },
    whoFor: "想要一个不装客户端、开浏览器就能用、能投屏、能装成 PWA，并且愿意自己配置 addon 生态的媒体中心用户。",
    whoNot: "期待「装完就有影视库」的人——它不提供内容，内容来自你配置的 addon；或者不想注册账号的人——同步功能需要 Stremio 账号。",
    installTips: [
      "直接用：打开 https://web.stremio.com 就能用，不需要安装任何东西。",
      "想当原生应用用：在浏览器里把它装成 PWA，装完有独立图标、独立窗口。",
      "第一次用先解决 addon——内容目录全部来自 addon，官方不提供内容库。装完 addon 才有东西可看。",
      "要投屏用 Chromecast；键盘优先的播放器不放鼠标也能控制全部播放。",
      "想自己部署：docker build -t stremio-web . 然后 docker run -p 8080:8080 stremio-web。",
    ],
    alternatives: ["yoinks"],
    icon: {
      letter: "S",
      color: "#7B5BF5",
      simpleIcon: "stremio",
    },
    guide: {
      intro: "从直接打开网页版到理解它的 Rust 内核架构，再说明 addon 生态该怎么上手。",
      markdown: `# Stremio Web：浏览器里的媒体中心

## 先用起来

打开 [web.stremio.com](https://web.stremio.com) 就能用，不用装任何东西。

**但第一次用会看到一个空界面，这是正常的。** Stremio 不提供影视内容——它的目录数据全部来自 addon。你需要先装 addon，才会有东西可看。

## 为什么内容要靠 addon

这是理解 Stremio 最关键的一点。它不是一个「影视库应用」，而是一个**媒体中心框架**：

- 电影、剧集、频道的目录来自 addon 提供的目录数据
- 字幕也来自 addon，或者用本地文件（样式可自定义）
- 内容来源是**可替换的**——装什么 addon 就有什么内容

所以「装上就能看」这个预期要调整。找 addon、装 addon、配 addon 是使用它的一部分。

## 功能清单

| 功能 | 说明 |
|---|---|
| Addon 驱动 | 从 addon 目录发现电影、剧集和频道 |
| 跨设备同步 | 库和「继续观看」跟着 Stremio 账号走 |
| 投屏 | 通过 Chromecast 播到大屏 |
| 字幕 | addon 提供或本地，样式可定制 |
| 键盘优先播放器 | 不碰鼠标也能控制全部播放 |
| 50+ 语言 | 社区通过 stremio-translations 翻译 |
| 可安装 | 作为独立 PWA 运行 |

**装成 PWA 值得试**：装完有独立图标和独立窗口，用起来更像本地应用而不是网页标签页。

## 架构：React 外壳 + Rust 内核

这不是一个纯前端项目，搞清楚分工有助于理解它的行为：

- 界面是 **React**（本仓库）
- 真正干活的是 **stremio-core** —— Stremio 的 Rust 引擎，**编译成 WebAssembly 跑在 Web Worker 里**
- 播放走 **stremio-video**，它会按当前环境挑选合适的播放器实现

\`\`\`text
React UI  <-->  stremio-core (Rust → WASM, Web Worker)
                ↕                ↕
           Stremio API        Addons
React UI  -->  stremio-video
\`\`\`

一句话：**UI 渲染状态，core 计算状态。** 所以它的性能特征更接近原生应用而不是网页——后台计算不阻塞界面。

## 账号这件事

**需要 Stremio 账号**，同步功能（库、继续观看）依赖它。本地播放不需要账号。

如果只是在一台设备上看看不同步，其实可以先不管账号——但跨设备接着看是它比较实用的一个能力，值得注册。

## 生态：它最强的地方

围绕 stremio-web 有一整套官方仓库：

| 仓库 | 是什么 |
|---|---|
| [stremio-core](https://github.com/Stremio/stremio-core) | Rust 引擎：状态、addon 协议、库、同步 |
| [stremio-video](https://github.com/Stremio/stremio-video) | 这个界面用的播放器抽象 |
| [stremio-translations](https://github.com/Stremio/stremio-translations) | 社区翻译 |
| [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk) | **用 Node.js 写自己的 addon** |

**最后一行是重点。** 有了 SDK 你可以自己做一个 addon，加进任何 Stremio 客户端——包括这个网页版。这说明它的 addon 生态是开放的，不是封闭的官方商店。

## 自己跑一份

**直接用 Docker：**

\`\`\`bash
docker build -t stremio-web .
docker run -p 8080:8080 stremio-web
\`\`\`

## 从源码开发

需要 Node.js 22+ 和 pnpm 11+：

\`\`\`bash
pnpm install
pnpm start
\`\`\`

开发服务器跑在 \`http://localhost:8080\`。

| 命令 | 作用 |
|---|---|
| \`pnpm start\` | 开发服务器，带热重载 |
| \`pnpm run start-prod\` | 生产模式的开发服务器 |
| \`pnpm run build\` | 生产构建 |
| \`pnpm test\` | 跑测试 |
| \`pnpm run lint\` | 代码检查 |
| \`pnpm run scan-translations\` | 检查缺失的翻译键 |

最后一条对做汉化的人有用——它能告诉你哪些文案还没有中文。

## 参与贡献

Bug 报告和 PR 都欢迎，官方推荐从 \`good first issue\` 标签开始。想把 Stremio 翻译成你的语言，去 stremio-translations 贡献。

## 许可证

GPL-2.0，版权归 Smart Code OOD（2017-2026）。
`,
      resources: [
        {
          kind: "link",
          title: "在线版 web.stremio.com",
          url: "https://web.stremio.com",
          note: "官方网页版本体，不用安装即可使用。首次打开是空界面属正常——需要先装 addon 才有内容目录。",
        },
        {
          kind: "link",
          title: "stremio-addon-sdk：用 Node.js 写自己的 addon",
          url: "https://github.com/Stremio/stremio-addon-sdk",
          note: "生态开放的证据。写好的 addon 能加进任何 Stremio 客户端，包括网页版。",
        },
        {
          kind: "link",
          title: "stremio-core：Rust 引擎的源码",
          url: "https://github.com/Stremio/stremio-core",
          note: "理解它的性能特征要先看这个：状态、addon 协议、库和同步都在这里，编译成 WASM 跑在 Web Worker 里。",
        },
      ],
    },
  },
  {
    slug: "markitdown",
    license: "MIT",
    linksCheckedAt: "2026-10-06",
    name: "MarkItDown",
    nameZh: "MarkItDown",
    aliases: ["markitdown", "mark it down", "文档转 markdown", "pdf 转 markdown", "office 转 markdown"],
    summary: "微软的轻量 Python 工具，把 PDF、Office、图片、音频等文件转成保留结构的 Markdown，专为喂给 LLM 设计。",
    scenes: ["docs", "office", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["文档转换", "Markdown", "Python", "LLM", "开源"],
    body: "MarkItDown 是微软开源的一个轻量 Python 工具，把各种文件转成 Markdown，目标是给 LLM 和文本分析流水线用。\n\n**它的定位是「保留结构的 LLM 输入」，不是「高保真文档转换」。** README 说得直接：输出虽然通常还算可读、适合人看，但它是为了给文本分析工具消费的，**高保真转换不是它的目标**。想做版式保留的转换，它不合适。\n\n和同类的 textract 相比，它的差别在「保留重要文档结构」：标题、列表、表格、链接这些都尽量保住。为什么选 Markdown，README 给了理由——Markdown 极接近纯文本、标记极少，但仍能表达文档结构；而主流 LLM 原生就说 Markdown，且训练数据里大量是 Markdown，所以它理解得好；另外 Markdown 约定在 token 上很省。\n\n**支持范围很宽**：PDF、PowerPoint、Word、Excel、图片（EXIF 与 OCR）、音频（EXIF 与语音转录）、HTML、文本类（CSV/JSON/XML）、ZIP（遍历内容）、YouTube URL、EPUB，以及更多。\n\n**依赖可以只装一部分**，这点很实用——`[all]` 全装，或者只装你需要的格式（`[pdf, docx, pptx]`）。可选依赖一共十项：pptx、docx、xlsx、xls、pdf、outlook（Outlook 邮件）、az-doc-intel、az-content-understanding、audio-transcription、youtube-transcription。\n\n**要更强能力时有三层加码路径。** 第一层是插件（默认关闭）：GitHub 上搜 `#markitdown-plugin` hashtag 就能找到社区插件，官方也给了示例插件工程。第二层是 markitdown-ocr 插件：给 PDF/DOCX/PPTX/XLSX 加 OCR，用 LLM Vision 提取图片里的文字，**不需要新的 ML 库或二进制依赖**；注意一个坑，没传 `llm_client` 时插件仍会加载，但 **OCR 会被静默跳过**，回退到内置转换器。第三层是 Azure Content Understanding：唯一一个支持**视频**的选项，也支持音频，能做结构化字段提取（发票金额、收据日期、合同条款，输出成 YAML front matter），还能配自定义分析器，代价是按量计费的云服务。\n\n**安全上有一条必须知道的前提**，README 开头就警告了：MarkItDown 的 I/O 权限就是当前进程的权限，和 open() 或 requests.get() 一样，会访问进程本身能访问的资源。**在不受信任的环境里要清洗输入，并只调用你用例需要的那个最窄的函数**（`convert_stream()` 或 `convert_local()`），不要图省事用宽接口。这是把文件解析器接进服务时的通用风险，但它明确写出来了。\n\n环境要求是 Python 3.10 到 3.14，官方建议装在虚拟环境里以避免依赖冲突。",
    officialUrl: "https://pypi.org/project/markitdown/",
    officialLabel: "pypi.org/project/markitdown",
    links: {
      official: "https://pypi.org/project/markitdown/",
      github: "https://github.com/microsoft/markitdown",
    },
    whoFor: "要把 PDF/Office/音频等文件批量转成 Markdown 喂给 LLM 或做文本分析的人；以及需要在 pipeline 里做格式转换的开发者。",
    whoNot: "要做版式级高保真转换的人（官方明说不是这个目标）；或者不想装 Python 环境的人——它是纯 Python 工具，没有独立 GUI。",
    installTips: [
      "一条命令装全：pip install 'markitdown[all]'。只要常用几种格式的话用 pip install 'markitdown[pdf, docx, pptx]' 更省依赖。",
      "装在虚拟环境里。官方推荐 uv：uv venv --python=3.12 .venv 之后用 uv pip install（注意不是 pip install）。",
      "要 OCR 就装 markitdown-ocr 并传 llm_client——不传的话 OCR 会被静默跳过，命令照样成功但图片里的文字没了。",
      "转换不可信来源的文件时只调 convert_stream() 或 convert_local() 这类最窄的函数，别用宽接口。",
    ],
    alternatives: ["anydoc", "firecrawl", "pandoc"],
    icon: {
      letter: "M",
      color: "#2B579A",
      simpleIcon: "markdown",
    },
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
  {
    slug: "n8n",
    linksCheckedAt: "2026-10-12",
    // fair-code 不是 OSI 开源：Sustainable Use License禁止把n8n 本身
    // 做成竞品对外服务。不写kind 就会被seedToItem() 按 source 推成
    // "opensource"，前台挂出「开源」徽章 —— 与正文里「不是 OSI 意义上的
    // 开源软件」直接矛盾。处理方式与 GeoGebra 一致：显式声明为 app。
    // 见 lib/semantics.ts 的 SOURCE_KIND_MATRIX。
    kind: "app",
    name: "n8n",
    nameZh: "n8n",
    aliases: ["n8n", "nodemation", "工作流自动化", "自动化编排", "低代码", "workflow"],
    summary: "可视化工作流自动化平台：拖拽画布加自定义代码，1500+ 集成与 9000+ 模板，可自托管或用云。",
    scenes: ["tools", "engineering", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["自动化", "工作流", "低代码", "自托管", "Docker"],
    body: "n8n 是一个用来搭 AI 智能体和工作流的平台。它的形态是可视化画布 + 自定义代码的组合：简单步骤拖拽，复杂逻辑直接写 JavaScript、Python 或引入 npm 包。\n核心卖点是不锁定模型供应商。 它接 OpenAI、Anthropic、Google 或开源模型，换 provider 不用改架构。对不想被某一家模型绑死的人来说这是关键。\n它的能力线是「从原型到生产」：多步 AI 工作流、逻辑分支、工具调用、人工审批环节、完整的可观测性。企业侧有基于角色的访问控制、审计日志、敏感数据处理支持。\n生态规模是它最实的优势：1500+ 集成，加上 9000+ 工作流模板。集成不是「导入配置」那种脆弱粘贴，通常是官方维护的节点。\n部署两种：一条安装脚本（需要 Docker），或者手动 Docker；也可以用官方的 n8n Cloud。\n但有一件事必须说清楚：n8n 不是 OSI 意义上的开源软件。 它的许可证是 fair-code 模式下的 Sustainable Use License 加上 n8n Enterprise License。官方自己列的三点是：源码始终可见、可自托管部署、可扩展（能加自己的节点和功能）。这三条是 fair-code 的定义，它不等于 MIT/Apache 那种可以随便拿去改改再发布的许可证。商业使用、嵌入到产品里对外提供服务这类场景，要自己去读 LICENSE.md 确认边界，必要时联系官方买企业许可。评估「能不能用」之前先看许可，这是选型里最容易事后翻车的一步。\n名字的来历也挺有意思：n8n = \"nodemation\"（Node-View + Node.js + automation），但作者觉得太长不适合命令行，最后取了 n8n。发音是 n-eight-n。",
    officialUrl: "https://n8n.io",
    officialLabel: "n8n.io",
    links: {
      official: "https://n8n.io",
      github: "https://github.com/n8n-io/n8n",
    },
    whoFor: "要把多个 SaaS、数据库、AI 模型串成一条自动流程，并且希望流程可视化、可审计、能自托管的人。",
    whoNot: "需要 MIT/Apache 那种可自由修改再分发的许可的项目方；或者只想写脚本、不想碰可视化界面的开发者。",
    installTips: [
      "最快路径（需要 Docker）：curl -fsSL https://get.n8n.io | sh。",
      "手动 Docker：先 docker volume create n8n_data，再 docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n，然后开 http://localhost:5678。",
      "用之前先读 LICENSE.md：它是 fair-code（Sustainable Use License），不是 MIT/Apache，商业与嵌入场景要自己确认边界。",
      "从模板起步比自己从零搭快得多——9000+ 工作流模板在 n8n.io/workflows。",
    ],
    alternatives: ["openclaw"],
    icon: {
      letter: "n",
      color: "#EA4B71",
      simpleIcon: "n8n",
    },
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

n8n 是 "nodemation" 的缩写：Node-View + Node.js + automation。作者觉得太长不适合命令行，于是取了 n8n。**发音是 n-eight-n**，不是 n-and-n。

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
  {
    slug: "public-apis",
    license: "MIT",
    linksCheckedAt: "2026-10-06",
    name: "Public APIs",
    nameZh: "公开 API 目录",
    aliases: ["public apis", "public-apis", "api 目录", "免费 api", "api 清单", "开放 api"],
    summary: "社区维护的公开 API 清单：51 个领域 2000 多条，每条都标了认证方式、HTTPS 与 CORS 支持情况。",
    scenes: ["data", "education", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["API", "数据集", "开源", "编程学习"],
    body: "Public APIs 是一个由社区成员手工维护的公开 API 清单，收录了 2000 多条可以自己产品里用的 API，按 51 个领域分类。\n**它真正有价值的不是数量，是那三列元数据。** 每条 API 后面都标了**认证方式、是否支持 HTTPS、是否支持 CORS**。这三项决定了它能不能用：需要 apiKey 的你得去注册，No 认证的可以直接调；不支持 HTTPS 的在生产环境上不了；CORS 决定了能不能在浏览器前端直接调用。**大部分 API 目录只给一个链接，这三个字段才是真正替你省时间的部分。**\n实际分布（读 README 表格统计）：认证方式上不需要认证 979 条、要 apiKey 906 条、OAuth 153 条，其余是 X-Mashape-Key 之类的小众方式；HTTPS 上 1948 条支持、88 条不支持；CORS 上 789 条支持、231 条明确不支持、剩下约一千条是 Unknown——**这一列有近一半是未知，所以前端项目不能默认都能直接调，得逐个确认。**\n它还多了一块内容是同类清单里少见的：**MCP Servers 章节**。这里列的条目不是给你写代码调的，是给 AI 智能体当工具用的——你装进 Claude、Cursor、VS Code 里，而不是在自己的代码里请求。所以这张表列的是**传输方式（transport）和安装位置**，而不是 HTTPS/CORS。目前列了 OpenSwissData、IPstack MCP、Kuro、corpusAI Cloud Pricing、GitHub 等。\n分类覆盖很全，从 Animals、Anime 这类趣味门类，到 Blockchain、Cryptocurrency、Finance、Geocoding、Machine Learning、Open Data、Patent、Science & Math 这种正经技术类目都有。\n**它是人工维护的，不是自动抓取。** 这意味着条目可能失效、字段可能过时——用它做起点很好，**直接当权威数据源不行**。真要依赖某个 API，去它官方文档确认当前的认证方式和配额。\n许可证是 MIT（2022 public-apis），条目内容来自社区贡献。仓库开头有 APILayer 的商业推广（它自家的 IPstack、Mediastack 等产品），**推广和产品列表与社区清单是两回事**，看清单时注意区分。",
    officialUrl: "https://github.com/public-apis/public-apis",
    officialLabel: "github.com/public-apis/public-apis",
    links: {
      official: "https://github.com/public-apis/public-apis",
      github: "https://github.com/public-apis/public-apis",
    },
    whoFor: "要做小项目、需要给产品接一个外部 API，但不想一个个搜文档试的人；以及想找练习项目 API 素材的开发者。",
    whoNot: "需要权威、可依赖的 API 数据源的人——这是人工维护的清单，字段可能过时，真要依赖得去官方文档核实。",
    installTips: [
      "直接搜分类名 + API 关键词比浏览 51 个分类快，README 顶部有完整 Index 锚点。",
      "看每条的三列元数据再决定：认证方式（No / apiKey / OAuth）、HTTPS、尤其 CORS——大约一千条 CORS 是未知的。",
      "CORS 未知或不支持但想在浏览器前端调用，就得自己加一层后端代理。",
      "仓库顶部的 APILayer 推广和它自家产品列表不是社区清单的一部分，看条目时注意区分。",
      "要提交新 API 的话看 CONTRIBUTING.md；清单是人工维护的，字段质量参差是正常的。",
    ],
    alternatives: ["python", "jupyter"],
    icon: {
      letter: "P",
      color: "#2C6E49",
    },
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
  {
    slug: "free-programming-books",
    license: "CC-BY-4.0",
    linksCheckedAt: "2026-10-06",
    name: "Free Programming Books",
    nameZh: "免费编程书籍",
    aliases: ["free programming books", "free books", "免费书籍", "免费教材", "编程书单", "open books"],
    summary: "社区维护的免费编程学习资源清单，45 种语言分册含中文专版，另有速查表、在线课程、题集与编程环境。",
    scenes: ["education", "code", "docs"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["学习资源", "免费书籍", "编程入门", "开源"],
    body: "Free Programming Books 是一份社区维护的免费编程学习资源清单，收录合法免费可读的书和课程。\n**它最大的价值是分语言。** 主 README 的 Books 章节按语言分成 45 个分册，其中**有中文专版**（free-programming-books-zh.md，独立的 37KB 文件）——不是把英文书翻译成中文，而是**专门收集中文出版、中文作者、中文可免费读的编程书**。这一点和「翻译英文书」的性质完全不同：读中文书对中文母语者的理解成本低得多。\n除了书籍，README 还有六个资源小节：**Cheat Sheets**（速查表）、**Free Online Courses**（免费在线课程）、**Interactive Programming Resources**（交互式编程资源）、**Problem Sets and Competitive Programming**（题集与竞赛编程）、**Podcast - Screencast**（播客与录屏）、**Programming Playgrounds**（编程练习场）。合起来它不止是书单，而是一条自学路径的各环节都能找到材料。\n**它有搜索和网页版。** 除了在 GitHub 上翻，官方提供了动态搜索站（free-programming-books-search）和易读网页版。书单文件本身不小（按语言分册最大的有 200KB），搜索比浏览更实际。\n**质量控制靠社区，但机制是明确的**：仓库有 CONTRIBUTING、HOWTO、CODE_OF_CONDUCT 三份文档，**而且大多有中文翻译**（CONTRIBUTING-zh、HOWTO-zh、CODE_OF_CONDUCT-zh），想提交条目的话有中文规则可读。贡献指南带 specific 的要求（哪些算免费、怎么写条目格式），不是随便往里塞链接。\n来源值得知道：这份清单最初是 StackOverflow 上「List of Freely Available Programming Books」的克隆，由 Victor Felder 迁到 GitHub 协作维护，现在由非营利组织 Free Ebook Foundation 托管。它已经是 GitHub 最受欢迎的仓库之一。\n**它的性质是「筛选过的索引」，不是内容本身。** 每本书都还是要去各自的地方读——好处是链接都指向合法免费资源，坏处是没有统一质量保证：任何一本书的价值还是得自己判断。",
    officialUrl: "https://ebookfoundation.github.io/free-programming-books/",
    officialLabel: "ebookfoundation.github.io/free-programming-books",
    links: {
      official: "https://ebookfoundation.github.io/free-programming-books/",
      github: "https://github.com/EbookFoundation/free-programming-books",
    },
    whoFor: "想系统自学编程、需要一份筛过的免费书单，并且中文读者优先找中文书的人。",
    whoNot: "想找「最新最全技术文档」的人——它收的是可免费读的完整书籍，不是 API 文档或速查手册那种即时查询用途。",
    installTips: [
      "中文读者先看中文专版：books/free-programming-books-zh.md。它收的是中文出版/中文可免费读的书，不是英文书翻译。",
      "别在 GitHub 里翻大文件——按语言分册最大有 200KB，用官方搜索站 free-programming-books-search 或本地 Ctrl+F 更快。",
      "按主题找书用 English, By Subject 那份分册（110KB），按语言用 English, By Programming Language（200KB）。",
      "不只书：Cheat Sheets、Free Online Courses、Problem Sets、Programming Playgrounds 四个小节是自学路径的其他环节。",
      "要提交条目的话有中文版贡献指南（docs/CONTRIBUTING-zh.md），先读它再提 PR。",
    ],
    alternatives: ["thealgorithms", "python", "vscode"],
    icon: {
      letter: "B",
      color: "#4A5D23",
    },
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
  {
    slug: "thealgorithms",
    license: "MIT",
    linksCheckedAt: "2026-10-06",
    name: "The Algorithms (Python)",
    nameZh: "算法实现集（Python）",
    aliases: ["the algorithms", "thealgorithms", "算法实现", "算法大全", "数据结构", "algorithm", "算法练习"],
    summary: "1360 多个 Python 算法与数据结构实现，分45 个类别，附 DIRECTORY 导航与 doctest 校验，仅供学习。",
    scenes: ["education", "code", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["算法", "数据结构", "Python", "学习资源", "开源"],
    body: "The Algorithms - Python 是社区维护的 Python 算法实现集，按 DIRECTORY.md 统计有 45 个类别、1300 多个实现文件，从排序、图论、动态规划一路到密码学、图形学、量子计算。\n\n**但它的定位必须先说清楚，这是官方在 README 顶部就写明的：这些实现只用于学习目的，效率可能不如 Python 标准库里的实现，自行斟酌使用。**\n\n这句话不是客套，是选型时最关键的信息。标准库有 `sorted`、`heapq`、`bisect`，性能是 C 实现的；这里的实现是为了让你看懂算法怎么写，不是为了直接拿去做生产里的热路径。**当成教科书和练习集用，不要当成库用。**\n\n**它的真正价值在两点。** 一是**每份实现都带 doctest**：贡献规范明确要求 docstring 里要有清晰说明和/或来源 URL，并且 **doctest 要同时覆盖有效输入和错误输入**，这意味着你读代码时看到的示例是能直接跑的，而且不会只演示顺利路径。二是**分类完整**：45 个类别里有些是标准算法教材不会覆盖的——ciphers（密码学）、fractals（分形）、cellular_automata（元胞自动机）、boolean_algebra（布尔代数）、quantum（量子计算）、financial（金融）、geodesy（测地学），想找某个冷门算法的实现，这里往往比搜索引擎更快。\n\n**工程规范相当严，这一点从 CONTRIBUTING 能看出来：** 遵循 Python 命名约定（变量函数小写、常量全大写、类名驼峰），PEP 8，代码风格用 ruff，格式用 pre-commit 自动处理。命名上有一条原则我觉得很值得单独说：**展开缩写**——`gcd()` 不好懂，`greatest_common_divisor()` 就懂。规范里明确写「用描述性命名帮你省掉冗余注释」。\n\n提交流程有两条容易踩的：**不接受重复实现**——已有同一算法的实现就别再提一个功能相同的，允许的是新解法、不同表示、不同复杂度，提交前先搜一遍；**不要为贡献算法去开 issue，直接提 PR**——仓库不分配 issue，官方明说了不用先问。\n\n所有提交会过 GitHub Actions 的 `ruff check` 和测试，测试跑的是 doctest。\n\n想找导航从仓库里的 DIRECTORY.md 进（https://github.com/TheAlgorithms/Python/blob/master/DIRECTORY.md），那份文件有 85KB，分类目录比在仓库里翻更清楚。仓库支持 Gitpod 一键在线改代码。",
    officialUrl: "https://the-algorithms.com/",
    officialLabel: "the-algorithms.com",
    links: {
      official: "https://the-algorithms.com/",
      github: "https://github.com/TheAlgorithms/Python",
    },
    whoFor: "学算法时想要可运行、可验证（doctest）的标准实现当参照，或者要找某个冷门算法现成实现的人。",
    whoNot: "要在生产代码里直接用的——官方明说这些实现可能不如标准库；也不适合需要高性能或经过生产验证的库的场景。",
    installTips: [
      "不用装，这是仓库不是 pip 包。直接读代码，或者 Gitpod 一键在浏览器里改。",
      "先看 DIRECTORY.md 导航，85KB 里按 45 个分类列全，比在仓库里翻快。",
      "读每份实现时留意 doctest——它同时测有效和错误输入，比只给顺利路径的示例可靠。",
      "想跑某个文件里的 doctest：python -m doctest <文件路径> -v。",
      "要提 PR 之前先搜一遍有没有同样的实现，重复实现不接受——但新解法、不同复杂度、不同表示是欢迎的。",
    ],
    alternatives: ["free-programming-books", "python", "jupyter"],
    icon: {
      letter: "A",
      color: "#1F6F8B",
      simpleIcon: "python",
    },
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
  {
    slug: "openclaw",
    license: "MIT",
    linksCheckedAt: "2026-10-06",
    name: "OpenClaw",
    nameZh: "本地AI 助手（多渠道）",
    aliases: ["openclaw", "open claw", "本地 ai 助手", "自托管 ai 助手", "聊天机器人", "ai agent", "个人助手"],
    summary: "跑在自己设备上的开源 AI 助手，接入微信之外的 20 多个聊天渠道；状态与凭据留在本机，默认只做每日版本检查。",
    scenes: ["code", "tools", "social"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["AI 助手", "自托管", "聊天机器人", "Node.js", "开源", "隐私"],
    body: "OpenClaw 是一个开源 AI 助手，跑在**你自己的电脑**上，然后出现在你本来就在用的聊天工具里——Discord、iMessage、Slack、Teams、Telegram、WhatsApp，还有 20 多个别的渠道，另有macOS、iOS、Android、Windows、Linux 原生应用。\n**它和常见的「AI 助手」最大的区别是数据落点：状态、记忆和凭据都留在你的硬件上。** README 里那句「Yours, with no catch」是字面意思：模型和 agent harness（Claude、Codex、本地模型）都是可替换的插件，换模型不用改其他任何东西。你的 prompt 会发给你配置的那个模型提供方和你接的那个聊天平台，仅此而已。\n**架构只有一句话：受信任的 Gateway，不可信的执行，确定性的策略。** Gateway 是本地控制平面，管会话、工具、事件和渠道连接；Control UI、CLI、TUI 都连到它；Channels 把助手接到各个消息平台；Companion apps 和 nodes 提供语音、Canvas、摄像头、屏幕和设备本地操作。同一套 Gateway，在笔记本上是个人助手，在团队里是共享部署——**差别只在配置。**\n**安全上有一条必须记住的规则：入站消息一律当作不可信输入。** 支持私信的渠道默认会把陌生发送者拦在配对流程外，需要你用 openclaw pairing approve <channel> <code> 批准。另外，主会话的工具默认**直接跑在宿主机上**，除非你配了沙箱。所以在把 Gateway 暴露给其他人或开放远程访问之前，官方要求先读安全指南、暴露运行手册和沙箱指南。\n遥测这块值得单独说，因为它和同类项目的常见做法不一样：默认**只有每日版本检查**会外发，匿名功能统计是**主动选择加入**的，设 update.checkOnStart: false 可以把这两样一起关掉。治理上由 OpenClaw Foundation 这个独立 501(c)(3) 负责，没有付费层、没有托管服务、没有 token；OpenAI 是捐赠者，不是所有者。\n**上手只有三步。** 装完自动开始引导流程，走完向导就绪；如果你用 npm 直接装的包，手动跑：\n\nopenclaw onboard --install-daemon\n\n之后用 openclaw gateway status 看状态，用 openclaw dashboard 打开 Control UI，发一条消息确认助手活了。\nNode 版本要求是 **24.16+ 或 26.1+，官方推荐 Node 26**。",
    officialUrl: "https://openclaw.ai",
    officialLabel: "openclaw.ai",
    links: {
      official: "https://openclaw.ai",
      github: "https://github.com/openclaw/openclaw",
    },
    whoFor: "想自己掌握数据和凭据、在日常聊天工具里用 AI 助手，并且愿意自己装Node、配渠道、看清安全边界的技术用户。",
    whoNot: "要求开箱即用、必须有SLA 或托管服务的企业；以及不愿在宿主机上运行第三方工具、不读安全文档就开放端口的人——工具默认跑在主机上。",
    installTips: [
      "最省事的是官方安装脚本：macOS/Linux/WSL2 用 curl -fsSL https://openclaw.ai/install.sh | bash，Windows PowerShell 用 iwr -useb https://openclaw.ai/install.ps1 | iex。脚本会在需要时装好受支持的 Node 运行时。",
      "已经自己管Node.js 就装已发布的包：npm install -g openclaw@latest --allow-scripts=openclaw。要求 Node 24.16+ 或 26.1+，官方推荐 Node 26。",
      "--allow-scripts=openclaw 这个参数需要 npm 12 或 npm 11.16+；npm 11.15 及更早版本要省略它，否则命令会失败。",
      "装完包之后手动初始化：openclaw onboard --install-daemon。引导流程会验证模型访问、创建工作区并配置 Gateway。",
      "接陌生用户之前先读安全指南和暴露运行手册；主会话的工具默认跑在宿主机上，除非你显式配置了沙箱。",
      "想关掉默认的每日版本检查和匿名功能统计，在配置里设 update.checkOnStart: false。",
    ],
    alternatives: ["voicestudio", "firecrawl", "watermarksremover"],
    icon: {
      letter: "O",
      color: "#C4562A",
    },
    guide: {
      intro: "从 Gateway 控制平面到入站消息当作不可信输入，讲清这套本地优先架构为什么这样分层，以及暴露给其他用户前必须先读的那三份文档。",
      markdown: `## 一句话定位

跑在你自己设备上的开源 AI 助手，出现在你本来就在用的聊天工具里。

**数据落点是它和同类项目最大的区别：状态、记忆和凭据都留在你的硬件上。** 模型和 agent harness（Claude、Codex、本地模型）是可替换的插件，换模型不动其他东西。

支持渠道包括 Discord、iMessage、Slack、Teams、Telegram、WhatsApp，以及 20 多个其他渠道；原生应用覆盖 macOS、iOS、Android、Windows、Linux。

## 架构只有一句话

官方在 Why OpenClaw 里把它概括为：**受信任的 Gateway、不可信的执行、确定性的策略。**

分层看：

\`\`\`text
聊天平台（WhatsApp / Telegram / Slack / iMessage …）
                │
            Channels              ← 把助手接到消息服务
                │
  ┌─────────── Gateway ───────────┐
  │  会话 · 工具 · 事件 · 渠道连接 │  ← 本地控制平面
  └────────────────────────────────┘
         ││         │
Control UI / CLI / TUI      Companion apps / nodes
（连到 Gateway）              （语音、Canvas、摄像头、
                屏幕、设备本地操作）
\`\`\`

**同一套 Gateway，在笔记本上是个人助手，在团队里是共享部署——差别只在配置。**

模型提供方既可以是托管的也可以是本地的，tools、skills、plugins 三层负责扩展能力。

## 安装：两条路

### 走安装脚本

安装器支持 macOS、Linux 和 Windows，需要时会自己装一个受支持的 Node 运行时。

\`\`\`bash
# macOS / Linux / WSL2
curl -fsSL https://openclaw.ai/install.sh | bash
\`\`\`

\`\`\`powershell
# Windows PowerShell
iwr -useb https://openclaw.ai/install.ps1 | iex
\`\`\`

### 自己管 Node 就装包

**版本要求是 Node 24.16+ 或 26.1+，官方推荐 Node 26。**

\`\`\`bash
npm install -g openclaw@latest --allow-scripts=openclaw
\`\`\`

这里有个容易踩的版本坑，README 写得很清楚：

> \`--allow-scripts=openclaw\` 适用于 npm 12 或 npm 11.16+。**npm 11.15 及更早版本要省略这个参数。**

## 首次配置

全新安装时，安装脚本会自动开始引导流程，把打开的向导走完即可。如果你是直接用 npm、pnpm 或 Bun 装的包，手动跑：

\`\`\`bash
openclaw onboard --install-daemon
\`\`\`

引导流程会做三件事：验证模型访问、创建工作区、配置 Gateway。

之后：

\`\`\`bash
openclaw gateway status
openclaw dashboard
\`\`\`

**\`openclaw dashboard\` 打开的是 Control UI，在那里发一条消息，就确认助手是活的。** 渠道接入和排错看 getting started 指南。

## 安全：有一条规则必须记住

### 入站消息一律当作不可信输入

这是 README 里Security 段落的第一句，也是整个安全模型的起点。支持私信的渠道**默认会把陌生发送者拦在配对流程外**，需要你手动批准：

\`\`\`bash
openclaw pairing approve <channel> <code>
\`\`\`

### 工具默认跑在宿主机上

README 里这句要划重点：

> Tools run on the host for the main session unless you configure sandboxing.

**也就是说主会话的工具默认在你的机器上直接执行**，不是隔离环境。除非你显式配置沙箱。

所以在你把 Gateway 暴露给其他用户或开放远程访问之前，官方明确要求先读这三份：

- [安全指南](https://docs.openclaw.ai/gateway/security)
- [暴露运行手册](https://docs.openclaw.ai/gateway/security/exposure-runbook)
- [沙箱指南](https://docs.openclaw.ai/gateway/sandboxing)

顺序不能省：先读，再暴露。

## 遥测：默认值比同类项目干净

这一段值得单独拿出来看，因为它和同类项目的常见做法不同：

- 默认**只有每日版本检查**会外发，别的一概不发。
- 匿名功能统计是**主动选择加入**的（opt-in），不是默认开。
- 设 \`update.checkOnStart: false\` 可以**把默认检查和匿名统计一起关掉**。

你的 prompt 会发给你配置的那个模型提供方和你接的那个聊天平台——这是功能本身决定的，无法避免。除此之外就是上面那两项。细节在 [telemetry 文档](https://docs.openclaw.ai/gateway/telemetry)。

## 治理结构

由 **OpenClaw Foundation** 负责，这是一个独立的 501(c)(3)：

- 基金会雇用核心团队、签署发布版本。
- 捐赠者和基础设施赞助方支持基金会，**没有任何一方拥有或指挥这个项目**。
- **OpenAI 是捐赠者，不是所有者。**
- 没有付费层、没有托管服务、没有 token。

这条信息对选型有实际意义：它不会因为某个云厂商改产品路线而变向，也不存在「免费额度用完就锁功能」这种风险。

## 想参与开发

仓库是 **pnpm workspace**，README 明确说了**在仓库根目录直接跑 \`npm install\` 是不支持的**：

\`\`\`bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
\`\`\`

提PR 看 CONTRIBUTING.md。README 里说 **AI 辅助的 PR 是受欢迎的**。

新功能通常应该做成插件，走 [plugin SDK](https://docs.openclaw.ai/plugins/building-plugins)，通过 [ClawHub](https://clawhub.ai) 分发——想加能力时先考虑这条路径，而不是直接改核心。

## 文档地图

README 给了一张按目标索引的表，摘几条常用的：

| 想做的事 | 入口 |
|---|---|
| 配模型和鉴权 | [Models](https://docs.openclaw.ai/concepts/models) · [Model providers](https://docs.openclaw.ai/concepts/model-providers) |
| 接一个消息服务 | [Channels](https://docs.openclaw.ai/channels) |
| 加工具、技能、插件 | [Tools](https://docs.openclaw.ai/tools) · [Skills](https://docs.openclaw.ai/tools/skills) · [Plugins](https://docs.openclaw.ai/plugins) |
| 跑应用和设备节点 | [Platforms](https://docs.openclaw.ai/platforms) · [Nodes](https://docs.openclaw.ai/nodes) |
| 用 CLI 和聊天命令 | [CLI reference](https://docs.openclaw.ai/cli) · [Slash commands](https://docs.openclaw.ai/tools/slash-commands) |
| 配置或运维 Gateway | [Configuration](https://docs.openclaw.ai/gateway/configuration) · [Architecture](https://docs.openclaw.ai/concepts/architecture) |

## 什么情况下别用它

- **要开箱即用和SLA** —— 它是自托管项目，托管服务明确不在计划里。
- **不愿读安全文档** —— 工具默认在宿主机上跑，暴露给外部用户前必须自己搞懂沙箱和暴露运行手册。
- **只想试个模型对话** —— 装Node、配渠道、配 Gateway 这几步对只想试一下的人来说偏重。

## 建议的上手顺序

1. 先读 [Why OpenClaw](https://docs.openclaw.ai/start/why-openclaw)，理解「受信任的 Gateway、不可信的执行」这套分层为什么这么设计。
2. 装完跑完引导流程，用 \`openclaw dashboard\` 在 Control UI 里确认助手活了。
3. **只接一个自己的渠道**，先在单机、单用户下用熟。
4. 再读安全指南和沙箱指南，搞清楚工具的执行边界。
5. 确认要沙箱化了，才考虑加第二个用户或开远程访问。
6. 顺手把 \`update.checkOnStart\` 设成你想要的默认值。

第 3 到第 5 步的顺序是这个项目最容易做错的地方——**先单机跑熟，再谈共享。**
`,
      resources: [
        {
          kind: "link",
          title: "Why OpenClaw：受信任的 Gateway、不可信的执行",
          url: "https://docs.openclaw.ai/start/why-openclaw",
          note: "架构理念页。README 把整套设计概括为「受信任的 Gateway、不可信的执行、确定性的策略」，想理解为什么这样分层就从这里进。",
        },
        {
          kind: "link",
          title: "Security：接入其他用户前的必读",
          url: "https://docs.openclaw.ai/gateway/security",
          note: "安全指南。核心事实是主会话的工具默认跑在宿主机上，除非配置沙箱；入站消息一律当作不可信输入。",
        },
        {
          kind: "link",
          title: "Telemetry：默认发什么、怎么关",
          url: "https://docs.openclaw.ai/gateway/telemetry",
          note: "默认只有每日版本检查，匿名统计是选择加入，update.checkOnStart: false 可一并关闭。选型时值得先看这页。",
        },
      ],
    },
  },
  {
    slug: "firecrawl",
    license: "AGPL-3.0",
    linksCheckedAt: "2026-10-06",
    name: "Firecrawl",
    nameZh: "网页抓取转Markdown",
    aliases: ["firecrawl", "网页抓取", "网页转markdown", "爬虫", "crawler", "scrape", "抓取 api", "web scraping"],
    summary: "把任意网页转成干净的 Markdown、结构化 JSON 或截图，专为喂给 LLM 设计；覆盖 96% 网页，自托管需 Redis 与 Playwright。",
    scenes: ["code", "data", "tools"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["网页抓取", "Markdown", "LLM", "爬虫", "开源", "API"],
    body: "Firecrawl 做的是一件很具体的事：**把任意 URL 转成 LLM 能直接用的干净数据**——Markdown、结构化 JSON、截图。README 里那句「Supercharge your AI agents with data from the web」就是它的定位：给 AI agent 喂网页数据。\n\n**它的核心卖点是「难的部分它替你处理了」。** 官方列的对比理由里有几条很实在：覆盖 96% 的网页、包括 JS 重页面，不需要你折腾代理；跨数百万页面 P95 延迟 3.4 秒；旋转代理、任务编排、限流、JS 拦截内容全部零配置接管。\n\n**端点分成两档，这个分层值得先搞清楚。** 核心端点三个：Search 负责搜网并直接拿到结果页的完整内容；Scrape 把任意 URL 转成 markdown、HTML、截图或结构化 JSON；Interact 先抓取，再用 AI 提示词或代码与页面交互。\n\n其余能力还有 Agent（描述需求，自动收集数据）、Crawl（一个请求抓整站）、Map（即刻发现站点全部 URL）、Batch Scrape（异步抓上千个 URL）。\n\n**四种调用方式给的是同一套能力。** Python 是 `from firecrawl import Firecrawl`，Node 是 `import { Firecrawl } from 'firecrawl'`，cURL 打 `https://api.firecrawl.dev/v2/scrape`，CLI 直接 `firecrawl scrape <url>`。所以选语言不是问题，问题是**你要不要自托管**。\n\n**关于自托管，得先把预期说清楚。** Firecrawl 是开源的，同时也有托管服务（firecrawl.dev），但**云版本包含额外功能**，不是同一个东西。开源版是 AGPL-3.0，SDK 和部分 UI 组件是 MIT——这点在做商业集成前必须看清楚，AGPL 的传染性不是小事。另外官方明确写了：**默认遵守 robots.txt 指令**，并且把「遵守各网站政策」的责任放在使用者身上。\n\n**最后一条工程建议：如果你只是想让 agent 读网页，先试托管版再决定要不要自托管。** 自托管要准备 Redis、Playwright 和一堆环境变量，而托管版开箱就能用。判断依据是数据敏感度和调用量，不是功能列表。",
    officialUrl: "https://firecrawl.dev",
    officialLabel: "firecrawl.dev",
    links: {
      official: "https://firecrawl.dev",
      github: "https://github.com/mendableai/firecrawl",
    },
    whoFor: "要给 AI agent、RAG管道或数据管道喂网页内容的开发者，尤其是需要绕开 JS 渲染、反爬和代理麻烦的场景。",
    whoNot: "不能接受 AGPL-3.0 传染性、要做闭源商业集成的人；也不适合只是偶尔抓一两个静态页面的场景——为此自托管 Redis 和 Playwright 不划算。",
    installTips: [
      "最快路径是托管版：到 firecrawl.dev 注册拿 API key（形如 fc-开头），再到 playground 试一次再写代码。",
      "Python SDK：from firecrawl import Firecrawl，建app = Firecrawl(api_key=...) 后直接 app.scrape('firecrawl.dev')。",
      "Node SDK：import { Firecrawl } from 'firecrawl'，用法与 Python 对称。",
      "不想装 SDK 就用 cURL 打 https://api.firecrawl.dev/v2/scrape，鉴权头是 Authorization: Bearer fc-你的KEY。",
      "本地装 CLI：firecrawl scrape https://firecrawl.dev，加 --only-main-content 只要正文。",
      "自托管前先读自托管指南：开源版是 AGPL-3.0 且不含云端那些额外功能，要准备 Redis、Playwright 和一组环境变量。",
    ],
    alternatives: ["anydoc", "markitdown"],
    icon: {
      letter: "F",
      color: "#D1442A",
    },
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
  {
    slug: "vorssaint",
    license: "GPL-3.0-or-later",
    linksCheckedAt: "2026-10-06",
    name: "Vorssaint",
    nameZh: "Mac 菜单栏工具箱",
    aliases: ["vorssaint", "vorssaint utils", "mac 工具箱", "菜单栏工具", "menu bar", "mac 优化", "系统监控 mac", "剪贴板历史"],
    summary: "一个菜单栏图标顶 dozen 付费 Mac 应用：分应用音量、系统监控、窗口布局、剪贴板历史、卸载器；仅 Apple Silicon 且需 macOS 14+。",
    scenes: ["tools", "office", "design"],
    platforms: ["macos"],
    source: "opensource",
    tags: ["macOS", "菜单栏", "效率工具", "剪贴板", "系统监控", "开源"],
    body: "Vorssaint 的自我定位很直白：**一个菜单栏图标，干掉 dozen 个付费 Mac 应用的事。** 免费、开源、本地优先——没有账号、没有遥测、没有订阅。\n**它的功能范围大到需要分类看，我按 README 的分区说。** 声音类有分应用音量混音器（能把quiet 音频推过 100%）、每应用输出设备、输出切换器、麦克风工具、音乐 App 拦截器。系统监控类有 CPU/GPU/内存/温度/电池健康，带历史曲线和耗电应用排行，还有 beta 版风扇控制（可设手动转速或温度曲线）。窗口与 Dock 类有带实时预览的应用切换器、窗口布局吸附、跨桌面 Dock 预览、点 Dock 图标最小化、绿键全屏不新建 Space。\n**有几个功能对长期使用者来说价值最高，值得单独点出来。**剪贴板历史支持搜索文本、图片和文件，能钉 favorites、能预览；文本片段（snippets）能用剪贴板、日期时间变量展开；Clean URL 能去掉链接里的追踪参数，可以手动也可以自动；Command Bar 是一个输入框搜应用、窗口、文件、剪贴板、片段和应用菜单命令，还能算数、换单位、找 emoji、跑脚本。\n**安装方式只有一种，但它有「只装你要的」这个设计。** Homebrew 一条命令，或者从releases 拉磁盘镜像拖进Applications。构建用 Apple Developer ID 签名并做了 notarization，所以 macOS 不会拦你的权限设置。功能层面可以逐个选，也可以用预设；**卸载的功能会停止加载并从界面消失，重装会恢复原来的设置**，安装时只问你要的权限。\n**平台限制要先说，这是选型的第一道门槛：必须有 Apple Silicon 的 Mac，且macOS 14 Sonoma 或更新。** Intel Mac 完全不在支持范围内。\n**隐私这块的做法是我认为它最值得学的地方。** 它是本地优先，没有账号、没有分析、没有追踪；联网只发生在你能看见的地方——更新检查、测速、Homebrew 操作、可选的在线歌词查询、临时的截图或录屏分享链接，以及你主动发送的反馈。权限同理：**每一个权限都是可选的**，应用会用大白话解释每个权限干什么、哪些功能真的用到它，甚至会告诉你**某个已授予的权限现在已经没有任何功能需要了**，并给出撤销的快捷入口。这种「主动告诉你权限用不上」的设计比多数同类工具更诚实。\n**最后一条法务信息，做二次开发前必须知道：GPL 3.0 or later 只覆盖源代码，Vorssaint 这个名字、图标和外观由 TRADEMARKS.md 单独约束。** 所以 fork 之后必须换成自己的标识，不能沿用名字和图标。官方构建也只有维护者发布。",
    officialUrl: "https://vorssaint.com",
    officialLabel: "vorssaint.com",
    links: {
      official: "https://vorssaint.com",
      github: "https://github.com/vorssaint/vorssaint-utils",
    },
    whoFor: "用 Apple Silicon Mac、愿意装第三方系统级工具，且明确知道自己需要哪些权限、愿意用功能换精度的技术用户。",
    whoNot: "Intel Mac 或 macOS 13 及更早系统的用户（完全不支持）；以及要求零权限、完全不装第三方系统工具的人——它功能多，必然要申请较多权限。",
    installTips: [
      "Homebrew 安装：brew install --cask vorssaint。卸载同样是 brew uninstall --cask vorssaint。",
      "不想用 Homebrew 就去releases 页下磁盘镜像，把 Vorssaint 拖进 Applications。",
      "完全卸载（含设置与权限）：在项目目录里跑 ./Tools/uninstall.sh。只用 brew uninstall 会留下设置和授权。",
      "硬门槛：Apple Silicon Mac + macOS 14 Sonoma 或更新。Intel Mac 不在支持范围内。",
      "安装时按需选功能——卸载的功能会停止加载并从界面消失，重装会恢复设置；只授予当前选择真正需要的权限。",
      "想自己构建：git clone 后跑 ./build.sh --dev（单独的 Developer变体），加 --install 可安装并启动。唯一依赖是 Xcode Command Line Tools。",
    ],
    alternatives: ["tuios", "localsend"],
    icon: {
      letter: "V",
      color: "#4C8DFF",
    },
    guide: {
      intro: "从功能分区到权限与商标这两道真实边界，讲清这个菜单栏工具箱适合谁，以及为什么它的权限说明值得单独看一遍。",
      markdown: `## 它把自己定位成什么

README 第一句很直白：**一个菜单栏图标，干掉 dozen 个付费 Mac 应用的事。**

免费、开源、本地优先——**没有账号、没有遥测、没有订阅。**

这不是营销话术，后面第三节的隐私机制能对上。

## 先看硬门槛

**这是选型的第一道门槛，不满足就不用往下看了：**

- 需要 **Apple Silicon** 的 Mac
- 需要 **macOS 14 Sonoma** 或更新

Intel Mac 完全不在支持范围内。这不是「性能差一点」，是跑不了。

## 功能分区

README 把功能分了组，这里挑重点说。

### 声音

- **分应用音量混音器** —— 每个应用单独调音量，还能**把安静的音频推过 100%**，钉住或重排常用项。**不需要装音频驱动。**
- **每应用输出** —— 音乐走扬声器，通话走耳机。
- **输出切换器** —— 快捷键切设备，耳机断开时自动降音量。
- **麦克风工具** —— 指定输入、调电平、一键静音所有麦克风。
- **音乐 App 拦截器** —— 检测到播放键误触时阻止 Music 启动（需要辅助功能权限）。

### 知道你的 Mac 在干什么

- **系统监控** —— CPU、GPU、内存、温度、电池健康、功耗，带历史曲线和耗电应用视图。
- **风扇控制（beta）** —— 设手动转速或温度曲线，实时看 RPM。
- **菜单栏读数** —— 把选定指标、用量条、电池时间或风扇转速直接放进菜单栏。
- **网络** —— 实时流量、会话总量、本地 IP，或跑测速。
- **告警** —— 持续高 CPU、高温、内存压力、磁盘不足、电量低时通知。

### 窗口和 Dock

- **应用切换器** —— 带实时预览、搜索和按显示筛选；**简易模式不需要屏幕录制权限。**
- **窗口布局** —— 窗口吸附成布局、跨显示器移动、用快捷键/屏幕边缘/修饰键拖拽恢复之前的位置。
- **Dock 预览** —— 悬停预览跨桌面的窗口，能在预览里切换、关闭、移动、吸附。
- **Dock 点击** —— 点已激活应用的图标可最小化、隐藏或循环它的窗口。
- **最大化窗口** —— 绿键铺满屏幕而**不新建 Space**。
- **固定 Space 顺序** —— 保持你设的顺序而不是按最近使用重排，关掉可恢复原设置。
- **退出保护** —— 防误按 ⌘Q / ⌘W，按住、双击或加修饰键确认，可按应用配置。

### 键盘和鼠标

这一组数量最多，挑实用的：

- **文本片段** —— 短触发词展开成文本，支持剪贴板、日期时间变量
- **平滑滚动** —— 鼠标滚轮给 fluidity，速度和响应可调
- **线性滚动** —— 无论滚轮转多快，每一格滚相同行数
- **关闭指针加速** —— 关掉后还能恢复之前的设置
- **焦点跟随鼠标** —— 指针停留可调时间后，窗口置前
- **侧键** —— 鼠标后退前进键在 Finder、浏览器和兼容应用里可用
- **按键去抖** —— 过滤磨损键盘造成的重复字母
- **Super 键** —— 用 Caps Lock 或右侧修饰键当快捷键组合，可单独设轻点动作
- **要放过的应用** —— 把指定应用排除在鼠标增强之外

### 剪贴板、文件和链接

- **剪贴板历史** —— 搜索本地文本、图片和文件历史，钉 favorites、预览、用快捷键粘贴。
- **自动清空剪贴板** —— 延时、睡眠或锁屏后清空系统剪贴板，**但保留已保存的历史。**
- **粘贴为纯文本** —— 去掉格式粘贴，同时保留原剪贴板内容。
- **Shelf 文件架** —— 拖动时把文件、文本和链接停在光标附近，之后再放下或分享。
- **Finder 快捷键** —— ⌘X/⌘V 移动文件、F2 重命名、复制图片粘贴为 PNG。
- **Clean URL** —— 去掉链接里的追踪参数，可手动也可自动。**这个功能在日常使用里出现频率比想象中高。**
- **磁盘镜像安装器** —— 从挂载的镜像安装应用并弹出，可选清理下载文件。

### 日常工具

- **Dynamic Island** —— 把音乐、通知、日历、计时器、下载和常用控件放在摄像头挖孔周围，其他 Mac 上可模拟。可选歌词、实时均衡器、摄像头预览和文件工具。
- **AI agents 跟随** —— 在 Dynamic Island 里看 Claude、Codex、OpenCode 和 GitHub Copilot 的额度与重置时间、token、API 价值、模型、项目和进行中的工作，长任务完成时给通知。
- **Command Bar** —— 一个输入框搜应用、窗口、文件、剪贴板、片段和应用菜单命令；能算数、换单位、找 emoji、跑保存的脚本。
- **快速面板** —— ⌃⌘V 打开收藏工具的浮动面板。
- **径向菜单** —— 以指针为中心展开的轮盘，可配置、支持配置档和子菜单。
- **Scratchpad** —— 自动保存的笔记分标签页，带 Markdown 预览和导出。
- **清洁模式** —— 清洁时锁住键盘输入，全黑屏或只留一个小指示器。

### 截屏和创作

- **截屏** —— 区域、窗口、屏幕或滚动页面；可标注、裁剪、打码、加背景和水印、钉住，走分享菜单或发临时链接。
- **录屏** —— 系统音频和麦克风**分轨录制**；裁剪、加自动变焦、模糊隐私信息，导出视频或 GIF。
- **屏幕取字** —— **离线**识别任意屏幕区域的文字，或读二维码。
- **取色器** —— 复制为 HEX、RGB、HSL 或 SwiftUI 代码。
- **媒体工具** —— 本地压缩剪辑视频、批量转图片、加水印、做 GIF、提取文字。

### 应用管理

- **应用更新** —— 商店应用、包管理器应用和开发者更新源放一个列表里，可一起装或交给应用自己的更新器。
- **Cleaner** —— 清缓存、日志和应用残留，手动或按计划。
- **消息下载管理** —— 按保留规则审阅、整理或移到废纸篓。
- **卸载器** —— 卸载应用前先给你看相关的缓存、偏好设置和辅助程序，再一起移到废纸篓。**这个「先看后删」的设计比直接删安全。**
- **Homebrew 管理器** —— 搜装删 formulae 和 cask，不用开终端。
- **端口管理** —— 找出监听网络端口的进程，可直接 Kill Process（需先安装该功能）。

## 安装：两种方式，一个设计亮点

\`\`\`bash
brew install --cask vorssaint
\`\`\`

或者从 [releases 页](https://github.com/vorssaint/vorssaint-utils/releases) 下磁盘镜像，拖进 Applications。

构建**用 Apple Developer ID 签名并做了 notarization**，所以 macOS 不会拦权限弹窗，**你的权限设置也能在更新后保留**。

### 「只装你要的」

这是这个项目设计上最值得学的一点：

- 可以逐个选功能，也可以从预设开始。
- **卸载的功能会停止加载并从界面消失。**
- **重装会恢复它原来的设置。**
- 安装时**只问你要的权限**。

面板分区可以重排或隐藏，可以选紧凑布局，设置能导出到另一台 Mac，支持十几种语言。

## 隐私：这一节建议读完再装

README 里的说法是：本地优先，**没有账号、没有分析、没有追踪**。联网只发生在你能看见的地方：

- 更新检查
- 测速
- Homebrew 操作
- **可选的**在线歌词查询
- 临时截图或录屏链接
- 你明确发送的反馈

完整说明在仓库的 \`docs/PRIVACY.md\`。

### 权限的处理方式值得学

原文这段：

> Every one is optional, the app explains each in plain words, shows which features actually use it, and even **tells you when a permission you granted is no longer needed by anything**, with a shortcut to revoke it.

拆成三条：

1. **每一个权限都是可选的**，且用大白话解释这个权限干什么。
2. **告诉你哪些功能真的用到它。**
3. **主动告诉你某个已授予的权限现在已经没功能需要了**，并给撤销入口。

**第3 条是多数同类工具不会做的。** 装多了功能之后权限越堆越多，很少有工具会提醒你哪些已经没用了。

每个特性需要什么权限、不给会失去什么功能，看 \`docs/PERMISSIONS.md\`。

## 卸载：记得清干净

\`\`\`bash
brew uninstall --cask vorssaint
\`\`\`

但这只删应用。要连设置和权限一起清掉：

\`\`\`bash
./Tools/uninstall.sh
\`\`\`

**只跑 brew uninstall 会留下设置残留。** 对这类高权限工具，完整卸载很重要。

## 自己构建

\`\`\`bash
git clone https://github.com/vorssaint/vorssaint-utils.git
cd vorssaint-utils
./build.sh --dev            # 构建单独的 Developer 变体
./build.sh --dev --install  # 安装并启动
\`\`\`

**唯一的要求是 Xcode Command Line Tools。**

## 两个关键约束

### 平台限制

再强调一次：**Apple Silicon + macOS 14 Sonoma 或更新。** Intel Mac 跑不了。

### 商标与许可证是分开的

README 里的原话：

> The GPL covers the source, while the Vorssaint name, icon and look are covered by [TRADEMARKS.md](https://github.com/vorssaint/vorssaint-utils/blob/main/TRADEMARKS.md), so **forks need their own identity**.

意思是：

| 覆盖对象 | 条款 |
|---|---|
| 源代码 | GPL 3.0 or later |
| 名字、图标、外观 | TRADEMARKS.md，单独约束 |

**所以 fork 之后必须换成自己的标识，不能沿用名字和图标。** 官方构建也只有维护者发布。

这一条对二次开发很关键，容易被忽略。

## 出问题了看哪里

-启动问题、权限、预览缺失 → [troubleshooting](https://github.com/vorssaint/vorssaint-utils/blob/main/docs/TROUBLESHOOTING.md)
- 需要帮助 → [support](https://github.com/vorssaint/vorssaint-utils/blob/main/SUPPORT.md)
- 报漏洞 → [SECURITY.md](https://github.com/vorssaint/vorssaint-utils/blob/main/SECURITY.md)

## 什么情况下别用它

- **Intel Mac 或 macOS 13 及更早** —— 硬门槛，不支持。
- **要求零权限** —— 它功能多，必然要申请较多权限。介意就别装。
- **想要跨平台** —— 只有 macOS，没有 Windows 或 Linux 版。
- **想 fork 后沿用原名** —— 商标不允许，得换标识。
`,
      resources: [
        {
          kind: "link",
          title: "隐私说明：什么会离开你的 Mac、什么不会",
          url: "https://github.com/vorssaint/vorssaint-utils/blob/main/docs/PRIVACY.md",
          note: "本地优先、无账号无追踪的具体承诺。联网只发生在更新检查、测速、Homebrew 操作、可选歌词查询和临时分享链接上。",
        },
        {
          kind: "link",
          title: "权限指南：每个 macOS 权限的大白话说明",
          url: "https://github.com/vorssaint/vorssaint-utils/blob/main/docs/PERMISSIONS.md",
          note: "这类系统级工具最该先读的一页。写明每个特性需要什么权限、以及不给权限会失去哪些功能。",
        },
        {
          kind: "link",
          title: "TRADEMARKS.md：为什么 fork 必须换标识",
          url: "https://github.com/vorssaint/vorssaint-utils/blob/main/TRADEMARKS.md",
          note: "GPL 只覆盖源代码，名字、图标和外观另行约束。准备 fork 之前必看，否则会直接踩商标问题。",
        },
      ],
    },
  },
  {
    slug: "watermarksremover",
    license: "MIT",
    linksCheckedAt: "2026-10-06",
    name: "watermarks-remover",
    nameZh: "AI 溯源标记清除",
    aliases: ["watermarks remover", "watermarks-remover", "ai 水印", "去除水印", "ai 标记", "c2pa", "exif 清除", "元数据清理", "invisible characters"],
    summary: "清除文本与文件里的多厂商 AI 溯源标记；分A/B/文件三层，但 B层改写会损伤文风，项目自己写明不保证骗过官方检测。",
    scenes: ["code", "docs", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["AI 水印", "元数据", "隐私", "C2PA", "EXIF", "开源"],
    body: "watermarks-remover 处理的是 AI 生成内容里的**溯源标记**——分三层，各自有明确的可靠性差异。\n**A 层是确定性的，也是最可靠的一层。** 移除不可见 Unicode 字符、异形空格、双向文本控制符和 tag 字符。这一层可验证，改动确定，不影响可读内容。\n**B 层针对统计水印，性质完全不同，必须先看清代价。** 文本水印藏在**用词本身**里——信号分散在 token 选择上，几乎每句话都带一点。项目自己的说法是：移除统计标记**需要逐句改写相当一部分文本，而不是整段调换**；而且任何改写都会把原作者的措辞换成改写模型的措辞，**语气、声音和精确度都会被抹平**。在 SEO、营销、客户交付这类正式文案上，这种退化对最在意文字的人来说是看得出来的。项目给的建议很直接：如果你的计划本来就是用便宜模型重写，**那为什么不一开始就用便宜模型生成？** 更简单、更便宜、结果一样或更好。\n**文件层清除的是 C2PA、EXIF、XMP 和文档属性**，覆盖 PNG、JPEG、WebP、AVIF、HEIC、TIFF、PDF、DOCX、XLSX、PPTX、EPUB、MP4/WAV/MP3/FLAC 等一批格式。\n**项目对自身能力的表述是我见过最诚实的一类，这里必须原样传达：既然厂商还没公开检测器和密钥，任何工具都无法诚实地担保「这个能通过官方检测」。** 报告必须区分可验证的部分和尽力而为的部分。它还提醒：Layer B 最好用**非原始来源的模型**改写——用 Claude 改写 Claude 的文本可能反而重新盖章。\n**两处工程设计值得单独说，因为它们体现的是「不毁数据」的思路。** 文本工具遇到二进制输入会**拒绝处理**并告诉你该用哪个工具，而不是解码压缩字节后把乱码写回去毁掉文件；无法识别的格式会被标为 unknown，**绝不自动当文本处理**——auto 模式下直接退出，不写任何输出。\n**最后是使用边界。** 项目自带一份 ethics 文档，原文划得很清楚：用于**你拥有或获授权处理**的内容的隐私与研究，**不用于学术造假，也不用于虚假声明「这是人工撰写的」**。项目声明用户需遵守当地法规并负责任地使用。这条边界不是装饰——移除溯源标记在合规、审计和披露场景里可能是违规行为，所以「我拥有这个内容」是使用前提，不是客套话。",
    officialUrl: "https://github.com/guillaumemeyer/watermarks-remover",
    officialLabel: "github.com",
    links: {
      official: "https://github.com/guillaumemeyer/watermarks-remover",
      github: "https://github.com/guillaumemeyer/watermarks-remover",
    },
    whoFor: "处理自己拥有或获授权内容的创作者和研究者，需要清除误入的不可见字符、图片EXIF 或文档元数据的人。",
    whoNot: "需要靠它冒充人工撰写来通过审查、规避披露义务或做学术造假的人——项目自己明确划了这条线；另外也不适合要求「保证通过官方检测」的场景，它做不到也不声称能做到。",
    installTips: [
      "纯脚本用法不需要任何依赖，只要 Python 3.10+ 标准库——直接跑 service/scripts 下的脚本即可。",
      "作为 agent skill 安装：python3 install_skill.py --skill remove-ai-marks --target claude-code，--list 可列出全部可用 skill。Windows 上用 py install_skill.py ...。",
      "skill 本身不含代码，只是通过 HTTP 驱动服务；所以还要另起服务，并按需设 WATERMARKS_SERVICE_URL。",
      "起服务：python3 service/scripts/server.py，默认只绑定 loopback（127.0.0.1:8765），需要设 WATERMARKS_SERVER_API_KEY 才要求鉴权。",
      "先用 inspect_file.py 看清楚再动手：python3 service/scripts/inspect_file.py draft.md。确认干净后再跑 clean_file.py。",
      "Layer B 默认只打印提示词、不需要模型；要用本地 Ollama 需显式设置 WATERMARKS_REWRITE_BACKEND=ollama，且远程端点默认禁止。",
    ],
    alternatives: ["openclaw"],
    icon: {
      letter: "W",
      color: "#2E7D6F",
    },
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
  {
    slug: "anydoc",
    license: "MIT",
    linksCheckedAt: "2026-10-06",
    name: "AnyDoc",
    nameZh: "Office 文档转 Markdown",
    aliases: ["anydoc", "docx 转 markdown", "office 转 markdown", "pptx 转 markdown", "xlsx 转 markdown", "文档转换", "epub 转 markdown", "pdf 转 markdown"],
    summary: "Rust 写的 Office 文档转 GitHub Markdown 库，中位 4.4ms、14 种格式全覆盖；扫描版 PDF 需显式走 Firecrawl Parse。",
    scenes: ["docs", "data", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["文档转换", "Markdown", "Rust", "Office", "开源", "PDF"],
    body: "anydoc 是 Firecrawl 做的 Rust 库，把 Word、PowerPoint、Excel、OpenDocument、RTF、EPUB、CSV 和 PDF 转成干净的 GitHub-Flavored Markdown。**它的定位是「单文档级别」的转换，不需要起服务。**\n\n**核心设计只有一句话：所有格式解析成一个共享的文档模型，再经过同一个 Markdown 序列化器输出。** 这意味着转义、表格、标题锚点、脚注的行为在所有格式上完全一致——不管输入是 2003 年的 .doc 还是昨天的 .pptx。而且**输出端的怪癖只修一次**：给 docx 修的表格转义问题，rtf、odt 和其他格式自动也就好了。\n\n**速度是它的硬指标之一：纯 Rust、无ML 模型、无外部服务，单文档中位转换时间 4.4 毫秒。** README 里的基准对比（100 份真实文档、14 种格式、LLM 盲评、482 次裁决）显示：anydoc 是**唯一覆盖全部 14 种格式**的工具，得分 81，且每个被评判的格式都是最高分。\n\n**格式识别看内容不看扩展名。** 格式是从字节本身读出来的——PDF 文件头、RTF 起始组、OLE 流名、ZIP 包 mimetype。**所以扩展名标错的文件照样能正确转换。** CSV 没有这类标记，才需要靠扩展名或显式指定格式。\n\n**结构保留做得比同类彻底**，包括：带锚点的标题、粗体/斜体/删除线、行内代码与代码块、链接与内部交叉引用、保留源文档编号的有序列表、合并单元格的表格、引用块、脚注与尾注、演讲者备注。公式会转成 LaTeX（Word/PPT 的 OMML、OpenDocument/EPUB 的 MathML、RTF 公式）。\n\n**五条接入路径，按你的场景选。** 想让 Claude Code、Codex、Cursor、OpenCode 这类 agent 能直接读 office 文档，走 agent skill 这条路：一条 `npx skills add firecrawl/anydoc` 即可。本地转单个文件用 CLI：`npx @firecrawl/anydoc report.docx`，首次运行会下预编译二进制。Node.js 侧 `npm install @firecrawl/anydoc`，转换跑在 libuv 线程池上，不阻塞事件循环。Python 的绑定会释放 GIL，其他线程照常跑。浏览器里用 `@firecrawl/anydoc-wasm`，**文件在本地转换，完全不离开机器**。\n\n**有一条边界必须先说清楚：本地读文本型 PDF，但不做 OCR。** 扫描件或纯图片的 PDF 会以 `NeedsOcr` 失败。**显式选择加入后，这类文档才会发给 Firecrawl Parse 做 OCR。** 要注意三点：**只有需要 OCR 的文档会离开机器，但整份文档都上传**（Parse 没有页码选择功能）；Parse 转不了的话 Node 会抛 `code: 'hosted'`、Python 抛 `HostedError`；**Rust crate 根本没有 ocr 选项，也从不联网。**\n\nMIT 许可。\n\n**怎么选：** 只需要本地把 office 文档变成干净 Markdown，它是最快的那个；需要在浏览器里离线处理，选 WASM 版；遇到扫描版 PDF 且不能接受上传，就说明这个场景不适合它。",
    officialUrl: "https://github.com/firecrawl/anydoc",
    officialLabel: "github.com",
    links: {
      official: "https://github.com/firecrawl/anydoc",
      github: "https://github.com/firecrawl/anydoc",
    },
    whoFor: "需要把混合来源的 Office 文档批量转成结构化 Markdown 喂给 LLM 的开发者，尤其是要求本地处理、不想上传文档的场景。",
    whoNot: "处理扫描版或纯图片 PDF 且要求文件不出本机的场景——OCR 必须显式走托管服务且整份上传；也不适合只转一两个文件的偶发需求，npx 首次下载二进制反而更慢。",
    installTips: [
      "最快试用：npx @firecrawl/anydoc report.docx。首次运行会下载对应平台的预编译二进制；想永久命令就npm install -g @firecrawl/anydoc。",
      "让 agent 直接读 office 文档：npx skills add firecrawl/anydoc，兼容 Claude Code、Codex、Cursor、OpenCode。",
      "Node：npm install @firecrawl/anydoc，然后import { toMarkdown } from '@firecrawl/anydoc'。转换跑在 libuv线程池上，不阻塞事件循环。",
      "Python 用 maturin develop 本地构建；绑定会释放 GIL，多线程场景友好。",
      "要完全离线（含浏览器内）：装 @firecrawl/anydoc-wasm，或直接开https://firecrawl.github.io/anydoc/ 的演示页，文件不出本机。",
      "扫描版 PDF 默认会失败并报 NeedsOcr。确认可以上传后才加 --ocr hosted，并注意整份文档都会离开机器。",
    ],
    alternatives: ["pandoc", "firecrawl", "markitdown"],
    icon: {
      letter: "A",
      color: "#B85C1E",
    },
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
  {
    slug: "darktable",
    license: "GPL-3.0",
    version: "5.6.2",
    linksCheckedAt: "2026-10-12",
    name: "darktable",
    nameZh: "暗房",
    aliases: ["darktable", "暗房", "raw 显影", "raw 处理", "胶片模拟", "lighttable"],
    kind: "opensource",
    source: "opensource",
    tags: ["raw", "摄影后期", "胶片模拟", "批量处理", "开源"],
    summary: "开源的 RAW 显影与照片管理工具，界面是「工作区 + 侧边面板」，非破坏式编辑，几万张批量处理比 Lightroom 更稳；代价是不做局部调整以外的智能功能，导入导出目录要自己规划。",
    scenes: ["photo"],
    platforms: ["windows", "macos", "linux"],
    body: "darktable 是一个专做 RAW 显影的免费开源软件。它不做图片管理，也不做修图，只管一件事：把相机拍出来的 RAW 变成能看的成片，顺带把成片存成可继续编辑的 XMP。\n它的操作模型是「工作区 + 侧边面板」：左边是胶片库，中间是全屏预览，右边一列是曝光、色彩、细节等模块的滑杆，改哪一项只调整对应模块的变量，原图数据始终不动。这是非破坏式编辑，也是它和 Lightroom 最像的地方。\n它真正比 Lightroom 强的地方在批量。Lightroom 的目录结构是自家私有格式，换机迁移容易出问题；darktable 把照片放在你指定的普通文件夹里，清单只记录处理参数。几千张按目录批量套同一套参数，速度和稳定性都更好，也更适合先把图导到移动硬盘再处理的流程。\n代价也要说清。darktable 没有 AI 降噪、没有主体识别、没有自动蒙版，天空替换和局部调整基本得靠自己画蒙版或靠第三方模块。它默认用 OpenCL 调 GPU，驱动不匹配时会出黑图或色彩异常，官方文档专门有一页讲这件事。价格上它是完全免费且无功能阉割的，官方与社区版没有区别。\n许可证是 GPL v3，可以在 https://www.darktable.org/ 和 GitHub 的 release 页下载安装包，Windows、macOS、Linux 都有对应构建，仓库在 https://github.com/darktable-org/darktable。当前版本 5.6.2，仓库仍在每天提交。",
    officialUrl: "https://www.darktable.org/",
    officialLabel: "darktable.org",
    links: {
      official: "https://www.darktable.org/",
      github: "https://github.com/darktable-org/darktable",
    },
    whoFor: "拍 RAW、愿意用滑杆自己调色，且一次要处理几百到几万张的人；或者需要照片留在普通硬盘目录里、不想被某个软件的私有格式绑住的人。",
    whoNot: "想要一键去瑕、自动抠图、AI 降噪的；或者习惯 Lightroom 手机版那种简化交互、对侧边面板这一堆模块没有耐心的。",
    installTips: [
      "从官网或 GitHub release 下载对应系统的安装包，Windows 选 win64.exe，macOS 选 arm64 或 x86_64 的 dmg。",
      "第一次启动选存储模式：初学选内置 SQLite 数据库，放移动硬盘则选「目录」，再指定照片文件夹。",
      "在胶片库里导入照片目录，然后在「开发」工作区调曝光和色彩模块。",
      "调完点「导出」，目标格式选小写 xmp，这样参数存成侧车文件，换机器还在。",
      "批量套参数：先用一张调好，右键存为样式，在胶片库里全选再套用这个样式。",
    ],
    alternatives: ["gimp", "krita"],
    icon: {
      letter: "d",
      color: "#3C4043",
    },
  },
  {
    slug: "rawtherapee",
    license: "GPL-3.0",
    version: "5.13",
    linksCheckedAt: "2026-10-12",
    name: "RawTherapee",
    nameZh: "RawTherapee",
    aliases: ["rawtherapee", "raw 处理", "raw 显影", "胶片模拟", "手工暗房"],
    kind: "opensource",
    source: "opensource",
    tags: ["raw", "摄影后期", "胶片模拟", "降噪", "开源"],
    summary: "开源 RAW 显影工具，算法比同类更激进（去马赛克、AI 降噪、多曝光合成），一图一档不做批量管理；适合愿意为单张好照片调参数的人。",
    scenes: ["photo"],
    platforms: ["windows", "macos", "linux"],
    body: "RawTherapee 是一个免费开源的 RAW 显影软件，界面像传统暗房软件：一棵左侧的工具树，点开某个工具右侧出参数，工具按「基础 → 色调 → 细节 → 特效」分层排好。它的定位是把手工暗房的做法搬到屏幕上——同一张 RAW 你可以来回试不同冲印配方。\n它在算法上比同类激进，这是它最实在的差异。去除马赛克（去色度噪点）在同类里普遍偏保守，它下手更重、能把彩噪压得很干净；降噪用的机器学习模型可以在官方模型之外自己训练；亮度降噪和细节保留能分开控制，拍高 ISO 又要留头发丝的场合比 Lightroom 更灵活。它还自带全景拼接、焦点堆栈、多重曝光合成这几个「顺手做掉」的活，不用切别的软件。\n代价是它不做批量管理。没有胶片库那样的浏览与批处理视图，参数主要靠「保存/载入处理配方」（.proc 文件）复用，一次处理几千张的流程会很别扭。性能上也比 darktable 重，5.13 版要求 macOS 26 或更新的 macOS 才给 Universal 包，Windows 和 Linux 的包按架构分开（x86_64 与 arm64），arm64 Windows 还是实验性支持。机器学习降噪模型首次使用要下载，离线环境下用不了那部分功能。\n许可证是 GPL v3，官网 https://rawtherapee.com/ 与 GitHub release 页都能下载，Windows、macOS、Linux 都有对应构建，仓库在 https://github.com/RawTherapee/RawTherapee。当前版本 5.13（2026-07-26），仓库保持活跃。",
    officialUrl: "https://rawtherapee.com/",
    officialLabel: "rawtherapee.com",
    links: {
      official: "https://rawtherapee.com/",
      github: "https://github.com/RawTherapee/RawTherapee",
    },
    whoFor: "愿意为单张照片慢慢调参数、把降噪与细节分离控制当作刚需的人；或者需要全景拼接、焦点堆栈这类合成操作、不想再开第二个软件的人。",
    whoNot: "要按文件夹批量套参数处理几千张的；或者要照片管理和人脸识别式浏览的——它只管显影，不管管照片。",
    installTips: [
      "从官网或 GitHub release 下载对应系统的包；macOS 的 Universal 包要求 macOS 26 或更新，Windows 按 x86_64 或 arm64 选。",
      "首次打开先在偏好设置里指定默认的输入目录和输出目录，之后导入会快很多。",
      "导入 RAW 后从左侧「基础」开始：曝光、白平衡、对比度定大关系，再逐层往下调。",
      "调出满意的配方后在曲线上右键存成 .proc 文件，下次套用只需载入它。",
      "机器学习降噪要联网下载官方模型，离线环境请关掉相关工具用传统降噪。"
    ],
    alternatives: ["darktable"],
    icon: {
      letter: "R",
      color: "#3A6B7C"
    }
  },
  {
    slug: "lossless-cut",
    license: "GPL-2.0-only",
    version: "3.69.0",
    linksCheckedAt: "2026-10-12",
    name: "LosslessCut",
    nameZh: "无损剪切",
    aliases: ["losslesscut", "lossless cut", "无损剪切", "无损剪辑", "视频剪切", "视频裁剪"],
    kind: "opensource",
    source: "opensource",
    tags: ["视频剪辑", "无损剪切", "ffmpeg", "批处理", "开源"],
    summary: "基于 FFmpeg 的无损剪切与拼接工具，不重编码所以不损画质、速度接近复制文件；适合录屏和长视频里截片段，不适合做正式剪辑。",
    scenes: ["photo"],
    platforms: ["windows", "macos", "linux"],
    body: "LosslessCut 是一个免费开源的视频剪切工具，做的事很专：把长视频里的某几段留下来，或切掉中间某一段。它不重编码，直接改容器或按关键帧切，画质一帧不损、速度接近复制文件——录一段两小时的屏幕录像再把中间无关的部分去掉，用它几秒钟就完事，剪映或 Premiere 做不到这个体量上的无损。\n它的实际能力比「剪切」多：逐帧步进定位关键帧、按时间段批量保留或移除、替换或合并片段、把任意容器转格式（走 FFmpeg 所以支持面很广）、提取音轨、改时间码、还有 3.69 版新增的「抽稀」——只保留关键帧把长视频压小。它还能用命令行批处理，一批文件套同一条剪切规则。\n代价要说清。它不是 NLE，没有时间线上的多轨编排、字幕轨、转场、关键帧动画，也没有音频混音台。切点只能落在关键帧上，两个关键帧之间的内容必然被丢弃（它会在剪切点附近关键帧不足时给出警告）。遇到 MP4 里关键帧间隔很长（长 GOP 录制）的情况，一刀下去可能要连带丢掉前后一秒多的内容。真要做成片，还得回到专业剪辑软件。\n还有一个安装坑要写在前面：Windows ARM64 版本的正式 release 里缺 ffmpeg.exe，作者自己在 release 说明里标了警告，让你改用 nightly 版。macOS 的 universal pkg 官方文件名里直接带 DONT-USE-THIS-FILE，选arm64 或 x64 的 dmg 才靠谱。\n许可证是 GPL v2 only（package.json 里写的是 GPL-2.0-only，不是 or-later），官网 https://losslesscut.app/ 与 GitHub release 页都有下载，Windows、macOS、Linux 都有构建，仓库在 https://github.com/mifi/lossless-cut。当前版本 3.69.0（2026-06-04），星标 4.4 万。",
    officialUrl: "https://losslesscut.app/",
    officialLabel: "losslesscut.app",
    links: {
      official: "https://losslesscut.app/",
      github: "https://github.com/mifi/lossless-cut",
    },
    whoFor: "要处理录屏、课程录像、采访原片这类长视频，只需要截出几段、不想重编码损画质的人；或者需要用命令行批量处理片段的。",
    whoNot: "要做多轨剪辑、加字幕轨、转场、音频混音的人——它不是剪辑软件；长 GOP 素材上对帧级精确有要求的人也不适合，切点只能落在关键帧。",
    installTips: [
      "从官网或 GitHub release 下载对应系统的包；macOS 选 arm64 或 x64 的 dmg，别用文件名带 DONT-USE-THIS-FILE 的 universal pkg。",
      "Windows ARM64 设备请用 nightly 版，正式 release 缺 ffmpeg.exe，作者已在 release 说明里警告。",
      "把视频拖进来，用左右方向键逐帧移动定位切点，注意时间线上标出的关键帧位置。",
      "切完点「导出」，保持原始容器与编码参数（Copy 模式）就是无损；这一步别改成重新编码。",
      "批量处理走命令行：lossless-cut-cli 输入文件 -f 00:01:00 -t 00:02:00 -o 输出文件。",
    ],
    alternatives: ["kdenlive","obs-studio"],
    icon: {
      letter: "L",
      color: "#2E7D6B",
    },
  },
  {
    slug: "kdenlive",
    license: "GPL-3.0",
    version: "26.08.1",
    linksCheckedAt: "2026-10-12",
    name: "Kdenlive",
    nameZh: "Kdenlive",
    aliases: ["kdenlive", "kden", "kde 剪辑", "开源剪辑", "linux 剪辑"],
    kind: "opensource",
    source: "opensource",
    tags: ["视频剪辑", "多轨", "字幕", "开源", "KDE"],
    summary: "KDE 出品的免费开源多轨剪辑器，功能接近 Premiere 而不收钱，字幕与多机位够用；代价是默认设置偏生硬，渲染比 DaVinci 慢，Windows 与 macOS 上属于「能用但不是原生舒服」。",
    scenes: ["photo"],
    platforms: ["windows", "macos", "linux"],
    body: "Kdenlive 是 KDE 项目的免费开源视频剪辑软件，做的是标准的多轨非线性剪辑：主轨道加任意数量的视频轨、音频轨、字幕轨，时间线上剪裁、吸附、涟漪滚动、多机位同步、关键帧与转场都在。它的MLT 引擎是开放的，插件生态虽不如 After Effects 但够做常见活。字幕编辑是它比较突出的部分——可以直接内嵌字幕、导入导出 SRT、还能烧录到画面上，这块比很多同类顺手。\n它真正的价值是把「专业级剪辑」这件事免费且跨平台。DaVinci Resolve 的免费版限制多，Shotcut 和 Olive 都轻量到缺功能，Kdenlive 是这几家里功能最接近完整 NLE 的一个，代价是你得接受 KDE 风格的界面密度——工具栏和参数面板比剪映满得多，不习惯会觉得吵。\n代价要说清。默认设置是为「能跑起来」而不是「跑得快」：渲染策略和预览质量经常需要手动调，默认直接上手导一1080p 会比你预期的慢不少。它的渲染速度整体不及 DaVinci Resolve 的 GPU 方案。界面在 Windows 和 macOS 上是从 Qt 移植过去的，功能一致但手感不如原生应用——KDE 应用在 Linux 上才最顺。此外它需要 FFmpeg，Linux 上装 Flatpak 版通常已经打包好，手动装则要先备齐依赖。\n许可证是 GPL v3，可从官网 https://kdenlive.org/ 或 KDE 下载站 https://download.kde.org/stable/kdenlive/ 获取，Windows 有安装版和便携版 exe、macOS 按 arm64 与 x86_64 给 dmg、Linux 给 AppImage。源码的上游仓库在 KDE 的自建 GitLab（invent.kde.org/multimedia/kdenlive），GitHub 上的 KDE/kdenlive 是官方镜像。当前版本 26.08.1，仓库每天都有提交。",
    officialUrl: "https://kdenlive.org/",
    officialLabel: "kdenlive.org",
    links: {
      official: "https://kdenlive.org/",
      github: "https://github.com/KDE/kdenlive",
    },
    whoFor: "需要完整多轨剪辑、字幕工作流，且不肯或不能付订阅费的人；以及想在 Linux 上做正经剪辑的人。",
    whoNot: "要极致渲染速度的（DaVinci Resolve 的 GPU 路径更快）；只想随手剪个片段的（用 LosslessCut 更省事）；对界面密度敏感的人。",
    installTips: [
      "去 https://download.kde.org/stable/kdenlive/ 按系统选包：Windows 有安装版与 portable 版，macOS 按芯片选 dmg，Linux 直接下 AppImage。",
      "Linux 上省事的做法是装 Flatpak 版，FFmpeg 等依赖已经打包好。",
      "新建项目后先在项目设置里定分辨率与帧率，必须和素材一致，否则导出尺寸会错。",
      "字幕用「字幕」菜单里的 Add Subtitle 工具轨，导入 SRT 即可，烧录用滤镜。",
      "导出前到「项目设置 → 编码」里选预设并先渲染一段短的试手——默认设置的渲染比预期慢。",
      "界面乱的时候记住项目设置页可恢复默认，改坏了不必重装。",
    ],
    alternatives: ["obs-studio","lossless-cut","handbrake"],
    icon: {
      letter: "K",
      color: "#1D5B8F",
    },
  },

  {
    slug: "immich",
    license: "AGPL-3.0",
    version: "3.3.1",
    linksCheckedAt: "2026-10-12",
    name: "Immich",
    nameZh: "Immich",
    aliases: ["immich", "自建相册", "私有云相册", "照片备份", "google photos 替代", "家庭相册"],
    kind: "opensource",
    source: "opensource",
    tags: ["相册管理", "自托管", "手机备份", "人脸识别", "Docker"],
    summary: "自托管的照片视频库，手机自动备份 + 时间线浏览 + 本地人脸识别，功能对标 Google Photos 且照片不出本机；代价是必须自己有一台服务器，AGPL 许可改起来有约束。",
    scenes: ["photo"],
    platforms: ["linux"],
    body: "Immich 是一个开源自托管的照片与视频库，最常见的用途是替代 Google Photos：手机拍完照自动备份到自己的服务器，用起来像相册 App，但原图从不上传到别人的云。当前星标超过 11 万，是这个方向上最活跃的项目之一。\n它的功能线覆盖得相当完整：时间线与相册、按人脸和地点自动归类（识别在你的服务器上跑，不调外部 API）、地图视图、搜索、共享相册与分享链接、多人协作、手机端 App、以及视频转码供流式播放。和 Google Photos 比，它多的是「原文件完整保留」和「不依赖订阅」，少的是 Google 那套训练过的检索与修图模型。\n门槛要说清。它没有云端试用，起步就是一台服务器：4 核 8G 内存起，装 Docker（官方提供 docker-compose），然后手机 App 填服务器地址。国内家用宽带通常还要处理内网穿透或用 Cloudflare Tunnel 把443端口转出来。备份大库时磁盘空间按原始文件算，一家人的照片几年下来几 TB 很常见，官方也建议配独立存储。\n还有一条法务细节值得先知道：许可证是 AGPL-3.0，比普通开源严格一档——你通过网络提供服务给别人用，就必须把修改后的源码公开。纯自用没问题，但要把它当产品的一部分对外提供服务，得先读一遍协议。\n官网 https://immich.app/ 有完整的安装文档，仓库在 https://github.com/immich-app/immich。当前版本 v3.3.1（2026-10-08），仓库每天都有提交。移动端 App 在应用商店与 F-Droid 都有，桌面端走 Docker。",
    officialUrl: "https://immich.app/",
    officialLabel: "immich.app",
    links: {
      official: "https://immich.app/",
      github: "https://github.com/immich-app/immich",
    },
    whoFor: "有NAS 或服务器、愿意自己维护，想把全家照片从商业云相册搬回自己手里的人；或者本来就对「原图上云」这件事有顾虑的人。",
    whoNot: "没有一台常开服务器的人（这是硬门槛，没有云端版可用）；或者要求开箱即用、不想处理内网穿透和磁盘规划的人。",
    installTips: [
      "准备一台常开的服务器，官方建议至少 4 核 8G 内存，磁盘按原始照片总量算并留出转码空间。",
      "装 Docker，用官方 docker-compose 起服务，务必把数据库、机器学习模型目录和照片目录都挂成持久卷。",
      "首次进入网页端设置管理员账号，再在手机 App 里填服务器地址完成首次登录。",
      "在手机端开启「自动备份」，并把「仅 WiFi 下备份」当作默认值，流量党不会被打垮。",
      "首次全量导入后去设置里跑一次「重建机器学习」，人脸与地点识别才会生效。",
      "对外分享前想清楚授权边界：AGPL-3.0 要求你对外提供服务时公开你改过的源码。",
    ],
    alternatives: ["darktable","rawtherapee","exiftool"],
    icon: {
      letter: "I",
      color: "#4250AF",
    },
  },

  {
    slug: "obs-studio",
    license: "GPL-2.0",
    version: "32.2.2",
    linksCheckedAt: "2026-10-12",
    name: "OBS Studio",
    nameZh: "OBS",
    aliases: ["obs", "obs studio", "录屏", "直播推流", "录屏软件", "屏幕录制"],
    kind: "opensource",
    source: "opensource",
    tags: ["录屏", "直播", "推流", "分场景", "开源"],
    summary: "免费开源的录屏与直播推流工具，场景切换 + 分场景录制 + 多平台同时推流是它的强项；代价是设置项多到需要花时间调，新手第一次开机会晕。",
    scenes: ["photo"],
    platforms: ["windows", "macos", "linux"],
    body: "OBS Studio 是免费开源的录屏与直播软件，也是这个领域事实上的默认选择。它的核心概念是「场景」：每个场景是一套画面来源（窗口、摄像头、显示器、文字、图片）的组合，加上一套「来源」的变换。你可以先摆好「开始直播」「只是说话」「演示文档」这几个场景，直播时一键切换，而录屏时每个场景还能分别录成独立文件。\n它相对同类真正不可替代的能力有两个。一是分场景录制：录一整节课，切场景时 OBS 自动开新文件，后期不用再从两小时的长录像里剪。二是多平台同时推流：配置里加多个 RTMP 目标，可以一次把画面同时送到多个平台，不用开多个软件。对做直播或录课的人，这两条省掉的是实打实的重复劳动。\n代价是学习成本。设置项分三层（设置、场景属性、来源属性），且同名概念在不同层含义不同，新手第一次打开会不知道该动哪里。它默认抓取的是显示器而不是窗口，录浏览器内容时如果窗口被遮住就会录到遮挡它的东西，这个要专门开「窗口捕获」并设对匹配方式。编码器选错（该用硬件编码却用了软件编码）会让 CPU 跑满、掉帧。\n它是免费且没有阉割的，不分专业版与普通版。许可证是 GPL v2，官网 https://obsproject.com/ 与 GitHub release 页都有下载，Windows、macOS、Linux 都有构建（Linux 官方推荐 Flatpak 或 Ubuntu 的 deb）。仓库在 https://github.com/obsproject/obs-studio，星标超过 7.7 万。当前版本 32.2.2（2026-08-14），仓库保持高频提交。",
    officialUrl: "https://obsproject.com/",
    officialLabel: "obsproject.com",
    links: {
      official: "https://obsproject.com/",
      github: "https://github.com/obsproject/obs-studio",
    },
    whoFor: "做直播、或要录制课程/演示/游戏串流的人；以及需要一次推到多个平台的人。",
    whoNot: "只想快速录一段屏幕、点一下就完事的人（设置项太多）；也不适合用来剪片子——它负责录，剪辑要交给别的软件。",
    installTips: [
      "官网下载对应系统的安装包；Linux 上优先用 Flatpak 版，依赖打包得最干净。",
      "首次进入先在设置 → 视频里定好基础分辨率与输出分辨率，输出不要高于显卡能实时编码的上限，否则会掉帧。",
      "录浏览器内容要用「窗口捕获」并指定窗口标题匹配方式，别用显示器捕获，否则窗口被遮挡就录进去了。",
      "设置 → 输出 → 录像里开启「自动分场景录制」并指定文件路径，长视频会按场景自动切开。",
      "直播在设置 → 推流里逐个添加 RTMP 服务，同一场景可以同时推多个目标。",
      "编码器优先选硬件编码（NVIDIA 为 NVENC、Intel 为 QSV、AMD 为 AMF），软件编码 x264 会吃满 CPU。",
    ],
    alternatives: ["kdenlive","handbrake"],
    icon: {
      letter: "O",
      color: "#302E31",
    },
  },

  {
    slug: "handbrake",
    license: "GPL-2.0",
    version: "1.11.2",
    linksCheckedAt: "2026-10-12",
    name: "HandBrake",
    nameZh: "HandBrake",
    aliases: ["handbrake", "视频转码", "格式转换", "h.265 转码", "视频压缩", "转码器"],
    kind: "opensource",
    source: "opensource",
    tags: ["视频转码", "h.265", "压缩", "预设", "开源"],
    summary: "开源视频转码工具，H.264 与 H.265 的速度和体积权衡做得比同类细致，官方预设直接对应「设备 + 用途」；代价是转码原理上要有损、很吃 CPU，界面选项需要理解才能调。",
    scenes: ["photo"],
    platforms: ["windows", "macos", "linux"],
    body: "HandBrake 是免费开源的视频转码工具，输入你已有的视频，输出能在手机、电视、播放器、浏览器上正常播的新文件。它处理的是「已经录好的视频」，不是录屏，也不是剪辑器——这是它和 OBS、Kdenlive 的分工。\n它的强项是把转码这件技术活变成选预设。官方预设按设备与用途分好（Fast 1080p30 这类通用档、Web 优化、带 Apple TV 兼容的、H.265 体积最小），选一个预设基本就能得到能用的结果，不用理解码率与 GOP 的关系。想再压体积，它给 H.265（HEVC）编码器，同样画质下通常比 H.264 小三到四成，代价是编码慢很多、可用设备范围窄一些。它的 GUI 还带实时预览，能看到改设置后体积估算和画面差异，这条在调参时很省时间。\n代价要说清。转码是有损的，压得越狠画质损失越明显，「无损」在这里不成立；4K 素材转一遍可能跑几十分钟到几小时，机器越慢越久（它可以用 GPU 加速，但只有部分编码器支持）。另外它的选项是专业软件那一套：色彩范围、H.264 profile、编码器 preset、音频质量，参数名看不懂时很容易改出「文件大了但画质没提升」的结果——常见原因是对已经压过的素材二次转码。\n许可证有一处特别值得说明：主体是 GPL v2，但它的 LICENSE 明确指出 AAC 编码库 fdk-aac 的许可与 GPLv2 不兼容，所以官方构建默认不包含 fdk-aac——这也是为什么在 HandBrake 里选不到 fdk-aac 编码器，需要它得自己编译且产物不能再分发。官网 https://handbrake.fr/ 与 GitHub release 页都能下载，Windows、macOS、Linux 都有。仓库在 https://github.com/HandBrake/HandBrake，星标超过 2.4 万。当前版本 1.11.2。",
    officialUrl: "https://handbrake.fr/",
    officialLabel: "handbrake.fr",
    links: {
      official: "https://handbrake.fr/",
      github: "https://github.com/HandBrake/HandBrake",
    },
    whoFor: "手上有一堆录好的视频，需要换格式、压体积、或者转成能在某台设备上播的文件的人。",
    whoNot: "想录屏的（用 OBS）、想做剪辑的（用 Kdenlive）；以及对画质零容忍的人——转码一定有损，压到极限肉眼能看出来。",
    installTips: [
      "官网下载对应系统的安装包，三平台都有官方构建。",
      "导入源文件后先看右侧的预览区：它会显示预计体积和画质，主界面能边调边看。",
      "第一次用就直接选官方预设，别急着改参数；预设按设备与用途分好，选对就够用。",
      "想压得更小就切到 H.265/x265 预设，同样画质体积通常小三四成，但耗时会长很多。",
      "4K 或长片先在设置里启用 GPU 编码（x264/x265 的 NVENC、QSV、VideoToolbox），否则会跑很久。",
      "不要对已经压过的素材二次转码，画质损失会叠加而体积收益很小——这是最常见的操作失误。",
    ],
    alternatives: ["lossless-cut", "kdenlive"],
    icon: {
      letter: "H",
      color: "#B3541E",
    },
  },

  {
    slug: "exiftool",
    license: "GPL-3.0",
    version: "13.59",
    linksCheckedAt: "2026-10-12",
    name: "ExifTool",
    nameZh: "ExifTool",
    aliases: ["exiftool", "exif", "元数据", "拍摄信息", "照片信息", "exif 编辑", "批量改 exif"],
    kind: "opensource",
    source: "opensource",
    tags: ["元数据", "exif", "批处理", "命令行", "版权信息"],
    summary: "读写照片元数据的命令行工具，识别几千种相机的私有标签，能批量清 GPS、批量写版权与作者；代价是命令行操作，改错了没有撤销。",
    scenes: ["photo", "code"],
    platforms: ["windows", "macos", "linux"],
    body: "ExifTool 是用来读写照片元数据的命令行工具，也是这个领域事实上的标准：相机厂商的私有标签它能读出上千种，很多软件读不出来的拍摄参数（快门次数、镜头编号、机身编号）它都能读，也能批量改。\n它最常见的用途是清理隐私：一次递归命令就能把整棵目录里所有图片的 GPS 坐标、机型、机身编号删干净，发图之前必做的一步。另一头是写信息——批量给几千张照片填上作者、版权与说明，摄影师交付原片时用得很多。它还能按元数据筛选文件，比如「只拷出所有 EXIF 里有 GPS 的照片」，这类活图形界面做不了。\n代价是它是命令行工具，没有界面，所有操作靠参数组合，也因此没有撤销。改之前先备份：加 -overwrite_original 是原地改不加备份，不加这个参数默认生成 _original 副本，这是更安全的做法。它默认不改文件本身的内容，只改元数据；需要真正重写文件时得显式指定操作，而且大文件重写耗时。Windows 用户要注意它需要 Perl 环境（官网提供打包了 Perl 的独立 exe，下载那个版本就不用自己装）。\n许可证有一处需要注意：仓库根目录的 LICENSE 文件是 GPL v3 原文，README 里却写「与 Perl 本身相同的条款」（Artistic License 或 GPL 二选一）。两者不一致，这里以许可证文件为准记为 GPL-3.0。实际使用上这不影响你——它是工具不是库，条款分歧只在二次分发时才起作用，官网 https://exiftool.org/ 提供下载与完整文档，Windows、macOS、Linux 都能跑。版本 13.59，官网的 history 页面有逐版变更记录。",
    officialUrl: "https://exiftool.org/",
    officialLabel: "exiftool.org",
    links: {
      official: "https://exiftool.org/",
      github: "https://github.com/exiftool/exiftool",
    },
    whoFor: "要批量清理照片里的隐私信息、批量写入版权与作者信息、或者要按拍摄参数筛选文件的人。",
    whoNot: "想要图形界面的人；也不适合在没有备份的情况下直接上手改——它是命令行工具，改错了没有撤销。",
    installTips: [
      "先备份目录，或者给命令加 -overwrite_original 之外的默认行为（保留 _original 副本）再动手。",
      "看信息：exiftool -a -u -g 文件名，-a 保留重复标签、-u 读未知标签、-g 按组显示。",
      "批量清 GPS：exiftool -gps:all -r 目录路径，这条会递归处理整个目录。",
      "批量写作者与版权：exiftool -Artist=\"名字\" -Copyright=\"年份 作者\" -r 目录路径。",
      "先干跑确认范围：加 -dry-run 参数会打印将要做的改动而不实际执行，改批量命令前务必先跑一遍。",
      "Windows 用户下载官网提供的自包含 exe 包（内含 Perl），否则要先自己装 Perl 环境。",
    ],
    alternatives: ["darktable", "immich"],
    icon: {
      letter: "E",
      color: "#4A5568",
    },
  },
  {
    license: "GPL-3.0",
    version: "2026.914.233613",
    slug: "sunshine",
    linksCheckedAt: "2026-10-13",
    name: "Sunshine",
    nameZh: "Sunshine",
    aliases: ["sunshine", "串流服务端", "串流主机", "moonlight 服务端"],
    kind: "opensource",
    source: "opensource",
    scenes: ["games", "tools"],
    platforms: ["windows", "macos", "linux"],
    tags: ["串流", "自托管", "游戏", "开源"],
    summary: "自托管的游戏串流服务端，把本机游戏画面实时推给 Moonlight 客户端，局域网与公网组网后都能用。",
    body: "Sunshine 是开源的自托管游戏串流服务端，装在跑游戏的那台电脑上，把画面实时编码推出去，Moonlight 客户端在另一台设备上接收并回传操作。它解决的是「主力机在书房，人想在客厅电视、笔记本或掌机上玩」。\n它跑在 GPU 的硬件编码器上：NVIDIA NVENC、Intel QSV、AMD AMF 都能识别，编码参数在自带的 Web 管理界面里调，分辨率、帧率、码率按网络条件设；除了串游戏，也能串整个桌面，配合虚拟显示器还能做无头输出。客户端配对走证书机制，官方明确把它定位为 Moonlight 的配套服务端。\n代价要先知道：串流质量取决于主机编码器与网络，Wi-Fi 拥塞时掉帧和延迟都明显；服务要监听一组端口（47984 起），公网串流需要自己解决组网或穿透，直接暴露到公网不安全；Windows 上部分手柄功能要另装 Virtual HID Broker，那是单独授权的组件。\n项目以 GPL-3.0 开源，Linux 从 Flathub 安装，Windows 与 macOS 从 GitHub Releases 取安装包，版本号按日期生成，更新很勤。",
    officialUrl: "https://app.lizardbyte.dev/Sunshine/",
    officialLabel: "app.lizardbyte.dev",
    links: {
      official: "https://app.lizardbyte.dev/Sunshine/",
      github: "https://github.com/LizardByte/Sunshine",
    },
    price: "免费",
    installTips: [
      "Windows 与 macOS 从 GitHub Releases 下载安装包；Linux 用 Flathub 安装 dev.lizardbyte.app.Sunshine。",
      "装完用浏览器打开 https://localhost:47990，设置管理账号并登录。",
      "在 Web 界面确认音频与显示器页里编码器被正确识别（NVENC / QSV / AMF / VAAPI）。",
      "客户端装 Moonlight，两端在同一网络下输入客户端显示的配对码完成配对。",
    ],
    whoFor: "家里有高性能主机或游戏本，想在电视盒子、旧笔记本、掌机上远程玩已购游戏的人。",
    whoNot: "对延迟斤斤计较的竞技玩家——串流永远比本地多出可感知的延迟；网络还是 Wi-Fi 直连隔两堵墙的也不要指望。",
    alternatives: ["moonlight-qt"],
    featured: false,
    icon: { letter: "S", color: "#D97706" },
  },

  {
    license: "GPL-3.0",
    version: "6.2.0",
    slug: "moonlight-qt",
    linksCheckedAt: "2026-10-13",
    name: "Moonlight",
    nameZh: "Moonlight",
    aliases: ["moonlight", "串流客户端", "gamestream 客户端", "moonlight pc"],
    kind: "opensource",
    source: "opensource",
    scenes: ["games", "tools"],
    platforms: ["windows", "macos", "linux"],
    tags: ["串流", "游戏", "开源", "低延迟"],
    summary: "开源游戏串流客户端，连 NVIDIA GameStream 或 Sunshine 服务端，把另一台电脑的游戏画面低延迟拉到本机。",
    body: "Moonlight 是开源的游戏串流客户端，连 NVIDIA GameStream 或自托管的 Sunshine 服务端，把另一台电脑上的游戏画面拉到本机显示、把键鼠手柄操作传回去。它解决的是「游戏跑在主机上，人不在主机前」。\n画质与编码是它的强项：支持 H.264、HEVC 和 AV1（AV1 需要 Sunshine 且主机 GPU 支持），HDR 与 YUV 4:4:4（后者仅 Sunshine）也在支持列表里，官方把它定位成低延迟串流，动作游戏能玩。客户端覆盖面很广：Windows、macOS、Linux（Flathub）、Steam Link，树莓派 4/5 和通用 ARM 板子有专门的安装文档。\n代价要先知道：它只是通路，不是云游戏——服务端要么是 NVIDIA 显卡自带的 GameStream（NVIDIA 正在逐步收缩这项功能），要么自己装 Sunshine；体验高度依赖网络，跨公网需要自己组网或端口转发，Wi-Fi 拥塞时延迟和丢帧立刻可见。\n项目以 GPL-3.0 开源，安装包从 GitHub Releases（Windows、macOS、Steam Link）与 Flathub（Linux）获取，更新频繁。",
    officialUrl: "https://moonlight-stream.org",
    officialLabel: "moonlight-stream.org",
    links: {
      official: "https://moonlight-stream.org",
      github: "https://github.com/moonlight-stream/moonlight-qt",
    },
    price: "免费",
    installTips: [
      "从 GitHub Releases 或 Flathub 安装对应平台版本；Steam Link 与树莓派看官方安装文档。",
      "确保服务端就绪（NVIDIA GameStream 或已配置好的 Sunshine），客户端会自动发现同一网络下的主机。",
      "在服务端上输入客户端显示的四位配对码完成配对。",
      "选游戏或串整个桌面；卡顿先查网络链路，再回头确认服务端编码器设置。",
    ],
    whoFor: "有 NVIDIA 显卡的主机或已装 Sunshine，想在电视、旧笔记本、掌机上远程玩的人。",
    whoNot: "指望它当云游戏服务的人——它只是通路，游戏跑在你自己的机器上，网不行一切白搭。",
    alternatives: ["sunshine"],
    featured: false,
    icon: { letter: "M", color: "#1E3A8A" },
  },

  {
    license: "GPL-3.0",
    version: "2.22.3",
    slug: "heroic",
    linksCheckedAt: "2026-10-13",
    name: "Heroic Games Launcher",
    nameZh: "Heroic 游戏启动器",
    aliases: ["heroic", "heroic games", "epic 启动器", "gog 启动器", "游戏启动器"],
    kind: "opensource",
    source: "opensource",
    scenes: ["games"],
    platforms: ["windows", "macos", "linux"],
    tags: ["游戏启动器", "Epic", "GOG", "开源"],
    summary: "开源游戏启动器，把 Epic、GOG、Amazon 三个商店的游戏库收进一个跨平台界面，Linux 上靠 Wine/Proton 跑 Windows 游戏。",
    body: "Heroic 是开源的游戏启动器，把 Epic、GOG、Amazon Prime 三个商店的游戏库收进同一个界面，Windows、macOS、Linux 都能用。它解决的是「游戏分散在三个官方启动器里」，以及 Linux 用户长期没有官方客户端的问题。\n三个商店各有实现：Epic 走 Legendary，GOG 用项目自研的 gogdl，Amazon 用 Nile。登录对应账号即可同步游戏库，已购游戏直接下载安装，也支持把本地已有的安装包 sideload 进来。Linux 上可以用 Wine 或 Proton 跑 Windows 游戏，能下载社区维护的自定义兼容层版本，内置 ProtonDB 与 Steam Deck 兼容性信息的查询入口。\n代价要先知道：它不是官方客户端，商店接口变动时功能可能暂时受损；Linux 上游戏能不能跑取决于具体游戏的反作弊与兼容性，README 明确写了 Epic 线上反作弊在 macOS 和 Linux 上取决于游戏本身；Windows 用户的收益最小——官方启动器在那边覆盖已经很全，它的独特价值在 Linux，其次是 macOS。\n项目以 GPL-3.0 开源，官网与 GitHub Releases 提供三平台安装包，Linux 另有 flatpak 渠道。",
    officialUrl: "https://heroicgameslauncher.com",
    officialLabel: "heroicgameslauncher.com",
    links: {
      official: "https://heroicgameslauncher.com",
      github: "https://github.com/Heroic-Games-Launcher/HeroicGamesLauncher",
    },
    price: "免费",
    installTips: [
      "从官网或 GitHub Releases 下载对应系统的安装包；Linux 也可以用 flatpak。",
      "登录 Epic、GOG 或 Amazon 任一账号，对应游戏库会自动同步进来。",
      "选游戏点安装；Linux 上在安装设置里挑 Wine 或 Proton 版本，拿不准就先用默认。",
      "跑不起来先查 ProtonDB 上这款游戏的页面，再试换兼容层版本。",
    ],
    whoFor: "游戏分散在 Epic、GOG、Amazon 三家，或者在 Linux、macOS 上想玩这些库的人。",
    whoNot: "只玩 Steam 的人——Steam 官方客户端在哪个平台都覆盖得更好。",
    alternatives: ["sunshine", "moonlight-qt"],
    featured: false,
    icon: { letter: "H", color: "#7C3AED", simpleIcon: "heroicgameslauncher" },
  },
  {
    slug: "ecc",
    linksCheckedAt: "2026-10-14",
    name: "ECC",
    nameZh: "ECC 编码代理工程系统",
    aliases: ["ecc", "ecc-universal", "ecc-tools", "编码代理技能包", "agent harness"],
    summary: "给 Claude Code、Codex 这类编码代理装上 plan→test→review→verify 的工程流程，含 71 个 agent、311 个 skill。适合想让代理按流程干活的人；代价是它会往你的配置里写 hooks 和规则，别叠加安装。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["编码代理", "Claude Code", "技能包", "开源"],
    body: "ECC 不是一个新工具，而是一整套装在编码代理身上的工程流程：先规划、写测试、实现、换个上下文自审、验证、记住结论、再改进。README 把它写成一句话：plan -> test -> implement -> review -> verify -> remember -> improve。配套的 71 个 agent 覆盖规划、评审、构建修复、安全、架构，311 个 skill 覆盖 TDD、调研、安全、文档、前端、数据、ML、运维。\n它的价值在于把这些从「每次写一遍 prompt」变成「装一次」。真正要注意的是安装方式：同一个 harness 里只能选一种装法，官方明确点名要避开「Claude 插件 + 完整手动安装」的组合——skills、commands、hooks 会重复，表现是同一个命令出现两次、hook 触发两次。\n另外它对 Claude Code 支持最好，Codex 与 Kimi Code 有原生引导路径，Cursor、OpenCode、Gemini 等只是能力受限的适配层，README 自己让你先看支持矩阵再假设功能对等。付费的 ECC Pro 只是面向私有仓库的托管 GitHub App，仓库本身永久 MIT，两者不要混为一谈。",
    officialUrl: "https://ecc.tools",
    officialLabel: "ecc.tools",
    links: {
      official: "https://ecc.tools",
      github: "https://github.com/affaan-m/ECC",
    },
    whoFor: "已经天天用 Claude Code / Codex，厌倦了每次手写同一套「先规划再改、改完写测试再自查」prompt 的人。",
    whoNot: "只偶尔让代理改几行代码的人——整套 hooks 与规则带来的约束感远大于收益；或者指望在 Cursor、Zed 上和 Claude Code 功能完全对等的人。",
    installTips: [
      "引导式安装：`npx ecc-universal@2.2.3 setup`，需要 Node.js 18+；走 Claude 插件路径还要求 Git 和 Claude Code 2.1+ 都在 PATH 里。",
      "同一个 harness 只选一种装法：官方插件命令 `/plugin marketplace add https://github.com/affaan-m/ECC` + `/plugin install ecc@ecc` 与引导式 setup 二选一，叠加会导致技能、命令、hook 重复。",
      "装完在 Claude Code 里跑 `/plugin list` 确认 `ecc@ecc` 已启用；升级、换 scope、换 hook 档位都是重跑同一条 setup 命令。",
      "只从 GitHub 仓库、`ecc-universal` / `ecc-agentshield` 两个 npm 包、GitHub App 和 ecc.tools 安装，第三方转载与镜像不受维护，可能带恶意代码。",
    ],
    alternatives: [],
    icon: {
      letter: "E",
      color: "#4B3F72",
    },
    guide: {
      intro: "按第一次安装会卡在哪讲：先确认 Node / Git / Claude Code 三个前置、只选一条安装路径、scope 与 hook 档位怎么选、以及已经装重复了该怎么救。",
      markdown: `## 装之前先确认三件事

ECC 的引导式安装会在动手前检查环境，缺一样就停：

- **Node.js 18 或更高**（universal 包的硬要求）
- **Git**
- **Claude Code 2.1 或更高**，且 \`claude\` 在 PATH 里

Windows 上先开 PowerShell，把 \`node --version\`、\`git --version\`、\`claude --version\` 各跑一遍，确认都有输出再往下走。任何一条找不到命令，就先修那个前置，不要硬跑 setup。

## 只选一条安装路径

同一个 harness 里**不要叠加两种装法**。官方点名要避开的组合是「Claude 插件 + 完整手动安装」——skills、commands、hooks 会被装两遍，症状是同一个命令出现两次、hook 触发两次。

推荐路径：

\`\`\`bash
npx ecc-universal@2.2.3 setup
\`\`\`

它会先把官方 marketplace 和每个原生安装 scope 盘一遍，再让你选装到 \`user\` / \`project\` / \`local\` 哪个 scope，以及 hook 档位。个人自用选 **Global user** + **Standard** 即可。装完在 Claude Code 里跑 \`/plugin list\`，确认 \`ecc@ecc\` 是 enabled。

想一次配好多个代理，用多 harness 向导：

\`\`\`bash
npx ecc-universal@2.2.3 install --guided --harness claude --harness codex --harness kimi
\`\`\`

不确定它会改什么，先加 \`--dry-run\` 看一遍再确认。

## 版本别乱跟 latest

README 里所有示例都钉在具体版本（\`2.2.3\`）。这不是保守：\`ecc-install\` 是包内的一个二进制名，**不是**单独发布的 npm 包，敲成 \`npx ecc-install --profile minimal\` 会装到别的东西上。要核对发布版本就跑 \`npm view ecc-universal version\`。

包管理器换命令：pnpm 用 \`pnpm dlx\`、Yarn 2+ 用 \`yarn dlx\`、Bun 用 \`bunx\`。**Yarn Classic 1 没有 dlx**，只能用 npx 或先升级 Yarn。

## 已经装重复了怎么救

如果之前叠了两层，别手动删配置文件，直接走 README 的 Reset / Uninstall 一节整体重置，再按上面单一路径重装一次。装完重启会话才生效。
`,
      resources: [
        {
          kind: "html",
          title: "官网与安装入口",
          url: "https://ecc.tools",
          note: "引导式安装与各 harness 的支持状态入口。决定要不要投入之前先看它的 platform support 矩阵，别假设功能对等。",
        },
        {
          kind: "html",
          title: "GitHub 仓库 README",
          url: "https://github.com/affaan-m/ECC",
          note: "含安装矩阵、Reset / Uninstall 步骤与官方来源清单。装重复了要照这一页恢复。",
        },
        {
          kind: "html",
          title: "ecc-universal 包版本页",
          url: "https://www.npmjs.com/package/ecc-universal",
          note: "核对当前发布版本号。README 的示例都钉版本，跟 latest 容易踩到未验证的改动。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "hermes-agent",
    linksCheckedAt: "2026-10-14",
    name: "hermes-agent",
    nameZh: "Hermes Agent 自学习代理",
    aliases: ["hermes", "hermes agent", "hermes-agent", "自学习 Agent", "终端 AI 代理"],
    summary: "带学习闭环的终端 AI 代理：自己沉淀技能、跨会话检索记忆，还能常驻云主机从 Telegram 指挥。适合把代理当长工用的人；代价是一键脚本会顺带拉起 Python、Node、FFmpeg 一整套依赖。",
    scenes: ["code", "tools"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["AI 代理", "终端工具", "记忆", "开源"],
    body: "Hermes Agent 是 Nous Research 做的终端代理，主打「会自己变强」：任务结束后自动沉淀技能，使用过程中改进技能，周期性提示自己持久化知识，还能用 FTS5 检索过去的会话。它不是绑在你笔记本上的聊天框——支持 local、Docker、SSH、Singularity、Modal、Daytona、Vercel Sandbox 七种终端后端，可以跑在一台 5 美元的 VPS 上，你从 Telegram 跟它说话。\n两个入口要分清：`hermes` 开终端 TUI，`hermes gateway` 起消息网关（Telegram、Discord、Slack、WhatsApp、Signal、邮件），同一个网关进程全包。模型用 `hermes model` 切换，支持 Nous Portal、OpenRouter、OpenAI 和自建 endpoint，换模型不换代码。\n代价是安装比较重：脚本会委托 PM 装 Python 3.14、Node.js、npm、ripgrep、FFmpeg 和一堆 Python 依赖，缺 Git 时还会往工具目录里放一份 Windows 版 Git。Windows 上杀软常把自带的 uv.exe 判成木马（Astral 的 Rust 包管理器，误报），要放行整个 bin 目录而不是单个文件——uv 每次升级哈希都变。",
    officialUrl: "https://hermes-agent.nousresearch.com",
    officialLabel: "hermes-agent.nousresearch.com",
    links: {
      official: "https://hermes-agent.nousresearch.com",
      github: "https://github.com/NousResearch/hermes-agent",
    },
    whoFor: "想让代理长期驻留、跨会话积累经验并远程指挥的人：定时任务、定时报告、夜间备份这类无人值守场景。",
    whoNot: "只想本地问两句就走的人，装这一整套依赖不划算；也不适合不能接受代理在后台常驻并自动执行 cron 任务的机器。",
    installTips: [
      "Linux / macOS / WSL2：`curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash`；原生 Windows 用 PowerShell 跑 `iex (irm https://hermes-agent.nousresearch.com/install.ps1)`，不必再套 WSL。",
      "装完先 `source ~/.bashrc`（或 `source ~/.zshrc`）再敲 `hermes`；原生 Windows 装在 `%LOCALAPPDATA%\\hermes`，WSL2 装在 `~/.hermes`。",
      "Windows 杀软可能隔离 `uv.exe`——那是 Hermes 自带的 Astral uv，是误报。要给 `%LOCALAPPDATA%\\hermes\\bin` 整个目录加白名单，别按文件哈希加，因为升级后哈希会变。",
      "Android / Termux 不要用桌面安装脚本，走仓库提供的签名 APT 源（aarch64，stable 与 canary 两个通道）。",
    ],
    alternatives: [],
    icon: {
      letter: "H",
      color: "#5B4E7A",
    },
    guide: {
      intro: "按第一次上手会卡在哪讲：装完为什么命令找不到、终端与消息网关两个入口怎么选、模型怎么换、以及 Windows 上 uv.exe 被误杀怎么处理。",
      markdown: `## 装完第一件事：刷新 shell

一键脚本装完，\`hermes\` 常常还是「command not found」。原因不是没装上，而是 PATH 没进当前 shell：

\`\`\`bash
source ~/.bashrc    # zsh 用户用 source ~/.zshrc
hermes              # 开始对话
\`\`\`

两条路径的目录不一样，排查时别找错地方：

| 环境 | 安装位置 |
| --- | --- |
| Linux / macOS / WSL2 | \`~/.hermes\` |
| 原生 Windows | \`%LOCALAPPDATA%\\hermes\` |
| Termux | 走 APT 包，不用桌面脚本 |

## 两个入口，别搞混

Hermes 有两条起手式，**共用同一批斜杠命令**：

- \`hermes\` —— 终端 TUI：多行编辑、斜杠命令补全、可打断并改向、流式工具输出。
- \`hermes gateway\` —— 消息网关：起一个进程，Telegram / Discord / Slack / WhatsApp / Signal / 邮件全接。

网关要两步：\`hermes gateway setup\` 配好平台，再 \`hermes gateway start\`，然后给机器人发消息。进去之后 \`/new\`、\`/reset\`、\`/model\`、\`/retry\`、\`/undo\`、\`/compress\`、\`/usage\` 这些命令两边通用，只有中断方式不同：终端是 Ctrl+C，消息端是 \`/stop\`。

## 换模型不用改代码

\`\`\`bash
hermes model        # 选 provider 和模型
hermes tools        # 选启用哪些工具
hermes config set   # 改单个配置项
hermes doctor       # 出问题先跑它
\`\`\`

支持 Nous Portal、OpenRouter、OpenAI 和自建 endpoint。不想一家家收 API Key（模型、搜索、生图、TTS、云浏览器），可以 \`hermes setup --portal\` 用 OAuth 登录 Nous Portal 一次搞定，随时 \`hermes portal info\` 看接了什么；网关是按后端开关的，不是全有或全无，仍可以自带 Key。

## 无人值守任务

内置 cron 调度器，结果可以投递到任意平台：日报、夜间备份、每周巡检，用自然语言写，跑完不用人盯。

## Windows：uv.exe 被杀软隔离

这是最常见的假故障。Hermes 自带 Astral 的 \`uv\` 管理 Python 环境，ML 引擎常把「未签名 + 会下载安装」的 Rust 二进制判为威胁。

验证真伪：用 \`gh attestation verify\` 核对 GitHub 上的发布证明，再比对文件哈希。确认后给**整个目录**加白名单：

\`\`\`powershell
Add-MpPreference -ExclusionPath "$env:LOCALAPPDATA\\hermes\\bin"
\`\`\`

按文件哈希加会在下次升级时失效。
`,
      resources: [
        {
          kind: "html",
          title: "官方文档",
          url: "https://hermes-agent.nousresearch.com/docs/",
          note: "快速上手、CLI、配置、消息网关、安全、工具、技能、记忆、MCP、cron 各章都在这一页下。第一次装完照 Quickstart 走一遍。",
        },
        {
          kind: "html",
          title: "安装方法（含 Windows / Termux）",
          url: "https://hermes-agent.nousresearch.com/docs/getting-started/installation",
          note: "列出一键脚本之外的 MSIX 包与 Termux 签名 APT 源，以及各自的更新归属。选安装方式前先看这里。",
        },
        {
          kind: "html",
          title: "安全：命令审批 / 容器隔离",
          url: "https://hermes-agent.nousresearch.com/docs/user-guide/security",
          note: "讲 DM 配对、命令审批与容器隔离。打算让代理常驻并跑 cron 之前必读。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "rea",
    linksCheckedAt: "2026-10-14",
    name: "REA",
    nameZh: "REA 逆向工程 MCP",
    aliases: ["rea", "rea-agents", "reverse engineer anything", "逆向工程", "二进制分析"],
    summary: "一个 MCP 服务，让编码代理去逆向原生二进制、Electron 应用、.NET 程序集和网站，每条结论都附证据。适合想复刻某个功能的人；代价是深度分析要自备 Hopper / Ghidra / IDA。",
    scenes: ["code", "engineering"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["逆向工程", "MCP", "二进制分析", "开源"],
    body: "REA（Reverse Engineer Anything）把逆向工程的工具链接进编码代理。用法不是「你学逆向」，而是给代理一句「弄明白 Notes 里的搜索是怎么做的，给我证据，再给我的项目做一个」。代理通过 MCP 调 REA 去查目标，REA 返回结论加证据，代理据此追问、解释或写实现。\n它的覆盖很宽：原生二进制、Go 二进制、WASM、EVM 字节码、SQLite、Linux 崩溃记录、JavaScript / Electron、网站、HAR/SAZ 抓包、.NET 程序集、Android APK 与设备、Flutter、固件、pcap、逻辑信号、进程行为。每条边都带 EXTRACTED（源码里明写）或 INFERRED（REA 推出来）标签，你能分清哪些是读出来的、哪些是猜的——这一点比「代理自信地编一段」强得多。\n平台是最大的坑：**很多能力只在 Linux 上**。固件分析要 Binwalk/Unblob、抓包要 TShark、信号要 sigrok-cli、EVM 与崩溃分析要 pwntools，都写着 Linux 验证；进程捕获是 Linux/macOS；只有 Android APK、.NET、Flutter、静态 JS 这些能在 Windows 上跑。所以 Windows 用户买到的能力是不完整的，别按 README 那张表全量预期。\n另外 REA 要求 Node.js 22.19+ / 24.11+ / 26+，版本不够直接失败；分析大二进制时可能要调大 `REA_GHIDRA_STARTUP_TIMEOUT_MS` 或 `REA_HOPPER_STARTUP_TIMEOUT_MS`。",
    officialUrl: "https://rea.tools",
    officialLabel: "rea.tools",
    links: {
      official: "https://rea.tools",
      github: "https://github.com/morluto/rea",
    },
    whoFor: "想知道某个闭源功能到底怎么实现、并要在自己项目里复刻的人；以及做二进制 / 移动端 / 固件分析的安全研究人员。",
    whoNot: "Windows 为主且指望全功能的人（大量分析只在 Linux 验证过）；也不适合不愿意自备 Hopper / Ghidra / IDA 就想看原生伪代码的人。",
    installTips: [
      "需要 Node.js 22.x（>=22.19）、24.x（>=24.11）或 26+ 与 npm，装前先 `node --version` 确认，版本不够会直接失败。",
      "`npx rea-agents setup` 会注册 MCP 并写入配套的工作流说明，同时备份既有配置；跑完必须重启你的 agent 才生效。",
      "想在终端长期用就 `npm install --global rea-agents`，之后 `rea --help`；升级用 `rea update`，并重新跑 setup 刷新 agent 注册。",
      "逆原生二进制要另配 Hopper / Ghidra / IDA 之一（setup 可在你同意后装 Hopper）；只做 JavaScript / Electron / .NET 静态分析不需要任何原生引擎。",
    ],
    alternatives: [],
    icon: {
      letter: "R",
      color: "#1F3A5F",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：Node 版本这条硬门槛、agent 与终端两种用法、原生分析为什么必须配 Hopper/Ghidra/IDA、以及「Windows 上哪些能力其实没有」这件事。",
      markdown: `## 先过版本这一关

REA 的要求写得非常死：**Node.js 22.x（>=22.19）、24.x（>=24.11）或 26+，外加 npm**。低于这些版本不是警告，是装不上。

\`\`\`bash
node --version
\`\`\`

## 两种用法

**给代理用**（主力场景）：

\`\`\`bash
npx rea-agents setup
\`\`\`

向导让你选要接入哪些 agent（Claude Code、Codex、Cursor、Gemini CLI、Grok Build 等），列出将要改动什么，你确认后才写，并且会备份已有配置。**改完必须重启 agent**。之后直接说人话：

\`\`\`text
弄明白 Notes 应用里的搜索是怎么做的，给我证据，再给我的项目做一个类似的。
\`\`\`

**在终端用**：

\`\`\`bash
npx -y rea-agents@latest analyze-javascript-application /absolute/path/to/app --json
\`\`\`

这个命令吃的是**已解包**的 JavaScript / Electron 目录或 ASAR，返回模块、导入、Electron 边界和各自证据。路径要写绝对路径。

想长期用就装成全局命令：

\`\`\`bash
npm install --global rea-agents
rea --help
\`\`\`

## 原生分析要自备引擎

这是最容易踩空的一层。REA 自己不实现反汇编，它调度你机器上已有的：

| 目标 | 需要的引擎 |
| --- | --- |
| 原生二进制 | Hopper / Ghidra / IDA 三者之一 |
| WASM | 自备 WABT 1.0.42 |
| Android APK | headless JADX + 完整 JDK |

**静态的 JavaScript 和 .NET 分析不需要任何原生引擎**，读文件即可，不运行目标程序。所以如果你只想看 Electron 应用或 .NET 程序集，这一层完全不用管。

大二进制经常卡在引擎启动上，加长超时：

\`\`\`bash
REA_GHIDRA_STARTUP_TIMEOUT_MS=600000 rea ...
\`\`\`

## Windows 用户请注意

那张「能分析什么」的表里，大量行是 Linux 限定：

- 固件（Binwalk / Unblob）、抓包（TShark 4.x）、逻辑信号（sigrok-cli）、EVM 字节码、崩溃记录（pwntools）——**Linux**
- 进程行为捕获（原生 PTY）——**Linux / macOS**
- Android APK、.NET、Flutter、静态 JS——Windows 也能跑

买之前先按自己的系统筛一遍，别按整张表预期。

## 每条结论都带来源

REA 返回的每条边都标 \`EXTRACTED\`（源码里明写）或 \`INFERRED\`（REA 推出来的）。看到 INFERRED 多的时候，结论要自己再验证一遍，不要直接当事实写进代码。
`,
      resources: [
        {
          kind: "html",
          title: "官网：指南与案例",
          url: "https://rea.tools/guides/",
          note: "按目标分的图文指南（原生、JavaScript、浏览器等）。第一次用先挑和你目标最接近的一篇照着做。",
        },
        {
          kind: "html",
          title: "安装与 setup 说明",
          url: "https://github.com/morluto/rea/blob/main/docs/installation.md",
          note: "支持的 agent 列表、provider 配置、Hopper/Ghidra 安装与手动注册 MCP 的步骤。装不上时看这一页。",
        },
        {
          kind: "html",
          title: "真实案例：Notion / DX-Ball / TH04",
          url: "https://rea.tools/showcase/",
          note: "三个完整逆向案例，能看到 REA 实际输出长什么样。判断它值不值得装，看案例比看功能表有用。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "autogpt",
    linksCheckedAt: "2026-10-14",
    name: "AutoGPT",
    nameZh: "AutoGPT 自动化代理平台",
    aliases: ["autogpt", "auto gpt", "agpt", "自动化代理", "AI 工作流"],
    summary: "可视化的 AI 代理搭建与运行平台：拖块编排、定时与触发执行，也能自托管。适合让非技术同事自己搭流程的团队；注意平台部分是 Polyform Shield 协议，不能拿来卖成竞品托管服务。",
    scenes: ["office", "tools"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["AI 代理", "工作流", "自动化", "开源"],
    body: "今天的 AutoGPT 已经不是 2023 年那个跑在终端里的自主循环脚本，而是一个完整的平台：AutoPilot 把对话变成可运行的 agent，Build 是可视化块编辑器，Agents 看每次运行的成本与状态，Marketplace 提供现成 agent。agent 可以按需跑、按计划跑、或被触发跑，接了 45+ 个平台（Gmail、Slack、Notion、HubSpot、Jira、Salesforce 等）和数百个模型。\n两条路要分清：托管平台是付费的、按 agent 运行计费；自托管免许可费，但你自己出机器、出模型 Key、自己运维。README 把差异列成了表格，核心是「你要的是马上能用，还是数据与基础设施在自己手里」。\n两个坑：一是**许可不是统一的**——`autogpt_platform/` 是 Polyform Shield（个人与内部商用免费，但不能包装成竞品托管服务出售），`classic/` 及其余部分是 MIT。想拿它做二次分发或商业化，先看清这一条。二是**自托管目前没有一键安装包**：面向 Linux/macOS 的单容器安装器还没过发布门禁，现在只能照着 docs.agpt.co 手动部署，Windows 用户同样走手动指南。Docker 要求是 amd64 或 arm64 的 Linux 容器，安装器不负责替你装 Docker。",
    officialUrl: "https://agpt.co",
    officialLabel: "agpt.co",
    links: {
      official: "https://agpt.co",
      github: "https://github.com/Significant-Gravitas/AutoGPT",
    },
    whoFor: "想让运营、销售、市场这类非技术同事自己搭「研究客户 / 出日报 / 起草回复」流程，并且要能定时或触发执行的团队。",
    whoNot: "想把它再包装成托管服务卖的人（Polyform Shield 不允许）；或者没有 Docker 运维能力、又指望一键安装包的人——那个安装器还没发布。",
    installTips: [
      "托管版直接注册 platform.agpt.co；自托管目前只能照 docs.agpt.co 的手动指南部署，单容器安装器尚未过发布门禁。",
      "自托管要求机器上已有运行中的 Docker 守护进程，且是 amd64 或 arm64 的 Linux 容器；安装器不负责装 Docker，也不从源码构建。",
      "Windows 用户不要用单容器安装器那条路，继续走手动自托管指南。",
      "只想跑经典的单机 AutoGPT，看仓库里的 `classic/` 目录——它是 MIT 协议，和平台部分不是同一份许可。",
    ],
    alternatives: [],
    icon: {
      letter: "A",
      color: "#2F5D62",
    },
    guide: {
      intro: "按第一次决策会卡在哪讲：托管还是自托管怎么选、许可条款哪里会咬人、自托管现在到底到哪一步了、以及 classic 与 platform 是什么关系。",
      markdown: `## 先选托管还是自托管

这是第一个岔路，后面所有步骤都不同：

| | 托管平台 | 自托管 |
| --- | --- | --- |
| 门槛 | 公开注册 | 需要 Docker 与配置 |
| 费用 | 套餐 + 按运行计费 | 无许可费，自付机器与模型 |
| 模型 | 内置 | 自带 API Key |
| 运维 | 官方负责 | 你自己负责 |
| 数据 | 在 AutoGPT 这边 | 在你自己的基础设施上 |

**判断标准只有一个：基础设施控制权重要，还是马上能用重要。** 两条路用的是同一个仓库，核心构建器与 agent 运行时两边都有。

## 许可条款要提前看

这一条很多人跳过，然后踩雷：

| 组件 | 协议 | 含义 |
| --- | --- | --- |
| \`autogpt_platform/\` | Polyform Shield | 个人与内部商用免费，**不能作为竞品托管服务出售** |
| \`classic/\` 及其余 | MIT | 宽松开源 |

也就是说：公司内部搭流程自己用没问题；把它包装成一个对外售卖的同类平台，协议不允许。

## 自托管目前的实际状态

README 写得很直白：面向 Linux 与 macOS 的单容器发布安装器**要等下一个 appliance 版本**，在它过掉 documented release gates 之前，用手动自托管指南。

那个安装器将来也只做一件事：连你本机已有的 Docker 守护进程，拉已发布的 appliance 镜像并按不可变 digest 运行。它**不会**替你装 Docker，也**不会**从源码构建。

所以现在的自托管准备清单是：

1. 一台 amd64 或 arm64 的机器
2. Docker 守护进程已在运行，且是 Linux 容器模式
3. 至少一家模型 provider 的 API Key
4. Windows 用户：走手动指南，别等安装器

## classic 是什么

2023 年那个原始的独立 agent 还在仓库的 \`classic/\` 目录里，MIT 协议。它包括 Forge（用来构建 agent）和 agbenchmark（用来给 agent 跑基准）。

如果你只是想跑一个单机自主 agent 玩玩或做研究，从 \`classic/\` 进去比部署整套平台轻得多。

## 能自动化什么

官方给的例子：每日简报、会议前研究客户、把 launch brief 变成各渠道草稿、事件分诊、起草客服回复、监控信息源并在有变化时返回结构化报告。这些共同点是「多步、要调外部系统、产出是草稿」。如果你的任务是「一步出结果」，用不上这个平台。
`,
      resources: [
        {
          kind: "html",
          title: "自托管上手指南",
          url: "https://docs.agpt.co/platform/getting-started",
          note: "当前唯一可用的自托管路径，含 Docker 与配置步骤。决定自托管后从这里开始。",
        },
        {
          kind: "html",
          title: "定价与方案对比",
          url: "https://agpt.co/pricing",
          note: "托管平台按运行计费的具体档位。估算成本、对比自托管是否划算时看这里。",
        },
        {
          kind: "html",
          title: "Classic 子项目",
          url: "https://github.com/Significant-Gravitas/AutoGPT/blob/master/classic/README.md",
          note: "MIT 协议的原始单机 agent，含 Forge 与 agbenchmark。只想跑单机 agent 的话从这里进。",
        },
      ],
    },
  },
  {
    slug: "ollama",
    linksCheckedAt: "2026-10-14",
    name: "Ollama",
    nameZh: "Ollama 本地模型运行器",
    aliases: ["ollama", "本地大模型", "本地推理", "ollama run"],
    summary: "一条命令在本机跑开源大模型，自带 REST 接口和 Python / JS SDK，还能直接接 Claude Code、Codex 等编码代理。适合想离线试模型的人；代价是模型文件动辄几 GB，速度完全看你本地硬件。",
    scenes: ["code", "tools"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["本地大模型", "推理", "LLM", "开源"],
    body: "Ollama 解决的是「跑一个开源模型」这件事的最后一公里：不用自己编译 llama.cpp、不用管权重格式，`ollama run gemma4` 就把模型拉下来跑起来，聊天直接进终端。它底层就是 llama.cpp。\n除了聊天，它现在已经往「本地模型中枢」的方向走：`ollama launch claude` 可以直接把本地模型接给 Claude Code 用，还支持 codex、copilot-cli、deepseek-harness、droid、opencode；`ollama launch openclaw` 则把它变成挂在 WhatsApp / Telegram / Slack 上的个人助手。也就是说它不只是个命令行玩具。\n对外接口是 REST，默认监听 11434，`POST /api/chat` 就能对话，Python 有 `pip install ollama`、JS 有 `npm i ollama`，Docker 有官方镜像 `ollama/ollama`。\n代价很直接：本地推理的天花板是你的显存和内存。几十亿参数的模型在笔记本上能跑，但和云端前沿模型不是一个量级；而且模型文件是几个 GB 起，磁盘和首次下载时间都要算进去。另外别指望它替你做服务化——并发、批处理、量化优化这些是 vLLM 那类引擎的活。",
    officialUrl: "https://ollama.com",
    officialLabel: "ollama.com",
    links: {
      official: "https://ollama.com",
      github: "https://github.com/ollama/ollama",
    },
    whoFor: "想在本机离线试开源模型、做隐私敏感的小任务，或给本地编码代理配一个不花钱的模型后端的人。",
    whoNot: "要的是最高质量回答或高并发服务的人——本地小模型质量有上限，服务化能力也不如专用推理引擎；也不适合磁盘紧张又想试多个模型的机器。",
    installTips: [
      "macOS 与 Linux：`curl -fsSL https://ollama.com/install.sh | sh`；Windows 用 PowerShell 跑 `irm https://ollama.com/install.ps1 | iex`，也可以直接下 Ollama.dmg / OllamaSetup.exe。",
      "装完直接 `ollama run gemma4` 就能对话，模型会在首次运行时下载；可用模型清单在 ollama.com/library。",
      "要接编码代理用 `ollama launch claude`，支持 claude、codex、copilot-cli、deepseek-harness、droid、opencode 多个集成。",
      "服务默认监听 11434，REST 走 `http://localhost:11434/api/chat`；Python 用 `pip install ollama`，Node 用 `npm i ollama`，容器场景用官方镜像 `ollama/ollama`。",
    ],
    alternatives: [],
    icon: {
      letter: "O",
      color: "#1B1B1B",
      simpleIcon: "ollama",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：装完怎么确认起来了、模型怎么拉、端口和 SDK 怎么接、以及什么时候该换成专业推理引擎。",
      markdown: `## 装完先跑一个模型

三条系统的安装都是一行的：

\`\`\`bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows（PowerShell）
irm https://ollama.com/install.ps1 | iex
\`\`\`

也可以直接下安装包：macOS 是 Ollama.dmg，Windows 是 OllamaSetup.exe。

装完直接：

\`\`\`bash
ollama run gemma4
\`\`\`

第一次会先下载权重，**这一步慢是正常的**，几十亿参数的模型是 GB 级文件。想看有哪些模型可以去 ollama.com/library。

## 它在 11434 上起了一个服务

很多人以为 Ollama 只是个 CLI，其实它后台常驻一个服务，默认端口 11434：

\`\`\`bash
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4",
  "messages": [{ "role": "user", "content": "Why is the sky blue?" }],
  "stream": false
}'
\`\`\`

Python 和 JS 都有官方库，不用说 HTTP：

\`\`\`python
from ollama import chat
response = chat(model='gemma4', messages=[
    {'role': 'user', 'content': 'Why is the sky blue?'},
])
print(response.message.content)
\`\`\`

\`\`\`javascript
import ollama from "ollama";
const response = await ollama.chat({
  model: "gemma4",
  messages: [{ role: "user", content: "Why is the sky blue?" }],
});
\`\`\`

容器里用官方镜像 \`ollama/ollama\`，注意把 11434 暴露出来，否则别的容器连不上。

## 接给编码代理

不想把代码发给云端时，把它接给本地 agent：

\`\`\`bash
ollama launch claude      # Claude Code
ollama launch openclaw    # 挂到 WhatsApp / Telegram / Slack 的个人助手
\`\`\`

支持的集成还包括 codex、copilot-cli、deepseek-harness、droid、opencode。

## 什么时候不该用它

Ollama 的定位是**让本地模型跑起来**，不是**把本地模型服务好**。它不做连续批处理、不做 PagedAttention 那类显存管理、也不做多卡并行。

如果你的场景是「多个用户同时请求」「要榨干一张卡的吞吐」「要做生产级 SLA」，那是推理引擎（vLLM 一类）的活，Ollama 会在并发上撞墙。

另一个现实约束：本地跑得动的是几十亿参数级别的小模型，回答质量与云端前沿模型有差距。拿它替代 Claude 或 GPT 做复杂推理任务，多半会失望。
`,
      resources: [
        {
          kind: "html",
          title: "模型库",
          url: "https://ollama.com/library",
          note: "所有可直接 ollama run 的模型清单与各自尺寸。挑模型、估算磁盘占用前先看这里。",
        },
        {
          kind: "html",
          title: "REST API 文档",
          url: "https://docs.ollama.com/api",
          note: "chat / generate / embeddings 等全部端点与参数。要写自己的客户端时对着这一页调。",
        },
        {
          kind: "html",
          title: "Modelfile 参考",
          url: "https://docs.ollama.com/modelfile",
          note: "自定义系统提示、参数与模型组合的写法。想把某个模型固化成自己的默认配置时用。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "transformers",
    linksCheckedAt: "2026-10-14",
    name: "Transformers",
    nameZh: "Hugging Face Transformers",
    aliases: ["transformers", "huggingface transformers", "hf transformers", "预训练模型库"],
    summary: "Python 里跑预训练模型的通用层：一个 pipeline 覆盖文本、视觉、音频与多模态，Hub 上百万级 checkpoint 直接加载。适合要推理或微调的人；不适合想拿它拼神经网络积木的人——它刻意不做模块化抽象。",
    scenes: ["code", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["机器学习", "预训练模型", "PyTorch", "开源"],
    body: "Transformers 是「模型定义层」：同一个模型定义被 Axolotl、Unsloth、DeepSpeed、FSDP、PyTorch-Lightning 这些训练框架，vLLM、SGLang、TGI 这些推理引擎，以及 llama.cpp、mlx 这些相邻库共用。你现在用的几乎所有开源模型，定义都在这一层。\n上手只要三个类，核心是 pipeline：`pipeline(task=\"text-generation\", model=\"Qwen/Qwen2.5-1.5B\")` 一句话就能生成，换成 `automatic-speech-recognition` + Whisper 就是语音识别，换成 `image-classification` + DINOv2 就是图像分类，接口一致。Hub 上有百万级 checkpoint 可直接拉。\nREADME 里最有价值的是「什么时候不该用 Transformers」那一节，值得照抄：它不是神经网络的积木盒——模型文件故意不做额外抽象，为的是研究者能快速迭代单个模型；训练 API 也是围绕它自己的 PyTorch 模型优化的，通用的机器学习循环该用 Accelerate。\n环境要求 Python 3.10+ 与 PyTorch 2.6+。装要用带 torch 的变体 `pip install \"transformers[torch]\"`，从源码装能拿最新改动但可能不稳定。另外它只负责模型本身，服务化、高并发这些不在它的职责里。",
    officialUrl: "https://huggingface.co/transformers",
    officialLabel: "huggingface.co",
    links: {
      official: "https://huggingface.co/transformers",
      github: "https://github.com/huggingface/transformers",
    },
    whoFor: "要在 Python 里做推理或微调的研究者、算法工程师，以及需要换模型、换框架而不想重写代码的人。",
    whoNot: "想要一套可自由拼装的神经网络积木、或要写通用训练循环的人——官方自己说该用 Accelerate；也别指望它做高并发服务，那是推理引擎的活。",
    installTips: [
      "需要 Python 3.10+ 与 PyTorch 2.6+，先用 venv 或 uv 建虚拟环境再装，不要直接装进系统 Python。",
      "装带 PyTorch 的变体：`pip install \"transformers[torch]\"`（uv 用 `uv pip install \"transformers[torch]\"`）；要最新改动就从源码 `pip install '.[torch]'`，但可能不稳定。",
      "首次 `pipeline(task=\"text-generation\", model=\"Qwen/Qwen2.5-1.5B\")` 会下载并缓存权重，磁盘要留够空间。",
      "想在命令行直接和模型聊天，先起 `transformers serve`，再用 `transformers chat Qwen/Qwen2.5-0.5B-Instruct`。",
    ],
    alternatives: [],
    icon: {
      letter: "T",
      color: "#FFD21E",
      simpleIcon: "huggingface",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：环境与虚拟环境怎么搭、pipeline 这一个 API 怎么覆盖多模态、聊天和命令行怎么走、以及官方明说「别用它做什么」。",
      markdown: `## 环境与安装

要求 **Python 3.10+** 与 **PyTorch 2.6+**。先建虚拟环境，别污染系统 Python：

\`\`\`bash
python -m venv .my-env
source .my-env/bin/activate
pip install "transformers[torch]"
\`\`\`

用 uv 的话是 \`uv venv .my-env\` 加 \`uv pip install "transformers[torch]"\`。

想要 main 分支的最新改动（比如刚支持的新架构）就从源码装：

\`\`\`bash
git clone https://github.com/huggingface/transformers.git
cd transformers
pip install '.[torch]'
\`\`\`

代价是**不稳定**，出问题直接去仓库开 issue。

## pipeline 这一个 API 就够开始

pipeline 处理预处理并返回对应输出，换 task 和 model 就换模态，代码形状不变：

\`\`\`python
from transformers import pipeline

pipe = pipeline(task="text-generation", model="Qwen/Qwen2.5-1.5B")
pipe("the secret to baking a really good cake is ")
\`\`\`

语音识别：

\`\`\`python
pipe = pipeline(task="automatic-speech-recognition", model="openai/whisper-large-v3")
pipe("https://huggingface.co/datasets/Narsil/asr_dummy/resolve/main/mlk.flac")
\`\`\`

图像分类：

\`\`\`python
pipe = pipeline(task="image-classification", model="facebook/dinov2-small-imagenet1k-1-layer")
pipe("https://huggingface.co/datasets/Narsil/image_dummy/raw/main/parrots.png")
\`\`\`

**第一次跑会下载权重并缓存**，之后复用。磁盘不够会在这里卡住。

## 聊天：构造 chat 历史

和生成接口完全一样，只是输入变成对话列表：

\`\`\`python
import torch
from transformers import pipeline

chat = [
    {"role": "system", "content": "You are a sassy, wise-cracking robot."},
    {"role": "user", "content": "Hey, can you tell me any fun things to do in New York?"},
]
pipe = pipeline(task="text-generation", model="meta-llama/Meta-Llama-3-8B-Instruct",
                dtype=torch.bfloat16, device_map="auto")
response = pipe(chat, max_new_tokens=512)
\`\`\`

不想写代码，命令行也行——前提是 \`transformers serve\` 已经在跑：

\`\`\`bash
transformers chat Qwen/Qwen2.5-0.5B-Instruct
\`\`\`

## 官方说：这些情况别用它

这一节比功能列表更重要，原文两条：

1. **它不是神经网络的模块化积木盒。** 模型文件故意不做额外抽象，为的是研究者能直接改单个模型，不用在抽象层里绕。
2. **训练 API 是围绕它自己的 PyTorch 模型优化的。** 你要写通用机器学习循环，用 Accelerate。

补一条实践结论：Transformers 负责「定义和跑模型」，不负责「服务」。要并发、要吞吐、要生产级接口，把模型交给 vLLM 这类推理引擎，它们直接吃 Transformers 的模型定义。
`,
      resources: [
        {
          kind: "html",
          title: "官方文档",
          url: "https://huggingface.co/docs/transformers/index",
          note: "安装、pipeline 教程、各模态与任务的完整指南。第一次用照 Quickstart 走。",
        },
        {
          kind: "html",
          title: "Hugging Face Hub 模型页",
          url: "https://huggingface.co/models?library=transformers",
          note: "可直接在 Hub 页面上试大多数模型。挑模型时先在这里试，比本地下载快。",
        },
        {
          kind: "html",
          title: "Accelerate 文档",
          url: "https://huggingface.co/docs/accelerate",
          note: "官方在「什么时候不该用 Transformers」里点名的替代：通用训练循环用这个。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "ponytail",
    linksCheckedAt: "2026-10-14",
    name: "Ponytail",
    nameZh: "Ponytail 极简编码技能",
    aliases: ["ponytail", "ponytail skill", "极简代码", "少写代码", "YAGNI"],
    summary: "一个 prompt，让编码代理先读完代码再动手、能复用就不新写：官方基准里代码量 -53%、时间 -41%、token -45%。适合被过度实现烦到的人；代价是它会坚持砍掉你认为必要的抽象。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["编码代理", "代码评审", "重构", "开源"],
    body: "Ponytail 的全部内容就是一个 prompt（skills/ponytail/SKILL.md，另有给规则文件用的精简版 AGENTS.md），仓库其余部分只是把这个 prompt 塞进不同 agent 的适配层。它的立场很简单：最好的代码是没写出来的代码。\nREADME 举的例子很能说明问题：要一个日期选择器，不装的代理会引入一个日期选择器库或手搓整个日历（335 行）；装了之后代理先看仓库里已有的 `Input` 组件，再想到浏览器自带 date picker，拼起来 10 行。\n它不是无脑压 token。README 特意强调：规则从来不是「token 最少」，而是只写任务需要的，且**校验、错误处理、安全、可访问性永不砍头**。有分支、循环、解析器、金钱或安全逻辑的代码要留一个小测试；每条回复结尾要交代跳过了什么、没检查什么、有什么风险。\n命令有 `/ponytail lite|full|ultra|off` 调强度、`/ponytail-review` 审当前 diff、`/ponytail-audit` 审整个仓库、`/ponytail-debt` 收集 `shortcut:` 注释。代价有两点：一是它会写 `shortcut:` 注释标记刻意偷懒的地方（不想要就在 CLAUDE.md 里换词）；二是命令需要支持 skill 的宿主，纯规则文件适配的 Cursor / Windsurf / Cline 只能拿到常驻规则，没有命令。",
    officialUrl: "https://ponytail.dev",
    officialLabel: "ponytail.dev",
    links: {
      official: "https://ponytail.dev",
      github: "https://github.com/DietrichGebert/ponytail",
    },
    whoFor: "被代理的过度实现搞烦的人：引一堆不必要的库、为每个需求新写一套抽象、diff 里一半是可以不存在的代码。",
    whoNot: "需要大量样板代码的项目（严格的领域分层、必须的配置模板）——它的默认取向会和你的规范对着干；也不适合纯 Cursor / Cline 用户想要那几个命令的人，那边只加载规则。",
    installTips: [
      "Claude Code 里两条命令：`/plugin marketplace add DietrichGebert/ponytail`，再 `/plugin install ponytail@ponytail`。",
      "Codex 用 `codex plugin marketplace add DietrichGebert/ponytail` + `codex plugin add ponytail@ponytail`，然后到 `/hooks` 信任它的两个生命周期 hook，并新开一个会话才生效。",
      "不支持插件的 agent（Cursor、Copilot、Cline、Windsurf、Kiro 等）把仓库里的 `AGENTS.md` 拷进项目，或让 agent 安装 `skills/ponytail/SKILL.md`。",
      "只从 `DietrichGebert/ponytail` 或 npm 的 `@dietrichgebert/ponytail` 装；项目从不发布 .exe / .dll，见到带这些文件的副本就是假的。",
    ],
    alternatives: [],
    icon: {
      letter: "P",
      color: "#3D3B30",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：它到底改了什么、四个命令分别什么时候用、为什么它写 shortcut 注释、以及纯规则文件模式下少了什么。",
      markdown: `## 它其实只有一个 prompt

理解这一点，后面所有行为都能推出来。核心文件是 \`skills/ponytail/SKILL.md\`，\`AGENTS.md\` 是给「只读规则文件」的 agent 用的精简版，仓库里其他东西只是把这份 prompt 装进不同 agent 的适配层。

所以它不是插件、不是工具、不联网。**它改的是代理的表达取向。**

## 四条行为准则

- **先读懂再动手。** 它是「懒于解法，但绝不懒于读代码」——先读你的改动牵涉到的代码、追一遍真实流程，再决定怎么做。
- **能复用就不新写。** 例：要日期选择器，先看仓库有没有 \`Input\`，再看浏览器原生 date picker，而不是引库或手搓日历。
- **有些东西永远不砍。** 信任边界校验、数据丢失处理、安全、可访问性，不在削减范围。
- **留痕。** 有分支 / 循环 / 解析器 / 金钱 / 安全逻辑的代码要留一个小测试；每次回复结尾交代跳过了什么、没检查什么、有什么风险。

最后那条最实用：**看结尾那段，就知道它这次偷了什么懒。**

## 四个命令

| 命令 | 什么时候用 |
| --- | --- |
| \`/ponytail lite\\|full\\|ultra\\|off\` | 调强度，或关掉。不带参数：关着就打开，开着就报当前档位 |
| \`/ponytail-review\` | 审当前 diff，像那个「出事会被叫醒」的高级工程师 |
| \`/ponytail-audit\` | 同样的检查跑整个仓库，按重要性排序 |
| \`/ponytail-debt\` | 把你欠下的 \`shortcut:\` 注释收进一本账 |

\`review\` 和 \`audit\` 每一条发现都写清：代码在做什么、哪里会出问题、怎么修、不修会怎样。\`review\` 后面可以跟 \`uncommitted\`、\`staged\`、\`branch\` 或 PR 链接来收窄或放宽范围。

## shortcut 注释是怎么回事

它会在刻意偷懒的地方写 \`shortcut:\` 注释，记下这是捷径以及什么时候该回来收拾，然后 \`/ponytail-debt\` 把它们汇总成账本——目的是让「以后再说」不会变成「永远不说」。

不想要这个词，在你项目的 \`CLAUDE.md\` 或 \`AGENTS.md\` 里说一声，然后跑 \`/ponytail-debt <你的词>\`。

## 功能对等的边界

命令需要**支持 skill 的宿主**：Claude Code、Codex、Devin CLI、OpenCode、Gemini、Antigravity CLI、Hermes Agent、Qoder、Grok Build 等都能用。

但在纯指令适配层（Cursor 的规则文件、Windsurf、Cline、Copilot、Kiro）里，**只有常驻规则，没有命令**。Cursor 配了 hooks 的话能用 \`/ponytail\` 切换档位，但也仅此而已。

别指望在这些环境里敲 \`/ponytail-audit\` 有反应。
`,
      resources: [
        {
          kind: "html",
          title: "INSTALL.md：逐平台安装步骤",
          url: "https://github.com/DietrichGebert/ponytail/blob/main/INSTALL.md",
          note: "Copilot、Cursor、OpenCode、Gemini 等各自的安装与 hooks 配置。非 Claude/Codex 用户看这一页。",
        },
        {
          kind: "markdown",
          title: "核心 prompt（SKILL.md）",
          url: "https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md",
          note: "全部行为都出自这一个文件。想判断它会不会和你的项目规范打架，直接读原文最快。",
        },
        {
          kind: "html",
          title: "官网：案例与基准",
          url: "https://ponytail.dev/stories",
          note: "用 Ponytail 做出来的实际案例与 before/after 对照。判断收益是否值得引入时看这里。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "dify",
    linksCheckedAt: "2026-10-14",
    name: "Dify",
    nameZh: "Dify LLM 应用开发平台",
    aliases: ["dify", "dify.ai", "LLM 应用平台", "工作流", "RAG 平台"],
    summary: "开源 LLM 应用平台：可视化工作流、RAG 管道、Agent、LLMOps 与后端 API 一套自带，能自托管也能用云。适合要把 Prompt 变成可交付应用的团队；注意社区版是基于 Apache 2.0 加附加条件的自有协议。",
    scenes: ["code", "office"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["LLM 平台", "RAG", "工作流", "开源"],
    body: "Dify 的定位是「LLM 应用开发平台」：你在可视化画布上把工作流搭出来，它帮你处理 RAG 管道（从 PDF、PPT 抽取到检索）、Agent（自带沙箱，能跑命令、装软件、处理文件）、模型管理、可观测性和对外 API。原型到生产不必换技术栈，这是它相比「自己用 LangChain 拼一套」的主要卖点。\n上手门槛比想象中低：2 核 CPU、4 GiB 内存起步，`cd docker && cp .env.example .env && docker compose up -d`，然后浏览器打开 localhost/install 做初始化。可观测性可以直接接 Opik、Langfuse、Arize Phoenix。\n要提前知道的是三件事。一是**许可**：仓库用的是 Dify Open Source License，基于 Apache 2.0 但带附加条件，不是纯粹的 Apache——商业二次分发前要读 LICENSE。二是**SSO、RBAC、企业支持 SLA 属于 Dify Enterprise**，社区版自托管没有，别指望自己配出来。三是它本质上是一整套服务（数据库、向量库、worker、web），资源占用和运维成本都高于「一个 Python 包」，个人只是想给几个文档做个问答的话，这套东西偏重。",
    officialUrl: "https://dify.ai",
    officialLabel: "dify.ai",
    links: {
      official: "https://dify.ai",
      github: "https://github.com/langgenius/dify",
    },
    whoFor: "要把 Prompt / RAG / Agent 变成能交付给业务方用的应用，并且需要团队协作、日志与成本观测的团队。",
    whoNot: "只想本地给几份文档做个问答的个人用户——整套服务太重；以及需要 SSO / RBAC 但不想付企业版费用的组织。",
    installTips: [
      "最低 2 核 CPU、4 GiB 内存，且要 Docker 与 Docker Compose v2.24.0 或更高版本，先确认版本再 `docker compose up -d`。",
      "标准起法：`cd docker` → `cp .env.example .env` → `docker compose up -d`，然后浏览器打开 `http://localhost/install` 做初始化。",
      "要 SSO、RBAC 和企业支持属于 Dify Enterprise 的范围，社区版自托管没有这些能力。",
      "想改代码或做二次开发，走官方的「从源码部署」指南，不要直接在 compose 起来的容器里改。",
    ],
    alternatives: [],
    icon: {
      letter: "D",
      color: "#155EEF",
    },
    guide: {
      intro: "按第一次部署会卡在哪讲：硬件与 Compose 版本这两个硬门槛、初始化在哪一步、云 / 社区版 / 企业版怎么选、以及它的协议到底有什么附加条件。",
      markdown: `## 先把两道硬门槛过了

官方给的最低配置很具体：**CPU >= 2 核，RAM >= 4 GiB**。这不是「推荐」，低于它起来之后会各种不稳定。

第二道门槛是 **Docker Compose v2.24.0 或更高**。老版本的 compose 语法支持不全，报错往往出现在解析 compose 文件时。

## 标准起法

\`\`\`bash
cd dify
cd docker
cp .env.example .env
docker compose up -d
\`\`\`

四行，之后：

\`\`\`text
http://localhost/install
\`\`\`

在浏览器打开它走初始化。这一步很多人会去找 \`/\` 或 \`/signin\`，然后以为没起来——**初始化入口就是 /install**。

装不上先看官方 FAQ（docs.dify.ai 的 getting-started/install-self-hosted/faqs），那页覆盖了绝大多数首装问题。

## 三条路怎么选

| | 适合谁 |
| --- | --- |
| **Dify Cloud** | 想先试、不想管服务器 |
| **社区版自托管** | 要数据在自己环境里，能接受自己运维 |
| **Dify Enterprise** | 组织需要自托管 + SSO + RBAC + 支持 SLA |

成本结构不一样：Cloud 是套餐加额度限制；自托管没有许可费，但机器和模型 provider 的钱你自己出；Enterprise 要联系销售。

## 协议有个附加条件

README 写的是：**Dify Open Source License，基于 Apache 2.0 并带附加条件**。

它不是纯 Apache 2.0。如果你打算做二次分发、SaaS 化或者嵌入自己的商业产品，先把仓库根目录的 LICENSE 读完再动手——这一条比任何技术选型都更早该确认。

## 别指望社区版有 SSO

LDAP、SSO、细粒度 RBAC、SCIM 这些企业身份能力，是自托管社区版与 Enterprise 的分界线之一。

如果你的组织一上来就要求「用公司账号登录、按角色分权限」，那就不是装个社区版能解决的事，先去谈 Enterprise，别在社区版上自己糊一层认证。

## 它是什么量级的系统

Dify 不是「一个库」，是一整套服务：web、api、worker、数据库、向量库、文件存储。

带来的好处是开箱就有 LLMOps——日志、标注、基于生产数据持续改进 prompt 与数据集；也自带 Backend-as-a-Service，所有能力都有对应 API，可以嵌进你自己的业务逻辑。

代价就是你得按「运维一套服务」来对待它：备份、升级、资源监控一个都跑不掉。个人只想给几份 PDF 做问答，这套成本和收益不成比例。
`,
      resources: [
        {
          kind: "html",
          title: "自托管安装文档",
          url: "https://docs.dify.ai/getting-started/install-self-hosted",
          note: "Docker Compose 步骤与环境变量说明，附 FAQ。装不上时的第一站。",
        },
        {
          kind: "html",
          title: "支持的模型 provider 列表",
          url: "https://docs.dify.ai/getting-started/readme/model-providers",
          note: "哪些推理服务商与自托管方案能接。选型前确认你手上的 Key 在不在列表里。",
        },
        {
          kind: "html",
          title: "版本与定价总览",
          url: "https://dify.ai/pricing",
          note: "Cloud / 社区版 / Enterprise 三者的能力边界与费用。判断要不要上企业版看这一页。",
        },
      ],
    },
  },
  {
    slug: "open-webui",
    linksCheckedAt: "2026-10-14",
    name: "Open WebUI",
    nameZh: "Open WebUI 自建 AI 界面",
    aliases: ["open webui", "openwebui", "ollama webui", "自建 ChatGPT 界面"],
    summary: "自托管的 AI 聊天前端，接 Ollama 或任何 OpenAI 兼容接口，自带 RAG、多模型对比、RBAC 与插件。适合已经跑起本地模型、要给团队一个界面的场景；代价是功能密度极高，Docker 卷漏挂就会丢库。",
    scenes: ["tools", "office"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["AI 界面", "自托管", "RAG", "开源"],
    body: "Open WebUI 是给自己跑的模型配界面的那块拼图：后端可以是 Ollama，也可以是任何 OpenAI 兼容的 API——LMStudio、GroqCloud、Mistral、OpenRouter、vLLM 都行，把 API URL 指过去就能混着用。它自称「完全离线可运行」，对数据不出内网的场景是关键。\n功能密度是它最大的特点，也是最大的负担：本地 RAG（9 种向量库 + 多种抽取引擎，支持 BM25 + 向量的混合检索与重排）、网页搜索接入几十家 provider、多模型同屏对比、模型竞技场与 ELO 排行、语音视频通话、图像生成、Notes 工作区、Channels 协作空间、日历与定时自动化、插件（Filter / Action / Pipe / Tool / Skill）与 MCP / OpenAPI 工具服务器、用量与成本看板、LDAP 与 SCIM 2.0。\n这套东西对个人来说明显过载。真要给多人用，还要注意规模化：多 worker、多节点要在 Redis 支撑会话与 WebSocket 的前提下部署，数据库可选 SQLite（可加密）或 PostgreSQL。\n两个具体的坑：Docker 起容器**必须挂 `-v open-webui:/app/backend/data`，漏了数据库随容器一起没**；容器内端口是 8080，官方示例映射到宿主机 3000，别照着容器内的 8080 去访问。pip 安装路线要用 Python 3.11，版本不对会有兼容性问题。",
    officialUrl: "https://openwebui.com",
    officialLabel: "openwebui.com",
    links: {
      official: "https://openwebui.com",
      github: "https://github.com/open-webui/open-webui",
    },
    whoFor: "已经在本机或内网跑起模型（Ollama / vLLM / LM Studio），需要一个像样的界面给团队用，且在意数据不出内网的人。",
    whoNot: "只是自己一个人偶尔聊天的人——功能密度远超需要，维护成本不划算；也不适合没有 Docker 经验又不愿意处理卷与端口的人。",
    installTips: [
      "Docker 起法一定要带 `-v open-webui:/app/backend/data`，漏掉这个卷，数据库会随容器一起消失。",
      "Ollama 在宿主机就加 `--add-host=host.docker.internal:host-gateway`；Ollama 在别的机器就改 `OLLAMA_BASE_URL` 指向那台服务器。",
      "只用 OpenAI API 的话加 `-e OPENAI_API_KEY=...`；要 GPU 用 `:cuda` 镜像，且宿主机先装好 NVIDIA CUDA container toolkit。",
      "不想用 Docker 可以 `pip install open-webui` 后 `open-webui serve`，但要用 Python 3.11，否则有兼容性问题；容器内端口是 8080。",
    ],
    alternatives: [],
    icon: {
      letter: "O",
      color: "#4A4A4A",
    },
    guide: {
      intro: "按第一次部署会卡在哪讲：卷为什么会丢数据、Ollama 在容器内还是宿主机的两种接法、端口到底访问哪个、以及功能这么多该先开哪几个。",
      markdown: `## 第一道坎：卷必须挂

这是官方用 WARNING 标出来的：**漏了 \`-v\` 就会丢数据**。

\`\`\`bash
docker run -d -p 3000:8080 \\
  --add-host=host.docker.internal:host-gateway \\
  -v open-webui:/app/backend/data \\
  --name open-webui --restart always \\
  ghcr.io/open-webui/open-webui:main
\`\`\`

\`/app/backend/data\` 里是数据库。不挂卷，容器一删账号、会话、知识库全没了。

## Ollama 在哪，决定了怎么写命令

**Ollama 在同一台机器上**：容器里访问不到宿主机的 \`127.0.0.1:11434\`，必须加 \`--add-host=host.docker.internal:host-gateway\`。这是「双方都在线但永远报错」这类问题的第一嫌疑。

**Ollama 在另一台服务器**：改用环境变量指过去。

\`\`\`bash
docker run -d -p 3000:8080 \\
  -e OLLAMA_BASE_URL=https://example.com \\
  -v open-webui:/app/backend/data \\
  --name open-webui --restart always \\
  ghcr.io/open-webui/open-webui:main
\`\`\`

**只用 OpenAI 兼容 API**：

\`\`\`bash
docker run -d -p 3000:8080 \\
  -e OPENAI_API_KEY=your_secret_key \\
  -v open-webui:/app/backend/data \\
  --name open-webui --restart always \\
  ghcr.io/open-webui/open-webui:main
\`\`\`

## 端口别搞反

容器**内部**监听 8080，官方示例都把它映射到宿主机的 3000。

- Docker 路线：浏览器开 \`http://localhost:3000\`
- pip 路线（\`open-webui serve\`）：直接开 \`http://localhost:8080\`

pip 路线还有一条硬要求：**Python 3.11**。用别的版本会遇到兼容问题。

## 想把 Ollama 一起打包

有 \`:ollama\` 标签的镜像，一个容器里塞了 Open WebUI 和 Ollama，一条命令搞定：

\`\`\`bash
# 有 GPU
docker run -d -p 3000:8080 --gpus=all \\
  -v ollama:/root/.ollama -v open-webui:/app/backend/data \\
  --name open-webui --restart always ghcr.io/open-webui/open-webui:ollama

# 纯 CPU
docker run -d -p 3000:8080 \\
  -v ollama:/root/.ollama -v open-webui:/app/backend/data \\
  --name open-webui --restart always ghcr.io/open-webui/open-webui:ollama
\`\`\`

**注意这里有两个卷**，\`/root/.ollama\` 是模型权重（更大），别只挂一个。

## 功能太多，先开这三个

它的功能列表长得吓人：RAG、网页搜索、多模型对比、语音视频、图像生成、Notes、Channels、日历、自动化、插件、用量看板、LDAP/SCIM……

第一次别全开，按这个顺序：

1. **接上模型**（Ollama 或 OpenAI 兼容 API）——这是能不能用的前提
2. **本地 RAG**：在聊天里用 \`#\` 命令加载文档或知识库，同一个 \`#\` 加 URL 可以把网页拉进对话
3. **用量看板**：先看清 token 与成本，再决定要不要开放给多人

多人用之前再补两件事：RBAC 与用户组（按人给权限），以及如果要横向扩展，Redis 支撑的会话与 WebSocket 是必需的，SQLite 也该换成 PostgreSQL。
`,
      resources: [
        {
          kind: "html",
          title: "官方安装文档",
          url: "https://docs.openwebui.com/getting-started/",
          note: "Docker、Docker Compose、Kustomize、Helm 与非 Docker 原生安装都在这一页下。选安装方式从这里进。",
        },
        {
          kind: "html",
          title: "故障排查",
          url: "https://docs.openwebui.com/troubleshooting/",
          note: "专门覆盖「连不上 Ollama」这类首装问题，含 host.docker.internal 的成因与修法。",
        },
        {
          kind: "html",
          title: "功能总览",
          url: "https://docs.openwebui.com/features",
          note: "RAG、插件、MCP、自动化、RBAC 等全部能力的说明。想判断哪些该先开、哪些可以关，看这里。",
        },
      ],
    },
  },
  {
    slug: "langchain",
    linksCheckedAt: "2026-10-14",
    name: "LangChain",
    nameZh: "LangChain 代理工程框架",
    aliases: ["langchain", "langchain python", "langgraph", "AI 应用框架"],
    summary: "Python 里搭 LLM 应用与代理的抽象层：模型、嵌入、向量库可随时替换。适合快速做原型又想留后路的团队；如果你要的是可控的复杂代理，官方自己会让你去看 LangGraph。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["LLM 框架", "代理", "RAG", "开源"],
    body: "今天的 LangChain 已经不是 2023 年那个「链式调用」的库，官方一句话定位自己是 agent engineering platform：给你一套模型、嵌入、向量库、检索器、工具的统一接口，让你在这些东西之间换供应商时不用重写业务代码。\n上手只有两行：`uv add langchain`，然后 `from langchain.chat_models import init_chat_model` + `init_chat_model(\"openai:gpt-5.5\")`。JS / TS 项目有对等的 LangChain.js。\n要理解它的边界，得看清生态里的分工：LangChain 是通用抽象层；**LangGraph** 是低层编排框架，用来做可控的多步 agent 工作流；**Deep Agents** 是更高层的封装，自带规划、子代理、文件系统这些常见能力；**LangSmith** 负责评估、可观测性与部署。README 的 TIP 直接建议你：刚入门想做复杂任务的 agent，从 Deep Agents 开始。\n代价要讲清楚：抽象层是有成本的。它让你换模型容易，但也意味着调试时要穿透一层间接调用；版本演进快，早期教程里的 `Chain` 写法和现在推荐的写法已经不是一回事。如果你的需求就是「调一次模型、拼一段 prompt」，直接调 SDK 比引入框架轻得多——抽象层的收益要在「确实会换供应商、确实会多步编排」时才兑现。",
    officialUrl: "https://docs.langchain.com/langchain",
    officialLabel: "docs.langchain.com",
    links: {
      official: "https://docs.langchain.com/langchain",
      github: "https://github.com/langchain-ai/langchain",
    },
    whoFor: "需要接多个模型 provider、向量库和工具，并且预期其中一两个以后会换掉的团队；以及要做多步检索与工具调用的应用。",
    whoNot: "只是调一次 API 拼个 prompt 的人——直接调官方 SDK 更轻；也要小心照着旧教程写：早期 Chain 风格与现在的推荐写法差别很大。",
    installTips: [
      "用 `uv add langchain` 装（README 的 quickstart 就是这条），起手是 `from langchain.chat_models import init_chat_model`。",
      "要可控的多步编排，分出去用 LangGraph；想要自带规划、子代理与文件系统的高层封装，看 Deep Agents。",
      "评估、tracing 与调试接 LangSmith，部署长时有状态工作流用 LangSmith Deployment。",
      "JS / TS 项目用 LangChain.js，不要指望 Python 版接口直接照搬。",
    ],
    alternatives: [],
    icon: {
      letter: "L",
      color: "#1C3C3C",
      simpleIcon: "langchain",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：两行代码跑通之后，LangChain、LangGraph、Deep Agents、LangSmith 到底该用哪个，以及抽象层什么时候是负担。",
      markdown: `## 先跑通最小例子

\`\`\`bash
uv add langchain
\`\`\`

\`\`\`python
from langchain.chat_models import init_chat_model

model = init_chat_model("openai:gpt-5.5")
result = model.invoke("Hello, world!")
\`\`\`

这两行就是现在推荐的起手式。注意 \`init_chat_model\` 里的字符串是 \`provider:model\` 形式，换供应商就是换这个前缀——这正是整套抽象存在的理由。

## 四个东西别搞混

这是新人最常卡住的地方。生态里四个名字各有分工：

| 组件 | 干什么 | 什么时候用 |
| --- | --- | --- |
| **LangChain** | 通用抽象层：模型、嵌入、向量库、工具 | 接外部系统、想保留替换余地 |
| **LangGraph** | 低层编排：可控的多步 agent 工作流 | 流程复杂、需要精确控制每一步 |
| **Deep Agents** | 高层封装：自带规划、子代理、文件系统 | 刚入门，想要常见能力开箱即用 |
| **LangSmith** | 评估、可观测性、调试、部署 | 要上线、要看 trace、要跑评估 |

README 的 TIP 说得很直接：**刚入门先看 Deep Agents**，它就是为了「agent 该有的常见能力」而做的高层包。

## 抽象层值不值

LangChain 卖的是「以后能换」：模型换、向量库换、工具换，业务代码不动。

这个收益在两种情况下才兑现：

1. 你**确实**会在多个 provider 之间摇摆或做 A/B
2. 你的应用**确实**有多步检索、工具调用、状态流转

反过来，如果你的需求就是「拼一段 prompt 调一次模型」，直接调官方 SDK 更轻——少一层间接调用，报错栈也短得多。

## 旧教程是个坑

LangChain 演进很快，\`Chain\` 时代那批教程（\`LLMChain\`、\`ConversationalRetrievalChain\` 之类）与现在的推荐写法已经不是一回事。

照着 2023 年的博客抄，大概率会装上一堆废弃接口。判断方法：**以 docs.langchain.com 的当前 overview 为准**，博客只当思路参考。

## 什么时候该上 LangSmith

框架本身不提供生产可观测性。上线前要回答「这次回答为什么这么答」「token 花在哪」「改 prompt 有没有变好」，这三件事靠 LangSmith：trace、评估集、部署。

如果你的项目只是脚本级别跑一跑，先别引入；一旦要给人用、要迭代 prompt，它就是必需的。
`,
      resources: [
        {
          kind: "html",
          title: "概念总览",
          url: "https://docs.langchain.com/oss/python/langchain/overview",
          note: "当前推荐的心智模型与接口写法。避免照着旧教程写，以这一页为准。",
        },
        {
          kind: "html",
          title: "生态总览：LangChain / LangGraph / Deep Agents 怎么配合",
          url: "https://docs.langchain.com/oss/python/concepts/products",
          note: "四个产品的分工与选型。第一次决定该用哪个时看这一页。",
        },
        {
          kind: "html",
          title: "API 参考",
          url: "https://reference.langchain.com/python",
          note: "全部公开类、函数、类型的完整参考。写具体集成时对着查。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "moneyprinterturbo",
    linksCheckedAt: "2026-10-14",
    name: "MoneyPrinterTurbo",
    nameZh: "MoneyPrinterTurbo AI 短视频生成",
    aliases: ["moneyprinterturbo", "mpt", "AI 短视频", "一键成片", "自动剪辑"],
    summary: "给一个主题就自动写脚本、配音、配素材、上字幕合成高清短视频，支持 9:16 / 16:9 / 1:1。适合批量做口播类短视频的人；代价是几乎每步都要接付费 API，成片质量取决于你选的模型与素材源。",
    scenes: ["tools", "social"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["AI 视频", "短视频", "TTS", "开源"],
    body: "MoneyPrinterTurbo 把「主题 → 成片」这条链路整个自动化：LLM 写脚本（可多语言）、TTS 配音、找素材、烧字幕、配背景音乐、剪辑合成一条做完。有 AI Agent、WebUI、API、CLI 四个入口，既能手动点，也能挂进自动化流程，还支持批量生成多条成片与任务历史。\n素材有三条路：Pexels / Pixabay / Coverr 的免费库存素材（要各自申请 API Key），或者文生视频——MiniMax H3、火山方舟 Seedance、WaveSpeed、OFox、MuAPI 都能接，也能走 OpenAI 兼容的文生图再转成动态片段。配音默认可以用 Edge TTS，**免费且不需要 API Key**，也有 Azure、ElevenLabs、 Gemini、MiniMax 等一堆可选。\n代价要说清楚：这不是「装上就能产出好内容」的工具。脚本模型、素材源、配音音色每一项的质量都直接进成片，用便宜模型和免费素材出来的东西，通常一眼能看出来；而且除了 Edge TTS，几乎每个环节都是按量付费的，批量跑之前先算一次成本。\n另外 README 里没有列出操作系统要求与依赖版本，部署前建议先按 WebUI 走通一条完整链路，确认 ffmpeg 之类的外部依赖齐了，再考虑接进自动化。",
    officialUrl: "https://github.com/harry0703/MoneyPrinterTurbo",
    officialLabel: "github.com",
    links: {
      official: "https://github.com/harry0703/MoneyPrinterTurbo",
      github: "https://github.com/harry0703/MoneyPrinterTurbo",
    },
    whoFor: "要批量产出口播 / 解说类短视频（TikTok、YouTube Shorts、Instagram）的运营与内容团队，尤其是已经有稳定模型 Key 的人。",
    whoNot: "指望零成本跑量的人——除 Edge TTS 外每个环节都按量付费；也不适合对画面原创性要求高的项目，库存素材拼出来的片子同质化很明显。",
    installTips: [
      "提供 WebUI、API、CLI、AI Agent 四种入口，先跑 WebUI 走通一条完整链路，再考虑接进自动化流程。",
      "素材走 Pexels / Pixabay / Coverr 的免费库存图库，需要各自申请 API Key；配音默认用 Edge TTS，免费且不需要 Key。",
      "脚本环节要自备大模型 Key，支持 Kimi、OpenAI、Claude、Gemini、DeepSeek、通义千问、Azure OpenAI、火山方舟、Grok、MiniMax、小米 MiMo 等，也兼容 Ollama、OneAPI、LiteLLM 等聚合网关。",
      "画幅要在生成前定好：竖屏 9:16 是 1080×1920，横屏 16:9 是 1920×1080，方形 1:1 是 1080×1080，成片后再改很麻烦。",
    ],
    alternatives: [],
    icon: {
      letter: "M",
      color: "#16A34A",
    },
    guide: {
      intro: "按第一次跑会卡在哪讲：四个入口选哪个、三个 API Key 分别在哪个环节、画幅为什么必须先定、以及怎么估算批量成本。",
      markdown: `## 先走通一条，再谈批量

它有四个入口：**AI Agent、WebUI、API、CLI**。

第一次一定用 **WebUI**。原因是这条链路每一步（脚本 → 配音 → 素材 → 字幕 → 配乐 → 剪辑）都可能因为 Key 没配或依赖缺失而断掉，WebUI 能让你立刻看到断在哪一步。

走通一条之后，再决定用 CLI 或 API 挂进定时任务，用批量功能一次出多条。

## 三个环节，三种 Key

这是最容易搞混的地方——三类外部服务各管一段：

| 环节 | 选项 | 是否要 Key |
| --- | --- | --- |
| **脚本** | Kimi / OpenAI / Claude / Gemini / DeepSeek / 通义千问 / Azure OpenAI / 火山方舟 / Grok / MiniMax / 小米 MiMo | 要 |
| **配音** | Edge TTS（默认）/ Azure Speech / SiliconFlow / Gemini / MiniMax / ElevenLabs 等 | Edge TTS **不要** |
| **素材** | Pexels / Pixabay / Coverr（免费库存）或文生视频（MiniMax H3、Seedance、WaveSpeed、OFox、MuAPI） | 库存与文生视频都要 |

脚本环节还有一条省钱路径：接 Ollama、OneAPI、LiteLLM、Groq、OpenRouter 这类本地或聚合网关，用便宜模型或本地模型写脚本。

## 画幅先定，别事后改

成片只有三种规格，生成时就得选：

\`\`\`text
竖屏 9:16  →  1080×1920
横屏 16:9  →  1920×1080
方形 1:1   →  1080×1080
\`\`\`

竖屏给 TikTok / Reels / Shorts，横屏给 YouTube 常规位，方形给信息流。事后裁剪会破坏字幕位置和画面构图，别指望后期救。

字幕的字体、位置、颜色、大小、描边、背景都能单独调，这一项值得花时间——字幕样式对完播率的影响比换个模型大。

## 素材：免费库存 vs 文生视频

两条路的观感差别很大：

- **Pexels / Pixabay / Coverr**：快、便宜（免费额度内）、但同质化严重，同一批素材在不同账号里反复出现。
- **文生视频**：原创度高，按秒计费，生成慢且要等轮询，成本高一个量级。

折中做法是混用：关键镜头用文生视频，过渡镜头用库存素材。项目支持上传自己的本地图片和视频，这一步能明显拉开和同类内容的差距。

## 批量前先算一次成本

批量生成多条成片是它的强项，但成本也按条数线性放大：

\`\`\`text
单条成本 ≈ 脚本 token + 配音字符/时长 + 素材（库存免费额度 or 文生视频秒数）
\`\`\`

先用最便宜的组合（免费库存 + Edge TTS + 便宜脚本模型）跑一条，估算出单条成本，再决定批量规模。别忘了文生视频是按秒算钱的，一条 30 秒的片子如果全部用 AI 生成素材，成本会远超预期。

## 成片之后

生成完可以一键发布到 TikTok、Instagram 和 YouTube Shorts。发布前建议先人工过一遍字幕错字——LLM 写脚本 + TTS 配音的链路里，专有名词读错是最常见的问题。
`,
      resources: [
        {
          kind: "html",
          title: "GitHub 仓库（功能与配置说明）",
          url: "https://github.com/harry0703/MoneyPrinterTurbo",
          note: "功能清单、支持的模型服务与素材源、各入口的用法。配置 API Key 前先读一遍。",
        },
        {
          kind: "html",
          title: "版本发布记录",
          url: "https://github.com/harry0703/MoneyPrinterTurbo/releases",
          note: "最新发布包与改动。README 未列依赖版本，挑一个稳定 tag 比直接用 main 保险。",
        },
        {
          kind: "html",
          title: "生成样例展示",
          url: "https://harry0703.github.io/mpt-assets/",
          note: "项目实际生成的成片样例，含竖屏与横屏。判断输出质量上限，看样例比看功能表准。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "graphify",
    linksCheckedAt: "2026-10-14",
    name: "Graphify",
    nameZh: "Graphify 代码知识图谱",
    aliases: ["graphify", "graphifyy", "代码知识图谱", "code graph", "AST 图谱"],
    summary: "把代码库解析成可查询的知识图谱，让代理用 query / path / explain 代替 grep。代码部分走 tree-sitter 纯本地、不出机器；代价是文档与 PDF 那一路仍要调模型，且图要自己定期重建。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["代码分析", "知识图谱", "tree-sitter", "开源"],
    body: "Graphify 的思路是：别让代理一遍遍 grep 文件，把仓库先解析成一张图，之后查询都在这张图上做。代码部分用 tree-sitter 做 AST 解析——确定性、不用 LLM、数据不出本机，覆盖约 40 种语言的调用、导入、继承、mixin 关系。\n它刻意不做向量索引：没有 embedding、没有向量库，是一张真的图，可以遍历。`graphify query\"...\"` 返回针对问题的子图，`graphify path A B` 追两个东西之间怎么连上，`graphify explain X` 解释一个概念。它还算 God nodes（最连接的概念）、用 Leiden 做社区划分，并把 `# NOTE:` / `# WHY:` 注释和 ADR / RFC 引用也做成节点挂到代码上。\n最值得称道的一点：**每条边都带 `EXTRACTED` 或 `INFERRED` 标签**，你能分清哪些是源码里明写的、哪些是它推出来的。这比 RAG 那种「相似度命中一段代码」可信得多。\n代价也要说：语义那一层（文档、PDF、图片、视频音频）仍然要调模型，只有你配了后端才跑；图是快照，代码改了就得重建，不是实时同步；项目在推付费的 Graphify Cloud 做常驻与跨仓库，开源 CLI 没有这部分。另外包名是 `graphifyy`（两个 y），装错会拿到别人的包。",
    officialUrl: "https://www.graphify.com",
    officialLabel: "www.graphify.com",
    links: {
      official: "https://www.graphify.com",
      github: "https://github.com/Graphify-Labs/graphify",
    },
    whoFor: "仓库大到代理每次都要花大量 token 重新定位代码的人；以及需要回答「A 和 B 之间怎么串起来的」这类跨文件问题的人。",
    whoNot: "小仓库或单文件项目——建图的开销大于 grep；也不适合指望它实时反映代码变化的人，图是快照，要自己重建。",
    installTips: [
      "PyPI 包名是 `graphifyy`（两个 y），命令仍是 `graphify`；PyPI 上其他 `graphify*` 包都不是官方的。",
      "`uv tool install graphifyy` 后跑 `graphify install` 注册技能，再在 agent 里输入 `/graphify .`；装完找不到命令就 `uv tool update-shell`。",
      "要装到项目而不是用户级：`graphify install --project`，文件落在 `.claude/skills/` 或 `.agents/skills/` 下，可以提交进仓库给团队共用。",
      "需要 Python 3.10+；Windows 用 `winget install astral-sh.uv`，macOS 用 `brew install python@3.12 uv`，Ubuntu/Debian 可以 `sudo apt install python3.12 python3-pip pipx`。",
    ],
    alternatives: [],
    icon: {
      letter: "G",
      color: "#0F766E",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：包名为什么是两个 y、装技能与建图是两步、三个产物分别怎么用、以及 EXTRACTED 与 INFERRED 该怎么看。",
      markdown: `## 包名有两个 y

这是第一个坑，也是最浪费时间的一个：

\`\`\`bash
uv tool install graphifyy      # 包名：graphifyy
graphify install               # 命令：graphify
\`\`\`

PyPI 上其他 \`graphify*\` 包都与本项目无关。装完如果 \`graphify\` 找不到，跑 \`uv tool update-shell\` 刷新 PATH。

需要 **Python 3.10+**。装 uv（推荐）或 pipx：

\`\`\`bash
# macOS
brew install python@3.12 uv
# Windows
winget install astral-sh.uv
\`\`\`

## 两步：装技能，再建图

\`graphify install\` 只是把技能注册给你的 agent（Claude Code、Cursor、Codex、Gemini CLI、Copilot 等 20+ 个平台），**这一步不建图**。

建图是在 agent 里说的：

\`\`\`text
/graphify .
\`\`\`

产出一个目录、三个文件：

\`\`\`text
graphify-out/
├── graph.html       浏览器打开，点节点、过滤、搜索
├── GRAPH_REPORT.md  要点：关键概念、意外连接、建议提问
└── graph.json       完整图，之后查询不必再读文件
\`\`\`

先看 \`GRAPH_REPORT.md\`，它是给人看的部分；\`graph.html\` 适合自己顺着边走一遍。

\`graph.json\` 里带 \`graph.schema_version\` 和 \`graph.graphify_version\`，集成时先检查 schema 版本，格式变了要重建。

## 三个查询命令

\`\`\`bash
graphify explain "APIRouter"
graphify path "FastAPI" "ModelField"
graphify query "认证是怎么串起来的"
\`\`\`

\`explain\` 的输出长这样：

\`\`\`text
Node: APIRouter
  Source:    routing.py L2210
  Community: 2
  Degree:    47

Connections (47):
  --> RequestValidationError [uses] [INFERRED]
  --> .get() [method] [EXTRACTED]
  <-- __init__.py [imports] [EXTRACTED]
\`\`\`

**看标签。** \`EXTRACTED\` 是源码里明写的，\`INFERRED\` 是 Graphify 解析推出来的。看到一条关键结论主要靠 INFERRED 支撑时，自己回去核对一遍源码，不要直接写进代码。

## 装到项目里给团队用

默认 \`graphify install\` 装到用户级。要装进仓库：

\`\`\`bash
graphify install --project
graphify install --project --platform codex
\`\`\`

文件会落在 \`.claude/skills/graphify/SKILL.md\` 或 \`.agents/skills/graphify/SKILL.md\`，可以 git 提交，团队共用同一份配置。

## 它不做什么

三件事别指望：

1. **不是向量检索。** 没有 embedding、没有向量库，所以它回答不了「哪段代码和这个概念相似」这类模糊问题——它只能沿边走。
2. **图是快照。** 代码改了要重新建图，不会自动同步。
3. **语义层要调模型。** 代码用 tree-sitter 是纯本地的；文档、PDF、图片、音视频那一遍要走你配的模型后端，不配就不处理这些文件。

跨仓库、常驻更新、形式化验证这些属于付费的 Graphify Cloud，开源 CLI 没有。
`,
      resources: [
        {
          kind: "html",
          title: "Quickstart",
          url: "https://docs.graphify.com/quickstart",
          note: "从安装到建出第一张图的最短路径。第一次用照它走。",
        },
        {
          kind: "html",
          title: "安装与排错",
          url: "https://docs.graphify.com/installation",
          note: "覆盖 command not found、PowerShell 引号、git-hook PATH、严格模式等问题。装不上时看这里。",
        },
        {
          kind: "html",
          title: "支持的输入与语言",
          url: "https://docs.graphify.com/concepts/supported-inputs",
          note: "哪些语言与文件类型能进图。判断你的仓库能不能用之前先确认这一页。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "browser-use",
    linksCheckedAt: "2026-10-14",
    name: "Browser Use",
    nameZh: "Browser Use 浏览器代理",
    aliases: ["browser use", "browser-use", "浏览器自动化", "AI 浏览器", "playwright agent"],
    summary: "让 AI 像人一样操作浏览器，有 Python 库、CLI 与托管云三条路，Python 库本身 MIT 免费。适合要把重复网页操作自动化的开发者；代价是模型推理与云浏览器另收费，验证码也只能靠云方案缓解。",
    scenes: ["code", "tools"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["浏览器自动化", "AI 代理", "Python", "开源"],
    body: "Browser Use 做的事是「让代理开浏览器干活」：找可预约的时间段、选日期、处理验证码、完成预订——README 里举的就是这类例子。它有三条路径：完全托管的云、给现有编码代理装浏览器能力的 CLI、以及自己代码里调用的 Python 库。\nPython 库是 MIT 且免费的，最小例子很短：`uv add browser-use`，把 `OPENAI_API_KEY` 写进 `.env`，然后 `Agent(task=..., llm=ChatOpenAI(...))` 加 `await agent.run()`。系统提示由 `Agent(...)` 自动提供，你只管写 `task=`；要改可以用 `extend_system_message`，要换用 `override_system_message`。自定义工具用 `Tools()` 注册函数传进去。\n模型选择上，官方推荐自家的 BU2（`ChatBrowserUse(model='bu-2-0'`），走 `BROWSER_USE_API_KEY`；也能通过 provider 前缀用 Claude 或 Gemini，或者直接用 `ChatOpenAI` / `ChatAnthropic` / `ChatGoogle` 带自己的 Key。\n代价讲三点：一是**库免费不等于免费跑**——模型推理和托管浏览器都按量计费，只有用本地浏览器 + Ollama 本地模型才真正不花钱，但那样能力会弱很多。二是**验证码没有保证**：官方明说没有哪种浏览器配置能保证躲开或解开所有验证码，云的 stealth 浏览器和代理只是降低概率。三是 **Bash 工具需要 Linux / macOS 的 `/bin/bash`，Windows 要走 WSL**。另外登录态处理上，本地浏览器可以用 `Browser.from_system_chrome()` 复用 Chrome profile，云浏览器的 profile 同步只传 cookie，不传 localStorage、IndexedDB 和扩展。",
    officialUrl: "https://browser-use.com",
    officialLabel: "browser-use.com",
    links: {
      official: "https://browser-use.com",
      github: "https://github.com/browser-use/browser-use",
    },
    whoFor: "要把「人要在网页上点十几步」这类重复操作自动化的开发者，以及想给自己的编码代理补上浏览器能力的团队。",
    whoNot: "指望零成本跑的人——模型推理与云浏览器都按量计费；也不适合任务里必须稳定通过验证码的场景，官方明确不给保证。",
    installTips: [
      "Python 3.11+，用 `uv add browser-use` 装；新项目先 `uv init --python 3.12`。",
      "把 `OPENAI_API_KEY` 写进 `.env`（用 BU2 模型或云浏览器再加 `BROWSER_USE_API_KEY`），脚本里 `load_dotenv()` 之后会自动读。",
      "CLI 路线把 README 里那段提示直接粘给你的编码代理，它会装最新版、跑 `browser-use skill install` 注册技能并接上你的浏览器。",
      "Windows 上 Bash 工具要 WSL——它需要 Linux 或 macOS 主机上的 `/bin/bash`；Python 库本身没有这个限制。",
    ],
    alternatives: [],
    icon: {
      letter: "B",
      color: "#E85C0D",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：三条路选哪条、最小可跑的脚本长什么样、模型怎么选、以及登录态与验证码这两个现实约束怎么处理。",
      markdown: `## 先选路径

同一套东西有三条入口，选错会白装：

| 路径 | 适合谁 |
| --- | --- |
| **完全托管云** | 只想发任务拿结果，不想管浏览器和基础设施 |
| **CLI** | 已有编码代理（Claude Code、Codex、Hermes、Cursor 等），想给它开浏览器 |
| **Python 库** | 要把浏览器代理嵌进自己的应用，要自定义工具和结构化输出 |

CLI 和 Python 库都能连本地或云浏览器；完全托管的 API 连 agent 一起托管。

## Python 库的最小脚本

\`\`\`bash
uv add browser-use    # Python >= 3.11
\`\`\`

\`.env\`：

\`\`\`bash
OPENAI_API_KEY=your-key
# BROWSER_USE_API_KEY=your-key  # 可选：BU2 模型或云浏览器
\`\`\`

\`agent.py\`：

\`\`\`python
import asyncio
from browser_use import Agent, Browser, ChatBrowserUse, ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

async def main():
    llm = ChatBrowserUse(model='bu-2-0')
    agent = Agent(
        task="Find the number of stars of the browser-use repo",
        llm=llm,
        # browser=Browser(use_cloud=True),  # 需要 BROWSER_USE_API_KEY
    )
    history = await agent.run()
    print(history.final_result())

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

\`\`\`bash
uv run agent.py
\`\`\`

**不用写系统提示。** \`Agent(...)\` 自带，换模型也自带。你的任务写在 \`task=\` 里就够了。

## 模型怎么选

- **BU2**（官方推荐）：\`ChatBrowserUse(model='bu-2-0')\`，用 \`BROWSER_USE_API_KEY\`，专为浏览器任务优化。
- **自带 Key 的通用模型**：\`ChatOpenAI\`、\`ChatAnthropic\`、\`ChatGoogle\`。
- **通过 Browser Use 网关用别的厂**：\`ChatBrowserUse(model='anthropic/claude-sonnet-4-6')\`，provider 前缀即可。

选型看三件事：任务难度、延迟、预算。官方给了 BU2 model card 和支持的模型与定价页做对比。

## 登录态：本地与云不一样

需要登录的站点，两条路处理不同：

\`\`\`python
# 本地：复用你的 Chrome profile
browser = Browser.from_system_chrome()
\`\`\`

\`\`\`python
# 云：用已同步的 profile
browser = Browser(use_cloud=True, cloud_profile_id='your-profile-id')
\`\`\`

**关键差别**：profile 同步只传 cookie，**不传** localStorage、IndexedDB 和扩展。所以有些站点同步完还是要重新登录，这不是配置错了。

## 验证码：别抱幻想

官方 FAQ 的原话是：没有任何浏览器配置能保证每一个验证码都能被避开或解开。

云浏览器提供 stealth 与住宅代理来**降低** bot 检测和验证码出现的概率，本地库开云浏览器也只是提高概率。如果你的任务必经验证码，成功率就是不可控的。

## 免费吗

Python 库是 MIT、免费。但**模型推理和托管浏览器都要钱**——包括 \`ChatBrowserUse\` 自己的网关。

真正不花钱的组合是：本地浏览器 + 本地模型（官方支持通过 Ollama 接本地模型），代价是能力受硬件和模型限制。Bash 工具还有一条硬要求：需要 Linux 或 macOS 的 \`/bin/bash\`，Windows 用 WSL。
`,
      resources: [
        {
          kind: "html",
          title: "Python 库文档",
          url: "https://docs.browser-use.com/open-source/introduction",
          note: "安装、Agent 用法、自定义工具与结构化输出。写自己的脚本时对着这一页。",
        },
        {
          kind: "html",
          title: "支持的模型与定价",
          url: "https://docs.browser-use.com/open-source/supported-models",
          note: "各模型的能力与费用，含如何用 Ollama 接本地模型。估算成本与选型前必读。",
        },
        {
          kind: "html",
          title: "真实浏览器与 profile 指南",
          url: "https://docs.browser-use.com/open-source/customize/browser/real-browser",
          note: "复用本地 Chrome profile 的方法与限制。要处理登录态时看这里。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "caveman",
    linksCheckedAt: "2026-10-14",
    name: "Caveman",
    nameZh: "Caveman 省 token 代理技能",
    aliases: ["caveman", "caveman cli", "省 token", "token 压缩", "极简输出"],
    summary: "装完让代理用最少的 token 说话、读压缩后的日志：官方测整会话输入 token 少 33.2%，Auto 档比 Opus 顶配便宜 54%。适合按量付费的重度用户；如果你按请求计费（如订阅制），省输出 token 并不省钱。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["编码代理", "Token 优化", "CLI", "开源"],
    body: "Caveman 是一个装在你代理身上的省 token 套件，4.0 之后拆成六块：Say less（回答变短）、Read less（日志 / JSON / CSV / 测试输出在喂给模型前先压缩）、Auto（按任务难度自动挑模型和 effort）、Blocks（代理写的脚本存进仓库复用，别每次重写）、Waste fixes（找出 token 花在哪）、Browse（网页回来先压缩）。\n数字要带着条件看：Read less 那组官方自己标了诚实部分——测试文件是把一条记录藏在 61~72 KB 噪声里，HTML 目前没有压缩器所以在那一项上是变差的，整会话 33.2% 的节省来自 2026 年 8 月的旧引擎。Auto 那组 54% 的省钱主要来自「简单任务降 effort」，而且样本还在跑一半，0.5 分的差距在 ±7 的区间里根本分不出。\n有两个设计值得单独说：一是**它绝不改写你的 prompt**——Adobe Research 的论文发现把用户自己的 prompt 也 caveman 化会让答案变差；二是代码、命令、路径、错误信息逐字不动，只有散文被压缩。\n成本也要算：规则本身约 1160 个输入 token，而且如果你是按请求付费（比如 GitHub Copilot 订阅），回答变短一分钱也不省。另外只有 Auto 需要账号（免费），其余都跑在你本机、用你自己的 Key。",
    officialUrl: "https://docs.caveman.so/caveman",
    officialLabel: "docs.caveman.so",
    links: {
      official: "https://docs.caveman.so/caveman",
      github: "https://github.com/JuliusBrussee/caveman",
    },
    whoFor: "按 token 付费、每天让代理跑大量任务的重度用户，尤其是日志和测试输出吃掉了大量上下文的场景。",
    whoNot: "按请求计费的订阅用户（省输出 token 不省钱）；也不适合需要代理写详细解释与文档的人——它的默认取向就是少说。",
    installTips: [
      "一条命令：`npx @caveman-ai/cli@latest`。它会自己找出你装了哪些 agent、列出要改什么，确认后回车完成；需要 Node.js 22.13+。",
      "只想要「说话更短」这一个能力：`npx skills add JuliusBrussee/caveman -g`，不装代理层，不碰你的登录态。",
      "npm 12 及以上会拦住 git 安装，旧的一键脚本会失败；用 README 里的新版一行命令，或 `npx --allow-git=root -y github:JuliusBrussee/caveman#v4.0.0`。",
      "卸载：`npx -y github:JuliusBrussee/caveman -- --uninstall`（npm 12+ 要额外加 `--allow-git=root`）；只装了技能就 `npx skills remove JuliusBrussee/caveman -g`。",
    ],
    alternatives: [],
    icon: {
      letter: "C",
      color: "#6B4423",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：Node 版本与 npm 12 的安装坑、六块能力各自开关、哪些数字该打折扣、以及什么情况下它其实不省钱。",
      markdown: `## 一条命令，但有两个前置

\`\`\`bash
npx @caveman-ai/cli@latest
\`\`\`

它会扫描你机器上装了哪些 agent、找出登录配置，把将要改动的地方列给你看，回车确认。

硬要求：**Node.js 22.13+**。装完 \`claude\`、Codex、Gemini CLI、OpenCode 等 30+ 个 agent 都会变成 caveman 模式，跑在你本机、用你自己的 Key。

**npm 12 的坑**：新版本 npm 会拦住 git 安装，钉在 v3.1.0 或更旧的脚本会直接失败。新版一行命令自己处理了这个，或者显式加参数：

\`\`\`bash
npx --allow-git=root -y github:JuliusBrussee/caveman#v4.0.0
\`\`\`

## 六块，各有开关

\`\`\`bash
caveman status          # 看哪些开着
caveman off browse      # 关掉其中一块
\`\`\`

| 块 | 干什么 | 官方测得 |
| --- | --- | --- |
| Say less | 回答变短，代码不变 | 63 → 20 token，同一个修复 |
| Read less | 日志 / JSON / CSV / 测试输出先压缩 | 整会话输入 token -33.2% |
| Auto | 按任务难度挑模型和 effort | 比 Opus xhigh 便宜 54% |
| Blocks | 代理写的脚本存进仓库复用 | 一次测试 397 → 76 token |
| Waste fixes | 找 token 花在哪、保持 prompt cache 温着 | 未测 |
| Browse | 网页回来先压缩 | 页面小 129.8 倍 |

只有 **Auto 需要账号**，且免费：

\`\`\`bash
caveman login
\`\`\`

登录后在模型选择器里会出现 Auto；不登录就只是没有 Auto，也不会往外发东西。

## 只想让回答变短

不需要整套，只装那一条 skill：

\`\`\`bash
npx skills add JuliusBrussee/caveman -g
\`\`\`

在会话里敲 \`/caveman\`（Codex 里是 \`$caveman\`）；想更短有 \`/ultracave\`、\`/megacave\`。说 \`stop caveman\` 就恢复。

## 这些数字该打几折

README 里有专门的 HONEST-NUMBERS 一节，值得先看。几个关键点：

1. **Read less 的测试文件是刻意设计的**：一条记录藏在 61~72 KB 噪声里，压缩比好看是必然的。你的日志不会这么极端。
2. **HTML 目前没有压缩器**，在那一项上结果是变差的（9.9%），表格里那行是红的，作者没有藏。
3. **整会话 33.2% 来自 2026 年 8 月的旧引擎**，现在未必一样。
4. **Auto 的 54% 主要来自「简单任务降 effort」**，而且样本只跑了一半，0.5 分的得分差在 ±7 的置信区间里分辨不出。已经在用 Opus medium 的话，省得更少，且没测。

## 什么情况下它不省钱

两个前提缺一不可：

- **你得按 token 付费。** 如果按请求计费（GitHub Copilot 这类订阅），回答变短一分钱不省。
- **规则本身有成本。** 那套规则约 1160 个输入 token，每次请求都要带上。极短的任务可能反而更贵。

## 它不碰什么

三条硬边界，理解了这个就不会担心它搞坏东西：

1. **你的 prompt 一个字不改。** Adobe Research 的论文发现把用户 prompt 也 caveman 化会让答案变差，所以作者明确不动它。
2. **代码、命令、路径、错误信息逐字保留。** 压缩只发生在散文部分。
3. **该说人话时说人话。** 安全警告、不可逆操作、用户表示困惑时，会切回完整句子。

另外 JetBrains 的 A/B 测出一个前提：agent 会话里大部分内容是代码和工具调用，而 caveman 的「口音」不动这些——所以它后来才去做 Read less 和 Blocks 这两块。
`,
      resources: [
        {
          kind: "markdown",
          title: "INSTALL.md：各平台安装与卸载",
          url: "https://github.com/JuliusBrussee/caveman/blob/main/INSTALL.md",
          note: "Claude app / 手机端 / Gemini / Windows / 多 agent 同时装的具体步骤，以及卸载方式。装不上时看这里。",
        },
        {
          kind: "markdown",
          title: "HONEST-NUMBERS：所有它输的场景",
          url: "https://github.com/JuliusBrussee/caveman/blob/main/docs/HONEST-NUMBERS.md",
          note: "列出 caveman 不奏效甚至变差的情况。决定要不要装之前先读这一页，比看宣传数字有用。",
        },
        {
          kind: "html",
          title: "v4.0.0 发布说明",
          url: "https://github.com/JuliusBrussee/caveman/releases/tag/v4.0.0",
          note: "六块能力的拆分与各自开关。升级后想搞清楚新增了什么，看这一页。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "tradingagents",
    linksCheckedAt: "2026-10-14",
    name: "TradingAgents",
    nameZh: "TradingAgents 多代理交易框架",
    aliases: ["tradingagents", "trading agents", "多代理交易", "量化研究", "LLM 交易"],
    summary: "把交易流程拆成分析师、研究员、交易员、风控与组合经理的多代理框架，产出带 HTML 报告的决策链。只适合做策略研究与回测——官方明确声明它不是投资建议，实盘盈亏自负。",
    scenes: ["data", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["量化", "多代理", "回测", "开源"],
    body: "TradingAgents 模拟真实交易公司的分工：基本面分析师、情绪分析师、新闻分析师、技术分析师各出报告（并行跑、各用各的工具），多空研究员就这些报告做结构化辩论，交易员汇总决定时机与仓位，风控团队评估波动率与流动性后把评估报告交给组合经理拍板，通过才发到模拟交易所。\n工程上它做得比多数同类认真：v0.5.0 之后强调 point-in-time integrity——回测时每个分析日期只能看到那天之前已发布的数据，SEC EDGAR 的财报按「申报时」提供，FRED 宏观与社交情绪也都做了前视偏差过滤。这一点是量化回测里最容易自欺的地方。输出是一份报告，v0.6.0 起还带 `complete_report.html` 单页版。\n模型端很开放：OpenAI、Google、Anthropic、xAI、DeepSeek、Qwen、GLM、MiniMax、OpenRouter、Mistral、Moonshot、Groq、NVIDIA NIM、Bedrock、Azure OpenAI，本地可以接 Ollama，任何 OpenAI 兼容服务（vLLM、LM Studio、llama.cpp）用 `openai_compatible` 加 `backend_url` 即可。\n必须说清楚：**这是研究框架，不是赚钱工具**。README 顶部就写着结果取决于骨干模型、温度、交易时段、数据质量等不确定因素，且明确不是财务、投资或交易建议。装它需要 Python 3.11+ 和至少一个模型 Key，跑一次完整分析的花费也要先算清楚。",
    officialUrl: "https://arxiv.org/pdf/2412.20138",
    officialLabel: "arxiv.org",
    links: {
      official: "https://arxiv.org/pdf/2412.20138",
      github: "https://github.com/TauricResearch/TradingAgents",
    },
    whoFor: "做多代理决策与量化策略研究的人：想看 LLM 分工协作在金融任务上能做到什么程度，或者要一个带前视偏差防护的回测骨架。",
    whoNot: "想拿它实盘赚钱的人——官方明确声明不是投资建议；也不适合对金融数据严谨性要求不高的玩具项目，它为了 point-in-time 完整性引入了额外复杂度。",
    installTips: [
      "需要 Python 3.11+：`git clone` 后用 conda（`conda create -n tradingagents python=3.13`）或 uv（`uv venv --python 3.13`）建环境，再 `pip install .`（uv 用 `uv pip install .`）。",
      "Docker 路线：先 `cp .env.example .env` 填 Key，再 `docker compose run --rm tradingagents`；更新仓库后要重新 `docker compose build`。",
      "结果、报告、记忆日志和缓存默认落在 `tradingagents_data` 卷里；想放宿主机目录就设 `TRADINGAGENTS_DATA_DIR`（例如 `mkdir -p data && TRADINGAGENTS_DATA_DIR=./data ...`）。",
      "至少要配一个模型 Key（OpenAI / Google / Anthropic / DeepSeek / Qwen / GLM 等）；`FRED_API_KEY` 是免费的宏观数据，可选；本地模型用 `llm_provider: ollama`。",
    ],
    alternatives: [],
    icon: {
      letter: "T",
      color: "#0B4F6C",
    },
    guide: {
      intro: "按第一次跑会卡在哪讲：环境与依赖、Key 怎么配、CLI 交互与免交互两种跑法、ticker 后缀怎么填、以及为什么它的回测强调 point-in-time。",
      markdown: `## 环境

\`\`\`bash
git clone https://github.com/TauricResearch/TradingAgents.git
cd TradingAgents
\`\`\`

需要 **Python 3.11 或更高**。两种建法：

\`\`\`bash
conda create -n tradingagents python=3.13
conda activate tradingagents
pip install .
\`\`\`

\`\`\`bash
uv venv --python 3.13
source .venv/bin/activate
uv pip install .
\`\`\`

Docker 也行，但**要先填 Key**：

\`\`\`bash
cp .env.example .env     # 填你的 API keys
docker compose run --rm tradingagents
\`\`\`

改完仓库记得 \`docker compose build\` 重建镜像。

## Key 与 provider

至少配一个模型 Key，README 列了长长的清单：OpenAI、Google、Anthropic、xAI、DeepSeek、Qwen（国际 \`dashscope-intl\` 与国内 \`dashscope\` 分开）、GLM（Z.AI 与 BigModel 分开）、MiniMax、OpenRouter、Mistral、Moonshot、Groq、NVIDIA NIM。

\`\`\`bash
export OPENAI_API_KEY=...
export FRED_API_KEY=...        # FRED 宏观数据，免费、可选
export ALPHA_VANTAGE_API_KEY=...
\`\`\`

几个特殊情况：

- **Azure OpenAI**：复制 \`.env.enterprise.example\` 到 \`.env.enterprise\` 填凭证。
- **Bedrock**：额外装 \`pip install ".[bedrock]"\`，设 \`llm_provider: "bedrock"\`，配好 AWS 凭证与 \`AWS_DEFAULT_REGION\`。
- **本地模型**：\`llm_provider: "ollama"\`，默认端点 \`http://localhost:11434/v1\`，远程就改 \`OLLAMA_BASE_URL\`。
- **vLLM / LM Studio / llama.cpp**：\`llm_provider: "openai_compatible"\`，用 \`backend_url\` 指过去（vLLM 常是 \`http://localhost:8000/v1\`，LM Studio 是 \`http://localhost:1234/v1\`）。本地服务不需要 Key。

## 两种跑法

**交互式**：

\`\`\`bash
tradingagents          # 或直接 python -m cli.main
\`\`\`

屏幕让你选 ticker、分析日期、provider、研究深度等。**上一轮的答案会作为默认值**，一路回车就是重复上次的配置。

**免交互**（给定时任务或脚本）：

\`\`\`bash
export TRADINGAGENTS_LLM_PROVIDER=openai TRADINGAGENTS_QUICK_THINK_LLM=gpt-6-luna TRADINGAGENTS_DEEP_THINK_LLM=gpt-6-sol
export TRADINGAGENTS_OUTPUT_LANGUAGE=English TRADINGAGENTS_MAX_DEBATE_ROUNDS=1 TRADINGAGENTS_MAX_RISK_ROUNDS=1
tradingagents --ticker NVDA --date 2026-09-23 --analysts market,news,fundamentals --save --no-show
\`\`\`

每个 flag 只跳过它自己那一问。跑在没有终端的环境里，缺任何一问的答案会在**开始前**就停下并告诉你缺哪个 flag 或变量——这点比静默用默认值强。

## ticker 要带交易所后缀

它支持 Yahoo Finance 覆盖的任何市场，公司身份与 alpha 基准按市场自动解析：

\`\`\`text
US      : AAPL, SPY
香港    : 0700.HK        东京: 7203.T        伦敦: AZN.L
印度    : RELIANCE.NS / .BO                  加拿大: .TO     澳洲: .AX
A 股    : 600519.SS（沪） / .SZ（深）
加密    : BTC-USD, ETH-USD
\`\`\`

## 报告长什么样

\`--save\` 之后会多出 \`complete_report.html\`：整份报告做成单页，章节列在正文旁边，浏览器、手机、打印都能看。脚本里用 \`ta.save_reports(state, "NVDA", html=False)\` 可以不要这一页。

## 前视偏差这件事

它是这个框架最值得学的地方。v0.5.0 之后的每条 dated path 都做了 point-in-time 处理：

- 回测时每个分析日期**只能看到该日期之前已发布**的数据
- SEC EDGAR 的财报按「申报时」提供，而不是按财报期
- FRED 宏观、社交情绪、决策日志记忆都做了前视过滤

早期版本（v0.3.1 起）陆续修过 Alpha Vantage 的前视问题。如果你自己在上面加数据源，**这条约束要自己守住**——否则回测结果会漂亮得没有意义。

## 别忘了那句话

README 顶部有一句加粗：本框架为研究用途设计，交易表现取决于骨干模型、温度、交易时段、数据质量等不确定因素，**不构成财务、投资或交易建议**。

跑出来的结论当研究素材看，别当信号下单。
`,
      resources: [
        {
          kind: "html",
          title: "论文（arXiv）",
          url: "https://arxiv.org/abs/2412.20138",
          note: "框架的方法与各角色设计。想判断它的多代理结构是否可靠，读原文比读 README 有用。",
        },
        {
          kind: "html",
          title: "免责声明",
          url: "https://tauric.ai/disclaimer/",
          note: "官方对「不是投资建议」的完整说明。打算把输出用于任何实际决策前必读。",
        },
        {
          kind: "markdown",
          title: "CHANGELOG：各版本修了什么",
          url: "https://github.com/TauricResearch/TradingAgents/blob/main/CHANGELOG.md",
          note: "前视偏差、数据源、模型支持的逐版本记录。要自己加数据源时先看哪些坑已经修过。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "llms-from-scratch",
    linksCheckedAt: "2026-10-14",
    name: "LLMs-from-scratch",
    nameZh: "从零实现大模型（教程代码库）",
    aliases: ["llms from scratch", "build a large language model", "从零写 GPT", "大模型教程"],
    summary: "《Build a Large Language Model (From Scratch)》的官方代码库，一章一章用 PyTorch 手写 GPT：注意力、预训练、分类微调、指令微调。适合真想看懂 LLM 内部的人；只想调 API 的话这里没有捷径。",
    scenes: ["education", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["大模型", "PyTorch", "教程", "开源"],
    body: "这是 Sebastian Raschka 那本《Build a Large Language Model (From Scratch)》的官方仓库，不是工具库。主线从第 2 章的文本数据与 DataLoader、第 3 章手写注意力机制、第 4 章从零搭出 GPT 模型、第 5 章在无标注数据上预训练、第 6 章分类微调、到第 7 章指令微调，附录 A 补 PyTorch 基础、附录 E 讲 LoRA 参数高效微调。不用任何外部 LLM 库，全部自己写。\n它最实在的一点是**硬件门槛低**：主章节代码设计成在普通笔记本上就能在合理时间内跑完，有 GPU 会自动用上。这和大多数「复现 LLM」的仓库不一样——那个量级的东西个人根本跑不动。\n每章都有练习，答案汇总在附录 C，各章目录下还有 `exercise-solutions.ipynb`；Manning 网站上还能免费下一本 170 页的测验 PDF（每章约 30 题）。另外有 17 小时 15 分的配套视频课，章节结构与书一一对应。\n代价是时间：这是「逐个概念手写一遍」的路子，不是三小时速成。想快速用上 LLM 的人应该去看推理框架或 API，这里解决的是「它到底怎么工作」。续作《Build A Reasoning Model (From Scratch)》从预训练模型出发讲推理时扩展、强化学习与蒸馏，读完主线再接那本。",
    officialUrl: "https://amzn.to/4fqvn0D",
    officialLabel: "amzn.to",
    links: {
      official: "https://amzn.to/4fqvn0D",
      github: "https://github.com/rasbt/LLMs-from-scratch",
    },
    whoFor: "有 Python 基础、想真正理解注意力与 GPT 内部构造的工程师与自学者；要找可动手教材备课的老师也用得上。",
    whoNot: "想三天内做出一个能用的 AI 应用的人——这里全是原理与手写实现；也不适合没有 Python 基础的人，README 把「扎实的 Python 功底」列为最重要的前提。",
    installTips: [
      "`git clone --depth 1 https://github.com/rasbt/LLMs-from-scratch.git` 拉代码，按 ch02 → ch07 的章节顺序读 notebook，每章目录下的 `01_main-chapter-code/` 是主代码。",
      "环境别猜：先读仓库里的 `setup/README.md`，它讲了 Python 与本书依赖怎么装；`setup/03_optional-docker-environment` 有 Docker 环境指南。",
      "没用过 PyTorch 就从附录 A 开始，它是一份精简入门；主章节代码会自动使用 GPU，没有 GPU 也能在笔记本 CPU 上跑完。",
      "每个主章节都有 `exercise-solutions.ipynb`，答案汇总在附录 C；Manning 网站可免费下载含每章约 30 题的测验 PDF 自查。",
    ],
    alternatives: [],
    icon: {
      letter: "L",
      color: "#7C3AED",
    },
    guide: {
      intro: "按第一次读会卡在哪讲：章节顺序怎么走、Python 与 PyTorch 两个前提怎么补、每章的三种文件分别是什么、以及哪些 bonus 材料值得回头看。",
      markdown: `## 路线图：按章节走，别跳

\`\`\`bash
git clone --depth 1 https://github.com/rasbt/LLMs-from-scratch.git
\`\`\`

主线是第 2 到第 7 章，每章一个目录：

| 章 | 内容 |
| --- | --- |
| Ch 2 | 文本数据与 DataLoader |
| Ch 3 | 手写注意力机制 |
| Ch 4 | 从零实现 GPT 模型 |
| Ch 5 | 在无标注数据上预训练 |
| Ch 6 | 分类任务微调 |
| Ch 7 | 指令微调 |

**顺序不要跳。** 第 3 章的注意力是第 4 章模型的核心，第 4 章的模型又是第 5 章预训练的输入。跳章读会卡在「这个张量从哪来」。

## 每章三种文件

每个章节目录下都有 \`01_main-chapter-code/\`，里面通常是三类：

- \`chXX.ipynb\` —— 主章节代码，跟着书走
- \`gpt.py\` / \`gpt_train.py\` 之类 —— 把 notebook 收敛成可直接跑的脚本（README 表里标 summary 的那些）
- \`exercise-solutions.ipynb\` —— 练习解答

想省时间就跑脚本；想看懂就一行行走 notebook。

## 两个前提

README 把 **扎实的 Python 功底**列为最重要的前提。有深度神经网络经验会更好，但不是必需。

PyTorch 这边：不要求精通，但熟悉基础有用。完全没碰过就先读附录 A（\`appendix-A/01_main-chapter-code/\`），它分两部分讲张量到多 GPU 训练，是精简版入门。

硬件反而不是门槛：**主章节代码设计成在普通笔记本上就能在合理时间内跑完**，检测到 GPU 会自动用上。这和那些要求 A100 的复现仓库完全不同。

环境别自己猜，仓库里有专门的 \`setup/README.md\`，还有 \`setup/03_optional-docker-environment\` 给想用 Docker 的人。

## 练习和自查

每章都有练习，三条路径：

1. \`exercise-solutions.ipynb\` —— 各章目录下的可运行解答
2. 附录 C —— 所有练习的答案汇总
3. Manning 网站的免费 170 页 PDF《Test Yourself On Build a Large Language Model (From Scratch)》—— 每章约 30 道测验题加解答

读完一章就做那一章的题，比连读三章再做有用得多。

## 值得回头看的 bonus

主线走完后，这些 bonus 材料含金量很高：

- \`ch02/05_bpe-from-scratch/\` —— 从零写 BPE 分词器
- \`ch04/03_kv-cache\` —— KV Cache
- \`ch04/04_gqa\`、\`05_mla\`、\`06_swa\`、\`09_dsa\` ——  grouped-query / 多头潜在 / 滑动窗口 / DeepSeek 稀疏注意力
- \`ch04/07_moe\` —— 混合专家
- \`ch05/07_gpt_to_llama\` 与 \`ch05/11_qwen3/\`、\`12_gemma3/\` —— 把 GPT 改成 Llama，以及从零写 Qwen3、Gemma 3

这批内容是主线之外最能建立「架构直觉」的部分。

## 接下来读什么

续作是《Build A Reasoning Model (From Scratch)》（仓库 rasbt/reasoning-from-scratch），它从预训练模型出发，实现推理时扩展、强化学习与蒸馏。

顺序应该是：先走完本仓库主线（搞清模型怎么搭、怎么训），再进那本（搞清怎么让它会推理）。

## 它不是什么

这不是一个能 pip install 然后拿去干活的库，也没有推理优化、服务化、量化这些工程内容。它解决的是唯一一件事：**让你知道 LLM 内部到底在做什么**。想要能用的东西，读完第 4 章之后去看推理框架。
`,
      resources: [
        {
          kind: "markdown",
          title: "setup/README.md：环境搭建",
          url: "https://github.com/rasbt/LLMs-from-scratch/blob/main/setup/README.md",
          note: "Python 与依赖的安装建议，含 Docker 环境指南。别自己猜版本，照这一页配。",
        },
        {
          kind: "html",
          title: "作者博客：怎么读这本书",
          url: "https://sebastianraschka.com/blog/2025/reading-books.html",
          note: "作者本人给的技术书阅读方法，README 里专门链了它。决定要不要从头啃之前看一眼。",
        },
        {
          kind: "markdown",
          title: "附录 A：PyTorch 入门",
          url: "https://github.com/rasbt/LLMs-from-scratch/blob/main/appendix-A/01_main-chapter-code/code-part1.ipynb",
          note: "给没用过 PyTorch 的人的精简入门，分两部分。主线开始前先过一遍这部分。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "claude-mem",
    linksCheckedAt: "2026-10-14",
    name: "claude-mem",
    nameZh: "claude-mem 跨会话记忆",
    aliases: ["claude mem", "claude-mem", "cmem", "代理记忆", "会话记忆"],
    summary: "给编码代理装跨会话记忆：5 个生命周期 hook 自动抓取工具调用、压缩成摘要，下次会话自动注入。适合长项目反复断线的场景；注意 `npm install -g claude-mem` 只装 SDK，不注册 hook。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["代理记忆", "Claude Code", "上下文工程", "开源"],
    body: "claude-mem 解决的是编码代理最烦的一件事：会话一断，之前做过的决定、踩过的坑全部归零。它用 5 个生命周期 hook（SessionStart、UserPromptSubmit、PostToolUse、Stop、SessionEnd）自动抓取会话里的工具使用观察，生成语义摘要，下次会话开始时自动注回上下文。\n检索设计得比较克制，是一个三层工作流：先 `search` 拿紧凑索引（每条约 50~100 token），再 `timeline` 看某个观察前后的时间线，最后只对筛出来的 ID 用 `get_observations` 取全文（每条约 500~1000 token）。官方称这样能省约 10 倍 token——关键是**先筛后取**，不要一上来就拉全文。\n架构是本地 worker 服务（Bun 管理，带 web viewer）+ SQLite（FTS5）+ Chroma 向量库做混合检索。配置在 `~/.claude-mem/settings.json`，模型、worker 端口、数据目录、日志级别和上下文注入都能调。隐私上有 `<private>` 标签，包住的内容不进存储。\n要注意两点：一是**安装方式**——`npm install -g claude-mem` 只装 SDK，不注册 hook 也不起 worker，必须走 `npx claude-mem install` 或 `/plugin`；二是它默认会引导你用邮箱魔法链接登录以换取 memory key 并开通 30 天试用（不登录也能用，加 `--provider` 或设 `CLAUDE_MEM_ONLINE_OPTIN=false` 即可跳过）。",
    officialUrl: "https://claude-mem.ai",
    officialLabel: "claude-mem.ai",
    links: {
      official: "https://claude-mem.ai",
      github: "https://github.com/thedotmack/claude-mem",
    },
    whoFor: "在长周期项目里反复开新会话、厌倦了每次重新解释背景的人；以及跨多个 agent（Claude Code、Codex、OpenCode 等）干活、希望记忆能共用的人。",
    whoNot: "会话都很短、上下文根本用不完的人——注入的记忆只会白白占上下文；也不适合不能接受「代理把你的工具调用记录写进本地库并可能走云端记忆服务」的团队。",
    installTips: [
      "用 `npx claude-mem install` 装；不要只跑 `npm install -g claude-mem`，那只装 SDK，不注册 hook 也不起 worker 服务。",
      "需要 Node.js 20.0.0+；Bun 与 uv（向量检索用）缺失时会自动安装。装完重启 Claude Code，旧会话的上下文会自动出现在新会话里。",
      "不想登录账号就加显式 `--provider`，或设 `CLAUDE_MEM_ONLINE_OPTIN=false`；CI 与非交互 shell 下会自动跳过登录。",
      "敏感内容用 `<private>` 标签包起来，被包住的部分不会写入存储。",
    ],
    alternatives: [],
    icon: {
      letter: "C",
      color: "#2563EB",
    },
    guide: {
      intro: "按第一次装会卡在哪讲：为什么 npm 全局装没用、登录后到底开了什么、三层检索怎么用才省 token、以及配置与隐私控制在哪。",
      markdown: `## 最容易踩的安装坑

\`\`\`bash
npx claude-mem install
\`\`\`

**不要用 \`npm install -g claude-mem\` 代替。** README 专门加了 Note：全局 npm 安装只装 SDK / library，不注册 plugin hook，也不起 worker 服务。结果就是「装了但什么都没发生」。

Claude Code 里也可以走插件市场：

\`\`\`text
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
\`\`\`

**装完必须重启 Claude Code**，之后旧会话的上下文会自动出现在新会话里。

要求 Node.js 20.0.0+，Bun 和 uv（向量检索用）缺了会自动装。

## 登录那一步在做什么

安装程序会让你在浏览器里用**邮箱魔法链接**登录（不需要信用卡）。登录后：

- 为你的账号开通一个 memory key
- 解锁 **claude-mem observer**，带 **30 天免费试用**：记忆走 off-plan，等于让你的套餐多出一倍的用量
- 试用结束后，记忆会自动回落到你的 Anthropic 套餐，除非你订阅

登录完你还要选记忆 provider：claude-mem observer、你自己的 OpenRouter / Gemini Key，或者直接用 Anthropic 套餐。

**不想登录完全可以**：加显式的 \`--provider\`，或设 \`CLAUDE_MEM_ONLINE_OPTIN=false\`，或在 CI / 非交互 shell 里跑——安装会全程不问账号。

\`\`\`bash
npx claude-mem install --provider host   # 用本机 provider
\`\`\`

## 三层检索：先筛后取

这是它省 token 的关键，也是最容易用反的地方：

\`\`\`text
search(query="authentication bug", type="bugfix", limit=10)   # 索引，每条 50~100 token
timeline(...)                                                   # 看某个观察前后发生了什么
get_observations(ids=[123, 456])                                # 只对筛出来的 ID 取全文
\`\`\`

**顺序不能反。** 直接 \`get_observations\` 拉全文，每条 500~1000 token，几十条就把上下文吃光了。

官方给的省法是：先 \`search\` 拿到带 ID 的索引，挑出真正相关的 ID，**批量**传给 \`get_observations\`。这样能省约 10 倍 token。

## 配置在哪

\`~/.claude-mem/settings.json\`，首次运行自动带默认值生成。能调：AI 模型、worker 端口、数据目录、日志级别、上下文注入设置。

一个常用的开关：想在 Claude Code 与 Codex 的 SessionStart 上下文里包含**所有** harness 的观察，把它设成 true：

\`\`\`json
"CLAUDE_MEM_SESSION_START_INCLUDE_ALL_SOURCES": "true"
\`\`\`

默认是 \`"false"\`，只注入当前 harness 的观察——这样上下文更干净，代价是跨 agent 的记忆不会自动带过来。

## 隐私控制

不想进存储的内容用 \`<private>\` 标签包住：

\`\`\`text
<private>这段不要记</private>
\`\`\`

被包住的部分不写入存储。涉及密钥、客户数据时养成这个习惯。

## 它到底记了什么

核心是 5 个生命周期 hook：SessionStart、UserPromptSubmit、PostToolUse、Stop、SessionEnd（6 个 hook 脚本），加上一个预执行脚本做依赖检查。

worker 启动时会打印一个 URL，那是实时的 memory stream web viewer，可以直接在浏览器里看它记了什么、也支持搜索。观察都带 ID，可以在 worker API 或 viewer 里引用。

存储是本地 SQLite（FTS5）+ Chroma 向量库做混合检索，另有可选的 Cloud Sync 往 cmem.ai 备份（worker 写入时同步，不需要常驻守护进程）。
`,
      resources: [
        {
          kind: "html",
          title: "安装指南",
          url: "https://docs.claude-mem.ai/installation",
          note: "各 agent 的安装命令与 --provider 等参数。装之前确认你用的是哪条路径。",
        },
        {
          kind: "html",
          title: "检索工具用法",
          url: "https://docs.claude-mem.ai/usage/search-tools",
          note: "search / timeline / get_observations 三层工作流与示例。想省 token 就看这一页，别直接拉全文。",
        },
        {
          kind: "html",
          title: "配置参考",
          url: "https://docs.claude-mem.ai/configuration",
          note: "settings.json 的全部环境变量与上下文注入开关。要调注入范围时对着改。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "deep-live-cam",
    linksCheckedAt: "2026-10-14",
    name: "Deep-Live-Cam",
    nameZh: "Deep-Live-Cam 实时换脸",
    aliases: ["deep live cam", "deep-live-cam", "DLC", "实时换脸", "face swap"],
    summary: "一张图即可做实时换脸与视频 deepfake，支持嘴部遮罩与多人换脸，GPU 下可实时。仅适合自己出镜或已取得肖像授权的内容创作；拿他人面孔做冒充或欺诈，既违规也可能违法。",
    scenes: ["photo", "tools"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["换脸", "实时视频", "计算机视觉", "开源"],
    body: "Deep-Live-Cam 是实时换脸与一键视频 deepfake 工具：选一张脸、选摄像头、点 live 就出画面，嘴部可保留原嘴形（Mouth Mask），也能同时对多人换不同脸（Face Mapping）。视频 / 图片模式是选源脸与目标素材，点 Start，输出落在以目标视频命名的目录里。\n技术上它跑 onnxruntime，按硬件切执行后端：`--execution-provider cuda`（NVIDIA，要 CUDA 12.8.0 + cuDNN 8.9.7 + onnxruntime-gpu 1.26.0）、`coreml`（Apple Silicon M1~M5）、`dml`（Windows DirectML）、`openvino`（Intel，注意 onnxruntime-openvino 与 openvino 版本要一一对齐）、以及默认 `cpu`。模型要手动下载 `gfpgan-1024.onnx` 和 `inswapper_128_fp16.onnx` 放进 models 目录，首次运行还会再下约 300MB。\n**它的合规边界必须先说清楚。** README 顶部就是免责声明：用真人面孔必须取得本人同意，分享时要明确标注是 deepfake；软件内置检查会拒绝处理不当内容（裸露、血腥、战争影像等敏感素材）；项目方保留在法律要求时关停或加水印的权利。Ars Technica、TrendMicro 等报道也都把实时换脸带来的身份欺诈风险列为首要担忧。合理用途是影视配音配像、虚拟角色演出、自制梗图与获得授权的创作；**把它用于在视频通话或直播中冒充他人、绕过身份验证，属于滥用且可能违法**。\n上手成本不低：README 明说手动安装需要技术能力、不适合新手，嫌麻烦可以走官方的预构建版本。",
    officialUrl: "https://deeplivecam.net",
    officialLabel: "deeplivecam.net",
    links: {
      official: "https://deeplivecam.net",
      github: "https://github.com/hacksider/Deep-Live-Cam",
    },
    whoFor: "做影视 / 动画 / 虚拟角色内容的创作者：给自己或已授权的形象做实时演出、给外语片配口型、做自制梗图与短片。",
    whoNot: "想在视频通话、直播或任何身份验证场景中冒充他人的人——这是滥用且可能违法；也不适合没有命令行与 Python 环境经验的新手，手动安装门槛不低。",
    installTips: [
      "手动安装需要 Python 3.11–3.14（推荐 3.14）、pip、git、ffmpeg，Windows 还要 Visual Studio 2022 运行库；README 明说这套流程不适合新手。",
      "必须手动下载 `gfpgan-1024.onnx` 和 `inswapper_128_fp16.onnx` 放进 `models/` 目录，否则启动就报模型加载错误；首次运行还会额外下载约 300MB 模型。",
      "强烈建议用 venv 隔离：`python -m venv venv` 后 `pip install -r requirements.txt`；macOS 还要 `brew install python-tk@3.14`，否则 GUI 起不来。",
      "换 GPU 后端要换对应的 onnxruntime 包：CUDA 用 `onnxruntime-gpu==1.26.0` 配 `--execution-provider cuda`，Apple Silicon 用 `--execution-provider coreml`，Windows 用 `dml`，Intel 可用 `openvino`。",
    ],
    alternatives: [],
    icon: {
      letter: "D",
      color: "#8B1E2D",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：合规与授权这条前置、模型文件为什么必须手动放、四种 GPU 后端怎么选、以及实时画面出不来时先查什么。",
      markdown: `## 先过合规这一关

这一节不是免责套话，是实际能不能用的前提。README 顶部的声明写得很具体：

- **用真人面孔必须取得本人同意**
- **分享时必须明确标注是 deepfake**
- 软件内置检查会拒绝处理不当内容（裸露、血腥、战争影像等敏感素材）
- 项目方保留在法律要求时关停项目或给输出加水印的权利

合理用途：影视与动画的配音配像、虚拟角色演出、自制梗图、已获授权的形象创作。

**不在合理用途范围内的**：在视频通话、直播或任何需要身份验证的场景里冒充他人。主流媒体对这类工具的报道，关注点几乎都集中在身份欺诈与 eKYC 风险上。这属于滥用，且可能违法。

另外下载只认两个来源：官方站点 deeplivecam.net 和本 GitHub 仓库，别处来的构建不要装。

## 模型文件要手动放

这是启动失败最常见的原因。两个 onnx 模型必须自己下载并放进 \`models/\` 目录：

\`\`\`text
models/
├── gfpgan-1024.onnx
└── inswapper_128_fp16.onnx
\`\`\`

两个都在 Hugging Face 的 \`hacksider/deep-live-cam\` 仓库里。放错位置或未下载，启动时报的就是模型加载错误。

首次运行还会额外下载约 300MB 模型，这一步要等。

## 隔离环境，别装进系统 Python

\`\`\`bash
python -m venv venv
source venv/bin/activate      # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
\`\`\`

Python 版本：**3.11 是最低要求**（onnxruntime 已不支持 3.10），**3.14 是推荐版本**。macOS 上还必须有 tkinter，否则 GUI 起不来：

\`\`\`bash
brew install python@3.14
brew install python-tk@3.14
python3.14 -m venv venv
\`\`\`

装崩了就整个 venv 删掉重来（\`rm -rf venv\`），比逐个修包快。

## GPU 后端：换后端要换包

默认 \`python run.py\` 走 CPU，能跑但慢。要实时必须换后端，**每个后端对应不同的 onnxruntime 包**：

| 硬件 | 安装 | 运行 |
| --- | --- | --- |
| NVIDIA | CUDA 12.8.0 + cuDNN 8.9.7，\`pip install onnxruntime-gpu==1.26.0\` | \`python run.py --execution-provider cuda\` |
| Apple Silicon M1~M5 | 无需额外装，官方 onnxruntime 已带 CoreML | \`python3.14 run.py --execution-provider coreml\` |
| Windows（DirectML） | \`pip install onnxruntime-directml==1.21.0\` | \`python run.py --execution-provider dml\` |
| Intel（OpenVINO） | \`pip install onnxruntime-openvino==1.21.0\` | \`python run.py --execution-provider openvino\` |

两个易错点：

1. **Apple Silicon 上如果装过 \`onnxruntime-silicon\` 这个已停维护的 fork，必须先卸载**——它会遮蔽真正的包。
2. **OpenVINO 版本必须一一对齐**：1.24.1 配 OpenVINO 2025.4.1、1.23.0 配 2025.3、1.22.0 配 2025.1。高于 1.21.0 的 onnxruntime-openvino 必须同时装对应版本的 openvino。

NVIDIA 那条路还要注意 cuDNN 的 bin 目录要在系统 PATH 里。

## 实时画面出不来，先查这三样

Webcam 模式的流程是：\`python run.py\` → 选源脸 → 点 Live → **等 10~30 秒**预览出现。

很多人在第 4 步以为卡死了。等不到画面时按顺序查：

1. 模型是不是真的在 \`models/\` 里
2. 执行后端是不是匹配你的硬件（CPU 下会很慢，但应该会出画面）
3. macOS 上是不是用了 \`python\` 而不是 \`python3.14\`（多版本共存时这是高频原因）

想推流用 OBS 之类的采集工具抓这个窗口；换脸就换源图。

## 命令行参数（标注为未维护）

README 把 CLI 参数一节标了 Unmaintained，但常用的还在：\`--mouth-mask\` 保留原嘴形、\`--many-faces\` 处理每一张脸、\`--map-faces\` 多脸映射、\`--keep-fps\` / \`--keep-audio\` 保留帧率与原音、\`--max-memory\` 限制内存。

注意：**用了 \`-s/--source\` 参数就会进入 CLI 模式**，不再弹 GUI。
`,
      resources: [
        {
          kind: "html",
          title: "官方站点与快速开始",
          url: "https://deeplivecam.net/index.php/quickstart",
          note: "预构建版本的下载入口，以及免责声明与使用条款。不想手动装依赖就走这一页，同时确认合规要求。",
        },
        {
          kind: "html",
          title: "模型下载（Hugging Face）",
          url: "https://huggingface.co/hacksider/deep-live-cam/tree/main",
          note: "gfpgan-1024.onnx 与 inswapper_128_fp16.onnx 的下载地址。手动安装必须先把这两个放进 models 目录。",
        },
        {
          kind: "html",
          title: "Ars Technica 的报道",
          url: "https://arstechnica.com/information-technology/2024/08/new-ai-tool-enables-real-time-face-swapping-on-webcams-raising-fraud-concerns/",
          note: "主流媒体对实时换脸带来的身份欺诈风险的讨论。评估要不要引入这类工具前，值得读一遍这个视角。",
        },
      ],
    },
    license: "AGPL-3.0",
  },
  {
    slug: "taste-skill",
    linksCheckedAt: "2026-10-14",
    name: "Taste Skill",
    nameZh: "Taste Skill 前端审美技能",
    aliases: ["taste skill", "tasteskill", "design-taste-frontend", "反 AI 味", "前端设计"],
    summary: "一组可移植的 Agent Skills，专治 AI 生成界面的「AI 味」：布局、字体、动效、间距都有明确禁令。适合让代理直接产出像样前端的人；代价是 v2 需要 Node 22+ 和本机 Chrome，没有浏览器就没有自动检查。",
    scenes: ["design", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["前端设计", "Agent Skills", "UI", "开源"],
    body: "Taste Skill 是一组可移植的 Agent Skills，装在编码代理身上，目的是治掉 AI 生成界面那股模板味。默认的 `design-taste-frontend` 已经是 v2：它先让代理盘点「只有客户端才有的东西」，再从一个研究过的方向库里发三个方向供你选（20 个方向、48 个 hero、172 种版块布局、44 套字体系统、56 组配色），最后用一个真实浏览器检查器按规则判页面不合格。\n最有意思的是那份禁令清单，它把「AI 味」拆成了可判定的项：眉批式小标签（eyebrows）、等宽小字标签、01/02/03 编号、发丝线、渐变、静止阴影、奶油配色土、紫色、超过两行的标题、空屏、被遮挡的文字。判完之后还有一轮看着自己的截图修的循环。\n除了这个默认技能，还有一堆各有专长的：`image-to-code`（先出图再分析再实现）、`redesign-existing-projects`（先审计再改老项目）、`high-end-visual-design`（克制高级感）、`minimalist-ui`、`industrial-brutalist-ui`、`full-output-enforcement`（治代理输出半成品）、`gpt-taste`（给 GPT/Codex 的更严版本），以及三个只出图不出代码的 imagegen 技能。\n代价与坑：v2 的检查器需要 **Node 22+ 和本机已装的 Chrome / Edge / Chromium**（它自己不装任何东西），没有浏览器就只剩方向建议，拿不到自动检查；旧的单文件版本才带 DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY 三个旋钮，v2 没有旋钮，方向来自抽签参数、约束来自检查器，别按旧文档给 v2 调参。",
    officialUrl: "https://tasteskill.dev",
    officialLabel: "tasteskill.dev",
    links: {
      official: "https://tasteskill.dev",
      github: "https://github.com/Leonxlnx/taste-skill",
    },
    whoFor: "让编码代理直接产出前端页面、但受够了千篇一律模板感的人；以及想在实现前先拿到有审美的参考图的团队。",
    whoNot: "只有纯后端需求的人；也不适合机器上没有 Chrome / Edge / Chromium 又不想装的人——v2 的检查器跑不起来，只剩一半能力。",
    installTips: [
      "`npx skills add https://github.com/Leonxlnx/taste-skill` 一次装全部；只装默认那个用 `--skill \"design-taste-frontend\"`（这是 SKILL frontmatter 里的 name，不是目录名）。",
      "只用 Claude Code 可以装成插件：`/plugin marketplace add Leonxlnx/taste-skill` + `/plugin install taste-skill@taste-skill`，所有技能都挂在 `taste-skill:` 命名空间下，不会和你已有的技能撞名。",
      "v2 的检查器要求本机有 Chrome / Edge / Chromium 且 Node 22+，它自身不安装任何东西；没有浏览器就只能拿到方向建议。",
      "出图不出代码用 `imagegen-frontend-web` / `imagegen-frontend-mobile` / `brandkit`；要先审计再改老项目用 `redesign-existing-projects`；代理老输出半成品就加 `full-output-enforcement`。",
    ],
    alternatives: [],
    icon: {
      letter: "T",
      color: "#DB2777",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：安装名和目录名的区别、v2 为什么需要 Chrome、那份「AI 味禁律」具体禁了什么、以及其余十几个技能该挑哪个。",
      markdown: `## 安装名不是目录名

这是第一个坑。\`npx skills add\` 的 \`--skill\` 参数吃的是 **SKILL frontmatter 里的 \`name:\` 字段**，不是文件夹名：

\`\`\`bash
# 装全部
npx skills add https://github.com/Leonxlnx/taste-skill

# 只装默认那个
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
\`\`\`

默认技能是一个**文件夹**（指令 + 库 + 脚本），必须整体安装，不能只拷 SKILL.md。其余单文件技能可以拷进项目或直接贴进 ChatGPT / Codex 对话。

Claude Code 用户还有一条更省事的路——装成插件：

\`\`\`text
/plugin marketplace add Leonxlnx/taste-skill
/plugin install taste-skill@taste-skill
\`\`\`

所有技能都会挂在 \`taste-skill:\` 命名空间下，例如 \`/taste-skill:imagegen-frontend-web\`，不会和你已有的同名技能冲突。之后用 \`/plugin update\` 升级。

## v2 需要 Chrome，这条是硬要求

v2 的两条腿是：

1. **抽签发方向**：\`--tone\`、\`--have\`、\`--keep\` 决定发到什么方向
2. **真实浏览器检查器**：按规则判页面不合格，并在自己的截图上做 look-and-fix 循环

第二条要 **Node 22+ 加一个已安装的 Chrome / Edge / Chromium**。它**不安装任何东西**，只调用你机器上现有的浏览器。

没有浏览器的话，抽签和方向库照常可用，但**自动检查这一半就没了**——你得到的只是建议，不会有人判你的页面不合格。

## 它禁的是什么

这份清单是它最实用的部分，值得原样记住：

\`\`\`text
eyebrows（眉批式小标签）· 等宽小字标签 · 01/02/03 编号
发丝线 · 渐变 · 静止阴影 · 奶油配色土
紫色 · 标题超过两行 · 空屏 · 文字被遮挡
\`\`\`

每一条都有明确判定，检查器会对着截图逐项判。所以它不是「让 AI 更有品味」这种空话，而是把「AI 味」拆成了可执行的规则。

## 十几个技能，挑哪个

按交付物分两类：**实现技能**出代码，**出图技能**只出参考图。

| 场景 | 用哪个 |
| --- | --- |
| 通用默认 | \`design-taste-frontend\`（v2） |
| 老项目改造 | \`redesign-existing-projects\`（先审计再改） |
| 图 → 分析 → 代码 | \`image-to-code\` |
| 视觉方向已定 | \`high-end-visual-design\` / \`minimalist-ui\` / \`industrial-brutalist-ui\` |
| 代理老输出半成品 | \`full-output-enforcement\` |
| GPT / Codex 要更严 | \`gpt-taste\` |
| 只要参考图 | \`imagegen-frontend-web\` / \`imagegen-frontend-mobile\` / \`brandkit\` |

出图技能的典型流程是：用它生成参考帧 → 把图交给 Codex / Cursor / Claude Code 去实现。想一条流水线走完就用 \`image-to-code\`，并在 prompt 里写明「先出图，再分析，再写代码」。

## 旧版本的旋钮别往 v2 上套

\`DESIGN_VARIANCE\`、\`MOTION_INTENSITY\`、\`VISUAL_DENSITY\` 这三个 1–10 的旋钮属于**旧的单文件版本**（\`design-taste-frontend-v2-experimental\` 和 \`design-taste-frontend-v1\`）。

**v2 没有旋钮**：方向来自抽签，约束来自检查器。按旧文档给 v2 调参是无效的。

依赖旧版本确切行为的项目可以显式装旧版，它们的安装名各自独立，不会互相覆盖：

\`\`\`bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend-v2-experimental"
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend-v1"
\`\`\`

## 一句提醒

README 里有一条 Disclaimer：Taste Skill 没有官方代币、代币或加密项目，任何用其名义的代币都与其无关。这类高星前端项目常被蹭名，装包认准 \`Leonxlnx/taste-skill\`。
`,
      resources: [
        {
          kind: "html",
          title: "官网与变更记录",
          url: "https://www.tasteskill.dev/changelog",
          note: "v1 / v2-experimental / v2 各版本改了什么、为什么改。升级或挑版本前看这一页。",
        },
        {
          kind: "markdown",
          title: "默认技能 SKILL.md",
          url: "https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md",
          note: "v2 的完整指令、方向库与检查器规则原文。想确认它的审美取向是否适合你的项目，直接读这个。",
        },
        {
          kind: "html",
          title: "skills CLI（npx skills）",
          url: "https://github.com/vercel-labs/agent-skills",
          note: "安装命令 npx skills add 来自这个项目。想搞清楚技能被装到哪个目录、怎么卸载，看这里。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "vllm",
    linksCheckedAt: "2026-10-14",
    name: "vLLM",
    nameZh: "vLLM 推理服务引擎",
    aliases: ["vllm", "vllm project", "大模型推理", "PagedAttention", "推理引擎"],
    summary: "高吞吐的大模型推理与服务引擎：PagedAttention 管显存、连续批处理提吞吐、量化覆盖广，自带 OpenAI 兼容接口。适合要并发服务的生产部署；个人只想本地聊天的话它太重。",
    scenes: ["code", "engineering"],
    platforms: ["linux", "macos"],
    source: "opensource",
    tags: ["推理引擎", "LLM 服务", "GPU", "开源"],
    body: "vLLM 解决的是「把模型服务好」而不是「把模型跑起来」。核心是 PagedAttention——像操作系统分页管理内存那样管理 attention 的 K/V 缓存，把显存碎片压下去，配合连续批处理、chunked prefill、前缀缓存，把吞吐拉满。它出自 UC Berkeley 的 Sky Computing Lab，现在是一个两千多名贡献者的社区项目。\n工程特性很全：CUDA/HIP graph 加速、量化覆盖 FP8 / MXFP8 / MXFP4 / NVFP4 / INT8 / INT4 / GPTQ / AWQ / GGUF / compressed-tensors / ModelOpt / TorchAO、注意力内核有 FlashAttention / FlashInfer / TRTLLM-GEN / FlashMLA / Triton、投机解码支持 n-gram / suffix / EAGLE / DFlash，还有 prefill 与 decode 分离部署。对外是 OpenAI 兼容 API，另有 Anthropic Messages API 和 gRPC。\n硬件上主线支持 NVIDIA / AMD / Intel GPU 和 x86 / ARM / PowerPC CPU，Google TPU、Intel Gaudi、IBM Spyre、华为昇腾、Apple Silicon 等属于插件支持。200+ 种 Hugging Face 架构可用（含 MoE、混合注意力与状态空间模型、多模态、嵌入与重排模型）。\n代价要说清楚：这是为 GPU 服务器设计的生产组件。装它要 `uv pip install vllm` 加 `vllm download-kernels`（拉预编译内核加快启动），跑起来要调显存占用、并行策略、量化方案，运维复杂度远高于本地聊天工具。**Windows 不在它的支持列表里**，个人想在本机跑模型请用 Ollama 一类工具。",
    officialUrl: "https://vllm.ai",
    officialLabel: "vllm.ai",
    links: {
      official: "https://vllm.ai",
      github: "https://github.com/vllm-project/vllm",
    },
    whoFor: "要在 GPU 服务器上给多个用户或高并发请求提供模型服务，并且需要榨干单卡吞吐的工程团队。",
    whoNot: "个人想在本机跑个模型聊天的用户——太重，用 Ollama 更合适；也不适合 Windows 环境，它不在支持列表里，需要走 WSL 或远程 Linux 机器。",
    installTips: [
      "官方推荐用 uv：`uv pip install vllm`，再跑一次 `vllm download-kernels` 拉预编译内核，能明显加快启动。",
      "主线支持 NVIDIA / AMD / Intel GPU 与 x86 / ARM / PowerPC CPU；TPU、Gaudi、昇腾、Apple Silicon 属于插件支持，别按主线的安装步骤套。",
      "服务起来就是 OpenAI 兼容接口（另有 Anthropic Messages API 与 gRPC），现有按 OpenAI 写的代码改 base_url 即可接入。",
      "要开发或改内核就走 build-wheel-from-source 从源码构建，别在 pip 安装的包上改。",
    ],
    alternatives: [],
    icon: {
      letter: "V",
      color: "#0891B2",
    },
    guide: {
      intro: "按第一次部署会卡在哪讲：安装为什么有第二步、它快在哪里、量化与并行怎么选、以及什么情况下你不该上它。",
      markdown: `## 安装有两步

\`\`\`bash
uv pip install vllm
vllm download-kernels     # 预编译内核，为了启动更快
\`\`\`

第二步很容易被跳过。不做也能跑，但每次启动要现场编译内核，冷启动时间会明显变长。

要改内核或做开发，走官方的 build-wheel-from-source，别在 pip 装出来的包上直接改文件。

## 它为什么快

三层原因，理解了这个才知道该调什么：

1. **PagedAttention**：把 attention 的 K/V 缓存像操作系统分页那样管理，解决显存碎片。这是它的成名作，论文见 arXiv:2309.06180。
2. **连续批处理 + chunked prefill + 前缀缓存**：请求不等齐再跑，长的 prefill 切开做，相同前缀复用。
3. **图与内核**：piecewise / full CUDA-HIP graph、FlashAttention / FlashInfer / TRTLLM-GEN / FlashMLA / Triton 等优化内核，以及 torch.compile 的自动内核生成与图层变换。

还有投机解码（n-gram / suffix / EAGLE / DFlash）和 prefill / decode / encode 分离部署，用来进一步压延迟。

## 量化怎么选

选项很多：FP8、MXFP8/MXFP4、NVFP4、INT8、INT4、GPTQ、AWQ、GGUF、compressed-tensors、ModelOpt、TorchAO。

判断顺序是：**先看你的卡支持哪种精度**（NVFP4 这类要新架构），**再看你的质量容忍度**，最后才是吞吐。不要一上来就压到 INT4——省下来的显存往往抵不过掉的质量。

## 并行与部署形态

支持张量、流水线、数据、专家、上下文五种并行。粗粒度规则：

- 单卡放得下 → 不用张量并行
- 单卡放不下 → 张量并行（多卡切一层）
- 吞吐不够 → 数据并行 / 多副本
- MoE 模型 → 专家并行
- 长上下文 → 上下文并行

延迟敏感的场景再考虑 prefill 与 decode 分离，以及投机解码。

## 对外接口

起来就是 **OpenAI 兼容** API，另有 Anthropic Messages API 和 gRPC。

实用含义：现有按 OpenAI SDK 写的代码，改一下 base_url 就能接进来，业务代码不用动。这是它比自研服务层省事的地方。

多 LoRA 也支持（dense 与 MoE 层都有），一个底座服务多个微调版本时很划算。

## 硬件：主线与插件是两回事

主线支持：

- NVIDIA / AMD / Intel GPU
- x86 / ARM / PowerPC CPU

插件支持（别按主线步骤装）：Google TPU、Intel Gaudi、IBM Spyre、华为昇腾、Rebellions NPU、**Apple Silicon**、MetaX GPU 等。

**Windows 不在支持列表里。** 需要在 Windows 上开发就走 WSL 或远程 Linux 机器。

## 什么情况下别上它

vLLM 是生产组件，不是本地玩具。以下情况都不划算：

- 个人在本机跑个模型聊天：用 Ollama 一类工具，一条命令，不用管显存与并行
- 只有零星请求、没有并发压力：连续批处理带来的吞吐优势用不上，但运维成本照付
- 没有 GPU 服务器：CPU 模式能跑，但失去它最大的价值

它的收益只在「有很多并发请求、想榨干一张或多张卡」时才兑现。
`,
      resources: [
        {
          kind: "html",
          title: "安装文档",
          url: "https://docs.vllm.ai/en/latest/getting_started/installation.html",
          note: "各硬件的安装方式，含从源码构建 wheel。TPU / Gaudi / Apple Silicon 等插件看这里，别套主线步骤。",
        },
        {
          kind: "html",
          title: "支持的模型清单",
          url: "https://docs.vllm.ai/en/latest/models/supported_models.html",
          note: "200+ 种架构的支持状态。上线前确认你的模型在不在列表里、支持到什么程度。",
        },
        {
          kind: "html",
          title: "量化指南",
          url: "https://docs.vllm.ai/en/latest/features/quantization/index.html",
          note: "各量化方案的支持矩阵与硬件要求。选精度前对照着看，别一上来压到 INT4。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "ragflow",
    linksCheckedAt: "2026-10-14",
    name: "RAGFlow",
    nameZh: "RAGFlow 检索增强生成引擎",
    aliases: ["ragflow", "rag flow", "RAG 引擎", "知识库问答", "文档解析 RAG"],
    summary: "开源 RAG 引擎，强在复杂格式文档的解析与可追溯引用，答案能追到具体分块。适合要给企业文档做问答的人；代价是 Docker 起步就要 4 核 16G，且镜像暂不支持 macOS。",
    scenes: ["data", "office"],
    platforms: ["windows", "linux"],
    source: "opensource",
    tags: ["RAG", "文档解析", "知识库", "开源"],
    body: "RAGFlow 是 infiniflow 的开源 RAG 引擎，和「向量库 + 自己拼一套检索链」的差别在文档解析这一层：它用 DeepDoc 做深度文档理解，直接从 Word、PPT、Excel、PDF、扫描件、网页里抽结构化内容，分块有可选模板、结果能在界面上可视化并人工干预，答案附可追溯引用。1.0 之后又加了「知识编译」——把文档或数据集编译成 Wiki、Graph、树、PageIndex、思维导图、时间线等结构化产物，以及带 Low / Medium / High / Ultra 四档思考强度的 Agentic Retrieval。\n代价要算清楚：它是重型服务而不是一个库。Docker 部署的推荐起步配置是 4 核、16 GB 内存、50 GB 可用磁盘，还要 Docker ≥ 24.0.0 与 Compose ≥ v2.26.1；开源版 1.0 的 DeepDoc 走 CPU 推理（布局分析、OCR、表格识别），大批量解析会很慢。另外 README 自己写明 Docker 镜像目前不支持 macOS。\n第一次启动最容易卡在三处：用 Elasticsearch 时宿主机的 vm.max_map_count 要 ≥ 262144（用 Infinity 通常不必）；RAGFlow 容器本身没有定义 Compose healthcheck，得自己 curl 健康检查端点或看 docker logs；起来之后必须先到模型供应商页填 LLM、embedding 和 rerank 的模型名、服务地址与 API key，否则建了知识库也问不出东西。",
    officialUrl: "https://ragflow.io",
    officialLabel: "ragflow.io",
    links: {
      official: "https://ragflow.io",
      github: "https://github.com/infiniflow/ragflow",
    },
    whoFor: "要给企业或团队的文档（合同、手册、财报、工单）做可引用问答的人，尤其是格式复杂、扫描件多、需要人工核对分块的场景。",
    whoNot: "只想给几十个 Markdown 文件做个简单问答的人——这一整套服务与资源开销不划算；以及 macOS 用户，Docker 镜像目前没有官方支持。",
    installTips: [
      "克隆后 `cd ragflow/docker`，切到发布标签（README 示例 `git checkout v1.0.0-rc1`）再 `docker compose -f docker-compose.yml up -d`；要求 Docker ≥ 24.0.0、Docker Compose ≥ v2.26.1。",
      "起步配置按 README 是 4 核 CPU、16 GB 内存、50 GB 可用磁盘；用 Elasticsearch 时先 `sudo sysctl -w vm.max_map_count=262144`，要永久生效得写进 /etc/sysctl.conf。",
      "启动后先 `curl -f http://localhost/api/v1/system/healthz`，返回 200 再开网页；默认 HTTP 端口是 80，浏览器直接输机器 IP，不必带端口号。",
      "登录后第一件事是在模型供应商页添加 LLM、embedding 和 rerank（模型名、服务地址、API key）；从源码启动则要 Go 1.27、Clang 20、LLD 20、CMake ≥ 4.0 与 PCRE2 开发文件。",
    ],
    alternatives: [],
    icon: {
      letter: "R",
      color: "#2B6CB0",
    },
    guide: {
      intro: "按第一次部署会卡在哪讲：资源与版本前提、Elasticsearch 那个内核参数、容器没有 healthcheck 时怎么判断就绪、以及起来之后必须补的模型配置。",
      markdown: `## 先确认机器够不够

README 给的推荐起步配置是 **4 核 CPU、16 GB 内存、50 GB 可用磁盘**，实际需求随文档引擎、数据量、解析任务和并发上升，再加本地模型还要另算。软件版本也有硬要求：

- Docker ≥ 24.0.0
- Docker Compose ≥ v2.26.1

## 起服务

\`\`\`bash
git clone https://github.com/infiniflow/ragflow.git
cd ragflow/docker
git checkout v1.0.0-rc1
docker compose -f docker-compose.yml up -d
\`\`\`

用 Elasticsearch 作为文档引擎时，宿主机要先调内核参数，否则容器起不来：

\`\`\`bash
sysctl vm.max_map_count                  # 先看当前值
sudo sysctl -w vm.max_map_count=262144   # 低于 262144 才需要
\`\`\`

这个改动重启即失效，要长期生效就把 \`vm.max_map_count=262144\` 写进 \`/etc/sysctl.conf\`。**用 Infinity 的话这一步通常不需要。**

## 怎么判断「起来了」

坑在这里：**RAGFlow 容器本身没有定义 Compose healthcheck**。依赖服务全部 \`healthy\`、RAGFlow 容器还在 running，不代表能用了：

\`\`\`bash
curl -f http://localhost/api/v1/system/healthz
\`\`\`

拿到 HTTP 200 再打开浏览器。改过 \`SVR_WEB_HTTP_PORT\` 就把端口一起换掉。起不来就看日志：

\`\`\`bash
docker logs --tail 50 ragflow-cpu
\`\`\`

## 起完之后还有一步

登录 UI 之后**必须先到模型供应商页添加 LLM、embedding 和 rerank**，填模型名、服务地址和 API key。这一步不做，知识库建好了也没法问答——这是新手以为「装坏了」的第一大原因。

## macOS 用户注意

README 的 Docker 配置页明确标注 **macOS 目前不在支持列表**。别在这上面耗时间，用 Linux 服务器或虚拟机。

## 什么时候该考虑从源码启动

从源码跑是为了开发和调试，而不是为了用：需要 \`go.mod\` 里指定的 Go 版本（当前 Go 1.27）、Clang 20、LLD 20、CMake ≥ 4.0 与 PCRE2 开发文件，还要先跑 \`uv run tools/scripts/download_dev_deps.py\` 拉 pdfium、onnxruntime 与 DeepDoc 权重，再用 \`./build.sh --all\`，最后分四个终端启动 admin、ingestor、syncer、api 四个服务。
`,
      resources: [
        {
          kind: "html",
          title: "官方文档（Quickstart / 配置 / FAQ）",
          url: "https://ragflow.io/docs/dev/",
          note: "部署、配置、版本说明与常见问题都在这一处。第一次装先看 Quickstart 与 FAQ 两节，能省掉大半排查时间。",
        },
        {
          kind: "html",
          title: "Docker 配置说明",
          url: "https://github.com/infiniflow/ragflow/blob/main/docker/README.md",
          note: "镜像、端口、密码、文档引擎与平台支持（含 macOS 不支持这条）都写在这里。要改默认配置前必读。",
        },
        {
          kind: "html",
          title: "发布记录",
          url: "https://ragflow.io/docs/dev/release_notes",
          note: "查当前稳定版本号与 breaking change。README 的部署示例钉在具体 tag，跟 main 分支容易踩到未发布改动。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "paddleocr",
    linksCheckedAt: "2026-10-14",
    name: "PaddleOCR",
    nameZh: "PaddleOCR 文档解析 OCR 工具包",
    aliases: ["paddleocr", "paddle ocr", "PP-OCR", "OCR 识别", "文档解析"],
    summary: "百度飞桨的 OCR 与文档解析工具包，能把 PDF/图片转成 Markdown 或 JSON 给 LLM 用，100+ 语种。适合中文扫描件与表格公式多的场景；代价是模型与依赖不轻，轻量的只需 PP-OCRv6 tiny 档。",
    scenes: ["data", "docs"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["OCR", "文档解析", "PDF 转 Markdown", "开源"],
    body: "PaddleOCR 现在不只是「识别文字」，而是一套文档 AI：一条线是 PP-OCRv6 做通用文字识别（单模型覆盖中英日等 50 种语言，tiny / small / medium 三档分别 1.5M、7.7M、34.5M 参数，对应端侧、移动端和服务器），另一条线是文档解析——PaddleOCR-VL-1.6（0.9B）直接输出 Markdown / JSON，PP-StructureV3 则额外给出表格单元格、文字的坐标信息。后者适合要把版面位置一起交给下游的场景，前者适合只要内容的场景。\n选它而不是通用多模态大模型的理由通常是中文与复杂版面：官方给的 OmniDocBench v1.6 准确率 96.3%，在文本、公式、表格三项领先，古文、生僻字、印章、图表也做了专门增强。它已经接进 Dify、RAGFlow、Cherry Studio，做 RAG 的知识入库层很省事。\n代价有两个。一是别指望一条管线打天下：想要坐标就用 PP-StructureV3，想要高吞吐解析就上 HPD-Parsing（分层并行解码 + P-MTP，公开基准峰值 4752 tokens/s，支持 OpenAI 兼容 serving 与定制 vLLM 本地推理）。二是部署环境：官方支持 NVIDIA GPU、Intel CPU、昆仑芯 XPU 等多种后端，但具体后端与版本对应关系要查文档，Windows 上新版显卡（如 RTX 50 系）有单独的说明页。",
    officialUrl: "https://www.paddleocr.com",
    officialLabel: "www.paddleocr.com",
    links: {
      official: "https://www.paddleocr.com",
      github: "https://github.com/PaddlePaddle/PaddleOCR",
    },
    whoFor: "要给中文 PDF、扫描件、票据、表格做结构化入库的人：RAG 的知识解析层、批量档案数字化、需要坐标信息的版面还原。",
    whoNot: "只偶尔识别几张截图的人——不如直接用现成的在线 OCR 或浏览器端 SDK；也不适合没有 Python 环境又不想碰模型权重下载的轻量需求。",
    installTips: [
      "3.5.0 起官方提供 `PaddleOCR.js` 浏览器推理 SDK，可以直接在浏览器里跑 PP-OCRv5；不想装 Python 和模型权重时先试这条。",
      "核心依赖与可选依赖已经分离：只做文字识别装最小核心依赖即可，文档解析与信息抽取的额外依赖按需再装。",
      "高吞吐解析走 HPD-Parsing：支持 OpenAI 兼容 serving，也可以通过定制 vLLM runtime 本地推理，环境与服务化步骤看官方 HPD-Parsing 教程。",
      "选模型先定档位：PP-OCRv6 有 tiny(1.5M) / small(7.7M) / medium(34.5M) 三档，端侧、移动端、服务器各取所需，别一上来就上最大的。",
    ],
    alternatives: [],
    icon: {
      letter: "P",
      color: "#1E6FD9",
    },
    guide: {
      intro: "按第一次选型会卡在哪讲：文字识别和文档解析是两条不同的管线、模型档位怎么选、要不要坐标、以及不想装环境时的浏览器方案。",
      markdown: `## 先分清两条管线

这是最容易走错的一步。PaddleOCR 里「识别文字」和「解析文档」不是同一件事：

| 你要什么 | 用哪个 |
| --- | --- |
| 图片 / 自然场景里的文字 | **PP-OCRv6**（单模型覆盖中英日等 50 种语言） |
| 文档转 Markdown / JSON，只要内容 | **PaddleOCR-VL-1.6**（0.9B） |
| 文档转结构化，还要表格单元格与文字坐标 | **PP-StructureV3** |
| 高吞吐批量解析 | **HPD-Parsing**（峰值 4752 tokens/s） |

README 特别点了一句：**PP-StructureV3 相比 PaddleOCR-VL 系列多了细粒度坐标信息**（表格单元格坐标、文字坐标）。要做版面还原或让下游定位到原文位置，就必须选它，光靠 VL 模型拿不到。

## 档位按部署位置选

PP-OCRv6 分三档，不是越大越好：

- \`tiny\` 1.5M —— 端侧
- \`small\` 7.7M —— 移动端
- \`medium\` 34.5M —— 服务器

官方给的加速数据：CPU 端到端 5.2×（OpenVINO）、Apple M4 上 6.1×（tiny）、A100 上 0.13s。嵌入式和笔记本上硬上 medium 只会白等。

## 不想装环境怎么办

3.5.0 起有官方浏览器推理 SDK：

\`\`\`js
// PaddleOCR.js —— 官方浏览器推理 SDK，支持直接跑 PP-OCRv5
\`\`\`

适合一次性识别、内部小工具、或者不想在机器上放模型权重的场景。真正批量处理还是回到 Python。

## 依赖别一次装全

3.2.0 之后**核心依赖与可选依赖已经分离**：基础文字识别只需要最小核心依赖，文档解析、信息抽取的额外依赖按需安装。一次性装 all 会拉进来一堆用不到的包，升级时也更容易冲突。

## 接 RAG 的话

它已经深度集成进 Dify、RAGFlow、Pathway、Cherry Studio。做 RAG 时通常不需要自己写解析脚本，直接在那些平台里选 PaddleOCR 作为解析后端即可；解析结果还能导出 DOCX（PaddleOCR-VL 系列、PP-StructureV3、PP-DocTranslation 都支持），方便人工校对。

## 硬件后端

官方列了 NVIDIA GPU、Intel CPU、昆仑芯 XPU 和多种 AI 加速器。Windows 上的新显卡（例如 RTX 50 系）有单独的安装说明页，别照着通用教程装。
`,
      resources: [
        {
          kind: "html",
          title: "官方文档站",
          url: "https://www.paddleocr.ai/latest/en/version3.x/pipeline_usage/HPD-Parsing.html",
          note: "HPD-Parsing 的环境准备、serving 与本地推理步骤。要做高吞吐解析照这一页配。",
        },
        {
          kind: "html",
          title: "GitHub 仓库与版本记录",
          url: "https://github.com/PaddlePaddle/PaddleOCR",
          note: "各版本的模型变更、安装与部署说明入口。选管线和档位前先看对应版本的 release note。",
        },
        {
          kind: "html",
          title: "PaddleOCR-VL-1.6 模型页",
          url: "https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.6",
          note: "文档解析主模型的权重与说明。要本地离线部署时从这里取权重。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "openhands",
    linksCheckedAt: "2026-10-14",
    name: "OpenHands",
    nameZh: "OpenHands Agent Canvas 代理控制台",
    aliases: ["openhands", "agent canvas", "OpenHands Agent Canvas", "编码代理平台", "自托管代理"],
    summary: "把编码代理变成自托管的控制台：一个界面切换本地 / Docker / 云后端，也能挂 Claude Code、Codex 等第三方代理。适合要让代理常驻并接 Slack、GitHub 自动化的人；代价是无沙箱模式等于把整机文件系统交给它。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["编码代理", "自托管", "自动化", "开源"],
    body: "Agent Canvas 是 OpenHands 现在的前端形态：一个自托管的开发者控制台，默认跑开源的 OpenHands 代理，也能换成 Claude Code、Codex、Gemini CLI、Pi、OpenCode 或任何支持 ACP 的代理。它解决的是「代理只能在我开着笔记本时干活」——把后端放到服务器或云上，代理就能继续跑，还能被 Slack、GitHub、Datadog 这类第三方触发。同一个前端可以在本地、Docker、虚拟机、公司基础设施之间切换后端，团队共用一台做代码评审与依赖升级，个人代理留在自己笔记本上。\n三种跑法要分清。`npm install -g @openhands/agent-canvas` 起本地全栈，README 用警告标了：代理直接跑在你装的机器上，对文件系统有完全访问权限。Docker 沙箱版把项目目录挂进容器，代理只能看到 PROJECTS_PATH。`OH_CONVERSATION_RUNTIME=docker agent-canvas` 是每次对话一个容器，适合并发跑多个代理，容器被替换后工作区与会话状态仍在。\n第二个坑是对外暴露：本地启动只监听 127.0.0.1 并自动注入 session key；一旦加 `--host 0.0.0.0`，session key 不再注入，必须自己设强 LOCAL_BACKEND_API_KEY。Docker 镜像默认监听容器内的所有网卡，README 明确建议：要发布到局域网或公网就去掉 AGENT_CANVAS_ALLOW_LAN_SESSION_KEY，改为在界面里手填 key，并按自托管指南做加固。",
    officialUrl: "https://openhands.dev",
    officialLabel: "openhands.dev",
    links: {
      official: "https://openhands.dev",
      github: "https://github.com/OpenHands/OpenHands",
    },
    whoFor: "想让编码代理 7×24 常驻、按计划或按 webhook 触发（发报告到 Slack、拆解 GitHub issue）的团队，以及需要在一个界面里管理多个代理后端的人。",
    whoNot: "只在本地 IDE 里偶尔让代理改几行代码的人——控制台 + 后端这一层是纯额外负担；也不适合不能接受把机器文件系统交给代理、又不想维护 Docker 的人。",
    installTips: [
      "最快一条：`npm install -g @openhands/agent-canvas` 然后 `agent-canvas`，需要 Node.js 24 或更高与 `uv`；也可以 `--frontend-only` / `--backend-only` 分开起。",
      "Docker 沙箱版：`docker run -it --rm -p 127.0.0.1:8000:8000 -e AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true -v \"$HOME/.openhands:/home/openhands/.openhands\" -v \"${PROJECTS_PATH}:/projects\" ghcr.io/openhands/agent-canvas:1.27.1`，PROJECTS_PATH 要先建好。",
      "每个对话一个容器：先全局装 npm 包，再 `OH_CONVERSATION_RUNTIME=docker agent-canvas`，需要 Node.js 24+、uv，且当前用户能执行 docker 命令。",
      "npm / 源码启动的入口是 http://localhost:8000，Docker 镜像是 http://localhost:8000/canvas，别找错；Windows 命令在仓库的 README.windows.md 里。",
    ],
    alternatives: [],
    icon: {
      letter: "O",
      color: "#0F5C5C",
    },
    guide: {
      intro: "按第一次上手会卡在哪讲：三种跑法怎么选、无沙箱等于整机权限这件事、并发场景为什么要用每对话一容器、以及对外暴露时 session key 该怎么管。",
      markdown: `## 先选跑法

| 跑法 | 前提 | 特点 |
| --- | --- | --- |
| 无沙箱 \`agent-canvas\` | Node.js 24+、\`uv\` | 最快，但代理有**整机文件系统权限** |
| Docker 沙箱 | Docker、一个 PROJECTS_PATH 目录 | 代理只看到挂进去的项目目录 |
| 每对话一容器 | Node.js 24+、\`uv\`、Docker | 适合并发，容器替换后工作区与历史仍在 |

三种跑法共用同一个前端，后两种需要 Docker Desktop（macOS / Windows）或 Docker Engine（Linux）。

## 无沙箱模式 = 整机权限

README 在 Option 1 和 Option 4 前面都挂了警告：**agent-server 直接跑在你安装的机器上，代理对你的文件系统有完全访问权限**。

这不是保守措辞，是它真的会照代理的判断去读写。个人或测试环境无所谓；放在有生产凭据的机器上之前，先换成 Docker 沙箱。

## 想并发跑多个代理

\`\`\`bash
npm install -g @openhands/agent-canvas
OH_CONVERSATION_RUNTIME=docker agent-canvas
\`\`\`

每次新对话开一个新容器，各自有独立的 Agent Server 与工具。注意两点：**已有的本地对话不会被转换**；同一份宿主机工作区仍会被多个对话共享，想避免互相改文件就用不同目录或 worktree。

## 对外暴露前先管好 key

默认行为（README 写得很细）：

- npm / 源码启动只监听 \`127.0.0.1\`，并把 session key 自动注入到页面里
- 加 \`--host 0.0.0.0\` 或设 \`OH_BIND_HOST\` 后，**session key 不再注入**，界面改成手填 API key
- Docker 监听容器内所有网卡，默认不注入 key；要发布到局域网就别设 \`AGENT_CANVAS_ALLOW_LAN_SESSION_KEY\`
- 把 \`LOCAL_BACKEND_API_KEY\` 设成强值，或用 \`docker exec <container> sh -c 'cat "$STATE_DIR/api-key.txt"'\` 取生成的那个

面向公网的安装请照仓库里的自托管指南做加固。

## 前端能管多个后端

Canvas 连的是 Agent Server（一个 REST API，一台机器一个 host/port），所以它能在本地、云主机、公司服务器之间切换后端，不用为每个环境再装一套界面。定时与事件触发属于配套的 Automation Server，和 Canvas 是不同的仓库。
`,
      resources: [
        {
          kind: "html",
          title: "后端（backends）文档",
          url: "https://docs.openhands.dev/openhands/usage/agent-canvas/backends",
          note: "本地 / 远程 / 云三类后端的差异与切换方式。决定把 agent-server 放哪之前先看这页。",
        },
        {
          kind: "html",
          title: "自托管与安全加固指南",
          url: "https://github.com/OpenHands/OpenHands/blob/main/docs/SELF_HOSTING.md",
          note: "对外发布时的安全处理与 session key / API key 管理。打算让代理常驻在服务器上时必读。",
        },
        {
          kind: "html",
          title: "内置自动化与第三方集成",
          url: "https://docs.openhands.dev/openhands/usage/agent-canvas/prebuilt-automations",
          note: "Slack、GitHub、Linear、Notion 等自动化与定时 / webhook 触发方式。想知道它除了聊天还能干什么看这里。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "crawl4ai",
    linksCheckedAt: "2026-10-14",
    name: "crawl4ai",
    nameZh: "Crawl4AI 网页转 Markdown 爬虫",
    aliases: ["crawl4ai", "crawl 4 ai", "网页爬虫", "网页转 Markdown", "LLM 爬虫"],
    summary: "把任意网页抓成干净、适合喂给 LLM 的 Markdown，支持深度爬取、CSS/XPath 结构化抽取和 stealth 反爬。适合做 RAG 数据源与 Agent 联网；代价是自己跑就得自己养浏览器和代理。",
    scenes: ["data", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["爬虫", "Markdown", "RAG", "开源"],
    body: "Crawl4AI 做的是一件事：把网页变成 LLM 读得顺的 Markdown。它和 requests + 解析库手刮的差别在于自带异步浏览器池与缓存，能跑 JS、等元素、整页滚动再抓，还能出 fit_markdown——用 PruningContentFilterLXML、BM25ContentFilter 或 LLMContentFilter 去掉菜单页脚这类噪音。抽取给了三条路：不用 LLM 的 JsonCssExtractionStrategy / JsonXPathExtractionStrategy / RegexExtractionStrategy，schema 可用 generate_schema 生成；要语义就上 LLMExtractionStrategy，接任意 provider（LiteLLM 支持的都行，包括本地 ollama）。\n三条用法要分清：Python 库（免费，浏览器在你自己的 Python 进程里）、自建 Docker 服务端（免费，浏览器在容器里，每个端点都要 CRAWL4AI_API_TOKEN）、Crawl4AI Cloud（按量付费，浏览器、代理、JS 重页面和 bot wall 全由对方处理，另多出只有云端有的 /search、/serp、/answer）。取舍就一句话——**JS 重页面和反爬谁来扛**：自己跑，代理轮换、enable_stealth、undetected-browser 适配器都归你配。\n两个必踩的安装坑：`pip install -U crawl4ai` 之后必须跑一次 `crawl4ai-setup` 装浏览器，失败就手动 `python -m playwright install --with-deps chromium`；起 Docker 服务端必须设 token，否则只有容器内可访问。",
    officialUrl: "https://crawl4ai.com",
    officialLabel: "crawl4ai.com",
    links: {
      official: "https://crawl4ai.com",
      github: "https://github.com/unclecode/crawl4ai",
    },
    whoFor: "要给 RAG 或 Agent 建网页数据源的人：批量抓文档站、竞品页、新闻，需要干净的 Markdown 或结构化 JSON。",
    whoNot: "只偶尔抓一两个页面的小需求——浏览器与依赖的安装成本不划算；也不适合指望零配置就能稳定突破强反爬站点的人。",
    installTips: [
      "`pip install -U crawl4ai` 之后必须 `crawl4ai-setup` 装一次浏览器，再用 `crawl4ai-doctor` 自查；浏览器装不上就 `python -m playwright install --with-deps chromium`。",
      "起自建服务端：`export CRAWL4AI_API_TOKEN=\"$(openssl rand -hex 32)\"`，再 `docker run -d -p 11235:11235 --name crawl4ai --shm-size=1g -e CRAWL4AI_API_TOKEN=\"$CRAWL4AI_API_TOKEN\" unclecode/crawl4ai:latest`，约 10 秒后 curl /md 验证。",
      "临时抓用命令行 `crwl`：`crwl https://example.com -o markdown`；深爬 `crwl URL --deep-crawl bfs --max-pages 10`；带 LLM 提问先 `crwl config` 配 key。",
      "接编码代理：`claude mcp add --transport http crawl4ai https://api.crawl4ai.com/mcp --header \"Authorization: Bearer $CRAWL4AI_KEY\"`；自托管 Docker 同样提供 MCP 端点。",
    ],
    alternatives: [],
    icon: {
      letter: "C",
      color: "#3E7B4F",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：库 / 自建服务端 / 云三种形态怎么选、浏览器必须单独装这件事、不用 LLM 也能结构化抽取、以及深爬与自适应爬取的用法。",
      markdown: `## 三种形态，先选一个

| | Python 库 | 自建 Docker 服务端 | Crawl4AI Cloud |
| --- | --- | --- | --- |
| 谁跑浏览器 | 你的 Python 进程 | 你的 Docker | 对方 |
| JS 重页面 / 反爬 | 你自己配代理与设置 | 你自己配 | 自动处理 |
| 网页搜索 | 无 | 无 | \`/search\`、\`/serp\`、\`/answer\` |
| 费用 | 免费 | 免费（自付机器） | 按量，有免费额度 |

判断点只有一句：**JS 重页面和 bot wall 谁来扛**。自己扛就自己配代理轮换与 \`enable_stealth\`，也就要承担被封和调试的成本。

## 装完记得装浏览器

这是最常见的「装了但跑不起来」：

\`\`\`bash
pip install -U crawl4ai
crawl4ai-setup      # 安装并配置浏览器，只需一次
crawl4ai-doctor     # 自检
\`\`\`

失败就手动装：

\`\`\`bash
python -m playwright install --with-deps chromium
\`\`\`

## 第一次抓取

\`\`\`python
import asyncio
from crawl4ai import AsyncWebCrawler

async def main():
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url="https://news.ycombinator.com")
        print(result.markdown)

asyncio.run(main())
\`\`\`

想要干净正文，上 content filter：

\`\`\`python
from crawl4ai import CrawlerRunConfig, CacheMode
from crawl4ai.content_filter_strategy import PruningContentFilterLXML
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator

run_config = CrawlerRunConfig(
    cache_mode=CacheMode.BYPASS,
    markdown_generator=DefaultMarkdownGenerator(
        content_filter=PruningContentFilterLXML(threshold=0.48, threshold_type="fixed", min_word_threshold=0)
    ),
)
\`\`\`

比较 \`result.markdown.raw_markdown\` 与 \`result.markdown.fit_markdown\` 的长度，就知道滤掉了多少。

## 结构化抽取，不一定要花 LLM 的钱

列表页、商品页这种结构稳定的，用 CSS schema 更快也更省：

\`\`\`python
schema = {
    "name": "Quotes",
    "baseSelector": "div.quote",
    "fields": [
        {"name": "text", "selector": "span.text", "type": "text"},
        {"name": "author", "selector": "small.author", "type": "text"},
    ],
}
run_config = CrawlerRunConfig(
    extraction_strategy=JsonCssExtractionStrategy(schema),
    scan_full_page=True,   # 滚到底，懒加载的内容才会出现
    scroll_delay=0.5,
)
\`\`\`

懒加载页面一定要开 \`scan_full_page\`，否则只拿到首屏。需要语义字段时才用 \`LLMExtractionStrategy\`，配 \`LLMConfig(provider="openai/gpt-4o-mini", api_token=...)\` 加 Pydantic schema。

## 深爬与自适应

\`\`\`bash
crwl https://docs.crawl4ai.com --deep-crawl bfs --max-pages 10
\`\`\`

BFS / DFS / best-first 三种策略，长任务有 \`resume_state\` 断点恢复。不知道该抓多少页时用 \`AdaptiveCrawler\`，它对着你给的 query 判断「够了」就停。
`,
      resources: [
        {
          kind: "html",
          title: "官方文档",
          url: "https://docs.crawl4ai.com",
          note: "安装、CLI、Docker 与自托管、各抽取策略的完整参数。第一次用照 Installation 与 core 两节走一遍。",
        },
        {
          kind: "html",
          title: "官方示例代码",
          url: "https://github.com/unclecode/crawl4ai/tree/main/docs/examples",
          note: "可直接跑的进阶示例。想写 CSS schema 或接 LLM 抽取时，抄这里的骨架最省时间。",
        },
        {
          kind: "html",
          title: "Cloud API 文档",
          url: "https://crawl4ai.com/docs",
          note: "/scrape、/extract、/search、/serp、/answer 的接口与计费档位。决定自建还是买云服务前先看它。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "deer-flow",
    linksCheckedAt: "2026-10-14",
    name: "DeerFlow",
    nameZh: "DeerFlow 长时任务代理框架",
    aliases: ["deerflow", "deer-flow", "deer flow", "深度研究代理", "super agent harness"],
    summary: "字节开源的 super agent harness：编排子代理、记忆、沙箱与技能，接调研、编码这类要跑几分钟到几小时的任务。适合想自建长任务代理的人；代价是配置与安全都重，README 明确警告网关管理员权限等同代码执行。",
    scenes: ["code", "tools"],
    platforms: ["linux", "macos"],
    source: "opensource",
    tags: ["AI 代理", "深度研究", "LangGraph", "开源"],
    body: "DeerFlow 2.0 是一次彻底重写，和 1.x 不共用代码——原来那个 Deep Research 框架还在 `main-1.x` 分支上维护，2.0 的定位是 super agent harness：用子代理、记忆（DeerMem 做记忆抽取）、沙箱和可扩展技能去接「几分钟到几小时」的长任务，不再只是产出一份研究报告。它建在 LangGraph 上，前端有项目、文档架、定时任务、终端 TUI 这一整套，私有知识检索还能接 RAGFlow。\n上手路径是 `git clone` 后 `make setup`：一个交互向导，让你选 LLM provider、可选的联网搜索，以及沙箱模式、bash 访问、文件写工具这类执行与安全偏好，生成最小 `config.yaml` 并把 key 写进 .env，约两分钟。之后随时 `make doctor` 验环境，要提 issue 就跑 `make support-bundle`（生成可直接粘进 issue 的摘要、AI 草稿与诊断 zip，且不含 .env、原始对话和用户文件内容）。\n两个要提前知道的坑。一是**安全**：README 单独写了一节，说部署不当会引入安全风险，网关管理员权限等同代码执行，外部聊天消息的角色也当作不可信输入处理。二是**委托式抓取后端**：自托管的 Browserless、Crawl4AI、Firecrawl、fastCRW 默认会被拒绝，必须先确认出站隔离（私有网段、loopback、链路本地、云元数据）再设 `network_isolation_confirmed: true`，因为重定向、DNS 和子资源都是这些服务自己处理的；`make doctor` 会列出会被拒的配置。另外 InfoQuest 的 reader / 网页搜索 / 图片搜索用的是 30 秒 HTTP 连接与读取不活动超时，抓取的 `timeout`、`navigation_timeout` 是另一组服务端选项，别混着调。",
    // 【临时】官网 https://deerflow.tech 的 TLS 证书 2026-10-11 过期，访问直接报
    // SEC_E_CERT_EXPIRED，暂时把 official 指向仓库，免得访客点进去先撞证书警告。
    // 上游续期后要换回三处：officialUrl / officialLabel / links.official，以及
    // 教程里那条「官网与真实案例」资源。
    officialUrl: "https://github.com/bytedance/deer-flow",
    officialLabel: "github.com/bytedance/deer-flow",
    links: {
      official: "https://github.com/bytedance/deer-flow",
      github: "https://github.com/bytedance/deer-flow",
    },
    whoFor: "想自己搭一个能跑长任务（调研 + 编码 + 产出）的代理系统的人，尤其已经熟悉 LangGraph、愿意自己管配置与部署的团队。",
    whoNot: "只想一键出一份研究报告的人——1.x 那条线更轻；也不适合没有部署经验的人，README 自己把网关权限等同代码执行写进了安全警告。",
    installTips: [
      "`git clone https://github.com/bytedance/deer-flow.git && cd deer-flow && make setup`：交互向导约 2 分钟，生成最小 config.yaml 并把 key 写进 .env，之后可随时 `make doctor` 复验。",
      "让编码代理代装，直接给它一句：'Help me clone DeerFlow if needed, then bootstrap it for local development by following https://raw.githubusercontent.com/bytedance/deer-flow/main/Install.md'。",
      "自托管的 Crawl4AI / Firecrawl / Browserless / fastCRW 抓取后端默认会被拒绝，必须先做出站隔离再设 `network_isolation_confirmed: true`；`make doctor` 会报出会被拒的配置。",
      "提 issue 前跑 `make support-bundle`：输出 issue 摘要、AI 草稿与可选诊断 zip，默认不含 .env、原始对话与用户文件；zip 只在维护者要求时附。",
    ],
    alternatives: [],
    icon: {
      letter: "D",
      color: "#7A5C3E",
    },
    guide: {
      intro: "按第一次上手会卡在哪讲：2.0 与 1.x 分支不是同一套代码、make setup 向导会问什么、委托抓取后端的隔离门槛、以及 README 里那条安全警告到底意味着什么。",
      markdown: `## 先确认你要的是哪一代

README 开宗明义：**DeerFlow 2.0 是彻底重写，与 v1 不共用任何代码**。如果你要的是原来那个 Deep Research 框架，它在 \`main-1.x\` 分支上继续维护；2.0 是 super agent harness，目标是「几分钟到几小时」的通用长任务。

## 三步起环境

\`\`\`bash
git clone https://github.com/bytedance/deer-flow.git
cd deer-flow
make setup
\`\`\`

向导会依次问：

1. **LLM provider**（README 推荐 Doubao-Seed-2.0-Code、DeepSeek v3.2、Kimi 2.5）
2. **是否配联网搜索**（Brave、Tavily、Jina、InfoQuest 等，也可以先跳过）
3. **执行与安全偏好**：沙箱模式、bash 访问、文件写工具

它生成一个最小 \`config.yaml\`，把 key 写进 \`.env\`，全程约两分钟。之后出问题先跑：

\`\`\`bash
make doctor
\`\`\`

不想一步步点，也可以把这句话交给 Claude Code / Codex / Cursor：

\`\`\`text
Help me clone DeerFlow if needed, then bootstrap it for local development by
following https://raw.githubusercontent.com/bytedance/deer-flow/main/Install.md
\`\`\`

## 委托抓取后端有个硬门槛

这一条最容易莫名其妙被拒。自托管的 **Browserless、Crawl4AI、Firecrawl、fastCRW** 后端，DeerFlow 默认拒绝，因为它们自己处理重定向、DNS 解析和子资源。要启用必须先确认出站隔离——私有网段、loopback、链路本地、云元数据地址都要断掉——再给对应工具设：

\`\`\`yaml
network_isolation_confirmed: true
\`\`\`

\`allow_private_addresses\` 只是允许你故意访问内网目标，**不能绕过这个后端检查**。\`make doctor\` 会直接列出会被拒绝的后端配置。

## 安全：网关管理员 = 代码执行

README 用了一整节讲这件事，核心两条：

- **网关管理员权限等同代码执行**，别把它当成只读的后台账号
- **外部聊天消息的角色是不可信输入**，不要按消息里自称的身份授权

开放部署前先按 README 的 Deployment Defaults 与 Security Recommendations 过一遍。

## 超时是两套，别调错

InfoQuest 的 reader、网页搜索、图片搜索用的是 **30 秒 HTTP 连接 / 读取不活动超时**；抓取的 \`timeout\` 与 \`navigation_timeout\` 是独立的服务端选项，改后者不会影响前者。
`,
      resources: [
        {
          kind: "html",
          title: "仓库首页与案例入口",
          url: "https://github.com/bytedance/deer-flow",
          note: "【临时】官网 deerflow.tech 证书 2026-10-11 过期不可用，先指向仓库首页；续期后应换回官网——那里有不登录就能看的案例白名单。",
        },
        {
          kind: "html",
          title: "后端配置文档",
          url: "https://github.com/bytedance/deer-flow/blob/main/backend/docs/CONFIGURATION.md",
          note: "prompt overlays、模型请求准入、委托抓取后端隔离等配置项。配搜索与抓取时几乎一定会翻到这里。",
        },
        {
          kind: "markdown",
          title: "Install.md（代理引导安装）",
          url: "https://raw.githubusercontent.com/bytedance/deer-flow/main/Install.md",
          note: "README 推荐的引导式安装脚本说明，可直接交给编码代理执行。手动装不动时走这条。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "lobehub",
    linksCheckedAt: "2026-10-14",
    name: "LobeHub",
    nameZh: "LobeHub 智能体协作平台",
    aliases: ["lobehub", "lobe hub", "lobechat", "智能体平台", "Agent 协作"],
    summary: "自托管的智能体工作空间：把代理当员工来招、排班、汇报，有 Agent Groups、Pages、定时任务和可编辑的白盒记忆。适合要长期养一批代理的人；代价是要自备 OpenAI API key 并自己运维。",
    scenes: ["tools", "office"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["AI 代理", "自托管", "协作", "开源"],
    body: "LobeHub 现在的定位是 Chief Agent Operator：把「代理」当成工作单元，招进来、排班、汇报，你在掌控但不必一直在线。它和普通聊天客户端的差别在三处——Agent Builder 描述一次需求就自动配置好一个代理；Agent Groups 让多个代理在一个共享上下文里并行协作（Pages 一起写内容、Project 按项目组织、Workspace 按团队分权限）；Schedule 让代理在你离线时按计划执行。另外还有 Personal Memory，而且是白盒的：结构化、可编辑，它记错了你能直接改掉。\n接入面给得也很宽：统一接入任意模型与模态，一万多个技能与 MCP 兼容插件，IM Gateway 让你在已经在用的聊天工具里跟代理说话。\n代价是它不是开箱即用的 SaaS。自托管要自备 OPENAI_API_KEY 并起 Docker，README 给的 Docker 路径是 `mkdir lobehub-db && cd lobehub-db`，再 `bash <(curl -fsSL https://lobe.li/setup.sh)` 初始化基础设施，最后 `docker compose up -d`。一键部署有个真实的坑：Vercel 默认是「创建项目」而不是 fork，结果是一直提示有更新、又检测不准，官方建议改用 Auto Sync With Latest 重新部署；自己 fork 的话只保留 upstream sync 这个 action，其余关掉。另外 `OPENAI_MODEL_LIST` 是个容易被忽略的控制点：`+模型` 加、`-模型` 隐藏、`模型名=显示名` 改名，逗号分隔。",
    officialUrl: "https://lobehub.com",
    officialLabel: "lobehub.com",
    links: {
      official: "https://lobehub.com",
      github: "https://github.com/lobehub/lobehub",
    },
    whoFor: "想长期维护一批常驻代理（定时出报告、协作写内容、按项目分工）的团队，以及希望记忆可控可编辑、不想被黑盒画像牵着走的人。",
    whoNot: "只想要一个能聊天的界面的人——它整套「招人 / 排班 / 汇报」的抽象对你没用；也不适合不想管 Docker 与 API key 的人。",
    installTips: [
      "Docker 路径：`mkdir lobehub-db && cd lobehub-db`，`bash <(curl -fsSL https://lobe.li/setup.sh)` 初始化基础设施，再 `docker compose up -d`。",
      "`OPENAI_API_KEY` 是必填环境变量；走代理设 `OPENAI_PROXY_URL`，要控制可见模型用 `OPENAI_MODEL_LIST`（如 `qwen-7b-chat,+glm-6b,-gpt-3.5-turbo`）。",
      "一键部署到 Vercel / Zeabur / Sealos / 阿里云时记得填 OPENAI_API_KEY；Vercel 分配的域名在部分地区 DNS 被污染，建议绑自定义域名。",
      "fork 之后只保留 upstream sync 这个 GitHub Action，其余全部禁用；用一键部署建的项目会一直提示更新，要按官方的 Auto Sync With Latest 重来一遍。",
    ],
    alternatives: [],
    icon: {
      letter: "L",
      color: "#4C6EF5",
    },
    guide: {
      intro: "按第一次部署会卡在哪讲：Vercel 一键部署与 Docker 自托管怎么选、三个关键环境变量、Vercel 那个「一直提示更新」的坑、以及白盒记忆为什么值得先摸一遍。",
      markdown: `## 两条部署路线

| | 一键部署（Vercel / Zeabur / Sealos / 阿里云） | Docker 自托管 |
| --- | --- | --- |
| 门槛 | 登录即部署 | 自己起 Docker |
| 必填 | \`OPENAI_API_KEY\` | \`OPENAI_API_KEY\` |
| 适合 | 先跑起来看看 | 长期用、数据在自己手里 |

Docker 路径 README 写得很短：

\`\`\`bash
mkdir lobehub-db && cd lobehub-db
bash <(curl -fsSL https://lobe.li/setup.sh)   # 初始化基础设施
docker compose up -d
\`\`\`

## 三个环境变量

| 变量 | 必填 | 作用 |
| --- | --- | --- |
| \`OPENAI_API_KEY\` | 是 | 在 OpenAI 账号页申请的 key |
| \`OPENAI_PROXY_URL\` | 否 | 覆盖默认 \`https://api.openai.com/v1\` |
| \`OPENAI_MODEL_LIST\` | 否 | 控制模型列表 |

\`OPENAI_MODEL_LIST\` 的语法值得记住：

\`\`\`text
qwen-7b-chat,+glm-6b,-gpt-3.5-turbo
\`\`\`

即 \`+\` 增加、\`-\` 隐藏、\`model_name=display_name\` 改显示名，逗号分隔。默认列出的模型不合用时，改这一个变量就够了，不用动代码。

## Vercel 上「一直提示有更新」

这是 README 里点明的已知问题：Vercel 默认是**创建项目**而不是 fork，导致无法正确检测上游更新，于是反复提示。

处理办法：

1. 自己 fork 仓库后再部署
2. fork 后**只保留 upstream sync 这个 action**，其余在仓库里关掉
3. 已经用一键部署建好的项目，按官方的 Auto Sync With Latest 重来一遍

另外 Vercel 分配的域名在部分地区 DNS 被污染，绑个自定义域名能直连。

## 先摸一遍白盒记忆

LobeHub 把 Personal Memory 做成结构化、可编辑的，而不是一个你改不了的画像。建议第一次用就把记忆区打开看看，它到底记了什么、按什么结构记的——后续代理的行为几乎都由这块决定，早发现记错比事后纠正省事得多。

## 别一上来就堆代理

Agent Groups、Pages、Schedule、Workspace 是按团队协作设计的。个人先用单个 Agent Builder 生成的代理跑通一条流程，再考虑分组与定时，否则很容易变成一堆没人管的常驻任务。
`,
      resources: [
        {
          kind: "html",
          title: "官网",
          url: "https://lobehub.com",
          note: "功能总览与产品入口。想先判断「招代理 / 排班 / 汇报」这套抽象是否适合你，看官网比看仓库快。",
        },
        {
          kind: "html",
          title: "GitHub 仓库 README",
          url: "https://github.com/lobehub/lobehub",
          note: "自托管步骤、环境变量表与 fork 后的注意事项。装之前照这一页走。",
        },
        {
          kind: "html",
          title: "版本发布",
          url: "https://github.com/lobehub/lobehub/releases",
          note: "查最新版本与破坏性变更。项目处于活跃开发期，升级前先看 release note。",
        },
      ],
    },
  },
  {
    slug: "rtk",
    linksCheckedAt: "2026-10-14",
    name: "rtk",
    nameZh: "rtk 命令行输出压缩代理",
    aliases: ["rtk", "rtk-ai", "CLI proxy", "上下文省流", "token 压缩"],
    summary: "单个 Rust 二进制：在 shell 输出进入 LLM 上下文之前压缩它，覆盖 100+ 命令，开销 10ms 以内。适合天天用 Claude Code / Codex 烧 token 的人；代价是只拦 Bash 调用，内置 Read / Grep 管不到。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["CLI", "上下文优化", "编码代理", "开源"],
    body: "rtk 做的事很直接：你（和你的代理）敲的 shell 命令，输出先过它一道再进上下文。它是单个 Rust 二进制、零依赖、开销 10ms 以内，覆盖 100+ 命令——ls 变树形并带文件计数、cat/read 取签名与结构而不是全文、grep 截断长行并按文件分组、git status 变紧凑 stat、git log 只留 hash 与主题、测试只留失败项（通过项压成计数）、docker ps 只留关键字段，AWS 命令还会顺手去掉策略文档和敏感字段。装好 `rtk init -g` 之后它往代理的 hook 里注册，命令被自动重写成 `rtk git status`，代理不需要知道 rtk 存在。\n省多少要说实话：README 自己强调「最多省 90% 的 bash 输出」不等于账单少 90%——bash 输出只是输入 token 的一部分，输入又只是账单的一部分，每一层都在稀释。而且它没带分词器，token 数按 bytes / 4 估算，**百分比可信、绝对数字是近似值**。\n两个必踩的坑。一是名字撞车：crates.io 上另有一个叫 rtk 的 Rust Type Kit，`rtk gain` 报错基本就是装错了，改用 `cargo install --git`。二是 hook 只在 Bash 工具调用上生效，Claude Code 内置的 Read / Grep / Glob 不走 Bash，所以要改用 shell 命令（cat、rg、find）或直接调 `rtk read` / `rtk grep` / `rtk find` 才有压缩。",
    officialUrl: "https://www.rtk-ai.app",
    officialLabel: "www.rtk-ai.app",
    links: {
      official: "https://www.rtk-ai.app",
      github: "https://github.com/rtk-ai/rtk",
    },
    whoFor: "每天让编码代理跑大量 shell 命令（git、测试、lint、构建、kubectl、aws）的人，尤其是被长输出撑爆上下文或按量付费心疼的人。",
    whoNot: "主要用 IDE 内置工具读文件、很少走 Bash 的人——hook 管不到那条路径，收益有限；也不适合指望装完账单立刻砍半的人。",
    installTips: [
      "macOS：`brew install rtk`；Windows：`winget install rtk-ai.rtk`（不用自己配 PATH）；Linux/macOS 通用：`curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh`，装到 ~/.local/bin。",
      "装完 `rtk --version` 应显示 rtk 0.28.2，`rtk gain` 打开节省看板；若 gain 报错说明装成了 crates.io 上同名的 Rust Type Kit，改 `cargo install --git https://github.com/rtk-ai/rtk`。",
      "接入代理：`rtk init -g`（Claude Code / Copilot 默认），Gemini CLI 加 `--gemini`，Codex 加 `--codex`，Cursor / Windsurf / Cline / Kilo Code / Trae 等各有 `--agent <name>`；改完必须重启代理才生效。",
      "Windows 用预编译包时把 rtk.exe 放进 PATH（如 C:\\Users\\<你>\\.local\\bin），从命令提示符 / PowerShell / Windows Terminal 运行，不要双击 exe。",
    ],
    alternatives: [],
    icon: {
      letter: "R",
      color: "#8B5E3C",
    },
    guide: {
      intro: "按第一次装会卡在哪讲：安装与验证、init 之后要重启、hook 只覆盖 Bash 这件事、以及「省 90% 输出」为什么不等于省 90% 账单。",
      markdown: `## 装，然后立刻验证

\`\`\`bash
brew install rtk                 # macOS
winget install rtk-ai.rtk        # Windows
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh   # Linux/macOS
\`\`\`

Linux / macOS 的脚本装到 \`~/.local/bin\`，必要时加 PATH：

\`\`\`bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc   # zsh 用 ~/.zshrc
\`\`\`

验证两条命令：

\`\`\`bash
rtk --version   # 应显示 rtk 0.28.2
rtk gain        # 打开节省看板
\`\`\`

**\`rtk gain\` 失败 = 装错了包**：crates.io 上另有一个叫 rtk 的 Rust Type Kit。改用 \`cargo install --git https://github.com/rtk-ai/rtk\`。

## 接进你的代理

\`\`\`bash
rtk init -g                     # Claude Code / Copilot（默认）
rtk init -g --gemini            # Gemini CLI
rtk init -g --codex             # Codex
rtk init -g --agent cursor      # Cursor
\`\`\`

改完**必须重启代理**，然后敲一句 \`git status\`——它会被自动重写成 \`rtk git status\`，代理拿到的是压缩后的输出。

## hook 只管 Bash

这是最容易被误解的一条：

- **生效**：Bash 工具调用（\`git status\`、\`npm test\`、\`cat file\`…）
- **不生效**：Claude Code 内置的 \`Read\`、\`Grep\`、\`Glob\`，它们不经过 Bash hook

想要后者的压缩，两个办法：改用 shell 命令（\`cat\` / \`head\` / \`tail\`、\`rg\` / \`grep\`、\`find\`），或直接调用 \`rtk read\`、\`rtk grep\`、\`rtk find\`。

## 省 90% 输出 ≠ 省 90% 账单

README 单独用一节解释这件事：bash 输出只是输入 token 的一部分，输入 token 又只是账单的一部分（还有输出 token），**每一层都在稀释**。另外 rtk 不带分词器，token 估算按 \`bytes / 4\`，所以：

- 百分比（趋势）可信
- 绝对 token 数是近似值

要看自己真实的数据，用 \`rtk gain\`。

## 常用的几条

\`\`\`bash
rtk git status                  # 紧凑状态
rtk git log -n 10               # 单行提交
rtk pytest                      # 只留失败
rtk tsc                         # TypeScript 错误按文件分组
rtk docker logs <container>     # 去重日志
rtk read file.rs -l aggressive  # 只要签名
rtk err <cmd>                   # 只留错误与警告
rtk run <cmd>                   # 原样执行，不过滤
\`\`\`

需要原始输出时用 \`rtk run\`，别为了拿完整结果去关掉 hook。
`,
      resources: [
        {
          kind: "html",
          title: "官网",
          url: "https://www.rtk-ai.app",
          note: "安装方式、支持命令与故障排查入口。想知道它覆盖你常用的哪些命令，看官网的清单。",
        },
        {
          kind: "html",
          title: "节省口径说明",
          url: "https://github.com/rtk-ai/rtk/blob/master/docs/guide/resources/savings-explained.md",
          note: "讲清「省 90% 输出」与账单的关系、以及 token 为什么是估算值。被百分比误导前先读这页。",
        },
        {
          kind: "html",
          title: "版本发布与预编译包",
          url: "https://github.com/rtk-ai/rtk/releases",
          note: "各平台的预编译二进制下载与更新记录。不用 brew / winget 时从这里取包。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "archify",
    linksCheckedAt: "2026-10-14",
    name: "archify",
    nameZh: "Archify 交互式架构图技能",
    aliases: ["archify", "架构图 skill", "交互式架构图", "图表生成技能", "agent skill"],
    summary: "给编码代理装的 skill：一句话把想法、方案或代码库变成可交互的单文件 HTML 图。适合要把系统讲给别人听的人；代价是产出质量全看你用的代理，README 里还夹带大量推广内容。",
    scenes: ["design", "docs"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["架构图", "Agent Skill", "可视化", "开源"],
    body: "Archify 是一个 agent skill，不是独立软件：装进 Cursor、Claude Code、Codex CLI 或 OpenCode 之后，你用一句话描述，它生成一个自带交互的单文件 HTML——节点可点开看细节、路径可追溯上下游、明暗主题一键切换，还能导出 PNG 与分享卡。它强调 source-backed：可以让代理先读一个真实仓库再出图（README 给了对 mco-org/mco 某个 commit 的追踪案例），而不是凭空画一张好看的图。\n最有价值的一点是产物独立：生成的 HTML 是自包含的，下载下来双击就能看，看的人不需要装 Archify，发给别人交互也跟着走（外链和地图跳转才需要联网）。\n要说清楚的代价：它只是一层 skill，图的质量完全取决于你用的代理和模型，换代理结果差别很大；README 里赞助与推广占了相当篇幅（API 中转、加速器、模型聚合等），这些与项目本身无关，官方自己也标注了第三方服务由各自提供者运营；当前稳定版 v3.1.0，运行时会去拉一个固定的稳定 manifest 做更新提醒（只是提醒，不会自动下载安装，可用 `ARCHIFY_UPDATE_CHECK_DISABLED=1` 关掉联网与提醒状态写入）。",
    officialUrl: "https://archify.si",
    officialLabel: "archify.si",
    links: {
      official: "https://archify.si",
      github: "https://github.com/tt-a1i/archify",
    },
    whoFor: "经常要把系统架构、请求链路、方案结构讲给同事或客户的人，以及想让代理读仓库后直接产出一张能点开看的图的开发者。",
    whoNot: "想要一个独立绘图软件的人——它没有自己的界面，必须挂在编码代理上；也不适合对图的结构准确性要求极高、又无法提供真实代码库的人。",
    installTips: [
      "`npx skills add tt-a1i/archify -g` 全局安装；Cursor 想要非交互的明确安装用 `npx -y skills add tt-a1i/archify --skill archify --agent cursor --global --copy --yes`。",
      "不想装就临时试：`npx skills use tt-a1i/archify@archify --agent codex`；DeepSeek Harness 走 `dsh plugin --profile web add @tt-a1i/archify-dsh@1.0.0`。",
      "不要求必须有仓库：直接描述一句需求就能出图；想画真实系统就让代理先读仓库，README 的案例是针对某个具体 commit 做的追踪。",
      "介意联网可设 `ARCHIFY_UPDATE_CHECK_DISABLED=1`：默认只会 GET 一个固定的稳定 manifest 用于提醒，不会自动下载或安装更新。",
    ],
    alternatives: [],
    icon: {
      letter: "A",
      color: "#6B4E9B",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：装到哪个代理、一句话 prompt 怎么写、出图后怎么迭代、以及产物为什么可以直接发别人。",
      markdown: `## 装到你的代理上

\`\`\`bash
npx skills add tt-a1i/archify -g
\`\`\`

支持 Cursor、Claude Code、Codex CLI、OpenCode。要一次装死某个代理（非交互）：

\`\`\`bash
npx -y skills add tt-a1i/archify --skill archify --agent cursor --global --copy --yes
\`\`\`

只想试一次：

\`\`\`bash
npx skills use tt-a1i/archify@archify --agent codex
\`\`\`

## 一句话就够了

装完直接把需求说给代理：

\`\`\`text
Use Archify to diagram a web request: Browser calls the API,
the API checks Redis, and a cache miss queries PostgreSQL and fills the cache.
\`\`\`

**不需要仓库**。想画真实系统时再让代理去读代码：

\`\`\`text
读一下这个仓库，用 Archify 出一张 source-backed 的架构图。
\`\`\`

## 出图之后继续迭代

这是它比「生成一张静态图」有用的地方——用自然语言接着改：

- \`Add authentication\`
- \`Highlight the cache-miss path\`
- \`Switch to the light theme\`

导出菜单可以把 PNG 复制到剪贴板，也能下载静态或动图格式；追踪过一条路径后还能导出 1200×630 的分享卡，图本身保留在卡里做上下文。

## 产物是独立 HTML

生成的 HTML 自包含，**下载下来双击就能打开**，查看的人不需要装 Archify；发给别人，节点详情和路径探索一起带过去。只有外链网站和地图跳转需要联网。

## 看案例比看功能表有用

官网的 Proof Lab 收了 11 个检查过的场景、它们的 JSON 源与验证记录，另有社区作品（旅行行程、合同审阅、事故复盘等）。判断它适不适合你的场景，先翻案例。

## 两点提醒

- **README 里大量篇幅是赞助与推广**（API 中转、加速器、模型聚合站），与项目本身无关，别当成官方推荐。
- 更新检查默认开着，但只 GET 一个固定 manifest 用于提醒，不会自动下载或安装；不想联网就 \`ARCHIFY_UPDATE_CHECK_DISABLED=1\`。
`,
      resources: [
        {
          kind: "html",
          title: "官网与开始页",
          url: "https://archify.si",
          note: "按代理选安装方式的入口与各场景指南。第一次用从这里挑你的代理。",
        },
        {
          kind: "html",
          title: "Proof Lab 案例库",
          url: "https://archify.si/gallery.html",
          note: "11 个检查过的场景、JSON 源与验证记录，以及社区作品。判断值不值得装，看案例最直接。",
        },
        {
          kind: "html",
          title: "GitHub 仓库",
          url: "https://github.com/tt-a1i/archify",
          note: "当前稳定版本、changelog 与全部安装选项。升级与排查版本问题看这里。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "hello-agents",
    linksCheckedAt: "2026-10-14",
    name: "Hello-Agents",
    nameZh: "Hello-Agents 智能体构建教程",
    aliases: ["hello agents", "hello-agents", "从零开始构建智能体", "Datawhale 智能体教程", "Agent 教程"],
    summary: "Datawhale 的中文智能体系统教程，16 章从 ReAct 手写讲到上下文工程、通信协议、Agentic RL 与评估。适合想从「调 API」走到「造框架」的人；代价是要按章节啃，且采用 CC BY-NC-SA，不能商用。",
    scenes: ["education", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["教程", "智能体", "Python", "开源"],
    body: "Hello-Agents 是 Datawhale 的《从零开始构建智能体》，讲的是 AI Native Agent——它把 Dify、Coze、n8n 这类流程驱动的「软件工程派」放在第五章讲完，主体是真正以 LLM 驱动的智能体。全书 16 章分五部分：智能体与 LLM 基础；ReAct、Plan-and-Solve、Reflection 手写实现、低代码平台、AutoGen / AgentScope / LangGraph，再到从零自研一个框架（配套 HelloAgents）；进阶的记忆与检索、上下文工程、MCP / A2A / ANP 协议、Agentic RL（SFT 到 GRPO）、性能评估；三个综合案例（智能旅行助手、自动化深度研究智能体、赛博小镇）与毕业设计。\n它比「10 分钟搭个 Agent」那类材料重得多，README 写明的前置是：会 Python、知道怎么通过 API 调一次 LLM，但不需要算法或模型训练背景。\n三点要提前知道。一是代码全部在仓库的 `code` 目录，不跑等于没学，作者明确要求亲手运行、调试、修改每一份代码。二是许可为 CC BY-NC-SA 4.0（署名 - 非商业性使用 - 相同方式共享），企业内部培训、二次分发前要看清条款；PDF 版还预加了 Datawhale 的水印（作者说明是为了防止被加水印转卖）。三是这是条快速迭代的赛道，README 提到的《从零开始训练智能体》与 2026 年 5 月的学习路线在另一个仓库 Agent-Learning-Hub，别把两份路线混着跟。",
    officialUrl: "https://hello-agents.datawhale.cc",
    officialLabel: "hello-agents.datawhale.cc",
    links: {
      official: "https://hello-agents.datawhale.cc",
      github: "https://github.com/datawhalechina/hello-agents",
    },
    whoFor: "有 Python 基础、能调 LLM API，想系统搞清智能体原理并亲手写出一套框架的人；也适合准备 Agent 岗位面试（有专门的面试题与答案章节）。",
    whoNot: "只想照着搭个工作流的人——第五章的低代码平台之外的内容都不适合你；以及需要把教材用于商业培训的人，CC BY-NC-SA 不允许。",
    installTips: [
      "直接在线读：国外 https://datawhalechina.github.io/hello-agents/ ，国内加速 https://hello-agents.datawhale.cc ，不用下载。",
      "PDF 在 Releases 页（https://github.com/datawhalechina/hello-agents/releases/latest/），国内镜像为 datawhale.cn 的对应页面；PDF 里预置了 Datawhale 水印。",
      "要动手就把仓库 `code` 目录里的代码逐份跑一遍，README 明确要求亲手运行、调试、修改。",
      "环境配置与常见问题看 Extra-Chapter 的《07-环境配置》《04-Hello-agents课程常见问题》；面试准备看《01-Agent面试题总结》与参考答案。",
    ],
    alternatives: [],
    icon: {
      letter: "H",
      color: "#2F855A",
    },
    guide: {
      intro: "按第一次学这本书会卡在哪讲：前置够不够、五大部分怎么取舍、哪些章节可以跳、以及许可与路线图这两件容易踩的事。",
      markdown: `## 先对照前置

README 写得很明确：**会 Python，知道怎么通过 API 调一次 LLM**，不需要算法或模型训练背景。

不满足第二条的，先花一小时随便调通一家模型的 API 再开始，否则第四、六、七章会一直卡在「为什么我的跑不通」。

## 五大部分怎么取舍

| 部分 | 章节 | 你要是时间紧 |
| --- | --- | --- |
| 一、基础与 LLM | 1–3 | 第 3 章值得读，1–2 可快翻 |
| 二、构建智能体 | 4–7 | **核心**，第 4 章手写 ReAct 别跳 |
| 三、高级扩展 | 8–12 | 上下文工程（9）与评估（12）优先 |
| 四、综合案例 | 13–15 | 挑一个和你方向最接近的做 |
| 五、毕业设计 | 16 | 想检验成果再做 |

第二部分是全书的骨架：先手写经典范式，再看低代码平台和 LangGraph 这类框架，最后从零造一个自己的框架——「用轮子」和「造轮子」两头都走一遍。

## 代码必须自己跑

所有配套代码在仓库的 \`code\` 目录。这本书的价值几乎全在实现细节里，只读不动手等于读了另一本书。

遇到环境问题先看 Extra-Chapter：

- \`Extra07-环境配置\` —— 环境搭建
- \`Extra04-DatawhaleFAQ\` —— 课程常见问题
- \`Extra11-WebAgent科普与实战\` —— 反爬与 HelloAgents 集成

## 想找 Agent 岗位

\`Extra01-面试问题总结\` 与配套的 \`Extra01-参考答案\` 是现成的复习材料，正文第十二章的评估方法也常出现在面试里。

## 两件容易踩的事

**许可**：全文采用 CC BY-NC-SA 4.0（署名 - 非商业性使用 - 相同方式共享）。企业内训、二次发行前先确认条款；PDF 里预置了 Datawhale 水印，是作者为防止被转卖特意加的。

**路线图分叉**：README 里提到的《从零开始训练智能体》以及 2026 年 5 月更新的学习路线在另一个仓库 \`datawhalechina/Agent-Learning-Hub\`，别把两份路线混着跟。
`,
      resources: [
        {
          kind: "html",
          title: "在线阅读（国内加速）",
          url: "https://hello-agents.datawhale.cc",
          note: "国内可直接打开的在线版，不用下载仓库。想先翻目录再决定要不要系统学时用它。",
        },
        {
          kind: "html",
          title: "GitHub 仓库（章节与 Extra-Chapter）",
          url: "https://github.com/datawhalechina/hello-agents",
          note: "全部章节、配套 code 目录与社区精选文章。环境配置与常见问题在 Extra-Chapter 里。",
        },
        {
          kind: "html",
          title: "PDF 版国内下载",
          url: "https://www.datawhale.cn/learn/summary/239",
          note: "PDF 整本的国内下载地址（也可从 GitHub Releases 取）。离线阅读或打印时用。",
        },
      ],
    },
    license: "CC-BY-NC-SA-4.0",
  },
  {
    slug: "unsloth",
    linksCheckedAt: "2026-10-14",
    name: "Unsloth",
    nameZh: "Unsloth 本地模型运行与微调",
    aliases: ["unsloth", "Unsloth Studio", "Unsloth Desktop", "微调", "本地大模型"],
    summary: "Unsloth 现在是桌面应用：本地跑和微调 LLM、扩散、语音等模型，支持 GGUF / MLX / Qwen3.8 / FLUX，还能导出 GGUF。适合不想写代码做微调的人；代价是要自己管 GPU，且对外暴露时必须先设管理员密码。",
    scenes: ["code", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["微调", "本地大模型", "LoRA", "开源"],
    body: "Unsloth 已经从「微调加速库」长成一个桌面应用：Windows / Linux / WSL / macOS 都支持，NVIDIA、AMD、Intel GPU、CPU 与 Vulkan 后端都能跑，多卡也行。它有三层用法——Unsloth Desktop（下载安装包即用，推荐）、Unsloth Studio（Web UI，`unsloth studio` 启动）、Unsloth Core（代码版，`uv pip install unsloth --torch-backend=auto`）。微调这块官方给的是 2 倍速度、70% 显存下降且无精度损失，覆盖 LoRA / QLoRA / 全参微调 / 预训练 / RL / GRPO / DPO / FP8，导出支持 GGUF、NVFP4、FP8 等格式，数据集还能从 PDF、CSV、DOCX 直接构建。\n它有个很实用的入口：`unsloth start claude --model unsloth/Qwen3.8-27B-GGUF:UD-Q4_K_XL` 这类一条命令，把本地模型接给 Claude Code、Codex、VS Code、OpenCode、Hermes、OpenClaw 等代理，不用自己搭 OpenAI 兼容层。\n坑有三处。Windows 装 Core 必须**先装 torchao** 再装 unsloth：`--torch-backend` 只在 PyTorch 索引里找 torchao，那里没有较新的 Windows 版本，一步装会静默解析到旧版 Unsloth。Docker 在 Linux / Mac 上要先跑官方脚本配一次 NVIDIA toolkit，AMD 另有 `unsloth/unsloth-rocm` 镜像。对外暴露（`--secure`、`--cloudflare`、非 loopback 的 `-H`）会要求在终端设管理员密码，**Ctrl+C 是中止启动而不是沿用自动生成的密码**；headless 用 `UNSLOTH_STUDIO_PASSWORD='...' unsloth studio --secure`，忘了就 `unsloth studio reset-password`。",
    officialUrl: "https://unsloth.ai/docs",
    officialLabel: "unsloth.ai",
    links: {
      official: "https://unsloth.ai/docs",
      github: "https://github.com/unslothai/unsloth",
    },
    whoFor: "想在自己机器上微调或跑本地模型、又不想从零拼训练脚本的人；以及想让编码代理走本地模型而不是云 API 的人。",
    whoNot: "没有独显或显存很紧的人——省 70% 显存也还是要显存；也不适合想开箱即用、不愿处理 Docker / GPU 驱动 / 端口密码的人。",
    installTips: [
      "桌面版直接下安装包：Windows .exe（另含 ARM64 版）、macOS .dmg、Linux deb（含 ARM64）与 AppImage；也能 `brew install --cask unsloth` 或 `winget install --id UnslothAI.Unsloth -e`。",
      "Studio（Web UI）：macOS / Linux / WSL 用 `curl -fsSL https://unsloth.ai/install.sh | sh`，Windows 用 `irm https://unsloth.ai/install.ps1 | iex`，启动 `unsloth studio`。",
      "Windows 装 Core 的顺序不能反：先 `uv pip install torchao`，再 `uv pip install unsloth --torch-backend=auto`；官方示例是 Python 3.13 + venv。",
      "Docker：`docker run -d --name unsloth --gpus all --ipc=host -p 8000:8000 -p 8888:8888 -v \"$PWD\":/workspace/host -v \"$HOME/.cache/huggingface\":/workspace/.cache/huggingface -v unsloth-studio:/opt/unsloth-studio unsloth/unsloth`；AMD 用 unsloth/unsloth-rocm，只要 notebook 用 :core 标签。",
    ],
    alternatives: [],
    icon: {
      letter: "U",
      color: "#2C7A7B",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：三种形态怎么选、把本地模型接给编码代理那条命令、对外暴露时的密码机制、以及 Windows 上 torchao 的安装顺序。",
      markdown: `## 三种形态，别装重了

| 形态 | 怎么起 | 适合 |
| --- | --- | --- |
| **Unsloth Desktop** | 下载安装包 | 不碰命令行，推荐 |
| **Unsloth Studio** | \`unsloth studio\` | Web UI，想远程访问 |
| **Unsloth Core** | \`uv pip install unsloth --torch-backend=auto\` | 写脚本、嵌进自己的流程 |

三者共用同一套能力（跑模型、微调、导出、数据集），装一个就够。

## 把本地模型接给编码代理

这是很多人装它真正的理由：

\`\`\`bash
unsloth start claude --model unsloth/Qwen3.8-27B-GGUF:UD-Q4_K_XL
\`\`\`

| 代理 | 命令 |
| --- | --- |
| Claude Code | \`unsloth start claude\` |
| OpenAI Codex | \`unsloth start codex\` |
| VS Code | \`unsloth start vscode\` |
| OpenCode | \`unsloth start opencode\` |
| Hermes / Pi / OpenClaw | \`unsloth start hermes\` / \`pi\` / \`openclaw\` |

## 对外暴露前先管好密码

README 用「be careful」强调了这一层：**服务端工具默认是开着的**。

- 用 \`--secure\`、\`--cloudflare\` 或非 loopback 的 \`-H\` 启动时，终端会要求设一个新的管理员密码
- 在这里按 Ctrl+C 是**中止启动**，不是沿用自动生成的密码
- headless 场景提前给：\`UNSLOTH_STUDIO_PASSWORD='your-strong-password' unsloth studio --secure\`
- 忘了密码：\`unsloth studio reset-password\`
- 想暴露又不想开工具：加 \`--disable-tools\`

局域网访问在 \`Settings > API keys > LAN access\` 里开，别直接把 \`-H 0.0.0.0\` 当默认配置。

## Windows 上的安装顺序

这是静默失败最多的一步。Core 版要这样装：

\`\`\`powershell
winget install -e --id Python.Python.3.13
winget install --id=astral-sh.uv -e
uv venv unsloth_env --python 3.13
.\\unsloth_env\\Scripts\\activate
uv pip install torchao
uv pip install unsloth --torch-backend=auto
\`\`\`

**torchao 必须单独先装**：\`--torch-backend\` 只在 PyTorch 索引里找 torchao，而那里没有较新的 Windows 版本，一步装会静默解析到旧版 Unsloth，症状是能装上但不是你要的版本。

## Docker 与 GPU

Linux / Mac 上先配一次 NVIDIA toolkit（官方脚本 \`install_nvidia_toolkit.sh\`），AMD 用 \`unsloth/unsloth-rocm\` 镜像。只要 notebook 就拉 \`:core\` 标签，体积小很多。
`,
      resources: [
        {
          kind: "html",
          title: "官方文档",
          url: "https://unsloth.ai/docs",
          note: "Desktop / Studio / Core 三种形态的安装与用法、导出格式、LAN 与远程访问。选形态前先看。",
        },
        {
          kind: "html",
          title: "发布页（各平台安装包）",
          url: "https://github.com/unslothai/unsloth/releases",
          note: "Windows / macOS / Linux（含 ARM64）安装包下载地址与更新记录。桌面版从这里取。",
        },
        {
          kind: "html",
          title: "Docker Hub 镜像",
          url: "https://hub.docker.com/r/unsloth/unsloth",
          note: "镜像标签（含 :core 与 rocm 版）与 GPU 访问配置。要在服务器或团队环境跑时看这页。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "llamafactory",
    linksCheckedAt: "2026-10-14",
    name: "LlamaFactory",
    nameZh: "LlamaFactory 大模型微调框架",
    aliases: ["llamafactory", "llama factory", "LLaMA Board", "大模型微调", "LoRA 训练"],
    summary: "统一微调框架：100+ 模型，从 LoRA / QLoRA / 全参到 PPO / DPO / KTO，命令行与零代码 Web UI 双入口。适合要在自己机器上微调的人；代价是 README 没有 Windows 路径，且第三方站点均被官方声明为非授权。",
    scenes: ["code", "data"],
    platforms: ["linux", "macos"],
    source: "opensource",
    tags: ["微调", "LoRA", "大模型", "开源"],
    body: "LlamaFactory 解决的是「微调这件事太碎」。模型侧覆盖 LLaMA、LLaVA、Mistral、Mixtral-MoE、Qwen3、Qwen3-VL、DeepSeek、Gemma、GLM、Phi 等一百多个；方法侧从（增量）预训练、多模态 SFT、奖励模型到 PPO、DPO、KTO、ORPO；资源侧支持 16-bit 全参、freeze、LoRA 与 2/3/4/5/6/8-bit QLoRA（AQLM / AWQ / GPTQ / LLM.int8 / HQQ / EETQ）。算法上还堆了 GaLore、BAdam、APOLLO、Adam-mini、Muon、OFT、DoRA、LongLoRA、LoRA+、LoftQ、PiSSA，推理侧可切 vLLM 或 SGLang worker 的 OpenAI 风格 API。\n两条入口：命令行与零代码的 LLaMA Board（Gradio）。不想在本地装环境，README 给了三条免费路径——Colab、阿里云 PAI-DSW 免费试用、AMD GPU Cloud 免费额度；想先试界面，HuggingFace Spaces 与 ModelScope 上都有官方的 LLaMA Board。新模型跟进速度是它真正的卖点：Day 0 支持 Qwen3 / Qwen2.5-VL / Gemma 3 / GLM-4.1V / InternLM 3 / MiniCPM-o-2.6，Day 1 支持 Llama 3 / GLM-4 / Mistral Small / PaliGemma2 / Llama 4。\n两条坑必须讲。一是 README 用醒目提示写明：**除了它列出的那几个链接，其他网站都是未经授权的第三方站点**，别从搜索出来的第三方渠道拿镜像或一键包。二是 Windows 没有出现在 README 的任何一条路径里（云端、Docker、ASCEND NPU、AMD 都是 Linux 语境），Windows 用户别默认自己被支持。另外要留意它还在快速变化：25/10 才通过 mcore_adapter 加了 Megatron-core 训练后端。",
    officialUrl: "https://llamafactory.readthedocs.io",
    officialLabel: "llamafactory.readthedocs.io",
    links: {
      official: "https://llamafactory.readthedocs.io",
      github: "https://github.com/hiyouga/LlamaFactory",
    },
    whoFor: "要在自己的 GPU 机器上微调开源模型、又不想自己写训练循环的人；以及需要快速跟上新模型（Day 0 / Day 1 支持）的团队。",
    whoNot: "Windows 桌面用户——README 里没有任何 Windows 安装路径；也不适合想找「一键傻瓜包」的人，官方明确把第三方站点都标为非授权。",
    installTips: [
      "不想装环境就先用免费入口：README 给了 Colab notebook、阿里云 PAI-DSW 免费试用与 AMD GPU Cloud 免费额度三条路。",
      "只想点点鼠标：HuggingFace Spaces 与 ModelScope 上都有官方的 LLaMA Board，可以直接试零代码 Web UI。",
      "本地部署用 Docker Hub 上的 `hiyouga/llamafactory` 镜像；依赖版本与详细安装步骤以官方文档站 llamafactory.readthedocs.io 为准，README 没钉版本号。",
      "ASCEND NPU 与 AMD GPU 各有单独文档（readthedocs 的 multibackend/npu 与 ROCm 文档），别照通用 CUDA 教程装。",
    ],
    alternatives: [],
    icon: {
      letter: "L",
      color: "#975A16",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：先选免费环境还是本地、CLI 与 LLaMA Board 两条入口、训练方法与显存档位怎么挑、以及那条「第三方站点均非授权」的警告。",
      markdown: `## 先决定在哪跑

README 一上来就给了三条不用装环境的路：

- **Colab（免费）** —— 官方 notebook，适合先跑通一次
- **PAI-DSW（免费试用）** —— 阿里云上的现成环境
- **AMD GPU Cloud（免费额度）** —— AMD 卡

确认要长期用，再回本地 Docker 或裸机。这个顺序能省掉大量环境调试时间。

## 两条入口

| 入口 | 适合 |
| --- | --- |
| 命令行（CLI） | 批量、脚本化、可复现 |
| **LLaMA Board**（Gradio Web UI） | 零代码，先把一次训练跑通 |

零代码是它的宣传点之一：Web UI 里选模型、选数据、调参数就能开训。不熟悉训练参数的人从 Board 入手，把跑通的配置再搬到 CLI。

## 方法与显存档位

按显存从高到低大致是：

- **16-bit 全参微调** —— 显存最吃紧
- **freeze-tuning** —— 冻住部分层
- **LoRA** —— 常用档
- **QLoRA** —— 2/3/4/5/6/8-bit（AQLM / AWQ / GPTQ / LLM.int8 / HQQ / EETQ），显存最省

目标只是让模型学会某种风格或格式，LoRA / QLoRA 足够；真要改底层能力再考虑全参。省显存的优化器还有 GaLore、BAdam、APOLLO、Adam-mini、Muon 可选。

## 推理别用训练时的后端

训完要部署，README 给了 **vLLM worker 或 SGLang worker** 的 OpenAI 风格 API（\`infer_backend: sglang\`），比直接用训练框架推理快得多。它的文档站有完整参数表。

## 那条警告要当真

README 用 NOTE 明确写：**除了它列出的那几个链接，其他网站都是未经授权的第三方网站，请谨慎使用**。搜索出来的「一键包」「国内镜像站」都不在官方列表里，别用。

## 新模型支持节奏

它对前沿模型的跟进被整理成了一张表：Day 0 支持 Qwen3 / Qwen2.5-VL / Gemma 3 / GLM-4.1V / InternLM 3 / MiniCPM-o-2.6；Day 1 支持 Llama 3 / GLM-4 / Mistral Small / PaliGemma2 / Llama 4。新模型刚发布就想微调时，这张表比任何评测都有用。
`,
      resources: [
        {
          kind: "html",
          title: "官方文档站",
          url: "https://llamafactory.readthedocs.io/en/latest/",
          note: "安装、参数、数据集与多后端（NPU / AMD）说明。README 没钉版本，装之前以这站为准。",
        },
        {
          kind: "html",
          title: "GitHub 仓库 README",
          url: "https://github.com/hiyouga/LlamaFactory",
          note: "支持的模型与方法清单、Day-0/Day-1 支持表、以及官方授权的链接列表。选型前先扫一遍。",
        },
        {
          kind: "html",
          title: "Docker 镜像标签",
          url: "https://hub.docker.com/r/hiyouga/llamafactory/tags",
          note: "官方镜像的版本标签。要在服务器或团队环境部署时用官方 tag，不要用第三方镜像。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "headroom",
    linksCheckedAt: "2026-10-14",
    name: "headroom",
    nameZh: "headroom 上下文压缩代理",
    aliases: ["headroom", "headroom-ai", "上下文压缩", "token 压缩", "CCR"],
    summary: "在工具输出、日志、RAG 片段进入 LLM 之前压缩它们，全程本地运行不上传内容。适合被长上下文撑爆的编码代理用户；代价是收益取决于内容重复度，散文几乎压不动。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["上下文工程", "压缩", "编码代理", "开源"],
    body: "Headroom 压缩的是「代理读进去的一切」——工具输出、日志、RAG 片段、文件和对话历史，压缩在你本机完成，不把 prompt 或文件内容发到任何地方。内部是 ContentRouter 判定内容类型后选压缩器（JSON 走 SmartCrusher、代码走 CodeCompressor、散文走 Kompress-v2-base），CacheAligner 标记会破坏 provider KV-cache 前缀的易变内容（它本身不改写 prompt），CCR 把原文存在本地，模型需要全文时调用 `headroom_retrieve` 取回。\n三种形态：Python / TypeScript 库（`compress(messages)`）、零改代码的代理（`headroom proxy --port 8787`）、以及一条命令包住某个编码代理（`headroom wrap claude|codex|grok|copilot|cursor|aider|cline|...`，`headroom unwrap` 撤销）。它还顺带管输出侧：把「be terse」提示加到 system prompt **末尾**（这样缓存仍然命中），并在「模型只是接着工具结果继续」时降低思考强度——默认关闭，用 `HEADROOM_OUTPUT_SHAPER=1` 开启。\n代价要看清：收益完全取决于重复度。README 给的四个真实场景是代码搜索 21%、SRE 排障 57%、代码库探索 42%、issue 分类 30%；重复 JSON 与日志行能清掉 90% 以上，散文和本身紧凑的输出压不了多少，跑 `headroom savings` 才有属于你自己的数字。另外 npm 包 `headroom-ai` 只是 TypeScript SDK，**不带 `headroom` 命令**，CLI 只在 PyPI 包里；接 DeepSeek / OpenRouter 这类第三方 OpenAI 兼容服务时必须显式 `--openai-api-url`，否则 key 会被发到 OpenAI 并返回 401。",
    officialUrl: "https://docs.headroomlabs.ai/docs",
    officialLabel: "docs.headroomlabs.ai",
    links: {
      official: "https://docs.headroomlabs.ai/docs",
      github: "https://github.com/headroomlabs-ai/headroom",
    },
    whoFor: "每天让编码代理或自建 Agent 吞大量 JSON、日志、检索结果的人，以及想省 token 又不想把内容传到第三方压缩服务的人。",
    whoNot: "主要处理散文、短对话的人——压缩率会低到没有意义；也不适合不愿在代理外面再挂一层本地代理服务的人。",
    installTips: [
      "`uv tool install --python 3.13 \"headroom-ai[all]\"`（隔离环境里的 CLI）或 `pip install \"headroom-ai[all]\"`（同样带 CLI）；npm 的 `headroom-ai` 只是 TS SDK，不提供 headroom 命令。",
      "三选一起手：`headroom deploy` 一条龙部署并配好代理；`headroom wrap claude` 包住某个代理；`headroom proxy --port 8787` 零改代码接管任意 OpenAI 兼容客户端。",
      "装完 `headroom doctor` 确认路由生效，`headroom perf` 看节省，`headroom dashboard` 看实时数据（代理必须在跑）。",
      "用 DeepSeek / OpenRouter / 自建网关这类第三方 OpenAI 兼容服务时，wrap 必须加 `--openai-api-url https://...`（或先 export `OPENAI_TARGET_API_URL`），否则 key 会被发到 OpenAI 并返回 401。",
    ],
    alternatives: [],
    icon: {
      letter: "H",
      color: "#4A5568",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：三种形态怎么选、wrap 会顺带装上 Serena、第三方 provider 那个 401 坑、以及为什么你看到的压缩率和官方数字不一样。",
      markdown: `## 装（CLI 只在 Python 包里）

\`\`\`bash
uv tool install --python 3.13 "headroom-ai[all]"   # 隔离环境里的 CLI
pip install "headroom-ai[all]"                     # 同样带 headroom CLI
npm install headroom-ai                            # 只是 TS SDK，没有 CLI
\`\`\`

记住这条：**npm 包不提供 \`headroom\` 命令**，它是给你 \`import { compress } from 'headroom-ai'\` 用的库。

## 三种形态

\`\`\`bash
headroom deploy             # 一条龙：本地部署 + 配好代理
headroom wrap claude        # 包住某个编码代理
headroom proxy --port 8787  # 起代理，任意 OpenAI 兼容客户端零改代码接入
\`\`\`

库模式直接嵌在代码里：

\`\`\`python
from headroom import compress
result = compress(messages, model="gpt-4o")
print(f"Saved {result.tokens_saved} tokens ({result.compression_ratio:.0%})")
\`\`\`

包完之后**每次都用 wrap 启动会话**才会生效。\`headroom wrap\` 会起本地代理、装上 Serena 做语义代码导航，并把代理配置成走 Headroom；Claude Code 下 Serena 只注册给当前项目（\`--code-memory-scope user\` 改成全局，\`--code-memory none\` 跳过），\`headroom unwrap\` 可以撤销。

## 第三方 provider 的 401

用 OpenCode + DeepSeek / OpenRouter / 自建网关时，默认上游是 \`https://api.openai.com/v1\`，你的 key 会被发到 OpenAI 并 401。必须显式指定：

\`\`\`bash
headroom wrap opencode --openai-api-url https://api.deepseek.com/v1
# 或先 export OPENAI_TARGET_API_URL=... 再 wrap
\`\`\`

## 为什么你的压缩率没那么高

README 把数字摊开讲了：**收益随内容重复度上升**。

| 场景 | 压缩率 |
| --- | --- |
| 代码搜索（100 条结果） | 21% |
| SRE 排障 | 57% |
| 代码库探索 | 42% |
| issue 分类 | 30% |

重复 JSON 数组与日志行能清掉 90% 以上；散文和本就紧凑的输出几乎压不动。跑 \`headroom savings\` 拿你自己的数字，别照搬 README。

## 输出侧也要省

输出 token 在 Opus 级模型上比输入贵得多。开启：

\`\`\`bash
export HEADROOM_OUTPUT_SHAPER=1
headroom proxy --port 8787
\`\`\`

它做两件事：把「简洁些」的提示追加到 system prompt **末尾**（保住 prompt 缓存），以及在模型只是接着工具结果继续时降低思考强度。用 \`headroom output-savings\` 看结果——那是带置信区间的**估算值**，想要实测值就 \`export HEADROOM_OUTPUT_HOLDOUT=0.1\` 留一成会话做对照。
`,
      resources: [
        {
          kind: "html",
          title: "快速开始",
          url: "https://docs.headroomlabs.ai/docs/quickstart",
          note: "安装、三种形态与自检命令。第一次装完照这页走一遍再接代理。",
        },
        {
          kind: "html",
          title: "架构说明（ContentRouter / CCR）",
          url: "https://docs.headroomlabs.ai/docs/architecture",
          note: "讲清压缩发生在本机、原文如何缓存与取回。关心数据不出本机的看这页。",
        },
        {
          kind: "html",
          title: "GitHub 仓库",
          url: "https://github.com/headroomlabs-ai/headroom",
          note: "支持的代理清单、基准脚本与版本情况。要确认你的代理是否被 wrap 支持时查这里。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "ai-for-beginners",
    linksCheckedAt: "2026-10-14",
    name: "AI-For-Beginners",
    nameZh: "AI-For-Beginners 人工智能课程",
    aliases: ["ai for beginners", "AI-For-Beginners", "微软 AI 课程", "人工智能入门", "AI 课程"],
    summary: "微软的 12 周 24 节 AI 课程：从符号 AI、神经网络到 CV 与 NLP，TensorFlow 与 PyTorch 双实现。适合系统补基础的人；代价是内容停留在经典深度学习，不覆盖大模型与强化学习。",
    scenes: ["education"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["课程", "深度学习", "教程", "开源"],
    body: "这是微软的《Artificial Intelligence for Beginners》：12 周、24 节课，每节有讲解、测验和 Lab，代码用 TensorFlow 与 PyTorch 两套给，还包含 AI 伦理。它的特别之处是开头讲「老派」AI——知识表示、专家系统、本体与概念图（GOFAI），之后再进入神经网络与深度学习、面向图像与文本的神经架构，最后还有遗传算法与多智能体系统这些不太热门的分支。课程有官方 Mindmap，五十多种语言翻译由 GitHub Action 自动同步。\n要提前知道的边界，README 写得比大多数课程都清楚：它**不讲** AI 商业案例、**不讲**经典机器学习（另有 ML-for-Beginners）、**不讲** Cognitive Services / Azure OpenAI 这类现成服务、**不讲**具体云上 ML 框架、**不讲**对话机器人、**不讲**深度学习背后的数学（推荐 Goodfellow 那本书）。想学大模型应用开发的人会失望——它停在经典深度学习，README 自己也承认架构部分「在最新 SOTA 上可能略有欠缺」。\n两个实用信息：仓库含 50+ 语言翻译，直接 clone 非常大，README 给了 sparse checkout 命令（`git clone --filter=blob:none --sparse` 再 `git sparse-checkout set --no-cone '/*' '!translations' '!translated_images'`）；课程代码可以在 Binder 上直接跑，本地环境不是必需的。",
    officialUrl: "https://github.com/microsoft/AI-For-Beginners",
    officialLabel: "github.com/microsoft/AI-For-Beginners",
    links: {
      official: "https://github.com/microsoft/AI-For-Beginners",
      github: "https://github.com/microsoft/AI-For-Beginners",
    },
    whoFor: "想系统补齐 AI 基础的初学者和转行者：搞清神经网络为什么这样工作，能用 TensorFlow / PyTorch 写得出模型，而不是只会调 API。",
    whoNot: "想学大模型应用（RAG、Agent、微调）的人——这门课停在经典深度学习；也不适合想快速上手做出产品的人。",
    installTips: [
      "仓库含 50+ 语言翻译，直接 clone 很大；用 sparse checkout：`git clone --filter=blob:none --sparse https://github.com/microsoft/AI-For-Beginners.git`，然后 `git sparse-checkout set --no-cone '/*' '!translations' '!translated_images'`（Windows CMD 用双引号）。",
      "不想配环境就用 README 上的 Binder 链接，直接在浏览器里跑 notebook；每节课的 Lab 都有独立 README。",
      "环境搭建看第 0 课的 `lessons/0-course-setup/setup.md` 与 `how-to-run.md`，再按目录表一节节跟 notebook。",
      "中文读者直接进 `translations/zh-CN/README.md`，翻译由 GitHub Action 自动同步，比啃英文版省事。",
    ],
    alternatives: [],
    icon: {
      letter: "A",
      color: "#0078D4",
    },
    guide: {
      intro: "按第一次学这门课会卡在哪讲：它到底覆盖什么、不覆盖什么、怎么跳过五十多种语言翻译的巨大体积，以及代码要不要本地跑。",
      markdown: `## 先看「不覆盖什么」

README 把边界写得很清楚，省去了很多试错：

| 它讲 | 它不讲 |
| --- | --- |
| 符号 AI（知识表示、专家系统、本体） | AI 商业案例 |
| 神经网络与深度学习（TF + PyTorch） | 经典机器学习（另有 ML-for-Beginners） |
| 图像与文本的神经架构 | Cognitive Services / Azure OpenAI |
| 遗传算法、多智能体系统 | 云上 ML 框架（Azure ML、Databricks） |
| AI 伦理 | 对话机器人、深度数学 |

**想学大模型应用的人不适合这门课**——它停在 GAN、Autoencoder、VAE 这一代。README 自己也说架构部分在最新 SOTA 上可能略有欠缺。

## 别直接 clone

仓库带 50+ 语言翻译，完整 clone 会非常大。官方给的 sparse checkout：

\`\`\`bash
git clone --filter=blob:none --sparse https://github.com/microsoft/AI-For-Beginners.git
cd AI-For-Beginners
git sparse-checkout set --no-cone '/*' '!translations' '!translated_images'
\`\`\`

Windows CMD 把单引号换成双引号即可。这样下载快得多，且不影响完成课程。

## 代码不一定本地跑

README 顶部有 Binder 徽章，点进去直接在浏览器里运行 notebook。先确认自己会不会长期学，再决定要不要在本地配 TensorFlow / PyTorch 环境。

本地搭建看第 0 课：

- \`lessons/0-course-setup/setup.md\` —— 环境准备
- \`lessons/0-course-setup/how-to-run.md\` —— 怎么跑示例代码

## 中文读者

直接进 \`translations/zh-CN/README.md\`，另外还有 zh-HK / zh-MO / zh-TW 等变体。翻译由 GitHub Action 自动同步，不用等人工更新。

## 建议的读法

第一部分（1–3 章）里，符号 AI 那两节很容易被跳过，但它是后面理解「为什么需要神经网络」的铺垫，至少翻一遍。第三部分（CV）与第四部分（NLP）的 Lab 是真正花时间的地方，一个 Lab 跑通比十节课看完有用。
`,
      resources: [
        {
          kind: "html",
          title: "课程仓库（目录与章节表）",
          url: "https://github.com/microsoft/AI-For-Beginners",
          note: "12 周 24 节的完整目录、每节的 notebook 与 Lab 链接，以及多语言入口。选章节前先看这张表。",
        },
        {
          kind: "html",
          title: "第 0 课：环境搭建",
          url: "https://github.com/microsoft/AI-For-Beginners/blob/main/lessons/0-course-setup/setup.md",
          note: "本地跑 TensorFlow / PyTorch 示例前的环境准备步骤。不用 Binder 时照这页配。",
        },
        {
          kind: "html",
          title: "Microsoft Learn 配套集合",
          url: "https://learn.microsoft.com/en-us/collections/7w28iy2xrqzdj0",
          note: "官方整理的本课程附加资源集合，含 Azure 上的计算机视觉等内容。想把 Lab 放到云上跑时用。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "system-prompts-leaks",
    linksCheckedAt: "2026-10-14",
    name: "system_prompts_leaks",
    nameZh: "System Prompts Leaks 系统提示词合集",
    aliases: ["system prompts leaks", "system_prompts_leaks", "系统提示词", "提示词泄漏", "prompt 合集"],
    summary: "收录各主流聊天机器人与编码代理的系统提示词原文，按厂商 / 产品 / 模型分目录，更新很勤。适合做提示词工程与代理行为研究的人；代价是来源是第三方整理，不能当官方文档，版本要自己对。",
    scenes: ["code", "docs"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["提示词", "提示工程", "语料", "开源"],
    body: "这个仓库做的事很单一：把主流聊天机器人与编码代理的系统提示词原文收齐，按厂商 / 产品 / 模型分目录放着，并在 README 顶部维护一张「最近新增 / 变更」表，逐条标明内容与日期。覆盖面很广——Anthropic 侧有 Claude.ai 各模型、Claude Code（按模型与形态分：桌面版、云端、headless）、artifact types 的 SKILL.md、Claude Design / Cowork / Science、Microsoft 365 集成与注入提醒；OpenAI 侧有 ChatGPT 各版本与人格指令、Codex 各模型与模式（plan mode、auto-review、computer use）、API 注入提示；还有 Meta Muse、xAI Grok 等。\n它的价值在于两件别处做不了的事：一是横向对比——同一厂商不同版本之间加了什么、删了什么，能看出产品方向的调整；二是照着写——想让自己的 agent 有类似的行为约束，可以参考成熟提示词的结构与措辞，而不是从零摸索。外部认可也有：华盛顿邮报用它做过交互报道，Simon Willison 称它是「已知最详尽的泄露系统提示词集合」。\n边界要讲清楚：这些是第三方整理的泄露内容，**不是官方文档**，模型名与日期要自己对（顶部那张表就是用来对版本的）；厂商随时会改，今天的提示词下周就可能失效。照抄到自己的产品里之前也要想清楚——里面有大量针对特定产品的工具定义与合规约束，直接搬往往水土不服。协议是 CC0-1.0，README 也欢迎大家提 PR 补差异。",
    officialUrl: "https://github.com/asgeirtj/system_prompts_leaks",
    officialLabel: "github.com/asgeirtj/system_prompts_leaks",
    links: {
      official: "https://github.com/asgeirtj/system_prompts_leaks",
      github: "https://github.com/asgeirtj/system_prompts_leaks",
    },
    whoFor: "做提示词工程、研究代理行为边界、或想参考成熟提示词结构写自己 agent 的人；也适合跟踪各家产品策略变化的观察者。",
    whoNot: "想查官方使用说明的人——这里没有官方参数文档；也不适合把内容直接搬进生产产品的团队，里面充满针对特定产品的工具定义与合规约束。",
    installTips: [
      "不用安装：直接在 GitHub 上按目录浏览，README 顶部的「Most recent additions/changes」表标了每条的日期与链接，先对版本再看内容。",
      "想本地全文检索就 clone 下来搜；仓库就是一堆 Markdown 文件，没有构建步骤，也不需要任何依赖。",
      "找 Claude Code 相关的进 `Anthropic/claude-code/` 目录（按模型与形态分文件），Codex 进 `OpenAI/Codex/`，ChatGPT 主提示词在 `OpenAI/` 根目录。",
      "做行为研究时别只看主提示词：配套的 skills、slash commands、subagent 与注入提醒（如 `Anthropic/claude-code/skills`、`Anthropic/anthropic_reminders.md`）往往更能说明实际行为。",
    ],
    alternatives: [],
    icon: {
      letter: "S",
      color: "#5F4B8B",
    },
    guide: {
      intro: "按第一次翻这个仓库会卡在哪讲：目录是怎么组织的、怎么对上版本、除了主提示词还该看什么、以及为什么它不能当官方文档用。",
      markdown: `## 先看顶部那张表

README 的 **Most recent additions/changes** 表是这个仓库的索引，每行有：

- 内容（哪个模型 / 产品）
- 日期
- 直接链接到对应文件

**先对日期再看文件**。厂商改提示词比你想象的频繁，三个月前的链接内容可能已经和线上不一样了。

## 目录组织

| 你要看什么 | 去哪 |
| --- | --- |
| Claude.ai 各模型 | \`Anthropic/\`（如 \`claude-sonnet-5.5.md\`） |
| Claude Code | \`Anthropic/claude-code/\`（按模型 + 形态分：desktop / cloud / headless） |
| Claude 的 artifact 类型 | \`Anthropic/artifact-types/\`（Slides / Dashboard / Design / Docs 各自的 SKILL.md） |
| ChatGPT 主提示词 | \`OpenAI/\`（如 \`gpt-5.6-sol.md\`） |
| Codex | \`OpenAI/Codex/\`（含 plan_mode、auto-review、computer-use） |
| API 注入的提示词 | \`OpenAI/gpt-5.5-api.md\` 一类 |

## 别只看主提示词

真正决定行为的往往是配套文件：

- **skills / slash commands** —— \`Anthropic/claude-code/skills\`、\`Anthropic/claude-code/commands\`
- **subagent 提示词** —— \`Anthropic/claude-code/agents\`
- **注入提醒** —— \`Anthropic/anthropic_reminders.md\`（运行时追加的提醒，不在主提示词里）
- **人格指令** —— \`OpenAI/chatgpt-personality-instructions.md\`

只看主文件会漏掉大量实际约束。

## 两种正确用法

**横向对比**：把同一厂商相邻两个版本的文件并排看，加了什么、删了什么，比任何发布会都能说明产品方向。

**照着写结构**：想给自己的 agent 写行为约束时，参考成熟提示词是怎么组织的（先定身份、再定工具使用规则、再定边界与拒绝方式、最后给出格式要求）。

## 两个不要

- **不要当官方文档**：这是第三方整理的泄露内容，不是厂商发布的参数说明，也没有版本承诺。
- **不要直接抄进你的产品**：里面大量内容是针对特定产品的工具定义、合规要求与内部约定，脱离那个环境往往失效甚至有害。

协议是 CC0-1.0；发现不同结果可以提 PR，README 里欢迎。
`,
      resources: [
        {
          kind: "html",
          title: "仓库首页（最近更新表）",
          url: "https://github.com/asgeirtj/system_prompts_leaks",
          note: "顶部的最近新增 / 变更表是全仓索引，标了日期与链接。找某个模型时从这里进，别直接猜路径。",
        },
        {
          kind: "html",
          title: "Claude Code 提示词目录",
          url: "https://github.com/asgeirtj/system_prompts_leaks/tree/main/Anthropic/claude-code",
          note: "按模型与形态（desktop / cloud / headless）分的 Claude Code 提示词，另有 skills、commands、agents 子目录。做编码代理研究时看这里。",
        },
        {
          kind: "html",
          title: "Codex 提示词目录",
          url: "https://github.com/asgeirtj/system_prompts_leaks/tree/main/OpenAI/Codex",
          note: "Codex 各模型主提示词与 plan mode、auto-review、computer use 等模式提示。想对照另一家的做法时用。",
        },
      ],
    },
    license: "CC0-1.0",
  },
  {
    slug: "ai-engineering-from-scratch",
    linksCheckedAt: "2026-10-14",
    name: "ai-engineering-from-scratch",
    nameZh: "AI Engineering 从零实现课程",
    aliases: ["ai engineering from scratch", "AI 工程从零", "AI 工程课程", "528 lessons", "从零实现"],
    summary: "528 节课 20 个阶段的 AI 工程课程，自己实现模型内部、检索管线与代理运行时，附三个带本地批改器的项目。适合想补工程内功的人；代价是要真写代码，Python/TS/Rust 都会碰。",
    scenes: ["education", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["教程", "AI 工程", "项目实战", "开源"],
    body: "这个仓库的路线是「实现模型内部、检索管线与代理运行时」——不是教你调 API，而是让你自己写出来。规模是 528 节课、20 个阶段，涉及 Python、TypeScript、Rust、Julia，MIT 协议，网站 / 编码代理 / 本地跑代码三种学法都行。\n它和普通课程最大的差别在「项目挑战」：三个带阶段性 starter、参考实现和本地 grader 的项目，starter 在你实现之前是**故意失败的**。01 检索评估实验（Python 3.10+，做逐查询的 NDCG 对比，并能在发布检查里失败）；02 Agent Trace Debugger（TypeScript，Node.js 22.18+，解析 JSONL trace、做区间运算、产出可检视的时间线）；03 Tool Call Firewall（Rust，校验调用信封、角色与路径、消耗与请求绑定的一次性审批）。每个项目都写明了「你要留下什么产物」，比如 02 要求保住独占的 per-span token 计数，避免父子 span 重复计算。\n最方便的入口是把课程装成编码代理的 tutor：`npx skills add rohitg00/ai-engineering-from-scratch`，之后 Codex 用 `start-learning`、Claude Code 用 `/start-learning`。一次十题的摸底测验会把你映射到合适的起始阶段并生成 `LEARNING.md`；之后 `learn` 每次教一节（概念、数学、代码、测验），`course-guide` 直接跳到你卡住的那节。只想学 MCP 或只想学 Agent Skills 也各有 17 节 / 5 节的专项路线。\n代价：这是「从零实现」路线，不动手等于没学；环境也有硬要求（Node.js、npx、python3，以及一个支持 skill 的宿主和可写目录）。",
    officialUrl: "https://aiengineeringfromscratch.com",
    officialLabel: "aiengineeringfromscratch.com",
    links: {
      official: "https://aiengineeringfromscratch.com",
      github: "https://github.com/rohitg00/ai-engineering-from-scratch",
    },
    whoFor: "想把 AI 工程内功补上的人：能自己写出优化器、检索评估、trace 分析与工具调用边界，而不只会拼 API 与框架。",
    whoNot: "想快速做出产品的人——528 节的实现路线太慢；也不适合没有 Node.js / Python 环境、或不愿写代码的学习者。",
    installTips: [
      "不想装任何东西：直接上 aiengineeringfromscratch.com 读，不需要 clone 仓库，也没有构建步骤。",
      "装成编码代理的 tutor：`npx skills add rohitg00/ai-engineering-from-scratch`，安装时选宿主与 scope；Codex 用 `start-learning`，Claude Code 用 `/start-learning`，其他宿主按名字调用。",
      "跑项目前先确认版本：`node --version`、`npx --version`、`python3 --version`；检索项目要 Python 3.10+，Agent Trace Debugger 要 Node.js 22.18+。",
      "项目从仓库根目录跑：`python3 scripts/project_test.py retrieval-evaluation-lab --init learning-artifacts/retrieval-evaluation-lab`，再 `--stage 1 --path ... --strict`，最后 `--all --path ... --strict`。",
    ],
    alternatives: [],
    icon: {
      letter: "A",
      color: "#805AD5",
    },
    guide: {
      intro: "按第一次用会卡在哪讲：三种学法怎么选、把课程装进编码代理的命令、三个项目的运行方式，以及为什么 starter 一上来就是失败的。",
      markdown: `## 三种学法

| 学法 | 需要什么 |
| --- | --- |
| 网站 | 浏览器，什么都不装 |
| **编码代理当 tutor** | Node.js、\`npx\`、一个支持 skill 的宿主 |
| 本地跑项目 | \`python3\`（部分项目要 Node.js 22.18+ / Rust） |

推荐第二种——它就是为这个设计的：

\`\`\`bash
npx skills add rohitg00/ai-engineering-from-scratch
\`\`\`

装的时候选宿主和 scope（\`.claude/skills/\`、\`.cursor/skills/\`、\`.codex/skills/\` 等）。调用语法属于宿主，不属于 SKILL.md：

| 宿主 | 开始课程 | 阶段测验 |
| --- | --- | --- |
| Codex | \`start-learning\` | \`check-understanding 13\` |
| Claude Code | \`/start-learning\` | \`/check-understanding 13\` |
| 其他兼容宿主 | \`Use start-learning to begin the course.\` | \`Use check-understanding to quiz me on Phase 13.\` |

摸底测验会生成一份 \`LEARNING.md\` 学习计划；之后 \`learn\` 每次只教一节（概念、数学、代码、测验），\`course-guide\` 用来跳到卡住的那节。

## 只想学一块

- **只学 MCP**：用 \`learn-mcp\`（Claude Code 是 \`/learn-mcp\`），一条 17 节课的路线，生成 \`MCP-LEARNING.md\`
- **只学 Agent Skills**：用 \`learn-agent-skills\`，5 节课：契约、发现、调用、沙箱边界、发布评估与宿主可移植性

## 三个项目，starter 故意是坏的

别以为装坏了：**starter 在你实现之前就是会失败的**。

\`\`\`bash
python3 scripts/project_test.py retrieval-evaluation-lab \\
  --init learning-artifacts/retrieval-evaluation-lab

python3 scripts/project_test.py retrieval-evaluation-lab \\
  --stage 1 --path learning-artifacts/retrieval-evaluation-lab --strict

python3 scripts/project_test.py retrieval-evaluation-lab \\
  --all --path learning-artifacts/retrieval-evaluation-lab --strict
\`\`\`

三个项目分别是：

| 项目 | 语言 | 关键点 |
| --- | --- | --- |
| 01 检索评估实验 | Python 3.10+ | 逐查询 NDCG 对比，能作为发布检查失败掉 |
| 02 Agent Trace Debugger | TypeScript | JSONL 解析、区间运算、HTML 时间线 |
| 03 Tool Call Firewall | Rust | 调用信封校验、角色与路径检查、一次性审批 |

命令都从仓库根目录跑。每个项目都写明要保留什么产物——例如 02 要保住 per-span 的独占 token 计数，父子不能重复计。

## 环境不够就别硬上

没有 Node.js / npx / python3 / 支持的宿主 / 可写目录，就走网站读 \`docs/en.md\`。那条路线能学概念，但真实宿主的发现、调用、脚本与卸载验证得等环境齐了才能做。
`,
      resources: [
        {
          kind: "html",
          title: "课程官网",
          url: "https://aiengineeringfromscratch.com",
          note: "528 节课的在线阅读入口与学习路线。不想装任何东西就从这里开始。",
        },
        {
          kind: "html",
          title: "项目列表与参考实现",
          url: "https://aiengineeringfromscratch.com/projects.html",
          note: "三个项目的说明、分级 starter 与参考实现入口。动手前先看它要你交付什么。",
        },
        {
          kind: "html",
          title: "GitHub 仓库",
          url: "https://github.com/rohitg00/ai-engineering-from-scratch",
          note: "全部阶段目录、skills 定义与项目脚本。要给编码代理装 tutor 或本地跑 grader 时用。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "strix",
    linksCheckedAt: "2026-10-14",
    name: "strix",
    nameZh: "Strix AI 渗透测试代理",
    aliases: ["strix", "strix agent", "strix-agent", "AI 渗透测试", "AI 安全测试"],
    summary: "开源的 AI 渗透测试代理：真跑代码、真出 PoC 来验证漏洞，而不是静态扫描报一堆误报。适合对有授权的目标做上线前自查；代价是要 Docker 加自己的 LLM key，且只能用于自有资产。",
    scenes: ["code"],
    platforms: ["linux", "macos"],
    source: "opensource",
    tags: ["安全测试", "渗透测试", "AI 代理", "开源"],
    body: "Strix 是自主的 AI 渗透测试代理，定位是「像真人黑客一样干活」：动态跑你的代码、找漏洞、再用真实可用的 PoC 去验证，而不是像传统扫描器那样丢一堆误报。能力覆盖侦察、利用、验证，带 HTTP 拦截代理（Caido）、浏览器利用（XSS / CSRF / 点击劫持 / 认证绕过）、shell 与命令执行、Python 沙箱写 PoC、SAST + DAST，漏洞按 CVSS 打分并按 OWASP 分类。多代理编排会把侦察、利用、后利用拆给不同的 agent 并行跑。\n跑法很简单：`curl -sSL https://strix.ai/install | bash` 装 CLI，设 `STRIX_LLM` 与 `LLM_API_KEY`，然后 `strix --target ./app-directory`。目标也可以是 GitHub 仓库 URL、线上站点，或者 API 契约 + 实际 base URL（`strix --target ./openapi.yaml --target https://api.your-app.com`），后者让它直接测声明的每个端点而不是靠爬。首次运行会自动拉沙箱 Docker 镜像，结果写进 `strix_runs/<run-name>`，`strix view` 起本地看板（默认只绑 127.0.0.1 并打印带 token 的链接，别乱分享）。CI 里用 `strix -n -t ./ --scan-mode quick`，发现漏洞时以非零码退出。\n三点必须讲清。一是**授权**：这是渗透测试工具，只能对自有或明确书面授权的目标使用。二是**成本与依赖**：需要运行中的 Docker 和任意受支持 provider 的 LLM key，也可以 `strix auth login chatgpt` 后按 `chatgpt/<model>` 走 ChatGPT Plus/Pro 订阅。三是**配置会落盘**：`STRIX_LLM` 等会自动存到 `~/.strix/cli-config.json`；升级要区分装法，standalone 用 `strix --update`，pipx / uv / pip 装的它会直接打印对应的升级命令。",
    officialUrl: "https://strix.ai",
    officialLabel: "strix.ai",
    links: {
      official: "https://strix.ai",
      github: "https://github.com/usestrix/strix",
    },
    whoFor: "开发与安全团队在发布前对自有应用做一次自动化安全自查，以及把安全扫描接进 PR 流程的人。",
    whoNot: "想拿它扫别人站点的人——只能用于自有或授权目标；也不适合没有 Docker 环境、或不愿为 LLM 调用付费的人。",
    installTips: [
      "前提：Docker 正在运行，加任意受支持 provider 的 LLM API key（OpenAI、Anthropic、Google 等，也可 `strix auth login chatgpt` 走 ChatGPT 订阅）。",
      "安装与首次扫描：`curl -sSL https://strix.ai/install | bash`，`export STRIX_LLM=\"openrouter/z-ai/glm-5.3\"`、`export LLM_API_KEY=\"...\"`，然后 `strix --target ./app-directory`；首次运行会自动拉沙箱镜像。",
      "看结果用 `strix view`（最近一次）或 `strix view my-run-name`；要固定端口对外用 `strix view --host 0.0.0.0 --port 8080 --no-open`，默认只绑 127.0.0.1 并打印带 token 的链接。",
      "升级看装法：standalone 用 `strix --update`；pipx / uv / pip 装的它会直接打印对应命令（`pipx upgrade strix-agent` / `uv tool upgrade strix-agent` / `pip install --upgrade strix-agent`）。",
    ],
    alternatives: [],
    icon: {
      letter: "S",
      color: "#9B2C2C",
    },
    guide: {
      intro: "按第一次跑会卡在哪讲：授权这条底线、三类目标的写法、CI 里怎么接、成本从哪来、以及本地看板为什么不默认对外。",
      markdown: `## 先说授权

这是渗透测试工具。**只对自己拥有或有明确书面授权的目标使用**。这条不是免责声明式的套话：它会真的去跑利用、发请求、执行命令。

## 装与第一次扫描

\`\`\`bash
curl -sSL https://strix.ai/install | bash

export STRIX_LLM="openrouter/z-ai/glm-5.3"
export LLM_API_KEY="your-api-key"

strix --target ./app-directory
\`\`\`

前提只有两个：**Docker 正在运行**，以及一个受支持 provider 的 LLM key。首次运行会自动拉沙箱镜像，结果写到 \`strix_runs/<run-name>\`。

配置会自动存进 \`~/.strix/cli-config.json\`，不用每次重填。

## 三类目标

\`\`\`bash
strix --target ./app-directory              # 本地代码
strix --target https://github.com/org/repo  # 仓库 URL
strix --target https://your-app.com         # 黑盒站点
\`\`\`

有 API 契约时别让它自己爬，直接给契约 + 实际地址：

\`\`\`bash
strix --target ./openapi.yaml --target https://api.your-app.com
strix --target postman://<collection-uuid> --target https://api.your-app.com
\`\`\`

需要登录态就加指令：

\`\`\`bash
strix --target https://your-app.com --instruction "Perform authenticated testing using credentials: user:pass"
\`\`\`

## 接进 CI

\`\`\`yaml
- name: Run Strix
  env:
    STRIX_LLM: \${{ secrets.STRIX_LLM }}
    LLM_API_KEY: \${{ secrets.LLM_API_KEY }}
  run: strix -n -t ./ --scan-mode quick
\`\`\`

要点：\`-n\` 是非交互模式，发现漏洞时**以非零码退出**，正好用来卡住 PR；checkout 要 \`fetch-depth: 0\`，因为在 PR 场景里它按改动文件来界定快速评审的范围。

## 成本与模型

两种付费方式：自己的 LLM key，或者 \`strix auth login chatgpt\` 后用 \`chatgpt/<model>\` 走 ChatGPT Plus / Pro 订阅。长扫描的 token 消耗不小，先在单目录上试一次再铺开。

## 看板默认只给自己

\`\`\`bash
strix view                                  # 最近一次
strix view my-run-name                      # 指定某次
strix view --host 0.0.0.0 --port 8080 --no-open   # 需要固定端口对外时
\`\`\`

默认绑 \`127.0.0.1\`，并打印一个带 token 的链接——**那个链接等于该次运行的访问权**，别随手转发。UI 是预置好的，数据不出本机。
`,
      resources: [
        {
          kind: "html",
          title: "官方文档",
          url: "https://docs.strix.ai",
          note: "快速开始、支持的 LLM provider、CLI 参考与 CI/CD 集成。第一次跑之前先看 Quickstart 与 llm-providers。",
        },
        {
          kind: "html",
          title: "CLI 参考",
          url: "https://docs.strix.ai/usage/cli",
          note: "全部选项：扫描模式、diff 范围、指令文件与预算。要控制成本与扫描范围时查这页。",
        },
        {
          kind: "html",
          title: "GitHub 仓库",
          url: "https://github.com/usestrix/strix",
          note: "安装脚本、GitHub Actions 示例与 MCP 服务器配置方式。要把扫描接进流水线时看这里。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "openmontage",
    linksCheckedAt: "2026-10-14",
    name: "OpenMontage",
    nameZh: "OpenMontage 智能体视频制作系统",
    aliases: ["openmontage", "open montage", "AI 视频制作", "agentic 视频", "视频流水线"],
    summary: "把编码代理变成视频工作室：12 条流水线、700+ 技能与制作知识文件，从脚本、素材、配音到成片全包。适合批量产短视频的人；代价是要自备一堆付费 API key，成本按条算。",
    scenes: ["photo", "design"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["视频制作", "Agent Skill", "AI 生成", "开源"],
    body: "OpenMontage 是给编码代理用的一套 agentic 视频制作系统：你对 Claude Code / Cursor / Copilot / Windsurf / Codex 说一句需求，它做联网调研、写脚本、生成素材、配音、找免版税音乐、烧字幕、合成成片。仓库里有 12 条生产流水线、100+ 工具和 700+ 技能与制作知识文件。\n它特意强调了一个区分：不只是「把几张图动起来就叫视频」，还能走真实素材路线——从免费素材库与开放档案建语料、检索真实运动片段、剪进时间线再渲染出成品。README 里每支样片都标了用了什么工具和花了多少钱（一支 60 秒动画短片 $1.33，一支 50 秒竖版约 $4），这个习惯值得学。另一个更实用的入口是「从你喜欢的视频开始」：贴一个 YouTube / Short / Reel / TikTok 链接或本地片段，代理分析字幕、节奏、场景、关键帧与风格，给出 2–3 个差异化概念、诚实的工具路径和成本估算，并先出样片。\n代价很实在。它是**要花钱的**：FAL、Atlas Cloud、Kling、Pexels、Pixabay 这些 key 全部可选，但每多一把钥匙就多一批工具，免费素材路线之外的画面基本都得按次付费。环境也要 Python 3.10+、FFmpeg 和 Node.js 18+。协议是 AGPL-3.0，改了要一并开源。另外它有个特色组件 Backlot（本地故事板）：`python -m backlot open` 看所有项目，资产生成会停在逐场景的 contact sheet 上等你批准后再渲染——这个审批闸门能直接省掉「渲完了才发现不对」的浪费。",
    officialUrl: "https://www.openmontage.video",
    officialLabel: "www.openmontage.video",
    links: {
      official: "https://www.openmontage.video",
      github: "https://github.com/calesthio/OpenMontage",
    },
    whoFor: "要批量产短视频（解说、产品片、竖版内容）的人，尤其是想把制作流程交给编码代理、并且愿意按条付素材费的团队。",
    whoNot: "预算为零的人——免费素材路线之外的画面都要付费；也不适合想用拖拽式界面做视频的人，它没有自己的 GUI，必须挂在编码代理上。",
    installTips: [
      "前提：Python 3.10+、FFmpeg（`brew install ffmpeg` / `sudo apt install ffmpeg`）、Node.js 18+，以及一个能读文件并执行命令的编码代理（Claude Code、Cursor、Copilot、Windsurf、Codex 均可）。",
      "`git clone https://github.com/calesthio/OpenMontage.git && cd OpenMontage && make setup`；没有 make 就手工建 venv、装 requirements、进 remotion-composer 跑 npm install，再 `python -m pip install piper-tts` 并 `cp .env.example .env`。",
      "Windows 上 `npm install` 报 `ERR_INVALID_ARG_TYPE` 就改用 `npx --yes npm install`；PowerShell 的等价命令 README 里也给了。",
      "API key 全部可选、按需往 .env 加：`FAL_KEY`（FLUX 图 + Veo / Kling / MiniMax 视频）、`ATLASCLOUD_API_KEY`、`KLING_API_KEY`、`PEXELS_API_KEY`、`PIXABAY_API_KEY`（后两个是免费素材）。",
    ],
    alternatives: [],
    icon: {
      letter: "O",
      color: "#B7791F",
    },
    guide: {
      intro: "按第一次跑会卡在哪讲：四个前置、make setup 到底装了什么、从参考视频起步那条更快的路径、以及 Backlot 的审批闸门怎么帮你省钱。",
      markdown: `## 四个前置，缺一个就跑不动

- **Python 3.10+**
- **FFmpeg**（\`brew install ffmpeg\` / \`sudo apt install ffmpeg\`）
- **Node.js 18+**
- **一个 AI 编码助手**：Claude Code、Cursor、Copilot、Windsurf 或 Codex

\`\`\`bash
git clone https://github.com/calesthio/OpenMontage.git
cd OpenMontage
make setup
\`\`\`

没有 \`make\` 时按 README 的手工步骤来：建 venv、装 requirements、进 \`remotion-composer\` 跑 \`npm install\`、装 \`piper-tts\`、复制 \`.env.example\` 成 \`.env\`。Windows 上 \`npm install\` 报 \`ERR_INVALID_ARG_TYPE\` 就换成 \`npx --yes npm install\`。

## 从参考视频起步更快

对着空白 prompt 想创意很慢。README 推荐的方式是贴一条你喜欢的视频（YouTube / Short / Reel / TikTok / 本地片段），让代理分析字幕、节奏、场景、关键帧与风格，然后你会拿到：

- 2–3 个**差异化概念**
- 一条**诚实的工具路径**
- 目标时长下的**成本估算**
- 一个**样片**

\`\`\`text
Here's a YouTube Short I love. Make me something like this, but about quantum computing.
\`\`\`

关键在「成本估算在生成之前」——这能避免跑完才发现超预算。

## 用 Backlot 在渲染前卡一道

\`\`\`bash
python -m backlot open                  # 本机所有项目
python -m backlot open <project-id>     # 某次生产的实时看板
python scripts/backlot_simulate_run.py  # 没跑过就看一个模拟的
\`\`\`

Backlot 是本地故事板，生产一开始会自动打开。它最重要的作用是把**资产生成停在逐场景的 contact sheet 上**（每条 take、prompt、单资产成本、质量分），你批准之后才渲染。省的就是「渲完才发现画面不对」的那笔钱和那几小时。

跑完还能 \`▶ REPLAY RUN\`，按时间戳整条回放。

## 成本要自己盯

样片都标了实际花费：60 秒动画短片 $1.33、50 秒竖版约 $4、七场景展示约 $5。费用主要来自图像 / 视频生成 API。想压成本就多用 Pexels / Pixabay 的免费素材路线（真实素材剪辑），少用纯生成。

## 协议与定位

AGPL-3.0，改了要一并开源。它不是一个独立软件——**必须挂在一个能读文件、能执行代码的编码代理上**，图与片的质量也随你用的模型和代理变化。
`,
      resources: [
        {
          kind: "html",
          title: "官网",
          url: "https://www.openmontage.video",
          note: "样片、流水线总览与上手入口。判断它能不能做你想要的片型，先看样片和它们标注的成本。",
        },
        {
          kind: "html",
          title: "Providers 说明（API key 与成本）",
          url: "https://github.com/calesthio/OpenMontage/blob/main/docs/PROVIDERS.md",
          note: "各家图像 / 视频 / 配音 provider 的 key、能力与计费方式。配 .env 前必读，直接决定你能跑哪条流水线。",
        },
        {
          kind: "html",
          title: "GitHub 仓库与 Agent Guide",
          url: "https://github.com/calesthio/OpenMontage",
          note: "安装步骤、12 条流水线定义与 AGENT_GUIDE.md。让代理接管生产前，先让它读 AGENT_GUIDE。",
        },
      ],
    },
    license: "AGPL-3.0",
  },
  {
    slug: "mem0",
    linksCheckedAt: "2026-10-14",
    name: "mem0",
    nameZh: "mem0 智能体记忆层",
    aliases: ["mem0", "mem zero", "mem0ai", "记忆层", "长期记忆"],
    summary: "给 AI 应用加记忆层：分 User / Session / Agent 三级记住偏好，跨会话检索。适合做长期陪伴型助手与客服；代价是默认依赖 OpenAI 做抽取与嵌入，且自托管现已默认开启鉴权。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["记忆", "AI 应用", "向量检索", "开源"],
    body: "mem0 做的是记忆这一层：把 User / Session / Agent 三级状态分开存，做自适应个性化，跨会话检索。用法分三种——库（`pip install mem0ai`）、自托管服务端（`cd server && make bootstrap` 或 `docker compose up -d`）、云平台（app.mem0.ai 注册即用）。代码层面就是 add 与 search 两个动作：检索相关记忆拼进 system prompt，再把这轮对话 add 回去。\n2026 年 4 月它换了新的记忆算法，README 把变化讲得很具体：单次 LLM 调用的 ADD-only 抽取（不再 UPDATE / DELETE，记忆只增不覆盖）、agent 生成的确认为一等公民、实体链接、语义 + BM25 关键词 + 实体匹配的多信号融合检索、以及时间感知排序。官方给的分数是 LoCoMo 92.5、LongMemEval 94.4、BEAM(1M) 64.1，p50 延迟 1 秒左右，但**那是托管平台的成绩，含开源 SDK 没有的优化，开源用户应预期方向一致但数字不同**。\n两个坑。一是**默认依赖 OpenAI**：默认 LLM 是 gpt-5-mini、默认嵌入是 text-embedding-3-small，要换得查 Supported LLMs / Embeddings 文档；自托管想用混合检索（语义 + 关键词 + 实体）官方建议至少 Qwen 600M 级别的嵌入模型，装法是 `pip install mem0ai[nlp]` 加 `python -m spacy download en_core_web_sm`。二是**自托管现在默认开启鉴权**：从无鉴权的旧版升级要设 `ADMIN_API_KEY`、通过向导注册管理员，或用 `AUTH_DISABLED=true`（仅限本地开发）。",
    officialUrl: "https://mem0.ai",
    officialLabel: "mem0.ai",
    links: {
      official: "https://mem0.ai",
      github: "https://github.com/mem0ai/mem0",
    },
    whoFor: "做客服机器人、个人助理、长期陪伴型应用的人：需要跨会话记住用户偏好与历史，而不是每次从零开始。",
    whoNot: "只需要单次会话内上下文的应用——加一层记忆只是增加延迟与成本；也不适合完全不接受 OpenAI 默认依赖、又不愿自配 LLM 与嵌入模型的团队。",
    installTips: [
      "只是试试就装库：`pip install mem0ai`（Node 用 `npm install mem0ai`）；要混合检索（BM25 + 实体抽取）用 `pip install mem0ai[nlp]` 再加 `python -m spacy download en_core_web_sm`。",
      "自托管推荐一条命令：`cd server && make bootstrap`（起栈、建管理员、发第一个 API key）；手动版是 `cd server && docker compose up -d`，然后浏览器打开 http://localhost:3000 走向导。",
      "从无鉴权的旧版升级要先处理鉴权：设 `ADMIN_API_KEY` 或走注册向导；`AUTH_DISABLED=true` 仅限本地开发。",
      "终端管记忆用 CLI：`npm install -g @mem0/cli`（或 `pip install mem0-cli`），`mem0 add \"Prefers dark mode and vim keybindings\" --user-id alice`、`mem0 search \"...\" --user-id alice`。",
    ],
    alternatives: [],
    icon: {
      letter: "M",
      color: "#2C5282",
    },
    guide: {
      intro: "按第一次接入会卡在哪讲：三种形态怎么选、最小可用代码长什么样、默认模型怎么换、以及自托管升级后那个鉴权开关。",
      markdown: `## 先选形态

| 形态 | 怎么用 | 适合 |
| --- | --- | --- |
| 库 | \`pip install mem0ai\` | 先试、做原型 |
| 自托管服务端 | \`cd server && make bootstrap\` | 团队，跑在自己基础设施上 |
| 云平台 | 到 app.mem0.ai 注册 | 零运维的生产使用 |

只有库形态没有 dashboard，也没有鉴权与 API key；这两样从自托管开始才有。

## 最小可用代码

\`\`\`python
from openai import OpenAI
from mem0 import Memory

openai_client = OpenAI()
memory = Memory()

def chat_with_memories(message: str, user_id: str = "default_user") -> str:
    relevant = memory.search(query=message, filters={"user_id": user_id}, top_k=3)
    memories_str = "\\n".join(f"- {entry['memory']}" for entry in relevant["results"])

    system_prompt = f"You are a helpful AI. Answer based on query and memories.\\nUser Memories:\\n{memories_str}"
    messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": message}]
    response = openai_client.chat.completions.create(model="gpt-5-mini", messages=messages)
    assistant_response = response.choices[0].message.content

    messages.append({"role": "assistant", "content": assistant_response})
    memory.add(messages, user_id=user_id)
    return assistant_response
\`\`\`

就两个动作：**检索 → 拼进 system prompt → 把本轮 add 回去**。

## 默认依赖 OpenAI，要换早换

- 默认 LLM：\`gpt-5-mini\`
- 默认嵌入：\`text-embedding-3-small\`

换模型看官方的 Supported LLMs / Embeddings 文档。想要混合检索（语义 + 关键词 + 实体提升），官方建议**至少 Qwen 600M 级别的嵌入模型**，并安装 NLP 支持：

\`\`\`bash
pip install mem0ai[nlp]
python -m spacy download en_core_web_sm
\`\`\`

## 自托管：鉴权现在默认开

这是升级时最容易踩的一条。**自托管默认开启鉴权**，从无鉴权的旧构建升上来要三选一：

1. 设 \`ADMIN_API_KEY\`
2. 通过向导注册一个管理员
3. 本地开发才用 \`AUTH_DISABLED=true\`

\`\`\`bash
cd server && make bootstrap     # 推荐：起栈 + 建管理员 + 发第一个 key
cd server && docker compose up -d   # 手动：起栈后走浏览器向导
\`\`\`

## 新算法意味着什么

2026 年 4 月后：**单次 LLM 调用的 ADD-only 抽取**，记忆只增不覆盖。好处是少了 UPDATE / DELETE 的额外调用；代价是纠错只能靠新增记忆去覆盖语义，旧条目仍在库里。做合规删除需求时要自己补一层。

官方分数（LoCoMo 92.5 等）来自**托管平台**，含开源 SDK 没有的优化，开源部署请按「方向一致、数字不同」来预期。
`,
      resources: [
        {
          kind: "html",
          title: "Quickstart 文档",
          url: "https://docs.mem0.ai/quickstart",
          note: "库 / 自托管 / 云三条路径的最小接入步骤与 API 参考。第一次接照这页走。",
        },
        {
          kind: "html",
          title: "自托管搭建与升级说明",
          url: "https://docs.mem0.ai/open-source/setup",
          note: "make bootstrap 流程、鉴权开关与旧版升级注意事项。自托管或从旧版升级前必读。",
        },
        {
          kind: "html",
          title: "GitHub 仓库（含 Agent Skills）",
          url: "https://github.com/mem0ai/mem0",
          note: "算法变更说明、CLI 用法与可直接装进编码代理的 skills。想让代理帮你接入时用 /mem0-integrate。",
        },
      ],
    },
    license: "Apache-2.0",
  },
  {
    slug: "anything-llm",
    linksCheckedAt: "2026-10-14",
    name: "AnythingLLM",
    nameZh: "AnythingLLM 本地文档问答",
    aliases: ["anythingllm", "anything llm", "AnythingLLM", "本地知识库", "私有 ChatGPT"],
    summary: "一体化、本地优先的 AI 应用：接本地或云端 LLM、吃文档、带多用户权限与无代码 Agent 构建器。适合在内网给团队搭私有问答；代价是多用户只在 Docker 版，且默认带遥测。",
    scenes: ["office", "tools"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["知识库", "本地大模型", "多用户", "开源"],
    body: "AnythingLLM 是一个 all-in-one 的 AI 应用：接你喜欢的本地或云端 LLM，把文档喂进去，几分钟开聊，自带 agent、向量库与文档处理管线。模型侧支持得极宽——llama.cpp 兼容模型、OpenAI、Azure、Bedrock、Anthropic、Gemini、Ollama、LM Studio、LocalAI、DeepSeek、Groq、Mistral、LiteLLM 等三十多家；向量库默认 LanceDB，也能换 PGVector、Pinecone、Chroma、Weaviate、Qdrant、Milvus、Zilliz；嵌入、TTS、STT 各有默认与可选项。\n它比「一个聊天界面」多的部分在企业与自动化：动态模型路由（按规则把对话分给最合适的模型）、自动与用户管理的记忆、cron 定时任务、智能技能选择（官方称每次查询最多省 80% token）、无代码 Agent 构建器（Agent Flows）、MCP 兼容，以及可嵌入网站的聊天挂件。\n三点要提前知道。一是**多用户只属于 Docker 版**——桌面版（Mac / Windows / Linux）是单机的，要权限、多人实例和嵌入挂件必须走 Docker 部署。二是**默认带遥测**：收集安装类型、文档增删事件、向量库类型、模型 tag、发消息事件，不收集内容与 IP，provider 是 PostHog；关掉的方式是设 `DISABLE_TELEMETRY=true` 或在侧栏 Privacy 里关——但即便关掉，用外部 LLM / 向量库、从 `cdn.anythingllm.com` 拉模型、从 githubusercontent 取缓存文件仍会有出站连接。三是它是 monorepo（frontend / server / collector / docker / embed / browser-extension），改代码就从根目录 `yarn setup` 填 .env（务必填 server/.env.development），再分别 `yarn dev:server`、`yarn dev:frontend`、`yarn dev:collector`。",
    officialUrl: "https://anythingllm.com",
    officialLabel: "anythingllm.com",
    links: {
      official: "https://anythingllm.com",
      github: "https://github.com/Mintplex-Labs/anything-llm",
    },
    whoFor: "要在内网给团队搭一套私有 ChatGPT 的人：文档不能出网、需要多人分权限、还想接定时任务与 Agent。",
    whoNot: "只想单机自己跟文档聊天的人——Ollama + 一个轻量界面就够；也不适合对出站连接有硬性审计要求的环境，遥测与 CDN 拉取要逐项确认。",
    installTips: [
      "桌面版（Mac / Windows / Linux）从 anythingllm.com/download 下；要多人、权限和可嵌入挂件必须用 Docker 版。",
      "官方与社区维护了十来种部署模板（Docker、AWS、GCP、DigitalOcean、Render、Railway、Elestio、Northflank、Sealos、Easypanel）；不用 Docker 看仓库里的 BARE_METAL.md。",
      "在意隐私就先关遥测：服务端或 Docker 的 .env 里设 `DISABLE_TELEMETRY=true`，也可以在应用内 侧栏 > Privacy 里关。",
      "改代码：`yarn setup` 生成各部分的 .env（务必填 server/.env.development），再 `yarn dev:server`、`yarn dev:frontend`、`yarn dev:collector` 分别起。",
    ],
    alternatives: [],
    icon: {
      letter: "A",
      color: "#1A365D",
    },
    guide: {
      intro: "按第一次部署会卡在哪讲：桌面版与 Docker 版的能力差、模型与向量库怎么选、遥测怎么关，以及改代码时六个目录分别是什么。",
      markdown: `## 桌面版 vs Docker 版

这是第一个岔路，而且**不是能力多少的问题，是有没有的问题**：

| | 桌面版 | Docker 版 |
| --- | --- | --- |
| 安装 | 下载安装包 | Docker / 云模板 |
| 多用户与权限 | **没有** | 有 |
| 可嵌入网站挂件 | 没有 | 有 |
| 适合 | 单机自用 | 团队、内网部署 |

要给别人用，就直接上 Docker 版，别在桌面版上试。

## 选模型与向量库

默认就能跑：内置 Native Embedder + **LanceDB** 向量库，不需要额外服务。

要换的话，README 列的支持面很宽：

- **LLM**：llama.cpp 兼容模型、OpenAI、Azure、Bedrock、Anthropic、Gemini、Ollama、LM Studio、LocalAI、DeepSeek、Groq、Mistral、LiteLLM 等三十多家
- **向量库**：LanceDB（默认）、PGVector、Pinecone、Chroma、Weaviate、Qdrant、Milvus、Zilliz
- **语音**：内置转录，TTS 可选 PiperTTSLocal（浏览器内）、OpenAI TTS、ElevenLabs

先跑通默认组合，再按需要替换，比一上来就配一堆外部服务省时间。

## 关遥测（如果需要在意的项目里用）

默认开启，收集的是：安装类型、文档增删**事件**（不含文档内容）、向量库类型、LLM provider 与模型 tag、发消息**事件**。不收集 IP 与内容，provider 是 PostHog。

\`\`\`bash
DISABLE_TELEMETRY=true   # 写在 server 或 docker 的 .env 里
\`\`\`

也可以在应用内 侧栏 > Privacy 里关。要自己核对，README 给了搜 \`Telemetry.sendTelemetry\` 调用点的链接。

**关掉之后仍有出站连接**：外部 LLM / 嵌入 / 向量库各自的服务、\`cdn.anythingllm.com\`（拉模型的镜像 CDN，对网络受限地区反而有用）、github / githubusercontent（缓存用的 flat 文件）。有严格出站审计的环境要逐项确认。

## 它不只是聊天

值得单独摸一遍的功能：

- **动态模型路由**：按规则把对话分给最合适的模型
- **智能技能选择**：官方称每次查询最多省 80% token
- **Agent Flows**：无代码 Agent 构建器
- **定时任务**：cron，带完整 agent 能力
- **MCP 兼容**

这几项决定了它和「一个本地聊天框」的差距。

## 想改代码

monorepo 六个部分：\`frontend\`（Vite + React）、\`server\`（Express，管向量库与 LLM）、\`collector\`（文档解析）、\`docker\`、\`embed\`（网页挂件）、\`browser-extension\`。

\`\`\`bash
yarn setup          # 生成各部分的 .env，务必填 server/.env.development
yarn dev:server
yarn dev:frontend
yarn dev:collector
\`\`\`
`,
      resources: [
        {
          kind: "html",
          title: "官网与下载",
          url: "https://anythingllm.com",
          note: "桌面版下载与产品总览。先判断要不要 Docker 版（多用户 / 挂件）再看部署页。",
        },
        {
          kind: "html",
          title: "官方文档",
          url: "https://docs.anythingllm.com",
          note: "模型路由、记忆、定时任务、Agent Flows、MCP 与部署方式的完整说明。配置前先查这站。",
        },
        {
          kind: "html",
          title: "GitHub 仓库（部署模板与裸机安装）",
          url: "https://github.com/Mintplex-Labs/anything-llm",
          note: "十来种一键部署模板，以及不用 Docker 的 BARE_METAL.md。内网部署时看这里。",
        },
      ],
    },
    license: "MIT",
  },
  {
    slug: "rustdesk",
    linksCheckedAt: "2026-10-14",
    name: "RustDesk",
    nameZh: "RustDesk 远程桌面",
    aliases: ["rustdesk", "rust desk", "远程桌面", "远程控制", "自建远程"],
    summary: "开源远程桌面，能自建中继服务器把数据留在自己手里。适合被 TeamViewer 商用检测卡住、又不想按年付费的人。",
    scenes: ["tools", "office"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["远程桌面", "远程控制", "自建服务", "开源"],
    body: "RustDesk 是用 Rust 写的远程桌面，对标 TeamViewer / AnyDesk，差异在于它是开源且可以自己搭中继服务器。商业远控软件把「商用用途」做成付费判定：个人免费档被检测到商用就限速断连，判定规则不公开也不可申诉。RustDesk 的解决办法是把服务器也开源——装配套的 hbbs（ rendezvous，负责配对）与 hbbr（relay，负责中转），所有连接只经过你自己的机器。\n没打算自建也能直接用：默认连官方提供的公共服务器，开箱免配置，装好就有 ID 和密码，两端输入即可连。这一步不需要注册账号。真正的差别在你需不需要「可控」——自建之后，延迟、带宽、谁的数据都不再依赖第三方，代价是要维护一台有公网 IP 的服务器，并且自己处理升级与安全。\n常见的误用是把它当成长期的无人运维通道却不改默认设置。默认的固定密码如果被扫到，等于把机器开放给发现它的人。无人值守场景要改成强密码或配置密钥认证，别只依赖随机 ID。",
    officialUrl: "https://rustdesk.com/",
    officialLabel: "rustdesk.com",
    links: {
      official: "https://rustdesk.com/",
      github: "https://github.com/rustdesk/rustdesk",
    },
    whoFor: "需要远程访问自己设备的人：家里 NAS / 开发机的维护、帮家人处理电脑故障、TeamViewer 判定商用后的替代方案。",
    whoNot: "只想偶尔连一次且不在乎商用检测的人，或没有公网服务器也不打算折腾——用默认公共服务器即可，不必强行自建。",
    installTips: ["直接官网下载对应系统的安装包即可，Windows / macOS / Linux 都有现成构建，不需要自己编译 Rust。", "客户端便携版双击就能跑，控制端与被控端是同一个程序，两侧都装它。", "要自建服务器请另行部署 rustdesk-server 的 hbbs 与 hbbr，客户端里填服务器地址与 key；只有windows/macOS/linux 官方二进制，别把它和客户端装在同一台机器上抢端口。"],
    alternatives: [],
    icon: {
      letter: "R",
      color: "#2C5C8F",
      simpleIcon: "rustdesk",
    },
    guide: {
      intro: "按第一次使用的顺序讲：ID 与密码怎么用、什么时候才需要自建服务器、以及无人值守场景下必须改的安全设置。",
      markdown: `## 先明白三个名字

第一次打开会看到三样东西：**ID** 是一台机器的标识，**密码** 是一次性的随机口令，还有一个可以自己设置的**固定密码**。

最简单的连法：被控那台把 ID 报给控制方，控制方输入 ID 后按提示填密码，连上。这一步用的是官方公共服务器，不需要注册账号，也不需要任何配置。

## 什么时候才需要自建

默认所有连接的数据都经过 RustDesk 官方提供的中继服务器。**性能不是自建的主要理由，数据主权才是**——想要连接不经第三方，就得自己部署服务。

自建需要一台有公网 IP 的服务器，跑两个进程：

- \`hbbs\`：rendezvous，负责两端配对与 ID 注册
- \`hbbr\`：relay，在直连失败时负责中转流量

两者合起来才是完整的自建服务，只跑一个的话会在特定网络环境下卡住。

配置完成后，客户端里填入服务器地址与 key。若不想改自己的服务，也可以选它的付费云档位，本质就是让别人替你维护这两个进程。

## 无人值守必须改默认设置

这一段是安全底线：**长期使用请把随机密码换成自定义的强密码**。

随机密码每次重启可能变化，反过来导致你连不上自己的机器；而固定密码如果太简单，被扫到就等于把整机开放出去。两者要平衡：

1. 设置一个足够长的固定密码，或
2. 使用密钥认证，避免密码本身成为攻击面

此外注意临时访问与持续访问的区别——临时连接用完即走，长期无人值守才需要放宽 sleeper（常驻权限）。给一台长期在线的机器配上弱口令，是最常见的踩坑方式。

## 连不上时的排查顺序

先看两端是否都在线、ID 是否变动过；再看中间的中继是否可达。公司或校园网屏蔽出站时会<｜hy_place▁holder▁no▁813｜>中继，表现为「双方都在线但永远转圈」——此时自建服务器换端口通常能解决。
`,
      resources: [
        {
          kind: "html",
          title: "官网与下载",
          url: "https://rustdesk.com/",
          note: "各系统的安装包下载入口，以及付费云档位与商业版的说明。想判断要不要自建先看这一页。",
        },
        {
          kind: "html",
          title: "自建服务器说明",
          url: "https://rustdesk.com/server",
          note: "官方对自建 hbbs / hbbr 的说明，含部署前提。决定是否投入维护成本前必读。",
        },
        {
          kind: "html",
          title: "版本发布记录",
          url: "https://github.com/rustdesk/rustdesk/releases",
          note: "查最新客户端安装包与安全更新。自建时服务端与客户端版本最好保持兼容。",
        },
      ],
    },
    license: "AGPL-3.0",
  },
  {
    license: "GPL-3.0",
    version: "2.7.12",
    slug: "keepassxc",
    linksCheckedAt: "2026-10-14",
    name: "keepassxc",
    nameZh: "KeePassXC",
    aliases: ["keepassxc", "keepass xc", "密码管理器", "开源密码库"],
    kind: "opensource",
    source: "opensource",
    scenes: ["office", "tools"],
    platforms: ["windows", "macos", "linux"],
    tags: ["密码管理", "密码生成", "TOTP", "开源"],
    summary: "离线加密的密码管理器：账号、密码、TOTP 存进一个 KDBX 文件，浏览器集成与自动填充全在本地完成。",
    body: "KeePassXC 是开源的离线密码管理器，把账号、密码、TOTP 令牌、附件和笔记存进一个加密的 KDBX 文件里。它解决的是「密码交给谁保管」——答案是不交给任何人：数据库文件离线存放，加密在本地完成，愿意的话自己把它同步到网盘或任意设备。\n具体能力都对着日常使用来：浏览器插件覆盖 Chrome、Firefox、Edge、Vivaldi、Brave、Tor 等主流浏览器，自动填充和 passkey 都走本地集成；内置密码生成器与 TOTP 令牌管理；支持 YubiKey / OnlyKey 挑战应答当第二把钥匙；Auto-Type 能往任意应用里填表单；可以从 1Password、Bitwarden、Proton Pass 和 CSV 导入存量密码；还有密码健康报告与 HIBP 泄露查询。另有命令行版 keepassxc-cli，无桌面环境也能操作数据库。\n代价要先知道：它没有官方云服务，多设备同步要自己搭——把数据库文件放进网盘或用 Syncthing 同步，版本冲突得手动处理；浏览器集成需要在插件里显式授权数据库连接，上手步骤比云端密码管理器多；换设备时必须带齐数据库文件、主密码和可能的密钥文件，没有任何找回通道，丢了就是真丢了。\n仓库 COPYING 为 GPL-3.0 全文，README 声明代码按 GPL-2 或 GPL-3 双许可；官网提供三平台安装包，Linux 另有发行版仓库。",
    officialUrl: "https://keepassxc.org/",
    officialLabel: "keepassxc.org",
    links: {
      official: "https://keepassxc.org/",
      github: "https://github.com/keepassxreboot/keepassxc",
    },
    price: "免费",
    installTips: [
      "从官网下载对应系统安装包；Linux 也可用发行版仓库或 AppImage。",
      "首次使用先创建数据库：设一个强主密码，有 YubiKey 的在这一步一并绑定。",
      "浏览器装 KeePassXC 插件，回到应用里启用浏览器集成并授权该数据库。",
      "存量密码用「数据库 → 导入」从 CSV、1Password 或 Bitwarden 迁移进来。",
    ],
    whoFor: "想把密码完全留在自己手里、不信任云端托管的人；需要离线可用、跟 KDBX 生态互通的人。",
    whoNot: "想要官方多设备同步和找回机制的人——那是 Bitwarden 这类云服务的地盘，丢了主密码它也救不了你。",
    alternatives: ["syncthing"],
    icon: { letter: "K", color: "#0071e3", simpleIcon: "keepassxc" },
  },
  {
    license: "GPL-2.0-or-later",
    slug: "dolphin",
    linksCheckedAt: "2026-10-15",
    name: "Dolphin",
    nameZh: "Dolphin 模拟器",
    aliases: ["dolphin", "dolphin emu", "海豚模拟器", "gamecube 模拟器", "wii 模拟器"],
    kind: "opensource",
    source: "opensource",
    scenes: ["games"],
    platforms: ["windows", "macos", "linux"],
    tags: ["模拟器", "GameCube", "Wii", "开源"],
    summary: "开源 GameCube 与 Wii 模拟器，在 Windows、macOS、Linux 上跑这两台主机的游戏，支持提升内部分辨率、宽屏修正与即时存档。",
    body: "Dolphin 是 GameCube 与 Wii 的模拟器，把这两台停产主机的游戏搬到电脑上运行。它解决的是「实机早已买不到、老光盘难读」这件事——模拟器本身不含任何游戏，游戏镜像与 Wii 系统固件都需要你自己准备。\n\n常用能力都对着实际玩游戏的流程来：内部分辨率可以拉到远超原生的 480p，并支持宽屏修正与部分游戏的纹理替换；随时存读档、录制回放；视频后端可选 Direct3D 12、Vulkan 与 OpenGL，音频有 HLE（快）与 LLE（准）两档 DSP 模拟可切；手柄与体感 Wiimote 都能映射，Android 版与桌面版在同一仓库维护。命令行工具 dolphin-tool 能转换与校验镜像格式（RVZ、ISO、GCZ、WIA），批量归档比图形界面省事。\n\n代价要先算清楚：硬件门槛不低，官方建议 2008 年以后的双核 3GHz 处理器与支持 Direct3D 11.1 / OpenGL 3.3 的显卡，机器太旧掉帧会很明显；不同显卡驱动对 OpenGL 的支持差异直接影响帧率，AMD 与 NVIDIA 的推荐后端并不一样；游戏镜像与固件要你自己保证来源合法，项目不提供也不代为获取；部分 Wii 游戏依赖原机固件文件，缺失时模拟器只给出提示，不会替你补齐。\n\n仓库 COPYING 写明 Dolphin 自有代码按 GPLv2 及以后版本授权，整体与 GPLv3 兼容；官网提供 Windows、macOS、Linux 三平台安装包。",
    officialUrl: "https://dolphin-emu.org",
    officialLabel: "dolphin-emu.org",
    links: {
      official: "https://dolphin-emu.org",
      github: "https://github.com/dolphin-emu/dolphin",
    },
    price: "免费",
    installTips: [
      "从官网下载页取对应系统的安装包；Windows 有安装器与免安装包，macOS 取 .dmg，Linux 可用发行版仓库或自行编译。",
      "首次启动先在图形设置里挑视频后端，NVIDIA 与 AMD 优先试 Vulkan 或 Direct3D 12，出问题再退回 OpenGL。",
      "在 Paths 设置里把游戏目录加进去，列表会自动扫描；Wii 游戏还需要指定系统固件所在目录。",
      "接上手柄做按键映射；帧率不稳先降内部分辨率、关掉抗锯齿，再考虑切换 DSP 的 HLE / LLE 档位。",
    ],
    whoFor: "想在电脑上跑 GameCube 或 Wii 作品、需要比实机更高的内部分辨率与更方便的存档的人。",
    whoNot: "手上没有可用的游戏镜像与 Wii 固件、又不想自己准备的人；显卡只支持老版本 OpenGL 的机器上，帧率会明显不如预期。",
    alternatives: ["pcsx2", "rpcs3"],
    icon: { letter: "D", color: "#1f6fb2", simpleIcon: "dolphin" },
  },
  {
    license: "GPL-3.0",
    version: "2.8.2",
    slug: "pcsx2",
    linksCheckedAt: "2026-10-15",
    name: "PCSX2",
    nameZh: "PCSX2 模拟器",
    aliases: ["pcsx2", "ps2 模拟器", "ps2 emulator", "playstation 2 模拟器"],
    kind: "opensource",
    source: "opensource",
    scenes: ["games"],
    platforms: ["windows", "macos", "linux"],
    tags: ["模拟器", "PlayStation 2", "PS2", "开源"],
    summary: "开源 PlayStation 2 模拟器，在 Windows、macOS、Linux 上跑 PS2 游戏，配有 2500 多款作品的兼容性列表，稳定版与 nightly 双线发布。",
    body: "PCSX2 是 PlayStation 2 模拟器，让 PS2 游戏能在电脑上以更高分辨率和更省心的存档方式运行。模拟器本身不带游戏，运行前需要用自己主机导出的 BIOS 转储文件。\n\n项目开发已超过二十年，如今多数商业作品能跑到满速，官方兼容性列表收录 2500 多款游戏并逐条标注状态；支持内部分辨率提升、逐游戏独立配置、即时存档与录像回放；图形后端覆盖 Vulkan、Direct3D 与 OpenGL；发布分稳定版与每日 nightly 两条线，nightly 先拿到修复与新功能，也更容易遇到回归。\n\n要注意几件事：BIOS 转储必须来自你自己的主机，模拟器不提供也不会替你找；兼容性按游戏差异很大，冷门作品仍可能碰到画面或音频问题，收录前先去兼容性列表确认现状；nightly 更新频繁，出问题要能退回稳定版，两种构建也别共用一份配置目录；对显卡驱动版本敏感，驱动过旧可能直接启动失败而不是降级运行。\n\n仓库的 COPYING.GPLv3 是 GPLv3 全文，GitHub 检测同样标为 GPL-3.0，许可证未写明是否允许后续版本，以仓库声明为准；官网提供 Windows、macOS、Linux 三平台安装包，Linux 另有 AppImage 与发行版包。",
    officialUrl: "https://pcsx2.net",
    officialLabel: "pcsx2.net",
    links: {
      official: "https://pcsx2.net",
      github: "https://github.com/PCSX2/pcsx2",
    },
    price: "免费",
    installTips: [
      "从官网下载页取安装包，稳定版与 nightly 二选一；Linux 可用 AppImage 或发行版仓库。",
      "首次启动按向导把 BIOS 转储文件放到指定目录，来源必须是你自己的 PS2 主机。",
      "把游戏所在目录加进游戏列表，右键单个游戏可以建独立的图形与按键配置。",
      "遇到画面或音频异常，先查官方兼容性列表里这款游戏的状态，再逐项改图形后端与内部分辨率。",
    ],
    whoFor: "想用更高分辨率、即时存档和录像回放玩 PS2 作品，并且能自己准备主机 BIOS 转储的人。",
    whoNot: "拿不到 BIOS 转储的人；以及期待装完就能玩的人——PS2 游戏的兼容性因作品而异，逐游戏调设置几乎是常态。",
    alternatives: ["dolphin", "rpcs3"],
    icon: { letter: "P", color: "#5b47a5" },
  },
  {
    license: "GPL-2.0-only",
    version: "0.0.43",
    slug: "rpcs3",
    linksCheckedAt: "2026-10-15",
    name: "RPCS3",
    nameZh: "RPCS3 模拟器",
    aliases: ["rpcs3", "ps3 模拟器", "ps3 emulator", "playstation 3 模拟器"],
    kind: "opensource",
    source: "opensource",
    scenes: ["games"],
    platforms: ["windows", "macos", "linux"],
    tags: ["模拟器", "PlayStation 3", "PS3", "开源"],
    summary: "开源 PlayStation 3 模拟器与调试器，是这类工具里最早的开源实现，Windows、Linux、macOS、FreeBSD 都能跑，兼容性按游戏在官方 Wiki 逐条维护。",
    body: "RPCS3 是 PlayStation 3 的模拟器兼调试器，除了把游戏跑起来，还能连上官方调试接口查看线程、内存与图形指令。它不含任何游戏，游戏文件需要你自己准备。\n\n官方 Wiki 逐游戏维护兼容性状态，论坛与 Discord 是主要反馈渠道；图形后端有 Vulkan 与 OpenGL 可选，支持内部分辨率缩放与逐游戏独立配置；Windows 上需要 Visual C++ 2022 运行库与较新的显卡驱动，缺一项就起不来；除 Windows、Linux、macOS 外还有 FreeBSD 构建。\n\nPS3 的 Cell 架构靠多线程动态重编译来模拟，同一款游戏在不同 CPU 上帧率差别很大，单核性能尤其吃紧；部分作品依赖特定固件版本，项目不提供固件文件；兼容性列表逐游戏维护，意味着冷门作品的问题由志愿者按优先级修复，遇到卡死先去 Wiki 查该作状态和推荐配置，比自己乱调参数有效。\n\n仓库 LICENSE 是 GPL-2.0 全文，README 注明多数文件按 GPL-2.0-only 授权、个别文件许可不同以文件头为准；官网提供 Windows 与 Linux 安装包，macOS 与 FreeBSD 需按仓库里的构建文档自行编译。",
    officialUrl: "https://rpcs3.net/",
    officialLabel: "rpcs3.net",
    links: {
      official: "https://rpcs3.net/",
      github: "https://github.com/RPCS3/rpcs3",
    },
    price: "免费",
    installTips: [
      "从官网下载页取 Windows 或 Linux 安装包；macOS 与 FreeBSD 需按仓库里的构建文档自行编译。",
      "Windows 上先装 Visual C++ 2022 运行库并把显卡驱动更新到较新版本，否则启动会直接失败。",
      "首次启动后把固件文件放到指定目录，再把游戏所在目录加进列表。",
      "默认设置跑不动时，先查官方 Wiki 里这款游戏的兼容性与推荐配置，再逐项调图形后端与内部分辨率。",
    ],
    whoFor: "想在自己机器上跑 PS3 作品、并愿意按 Wiki 逐游戏核对兼容性与设置项的人。",
    whoNot: "CPU 偏弱又不接受逐游戏调参的人；想要一份配置通吃所有游戏的话，PS3 模拟目前的兼容性水平还达不到。",
    alternatives: ["dolphin", "pcsx2"],
    icon: { letter: "R", color: "#c0392b" },
  },
  {
    license: "GPL-3.0",
    version: "v0.64.2",
    slug: "navidrome",
    linksCheckedAt: "2026-10-15",
    name: "Navidrome",
    aliases: ["Navidrome", "navidrome", "Subsonic 服务器", "navidrome 音乐服务器"],
    kind: "opensource",
    source: "opensource",
    scenes: ["music"],
    platforms: ["windows", "macos", "linux"],
    tags: ["音乐流媒体", "自托管", "Subsonic", "音乐服务器", "NAS"],
    summary: "自托管的音乐流媒体服务器，把本地曲库变成浏览器和 Subsonic 客户端都能播放的私人流媒体站。",
    body: "把自己收藏的音乐文件变成一个私人流媒体服务：装在常开的机器或 NAS 上，用浏览器和手机 App 随时随地播放，不用把文件拷来拷去。\n\n它扫描并持续监控音乐库，发现新文件就自动导入、刷新元数据；能处理很庞大的曲库和各种音频格式，对合辑（Various Artists）与多碟套装专辑的识别专门做过处理。支持多用户，每个用户有各自的播放次数、歌单和收藏。可以针对不同用户或播放器做实时转码，包含 Opus 编码。自带基于 Material UI 的响应式 Web 界面，可换主题，并且兼容 Subsonic/Madsonic/Airsonic 客户端，手机上用这些第三方客户端就能连。歌词可从 .lrc、.srt、.ttml、.txt 等侧车文件或嵌入标签读取。\n\n代价是要自己维护：需要一台常开的机器、Docker 或二进制安装、挂载音乐与数据目录，还要懂端口、反向代理这些部署细节。默认不带公网 HTTPS 与鉴权加固，暴露到公网前要自己处理安全。移动端主要靠第三方 Subsonic 客户端，体验依赖它们的维护。库的显示效果取决于标签质量，标签乱就会乱。仓库 master 分支不稳定，要安装请从 releases 取稳定版。\n\n项目以 GPL-3.0 在 GitHub 开源，二进制发行版与 Docker 镜像由 GitHub Releases 与官方容器镜像提供，安装文档在官网 www.navidrome.org。",
    officialUrl: "https://www.navidrome.org",
    officialLabel: "www.navidrome.org",
    links: {
      official: "https://www.navidrome.org",
      github: "https://github.com/navidrome/navidrome",
    },
    installTips: [
      "准备一台常开的机器或 NAS，安装 Docker。",
      "用官方镜像启动，挂载音乐目录与数据目录，并映射 Web 端口。",
      "打开 Web 界面创建管理员账号，等待它扫描曲库。",
      "在手机上装一个 Subsonic 兼容客户端，填服务器地址与账号登录播放。",
    ],
    whoFor: "已经有自己的音乐文件、想搭一个只在自家网络或自己的服务器上播放的流媒体服务，并愿意用 Docker 或命令行部署的人。",
    whoNot: "只想装个桌面播放器直接听本地文件、不想维护服务器的人。",
    alternatives: ["koel", "feishin"],
    featured: false,
    icon: { letter: "N", color: "#0071e3" },
  },
  {
    license: "MIT",
    version: "v2.14.1",
    slug: "beets",
    linksCheckedAt: "2026-10-15",
    name: "beets",
    aliases: ["beets", "beet", "beets 音乐库"],
    kind: "opensource",
    source: "opensource",
    scenes: ["music"],
    platforms: ["windows", "macos", "linux"],
    tags: ["音乐库管理", "标签整理", "命令行", "MusicBrainz", "元数据"],
    summary: "命令行音乐库管理器，用 MusicBrainz 自动校正标签、补封面与歌词，把本地曲库一次性理顺。",
    body: "把音乐库「一次性理顺」的命令行工具：扫描本地曲库，自动匹配并修正元数据，再提供一整套管理和取用音乐的手段。\n\n导入时它会按 MusicBrainz 等数据库匹配专辑，逐条列出将被改动的标签（例如把 Beauty 改成 Beauty*2、把文件名猜出的曲名补全），确认后才写入。通过插件还能做更多：拉取或计算专辑封面、歌词、流派、速度、ReplayGain 响度、声纹指纹；从 MusicBrainz、Discogs、Beatport 取元数据；按文件名或声纹猜元数据；转码音频；检查重复曲目、重复专辑与缺曲专辑；清理其他工具留下的脏标签；在文件元数据里嵌入或提取封面；用浏览器图形化浏览，并在支持 HTML5 音频的浏览器里播放；也能配合 MPD 播放器听。会用一点 Python 的话，自己写插件也不难。\n\n代价是它面向命令行：安装靠 pip 或系统包管理器，要在 YAML 配置文件里启用并配置插件，部分插件还要额外装依赖（转码要 ffmpeg、声纹要 Chromaprint）。匹配依赖 MusicBrainz 等外部数据库，冷门或小众版本可能匹配错，导入前必须逐条确认，否则会把错标签批量写进文件。\n\n项目以 MIT 许可在 GitHub（beetbox/beets）开源，网站 beets.io 与完整文档可在线查阅。",
    officialUrl: "https://beets.io",
    officialLabel: "beets.io",
    links: {
      official: "https://beets.io",
      github: "https://github.com/beetbox/beets",
    },
    installTips: [
      "用 pip install beets 或系统包管理器安装。",
      "运行 beet config 生成并编辑 YAML 配置文件。",
      "在配置里启用需要的插件，例如 fetchart、lyrics。",
      "用 beet import 指定目录导入，逐条确认匹配结果。",
    ],
    whoFor: "曲库以本地文件为主、愿意用命令行和配置文件批量整理与修正标签的人。",
    whoNot: "只想在图形界面里点几下改标签、不接受命令行的人。",
    alternatives: ["strawberry"],
    featured: false,
    icon: { letter: "B", color: "#0071e3" },
  },
  {
    license: "GPL-2.0",
    version: "v1.2.2",
    slug: "lmms",
    linksCheckedAt: "2026-10-15",
    name: "LMMS",
    aliases: ["LMMS", "lmms", "Linux MultiMedia Studio"],
    kind: "opensource",
    source: "opensource",
    scenes: ["music"],
    platforms: ["windows", "macos", "linux"],
    tags: ["数字音频工作站", "编曲", "音乐制作", "DAW", "MIDI"],
    summary: "开源数字音频工作站，带钢琴卷帘与节拍音序器，自带合成器并支持 VST2 与 SoundFont2，适合轻量编曲。",
    body: "开源、跨平台的数字音频工作站（DAW），用钢琴卷帘、节拍音序器、歌曲编辑器和混音台来作曲、编曲与混音。\n\nSong-Editor 负责把旋律、采样、pattern 和自动化编排成整曲；Pattern-Editor 用来做节奏图案；钢琴卷帘编辑旋律与 pattern；混音台通道数量不设上限，可挂任意数量的效果器。默认自带十五种以上合成器插件，并支持 SoundFont2、VST2（乐器与效果）、LADSPA、LV2、GUS 音色以及完整的 MIDI；MIDI 文件可导入导出；也支持用户自定义的、基于轨道的自动化。\n\n代价主要在两处：插件格式支持到 VST2，只有 VST3 的插件无法使用，效果与乐器生态比成熟商业 DAW 小。项目稳定版本仍停留在 1.2.2，更新节奏偏慢，复杂大型工程的性能与稳定性不如主流商业软件，更适合入门练习和轻量制作。跨平台安装包来自官网与 GitHub Releases，不同系统上的音频后端表现有差异。\n\n项目以 GPL-2.0 在 GitHub（LMMS/lmms）开源，安装包由官网 lmms.io/download 与 GitHub Releases 发布。",
    officialUrl: "https://lmms.io",
    officialLabel: "lmms.io",
    links: {
      official: "https://lmms.io",
      github: "https://github.com/LMMS/lmms",
    },
    installTips: [
      "从官网 lmms.io/download 或 GitHub Releases 下载对应平台安装包。",
      "启动后在设置里选好音频输出设备。",
      "用钢琴卷帘或 Pattern-Editor 画一段旋律或节奏，加载自带合成器试听。",
      "用 Song-Editor 把片段编排成整曲，可导出 MIDI。",
    ],
    whoFor: "想免费做编曲、习惯钢琴卷帘与 pattern 工作流、能接受插件生态有限的人。",
    whoNot: "需要成熟的 VST3 插件与大型工程性能、或要与商业 DAW 工程互通的人。",
    alternatives: ["musescore"],
    featured: false,
    icon: { letter: "L", color: "#0071e3", simpleIcon: "lmms" },
  },
  {
    license: "GPL-3.0",
    version: "v4.7.5",
    slug: "musescore",
    linksCheckedAt: "2026-10-15",
    name: "MuseScore",
    aliases: ["MuseScore", "MuseScore Studio", "MuseScore 4"],
    kind: "opensource",
    source: "opensource",
    scenes: ["music"],
    platforms: ["windows", "macos", "linux"],
    tags: ["乐谱", "制谱", "音乐记谱", "MusicXML"],
    summary: "开源乐谱制谱软件，在虚拟五线谱上所见即所得地记谱、播放与打印，支持 MusicXML 与 MIDI 导入导出。",
    body: "开源免费的乐谱制谱软件，在「虚拟五线谱纸」上所见即所得地写谱、编辑、播放和打印。\n\n音符直接记在谱面上，配合键盘或 MIDI 键盘输入；用 TrueType 字体渲染，放大到任意尺寸都清晰，方便打印与屏幕显示；提供大量编辑功能。可导入导出 MusicXML、MIDI(SMF)、MEI，也能导入 MuseData；内置音序器与软音源，能直接播放当前乐谱；成果可以打印或导出成 PDF。\n\n代价是要先熟悉记谱的输入方式：音符输入、时值与排版主要靠快捷键和面板操作，第一次上手需要适应。MusicXML 与其他软件互导后，排版常需要手动微调，跨谱表、复杂节奏这类记谱也不总是自动排得好看。另外官网 musescore.org 上另有付费的乐谱分享与订阅服务，别把它和这份免费桌面软件混为一谈。\n\n软件本身以 GPL-3.0 在 GitHub（musescore/MuseScore）开源，Windows、macOS、Linux 安装包由官网 musescore.org 发布。",
    officialUrl: "https://musescore.org",
    officialLabel: "musescore.org",
    links: {
      official: "https://musescore.org",
      github: "https://github.com/musescore/MuseScore",
    },
    installTips: [
      "到 musescore.org 下载对应平台安装包（Linux 也可用发行版仓库或 AppImage）。",
      "新建一个乐谱，确定调号、拍号与所用乐器。",
      "用键盘或 MIDI 键盘输入音符，随时播放试听。",
      "完成后打印，或导出为 PDF、MusicXML。",
    ],
    whoFor: "要写乐谱、打印或导出 PDF 与 MusicXML、愿意用键盘输入音符的人。",
    whoNot: "主要做音频录制与混音（那是 DAW 的活）、不需要记谱的人。",
    alternatives: ["lmms"],
    featured: false,
    icon: { letter: "M", color: "#0071e3" },
  },
  {
    license: "GPL-2.0-or-later",
    version: "2.5.6",
    slug: "mixxx",
    linksCheckedAt: "2026-10-15",
    name: "Mixxx",
    aliases: ["Mixxx", "mixxx"],
    kind: "opensource",
    source: "opensource",
    scenes: ["music"],
    platforms: ["windows", "macos", "linux"],
    tags: ["DJ", "混音", "打碟", "现场演出", "音乐"],
    summary: "开源 DJ 混音软件，用于现场打碟与实时混音，支持 Linux/Windows/macOS，可接 MIDI/HID 控制器。",
    body: "免费开源的 DJ 软件，面向现场做实时混音，在 GNU/Linux、Windows 和 macOS 上都能运行。\n\n使用时把本地曲库加载进唱盘做实时混音，输出到音频接口；可通过 MIDI/HID 映射连接常见 DJ 控制器，官方提供硬件兼容性列表可查；界面皮肤可以自定义；有完整的在线手册、wiki 与社区论坛，遇到问题好查。\n\n代价是它服务的是现场演出：对音频延迟和声卡、控制器的兼容性敏感，动手前最好先在硬件兼容性列表里确认自己的设备受支持，并预留时间调试，别在演出当天第一次配置。界面信息密集、专业术语多，纯键鼠操作能起步，但真正顺手的往往是配了控制器的人。不同操作系统上的打包版本更新节奏不一致。\n\nMixxx 以 GPL 许可开源（许可原文为「GPL 第 2 版或更高」），代码在 GitHub（mixxxdj/mixxx），稳定版与开发版都在官网 mixxx.org/download 提供。",
    officialUrl: "https://mixxx.org",
    officialLabel: "mixxx.org",
    links: {
      official: "https://mixxx.org",
      github: "https://github.com/mixxxdj/mixxx",
    },
    installTips: [
      "从 mixxx.org/download 下载稳定版并安装。",
      "启动后在设置里配置音频输出与输入设备。",
      "导入或扫描本地曲库，把曲目加载到唱盘试混。",
      "接上 MIDI/HID 控制器并按需加载映射，先确认设备在硬件兼容性列表里受支持。",
    ],
    whoFor: "要现场做 DJ 混音、有 MIDI/HID 控制器或愿意用键鼠控制、能接受一定学习曲线的人。",
    whoNot: "只想做静态编曲与录音、不需要现场混音的人。",
    alternatives: [],
    featured: false,
    icon: { letter: "M", color: "#0071e3" },
  },
  {
    license: "GPL-3.0",
    version: "1.2.31",
    slug: "strawberry",
    linksCheckedAt: "2026-10-15",
    name: "Strawberry",
    aliases: ["Strawberry", "strawberry", "Strawberry Music Player"],
    kind: "opensource",
    source: "opensource",
    scenes: ["music"],
    platforms: ["windows", "macos", "linux"],
    tags: ["音乐播放器", "曲库管理", "音频播放", "标签编辑", "ReplayGain"],
    summary: "从 Clementine 分叉的桌面音乐播放器与曲库管理器，支持大量无损格式、bit-perfect 播放与声纹补全标签。",
    body: "桌面音乐播放器兼音乐库管理工具，2018 年从 Clementine 分叉而来，用 C++ 与 Qt 编写，面向在意音质与曲库整理的使用方式。\n\n它能播放并整理本地曲库，支持 WAV、FLAC、Ogg FLAC、WavPack、Ogg Vorbis、Opus、Speex、MPC、TrueAudio、AIFF、MP4/AAC、ALAC、MP3、ASF、Monkey's Audio 以及 DSD，在 Linux 上可做 bit-perfect 播放，还支持 MPRIS2/D-Bus 远程控制。播放列表有高级管理与智能、动态歌单；带音频分析器、均衡器、moodbar 与波形拖动条；用 ReplayGain 与 EBU R128 做音量归一化。标签可以手动编辑，也能用 AcoustID 声纹加 MusicBrainz 自动补全缺失标签；封面可从 Last.fm、MusicBrainz、Discogs、Deezer、Tidal、Qobuz、Spotify 等来源抓取，歌词来自多个在线来源；支持转码、向 USB/MTP/iPod 传歌、播放互联网电台、连接 Subsonic 兼容服务器，并可 scrobble 到 Last.fm/ListenBrainz。\n\n代价是官方安装包的获取方式有门槛：macOS 与 Windows 的发行版目前只对赞助者开放，想直接用要么参加赞助，要么自行从源码编译。Linux 上打包齐全，但项目不维护 Flatpak 包，Flatpak 相关问题要按官方指路去找 Flatpak 支持。Tidal、Spotify、Qobuz 属于「非官方集成」，会随这些平台接口变动而失效。\n\n项目以 GPL 许可在 GitHub（strawberrymusicplayer/strawberry）开源，官方构建与下载在 builds.strawberrymusicplayer.org。",
    officialUrl: "https://www.strawberrymusicplayer.org/",
    officialLabel: "www.strawberrymusicplayer.org",
    links: {
      official: "https://www.strawberrymusicplayer.org/",
      github: "https://github.com/strawberrymusicplayer/strawberry",
    },
    installTips: [
      "Linux 用发行版仓库或 PPA 安装；macOS 与 Windows 官方包目前限赞助者，可参加赞助或自行编译。",
      "首次启动把音乐目录加入曲库并触发扫描。",
      "在设置里启用 AcoustID 与在线封面、歌词来源以补全信息。",
      "选择音频输出设备，并按需打开 ReplayGain 音量归一化。",
    ],
    whoFor: "曲库以本地文件为主、在意音质与标签封面整理、想在桌面端长期管理曲库的人。",
    whoNot: "想搭一个能在手机和浏览器随处访问的流媒体服务的人（那需要服务器端软件）。",
    alternatives: ["beets", "feishin"],
    featured: false,
    icon: { letter: "S", color: "#0071e3" },
  },
  {
    license: "GPL-3.0",
    version: "v1.17.0",
    slug: "feishin",
    linksCheckedAt: "2026-10-15",
    name: "Feishin",
    aliases: ["Feishin", "feishin", "Sonixd"],
    kind: "opensource",
    source: "opensource",
    scenes: ["music"],
    platforms: ["windows", "macos", "linux"],
    tags: ["音乐播放器", "Subsonic 客户端", "Navidrome", "Jellyfin", "自托管"],
    summary: "自托管音乐库的桌面客户端，连接 Navidrome、Jellyfin 或 Subsonic 服务器，是 Sonixd 的重写版。",
    body: "自托管音乐库的桌面客户端，是 Sonixd 的重写版，用来连接 Navidrome、Jellyfin 或任何兼容 OpenSubsonic 的服务器。\n\n桌面版基于 Electron，可切换 MPV 与 Web 两种播放后端；界面做了现代化；播放会回传到服务器做 scrobble；对 Navidrome 支持智能歌单编辑；支持同步与非同步歌词，桌面版还能直接抓取歌词。除桌面版外还提供 Docker 与托管 Web 版，可用环境变量锁定服务器地址（SERVER_LOCK）、限制服务器类型，或用 ANALYTICS_DISABLED 关掉统计；桌面版可丢入 JSON 主题文件自定义外观。\n\n代价是桌面版对本地依赖有要求：要先自己装 MPV 并指定其可执行文件路径，MPV 后端才算可用，已知 0.34.x 版本会出问题。macOS 12 及以上需要手动把应用移出隔离区，媒体键要授予「辅助功能」权限并重启才生效；Linux 上可能遇到 sandbox 与用户命名空间相关的问题。Web 与 Docker 版只有 Web 播放后端，用不到 MPV。另外它只是客户端，服务器（如 Navidrome）要另行搭建。\n\n项目以 GPL-3.0 在 GitHub（jeffvli/feishin）开源，桌面安装包由 GitHub Releases 发布，Web 版在 feishin.vercel.app。",
    officialUrl: "https://feishin.vercel.app",
    officialLabel: "feishin.vercel.app",
    links: {
      official: "https://feishin.vercel.app",
      github: "https://github.com/jeffvli/feishin",
    },
    installTips: [
      "从 GitHub Releases 下载桌面客户端，Linux 也可用 Flathub 或官方 AppImage 安装脚本。",
      "先安装 MPV，首次启动时指定 MPV 可执行文件路径并重启应用。",
      "打开菜单里的 Manage servers，填入 Navidrome、Jellyfin 或 Subsonic 服务器地址。",
      "登录后浏览与播放，播放记录会回传到服务器。",
    ],
    whoFor: "已经（或打算）自建 Navidrome、Jellyfin 等服务器、想要一个比网页更顺手的桌面客户端的人。",
    whoNot: "只有本地文件、没有任何 Subsonic 或 Jellyfin 服务器的人。",
    alternatives: ["strawberry", "navidrome"],
    featured: false,
    icon: { letter: "F", color: "#0071e3" },
  },
  {
    license: "MIT",
    version: "v9.15.0",
    slug: "koel",
    linksCheckedAt: "2026-10-15",
    name: "koel",
    aliases: ["koel", "Koel"],
    kind: "opensource",
    source: "opensource",
    scenes: ["music"],
    platforms: ["linux"],
    tags: ["音乐流媒体", "自托管", "Web 音乐", "Laravel", "歌单"],
    summary: "个人音乐流媒体服务，用 Laravel 与 Vue 写成，在浏览器里听自己的曲库，带歌单、scrobble 与播客。",
    body: "把私人曲库变成基于浏览器的收听体验的开源音乐流媒体服务，基于 Laravel 与 Vue 构建。\n\n它会扫描你的音乐库，再通过一个快速、现代的界面在任意浏览器里播放。除了播放，还处理歌单、智能歌单、scrobble、播客、广播，以及 Last.fm、Spotify、MusicBrainz 等集成，并提供一个响应自然语言指令的 AI 助手；官方另有 Koel Player 移动 App，支持 iOS 与 Android。付费的 Koel Plus 在多用户曲库、协作、SSO、云存储驱动、自定义主题与白标这些方面做增强。\n\n代价是它需要自托管：要准备 PHP、数据库与 Node 运行环境，或用 Docker 部署，比装一个现成桌面播放器费事。多用户曲库、协作、SSO、云存储、自定义主题与白标等能力不在免费版里，属于付费的 Koel Plus。AI 助手是较新的功能，成熟度以官方文档为准。它是 Web 服务，通常跑在服务器上。\n\n项目以 MIT 许可在 GitHub（koel/koel）开源，安装与升级文档在 docs.koel.dev，官网为 koel.dev。",
    officialUrl: "https://koel.dev",
    officialLabel: "koel.dev",
    links: {
      official: "https://koel.dev",
      github: "https://github.com/koel/koel",
    },
    installTips: [
      "按 docs.koel.dev 的安装指南，用 Docker 或 PHP 与 Node 环境部署。",
      "配置数据库与音乐目录等环境变量。",
      "打开 Web 界面创建第一个用户并登录。",
      "触发曲库扫描，之后在浏览器里浏览和播放。",
    ],
    whoFor: "想用浏览器访问自己曲库、需要歌单与 scrobble 等成套功能、能自己部署环境的人。",
    whoNot: "不想碰 PHP 与数据库部署、只想装个现成桌面播放器的人。",
    alternatives: ["navidrome"],
    featured: false,
    icon: { letter: "K", color: "#0071e3" },
  },
  {
    license: "MIT",
    version: "v5.0.0",
    slug: "sonic-pi",
    linksCheckedAt: "2026-10-15",
    name: "Sonic Pi",
    aliases: ["Sonic Pi", "sonic-pi", "sonicpi"],
    kind: "opensource",
    source: "opensource",
    scenes: ["music"],
    platforms: ["windows", "macos", "linux"],
    tags: ["实时编码", "音乐创作", "live coding", "编程教学", "合成器"],
    summary: "实时编码音乐环境，边写代码边出声，用一门专用语言在演出与编程教学里做音乐。",
    body: "一种「用代码演奏」的音乐环境：不弹琴也不敲鼓，而是写代码，改动在运行中立刻变成声音。\n\n在编辑器里写下代码并运行，声音实时出现，改一行再运行就立刻听到变化，适合现场演出时边写边演。它最早是为了在学校里通过制造声音来讲编程概念，内置带翻译的教程，应用界面也提供多语言；如今也用于音乐演出。跨平台，可装在 Linux、macOS、Windows、Raspberry Pi 上，另有 Web 版；上游保持活跃开发与多语言翻译。\n\n代价是它自成一门语言：要学它的语法、循环，以及关于时间和并发的概念，思路和用鼠标操作的传统 DAW 完全不同，直接出成品不如 DAW 直观。许可也要分清：主源码采用 MIT，但 Web 版是 AGPL-3.0-or-later，音频引擎 SuperSonic 与 Clockwork 也按 AGPL 发布；GUI 二进制因为链接了 GPLv3 组件，分发时要遵守 GPL 条款。\n\n仓库 sonic-pi-net/sonic-pi 的 LICENSE.md 显示主源码为 MIT，安装包由官网 sonic-pi.net 与 GitHub Releases 发布。",
    officialUrl: "https://sonic-pi.net",
    officialLabel: "sonic-pi.net",
    links: {
      official: "https://sonic-pi.net",
      github: "https://github.com/sonic-pi-net/sonic-pi",
    },
    installTips: [
      "从 sonic-pi.net 下载对应平台安装包，或直接用 Web 版。",
      "打开后先挑一个内置教程或示例照着跑一遍。",
      "在编辑器里写几行代码，播放一个音符或采样，点 Run 试听。",
      "改代码后重新运行，体会实时变化。",
    ],
    whoFor: "想用代码实时做音乐、边写边听，或要把编程与声音结合起来讲的人。",
    whoNot: "习惯鼠标操作 DAW、要精细编辑音频波形或做商业编曲的人。",
    alternatives: [],
    featured: false,
    icon: { letter: "S", color: "#0071e3" },
  },












];
