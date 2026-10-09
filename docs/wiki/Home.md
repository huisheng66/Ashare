# Ashare Wiki 首页

**Ashare** 是按使用场景组织的软件/工具目录站：只收录三类**合法、可核验来源**的条目——厂商正式版应用（含免费档/优惠入口）、脚本小工具、开源项目。不托管安装包，不收录破解版、修改版、序列号与盗版网盘包。

> 一句话技术画像：Next.js 16 App Router 单体应用，React 19 + Tailwind v4 + shadcn/ui，**MySQL 为默认存储（JSON 驱动保留为回滚路径）**，无外部重型依赖（markdown 解析、S3 SigV4 客户端、迁移器全部自研）。

## 快速导航

| 想了解什么 | 去哪页 |
|---|---|
| 代码怎么分层、一个请求怎么流转 | [架构总览](./architecture.md) |
| 数据长什么样、存到哪、MySQL 表结构 | [数据与存储](./data-and-storage.md) |
| 公开页面、搜索筛选、SEO | [前台](./frontend.md) |
| 后台管理、账号权限、审核流 | [后台管理](./admin.md) |
| CSP、防盗链、限速、封禁 | [安全机制](./security.md) |
| 19 个运维脚本、备份、CI、部署 | [脚本与运维](./operations.md) |
| 测试怎么跑、都测什么 | [测试与验证](./testing.md) |

## 五分钟上手

```bash
npm ci
cp .env.example .env.local          # PowerShell: Copy-Item .env.example .env.local
npm run admin:password              # 隐藏输入，生成 ADMIN_PASSWORD_HASH
npm run db:migrate                  # 初始化 MySQL 表结构
npm run dev                         # http://localhost:3000
```

- **Node.js 24**（开发与 CI 均按此验证）。
- 首次启动会把 `data/software.ts` 的静态种子灌入运行库。
- 不配 `MYSQL_URL` 时可设 `STORE_DRIVER=json` 走本机 JSON 回滚路径（仅适合开发；生产默认且必须是 MySQL）。
- 提交前跑 `npm run check`（ESLint + 路由类型/tsc + 回归测试）。

## 核心文档地图

| 文件 | 定位 |
|---|---|
| `README.md` | 最完整的一份：开发、内容管理、安全、部署、脚本表 |
| `PRODUCT.md` | 用户画像、产品目的、品牌个性、无障碍要求 |
| `claudedesign.md` | 视觉规范（取代已废弃的 `DESIGN.md`） |
| `CHANGELOG.md` | 按日期的变更记录，写清"为什么这么改" |
| `docs/项目索引.md` | codebase-memory-mcp 图谱索引（2026-10-07，MySQL 迁移收尾前，部分结论已过时） |
| `docs/MySQL 迁移计划.md` / `docs/优化改进报告.md` | 迁移与深度优化报告 |
| `docs/wiki/`（本目录） | 结构化项目 Wiki |

## 给 AI 助手的说明

- 代码知识图谱：`graphify-out/graph.json`（1361 节点 / 3650 边，tree-sitter AST 提取），可用 `graphify query "<问题>"` 查询；agent 可爬的分社区 wiki 在 `graphify-out/wiki/index.md`。
- AGENTS.md 由 `next dev` 自动生成（Next.js 16 注意事项），勿删。
- 收录工作流见 `.workbuddy/skills/ashare-curation/SKILL.md`。
