// 第 4 条：tilelang。内容全部核实自官方 README（含 Quick Start 全文、Examples 清单、
// Installation 章节）与 tilelang.com，未凭印象。
export const entries = {
  tilelang: {
    slug: "tilelang",
    name: "TileLang",
    nameZh: "TileLang",
    aliases: ["tilelang", "tile lang", "tile language", "tvm", "gpu kernel", "算子开发"],
    summary:
      "写 GPU kernel 的专用语言：Python 语法写 GEMM、FlashAttention 这类算子，编译器自动做分块与流水线调度。",
    scenes: ["code", "engineering", "data"],
    platforms: ["linux", "windows", "macos"],
    source: "opensource",
    tags: ["GPU", "算子", "编译器", "Python", "开源"],
    body:
      "TileLang 是一门写计算内核的领域特定语言，目标是让高性能 GPU/CPU/NPU kernel（GEMM、反量化 GEMM、FlashAttention、LinearAttention 这类）写起来短一点，同时不放弃底层优化。它用 Python 语法，底层编译器架在 TVM 上。\n它解决的问题很具体。你要用 CUDA C++ 写一个带分块、多级流水、Tensor Core 的 GEMM，光是共享内存布局、线程映射、向量化就得写几百行；TileLang 把这些变成声明：分块大小写成参数，流水线写成 \`T.Pipelined(...)\`，矩阵乘写成 \`T.gemm\`，剩下的交给编译器。\n生态位是「PyTorch 之下的那一层」。PyTorch 负责搭模型，TileLang 负责其中几个 kernel 跑得比库里快。如果整个模型都是你的，你大概不需要它；如果你在调优某个卡住的算子，它就是那把工具。\n后端覆盖是它目前最厚的一层：CUDA、ROCm（AMD）、Metal（Apple）、LLVM（CPU），2026-09-30 起还官方支持了华为昇腾 950 NPU。Windows 支持在 2026-05-25 的 v0.1.10 里明确提到有改进，Linux 是主力平台。\n几个要提前知道的：一是**版本号还在 0.1.x**，2026-08-03 的 v0.1.13 明确写着移除了若干旧 API，升级前要读兼容性说明；二是**@tilelang.jit 会在首次调用时按输入形状做特化编译**，也就是第一次调用是编译而不是执行；三是**它不是玩具级项目**——官方自己在 README 里推荐从 examples/quickstart.py 起步，然后看 gemm 目录里的布局与自动调优，配套还有独立的 LSP 服务器。",
    officialUrl: "https://tilelang.com",
    links: {
      official: "https://tilelang.com",
      github: "https://github.com/tile-ai/tilelang",
    },
    officialLabel: "tilelang.com",
    whoFor:
      "在写或调优 GPU 算子、已经会用 PyTorch 但卡在某个 kernel 性能上的人；以及想做 Tile 级调度实验的研究者。",
    whoNot:
      "刚入门深度学习、只想把模型跑起来的人——它不是模型框架，替代不了 PyTorch；也没有可视化调试界面，调试全靠打印 IR 和 pass diff。",
    installTips: [
      "PyPI 装稳定版就行：pip install tilelang，然后 python -c \"import tilelang; print(tilelang.__version__)\" 验证。",
      "想提前用新特性可以装 nightly：pip install tilelang --find-links https://tile-ai.github.io/whl/nightly，但官方明说 nightly 不如正式版稳。",
      "AMD 卡上先装 ROCm 版 PyTorch（pip install torch --index-url https://download.pytorch.org/whl/rocm7.0）再装 tilelang，运行时还需要主机侧装了 ROCm。",
      "源码构建、editable install、Docker、pip 提供的 CUDA 工具链、自定义 TVM checkout —— 这五种情况才需要看完整安装指南，装 PyPI 版的人不用看。",
    ],
    alternatives: [],
    icon: { letter: "T", color: "#1F6F6B", simpleIcon: "nvidia" },
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
};
