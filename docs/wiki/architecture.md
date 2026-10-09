# 架构总览

> 来源：代码通读 + graphify AST 图谱（`graphify-out/graph.json`，1361 节点 / 3650 边 / 88 社区，commit `e9b19a20`）。

## 分层

```
app/            路由层：页面（Server Components）+ Server Actions，不放业务逻辑
components/     展示层：33 个业务组件 + 22 个 shadcn/ui（components/ui/）
lib/            领域层：38 个模块，无 React 依赖，可单测；带 "server-only" 标记
data/           契约层：类型定义、场景表、种子数据、本地运行库与品牌图标
scripts/        运维层：19 个 .mjs 脚本，与 lib 共用约定（_shared.mjs）
db/migrations/  数据库结构：5 个有序 SQL 迁移
tests/          回归测试：27 个 node:test 文件
proxy.ts        边缘中间件：CSP nonce、/admin 方法白名单
```

图谱验证的特征：**lib 层模块间调用极少**（生产模块 CALLS 出边普遍 ≤2），模块之间靠数据传递而非函数嵌套——这是"lib 是无 React 的纯逻辑层"的直接证据。依赖密集的地方在测试文件（`guide.test.mjs` 16 条、`data-model.test.mjs` 16 条调用边），lib 的主要消费方是测试。

## 关键抽象（graphify "God Nodes"，按连接数排序）

| 节点 | 边数 | 为什么重要 |
|---|---|---|
| `Button()` | 52 | 全站 UI 底座（components/ui/button.tsx） |
| `lucide-react` / `next` / `react` | 41/41/36 | 框架与图标层 |
| `getPool()` | 29 | MySQL 连接池唯一入口（lib/db.ts），所有 SQL 读写经由它 |
| `CatalogBrowser()` | 26 | 前台目录页核心交互组件 |
| `SoftwarePage()` | 25 | 详情页（app/software/[slug]/page.tsx，全站最重页面） |
| `mysqlDriver()` | 24 | 存储门面的驱动开关（lib/store.ts），决定走 MySQL 还是 JSON |
| `AdminPage()` | 23 | 后台首页 |

跨社区桥接点（高介数中心性）：`mysql2` 连接 `db.ts`、`store-sql.ts`、`catalog-sql.ts`、`catalog-persist.ts` 等全部 SQL 模块——数据层是真正的枢纽。**未检测到 import 环**。

## 一个请求的生命周期

**公开页面（如 `/software/[slug]`）**

1. `proxy.ts` 边缘运行：注入每请求 CSP nonce、基础安全响应头。
2. `app/software/[slug]/page.tsx` 的 `SoftwarePage` 以 `generateMetadata` 出 SEO 元数据。
3. 经 `lib/catalog.ts`（React `cache()` 包裹，同请求内去重）→ `lib/store.ts` 门面 → `mysqlDriver()` 为真 → `lib/catalog-sql.ts` 组装 SQL（`allPublishedSql` / `loadItemsBySlugs`）→ `lib/db.ts` 连接池。
4. 原始行经 `lib/catalog-rows.ts` / `lib/items.ts` / `lib/derive.ts` 派生为展示模型（平台标签、来源徽章、许可证说明）。
5. 正文与教程由 `lib/markdown.ts`（自研解析器）与 `lib/guide.ts` 渲染为纯文本分块——**不解析 HTML，无存储型 XSS**。

**外链点击（`OutboundLink` → `/track`）**

`app/track/actions.ts::recordOutboundClick` 白名单校验 slug + 渠道 → 按 IP 限速 60 次/分钟 → fire-and-forget 写 `clicks`（不抛错，绝不影响跳转）。

**后台写入（`saveItem`）**

`app/admin/actions.ts` → `requireAdmin()` 会话与权限检查（`lib/users.ts` 权限矩阵）→ `lib/semantics.ts::validateSemantics` 来源/类型自洽校验 → `lib/catalog-persist.ts` 拆分写入 `items` + 8 张子表 → `lib/audit.ts` 字段级 diff 写 `audit_log`。

## 目录速查

| 路径 | 内容 |
|---|---|
| `app/admin/*` | 后台：登录、条目列表/表单、inbox、clicks（`actions.ts` 集中放 Server Action） |
| `app/{search,scenes,software,about,submit,feedback}` | 公开路由 |
| `app/{media,icons,track,sitemap.xml,sitemaps,robots.ts}` | 非页面端点：媒体服务（带防盗链）、点击记录、SEO |
| `lib/store*.ts` | 存储三件套：门面 `store.ts` + 双实现 `store-json.ts` / `store-sql.ts` |
| `lib/catalog*.ts` | 读路径四件套：`catalog.ts`（缓存门面）/ `catalog-sql.ts`（SQL 组装）/ `catalog-rows.ts`（行组装）/ `catalog-query.ts`（筛选解析） |
| `data/store/` | JSON 运行库与点击日志（0600，不进 git）——仅 `STORE_DRIVER=json` 时使用 |
| `prototype/` | 1187 行首页原型稿，**不在编译链上**，仅视觉参考 |

## 设计决策与理由（代码注释中明确记录的）

- **默认值即决定**：`mysqlDriver()` 用 `!== "json"` 而非 `=== "mysql"`——忘了配置就静默退回 JSON 是最隐蔽的生产事故，宁可默认数据库。（`lib/store.ts`）
- **不是双写**：同一时刻只有一个驱动生效，数据库是唯一事实源；JSON 路径保留纯粹为了回滚与测试隔离。
- **避免重型依赖**：markdown 子集解析器（338 行）、SigV4 S3 客户端（4 个动作）、迁移器全部自研，package.json 运行时依赖仅 12 个。
- **权限判断集中在一张纯函数表**（`lib/users.ts` 的 `MATRIX`）——散落在各 server action 里最容易"新入口忘检查"。
- **媒体放 `data/` 而非 `public/`**：放 public 下会被 `next start` 当静态资源直送，防盗链中间件根本不执行。（`lib/media-storage.ts`）
