# 变更记录

## 2026-10-04 · 在真实 GitHub Actions 上验证（分支 bunny）

上一轮只做了 YAML 语法检查，这轮真跑。远程 `huisheng66/Ashare`，分支已推送。

**成功路径（run 37139362789，`workflow_dispatch` 手动触发）**

51 个链接、**异常 0 个、35/35 条全部可达**，「巡检外链」「保留巡检报告」成功，「失败摘要」正确跳过。比本地干净：本地那 3 个异常（inkscape / jasp 的 Cloudflare 403、texstudio 的代理超时）在 runner 上**全部 200**。

**这修正了此前的判断** —— 那 3 个不是站点问题，是本机网络环境的产物（代理隧道 + Cloudflare 对本机 IP 的拦截）。`--flaky-ok` 仍保留，作为将来 runner 换 IP 时的防护，但不必再把它当成「站点在拦自动化」。

**失败路径（run 37140011070，注入不可解析域名后 push 触发）**

先造了个假失败：注入死链后 CI 报的是 `success`。查下来是**注入方式错了** —— 改的是种子的 `officialUrl`，而 `seedToItem` 里 `links` 优先于 `officialUrl`，那 17 条有 `links` 的条目根本不看 `officialUrl`。改对位置后重跑：

- 「巡检外链」→ **failure**（死链检出，退出码经 `set +e` + `${PIPESTATUS[0]}` 正确传递）
- 「保留巡检报告」→ **success**（`if: always()` 生效，失败时工件仍上传，已下载核对内容完整）
- 「失败摘要」→ **success**（`::error` 告警正常输出）

**顺带确认的两件事**

- `workflow_dispatch` 只能从默认分支触发是**过时说法**：`gh workflow run link-watch.yml --ref bunny` 直接成功，GitHub 用的是该 ref 上的工作流文件。因此不必为了手动触发而先合并到 main。
- `push` 的 paths 过滤生效：改 `data/software.ts` 即触发，改 `README.md` 不会。

**顺带发现的一处易错点**（已写进坑位库）：往种子里注入测试数据时，改 `officialUrl` 可能无效 —— **有 `links` 的条目以 `links.official` 为准**，`officialUrl` 只在缺 `links` 时才作为兜底。造测试数据前要先确认目标条目属于哪种形态。

测试分支 `_ci-fail-test` 已删除，本地已回到 bunny。

## 2026-10-04 · 外链巡检接入 CI（分支 bunny）

上一轮做的是脚本，这轮接进 GitHub Actions。过程中发现并修掉三个真问题。

**`.github/workflows/link-watch.yml`**

- 每天 04:17 跑（刻意避开整点的调度拥堵），另支持 `workflow_dispatch` 手动触发，带 `days` 参数可临时改门槛。
- 改了 `data/software.ts`、`data/samples.ts`、`lib/stale.ts`、`lib/links.ts` 等链接相关文件时立即触发，不用等明天。
- 报告用 `tee` 一次产出：失败时 step 标为 failed，但 `if: always()` 的上传步骤仍会执行，报告不丢。
- **不跑 `npm ci`** —— 巡检只用 `node:` 内置模块与仓库脚本，省掉安装时间，也让它不受 lockfile 变动影响。

**三个必须适配 CI 的问题**

1. **CI 上没有运行库。** `data/store/` 已 gitignore，克隆后只有种子。新增 `--source seed` 从 `data/software.ts` + `data/samples.ts` 读目录，并显式禁止在此模式下回写（种子由仓库管理，不该被运行库数据改写）。
2. **`--check-all`：CI 该探全站，而不是只查过期的。** 链接昨天还正常、今天挂了，只看「过期」是发现不了的。**门槛决定「什么时候必须复验」，不限制「能查什么」。**
3. **`--flaky-ok`：误报不能长期让流水线变红。** inkscape / jasp 的 Cloudflare 403 与 texstudio 的代理超时会让 CI 天天红，人就开始习惯性忽略，真死链反而被淹没。加此开关后 `--strict` 只对非误报判失败，输出里照样提示这些域名。

**Bug 1：`github.com` 网页端在 CI 上全部超时**

首次实跑 7 个异常，其中 6 个是 GitHub 链接超时 —— 网页端被网络策略拦住。`check-links.mjs` 早有「改用 `api.github.com` 代验同一仓库」的能力，但我没在新脚本里复用。已把 `githubApiOf` 抽到 `scripts/_shared.mjs` 由两者共用（消除重复实现），异常从 7 个降到 1 个（仅剩 inkscape 的已知误报）。

**Bug 2：`--source seed` 漏掉半数条目 —— 「全站巡检」名不副实**

探活数出只有 19 个条目、34 个链接，而运行库有 51 个链接。根因：**种子是 `SeedSoftware` 形态，官网在 `officialUrl` 而非 `links.official`**，30 条里只有 18 条填了 `links`。直接读种子，那 17 条条目的外链被静默漏掉 —— 而巡检报告仍显示一切正常。

已改为先过 `seedToItem()` 转换，转换后链接数 51 = 运行库 51。新增测试锁住这个坑（断言转换后每条有 `officialUrl` 的都带上 `links.official`）。

**Bug 3：参数校验顺序**

`--strict` 的「需要配合 --check」校验写在 `--check-all` 联动 `args.check` 之前，于是 `--check-all --strict` 这个合法组合被判成非法、退出码 1。**参数校验的顺序本身就是逻辑**，已调整为先联动再校验。

**验证**：`npm run check` 93 全过（新增 3）· 种子转换后链接数 51 与运行库一致 · 实机跑通完整 CI 命令（`--source seed --check-all --strict --flaky-ok`）· 已知误报被正确豁免 · GitHub 链接代验后异常从 7 降到 1。

## 2026-10-04 · 外链巡检脚本 stale-links（分支 bunny）

上一轮回填了 `linksCheckedAt`，但没有「谁该复验了」的问法。目录站是死链重灾区 —— 官网改版、下载页迁移很常见，这次把复验流程补上。

**`scripts/stale-links.mjs`**

- `npm run stale-links` 列出超过阈值（默认 90 天）没核验的条目，一并显示天数与涉及域名，便于估工作量。
- `--check` 探活、`--update` 回写、`--days N` 改阈值、`--all` 看全量、`--json` 机器可读、`--strict` 有待复验项时非零退出（CI 用）。
- **`--update` 必须配合 `--check`**，否则拒绝执行：没探活就刷新日期等于伪造核验记录。
- 抓取复用 `_shared.mjs` 的 `safeFetch`（SSRF 防护），HEAD 被拒改用 GET。

**关键约束：只回写「全部链接都可达」的条目**

实测两种情况都不回写：

- 单链接全失效 → 「没有全部可达的条目，核验日期未改动」
- 一个正常 + 一个失效（部分可达）→ 同样不回写

