# 安全机制

安全设计的第一原则（README 原话的精神）：**"来源可核验"需要结构化字段支撑，安全边界靠机器而不是靠人肉判断**。

## 认证与会话

- 口令只存 **scrypt** 哈希（`lib/auth-crypto.ts`），生成走 `npm run admin:password`（隐藏输入）。
- Session 是 **HMAC 签名 cookie**：HttpOnly / Secure / SameSite=Strict / Path=/admin，约 8 小时。
- 权限判断集中在 `lib/users.ts` 的纯函数矩阵，所有 server action 入口走 `requireAdmin()`。

## 传输与响应头

- `proxy.ts`（Next.js middleware）注入 **每请求 nonce 的 CSP**——公开页面必须按请求渲染，根布局不能静态化。
- 开发模式追加 `unsafe-eval`（React/Turbopack 调试需要），**生产不放宽**。
- `next.config.ts` 统一基础安全响应头；`/admin` 只允许 GET/HEAD/POST（方法白名单）。

## 限速与封禁（`lib/guard.ts` + `lib/rate-limiter.ts`）

| 场景 | 限制 |
|---|---|
| 后台登录 | 5 次/10 分钟，连续失败封 IP（`ip_blocks`，后台可解封） |
| 投稿 / 反馈 | 各 3 条/10 分钟 |
| 出站点击记录 | 60 次/分钟/IP（真实用户够用，刷不爆磁盘） |

`SlidingWindowLimiter` 是滑动窗口实现。IP 解析：仅当 `TRUST_PROXY=1` 且代理受控时才信 `X-Forwarded-For`，**不接受客户端自报 IP**；单层 Nginx 用 `$proxy_add_x_forwarded_for`，多层代理需先正确解析可信来源。

## 防盗链（`lib/hotlink.ts::decideHotlink`）

`/media` 与 `/icons` 两个路由**共用同一判定**（图谱证实）。策略是"**白名单放行 + 其余拒绝**"：

- 放行：无 Referer（地址栏直开、分享、爬虫抓 og:image）、同站及其子域名、`ASSET_REFERRER_ALLOWLIST` 配置的来源。
- 拒绝：其余全部 403。实测拦截 `evilashare.example`、`ashare.example.evil.com` 这类后缀伪装（`tests/hotlink.test.mjs` 有用例覆盖）。
- 响应另带 `Cross-Origin-Resource-Policy: same-origin` 与 `X-Robots-Tag: noindex`。
- 开关：`ASSET_HOTLINK_PROTECTION=0` 关闭；`ASSET_REFERRER_ALLOWLIST=weixin.qq.com` 追加放行（如微信文章显示预览图）。

**前提**：媒体文件放 `data/media/` 而不是 `public/`——放 public 下会被 `next start` 直送静态资源，防盗链根本不执行。媒体路径精确匹配 `^[a-f0-9]+\.(jpe?g|png|webp|gif)$`，防 `..` 穿越。

## 输入与内容边界

- **无存储型 XSS**：后台正文按纯文本分段渲染，不解析 HTML/Markdown；`rich-text.test.mjs` 验渲染安全。
- 上传约束（`lib/input-validation.ts`）：≤6 张预览 + 1 张图标、单张 ≤5MiB、JPEG/PNG/WebP/GIF、服务器侧类型嗅探；应用请求上限 36MiB。
- slug 走 `SLUG_PATTERN` 正则白名单；点击渠道走 `isChannelId` 枚举——`/track` 刻意不信任调用方传的任何展示数据。
- 语义自洽矩阵（`lib/semantics.ts`）机器拦截"标开源却无核验依据"的条目。

## 数据安全

- 点击数据**只记 slug、渠道、时间，不存 IP 与 UA**。
- JSON 驱动（回滚路径）下：`data/store/*.json` 0600 权限、SHA-256 旁车（启动校验，被改动打日志）、保存前 `.bak`。损坏 JSON 会报错，**不会**自动用种子覆盖。
- 脚本对外抓取（`scripts/_shared.mjs`）：只放行 http/https、**拒绝解析到私有网段的主机**、逐跳校验重定向；探活本机服务才加 `--allow-private`。

## 隐私红线（产品层面）

不收录盗版、点击不留 IP、`/admin` 不进 robots——这些是产品承诺，由上面的机制兜底。
