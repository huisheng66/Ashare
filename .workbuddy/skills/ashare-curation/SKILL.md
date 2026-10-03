---
name: ashare-curation
description: 把工具收录进 Ashare 目录时使用。覆盖选题、来源核验、字段撰写、写入运行库与种子、校验和变更记录。当任务是把某款软件、脚本或开源项目收进目录、批量补齐场景库存或字段缺口、把后台投稿转成正式条目时，应使用本技能。
agent_created: true
---

# Ashare 收录

把候选工具变成一条符合收录标准、可直接发布的目录条目。Ashare 是「按使用场景找软件」的目录站，每条条目必须回答三件事：适不适合、去哪下、有没有平替。

**何时使用**：要求把某个软件 / 脚本 / 开源项目收进目录；批量补正文与标签；填补空场景库存；把 `/admin` 投稿转成正式条目。

## 硬红线

违反任何一条就停止，不要写入：

- 不收破解版、修改版、序列号、激活码、注册机、绿色版、盗版网盘包（后台按子串匹配拒绝保存，写「非绿色版」也会被拒）。
- 网盘镜像只能作补充：必须先有官网或 GitHub，且必须填镜像说明。
- 不托管安装包；条目里不出现「本站下载」。
- Git 链接只允许 `github.com` / `gitlab.com` / `gitee.com` / `codeberg.org`。
- 链接必须 HTTPS、不含用户名密码、长度 ≤ 2048。
- **`source` 与 `kind` 必须自洽**（矩阵见 `lib/semantics.ts`）：`official` → `app`/`script`，`opensource` → `opensource`/`app`，`discount` → `app`。标 `opensource` 却没有 GitHub 链接时 `--strict` 会拦下——开源断言必须可核验。

判定细则见 `references/sources-and-redlines.md`。

## 流程

每一步都有一个闸门，过不去就停在这一步。

### 1. 备份 → 快照存在

`npm run backup`。运行库不在 git 里，写入前必须留快照。

### 2. 选题 → 本批次目标明确（一个场景、3 条左右）

`npm run content:audit -- --top 30`。优先顺序：空场景 → 正文/标签缺失 → `/admin/inbox` 投稿。新场景开栏前至少备 3 条。

### 3. 核验来源 → 每条都有核验记录

官网可达、许可证、平台支持、价格口径、最近更新时间。

```bash
node .workbuddy/skills/ashare-curation/scripts/check-links.mjs --slug <slug> | --all
node .workbuddy/skills/ashare-curation/scripts/check-links.mjs --url <候选地址>   # 写入前先测候选地址
```

核验的坑（homepage 不是官网、`NOASSERTION`、过期镜像、探活异常不等于死链）见 `references/sources-and-redlines.md` 的「核验陷阱」。

### 4. 撰写 → `references/intake-checklist.md` 全部勾完

字段规格见 `references/item-fields.md`，范本见 `references/example-mineradio.md`。口吻遵守 PRODUCT.md：短句、具体、不煽；「适合 / 不适合」只谈任务和水平。

正文四段式：① 是什么、解决什么 ② 核心特性，写具体行为 ③ 代价与风险 ④ 许可证与发布渠道。段落间空一行，不用 Markdown。

**结构化字段**：核验到的许可证（SPDX，如 `GPL-3.0-only`）、版本号、链接核验日期要写进 `license` / `version` / `linksCheckedAt`，不要只写在正文里——写进正文就无法机器校验，也无法用于死链巡检。核验不到就留空，不要猜。

### 5. 预检 → `--dry-run` 零错误

```bash
node .workbuddy/skills/ashare-curation/scripts/ingest-item.mjs --file <草稿.json> [--patch] --dry-run [--strict]
```

`--patch` 只覆盖草稿里写到的字段，slug 必须已存在（防手滑新建重复条目）。正式收录新条目加 `--strict`，把完成标准的软要求变成硬错误。警告也要逐条看过——`alternatives` 指向不存在的 slug、`simpleIcon` 没有对应文件都不阻断写入但会静默失效。

### 6. 写入 → 两个落点都更新