理由是把失效链接的核验日期刷成今天，会让下一轮巡检以为它刚查过，**死链被永久掩盖** —— 这比过期本身更危险。回写后同步 SHA-256 旁车，并提示仍需同步种子（`linksCheckedAt` 也在两个落点里）。

**`lib/stale.ts` 的一个易错点**

**缺字段不等于新鲜。** 若把 `undefined` 当「没过期」，从未核验的条目会永远不出现在报告里 —— 而它们恰恰最该核。四个原因分开：已过期 / 从未核验 / 日期格式非法 / 新鲜。

日期格式非法要单独成类，因为它会让按天数排序的统计失真。判定比正则多一步：**`2026-13-45` 形状对但日期不存在**，`Date.UTC` 会把越界月日进位成别的日期，所以只过正则不够，还要回读校验年月日。`2026-02-29` 判非法（2026 非闰年）、`2024-02-29` 判合法。

未来日期按「刚核验过」处理：时区或手填可能造成轻微偏移，不该因此报成过期。

**验证**：`npm run check` 90 全过（新增 12）· 实机验证过期/从未核验/格式非法三种检出 · 探活回写 3 条成功 · 两种失败场景均正确「不回写」· 运行库已还原且 SHA-256 匹配。

## 2026-10-03 · 回填 license / version / linksCheckedAt（分支 bunny）

上一轮把三个字段加进了数据模型，但存量 35 条全是空的。这轮按「有据可依才填」的原则回填。

**核验方式**

- **链接**：`check-links --all` 跑全量 51 个，48 可达。3 个异常（texstudio 超时、inkscape 与 jasp 的 403）与 09-28 记录完全一致，均为已知误报（代理隧道 / Cloudflare 拦自动化），站点本身正常。
- **许可证**：GitHub API 的 `license.spdx_id` 优先；返回 `NOASSERTION` 或 404 时**直读上游 LICENSE / COPYING 原文**。原文确认：GIMP、Krita、Octave = GPL-3.0，QGIS = GPL-2.0，Jupyter = BSD-3-Clause，VS Code = MIT，Git = GPL-2.0-only（COPYING 明确「只认 v2」）。其余按此前已核验的结论填入。
- **版本**：`releases/latest` 的 tag，排除预发布。Git v2.56.0、Python 3.15.0（FTP 目录实证）、Krita 5.3.4（官网）、Audacity 4.0.1（官网）等 14 条。**预发布与已停更仓库不采用** —— Python 的 `v3.15.0rc3`、KDE/krita 的 `v42.0-beta2` 均已排除。
- **查不到权威来源的一律留空**，不用记忆或推测填。16 条因此留空（geogebra、obsidian、figma、wps 等专有软件本就无开源许可证）。

**回填结果**：`license` 18 条、`version` 14 条、`linksCheckedAt` 35 条（全站 51 个链接今天都探活过；该字段记的是核验日期，不以「有版本号」为前提）。

**语义规则抓到一处真实数据错误**

上一轮新加的「来源 × 类型」矩阵在试运行阶段就拦下了 **yt-dlp 标 `opensource` + `script`** 的非法组合。它是 Unlicense（公开领域）的开源项目，正文第三段也这么写，「脚本」只是形态描述。已把 `kind` 改为 `opensource`（运行库与种子同步）。这正是把 GeoGebra 教训写成机器规则的价值。

**本轮最重要的发现：漂移检测的失明是静默的**

1. 草稿里给无版本号的条目写了空字符串，运行库存下 `""`、种子是 `undefined` —— `seed-drift` 报 6 处不一致。空字符串与缺省语义相同，已统一清理（6 处）并同步 SHA-256。
2. 补 `linksCheckedAt` 到种子时，脚本**连续三次静默地什么都没做**，一度以为已同步完成。根因有三：shell 把正则里的 `$` 吞成字面量；用「已处理输出」判重会误判；**仓库文件是 CRLF 行尾，`$` 前留着 `\r`，`slug: "x",$` 永远不匹配**。改成写脚本文件 + 按条目切片 + 兼容 `\r` 后才真正插入 35 行。
3. 插入后 `seed-drift` 仍报「0 不一致」—— **这次是假的**。上一轮加字段时只把 `license`/`version` 加进 COMPARE 清单，漏了 `linksCheckedAt`，于是运行库 35 条都有值、种子全空，脚本依然报 0。**漏一个字段名，漂移检测就对该字段完全失明，而且不报错。**

修复：`COMPARE` 补上 `linksCheckedAt`；`SeedSoftware` 补上该字段（类型也漏了，`tsc` 报 TS2353）。新增两条测试 —— 一条校验种子里的 SPDX 与日期格式；另一条**从 `seed-drift.mjs` 源码里解析 COMPARE 清单并断言覆盖全部可透传字段**，专门守住「清单与类型脱节」这类静默失效。已用「临时删掉清单里的字段名」验证该测试确实会失败。

**验证**：`npm run check` 78 全过（新增 2）· typecheck 通过 · `seed:drift` 0 不一致（已独立核验两侧覆盖均为 18/14/35，非假 0）· `content:audit` 缺口未上升。构建在本轮末尾被环境因素中断（SIGTERM），此前同一批改动的构建已通过。

## 2026-10-03 · 后台新增点击数据页（分支 bunny）

上一轮把点击统计写进了 `clicks.jsonl`，但只能命令行看。这轮补上 `/admin/clicks`。

**读侧改造**

- `clickSummary()` 原本 `readFile` 整份 JSONL 再 split。JSONL 每天只追加、永不压缩，理论上无上限——后台画一张图不该把全部历史读进内存。改为 `scanClicks()`：**只读文件尾部 8 MiB**，另设 20 万行上限；超限时在页面上如实说明跳过了多少条，**不把部分数据说成全量**。
- 从尾部截断时首行可能只有半条 JSON。单独标记 `firstPartial` 跳过它，否则会混进「损坏行」计数，让统计看起来像有丢数据。
- 分天按北京时间（`en-CA`），与 `formatDate` 一致，避免服务端时区让趋势图错位一天。

**展示层聚合（`lib/click-analytics.ts`）**

- 原始数据是 (slug, channel, time) 三元组，直接渲染会得到一堆重复条目的行。折成「每条目一行 + 渠道拆分」，并与目录合并补出名称、类型、场景与来源徽章。
- **已删除的条目仍保留历史点击**，标注「已删除条目」——删条目不该让点击历史凭空消失，顺便也能提示该清理这个 slug。
- 白名单外的渠道 id 一律丢弃：统计只接受 `official`/`homepage`/`github`/`disk`，出现别的值只可能是脏数据或旧版本残留。
- 占比以总量为分母，因此各行占比之和恒为 1（测试守住这条）。同量按 slug 排序，渲染顺序稳定。
- 趋势图**补齐没有点击的日期**：直接跳过空日期会让连续 7 天看起来只有 3 天。柱状条用纯 CSS 绘制，没有引入图表库（后台一个页面不值得加 200KB 依赖），逐条带 `sr-only` 读屏文案。

