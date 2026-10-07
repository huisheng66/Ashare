// 第 8 条：anyps5。内容全部核实自官方 README + docs/user/USAGE.md（Usage/Options/
// Runtime layout 三节）+ docs/user/COMPATIBILITY.md 兼容性表，未凭印象。
export const entries = {
  anyps5: {
    slug: "anyps5",
    name: "AnyPS5",
    nameZh: "AnyPS5",
    aliases: ["anyps5", "ps5", "ps5 移植", "游戏移植", "主机模拟", "relinker"],
    summary:
      "把 PS5 可执行文件自动转成 Linux/Windows 原生程序的移植工具：重链接器加系统库实现，无模拟无额外运行时。",
    scenes: ["code", "games", "engineering"],
    platforms: ["linux", "windows"],
    source: "opensource",
    tags: ["PS5", "移植", "逆向", "C++", "开源"],
    body:
      "AnyPS5 是一个把 PS5 可执行文件自动移植到 Linux 和 Windows 的工具。核心是一个 **relinker（重链接器）**，把可执行文件转换成目标系统的原生格式，加上供动态链接用的**系统 prx 库实现**。关键在最后一句：**没有模拟，也没有额外的运行时进程**。\n和模拟器路线（比如 PCSX2、RPCS3 那类）的区别是根本性的：它不是解释执行，而是把程序翻译成你机器的原生指令直接跑。代价是兼容性完全取决于「这个游戏用到的东西有没有被实现」。\n**当前状态要如实看。** 官方在 README 里给了一张测试过的游戏表，只有一款：**Dreaming Sarah**（2D 平台跳跃），代码 PPSA02929，在 GTX 1050 Ti / i5-7500 3.4GHz 上稳定 60 FPS，在 Intel HD Graphics 620 / i5-7200 2.5GHz 上 36 FPS，Windows 上可玩，Linux 那一栏官方自己标的是问号。系统库和着色器的完成度用徽章展示，项目主页有实时的库函数百分比地图。\n架构上还有一条硬约束：**遇到不支持或不符合预期的状态会严格抛 \`std::runtime_error\`，what() 打到 stderr 然后进程终止。** 不做静默降级——这是研究型项目的常见选择，代价是任何未实现的系统调用都会让程序直接崩。\n着色器这块有实打实的产出：shader 重编译器能成功生成 SPIR-V，并且在开启 \`ANYPS5_ENABLE_SPIRV_TOOLS\` 构建时用 Spirv-Tools 做校验。\n手柄支持是完整的：SDL 映射的游戏手柄都支持，包括摇杆和扳机。键鼠要在 \`anyps5-input.ini\` 里配置。\n**必须说清的前提：** 官方声明该项目面向互操作性、研究、保存与兼容性用途，**不包含、不分发、也不需要任何受版权保护的软件、固件、加密密钥或专有库**。用户需要自己确保手上的二进制来源合法且符合许可条款。翻译成实际使用：\n**能不能跑完全取决于那款游戏的兼容情况**，请先查官方兼容列表再决定投入时间。",
    officialUrl: "https://github.com/boykopovar/AnyPS5",
    links: {
      official: "https://github.com/boykopovar/AnyPS5",
      github: "https://github.com/boykopovar/AnyPS5",
    },
    officialLabel: "github.com/boykopovar/AnyPS5",
    whoFor:
      "做逆向工程与跨平台移植研究的开发者；或者想在自己 Linux/Windows 机器上原生跑某个特定 PS5 游戏、且愿意接受只有少数游戏可用的现实的人。",
    whoNot:
      "想找「PS5 游戏全兼容」方案的人——目前官方测试过的只有一款游戏；也不适合不懂命令行、不愿意自己准备合法二进制的人。",
    installTips: [
      "先查兼容列表再动手。官方 docs/user/COMPATIBILITY.md 目前只有 Dreaming Sarah 一行，确认你的目标游戏在里面再投入时间。",
      "relinker 没有 --help。不带参数运行会打印用法语法并以错误码退出——这就是它的帮助信息。",
      "所有开关默认关闭，unused-filter 默认 0、--rpath 默认 $ORIGIN/libs。别照抄别人的命令行，选项是逐个叠加的。",
      "在 Windows 上用 --rpath 时要加引号，PowerShell 里写 '$ORIGIN/libs'，否则 $ORIGIN 会被 shell 展开掉。",
    ],
    alternatives: [],
    icon: { letter: "A", color: "#4A5568", simpleIcon: "gamepad" },
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
};
