# 前台

## 公开路由

| 路由 | 文件 | 说明 |
|---|---|---|
| `/` | `app/page.tsx`（`HomePage`） | 首页：场景导航 + 精选 |
| `/search` | `app/search/page.tsx` + `loading.tsx` | 搜索结果页 |
| `/scenes/[id]` | `app/scenes/[id]/page.tsx` | 场景页（12 个场景：code / docs / design / data / office / engineering / tools / photo / games / education / music / social） |
| `/software/[slug]` | `app/software/[slug]/page.tsx` | **详情页 `SoftwarePage`，全站最重页面**：正文分段、外链、来源徽章、许可证、价格、教程、平替 |
| `/about` | `app/about/page.tsx` | 收录标准说明 |
| `/submit` | `app/submit/page.tsx` + `actions.ts` | 公开投稿（限速 3 条/10 分钟） |
| `/feedback` | `app/feedback/page.tsx` + `actions.ts` | 反馈（限速 3 条/10 分钟） |
| `/media/[...path]` | `route.ts` | 预览图服务，**带防盗链**，路径精确匹配防穿越 |
| `/icons/[slug]` | `route.ts` | 品牌图标，纯读盘 `data/icons/<slug>.svg`，一年 immutable 缓存，**也带防盗链**，缺失 404 由前端回退字母块 |
| `/track` | `actions.ts` | 出站点击记录（Server Action，非页面） |
| `/robots.ts` `/sitemap.xml` `/sitemaps/[id]` | — | SEO：robots、分片 sitemap（大站超 5 万 URL 才需要分片；由 `lib/sitemap.ts` 出块） |

## 数据流

页面 → `lib/catalog.ts`（React `cache()` 请求级缓存）→ `lib/store.ts` 门面 → `lib/catalog-sql.ts`（SQL 组装：`allPublishedSql` 只取 published）→ `lib/db.ts::getPool()`。

**只有 `status === "published"` 对公众可见**（`isPublicStatus`），"待审核"绝不因为"不是 draft"而被放出去。

筛选/搜索参数解析在 `lib/catalog-query.ts`（`CatalogFilters`、`firstSearchParam`），全文搜索用 MySQL 全文索引 + `ft_stopwords` 停用词表。

## 展示派生（lib 纯函数层）

- `lib/items.ts`：展示模型转换（`toCatalogItem`）、平台/类型标签。
- `lib/derive.ts` / `lib/bodyColumns.ts`：正文中文行宽分栏。
- `lib/license-info.ts`：SPDX 许可证 → 中文说明，只对 `opensource` 条目展示。
- `lib/markdown.ts`：**自研 Markdown 子集解析器**（338 行，package.json 无任何 markdown 依赖）。入口 `parseMarkdown` 仅 4 行，实际解析在 `parseBlocks`(206) 与 `parseInline`(121)。渲染为结构化块而不是 HTML 字符串——安全边界就在这。
- `lib/guide.ts`：教程资源的行格式解析与校验（`parseGuideLines` → `isGuideKind`），消费方只有后台 `saveItem` 与前端 `GuideSection` 组件（333 行）。

## 主要业务组件

- **导航骨架**：`SiteHeader`（260 行，导航常量来源）/ `SiteFooter` / `Logo`。
- **目录与搜索**：`CatalogBrowser`（222 行，图谱 26 边的核心交互组件）/ `FilterPanel` / `SearchPanel` / `SceneBrowser` / `SceneGrid` / `SceneIcon`。
- **条目展示**：`SoftwareCard` / `SoftwareRow` / `SoftwareIcon` / `SourceBadge`（来源徽章，颜色不单独表达来源类型——无障碍要求）/ `TagList` / `PlatformList` / `LicenseNote` / `RichText` / `GuideSection` / `Breadcrumb`。
- **外链**：`OutboundLink`（156 行）+ `ItemLinks`——点击经由 `/track` 记录后跳转。
- **表单**：`SubmitForm` / `FeedbackForm` / `DraftKeeper`（后台表单草稿暂存）。

> ⚠️ 命名冲突：`lib/markdown.ts` 与 `lib/inlineText.ts` 都导出 `parseInline` / `inlineText`，职责不同（markdown 行内语法 vs 条目正文行内标记），import 时别搞混。

## 主题与视觉

- `next-themes` 浅色/深色双主题，同等对待（不是深色补丁）；尊重 `prefers-reduced-motion`。
- 设计令牌在 `app/globals.css`；视觉规范见 `claudedesign.md`（`DESIGN.md` 已废弃）。
- 无障碍基线 WCAG AA：对比度 ≥4.5:1（目标 7:1）、触控目标 ≥44px、键盘可达、可见焦点环。
- `prototype/home-v3-prototype.html` 是 1187 行原型稿，**不被应用引用**，仅视觉参考。

## SEO

- `generateMetadata` 按条目出标题/描述；JSON-LD 的 `offers` 仅在免费时输出（不谎报 `price:"0"`）。
- `NEXT_PUBLIC_SITE_URL` 未配置时省略绝对 SEO 链接、sitemap 返回空列表——不会输出错误的绝对地址。
- `/admin` 不进导航且 robots 禁止收录。