**一处设计与工具链的冲突**

- `click-analytics.ts` 需要在运行时用到 `isChannelId`（值，不能被类型擦除）。但测试用 `node --test` 靠类型擦除直接跑 `.ts`，相对导入必须带 `.ts` 扩展名；而 tsconfig 未开 `allowImportingTsExtensions`，带扩展名会让 `tsc --noEmit` 报 TS5097。**两边都要满足，只能让这份白名单就地定义。**
- 代价是 `lib/click-analytics.ts` 与 `lib/links.ts` 各有一份渠道列表。同步由 `tests/click-analytics.test.mjs` 里「两个模块的渠道集合必须一致」守住——这是两份列表唯一的保证关系，改一处必须改另一处。

**验证**：`npm run check` 76 全过（新增 10 项）· build 成功 · 实机验证未登录 307 跳转、已登录 200、四个板块渲染、占比之和为 1、已删除条目标注、脏数据丢弃、趋势 14 天连续、空状态给出下一步。

## 2026-10-03 · 防盗链、外链规范化与数据范式（分支 bunny）

三个方向一起做：把「图片被外站盗用」「外链跳转不可控」「同一语义写多处」这三类问题从根上收口。

**防盗链（`lib/hotlink.ts`）**

- `/media` 与 `/icons` 此前对所有来源照常返回图片。任意站点都能把预览图当免费图床。
- 判定为**白名单放行 + 其余拒绝**，不是拉黑已知站点：站点自己的图片数量有限、可防盗，爬虫与分享流量不可枚举、不该误伤。放行四类——无 Referer（地址栏直开、分享、部分 App 内置浏览器、爬虫抓 og:image）、同站及其子域名、`ASSET_REFERRER_ALLOWLIST` 显式名单、`ASSET_HOTLINK_PROTECTION=0` 全关。
- 拒绝返回 403 而非 404：文件确实存在，假装不存在只会让排障变难。响应带 `no-store`（否则 403 会被长缓存缓存住）与 `X-Robots-Tag: noindex`。
- 判定放在读盘之前，被拒请求不消耗磁盘 IO 与 ETag 计算。
- `next.config.ts` 为两条路径补 `Cross-Origin-Resource-Policy: same-origin`——Referer 会被浏览器策略裁剪，CORP 是浏览器侧的第二道拒绝。
- 实机验证六项：无 Referer 200 / 同站 200 / 跨站 403 / `ashare.example.evil.com` 后缀伪装 403 / CORP 头正确 / 路径穿越 404。已实测拦住 `evilashare.example`、`ashare.example.evil.com`。

**外链规范化（`lib/links.ts` + `components/OutboundLink.tsx`）**

- 存量数据用命名槽位（`official`/`github`/`homepage`/`disk`）表达渠道，这四个字段在「主 CTA」「渠道列表」「镜像说明」三处各自判断了一遍，新增一种渠道要改三处。现在摊平成有序的 `LinkChannel[]`，读取侧统一，**存储结构不变**，35 条存量数据零迁移。
- 收口三件事：`target`/`rel` 一律新标签 + `noopener noreferrer`（主 CTA 另加 `nofollow sponsored`）；域名等宽可见；点击自动上报（`mousedown` 而非 `click`，按住拖走也算跳转发生了）。
- 镜像行加「镜像」角标，`sr-only` 提示改为「（第三方镜像域名，非官方，请核对）」——这是外链最容易出事的地方。
- **无说明的镜像不予展示**（`isVerifiedMirror`）：无法核验的镜像与盗版网盘只有一线之隔。
- 删掉 `lib/items.ts` 的 `primaryLink`，与新的 `primaryChannel` 构成双事实源，已消除。

**外链点击统计（`lib/click-store.ts`）**

- 目录站的价值在于「跳出去」，此前完全不知道哪些条目的哪些渠道被点。
- **JSONL 追加写，不走 `JsonStore` 的读改写事务**：那会让每次点击都串行等锁，而点击是高频、低价值、允许极小概率丢失的事件。
- **只存 slug + 渠道 + 时间，不存 IP 与 UA**。存 IP 会把这份数据变成第二份用户数据，隐私成本远高于收益。
- 内存缓冲 5 秒或 200 条才落盘；定时器 `unref` 不拖住进程退出；失败只记日志不抛出。
- Server Action `recordOutboundClick` 只接受白名单 slug 与渠道 id，按 IP 限速 60 次/分钟。

**数据范式（`lib/semantics.ts` + `lib/derive.ts`）**

- **`source` 与 `kind` 的矛盾根治**。此前两者独立填写、前台徽章只认 `source`，于是出现 GeoGebra 那类问题：种子标 `source: "opensource"` → 推导成 `kind: "opensource"` → 前台挂出「开源」徽章，但它仓库 `license` 为 null（源码公开、许可闭源），实为非商业免费。现写成矩阵（`official` → `app`/`script`，`opensource` → `opensource`/`app`，`discount` → `app`），后台 `saveItem` 与 `ingest` 脚本共用同一份定义，从人肉判断改为机器拦截。标为 `opensource` 却没有 GitHub 链接时 `--strict` 会拦下。
- 图标三套机制（`iconImage` 上传图 / `icon.simpleIcon` 本地 svg / `icon.letter` 字母块）的回退顺序此前内嵌在 `SoftwareIcon` 里，抽成 `resolveIcon` 纯函数供 ingest 与测试复用。`scenes[0]` 主场景约定同样收进 `primaryScene`——它此前只散落在审计脚本注释里。
- 新增三个可选字段 `license`（SPDX）、`version`、`linksCheckedAt`（YYYY-MM-DD）。「来源可核验」需要结构化字段支撑，不能只写在正文文字里。同步接入 `seedToItem` 透传、`seed-drift` 比对（漏进比对就会对该字段失明）、后台表单与 `ingest` 校验——**只加类型不加脚本，新字段就永远存不进运行库**。

**一处回归及其教训**

- `validateSemantics` 最初包含「至少归属一个场景 / 平台」，导致 `tests/admin-actions.test.mjs` 两个子测试失败。用 `git stash` 对比确认是本轮引入而非环境问题后，定位到根因：那些测试构造的 FormData 不带 `scenes`。
- 修正方式是把**单字段必填**移出语义层——那本就该由 `saveItem` 与 ingest 各自的既有校验负责。语义层只管**跨字段**一致性，重复校验会让同一问题在两处以不同措辞报错。
- 测试数 46 → 66（新增 `tests/hotlink.test.mjs` 7 项、`tests/data-model.test.mjs` 13 项）。

