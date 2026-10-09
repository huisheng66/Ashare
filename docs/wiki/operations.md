# 脚本与运维

## 脚本速查表（19 个，全在 `scripts/`，共享 `_shared.mjs`）

`_shared.mjs` 提供：参数解析、运行库读取、并发限流、安全抓取（http/https 白名单 + 私有网段拒绝 + 逐跳重定向校验）。

### 开发与验证

| 命令 | 脚本 | 用途 |
|---|---|---|
| `npm run check` | — | ESLint + 路由类型生成 & tsc + 回归测试（提交前必跑） |
| `npm run lint` / `npm run typecheck` | — | 单独跑 lint / 类型检查 |
| `npm test` | — | Node 原生回归测试（tests/*.test.mjs） |
| `npm run smoke:detail` | `smoke-detail.mjs` | 详情页渲染冒烟（需先 `npm run dev`） |
| `npm run verify:report` | `verify-report-refs.mjs` | 校验优化报告里的行号引用仍准确 |

### 账号与口令

| 命令 | 用途 |
|---|---|
| `npm run admin:password` | 隐藏输入生成 `ADMIN_PASSWORD_HASH`（scrypt） |
| `npm run user` | 账号管理（增删改查、角色分配）—— 后台也能做，见 `/admin/users` |

### 数据库

| 命令 | 用途 |
|---|---|
| `npm run db:migrate` | 执行 `db/migrations/` 有序迁移（自研迁移器） |
| `npm run db:grants` | 生成/收紧数据库账号权限（最小权限原则） |
| `npm run db:import` | 从 JSON 运行库导入 MySQL（迁移用） |
| `npm run db:reindex` | 重建全文索引 |
| `npm run media:check` | 媒体存储探针冒烟（**启用 S3 前必须跑**：PUT/HEAD/GET/DELETE 一个探针对象，如实报错） |
| `npm run scale:check` | 规模检查 |

### 内容运营

| 命令 | 用途 |
|---|---|
| `npm run content:audit` | 列出条目缺失字段、场景库存与待补清单（`--scene <id>` 只看一个场景，`--json` 机器可读） |
| `npm run seed:sync` / `seed:drift` | 种子与运行库的双落点同步与漂移比对（`--strict` 非零退出） |
| `npm run merge:guides` | 教程行级合并（行级扫描定位） |
| `npm run add:trending` | 批量收录：从 `trending-incoming/` 导入并校验 schema |
| `npm run stale-links` | 外链巡检（详见下） |

### 备份

`npm run backup`：把运行库与上传图片复制成带时间戳快照，支持 `--out`（指向另一块盘/网盘目录）、`--keep N`（保留最近 N 份，只删带本脚本 manifest 的目录）、`--list`。**`.bak` 只防上一次保存，防不了磁盘故障**——定期整机快照是必须的。快照含用户投稿/反馈时，分享前会提示剔除。

## 外链巡检（链接新鲜度制度）

每条外链带 `linksCheckedAt`（最近一次人工确认可达的日期）。核心规则：**只有全部链接都可达的条目才回写日期**——把失效链接的日期刷成今天，死链就被永久掩盖。

```bash
npm run stale-links                     # 列出超 90 天未核验的条目
npm run stale-links -- --check --update # 探活并回写通过者
npm run stale-links -- --check-all      # 探活全站（CI 用）
```

参数：`--days N` 改阈值、`--strict` 有待复验/异常时非零退出（CI 用）、`--flaky-ok` 豁免人工确认过的误报、`--source seed` 从种子读（克隆后没有运行库）、`--json` 机器可读。

`github.com` 网页端常被网络策略拦，自动改用 `api.github.com` 代验同一仓库。误报因环境而异（Cloudflare 403、代理超时等），`--flaky-ok` 是防护。

## CI（GitHub Actions）

| Workflow | 内容 |
|---|---|
| `ci.yml` | push main / PR 时跑与本地相同的 `npm run check` |
| `link-watch.yml` | **每日死链巡检**，与本地三点不同：① `--source seed` 读目录；② `--check-all` 探全站（链接昨天正常今天挂，只看门槛发现不了）；③ `--flaky-ok` 豁免误报（不加它流水线长期变红，人开始习惯性忽略，真死链反而被淹没） |

## 部署要点

1. Node 常驻进程（`npm run build && npm run start`），保证 `data/store/` 与 `data/media/` 可写、`data/` 不在部署时被清空。
2. 前置 HTTPS 反向代理；仅当应用端口只对受控代理开放时设 `TRUST_PROXY=1`。
3. 图片表单上限 6 张预览 + 1 张图标各 5MiB；应用请求上限 36MiB，代理可设 `client_max_body_size 36m;`。
4. 环境变量：`MYSQL_URL`、`ADMIN_PASSWORD_HASH`、`SESSION_SECRET`（生成命令见 `.env.example`）；可选 `TRUST_PROXY`、`NEXT_PUBLIC_SITE_URL`、`MEDIA_DRIVER=s3`、`STORE_DRIVER=json`（回滚开关）。
5. **数据回滚**：设 `STORE_DRIVER=json` 切回 JSON 驱动；JSON 路径下停进程后用 `catalog.bak.json` 覆盖、删 `catalog.sha256.json`、重启。
6. CSP 每请求 nonce → 公开页面按请求渲染，不能开全站静态化。

> 历史注：本项目早期是"无数据库、纯 JSON"架构（旧版 README 与 `docs/项目索引.md` 如此描述），MySQL 迁移已完成——**默认即 MySQL**，JSON 仅是显式回滚路径。横向扩展的最后一环是媒体存储：多副本场景需 `MEDIA_DRIVER=s3`。
