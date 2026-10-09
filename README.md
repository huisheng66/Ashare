# Ashare

按使用场景找软件与工具的目录站。收录三类**合法、可核验来源**的条目：厂商正式版应用（含免费档/优惠入口）、脚本小工具、开源项目。不托管安装包，**不收录破解版、修改版、序列号与盗版网盘包**；网盘链接仅限作者/项目方的已核验合法镜像。

产品定义见 [PRODUCT.md](./PRODUCT.md)，视觉规范见 [claudedesign.md](./claudedesign.md)（取代旧的 DESIGN.md），改动记录见 [CHANGELOG.md](./CHANGELOG.md)，早期规划 [next.md](./next.md) 已标为历史。项目 Wiki 见 [docs/wiki/](./docs/wiki/Home.md)——结构化的架构 / 数据 / 前后台 / 安全 / 运维 / 测试说明。

## 技术栈

Next.js 16 App Router + React 19 + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)（`radix-nova` 风格，源码在 `components/ui/`）。浅色/深色双主题（`next-themes`），界面图标用 Lucide，品牌图标走本地 `data/icons/`。无数据库，数据存本机 JSON。

## 本地开发

```bash
npm ci
cp .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
npm run admin:password       # 隐藏输入，生成 ADMIN_PASSWORD_HASH
npm run dev                  # 或 npm run build && npm run start
```

开发与 CI 已使用 Node.js 24 验证，建议采用同一版本。`SESSION_SECRET` 的生成命令见 `.env.example`。界面使用系统字体，构建无需下载 Google 字体。