**验证**：`npm run check` 66 全过 · `npm run build` 成功 · `seed:drift` 0 不一致 · `content:audit` 缺口未上升（仍为 10/35）· 防盗链 6 项实机验证 · 点击统计落盘与聚合实测（含确认不存 IP）· ingest `--strict` 与非 strict 两种路径均按预期分级。

## 2026-09-29 · 全站界面重做「纸与墨」

按新规范 [claudedesign.md](./claudedesign.md) 重做所有页面，旧的 DESIGN.md 不再作为依据。

**视觉语言**

- 暖白纸底 + 近黑墨色做文字和主按钮；朱砂红 `--brand` 只用在印章、导航当前项、「精选」标记和首页标题的荧光笔划重点，不做大面积底色或下载按钮。
- 来源三色（官方石青 / 开源石绿 / 优惠赭石）都配图标和文字；12 个场景色统一亮度（浅 L 0.56 / 深 L 0.8）。所有文字对比度 ≥4.5:1、控件 ≥3:1，按 OKLCH → sRGB 合成后逐项算过。
- 系统字体，不引外部资源（CSP 本来也不允许）。

**结构**

- 去掉左侧栏，改为吸顶顶栏（印章 Logo、场景下拉、⌘K 搜索、移动端抽屉）+ 三栏页脚（保留公安与 ICP 备案）。
- 首页：方格纸 hero + 编辑精选索引卡 → 四条收录承诺 → 场景贴纸卡（空场景合并为「筹备中」）→ 目录（≥lg 吸顶筛选栏）。
- 详情页：≥lg 右侧 340px 吸顶「获取」卡（主按钮、等宽域名、其他渠道、平台 / 类型 / 更新日期、优惠与安全提示、「信息有误？反馈」直达并预填条目）；主栏按「适合 / 不适合 → 截图 → 介绍 → 上手步骤 → 同类替代」排列。
- 场景页：场景色头图面板、场景切换条、平台分段；空场景给出推荐入口。
- 搜索、收录标准、推荐、反馈、404、出错页、后台（分段标签、条目表、分节表单 + 吸底保存栏、登录卡）全部按新规范重写。

**组件**

- 新增 `SiteHeader`、`Logo`、`SceneIcon`、`SceneGrid`、`FeaturedIndex`、`Breadcrumb`、`EmptyState`、`SectionHeading`、`FormPage`、`AdminTabs`。
- 删除 `Header`、`Sidebar`、`SidebarIcons`、`MagnifierIcon`、`HotSearchBar`、`AppCard`、`SearchResultCard`、`SoftwarePreview`。
- 卡片整卡可点，不再放「查看详情」；`form-field` 支持说明文字（`aria-describedby` 关联）、选填标记与统一的错误 / 成功态。
- 后台登录页不再把 `?e=` 的原文显示出来，未知错误码统一提示「登录失败」，避免被拼接成钓鱼文案。

## 2026-09-28 · 精简与安全加固

这一轮不录新条目，把前七轮长出来的流程和代码收敛一遍。

**安全：探活脚本补上 SSRF 防护**

- 上一轮给 `check-links` 加的 `--url` 可以传入任意地址，却没有限制目标。候选地址若来自网页或用户投稿，脚本就会替你去打 `169.254.169.254`（云元数据服务）、内网管理口，或 `file://` 本地文件——这是典型的 SSRF，而这类脚本正是由 AI 自动执行的。
- 抓取统一走 `scripts/_shared.mjs` 的 `safeFetch`：只放行 http/https；预解析 DNS，拒绝私有 / 保留 / 环回 / 组播网段（IPv4 按 CIDR 表位运算，IPv6 覆盖 `fc00::/7`、`fe80::/10`、`::1`、文档段）；`redirect: "manual"` 手动跟随并**逐跳**校验——只给 `redirect: "follow"` 的话，一个 302 就能绕过所有检查。
- 测本机 dev 服务才加 `--allow-private`，且它**只放行第 0 跳**。否则「测一下 localhost」会被服务端的一个 302 带进内网。
- 已验证拦截：元数据地址、`127.0.0.1`、`192.168.x`、`10.x`、`[::1]`、`file://`，以及「公网 → 302 → 169.254.169.254」的绕过路径。

**安全：备份删除加确认**

- `--keep` 会 `fs.rm -r`。此前只按目录名匹配 `ashare-backup-*` 就删，若 `--out` 指向的目录里本来就有同名文件夹会被误删。现在目录必须有带 `createdAt` 的 `manifest.json`、归档须经 `tar -tzf` 确认含 manifest，否则跳过并提示。已用「名字合规但无 manifest」的假目录验证会保留。
- 快照若含用户投稿 / 反馈文件（`feedback.json`、`blocks.json`、`inbox.json`）会在清单里标出并提示「对外分享前先剔除」——恢复需要完整数据，但分享不需要。

**精简：抽出 `scripts/_shared.mjs`**

- 五个脚本各自实现了一遍参数解析、运行库读取、并发限流。`parseFlags` / `readCatalog` / `mapLimit` / `safeFetch` 收进公共模块后：`check-links` 217 → 152 行、`content-audit` 189 → 174、`ingest-item` 294 → 288，`backup` 因新增删除保护 214 → 231。公共模块 167 行，其中约 60 行是 SSRF 防护这一新增能力。
- 净账：脚本 +14 行、主流程文档 −65 行。代码量没有真的下降，换来的是消除 5 处重复实现 + 两个安全缺口被堵上。

**精简：SKILL.md 197 → 132 行**

- 核验要点、批量节奏、`--patch` 细节与 references 大量重复。现在 SKILL.md 只留流程骨架、硬红线、闸门和「指向哪个 reference」，细则下沉到按需加载的 references——核验的 8 条陷阱搬进 `sources-and-redlines.md`，没有丢信息。

**流程：给已知误报打标记**

- 全量探活每轮都报同样 4 个异常，且全是误报：inkscape.org / jasp-stats.org 的 403 是 Cloudflare 拦自动化，texstudio.org / gimp.org 的超时是本机代理隧道。脚本现在对这几个域名附一句带日期的「已人工确认」提示，省掉每轮重复复核。提示不改变判定结果，过期需重验。

**验证**：`npm run check` 46 测试全过 · 51 个链接探活 48 可达（4 个异常均为上述已知误报）· 全站 35 个详情页冒烟 0 异常 · `seed:drift` 0 不一致 · 备份 / `--keep` / `--list` 行为正常。

## 2026-09-28 · 文档场景补齐 3 条与探活工具改进

**补齐文档场景 3 条空壳**（`npm run content:audit`：正文/标签缺失 13 → 10）

