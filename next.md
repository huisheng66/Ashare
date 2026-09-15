# Ashare：目录扩展、后台与安全

> **历史文档（2026-09-15 起不再维护）**：本文是实现前的规划，其中「无数据库、无鉴权、localStorage」等描述已被实现取代。当前技术栈见 [README](./README.md)，设计规范见 [DESIGN.md](./DESIGN.md)，变更见 [CHANGELOG.md](./CHANGELOG.md)。

## 不做的事（硬边界）

不收录、不上架、不链向破解版、修改版、序列号、汉化包（非官方）或商业软件盗版分发（包括 Photoshop、Premiere 等「第三方破解」和对应网盘包）。这是版权侵权，不能做。

现有「收录标准」里「不收破解 / 修改版 / 来源不清的网盘」这条保留，并写进后台校验：名称、简介、链接里出现破解/序列号/绿色版等词，拒绝保存。

## 产品定义改成什么

Ashare 仍是按场景找工具的目录，**不托管安装包**。收录范围从「仅官网正版」扩成三类**合法、可核验来源**的条目：

| 类型 `kind` | 收什么 | 主下载去向 |
|---|---|---|
| `app` | 厂商正式版、免费档、厂商写明的优惠入口 | 官网 |
| `script` | 脚本、snippet、可复现的小工具 | GitHub / 作者页 |
| `opensource` | 开源项目官方发行渠道 | GitHub Releases / 项目官网 |

**审核后的网盘链接**只允许作为「作者或项目方提供的合法镜像」（常见于开源在国内访问官方 CDN 慢），必须同时有官网或 GitHub，且后台标记「已核验镜像」。禁止作为唯一下载源，禁止用于商业闭源软件的非官方包。

成功标准不变：30 秒内确认适不适合、平台、来源、点哪去。

口吻、版式、反例（绿色软件站、捆绑按钮）仍按 `PRODUCT.md` / `DESIGN.md`。

---

## 现状（改动锚点）

- Next.js 16 App Router + React 19，**无数据库、无鉴权**。目录是 `data/software.ts`，提交写进浏览器 `localStorage`。
- 条目字段：名称、摘要、场景、平台、来源徽章、官网、适合/不适合、安装要点、平替。没有标签、教程长文、预览图、GitHub/网盘、详细介绍。
- 图标走 Simple Icons CDN，失败则字母块。详情页 `generateStaticParams` 绑死静态数组。
- 依赖面极小（next/react/tailwind）。新能力必须少加依赖。

---

## 架构原则：少代码

不加独立后台框架、不加 Redis、不加 ORM、不加用户系统。单管理员 + 本机文件存储，和现有 Next 进程同跑。

```
data/store/catalog.json     条目（含草稿）
data/store/feedback.json    用户反馈
data/store/submissions.json 前台投稿
data/store/blocks.json      IP 封禁
public/media/<id>/          预览图、图标（只存服务端文件）
```

`lib/store.ts`：读缓存 + 写队列（避免反馈与后台同时写坏 JSON）。首次启动若 store 为空，从现有 `data/software.ts` 灌入。

公开页继续 Server Component 读 store；后台用 Server Actions 写，保存后 `revalidatePath`。不另开 REST。

假设：**一台带磁盘的 Node 进程**（VPS / `next start`）。无盘 Serverless 不适合这个方案。

---

## 数据模型（在 `data/types.ts` 上长，不另起一套）

```ts
kind: "app" | "script" | "opensource"
status: "draft" | "published"
tags: string[]              // 卡片上展示，如「视频」「免费」「CLI」
summary: string             // 卡片简介
body: string                // 详情「详细介绍」，纯文本，按段落渲染
tutorial: string[]          // 「使用教程」步骤（现 installTips 迁过来，可并存）
links: {
  official?: string         // 厂商/项目官网
  homepage?: string         // 产品自己的站点（可与官网不同）
  github?: string           // 仅 github.com / gitlab.com 等
  disk?: string             // 审核镜像，必须 https
  diskNote?: string         // 镜像说明（来源、校验）
}
preview?: string            // /media/<id>/preview.webp
iconImage?: string          // /media/<id>/icon.png；无则保留字母/Simple Icons
```

前台卡片：图标、名称、`kind`+来源徽章、最多 3 个 tag、两行 `summary`。  
详情页链接区按有值才渲染：官网、主页、GitHub、已核验镜像。主 CTA 优先级：官网 → GitHub → 主页；镜像不当主按钮。

`lib/catalog.ts` 改为读 store 的已发布条目；搜索把 tags、kind、body 纳入。

---

## 后台（`/admin`，不进侧边栏、robots 禁止）

单口令登录，不建账号表。

| 环境变量 | 用途 |
|---|---|
| `ADMIN_PASSWORD_HASH` | `scrypt` 哈希，明文不进仓库 |
| `SESSION_SECRET` | ≥32 字节，签 cookie |

- Cookie：`httpOnly` + `Secure` + `SameSite=Strict` + `Path=/admin`，HMAC 签到期时间，约 8 小时。
- `app/admin/layout.tsx` 和**每一个** Server Action 都验 session（Next 文档要求：Action 可被直接 POST，不能只靠 layout）。
- 登录失败计入 IP；阈值后写入 `blocks.json`。

页面（共用现有表单样式，不引入 UI 库）：

