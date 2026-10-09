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

## 审计日志（`audit_log`）

`AuditAction` 四类：`create` / `update` / `delete` / `status`。每次保存记录操作者、动作、变更字段清单与一句话摘要（`auditSummary`），由 `lib/store-sql.ts` 写入。

## Server Action 清单（图谱实测，12+ 个）

| Action | 位置 | 职责 |
|---|---|---|
| `login` / `logout` | `app/admin/actions.ts` | 会话 |
| `saveItem` / `setItemStatus` / `deleteItem` | 同上 | 条目主写入链 |
| `markFeedbackRead` / `deleteFeedback` / `deleteSubmission` / `unblockIp` / `convertSubmission` | 同上 | inbox 管理 |
| `submitSubmission` | `app/submit/actions.ts` | 公开投稿 |
| `submitFeedback` | `app/feedback/actions.ts` | 公开反馈 |
| `recordOutboundClick` | `app/track/actions.ts` | 点击记录（刻意不 requireAdmin） |