- Obsidian：主程序是**专有软件**（个人免费、商业使用需付费许可），`source: official` / `kind: app`，正文第四段明说「插件大多开源，但主程序不是」——它常被误当成开源项目，插件仓库也不是上游，因此只留官网链接。
- Pandoc（GPL-2.0-or-later，Haskell 编写，分发单个可执行文件）、Sumatra PDF（GPL-3.0，已读上游 COPYING 原文确认为「GNU GENERAL PUBLIC LICENSE Version 3」）。三条各补 4 个标签、4–5 个别名与四段正文，运行库与种子两个落点都已写入，漂移 0 条。
- 冒烟复核：本批 3 条与全站 35 个详情页均无异常，本批 5 个链接全部 200。

**核验过程中澄清的两处疑点**

- Pandoc 的 `COPYING` 在 main 分支取不到（404），许可证按 GitHub API 的 `license` 字段记录，正文写明来源。这条属于「核验受限但结论可靠」，未硬写范围。
- `obsidian.md/download` 首次探活超时 10s，重跑 200；`curl --noproxy '*'` 直连又是 000 而脚本走代理是 200。同一地址三种结论，说明单次失败只能证明「这条路径不通」。站点本身正常，地址未改。

**`check-links.mjs` 支持 `--url` 与自动重试**

- 选题阶段要核验还没入库的候选地址，以前只能拿 curl 手测，还常与脚本结论不一致。现在可直接 `--url <地址>` 批量测，写入前先把候选地址过一遍。
- 网络抖动会让活链偶发超时，默认失败后重试 1 次（`--retries 0` 退回只测一次）。顺带修掉 `attempt()` 返回 `result.url ?? result.finalUrl` 的取值不一致——`request()` 只产出 `finalUrl`，前者恒为 undefined。

**又一次 `aliases` 漏同步**

- 本批草稿改了 `aliases`/`tags`/`body`/`links` 四项，运行库写入后同步种子时漏了 `aliases`，`npm run seed:drift` 报出 3 条不一致。这是第二次栽在同一字段上（第二批是 blender/dbeaver/figma/freecad/geogebra）。已在 SKILL.md 第 6 步写成硬动作：草稿改了哪些字段，种子就照字段名逐项核对。

**技能文档迭代**：坑位库新增 46–49 条（探活要交叉验证、`--url` 的由来、插件开源 ≠ 主程序开源、`--patch` 字段清单要原样同步）；SKILL.md 第 3 步加入 `--url` 用法与重试说明，第 6 步加入字段逐项核对动作。

## 2026-09-28 · 开发场景补齐 3 条与漂移检查

**补齐开发场景 3 条空壳**（`npm run content:audit`：正文/标签缺失 16 → 13）

- Git（GPL-2.0-only，仓库 COPYING 明确只认第二版，不是 v2 或更高版本）、Node.js（MIT，仓库注明内含第三方组件各自另有许可）、Python（PSF License Version 2，条款与 MIT / GPL 不同）。三条各补 4 个标签、4 个别名与四段正文，运行库与种子两个落点都已写入，漂移 0 条。
- 冒烟复核：全站 35 个详情页无异常。

**修复第二批遗留的别名丢失**

- 第二批给 blender / dbeaver / figma / freecad / geogebra 补 `aliases` 时只写了新别名，`--patch` 是整体替换，原有的「3d」「建模」「sql 客户端」等搜索词被覆盖，且漏同步种子。已按「原有 + 新增」合并回写两个落点，并顺带对齐 Blender 正文里一处空格差异。

**新增 `scripts/seed-drift.mjs`（`npm run seed:drift`）**

- 「两个落点」此前全靠人工保证，没有机器校验。脚本把种子经 `seedToItem()` 转换后与运行库逐字段比对（`summary` / `body` / `tags` / `aliases` / `links` / `kind` / `source` / `price` / `scenes` / `platforms`），并列出仅存在于一侧的条目；`--strict` 有差异时非零退出。
- 首次运行即抓出 5 条不一致（4 条别名漏同步、1 条正文空格差异），修复后归零。已接进 `package.json`、README 与收录流程的第 6 步闸门。
- 实现要点：Node 的类型擦除可以直接 `import "../data/software.ts"`，不需要正则解析 TS 源文件。

**技能文档迭代**：坑位库新增 41–45 条（`--patch` 是替换不是追加、`aliases` 漂移最难发现、GPL-2.0 与 GPL-2.0-or-later 有别、许可证按原文写、脚本可直接导入种子 TS）；SKILL.md 第 6 步加入漂移检查闸门与别名替换警告。

## 2026-09-28 · 办公场景补齐 3 条与批次归属规则

**补齐办公场景 3 条空壳**（`npm run content:audit`：正文/标签缺失 19 → 16）

- Joplin（AGPL-3.0-or-later，上游 LICENSE 为仓库默认许可、部分子目录另有声明）、LocalSend（Apache-2.0）、Thunderbird（MPL-2.0，源码在 hg.mozilla.org 不在 GitHub，只有官网链接）。三条各补 4 个标签、4–5 个别名与四段正文，运行库与种子两个落点都已写入。
- Joplin 的 LICENSE 里另有商标与图标条款（Joplin® 为 JOPLIN SAS 注册商标，logo 需授权使用），已单独写进正文第四段——这类限制比许可证本身更容易被二次分发者踩到。
- 冒烟复核：本批 3 条与全站 35 个详情页均无异常。

**`content-audit` 补上批次归属能力**

- 输出新增 `primary`（即 `scenes[0]`）：`--scene X` 会把主场景不是 X 的条目标成「（主场景 Y）」。跨场景条目（如 joplin 属 `office`+`docs`、obsidian 属 `docs`+`office`）此前归属不明，两边都以为对方会处理，最后谁也没做——现在按主场景归属，这类条目留给所属场景那一批。
- 默认输出末尾新增「建议下一批」：挑主场景待补最多的场景并列出前 3 个 slug，直接支撑「一批一个场景」的节奏。当前指向开发场景（主场景待补 6 条）。

**技能文档迭代**：坑位库新增 37–40 条（API 拿不到许可证时直读上游文件、许可证附加条款要照实写、跨场景条目按主场景归属、冒烟需 dev 常驻）；SKILL.md 批量节奏新增跨场景归属规则与「建议下一批」用法。

## 2026-09-28 · 制图场景补齐 3 条与渲染冒烟

**补齐制图场景 3 条空壳**（`npm run content:audit`：正文/标签缺失 22 → 19；制图场景待补 5 → 2）

- KiCad（GPL-3.0，上游 LICENSE 明确为第三版）、LibreCAD（GPL-2.0，上游 LICENSE 明确为 GPLv2）、OpenSCAD（GPL-2.0，上游 COPYING 为第二版并附 CGAL 链接例外）。三条 API 返回的 `license` 均为 `NOASSERTION` 或空，全部改从上游许可证原文确认。
- 三条各补 4 个标签、4–5 个别名与四段正文，运行库与种子两个落点都已写入；补上 Git 仓库链接（KiCad 上游在 gitlab.com，LibreCAD 与 OpenSCAD 在 GitHub）。