打开 [http://localhost:3000](http://localhost:3000)。首次启动会把 `data/software.ts` 的静态种子灌入 `data/store/catalog.json`。

## 内容管理（后台）

- 入口 `/admin`（不进导航，robots 已禁止收录），单口令登录，会话约 8 小时。
- 条目：类型 / 标签 / 简介 / 价格 / 使用教程 / 详细介绍（纯文本分段）/ 四类链接（官网、主页、GitHub、已核验镜像）/ 预览图（最多 6 张，JPEG/PNG/WebP/GIF，单张 ≤5MiB，合计最多 35MiB，服务器存储）与图标图，支持草稿与发布。许可证、版本与链接核验日期可单独填写——「来源可核验」需要有结构化字段支撑，不能只写在正文里。
- **来源与类型必须自洽**：组合由 `lib/semantics.ts` 定义（`official` → `app`/`script`，`opensource` → `opensource`/`app`，`discount` → `app`），后台保存与 `ingest` 脚本共用同一份矩阵。这是 GeoGebra 那类「标开源但许可闭源」的根治办法——此前靠人肉判断，已改为机器拦截。标为 `opensource` 却没有 GitHub 链接时，「开源」这一断言缺少可核验依据，`--strict` 下会拦下。
- 投稿与反馈在 `/admin/inbox`：投稿可一键转为条目（自动预填表单）；反馈可标记已读 / 删除；IP 封禁列表可解封。
- 点击数据在 `/admin/clicks`：总点击、被点击条目数、最常走的渠道、14 天趋势、渠道构成与条目明细（含渠道拆分与占比）。条目已删除时仍保留其历史点击并标注「已删除条目」，便于发现该清理的 slug。
- 数据都在 `data/store/*.json`（0600 权限，不进 git）。单个 Node 进程内，读改写事务按文件串行执行；损坏 JSON 会报错，不会自动用种子覆盖。每次保存目录会先备份上一版到 `catalog.bak.json`，并记录 SHA-256（启动时校验，文件被改动会打日志）。

外链点击另存 `data/store/clicks.jsonl`（JSONL 追加写，0600，不进 git）。**只记录 slug、渠道与时间，不存 IP 与 UA** —— 定位到具体条目已经够用，存 IP 会让这份数据变成第二份用户数据。写入为 fire-and-forget：内存缓冲 5 秒或攒够 200 条才落盘，失败只记日志，绝不影响用户跳转。查看见 `/admin/clicks`。该文件永不压缩、只追加，因此读取只扫尾部 8 MiB / 20 万行；超限时页面会如实说明跳过了多少条，不把部分数据说成全量。

`.bak` 只覆盖上一次保存，防不了磁盘故障与误删目录：定期跑 `npm run backup` 做整机快照，并让 `--out` 指向另一块盘或网盘同步目录。条目缺正文、缺标签、场景空栏这类内容缺口，用 `npm run content:audit` 查看。

链接会失效，所以每条都有 `linksCheckedAt` 记录最近一次人工确认可达的日期。`npm run stale-links` 找出超过 90 天没核的条目，`--check --update` 探活并回写 —— **只有全部链接都可达的条目才回写**：把失效链接的日期刷成今天，下一轮巡检就会以为它刚查过，死链被永久掩盖。回写后仍需同步种子（`linksCheckedAt` 也在两个落点里），跑 `npm run seed:drift` 确认一致。

死链巡检由 GitHub Actions 每日自动跑（`.github/workflows/link-watch.yml`）。CI 上有三点与本地不同：

- 用 `--source seed` 读目录。`data/store/` 已 gitignore，克隆后只有种子。
- 用 `--check-all` 探全站，而不是只查过期的 —— **链接昨天还正常、今天挂了，只看门槛是发现不了的**。门槛决定「什么时候必须复验」，不限制「能查什么」。
- 用 `--flaky-ok` 豁免人工确认过的误报。不加它流水线会长期变红，人就开始习惯性忽略，真死链反而被淹没。

探活 `github.com` 网页端常被网络策略拦住，此时自动改用 `api.github.com` 代验同一仓库 —— 否则 CI 会把 6 个正常的 GitHub 链接全判成超时。

误报因环境而异：2026-10-04 实测在本机是 3 个（inkscape 与 jasp 的 Cloudflare 403、texstudio 的代理超时），**在 GitHub runner 上全部 200**。它们是本机网络环境的产物，不是站点问题。`--flaky-ok` 仍保留，作为将来 runner 换 IP 时的防护。

## 安全机制

- 口令只存 scrypt 哈希；session 为 HMAC 签名 cookie（HttpOnly / Secure / SameSite=Strict / Path=/admin）。
- `proxy.ts` 注入页面 CSP（nonce），`next.config.ts` 统一设置基础安全响应头；`/admin` 只允许 GET/HEAD/POST。
- 限速：登录 5 次/10 分钟，投稿与反馈各 3 条/10 分钟；连续登录失败封 IP（`blocks.json`，可在后台解封）。
- 后台正文按纯文本渲染，不解析 HTML/Markdown（无存储型 XSS）。
- **防盗链**：`/media` 与 `/icons` 校验 `Referer`，跨站请求返回 403。判定为「白名单放行 + 其余拒绝」——无 Referer（地址栏直开、分享、爬虫抓 og:image）、同站及其子域名、配置的白名单一律放行，避免误伤正常访问。响应另带 `Cross-Origin-Resource-Policy: same-origin` 与 `X-Robots-Tag: noindex`。实测拦截 `evilashare.example`、`ashare.example.evil.com` 这类后缀伪装。

  关闭：`ASSET_HOTLINK_PROTECTION=0`。额外放行来源（如需要在微信文章里显示预览图）：`ASSET_REFERRER_ALLOWLIST=weixin.qq.com`。

## 部署

1. Node 常驻进程（VPS 上 `npm run build && npm run start`），保证 `data/store/` 与 `data/media/` 可写、`data/` 不在部署时被清空。
2. 前置 HTTPS 反向代理。仅当应用端口只对你控制的代理开放时设置 `TRUST_PROXY=1`。单层 Nginx 使用 `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` 或覆盖为 `$remote_addr`，应用使用最右侧地址；有 CDN / 多层代理时需先在代理正确解析可信来源。没有可信代理时共享限速，不接受客户端自报的 IP。
3. 图片表单最多为 6 张预览与 1 张图标，各 5MiB；应用请求上限 36MiB，代理可设 `client_max_body_size 36m;`。
4. 环境变量：`MYSQL_URL`、`ADMIN_PASSWORD_HASH`、`SESSION_SECRET`（生成命令见 [.env.example](./.env.example)），可选 `TRUST_PROXY=1`、`NEXT_PUBLIC_SITE_URL`（正式站点的 HTTP(S) origin，不带子路径；未配置时省略绝对 SEO 链接，sitemap 返回空列表）。迁移出问题需回滚时设 `STORE_DRIVER=json`。
5. 回滚数据：停进程后用 `data/store/catalog.bak.json` 覆盖 `catalog.json`，删除 `catalog.sha256.json`，重启。

本地 JSON 存储需要单个 Node 进程与持久磁盘，不适用于 PM2 cluster、多副本或临时文件系统；扩展到这些环境前须迁移到支持事务的数据库。CSP 使用每请求 nonce，公开页面按请求渲染；主题脚本共用 nonce，图片与静态资源使用独立安全响应头。

## 验证

```bash
npm run check   # ESLint、路由类型/TypeScript、隔离回归测试
npm run build   # 生产构建
```

回归测试使用临时目录，不写入业务目录；覆盖并发存储、损坏文件、后台权限、图片事务、会话、搜索筛选、CSP 与站点元数据。推送到 main 或创建 PR 后，GitHub Actions 自动执行相同检查。

## 脚本

| 命令 | 用途 |
|---|---|
| `npm run dev` | 开发服务器 |
| `npm run build` / `npm run start` | 生产构建与启动 |
| `npm run lint` | ESLint |
| `npm run typecheck` | 生成路由类型并检查 TypeScript |
| `npm test` | Node 原生回归测试 |
| `npm run check` | 完整代码检查 |
| `npm run admin:password` | 在终端隐藏输入并生成后台口令哈希 |
| `npm run backup` | 把运行库与上传图片复制成带时间戳的快照（`--out` 换目录、`--keep N` 保留最近 N 份、`--list` 列出现有备份）。`--keep` 只删除带本脚本 `manifest.json` 的目录；快照若含用户投稿/反馈文件会提示分享前剔除 |
| `npm run content:audit` | 列出条目缺失字段、场景库存与待补清单（`--scene <id>` 只看某个场景，`--json` 机器可读） |
| `npm run smoke:detail` | 详情页渲染冒烟：需先跑 `npm run dev`，逐个检查正文分段、外链、来源徽章与价格是否如实呈现 |
| `npm run seed:drift` | 比对运行库与种子是否一致（`--strict` 有差异时非零退出），确认「两个落点」写的是同一份内容 |
| `npm run stale-links` | 外链巡检：列出超过阈值没核验的条目（默认 90 天）。`--check` 探活、`--check-all` 探活全站、`--update` 回写通过者的核验日期、`--days N` 改阈值、`--strict` 有待复验或异常链接时非零退出（CI 用）、`--flaky-ok` 豁免人工确认过的误报、`--source seed` 从种子读目录、`--json` 机器可读 |

收录与探活脚本在 `.workbuddy/skills/ashare-curation/scripts/`，它们与上面几个脚本共用 `scripts/_shared.mjs`（参数解析、运行库读取、并发限流、安全抓取）。对外抓取默认只放行 http/https、拒绝解析到私有网段的主机，并逐跳校验重定向；要探活本机服务才加 `--allow-private`。
