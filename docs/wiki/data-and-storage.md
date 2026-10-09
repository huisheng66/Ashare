# 数据与存储

## 数据契约：`data/types.ts`

全部类型契约集中在一个文件，**改数据结构前先读它的注释**。核心实体 `Software`（条目）的主要字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `slug` / `title` / `summary` | string | 标识、名称、一句话简介 |
| `kind` | `ItemKind` | `app` / `script` / `opensource` |
| `source` | `SourceKind` | `official` / `opensource` / `discount`（与 kind 受自洽矩阵约束） |
| `status` | `PublishStatus` | `draft` / `review` / `published`（仅 published 对公众可见） |
| `scenes` / `platforms` / `tags` | 数组 | 场景（`data/scenes.ts` 定义 12 个）、平台、标签 |
| `price?` | string | 留空按「免费」，可填 `会员 ¥68/月` 这类短文案 |
| `links` | `ItemLinks` | 四类渠道：官网、主页、GitHub、已核验镜像 |
| `guide?` | `Guide` | 使用教程（行格式，由 `parseGuideLines` 解析） |
| `body` / `previews` / `iconImage?` | 正文/预览图（≤6 张）/图标图 |
| `license?` / `version?` / `linksCheckedAt?` | 结构化的"来源可核验"支撑字段 |
| `alternatives` | string[] | 平替条目 slug |

## 存储门面：`lib/store.ts`

所有运行库读写的**唯一入口**（catalog / feedback / submissions / ip_blocks）：

```
lib/store.ts（门面 + server-only）
  ├─ 默认   → lib/store-sql.ts   （MySQL）
  └─ STORE_DRIVER=json → lib/store-json.ts（回滚路径 + 测试隔离）
```

- **不是双写**，同一时刻只有一个实现生效。
- 写路径：`lib/catalog-persist.ts` 把一个条目拆成 `items` 主表 + 子表写入；`store-sql.ts` 里做审计写入。
- JSON 路径（仅回滚场景）：`lib/json-store.ts` 的 `JsonStore` 类——单文件读改写事务队列、SHA-256 旁车校验、保存前自动 `.bak`。

## MySQL 表结构（`db/migrations/`，5 个有序迁移）

| 迁移 | 内容 |
|---|---|
| `0001_init.sql` | 12 张表：`items` 主表 + 8 张子表（`item_tags` / `item_scenes` / `item_platforms` / `item_alternatives` / `item_links` / `item_previews` / `item_guide_resources`）+ `feedback` / `submissions` / `ip_blocks` / `clicks` |
| `0002_search-stopwords.sql` | `ft_stopwords` 全文搜索停用词表 |
| `0003_audit-log.sql` | `audit_log` 审计日志 |
| `0004_users.sql` | `users` 多用户账号 |
| `0005_list-indexes.sql` | 列表页索引 |

连接层：`lib/db.ts`——`getPool()` 连接池（29 条边，图谱数据层枢纽）、`poolSize()`、可重试锁错误的识别（`RETRYABLE_LOCK_ERRORS`）。迁移执行器自研（`scripts/db-migrate.mjs`）。

## 种子与运行库：两个落点

| 落点 | 用途 |
|---|---|
| `data/software.ts` | 静态种子，影响全新部署与 CI（CI 用 `--source seed` 读它） |
| 数据库（或 `data/store/catalog.json`） | 线上真实数据 |

**种子改了不会自动同步**：

```bash
npm run seed:sync     # 把种子同步到运行库
npm run seed:drift    # 比对两处是否一致（--strict 有差异非零退出）
```

⚠️ **已知陷阱**：`lib/seed.ts` 的字段透传清单加新字段时，必须同步 `scripts/seed-drift.mjs` 的比对字段，漏了会让漂移检测对该字段静默失明（脚本 22-25 行注释记录了这个真实踩过的坑）。

## 媒体存储：`lib/media-storage.ts`

预览图与图标图的存储抽象，`MEDIA_DRIVER` 选择：

- `local`（默认）：写 `data/media/`（**刻意不放 public/**，否则防盗链失效）。
- `s3`：S3 兼容对象存储（AWS S3 / 阿里 OSS / 腾讯 COS / MinIO）。客户端是 `lib/s3.ts` 自研的最小 SigV4 实现（PUT/GET/DELETE/HEAD 四个动作，只为不引入几 MB 的 AWS SDK）。
  - SigV4 签名串有字面量断言测试，但**未对真实 bucket 验签**——启用前必须跑 `npm run media:check` 做探针冒烟。

图片上传约束（`lib/input-validation.ts`）：最多 6 张预览 + 1 张图标，单张 ≤5MiB，JPEG/PNG/WebP/GIF，服务器侧做类型嗅探。

## 点击数据

- 写入：`app/track/actions.ts` → `lib/click-store.ts`。**只记 slug、渠道、时间，不存 IP 与 UA**——定位到条目已够用，存 IP 会把它变成第二份用户数据。
- JSON 路径下存 `data/store/clicks.jsonl`（只追加、永不压缩，读取只扫尾部 8 MiB / 20 万行，超限如实说明跳过）。
- 分析：`lib/click-analytics.ts` 供 `/admin/clicks` 展示总点击、渠道构成、14 天趋势与条目明细。