**新增渲染冒烟脚本 `scripts/smoke-detail.mjs`（`npm run smoke:detail`）**

- 此前几批只跑 `npm run check` 与 `content:audit`，两者都只碰数据，从没验证过页面。脚本在 dev 服务上逐条检查：正文每一段是否真的渲染（取每段前 12 字做探针）、官网与 Git 链接是否出现在页面、来源徽章是否与 `source` 一致、价格是否展示。
- 首轮实测 35 个详情页全部通过。徽章按 CSS 类判断而非全文搜「开源」——页脚与「同类替代」都会带出该词，全文搜会误报（GeoGebra 首轮即被误报）。
- 已接进 `package.json` 与 README，并写进收录流程的校验闸门。

**`content-audit` 新增 `--scene <id>`**：按场景收窄统计与待补清单（场景库存仍按全量算），配合「一批一个场景」的节奏。

**技能文档迭代**：坑位库新增 32–36 条（数据检查全绿不等于页面正确、徽章按 CSS 类判断、后台任务里 `&` 起的服务会被回收、本机访问 localhost 需绕过代理、`--scene` 只收窄统计）；SKILL.md 第 7 步从「打开页面看看」改成可执行的冒烟闸门，完成标准同步加入该项。

## 2026-09-28 · 设计场景补齐 3 条与校验脚本硬化

**补齐设计场景最后 3 条空壳**（`npm run content:audit`：正文/标签缺失 25 → 22，设计场景待补归零）

- GIMP（GPL-3.0，上游 `COPYING` 明确为第三版）、Inkscape、Krita（GPL-3.0）。三条各补 4 个标签、4 个别名与四段正文，运行库与种子两个落点都已写入。
- Inkscape 与 Krita 补上 Git 仓库链接（上游分别在 gitlab.com 与 github.com/KDE/krita）。GIMP 上游在 `gitlab.gnome.org`，不在 Git host 白名单内，只保留官网链接。

**修复一条真死链**

- Krita 官网下载页 `krita.org/download/` 已 404，正确地址为 `krita.org/en/download/`。运行库与种子同步修正，复检 200。
- 全量探活 39 个链接，另外 3 个异常经人工复核均非死链：inkscape.org 与 jasp-stats.org 是 Cloudflare 拦自动化（换浏览器 UA 即 200），texstudio.org 的超时是本机代理隧道失败（站点正常，最新版 4.9.8）。

**Inkscape 许可证如实标注**

- 上游用 REUSE 规范管理，`LICENSES/` 同时含 GPL-2.0-or-later 与 GPL-3.0-or-later，GitLab API 的 `license` 字段为空，且 inkscape.org 对本机请求返回 403 无法在线确认。正文写明「GPL 系列，以官网声明为准」及核验受限，不写死版本。

**校验脚本硬化**

- `ingest-item.mjs` 新增 `--strict`：把 SKILL.md 的「完成标准」变成可执行检查——正文至少 2 段且 ≥200 字、标签至少 3 个、别名非空、已发布必须有来源链接、适合/不适合不出现身份词、正文不含 Markdown（标题/加粗/列表/链接语法）。默认只提示，`--strict` 下升级为错误。已用一份故意不达标的草稿验证会拦下 6 项。
- `content-audit.mjs --json` 的输出补上 `scenes` 字段：按场景分批补内容时可直接筛出某一场景的待补条目，此前只能靠猜。

**技能文档迭代**：坑位库新增 27–31 条（`--patch` 浅合并会整体替换 `links`、异常不等于死链、REUSE 多许可、GitHub 仓库可能是过期镜像、自托管 GitLab 不在白名单）；SKILL.md 核验步骤补充四条复核要点，预检步骤补充 `--strict` 与浅合并警告。

## 2026-09-28 · 补齐空壳条目与种子透传修复

**补齐 5 条历史空壳的正文与标签**（`npm run content:audit`：正文/标签缺失 30 → 25）

- Blender（GPL，blender.org）、DBeaver（社区版免费，dbeaver.io）、Figma（个人档免费）、FreeCAD（LGPL，freecad.org）、GeoGebra。运行库与种子两个落点都已写入，链接探活 5/5 通过。
- 新增 `ingest-item.mjs --patch` 模式：只覆盖草稿里写到的字段，slug 不存在则报错退出，避免手滑新建重复条目。

**修正 GeoGebra 的分类错误**

- 此前种子标 `source: "opensource"`，被 `seedToItem()` 推导成 `kind: "opensource"`，前台会显示「开源」徽章。但它的 GitHub 仓库 `license` 字段为 `null`——源码公开、许可闭源，实为非商业免费。已改为 `source: "official"` + `kind: "app"` + `price: "非商业免费"`，正文第三段写明商用需单独授权。

**修复：补进运行库的正文，全新部署会全部丢失**

- `seedToItem()` 把 `body` 硬编码成 `""`、`tags` 硬编码成 `[]`，而 `data/software.ts` 的种子类型里根本没有这两个字段。也就是说正文补得再多，只要 `catalog.json` 重建就退回 30 条空壳。
- `SeedSoftware` 新增可选 `body` / `tags` / `kind` / `links`，`seedToItem()` 改为透传（缺省行为不变，已有种子不受影响）。映射逻辑抽到 `lib/seed.ts`（`lib/store.ts` 带 `server-only`，测试无法直接导入），新增 `tests/seed.test.mjs` 6 项守住透传与 `source`/`kind` 不打架。
- 涉及文件：`data/types.ts`、`lib/seed.ts`、`lib/store.ts`、`data/software.ts`、`tests/seed.test.mjs`。

**技能文档迭代**：坑位库新增 21–26 条（种子形态差异、`links` 是对象不是数组、开源判据是许可证而非源码可见、跨场景混批）；`SKILL.md` 主流程补充 `--patch` 模式与种子落点的正确写法，字段文档新增「`source` 与 `kind` 的判定」。

## 2026-09-28 · 音乐场景开栏与收录流程

