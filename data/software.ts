import type { SeedSoftware } from "./types";

/** 静态种子：首次启动灌入 data/store/catalog.json 后即以 store 为准 */
export const software: SeedSoftware[] = [
  {
    license: "MIT",
    slug: "vscode",
    linksCheckedAt: "2026-10-03",
    name: "Visual Studio Code",
    nameZh: "VS Code",
    aliases: ["vscode", "vs code", "代码编辑器"],
    summary: "写脚本、网页和多数语言都能先用它，扩展多、启动快。",
    scenes: ["code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://code.visualstudio.com/",
    officialLabel: "code.visualstudio.com",
    whoFor: "需要一个编辑器覆盖多种语言，并且愿意装扩展。",
    whoNot: "只改几行配置，或不想维护扩展；已经在用完整 IDE 工作流也可以不换。",
    installTips: [
      "只从 code.visualstudio.com 下载，不要用第三方「增强包」。",
      "第一次打开先装语言包和你正在用的语言扩展，不必一次装齐。",
      "Git 要单独安装，编辑器不会自带完整 Git。",
    ],
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
    linksCheckedAt: "2026-10-03",
    name: "Zotero",
    aliases: ["文献管理", "论文引用"],
    summary: "抓文献、生引用、插到 Word 或 Markdown 里。",
    scenes: ["docs"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://www.zotero.org/download/",
    officialLabel: "zotero.org",
    whoFor: "写长文或论文，需要管参考文献和引用格式。",
    whoNot: "只写短通知、不引用文献。",
    installTips: [
      "装桌面端后再装浏览器插件，才能一键抓条目。",
      "写 Word 时再装官方 Word 插件。",
      "附件和库尽量放在你能备份的目录。",
    ],
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
    license: "GPL-2.0-or-later",
    linksCheckedAt: "2026-10-03",
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
      disk: "https://pan.quark.cn/s/6ee5d2df3b7b",
      diskNote:
        "夸克网盘上的固定版本副本，4.9.8 Windows 安装包（官方签名版）。文件取自 texstudio-org/texstudio 官方 Release 附件。校验值可信：虽然本地算的是 SHA-256（上游只提供 SHA1），但与上游 hashes.txt 中同名文件的记录逐字一致。网盘里是固定版本的快照，上游发新版不会自动更新。",
      diskFile: "texstudio-4.9.8-win-qt6-signed.exe",
      diskSha256: "243d64e65bbefff706c92b58fb1a56b6e024fbb1fb11dffc623e59c18b0ab397",
    },
    whoFor: "要排公式、用会议或期刊 LaTeX 模板。",
    whoNot: "只写短文档、不需要精确排版，用普通文档软件即可。",
    installTips: [
      "编辑器之外还要装 TeX 发行版，例如 Windows 的 MiKTeX 或 TeX Live。",
      "先能编译一篇最小文档，再导入模板。",
      "中文稿件确认发行版带了 CJK 字体支持。",
    ],
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
    linksCheckedAt: "2026-10-03",
    name: "JASP",
    aliases: ["统计", "spss 替代", "假设检验"],
    summary: "点选做常见统计，界面接近教材，开源免费。",
    scenes: ["data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://jasp-stats.org/download/",
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
    linksCheckedAt: "2026-10-03",
    name: "RStudio",
    nameZh: "Posit Desktop",
    aliases: ["r 语言", "rstudio", "posit"],
    summary: "写 R 的桌面环境，统计课和可重复分析常用。",
    scenes: ["data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://posit.co/download/rstudio-desktop/",
    officialLabel: "posit.co",
    whoFor: "课程或论文用 R，需要脚本、图表和包管理在一个窗口。",
    whoNot: "完全不想写代码，只想点选，先看 JASP。",
    installTips: [
      "先装 R（cran.r-project.org），再装 RStudio Desktop Open Source。",
      "两个都要从官方渠道下。",
      "国内如 CRAN 慢，可在 R 里换镜像。",
    ],
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
  },
  {
    license: "GPL-3.0",
    slug: "octave",
    linksCheckedAt: "2026-10-03",
    name: "GNU Octave",
    aliases: ["matlab 替代", "矩阵", "数值计算"],
    summary: "开源数值计算，语法接近 MATLAB，适合作业和原型。",
    scenes: ["data", "engineering", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://octave.org/download",
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
    linksCheckedAt: "2026-10-03",
    name: "Jupyter",
    aliases: ["notebook", "ipynb"],
    summary: "在浏览器里交错写代码和说明，数据和教学演示常用。",
    scenes: ["data", "code"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://jupyter.org/install",
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
    linksCheckedAt: "2026-10-03",
    name: "LibreOffice",
    aliases: ["writer", "calc", "office 替代", "文档"],
    summary: "开源办公套件：文档、表格、演示，能开常见 Office 文件。",
    scenes: ["office", "docs", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://www.libreoffice.org/download/download-libreoffice/",
    officialLabel: "libreoffice.org",
    whoFor: "要离线改文档和表格，不想订 Microsoft 365。",
    whoNot: "必须使用仅在 Microsoft 365 里的协作功能或宏生态。",
    installTips: [
      "从 libreoffice.org 下稳定版。",
      "复杂 PPT 或带宏的 Excel 可能有差异，交稿前用对方软件打开检查。",
      "默认可另存为 .docx / .xlsx，按接收方要求选。",
    ],
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
  },
  {
    slug: "wps",
    linksCheckedAt: "2026-10-03",
    name: "WPS Office",
    aliases: ["wps", "金山"],
    summary: "国内常用办公套件，兼容常见 Office 格式，个人基础功能免费。",
    scenes: ["office", "docs"],
    platforms: ["windows", "macos", "linux"],
    source: "official",
    price: "基础免费",
    officialUrl: "https://www.wps.cn/",
    officialLabel: "wps.cn",
    whoFor: "主要在国内环境交 .docx / .xlsx，需要高兼容。",
    whoNot: "不想要广告和账号体系，或需要完全开源。可看 LibreOffice。",
    installTips: [
      "从 wps.cn 官方站下载，安装时取消不需要的附加组件。",
      "个人版和商业授权不是一回事，按使用场景看条款。",
    ],
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
    linksCheckedAt: "2026-10-03",
    name: "QGIS",
    aliases: ["gis", "地图", "地理信息"],
    summary: "开源地理信息桌面软件，看图层、做专题图。",
    scenes: ["engineering", "data"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    officialUrl: "https://qgis.org/download/",
    officialLabel: "qgis.org",
    whoFor: "要处理地图图层、做空间分析和出图。",
    whoNot: "只需要在网页上看一眼地图。",
    installTips: [
      "从 qgis.org 选长期发布版（LTR）更稳。",
      "坐标系先确认，再叠图层。",
      "大数据量图层不要一上来做全局渲染。",
    ],
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
    alternatives: [],
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
    alternatives: [],
    icon: {
      letter: "T",
      color: "#4A4A6A",
      simpleIcon: "gnome-terminal",
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
    alternatives: [],
    icon: {
      letter: "V",
      color: "#5B4B8A",
      simpleIcon: "audacity",
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
    alternatives: [],
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
    alternatives: [],
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
    alternatives: [],
    icon: {
      letter: "G",
      color: "#2E7D5B",
      simpleIcon: "dumbbell",
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
    alternatives: [],
    icon: {
      letter: "E",
      color: "#2B6CB0",
      simpleIcon: "raspberry-pi",
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
    body: "AnyPS5 是一个把 PS5 可执行文件自动移植到 Linux 和 Windows 的工具。核心是一个 **relinker（重链接器）**，把可执行文件转换成目标系统的原生格式，加上供动态链接用的**系统 prx 库实现**。关键在最后一句：**没有模拟，也没有额外的运行时进程**。\n和模拟器路线（比如 PCSX2、RPCS3 那类）的区别是根本性的：它不是解释执行，而是把程序翻译成你机器的原生指令直接跑。代价是兼容性完全取决于「这个游戏用到的东西有没有被实现」。\n**当前状态要如实看。** 官方在 README 里给了一张测试过的游戏表，只有一款：**Dreaming Sarah**（2D 平台跳跃），代码 PPSA02929，在 GTX 1050 Ti / i5-7500 3.4GHz 上稳定 60 FPS，在 Intel HD Graphics 620 / i5-7200 2.5GHz 上 36 FPS，Windows 上可玩，Linux 那一栏官方自己标的是问号。系统库和着色器的完成度用徽章展示，项目主页有实时的库函数百分比地图。\n架构上还有一条硬约束：**遇到不支持或不符合预期的状态会严格抛 `std::runtime_error`，what() 打到 stderr 然后进程终止。** 不做静默降级——这是研究型项目的常见选择，代价是任何未实现的系统调用都会让程序直接崩。\n着色器这块有实打实的产出：shader 重编译器能成功生成 SPIR-V，并且在开启 `ANYPS5_ENABLE_SPIRV_TOOLS` 构建时用 Spirv-Tools 做校验。\n手柄支持是完整的：SDL 映射的游戏手柄都支持，包括摇杆和扳机。键鼠要在 `anyps5-input.ini` 里配置。\n**必须说清的前提：** 官方声明该项目面向互操作性、研究、保存与兼容性用途，**不包含、不分发、也不需要任何受版权保护的软件、固件、加密密钥或专有库**。用户需要自己确保手上的二进制来源合法且符合许可条款。翻译成实际使用：\n**能不能跑完全取决于那款游戏的兼容情况**，请先查官方兼容列表再决定投入时间。",
    officialUrl: "https://github.com/boykopovar/AnyPS5",
    officialLabel: "github.com/boykopovar/AnyPS5",
    links: {
      official: "https://github.com/boykopovar/AnyPS5",
      github: "https://github.com/boykopovar/AnyPS5",
    },
    whoFor: "做逆向工程与跨平台移植研究的开发者；或者想在自己 Linux/Windows 机器上原生跑某个特定 PS5 游戏、且愿意接受只有少数游戏可用的现实的人。",
    whoNot: "想找「PS5 游戏全兼容」方案的人——目前官方测试过的只有一款游戏；也不适合不懂命令行、不愿意自己准备合法二进制的人。",
    installTips: [
      "先查兼容列表再动手。官方 docs/user/COMPATIBILITY.md 目前只有 Dreaming Sarah 一行，确认你的目标游戏在里面再投入时间。",
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

官方测试过的兼容性表目前只有一款游戏：

| 游戏 | ID | Windows | Linux | GTX 1050 Ti / i5-7500 | HD 620 / i5-7200 |
|---|---|---|---|---|---|
| Dreaming Sarah | PPSA02929 | 可玩 | ？ | 60 FPS | 36 FPS |

Linux 那一栏是官方自己标的问号。库函数和着色器的完成度在项目主页有实时徽章（boykopovar.github.io/AnyPS5），系统库那个百分比是「已声明的函数里项目已知的比例」，不是「所有 PS5 系统函数的比例」——总数会随着函数声明增加而涨。

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
          url: "https://github.com/boykopovar/AnyPS5/blob/main/docs/user/COMPATIBILITY.md",
          note: "很短——只有 Dreaming Sarah 一行，附两套硬件的实测帧率。决定是否投入时间前先看这个。",
        },
        {
          kind: "link",
          title: "技术债清单（53KB）",
          url: "https://github.com/boykopovar/AnyPS5/blob/main/docs/dev/TechnicalDebt.md",
          note: "了解项目真实状态最有价值的一份文档：哪些部分还是近似实现、哪些会抛 runtime_error，都在这里。",
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
    alternatives: [],
    icon: {
      letter: "Y",
      color: "#7B3FA0",
      simpleIcon: "terminal",
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
    body: "Stremio Web 是 Stremio 的官方网页版界面，一个现代媒体中心——它的定位是「视频娱乐的一站式方案」。直接打开 https://web.stremio.com 就能用，不需要安装桌面客户端。\n**它的核心机制是 addon（插件）驱动的。** 电影、剧集、频道的目录来自 addon 提供的目录数据，而不是内置数据库。这决定了 Stremio 和传统媒体库应用的根本差别：**内容来源是可替换的**，装什么 addon 就有什么内容。字幕也走 addon，或者用本地的，并且样式可自定义。\n实用功能上：库（Library）和「继续观看」跟着 Stremio 账号跨设备同步；支持 Chromecast 投到电视；**播放器是键盘优先的**，不放鼠标也能控制全部播放；50 多种语言，由社区通过 stremio-translations 翻译；可作为独立 PWA 安装（装完有自己的图标，不走浏览器标签页）。\n**架构上它是一个「React 外壳 + Rust 内核」的组合，这一点值得单独说**，因为它不是纯前端项目：\n- 界面是 React（本仓库）\n- 真正干活的是 **stremio-core** —— Stremio 的 Rust 引擎，编译成 WebAssembly 跑在 Web Worker 里\n- 播放走 **stremio-video**，它会按当前环境挑选合适的播放器实现\n\n一句话概括分工：**UI 渲染状态，core 计算状态。** 所以它的性能特征更接近原生应用而不是网页。\n生态是它最强的部分，围绕它有一整套仓库：stremio-core（状态、addon 协议、库、同步）、stremio-video（播放器抽象）、stremio-translations（社区翻译）、**stremio-addon-sdk（用 Node.js 写自己的 addon）**。最后一个意味着你可以自己做一个 addon 加进任何 Stremio 客户端，包括网页版。\n要提前知道的两件事：一是**它需要账号**——同步功能依赖 Stremio 账号，本地播放不需要；二是**内容来源取决于你装的 addon**，官方不提供内容，它是目录和播放器的框架。所以「装上就能看」这个预期要调整：需要自己找到合适的 addon 并配置，这是它生态的运作方式。\n想自己部署一份的话也有官方 Docker 镜像。许可证是 GPL-2.0。",
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
    alternatives: [],
    icon: {
      letter: "S",
      color: "#7B5BF5",
      simpleIcon: "film",
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
    body: "MarkItDown 是微软开源的一个轻量 Python 工具，把各种文件转成 Markdown，目标是给 LLM 和文本分析流水线用。\n**它的定位是「保留结构的 LLM 输入」，不是「高保真文档转换」。** README 说得直接：输出虽然通常还算可读、适合人看，但它是为了给文本分析工具消费的，**高保真转换不是它的目标**。想做版式保留的转换，它不合适。\n和同类的 textract 相比，它的差别在「保留重要文档结构」：标题、列表、表格、链接这些都尽量保住。为什么选 Markdown，README 给了理由——Markdown 极接近纯文本、标记极少，但仍能表达文档结构；而主流 LLM 原生就说 Markdown，且训练数据里大量是 Markdown，所以它理解得好；另外 Markdown 约定在 token 上很省。\n**支持范围很宽**：PDF、PowerPoint、Word、Excel、图片（EXIF 与 OCR）、音频（EXIF 与语音转录）、HTML、文本类（CSV/JSON/XML）、ZIP（遍历内容）、YouTube URL、EPUB，以及更多。\n**依赖可以只装一部分**，这点很实用——`[all]` 全装，或者只装你需要的格式（`[pdf, docx, pptx]`）。可选依赖一共十项：pptx、docx、xlsx、xls、pdf、outlook（Outlook 邮件）、az-doc-intel、az-content-understanding、audio-transcription、youtube-transcription。\n**要更强能力时有三层加码路径**：\n- **插件**（默认关闭）——GitHub 上搜 `#markitdown-plugin`  hashtag 就能找到社区插件，官方也给了示例插件工程\n- **markitdown-ocr 插件**——给 PDF/DOCX/PPTX/XLSX 加 OCR，用 LLM Vision 提取图片里的文字，**不需要新的 ML 库或二进制依赖**。注意一个坑：没传 `llm_client` 时插件仍会加载，但 **OCR 会被静默跳过**，回退到内置转换器\n- **Azure Content Understanding**——唯一一个支持**视频**的选项，也支持音频，能做结构化字段提取（发票金额、收据日期、合同条款，输出成 YAML front matter），还能配自定义分析器。代价是按量计费的云服务\n\n**安全上有一条必须知道的前提**，README 开头就警告了：MarkItDown 的 I/O 权限就是当前进程的权限，和 open() 或 requests.get() 一样，会访问进程本身能访问的资源。**在不受信任的环境里要清洗输入，并只调用你用例需要的那个最窄的函数**（`convert_stream()` 或 `convert_local()`），不要图省事用宽接口。这是把文件解析器接进服务时的通用风险，但它明确写出来了。\n环境要求是 Python 3.10 到 3.14，官方建议装在虚拟环境里以避免依赖冲突。",
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
    alternatives: [],
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
    linksCheckedAt: "2026-10-06",
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
    body: "n8n 是一个用来搭 AI 智能体和工作流的平台。它的形态是**可视化画布 + 自定义代码**的组合：简单步骤拖拽，复杂逻辑直接写 JavaScript、Python 或引入 npm 包。\n**核心卖点是不锁定模型供应商。** 它接 OpenAI、Anthropic、Google 或开源模型，换 provider 不用改架构。对不想被某一家模型绑死的人来说这是关键。\n它的能力线是「从原型到生产」：多步 AI 工作流、逻辑分支、工具调用、**人工审批环节**、完整的可观测性。企业侧有基于角色的访问控制、审计日志、敏感数据处理支持。\n生态规模是它最实的优势：1500+ 集成，加上 9000+ 工作流模板。集成不是「导入配置」那种脆弱粘贴，通常是官方维护的节点。\n部署两种：一条安装脚本（需要 Docker），或者手动 Docker；也可以用官方的 n8n Cloud。\n**但有一件事必须说清楚：n8n 不是 OSI 意义上的开源软件。** 它的许可证是 fair-code 模式下的 **Sustainable Use License** 加上 n8n Enterprise License。官方自己列的三点是：源码始终可见、可自托管部署、可扩展（能加自己的节点和功能）。这三条是 fair-code 的定义，**它不等于 MIT/Apache 那种可以随便拿去改改再发布的许可证**。商业使用、嵌入到产品里对外提供服务这类场景，要自己去读 LICENSE.md 确认边界，必要时联系官方买企业许可。评估「能不能用」之前先看许可，这是选型里最容易事后翻车的一步。\n名字的来历也挺有意思：n8n = \"nodemation\"（Node-View + Node.js + automation），但作者觉得太长不适合命令行，最后取了 n8n。发音是 n-eight-n。",
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
    alternatives: [],
    icon: {
      letter: "n",
      color: "#EA4B71",
      simpleIcon: "workflow",
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
    alternatives: [],
    icon: {
      letter: "P",
      color: "#2C6E49",
      simpleIcon: "api",
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
    alternatives: [],
    icon: {
      letter: "B",
      color: "#4A5D23",
      simpleIcon: "book",
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
    body: "The Algorithms - Python 是社区维护的 Python 算法实现集，按 DIRECTORY.md 统计有 45 个类别、1300 多个实现文件，从排序、图论、动态规划一路到密码学、图形学、量子计算。\n**但它的定位必须先说清楚，这是官方在 README 顶部就写明的：这些实现只用于学习目的，效率可能不如 Python 标准库里的实现，自行斟酌使用。**\n这句话不是客套，是选型时最关键的信息。标准库有 `sorted`、`heapq`、`bisect`，性能是 C 实现的；这里的实现是为了让你看懂算法怎么写，不是为了直接拿去做生产里的热路径。**当成教科书和练习集用，不要当成库用。**\n**它的真正价值在两点：**\n- **每份实现都带 doctest。** 贡献规范明确要求 docstring 里要有清晰说明和/或来源 URL，并且 **doctest 要同时覆盖有效输入和错误输入**。这意味着你读代码时看到的示例是能直接跑的，而且不会只演示顺利路径。\n- **分类完整。** 45 个类别里有些是标准算法教材不会覆盖的：ciphers（密码学）、fractals（分形）、cellular_automata（元胞自动机）、boolean_algebra（布尔代数）、quantum（量子计算）、financial（金融）、geodesy（测地学）。想找某个冷门算法的实现，这里往往比搜索引擎更快。\n**工程规范相当严，这一点从 CONTRIBUTING 能看出来：** 遵循 Python 命名约定（变量函数小写、常量全大写、类名驼峰），PEP 8，代码风格用 ruff，格式用 pre-commit 自动处理。命名上有一条原则我觉得很值得单独说：**展开缩写**——`gcd()` 不好懂，`greatest_common_divisor()` 就懂。规范里明确写「用描述性命名帮你省掉冗余注释」。\n提交流程有两条容易踩的：\n- **不接受重复实现。** 已有同一算法的实现就别再提一个功能相同的；允许的是新解法、不同表示、不同复杂度。提交前先搜一遍。\n- **不要为贡献算法去开 issue，直接提 PR。** 仓库不分配 issue，官方明说了不用先问。\n所有提交会过 GitHub Actions 的 `ruff check` 和测试，测试跑的是 doctest。\n想找导航从 [DIRECTORY.md](https://github.com/TheAlgorithms/Python/blob/master/DIRECTORY.md) 进，那份文件有 85KB，分类目录比在仓库里翻更清楚。仓库支持 Gitpod 一键在线改代码。",
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
    alternatives: [],
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
    alternatives: [],
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
    body: "Firecrawl 做的是一件很具体的事：**把任意 URL 转成 LLM 能直接用的干净数据**——Markdown、结构化 JSON、截图。README 里那句「Supercharge your AI agents with data from the web」就是它的定位：给 AI agent 喂网页数据。\n**它的核心卖点是「难的部分它替你处理了」。** 官方列的对比理由里有几条很实在：覆盖 96% 的网页、包括 JS 重页面，不需要你折腾代理；跨数百万页面 P95 延迟 3.4 秒；旋转代理、任务编排、限流、JS 拦截内容全部零配置接管。\n**端点分成两档，这个分层值得先搞清楚。** 核心端点三个：\n- Search —— 搜网并直接拿到结果页的完整内容\n- Scrape —— 把任意 URL 转 markdown、HTML、截图或结构化 JSON\n- Interact —— 先抓取，再用 AI 提示词或代码与页面交互\n\n其余能力还有 Agent（描述需求，自动收集数据）、Crawl（一个请求抓整站）、Map（即刻发现站点全部 URL）、Batch Scrape（异步抓上千个 URL）。\n**四种调用方式给的是同一套能力。** Python 是 `from firecrawl import Firecrawl`，Node 是 `import { Firecrawl } from 'firecrawl'`，cURL 打 `https://api.firecrawl.dev/v2/scrape`，CLI 直接 `firecrawl scrape <url>`。所以选语言不是问题，问题是**你要不要自托管**。\n**关于自托管，得先把预期说清楚。** Firecrawl 是开源的，同时也有托管服务（firecrawl.dev），但**云版本包含额外功能**，不是同一个东西。开源版是 AGPL-3.0，SDK 和部分 UI 组件是 MIT——这点在做商业集成前必须看清楚，AGPL 的传染性不是小事。另外官方明确写了：**默认遵守 robots.txt 指令**，并且把「遵守各网站政策」的责任放在使用者身上。\n**最后一条工程建议：如果你只是想让 agent 读网页，先试托管版再决定要不要自托管。** 自托管要准备 Redis、Playwright 和一堆环境变量，而托管版开箱就能用。判断依据是数据敏感度和调用量，不是功能列表。",
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
    alternatives: [],
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
    alternatives: [],
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
    alternatives: [],
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
    body: "anydoc 是 Firecrawl 做的 Rust 库，把 Word、PowerPoint、Excel、OpenDocument、RTF、EPUB、CSV 和 PDF 转成干净的 GitHub-Flavored Markdown。**它的定位是「单文档级别」的转换，不需要起服务。**\n**核心设计只有一句话：所有格式解析成一个共享的文档模型，再经过同一个 Markdown 序列化器输出。** 这意味着转义、表格、标题锚点、脚注的行为在所有格式上完全一致——不管输入是 2003 年的 .doc 还是昨天的 .pptx。而且**输出端的怪癖只修一次**：给 docx 修的表格转义问题，rtf、odt 和其他格式自动也就好了。\n**速度是它的硬指标之一：纯 Rust、无ML 模型、无外部服务，单文档中位转换时间 4.4 毫秒。** README 里的基准对比（100 份真实文档、14 种格式、LLM 盲评、482 次裁决）显示：anydoc 是**唯一覆盖全部 14 种格式**的工具，得分 81，且每个被评判的格式都是最高分。\n**格式识别看内容不看扩展名。** 格式是从字节本身读出来的——PDF 文件头、RTF 起始组、OLE 流名、ZIP 包 mimetype。**所以扩展名标错的文件照样能正确转换。** CSV 没有这类标记，才需要靠扩展名或显式指定格式。\n**结构保留做得比同类彻底**，包括：带锚点的标题、粗体/斜体/删除线、行内代码与代码块、链接与内部交叉引用、保留源文档编号的有序列表、合并单元格的表格、引用块、脚注与尾注、演讲者备注。公式会转成 LaTeX（Word/PPT 的 OMML、OpenDocument/EPUB 的 MathML、RTF 公式）。\n**五条接入路径，按你的场景选：**\n- **agent skill** —— 一条 `npx skills add firecrawl/anydoc`，让 Claude Code、Codex、Cursor、OpenCode 等 agent 能直接读 office 文档\n- **CLI** —— `npx @firecrawl/anydoc report.docx`，首次运行会下预编译二进制\n- **Node.js** —— `npm install @firecrawl/anydoc`，跑在 libuv 线程池上，不阻塞事件循环\n- **Python** —— 绑定会释放 GIL，其他线程照常跑\n- **浏览器** —— `@firecrawl/anydoc-wasm`，**文件在本地转换，完全不离开机器**\n\n**有一条边界必须先说清楚：本地读文本型 PDF，但不做 OCR。** 扫描件或纯图片的 PDF 会以 `NeedsOcr` 失败。**显式选择加入后，这类文档才会发给 Firecrawl Parse 做 OCR。** 要注意三点：**只有需要 OCR 的文档会离开机器，但整份文档都上传**（Parse 没有页码选择功能）；Parse 转不了的话 Node 会抛 `code: 'hosted'`、Python 抛 `HostedError`；**Rust crate 根本没有 ocr 选项，也从不联网。**\nMIT 许可。\n**怎么选：** 只需要本地把 office 文档变成干净 Markdown，它是最快的那个；需要在浏览器里离线处理，选 WASM 版；遇到扫描版 PDF 且不能接受上传，就说明这个场景不适合它。",
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
    alternatives: [],
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
];