1. `/admin/login`
2. `/admin` 条目列表：筛选 kind/status，新建 / 编辑 / 下架
3. `/admin/items/[id]` 一张表：类型、标签、简介、教程、详细介绍、四类链接、预览图/图标上传、发布
4. `/admin/inbox` 投稿 + 反馈，标记已读

上传：`FormData` → 只收 `image/jpeg|png|webp`，上限约 1.5MB，随机文件名，不收 SVG（XSS）。图片只从 `/media/` 提供。

链接校验：只允许 `https:`（本地调试可 `http:`）；GitHub 限白名单主机；磁盘链接必须填 `diskNote`。命中破解词表则保存失败。

---

## 前台改动

- `PRODUCT.md`、`app/about/page.tsx`、`app/layout.tsx`、`app/submit/page.tsx`、侧栏法务小字：改收录范围，**明确仍不收破解**。
- 投稿表：类型（应用/脚本/开源）+ 名称 + 主链接 + 需求说明；写入 `submissions.json`，不再只存浏览器。
- 新页 `/feedback`：条目纠错 / 站内问题 / 其他；可选关联 slug 与联系方式。侧栏「更多」加「反馈」。
- 详情页：预览图、标签、教程、详细介绍、链接组。去掉「本站绝不提供任何第三方包」与镜像说明之间的矛盾——镜像存在时写清「这是已核验的合法镜像，请优先官网」。
- `SoftwareIcon`：优先本地 `iconImage`，再 Simple Icons，再字母。
- 软件详情不再用写死的 `generateStaticParams` 作为唯一来源；发布后 `revalidatePath`。

---

## 安全（少模块，集中在 `proxy.ts` + `lib/guard.ts` + `lib/auth.ts`）

「后台加密」做成真正有效的几件事，不自研整站加密：

- 口令只存 scrypt；session 只存签名 cookie，不存口令。
- 传输靠部署 HTTPS（应用内 `upgrade-insecure-requests`）。
- store 文件权限 0600；`data/store/`、`public/media/` 不进 git（`.gitignore`）。

「静态页防篡改」不做 HTML 加密或客户端校验（无效且代码多），做：

- CSP（`proxy.ts` nonce）：`default-src 'self'`，`object-src 'none'`，`frame-ancestors 'none'`，图片仅 `'self' blob: data:` 以及现有 Simple Icons 主机。
- 安全头：`X-Content-Type-Options nosniff`、`Referrer-Policy`、`Permissions-Policy`。
- CMS 正文**纯文本分段**，不渲染 HTML/Markdown（从根上避免存储型 XSS）。
- 发布时给 `catalog.json` 写 SHA-256，启动打日志；被改盘可发现。不在用户浏览器里做完整性 UI。

异常 IP / 防打：

- `lib/guard.ts` 内存滑动窗口：登录、投稿、反馈、上传分路限速；超限 429。
- 连续登录失败 → `blocks.json` 封 15–60 分钟；封禁 IP 对 `/admin` 和写接口直接 403。
- 取 IP 只用配置了受信反代时的 `X-Forwarded-For` 最左，否则 `request.ip`。
- 后台与写接口限制方法与体积；公开页只读。

不引入 WAF 产品、验证码服务、自定义加密协议。单进程内存限速；多实例以后再谈。

---

## 文件清单（控制数量）

新建：

- `proxy.ts`
- `lib/store.ts` `lib/auth.ts` `lib/guard.ts`
- `app/admin/layout.tsx` `login/page.tsx` `page.tsx` `items/[id]/page.tsx` `inbox/page.tsx` `actions.ts`
- `app/feedback/page.tsx` + 复用 `SubmitForm` 同类小组件
- `components/TagList.tsx` `components/ItemLinks.tsx`（小、无逻辑膨胀）

改：`data/types.ts` `lib/catalog.ts` 详情/关于/提交/布局/卡片/图标/`PRODUCT.md` 关于页文案。

不加：better-sqlite3、CMS 套件、markdown 库、独立 express。

---

## 实施顺序

1. **产品与类型**：改 `PRODUCT.md` / 关于 / 布局文案；扩展 `Software` 类型；卡片与详情先能展示新字段（静态数据补 1–2 条脚本/开源样例）。
2. **Store**：JSON store + 从 `software.ts` 迁移；`catalog.ts` 改读 store；发布字段过滤。
3. **后台**：登录、列表、编辑、上传、校验词表、`revalidatePath`。
4. **投稿进服 + 反馈页 + inbox**。
5. **安全**：`proxy.ts` CSP/头、限速、封 IP、hash 日志、robots、gitignore。
6. **收口**：详情链接与教程、搜索含 tags/kind、侧栏入口、环境变量示例（不含密钥）。

每步可单独上线。前台在 1 完成后即可用；3 完成前仍可手改 JSON。

---

## 验收

- 后台能上架/编辑应用、脚本、开源：标签、简介、教程、详细介绍、四类链接、服务器预览图。
- 公开页只显示 `published`；镜像不当主 CTA。
- 破解词、非 https、非白名单 Git 主机、无说明的网盘 → 保存失败。
- 未登录打不开 `/admin`；错口令限速并封 IP；反馈可提交并在 inbox 看到。
- 详情正文里的 `<script>` 以文本显示，不执行。
- 不新增重量级依赖；逻辑集中在 store / auth / guard 三个模块。

## 部署前提

- Node 长期进程 + 可写 `data/store` 与 `public/media`
- HTTPS 反代
- 环境变量 `ADMIN_PASSWORD_HASH`、`SESSION_SECRET`（以及可选 `TRUST_PROXY=1`）
