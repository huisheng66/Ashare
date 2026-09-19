# 变更记录

## 2026-09-19

- 首页直接搜索；搜索支持全角字符和多关键词，筛选状态可移除且保留排序与视图。
- 修复重复查询参数 500、非法场景查找、移动菜单不可滚动、表单校验失败丢输入。
- 目录读取按请求复用，卡片使用精简数据，图片按需缩放并在失败时回退；移除构建时外部字体依赖。
- 统一导航、卡片与平台信息，修正精选标签、按钮读屏名称和浅色徽章对比度。
- JSON 读改写事务、损坏数据保护、可恢复写队列、认证与上传校验、保存失败回滚。
- 修复 CSP nonce / 主题脚本，补充安全头、SEO 元数据、错误恢复与搜索加载状态。
- 增加回归测试、CI、环境配置样例、密码生成与统一检查命令。

本文件记录对 Ashare 的功能、界面与安全改动。格式按日期倒序，条目写明动机与涉及文件。
规划类文档见 [next.md](./next.md)，产品与视觉规范见 [PRODUCT.md](./PRODUCT.md) / [DESIGN.md](./DESIGN.md)。

## 2026-09-17 · 页脚备案

- 全站页脚与侧栏底部增加备案号：鲁公网安备37011602000384号、鲁ICP备2026008648号-1，分别链到公安部与工信部查询页。

## 2026-09-15 · 收录 Mineradio

