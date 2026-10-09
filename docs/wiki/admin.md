# 后台管理

入口 `/admin`（不进导航，robots 禁止收录）。

## 会话与登录

- **登录**：`/admin/login`，单口令或账号体系（见下），口令只存 **scrypt 哈希**。
- **会话**：HMAC 签名 cookie（HttpOnly / Secure / SameSite=Strict / Path=/admin），约 8 小时（`lib/auth.ts` 的 `SESSION_MS`，签名/校验在 `lib/auth-crypto.ts`）。
- 登录限速 **5 次/10 分钟**；连续失败封 IP（写 `ip_blocks`，可在后台解封）。
- 口令生成：`npm run admin:password`（终端隐藏输入，输出 `ADMIN_PASSWORD_HASH`）。

## 账号与权限模型（`lib/users.ts`）

迁移到多用户后新增的能力，刻意做成**一张集中的纯函数表**——权限判断散落在各 server action 里最常见的漏洞就是"新加了入口忘了加检查"。

| 角色 | 权限点 |
|---|---|
| `admin`（管理员） | `edit` · `publish` · `moderate` · `users`（全部） |
| `editor`（编辑） | `edit` · `moderate`（写草稿、提交审核、处理投稿反馈；**不能**发布/下线/删条目/管账号） |

**状态流转规则**（`canSetStatus`）：

```
draft ⇄ review     需要 edit 权限（编辑提交与撤回自己的工作）
* → published      需要 publish 权限（编辑不能把草稿推上线）
published → *      需要 publish 权限（编辑不能把已上线条目撤下）
```

账号管理：`npm run user`（`scripts/user-manage.mjs`）。

## 条目工作流

- **列表与表单**：`/admin`（`AdminPage`）与 `/admin/items/[id]`（`ItemFormPage`，591 行，全站最大文件）。表单带 `DraftKeeper` 草稿暂存。
- **写入主入口是 `saveItem`**（`app/admin/actions.ts`，全部 Server Action 集中在此文件），链路：
  1. `requireAdmin()` 会话检查 + `lib/users.ts` 权限判断；
  2. `validateSemantics`（`lib/semantics.ts`）来源/类型自洽校验；
  3. `lib/catalog-persist.ts` 拆分写入 `items` + 8 张子表；
  4. `lib/audit.ts::diffFields` 字段级 diff → 写 `audit_log`（只存变更字段名，不存前后值——正文几万字，存进去比目录还大）。
- **来源与类型必须自洽**（`lib/semantics.ts` 的矩阵）：`official → app/script`、`opensource → opensource/app`、`discount → app`。标 `opensource` 却没有 GitHub 链接，`--strict` 下拦下。这是"标开源但许可闭源"这类问题的机器拦截方案。
- 正文按**纯文本分段**渲染，不解析 HTML/Markdown——无存储型 XSS。

## 投稿与反馈：`/admin/inbox`

- 投稿可**一键转为条目**（`convertSubmission`，自动预填表单）。
- 反馈可标记已读 / 删除。
- IP 封禁列表可解封（`unblockIp`）。
- 公开侧 `/submit`、`/feedback` 各限速 3 条/10 分钟。

## 点击分析：`/admin/clicks`

`ClicksPage` 展示：总点击、被点击条目数、最常走的渠道、14 天趋势、渠道构成与条目明细（含渠道拆分与占比）。条目已删除时仍保留历史点击并标注「已删除条目」，便于发现该清理的 slug。

## 账号管理：`/admin/users`

`/admin/users` 是**只有管理员能进**的页面（门禁是 `requirePermission("users")`，编辑角色在这一行被重定向）。它提供账号列表、角色调整、启用停用、重置口令与删除，并显式列出**角色权限矩阵**——只有两个角色但不说清就会变成「凭感觉授权」。

- **三条自伤防线**：不能停用/删除/降级自己。前端按钮禁用只省一次点击，真正的拦截在 action 里——误操作一次就可能把唯一的账号管理能力弄丢，且没人能改回来。
- **导航按权限过滤**：`AdminTabs` 只对管理员显示「账号」标签。给编辑显示一个点进去会被重定向的标签更糟，它看起来是个能用的入口。
- **口令用表单明文输入**：命令行那套隐藏输入在 HTTP 表单里做不到。风险靠别的方式补——`autocomplete="new-password"` 让浏览器不保存不 autofill，提交后立刻 revalidate，页面不回显、不进 URL。
- **引导账号是虚拟的**：`env-admin` 只存在于 `lib/auth.ts` 的常量里，账号表里没有。用户用它登录后在列表里看不到自己，页面上显式说明了这一点。
- 与命令行 `npm run user` 共用同一套规则（口令下限 12、用户名规则），两者都从 `lib/users.ts` 取，不各写一份。

## 审计日志（`audit_log`）

`AuditAction` 四类：`create` / `update` / `delete` / `status`。每次保存记录操作者、动作、变更字段清单与一句话摘要（`auditSummary`），由 `lib/store-sql.ts` 写入。账号管理的五次改动同样入审计表（`slug` 写作 `user:<账号名>`）。

## Server Action 清单（图谱实测，12+ 个）

| Action | 位置 | 职责 |
|---|---|---|
| `login` / `logout` | `app/admin/actions.ts` | 会话 |
| `saveItem` / `setItemStatus` / `deleteItem` | 同上 | 条目主写入链 |
| `markFeedbackRead` / `deleteFeedback` / `deleteSubmission` / `unblockIp` / `convertSubmission` | 同上 | inbox 管理 |
| `createUser` / `setUserPassword` / `setUserEnabled` / `setUserRole` / `removeUser` | 同上 | 账号管理（需 `users` 权限） |
| `submitSubmission` | `app/submit/actions.ts` | 公开投稿 |
| `submitFeedback` | `app/feedback/actions.ts` | 公开反馈 |
| `recordOutboundClick` | `app/track/actions.ts` | 点击记录（刻意不 requireAdmin） |

## 改动历史：条目编辑页内嵌

条目编辑页底部有「改动历史」面板（`app/admin/items/history.tsx`服务端容器 +
`components/HistoryPanel.tsx` 客户端面板）。列出版本号、动作、摘要、操作者、时间，
以及这一版改了哪些字段（列名译成中文，认不出的原样显示）。「查看这一版」展开该版完整内容。

**回滚的语义是「作为一次新编辑保存」，不是「时间倒流」**：

- 走 `saveItem` 正常通道而不是直接改库 —— 这样回滚本身也进历史链，中间版本不被抹平。
  **丢掉的那几版本身也是信息**：那条错误描述存在了多久，本身就是要查的问题。
- 走正常通道还自带乐观锁：若期间别人改过，会被挡下并提示「刚被别人改过」，
  而不是无声覆盖。
- **发布状态不随回滚改变**：把自己下架的条目回滚回来却变成已发布，那是意外发布。
  状态是当下的决定，不是内容版本的一部分。
- 需要 `publish` 权限而非 `edit`：「回到哪个版本」更接近发布决策。

`item_revisions` 的底层形态见 [data-and-storage](./data-and-storage.md)。