- 新增 [Audacity](https://github.com/audacity/audacity)：4.0.0（2026-09-03），Windows .msi / macOS .dmg / Linux AppImage。GitHub 许可证字段为 NOASSERTION、仓库 topics 标注 gplv2，正文如实写明「商用前自行核对 LICENSE」。
- 新增 [MusicBrainz Picard](https://github.com/metabrainz/picard)：GPL-2.0，2.13.3（2025-02）。依赖 MusicBrainz 在线库，中文与小众发行匹配率低，已写入正文第三段。
- 补入 [Mineradio](https://github.com/XxHuberrr/Mineradio)（GPL-3.0）：此前只存在于 `data/samples.ts`，运行库缺失导致「音乐」场景计数为 0，与 09-15 的记录矛盾。
- 同时写入 `data/store/catalog.json`（SHA-256 同步）与 `data/samples.ts`；音乐场景库存 0 → 3。
- 新增运维脚本：`scripts/backup.mjs`（带时间戳快照，可选调用系统 tar）、`scripts/content-audit.mjs`（字段缺口与场景库存报告），已接进 `package.json` 与 README。
- 新增项目级技能 `.workbuddy/skills/ashare-curation`：收录流程、字段规格、红线清单、踩坑库，以及 `ingest-item.mjs`（校验 + 写入）与 `check-links.mjs`（链接探活，github.com 直连失败时改用 API 代验）。

## 2026-09-19

- 首页直接搜索；搜索支持全角字符和多关键词，筛选状态可移除且保留排序与视图。
- 修复重复查询参数 500、非法场景查找、移动菜单不可滚动、表单校验失败丢输入。
- 目录读取按请求复用，卡片使用精简数据，图片按需缩放并在失败时回退；移除构建时外部字体依赖。
- 统一导航、卡片与平台信息，修正精选标签、按钮读屏名称和浅色徽章对比度。
- JSON 读改写事务、损坏数据保护、可恢复写队列、认证与上传校验、保存失败回滚。
- 修复 CSP nonce / 主题脚本，补充安全头、SEO 元数据、错误恢复与搜索加载状态。
- 增加回归测试、CI、环境配置样例、密码生成与统一检查命令。

本文件记录对 Ashare 的功能、界面与安全改动。格式按日期倒序，条目写明动机与涉及文件。
规划类文档见 [next.md](./next.md)，产品与视觉规范见 [PRODUCT.md](./PRODUCT.md) / [DESIGN.md](./DESIGN.md)。

## 2026-09-17 · 页脚备案

- 全站页脚与侧栏底部增加备案号：鲁公网安备37011602000384号、鲁ICP备2026008648号-1，分别链到公安部与工信部查询页。

## 2026-09-15 · 收录 Mineradio

- 新增条目 [Mineradio](https://github.com/XxHuberrr/Mineradio)（GPL-3.0，Windows/macOS 沉浸式音乐播放器），归入新「音乐」类别（首个条目）。
- 写入 `data/samples.ts`（种子）与 `data/store/catalog.json`（运行库，SHA-256 同步）。
- 注意：该播放器接入网易云/QQ音乐第三方接口，登录态与音源可用性随平台变化。

## 2026-09-15 · 类别页调整

- 类别页 `SceneBrowser` 去掉「来源」筛选（全部来源/开源/官方/优惠），只保留「系统」；相关 state 与常量清理。
- 类别页新增九宫格/行排列切换（默认行排列），网格卡片抽为共用组件 `SoftwareCard`。

## 2026-09-15 · 类别页视图切换

- 抽出 `components/SoftwareCard.tsx`（网格卡片），首页与类别页共用，不再各写一份。
- 类别页 `SceneBrowser` 新增九宫格/行排列两个排列按钮，位置在「系统」选择器左侧；**默认行排列**。

## 2026-09-15 · 卡片 CTA 与类别追加

- 卡片（网格/列表/横滑）的「前往」外链按钮改为「查看」，先跳详情页，由用户自己点官网链接；详情页保留「前往官网」CTA 与 `ItemLinks` 外链。
- 侧边栏类别追加 6 个：工具、摄影与录像、游戏、教育、音乐、社交（原有开发/文档/设计/数据/办公/制图不合并、不重打，新类别暂为空）。
- 同步改动：`SceneId` 类型、`data/scenes.ts`、`lib/colors.ts`、`lib/catalog.ts` 的 counts、`SidebarIcons` 图标、侧栏与移动导航配色。

## 2026-09-15 · 侧边栏重排与全宽布局

- 侧边栏移除筛选面板（`FilterPanel` 不再挂在 Sidebar），只保留导航：探索 / 类别 / 更多三个分组。筛选改由内容工具栏的「筛选」按钮打开左侧 `Sheet`，桌面与移动一致（去掉按钮上的 `lg:hidden`）。
- 场景名去掉动词，改为名词：写代码→开发、写文档→文档、做设计→设计、做数据→数据、办公协作→办公、工程制图→制图。
- 全站页面容器改为铺满（去掉 `max-w-980/1000/1200` 居中）；详情页与关于页的正文段落仍用 `max-w-[68ch]` 保证阅读宽度。
- `layout.tsx` 不再为侧栏计算 `catalogCounts`，去掉 `Suspense` 包裹。

## 2026-09-15 · 界面重构：迁移 shadcn/ui

### 定位变更

- 放弃 Mac App Store 复刻，改为「简洁、年轻、现代化」的舒展卡片流。
- 重写 `PRODUCT.md`（品牌三词、反参考、设计原则）与 `DESIGN.md`（shadcn + Tailwind v4 设计系统、浅/深主题、组件映射）。
- `next.md` 顶部标注为历史文档（实现前的规划，描述已过时）。

### 技术底座

- 引入 shadcn/ui（`style: radix-nova`，底层 Radix Primitives + Lucide），新增 `components.json`。
- 新增依赖：`radix-ui`、`class-variance-authority`、`cn`、`lucide-react`、`tw-animate-css`、`next-themes`、`sonner`、`cmdk`。
- `components/ui/*`（20 个组件文件）归项目所有。
- 因 `shadcn` CLI 的 registry 直连不稳、且会读 `ALL_PROXY`（socks）断连，改用 curl 拉取 registry，并修复了原始文件里的内部别名（`@/registry/...`）与 `IconPlaceholder`（替换为 Lucide）。

### 主题

- `app/globals.css` 重写：shadcn 语义变量（oklch）+ `@custom-variant dark` + 项目扩展色（`--official/--opensource/--discount`）。
- 品牌主色改为紫 `oklch(0.53 0.235 277)`，圆角基准 `0.75rem`。
- 新增深色主题（`.dark`），`next-themes` 接管，`ThemeToggle` 放入 Header / Sidebar。
- **一次替换**：全站旧 token 类名改为 shadcn 命名（`text-muted`→`text-muted-foreground`、`bg-bg`→`bg-background`、`bg-surface`/`bg-fill`→`bg-muted`、`border-line`→`border-border`、`text-link`→`text-primary` 等），共 29 个文件。

### 首页试点

- `Header`：移动端导航改用 `Sheet` 抽屉，加主题切换。
- `Sidebar`：换用新 token 与 `bg-sidebar`，加主题切换。
- `HotSearchBar`：热门词改用 `Badge`。
- `CatalogBrowser`：工具栏用 `Button`/`Select`，移动筛选用 `Sheet`，卡片改用 `Card`/`Badge`/`Button`，网格加宽到 `max-w-1200`、`gap-5`。
- `app/page.tsx`：新增「编辑精选」横滑行（复用 `AppCardRow` + `featured`）。

### 详情页迁移（同一日）

- `app/software/[slug]/page.tsx` 重写：`Button` 主 CTA、`Badge`、`Card` 信息条（`gap-px` 发丝线）、`Separator` 分节、圆形序号教程、适合/不适合卡片、`ItemLinks` 卡片化。
- 同步迁移：`TagList`（Badge）、`SourceBadge`（Badge + 扩展色）、`ItemLinks`（Card + Lucide 图标）、`AppCard`（Card + Button，编辑精选与替代行同时变新）。
- 注：lucide 已移除品牌图标，GitHub 链接行用 `GitBranch` 代替。

### 列表与筛选迁移（同一日）

- `SoftwareRow`：改为 `Card` 行（`flex-row` + hover 抬升），GET 按钮用 `Button`；列表视图容器加 `space-y-2`（`CatalogBrowser`、`SceneBrowser`）。
- `FilterPanel`：自研勾选框/开关改为 shadcn `Checkbox` / `Switch` / `Label`，分组标题降级为 13px 灰字。
- 因全部改用 `Button`，`components/ExternalButton.tsx` 已无引用，删除。

### 表单迁移（同一日）

- 新增 `components/form-field.tsx`（共享 `Field` + `Label`），两表单各自重复的 `Field`/`inputClass` 已删。
- `SubmitForm` / `FeedbackForm`：改用 shadcn `Select`（Radix 会渲染同名隐藏 `select`，Server Action 的 FormData 照常拿到值）、`Input`、`Textarea`、`Button`，成功态用 `Card`。
- `/submit`、`/feedback` 去掉外层灰底卡片。

### 后台迁移（同一日）

- 登录页：`Card` + `Field` + `Input` + `Button`。
- 条目列表：`Table` 组件化，状态改 `Badge`，删除加 `AlertDialog` 确认（确认框内嵌 Server Action 表单）。
- 录入表单：分节改 `Card`，文本/长文换 `Input`/`Textarea`，标签换 `Field`；**保留原生 `<select>`/`<checkbox>`/`<input type=file>`**——Radix 的 Select/Checkbox 不参与原生表单事件，会破坏 `DraftKeeper` 草稿恢复。
- inbox：三个区块改 `Card` 化，删除/解封用 `Button`，删除统一 `AlertDialog` 确认。
- 验证：用 `SESSION_SECRET` 自签合法 session cookie，后台四页（列表/inbox/新建/编辑）全部 200。

### 未迁移

仅剩 `PlatformList`（12px 灰字平台列表，无逻辑，暂不动）。

## 2026-09-15

### 新增：条目价格字段

卡片原来对所有条目硬编码「免费」，付费/会员制条目展示失真（如剪映会员这类）。

- `data/types.ts`：`Software` 与 `SeedSoftware` 新增可选 `price?: string`；留空按「免费」，可填短文案如 `会员 ¥68/月`。
- `app/admin/items/[id]/page.tsx`：基本区新增「价格」输入。
- `app/admin/actions.ts`：`saveItem` 落库 `price`。
- `components/CatalogBrowser.tsx`：卡片价格位改 `{item.price ?? "免费"}`，长文案 `truncate` + `title`。
- `app/software/[slug]/page.tsx`：「信息与安全」新增价格行；JSON-LD 的 `offers` 仅在免费时输出（此前付费条目谎报 `price:"0"`）。
- 种子 `obsidian / figma / wps` 补价格，本地 `data/store/catalog.json` 同步并重算 SHA-256。

### 变更：图标改为本地

`cdn.simpleicons.org` 现由 Cloudflare 人机验证拦截，Node fetch 取不到，导致全部 logo 回退字母块。运行时不再访问外部 CDN。

- 新增 `data/icons/*.svg`（21 个，提交进仓库）。
- `app/icons/[slug]/route.ts`：改为纯读盘（`data/icons/<slug>.svg`），命中返回 `image/svg+xml` + 一年 immutable 缓存，缺失 404 由前端回退字母；删除 CDN 拉取与 7 天过期逻辑。
- `.gitignore`：移除 `data/cache/`，`data/icons/` 明确不忽略；删除旧目录 `data/cache/`。
- 补件：`rstudio` 取 simple-icons 现名 `rstudioide`、`gnuoctave` 取 `octave`（均上品牌色）；`visualstudiocode` 取 devicon 彩色 logo；`windows` 图标 simple-icons 已下架，`components/FilterPanel.tsx` 平台 chip 回退字母 `W`。

### 变更：预览区支持 GIF

- `app/admin/actions.ts`：上传白名单加 `image/gif`；单图上限 `1.5MB → 5MB`。
- `app/media/[...path]/route.ts`：Content-Type 增加 `gif`。
- `app/admin/items/[id]/page.tsx`：预览 `accept` 加 gif，文案更新。
- `next.config.ts`：Server Action `bodySizeLimit` `2mb → 6mb`。

### 修复

- **生产环境上传图片 404**（`app/media/[...path]/route.ts`）：路径白名单 `^[a-zA-Z0-9-]+$` 不允许点号，而上传文件名是 `hex.gif` 这类带点格式。dev 下由 Next 静态服务抢占未暴露，构建后新上传的图会全部 404。改为精确匹配生成格式 `^[a-f0-9]+\.(jpe?g|png|webp|gif)$`，并加 8 例路径校验（含 `..` 穿越）。
- **开发模式 CSP 缺 `unsafe-eval`**（`proxy.ts`）：React/Turbopack 调试依赖 eval，控制台报错。仅在非生产环境追加 `'unsafe-eval'`，生产不放宽。
- 既有 lint 错误：`app/search/page.tsx` 未转义引号改为中文引号；`app/admin/inbox/page.tsx` 的 `Date.now()` 加 Server Component 豁免注释。

### 界面细节（不引入依赖）

- `app/globals.css`：新增 `--shadow-card-hover` token。
- `components/CatalogBrowser.tsx` / `SearchResultCard.tsx`：卡片 hover 抬升 + 预览图 `scale-[1.04]`。
- `components/AppCard.tsx`：横向卡 hover 抬升。
- `components/ExternalButton.tsx`：`active:scale-[0.97]` 按压反馈 + 过渡。
- `components/HotSearchBar.tsx`：随机描边色改为统一胶囊 + 品牌色圆点。

### 删除：死代码

- `components/GlassAppIcon.tsx`（旧 hero 残留，无引用）。
- `lib/catalog.ts`：`featuredSoftware()`。
- `data/types.ts` + `data/scenes.ts`：`Scene.tagline`（无处渲染）。
- `components/ExternalButton.tsx`：未用的 `"text"` 变体。
- `components/SoftwareRow.tsx`：未用的 `showAction` prop。
- 未用 import：`app/admin/items/[id]/page.tsx` 的 `deleteItem`、`components/FilterPanel.tsx` 的 `sceneColors`。

### 运维

- 重置管理员口令（`ADMIN_PASSWORD_HASH`，scrypt），明文与哈希均不入仓库、不记入本文档。
