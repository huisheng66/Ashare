# Ashare

按使用场景找软件与工具的目录站。收录三类**合法、可核验来源**的条目：厂商正式版应用（含免费档/优惠入口）、脚本小工具、开源项目。不托管安装包，**不收录破解版、修改版、序列号与盗版网盘包**；网盘链接仅限作者/项目方的已核验合法镜像。

产品定义见 [PRODUCT.md](./PRODUCT.md)，视觉规范见 [DESIGN.md](./DESIGN.md)，改动记录见 [CHANGELOG.md](./CHANGELOG.md)，早期规划 [next.md](./next.md) 已标为历史。

## 技术栈

Next.js 16 App Router + React 19 + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)（`radix-nova` 风格，源码在 `components/ui/`）。浅色/深色双主题（`next-themes`），界面图标用 Lucide，品牌图标走本地 `data/icons/`。无数据库，数据存本机 JSON。

## 本地开发

```bash
npm install
cp .env.example .env.local   # 按注释生成 ADMIN_PASSWORD_HASH 与 SESSION_SECRET
npm run dev                  # 或 npm run build && npm run start
```

打开 [http://localhost:3000](http://localhost:3000)。首次启动会把 `data/software.ts` 的静态种子灌入 `data/store/catalog.json`。

## 内容管理（后台）

- 入口 `/admin`（不进导航，robots 已禁止收录），单口令登录，会话约 8 小时。
- 条目：类型 / 标签 / 简介 / 价格 / 使用教程 / 详细介绍（纯文本分段）/ 四类链接（官网、主页、GitHub、已核验镜像）/ 预览图（最多 6 张，JPEG/PNG/WebP/GIF，单张 ≤5MB，服务器存储）与图标图，支持草稿与发布。
- 投稿与反馈在 `/admin/inbox`：投稿可一键转为条目（自动预填表单）；反馈可标记已读 / 删除；IP 封禁列表可解封。
- 数据都在 `data/store/*.json`（0600 权限，不进 git）。每次保存目录会先备份上一版到 `catalog.bak.json`，并记录 SHA-256（启动时校验，文件被改动会打日志）。

## 安全机制

- 口令只存 scrypt 哈希；session 为 HMAC 签名 cookie（HttpOnly / Secure / SameSite=Strict / Path=/admin）。
- `proxy.ts` 注入 CSP（nonce）与安全响应头；`/admin` 只允许 GET/POST。
- 限速：登录 5 次/10 分钟，投稿与反馈各 3 条/10 分钟；连续登录失败封 IP（`blocks.json`，可在后台解封）。
- 后台正文按纯文本渲染，不解析 HTML/Markdown（无存储型 XSS）。

## 部署

1. Node 常驻进程（VPS 上 `npm run build && npm run start`），保证 `data/store/` 与 `public/media/` 可写、`data/` 不在部署时被清空。
2. 前置 HTTPS 反向代理，代理需设置 `X-Forwarded-For`；应用侧配 `TRUST_PROXY=1` 信任它。
3. 环境变量：`ADMIN_PASSWORD_HASH`、`SESSION_SECRET`（生成命令见 [.env.example](./.env.example)），可选 `TRUST_PROXY=1`、`NEXT_PUBLIC_SITE_URL`（sitemap / openGraph 用）。
4. 回滚数据：停进程后用 `data/store/catalog.bak.json` 覆盖 `catalog.json`，删除 `catalog.sha256.json`，重启。

## 脚本

| 命令 | 用途 |
|---|---|
| `npm run dev` | 开发服务器 |
| `npm run build` / `npm run start` | 生产构建与启动 |
| `npm run lint` | ESLint |
