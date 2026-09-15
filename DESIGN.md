# Design System

现代、干净的目录站视觉：**shadcn/ui + Tailwind CSS v4**，浅色/深色双主题，舒展卡片流。取代早期的 Mac App Store 复刻方向。

## 技术底座

- **shadcn/ui**：`style: radix-nova`（底层 Radix Primitives + Lucide 图标），源码复制在 `components/ui/`，归项目所有，可任意改。
- **Tailwind v4**：无 config 文件，主题在 `app/globals.css` 的 `@theme inline` 里声明。
- **深色模式**：`next-themes`（`attribute="class"`），`.dark` 类切换；`globals.css` 里 `@custom-variant dark (&:is(.dark *))`。
- **`cn`**：`import { cn } from "cn"`（shadcn v4 的统一包，不再是 clsx + tailwind-merge）。
- **图标**：界面用 `lucide-react`；品牌/场景图标走 `components/SidebarIcons.tsx` 与本地 `data/icons/`。
- 配置见根目录 `components.json`；`shadcn` CLI 可直接 `npx shadcn add <component>` 继续加组件。

## 主题 token

语义变量定义在 `:root` / `.dark`，经 `@theme inline` 映射成 Tailwind 工具类（`bg-background`、`text-muted-foreground` …）。

| Token | 浅色 | 用途 |
|---|---|---|
| `--background` / `--foreground` | `oklch(1 0 0)` / `oklch(0.145 0 0)` | 页面底 / 正文 |
| `--card` / `--card-foreground` | 同 background / foreground | 卡片 |
| `--popover` / `--popover-foreground` | 白 / 近黑 | 浮层、下拉 |
| `--primary` / `--primary-foreground` | `oklch(0.53 0.235 277)` 紫 / 白 | 主行动色、链接、选中态 |
| `--secondary` / `--accent` | `oklch(0.97 0 0)` | 次要按钮、hover 底 |
| `--muted` / `--muted-foreground` | `oklch(0.97 0 0)` / `oklch(0.552 0 0)` | 灰底 / 说明文字 |
| `--destructive` | `oklch(0.577 0.245 27.325)` | 错误、删除 |
| `--border` / `--input` / `--ring` | `oklch(0.922 0 0)` / 同 / `--primary` | 描边、输入框、焦点环 |
| `--radius` | `0.75rem` | 圆角基准（`rounded-lg` = 1×，`xl` = 1.4×） |

深色是反转中性阶：背景 `oklch(0.145 0 0)`、卡片 `oklch(0.205 0 0)`、`--primary` 提亮到 `oklch(0.72 0.17 277)`，描边改半透明 `oklch(1 0 0 / 12%)`。

**项目扩展色**（来源徽章，浅/深各一套）：`--official` 蓝、`--opensource` 绿、`--discount` 橙红。用法 `bg-official/10 text-official`。**不靠颜色单独表意**，徽章始终带文字。

**阴影**：`--shadow-card`（常态）、`--shadow-card-hover`（悬停抬升）。

**字体**：`--font-sans` = `Noto Sans SC`（中文主）+ PingFang / 微软雅黑回退；`letter-spacing: -0.011em`。

## 布局

- 桌面：左侧栏 `240px` sticky，`bg-sidebar`、右描边；内容列 `max-w-1200` 居中，`px-5/8`。
- 移动：顶部 `nav-blur` 半透明栏（`h-14`），导航收进右侧 `Sheet` 抽屉；筛选收进左侧 `Sheet`。
- 首页自上而下：热门搜索 → 编辑精选（`AppCardRow` 横滑）→ 工具栏（筛选 / 视图切换 / 排序）→ 卡片网格。
- 卡片网格：`repeat(auto-fill, minmax(260px,1fr))`，`gap-5`，舒展。

## 组件

用 `components/ui/*` 的 shadcn 组件，不要另造：

| 场景 | 组件 |
|---|---|
| 行动按钮 | `Button`（default / secondary / outline / ghost / link） |
| 卡片 | `Card` + `CardContent` 等；图片作首子元素或 `py-0` 去内边距 |
| 标签 / 徽章 | `Badge`（secondary 作热门词，default 作 NEW） |
| 输入 | `Input` / `Textarea` / `Label` / `Select` |
| 开关与多选 | `Switch` / `Checkbox` |
| 浮层 | `DropdownMenu` / `Dialog` / `Sheet` / `Tooltip` / `Popover` |
| 搜索面板 | `Command`（⌘K 方向） |
| 反馈 | `sonner` 的 `Toaster`（layout 已挂） |
| 分隔 / 骨架 / 滚动 | `Separator` / `Skeleton` / `ScrollArea` |

全站（首页、详情、列表、筛选、表单、后台）已迁移到上述组件；仅 `PlatformList` 仍是旧结构（无逻辑，仅展示）。

## 动效

- 时长 150–300ms，ease-out；hover 颜色/阴影过渡；卡片 `hover:shadow-card-hover`，缩略图 `group-hover:scale-[1.03]`。
- 按钮 `active:scale-[0.97]`。
- 横向行 `scroll-row`：scroll-snap，隐藏滚动条。
- `prefers-reduced-motion: reduce` → 全部瞬时。

## 无障碍

- 焦点：`:focus-visible` 2px `--ring`，offset 2px；shadcn 组件自带 `focus-visible:ring`。
- 触控目标 ≥ 44px（移动端菜单行 `h-11`）。
- 图标按钮必须有 `aria-label`；`NavIcon` 均配文字标签。
- 对比度 ≥ 4.5:1；深色主题同样校验。
- 跳转正文链接、`role="alert"` 错误文案保留。

## 反参考

不做：绿色软件站的捆绑/虚假按钮；营销式假评分、假推荐位、满屏渐变字。允许克制的渐变与动效。