去掉 `--dry-run` 正式写入。

| 落点 | 生效范围 |
|---|---|
| `data/store/catalog.json` | 当前部署立即生效（不在 git 里） |
| 种子文件（`data/software.ts` 或 `data/samples.ts`） | 仅全新部署 |

只写运行库，下次重建就丢；只写种子，当前站点看不到。两个都要。写完 `npm run seed:drift` 确认一致（闸门：不一致 0 条）。

**`--patch` 的每个字段是整体替换，不是追加。** 补 `aliases` / `links` 必须把原有值一起写回。草稿里改了哪些字段，种子就照字段名逐项核对——这个字段已经漏过两次，两处都靠 `seed:drift` 才发现。

种子的字段形态与运行库不同：`officialUrl` ↔ `links.official`、`installTips` ↔ `tutorial`。

### 7. 校验 → 检查全绿且缺口数字下降

```bash
npm run check          # ESLint + 类型 + 回归测试
npm run content:audit  # 对比写入前后的缺口数字
npm run dev            # 另开终端常驻
npm run smoke:detail   # 渲染冒烟，默认遍历全部条目
```

冒烟逐条检查正文每段是否真的渲染、外链是否出现、徽章是否与 `source` 一致、价格是否展示。闸门：异常 0 个。

### 8. 记录与迭代 → CHANGELOG 已写，教训已沉淀

在 `CHANGELOG.md` 顶部按日期倒序加条目，写明来源、许可证、核验结论与已知风险。然后执行下面的自迭代。

## 完成标准

- `body` 非空且至少 2 段，第三段写了代价或风险
- `tags` 至少 3 个，`aliases` 填了常见叫法
- 至少一个可核验来源，探活通过或已人工确认
- `whoFor` / `whoNot` 只谈任务和水平
- 两个落点都已写入，`catalog.sha256.json` 已同步
- `npm run check` 通过，`content:audit` 缺口下降，`smoke:detail` 无异常，`CHANGELOG.md` 已记录

达不到就以 `status: "draft"` 入库，不要为凑数发布空壳——目录里已有 30 条这样的历史欠账。

**预览图不是发布门槛。** 全站 35 条都没有截图，补它需要真实素材与授权判断；「内容债」只按正文与标签计。

## 批量节奏

- 一次只做一个场景，3 条左右为一批；补字段同样按场景分批
- 跨场景条目按 `scenes[0]` 归属，`content-audit --scene X` 会把主场景不是 X 的标出来，留给对应批次
- 不知道下一批做什么就看 `content-audit` 末尾的「建议下一批」
- 每批开始前记下缺口数字，结束后对比确认下降
- 统计用 `npm run content:audit -- --json`，不要临时写 `node -e` 判断（字段形状记错会得出完全错误的结论）
- 草稿放仓库外；一批结束先提交一次，再开下一批

## 自迭代

每批收尾回答三个问题并落到文件：

1. **校验脚本有没有漏掉本该拦住的错误？** 有就直接改脚本，改完用同一份草稿重跑 `--dry-run`。
2. **有没有新的字段或渲染行为认知？** 追加到 `references/known-pitfalls.md`，不删历史。
3. **流程里哪一步卡住了？** 规则性问题改本文件；**同一类问题第二次出现时必须从 pitfalls 提升进主流程**。

## 资源

- `references/item-fields.md` — 字段规格、上限、写作要点
- `references/sources-and-redlines.md` — 收录判定、核验清单与核验陷阱
- `references/intake-checklist.md` — 写入前逐项勾选
- `references/known-pitfalls.md` — 踩过的坑，每次收录后追加
- `references/example-mineradio.md` — 完整条目范本
- `scripts/ingest-item.mjs` — 校验并写入运行库，同步 SHA-256
- `scripts/check-links.mjs` — 探活；`--url` 测候选地址，抓取带 SSRF 防护（只放行 http/https、拒绝私有网段、逐跳校验重定向），要测本机服务才加 `--allow-private`

脚本共用 `scripts/_shared.mjs`（参数解析、运行库读取、并发限流、安全抓取）。