- 新增条目 [Mineradio](https://github.com/XxHuberrr/Mineradio)（GPL-3.0，Windows/macOS 沉浸式音乐播放器），归入新「音乐」类别（首个条目）。
- 写入 `data/samples.ts`（种子）与 `data/store/catalog.json`（运行库，SHA-256 同步）。
- 注意：该播放器接入网易云/QQ音乐第三方接口，登录态与音源可用性随平台变化。

## 2026-09-15 · 类别页调整

- 类别页 `SceneBrowser` 去掉「来源」筛选（全部来源/开源/官方/优惠），只保留「系统」；相关 state 与常量清理。
- 类别页新增九宫格/行排列切换（默认行排列），网格卡片抽为共用组件 `SoftwareCard`。

## 2026-09-15 · 类别页视图切换

- 抽出 `components/SoftwareCard.tsx`（网格卡片），首页与类别页共用，不再各写一份。
- 类别页 `SceneBrowser` 新增九宫格/行排列两个排列按钮，位置在「系统」选择器左侧；**默认行排列**。

## 2026-09-15 · 卡片 CTA 与类别追加

- 卡片（网格/列表/横滑）的「前往」外链按钮改为「查看」，先跳详情页，由用户自己点官网链接；详情页保留「前往官网」CTA 与 `ItemLinks` 外链。
- 侧边栏类别追加 6 个：工具、摄影与录像、游戏、教育、音乐、社交（原有开发/文档/设计/数据/办公/制图不合并、不重打，新类别暂为空）。
- 同步改动：`SceneId` 类型、`data/scenes.ts`、`lib/colors.ts`、`lib/catalog.ts` 的 counts、`SidebarIcons` 图标、侧栏与移动导航配色。

## 2026-09-15 · 侧边栏重排与全宽布局

- 侧边栏移除筛选面板（`FilterPanel` 不再挂在 Sidebar），只保留导航：探索 / 类别 / 更多三个分组。筛选改由内容工具栏的「筛选」按钮打开左侧 `Sheet`，桌面与移动一致（去掉按钮上的 `lg:hidden`）。
- 场景名去掉动词，改为名词：写代码→开发、写文档→文档、做设计→设计、做数据→数据、办公协作→办公、工程制图→制图。
- 全站页面容器改为铺满（去掉 `max-w-980/1000/1200` 居中）；详情页与关于页的正文段落仍用 `max-w-[68ch]` 保证阅读宽度。
- `layout.tsx` 不再为侧栏计算 `catalogCounts`，去掉 `Suspense` 包裹。

## 2026-09-15 · 界面重构：迁移 shadcn/ui

### 定位变更

- 放弃 Mac App Store 复刻，改为「简洁、年轻、现代化」的舒展卡片流。
- 重写 `PRODUCT.md`（品牌三词、反参考、设计原则）与 `DESIGN.md`（shadcn + Tailwind v4 设计系统、浅/深主题、组件映射）。
- `next.md` 顶部标注为历史文档（实现前的规划，描述已过时）。

### 技术底座

- 引入 shadcn/ui（`style: radix-nova`，底层 Radix Primitives + Lucide），新增 `components.json`。
- 新增依赖：`radix-ui`、`class-variance-authority`、`cn`、`lucide-react`、`tw-animate-css`、`next-themes`、`sonner`、`cmdk`。
- `components/ui/*`（20 个组件文件）归项目所有。
- 因 `shadcn` CLI 的 registry 直连不稳、且会读 `ALL_PROXY`（socks）断连，改用 curl 拉取 registry，并修复了原始文件里的内部别名（`@/registry/...`）与 `IconPlaceholder`（替换为 Lucide）。

### 主题

- `app/globals.css` 重写：shadcn 语义变量（oklch）+ `@custom-variant dark` + 项目扩展色（`--official/--opensource/--discount`）。
- 品牌主色改为紫 `oklch(0.53 0.235 277)`，圆角基准 `0.75rem`。
- 新增深色主题（`.dark`），`next-themes` 接管，`ThemeToggle` 放入 Header / Sidebar。
- **一次替换**：全站旧 token 类名改为 shadcn 命名（`text-muted`→`text-muted-foreground`、`bg-bg`→`bg-background`、`bg-surface`/`bg-fill`→`bg-muted`、`border-line`→`border-border`、`text-link`→`text-primary` 等），共 29 个文件。

### 首页试点

- `Header`：移动端导航改用 `Sheet` 抽屉，加主题切换。
- `Sidebar`：换用新 token 与 `bg-sidebar`，加主题切换。
- `HotSearchBar`：热门词改用 `Badge`。
- `CatalogBrowser`：工具栏用 `Button`/`Select`，移动筛选用 `Sheet`，卡片改用 `Card`/`Badge`/`Button`，网格加宽到 `max-w-1200`、`gap-5`。
- `app/page.tsx`：新增「编辑精选」横滑行（复用 `AppCardRow` + `featured`）。

### 详情页迁移（同一日）

- `app/software/[slug]/page.tsx` 重写：`Button` 主 CTA、`Badge`、`Card` 信息条（`gap-px` 发丝线）、`Separator` 分节、圆形序号教程、适合/不适合卡片、`ItemLinks` 卡片化。
- 同步迁移：`TagList`（Badge）、`SourceBadge`（Badge + 扩展色）、`ItemLinks`（Card + Lucide 图标）、`AppCard`（Card + Button，编辑精选与替代行同时变新）。
- 注：lucide 已移除品牌图标，GitHub 链接行用 `GitBranch` 代替。

### 列表与筛选迁移（同一日）

- `SoftwareRow`：改为 `Card` 行（`flex-row` + hover 抬升），GET 按钮用 `Button`；列表视图容器加 `space-y-2`（`CatalogBrowser`、`SceneBrowser`）。
- `FilterPanel`：自研勾选框/开关改为 shadcn `Checkbox` / `Switch` / `Label`，分组标题降级为 13px 灰字。
- 因全部改用 `Button`，`components/ExternalButton.tsx` 已无引用，删除。

### 表单迁移（同一日）

- 新增 `components/form-field.tsx`（共享 `Field` + `Label`），两表单各自重复的 `Field`/`inputClass` 已删。
- `SubmitForm` / `FeedbackForm`：改用 shadcn `Select`（Radix 会渲染同名隐藏 `select`，Server Action 的 FormData 照常拿到值）、`Input`、`Textarea`、`Button`，成功态用 `Card`。
- `/submit`、`/feedback` 去掉外层灰底卡片。

### 后台迁移（同一日）

- 登录页：`Card` + `Field` + `Input` + `Button`。
- 条目列表：`Table` 组件化，状态改 `Badge`，删除加 `AlertDialog` 确认（确认框内嵌 Server Action 表单）。
- 录入表单：分节改 `Card`，文本/长文换 `Input`/`Textarea`，标签换 `Field`；**保留原生 `<select>`/`<checkbox>`/`<input type=file>`**——Radix 的 Select/Checkbox 不参与原生表单事件，会破坏 `DraftKeeper` 草稿恢复。
- inbox：三个区块改 `Card` 化，删除/解封用 `Button`，删除统一 `AlertDialog` 确认。
- 验证：用 `SESSION_SECRET` 自签合法 session cookie，后台四页（列表/inbox/新建/编辑）全部 200。

### 未迁移

仅剩 `PlatformList`（12px 灰字平台列表，无逻辑，暂不动）。

## 2026-09-15

### 新增：条目价格字段

卡片原来对所有条目硬编码「免费」，付费/会员制条目展示失真（如剪映会员这类）。

- `data/types.ts`：`Software` 与 `SeedSoftware` 新增可选 `price?: string`；留空按「免费」，可填短文案如 `会员 ¥68/月`。
- `app/admin/items/[id]/page.tsx`：基本区新增「价格」输入。
- `app/admin/actions.ts`：`saveItem` 落库 `price`。
- `components/CatalogBrowser.tsx`：卡片价格位改 `{item.price ?? "免费"}`，长文案 `truncate` + `title`。
- `app/software/[slug]/page.tsx`：「信息与安全」新增价格行；JSON-LD 的 `offers` 仅在免费时输出（此前付费条目谎报 `price:"0"`）。
- 种子 `obsidian / figma / wps` 补价格，本地 `data/store/catalog.json` 同步并重算 SHA-256。

### 变更：图标改为本地

`cdn.simpleicons.org` 现由 Cloudflare 人机验证拦截，Node fetch 取不到，导致全部 logo 回退字母块。运行时不再访问外部 CDN。

- 新增 `data/icons/*.svg`（21 个，提交进仓库）。
- `app/icons/[slug]/route.ts`：改为纯读盘（`data/icons/<slug>.svg`），命中返回 `image/svg+xml` + 一年 immutable 缓存，缺失 404 由前端回退字母；删除 CDN 拉取与 7 天过期逻辑。
- `.gitignore`：移除 `data/cache/`，`data/icons/` 明确不忽略；删除旧目录 `data/cache/`。
- 补件：`rstudio` 取 simple-icons 现名 `rstudioide`、`gnuoctave` 取 `octave`（均上品牌色）；`visualstudiocode` 取 devicon 彩色 logo；`windows` 图标 simple-icons 已下架，`components/FilterPanel.tsx` 平台 chip 回退字母 `W`。

### 变更：预览区支持 GIF

- `app/admin/actions.ts`：上传白名单加 `image/gif`；单图上限 `1.5MB → 5MB`。
- `app/media/[...path]/route.ts`：Content-Type 增加 `gif`。
- `app/admin/items/[id]/page.tsx`：预览 `accept` 加 gif，文案更新。
- `next.config.ts`：Server Action `bodySizeLimit` `2mb → 6mb`。

### 修复

- **生产环境上传图片 404**（`app/media/[...path]/route.ts`）：路径白名单 `^[a-zA-Z0-9-]+$` 不允许点号，而上传文件名是 `hex.gif` 这类带点格式。dev 下由 Next 静态服务抢占未暴露，构建后新上传的图会全部 404。改为精确匹配生成格式 `^[a-f0-9]+\.(jpe?g|png|webp|gif)$`，并加 8 例路径校验（含 `..` 穿越）。
- **开发模式 CSP 缺 `unsafe-eval`**（`proxy.ts`）：React/Turbopack 调试依赖 eval，控制台报错。仅在非生产环境追加 `'unsafe-eval'`，生产不放宽。
- 既有 lint 错误：`app/search/page.tsx` 未转义引号改为中文引号；`app/admin/inbox/page.tsx` 的 `Date.now()` 加 Server Component 豁免注释。

### 界面细节（不引入依赖）

- `app/globals.css`：新增 `--shadow-card-hover` token。
- `components/CatalogBrowser.tsx` / `SearchResultCard.tsx`：卡片 hover 抬升 + 预览图 `scale-[1.04]`。
- `components/AppCard.tsx`：横向卡 hover 抬升。
- `components/ExternalButton.tsx`：`active:scale-[0.97]` 按压反馈 + 过渡。
- `components/HotSearchBar.tsx`：随机描边色改为统一胶囊 + 品牌色圆点。

### 删除：死代码

- `components/GlassAppIcon.tsx`（旧 hero 残留，无引用）。
- `lib/catalog.ts`：`featuredSoftware()`。
- `data/types.ts` + `data/scenes.ts`：`Scene.tagline`（无处渲染）。
- `components/ExternalButton.tsx`：未用的 `"text"` 变体。
- `components/SoftwareRow.tsx`：未用的 `showAction` prop。
- 未用 import：`app/admin/items/[id]/page.tsx` 的 `deleteItem`、`components/FilterPanel.tsx` 的 `sceneColors`。

### 运维

- 重置管理员口令（`ADMIN_PASSWORD_HASH`，scrypt），明文与哈希均不入仓库、不记入本文档。
