# 变更记录

## 2026-10-10 · 修复：条目编辑页打不开（main，问题编号 419379393）

后台条目编辑页整页渲染失败。根因是 React 拒绝把**函数当 prop** 传给客户端组件
（`Functions cannot be passed directly to Client Components`）——
上一轮那个「服务端渲染好回滚表单、再当 prop 传给客户端组件」的绕法。

**`tsc`、`eslint`、`next build` 全都没拦住。** 函数是不可序列化的 prop，编译期查不出来，
只有真实渲染才暴露。上一轮我就是靠「类型通过 + 构建通过」宣布完成的 ——
那是**验证方法的漏洞**，不是代码没问题。

**改法**：客户端组件自己 import server action（Next.js 的既定能力，
本项目 `FeedbackForm` / `SubmitForm` 本来就这么做）。那个绕法删掉。

**验证方式也一并改了**。这次不以「构建通过」为证据，而是：临时设一个已知口令 +
用 `createSessionToken` 生成合法会话 cookie（绕开「server action 需要浏览器执行 JS
才能登录」），带 cookie 真实请求该页面，确认 HTML 里有 `v1`/`v2`、「当前」、
「回滚到这一版」，且 dev 日志里该错误计数为 **0**。

**结论沉淀成一条判断**：跨服务端/客户端边界时，**构建通过不代表渲染能过**。
凡是「把服务端的东西传给客户端组件」的设计，都必须实际请求一次页面看日志。

**收尾**：用 SQL 复原实库（口令哈希、条目内容、`row_version`、删历史），
`seed:drift` 报 0 条不一致。

**验证**：check 265 项 0 失败 · verify:report 0 问题 · eslint 与 tsc 无告警 · 实机 200。

## 2026-10-09 · 后台条目历史面板：看每次改了什么，并能回滚（main）

上一轮把内容级历史的底层做完了，但历史只能写、不能看 —— 编辑不知道自己能不能查。
这轮接进条目编辑页：列出版本号、动作、摘要、操作者、时间，以及这一版改了哪些字段
（列名译成中文，认不出的原样显示）。「查看这一版」展开该版完整内容。

**回滚刻意走 `saveItem` 正常通道，而不是直接改数据库**：

1. 回滚本身也是一次编辑，会像任何编辑一样记入历史链 —— 直接改库会把中间那些版本
   悄悄抹平。**回滚不是时间倒流：丢掉的那几版本身也是信息**（那条错误描述存在了多久，
   本身就是要查的问题）。
2. 走正常通道自带乐观锁：若期间别人改过，会被挡下并提示「刚被别人改过」，
   而不是无声覆盖。

**发布状态不随回滚改变**：把自己下架的条目回滚回来却变成已发布，那不是回滚，
是意外发布。状态是当下的决定，不是内容版本的一部分。这条有测试守着。

**回滚需要 `publish` 权限而非 `edit`**：「回到哪个版本」更接近发布决策。

**一处实现上的绕弯**：客户端组件不能 import server action，所以回滚表单由服务端渲染好、
作为节点传给客户端组件摆到该位置。最初想在客户端建占位再由页面填充，太绕且脆弱。

**实测**：真实条目 `vscode` 造 3 版后回滚到 v2 —— 内容正确回到 v2、V3 多出的正文被移除、
**V3 仍保留在历史里可还原**。测完用 SQL 复原实库，`seed:drift` 报告 0 条不一致。

**验证**：check 265 项 0 失败 · test:db 57/57 · build 26 路由全过 · verify:report 0 问题。

## 2026-10-09 · P7b-b：内容级历史，基线快照 + 字段级差异（main）

`audit_log` 只记「改了哪些字段」与版本号，正文改成什么它答不了。这轮补上内容级历史。

**形态**：首版存完整快照，之后只存字段级差异；还原第 N 版 = 基线 + 重放前 N 次差异。
**实测体积**：单条完整内容平均 8.2 KB（正文平均仅 1.2 KB，含子表才是大头），
而一次真实编辑通常只碰一两个字段 —— 基线 662 B、单列差异 56 B，差一个量级。
差异形态下这张表不按「编辑次数 × 全量」增长，**原计划担心的「体积比目录还大」不成立**。

**保留策略**：最近 20 版**或** 90 天内（满足其一），写入时顺带清理，不用定时任务。
「或」是必须的—— 二选一的话，一个半年没动过、今天被改了一次的条目会把整段历史清空，
而那段历史可能正是想查的。首版快照永不删除，它是唯一基线。

**派生字段的区分**（这轮最关键的一处）：

- `search_text` / `updated_at` / `row_version` —— **不存**，每次都变或自动更新，重放时重算
- `created_at` —— **要存**：不可变，差异比较恒为 false，但丢掉它重放出的条目就没有创建时间

判据是两条：**「存不存」看还原后是否缺东西，「比不比」看会不会每次都变。**

**历史与条目写在同一事务**（`saveItem` / `setItemStatus` / `deleteItem` 三处都接了）。
否则会出现「条目已改但历史没记」的窗口 —— 那时历史不再是真相，只是看起来像。
`setItemStatus` 尤其不能漏：它会递增 `row_version`，只改 items 不记历史会让版本号与
实际断开，之后「回到第 N 版」拿到的是错的内容。

**两处实现缺陷，都是测试抓出来的**：

1. 改名后新 slug 的历史**打不开**（`缺少基线快照`）。只写一条 delta 而不搬旧链，
   新链就没有基线可重放。现在改名时把旧链复制到新 slug 下 —— 新链自洽、旧链也留着。
2. `created_at` 起初被归进「不存」那类，重放后条目缺创建时间。

**删除不删历史**：条目没了，但「什么时候下架的、下架前长什么样」要能回答。
不传 `actor` 时不生成历史 —— ETL 批量导入不该污染历史链。

**测试**：纯函数 11 项 + 数据库往返 7 项。往返那组的重点是「最新一版重放必须与
items 表逐字段相同」—— 差一个字段，历史就在骗人。

顺带修了 `db.test.mjs` 的两处硬编码清单（表清单、已应用迁移清单）——
它们的全部价值就是「迁移漏建表时立刻发现」。

**验证**：check 263 项 0 失败 · test:db 55/55 · verify:report 0 问题 · tsc 与 eslint 无告警。

## 2026-10-09 · P7b-a：后台账号管理界面 /admin/users（main）

P7b 原计划有两件事，这一轮做账号界面（验收标准是「不靠命令行也能管账号」）。
内容级历史 `item_revisions` 拆成 P7b-b —— 它要先定保留策略（存多久、留几份）。

**页面**：账号列表（角色下拉、启停、重置口令、删除）、新建账号折叠表单，
以及**角色权限矩阵**。矩阵显式列出来是因为角色只有两行但说不清就会变成
「凭感觉授权」。

**三条自伤防线**：不能停用/删除/降级自己。前端按钮禁用只省一次点击，
**真正的拦截在 action 里** —— 管理员误操作一次就可能把唯一的账号管理能力弄丢，
且没有其他人能把它改回来。

**导航按权限过滤**：`AdminTabs` 只对管理员显示「账号」标签。给编辑显示一个
点进去会被重定向的标签更糟 —— 它看起来是个能用的入口。

**口令用表单明文输入**：命令行那套隐藏输入在 HTTP 表单里做不到。风险靠别的方式补——
`autocomplete="new-password"` 让浏览器不保存不 autofill，提交后立刻 revalidate，
页面不回显、不进 URL。

**规则只定义一处**：口令下限 12、用户名规则都从 `lib/users.ts` 取，与
`scripts/user-manage.mjs` 共用。两套入口各写一份迟早漂移。

**测试里三处值得记的地方**：

1. 成功路径**也是**一次 redirect（Next 的 server action 必须 redirect 或 throw）。
   最初用 `.catch(() => {})` 吞掉，**那会把真错误一起吞掉** —— 代码坏了也显示测试通过。
   改成断言跳去了哪一页，既确认成功又确认去对了地方。
2. 防线测试用**真实存在的账号**而不是引导账号 `env-admin`。拿虚拟账号测不出真问题。
3. 权限测试确认编辑既不能删管理员，**也不能改管理员口令**（改口令同样是越权）。

**顺带补上一个体验缺口**：引导账号 `env-admin` 是虚拟的（只在 `lib/auth.ts` 的常量里，
账号表里没有它）。用户用它登录后在列表里看不到自己，会以为登录出了问题 ——
页面上显式说明了这一点。

**验证**：check 245 项 0 失败（新增 15 项）· build 25 路由全过（含 `/admin/users`）·
verify:report 67 条引用 0 问题 · tsc 与 eslint 无告警。
顺带修正了因新增 import 导致的报告行号漂移（`actions.ts` 三条引用）。

## 2026-10-09 · 数据库测试在连不上时跳过并说明原因（main）

七个数据库测试文件原来只判断「URL 有没有配」，不判断「服务在不在」。配置了 URL 但
MySQL 没启动时，每个文件都在 before hook 里失败，报出来的是 `hookFailed` +
`ECONNREFUSED` —— 看不出是环境没就绪还是代码坏了，而这两者的处置完全相反。

**这次真的被它误导过**：跑 `test:db` 看到 5 个 `hookFailed`，第一反应是代码坏了，
实际只是 MySQL 服务没起。查下去才发现重启还带出了第二个问题：
全局变量 `innodb_ft_server_stopword_table` 回到空，而停用词表是**创建索引时**绑定的 ——
于是 Git / Figma / KiCad 这类最常见的工具名会搜不到 0 条。

**新增 `tests/_mysql-skip.mjs`**：真的去连一次，连不上就整组跳过，并把「哪个地址、
什么错误码、怎么修」写进跳过原因。口令不进提示（只取 host:port）。

```
# SKIP MYSQL_TEST_URL 指向的数据库连不上（127.0.0.1:3307，ECONNREFUSED）：
connect ECONNREFUSED 127.0.0.1:3307；跳过SQL 读路径一致性测试。
若是本地隔离实例，先按 docs/MySQL 迁移计划.md 第八章启动它。
```

代价是每组多一次连接往返（本地 1~2ms），换来「红」与「环境没起」永远能区分开。

**顺带说明两道闸门都在按预期工作**：search-sql 的硬断言抓出了配置回退并指出后果；
`db:reindex` 按设计拒绝执行并给出修复步骤，而不是默默重建一个错误的索引。

**验证**：test:db 48/48（在线 0 跳过）· 离线时全部转为带原因的 SKIP ·
check 230 项 0 失败。

## 2026-10-09 · 界面交互与流畅度 + 项目 Wiki（main）

**界面**。三处基于实机验证的改动：

- **筛选面板pending 时点不动**：原先在 `isPending` 时把整个 `fieldset` 设 `disabled`，
  而服务端重算要几百毫秒（2 万条时聚合约 318ms），这段时间用户连点第二个条件都点不动，
  界面也不给任何解释。改为不阻塞交互，只做视觉提示。
- **勾选改为乐观更新**：受控 checkbox 的 `checked` 来自 URL，服务端返回前界面纹丝不动，
  像没点上。清理用「外壳 + `key={URL签名}`」而不是 `useEffect` 里 setState ——
  后者多渲染一轮且被 lint 拦，还顺手覆盖了浏览器前进/后退的情况。
- **切换用骨架替换「变淡」**：原先只把列表降到 opacity-60，但旧内容还留在原地等着被抽走。
  项目里 `ui/skeleton.tsx` 早已存在却从未被使用。
- **详情页补 `loading.tsx`**：从目录点进详情是最高频跳转，此前是完全空白的屏幕。
- **试过又撤回 `app/loading.tsx`**：`loading.js` 把整个 `page.js` 包进 Suspense，
  实测首页在有完整内容时也渲染了 51 个骨架元素，与局部骨架冲突。

**Wiki**。新增 `docs/wiki/` 八页，按「要改某类东西该看哪里」组织 ——
与 `docs/项目索引.md` 互补：前者回答「代码在哪」，后者回答「这块怎么设计的、动它注意什么」。
基于 graphify 对 1361 节点 / 3650 边的图谱实测生成。

**验证**：check 230 项 0 失败 · build 24 路由全过 · `test:db` 48/48 · eslint 与 tsc 无告警。

## 2026-10-07 · P11 收尾：默认驱动翻成 mysql（已合入 main）

计划里 P11 主体（规模闸门 + 全表扫描修复）早已标✅，但 `lib/store.ts` 的注释留了一句待办：
「P11 会把默认值翻成 mysql 并删掉 JSON 分支」。这轮做的是**第一步：翻默认值**。

**为什么翻**：`STORE_DRIVER === "mysql"` 意味着**忘了配就静默退回JSON**。
而 JSON 路径的代价（每次请求整目录读进内存、每次保存重写整目录）正是这次迁移要消除的东西 ——
忘了配就悄悄跑在一个为回滚保留的实现上，**这类错比启动失败难发现得多**。
启动失败会有人看见，静默降级不会。判定改成 `!== "json"`：没配就是 mysql，回滚要显式写。

**与原计划不同：JSON 实现保留，不删。** 它是迁移出问题时唯一的回滚路径，也是
`tests/admin-actions.test.mjs` 的隔离手段（该测试显式设 `STORE_DRIVER=json`，
否则开发者环境里的 mysql 会把它变成集成测试）。删掉就没有回头路，且双路径一致性闸门
（`catalog-sql.test.mjs`）会失去对照物 —— 那个测试的价值恰恰在于「两条路径并存、必须可互换」。

**两处门面的判定必须一致**（`store.ts` 与 `catalog.ts`）：store 走 json 而 catalog 走 SQL，
会让写入与读取落在两份数据上 —— 那是静默的数据分裂，不是配置错误。已在注释里点明。

**验证比「测试全绿」多做一步**：`admin-actions.test.mjs` 自己就设了 json，
所以测试全绿**不足以**证明默认路径真的连库。补了实机验证：删掉 `STORE_DRIVER` 后
直接调 SQL 实现读到真实条目数。`npm run check` 230 项（187 过 / 43 跳过 / 0 失败）·
`npm run test:db` 48/48。

## 2026-10-07 · .mjs 语法闸门改用 tsc，脱离对 spawn 的依赖（分支 bunny）

提交前跑全量校验，发现 `tests/script-syntax.test.mjs` 失败。查下去不是脚本里有TS 语法
（`node --check` 逐个文件都过），而是**这个闸门在本机根本无法运行**。

**根因**：它用 `execFileSync(process.execPath, ["--check", file])` 逐文件起子进程。
而本机**任何** spawn 都返回 `EBUSY` —— 不只是 node，`cmd /c echo hi` 也一样。
沙箱内外、系统 node 与托管 node，全都复现。

于是这个闸门有两重问题：在spawn 受限的环境里**永远红**，而「一直红」的闸门
等于没有闸门 —— 它看起来在保护 `.mjs`，实际只是在制造噪声。真出现语法错误时，
没人会当回事。

**换判据，不换意图**：改用 TypeScript 编译器的语法诊断（`createProgram` +
`getSyntacticDiagnostics`）。理由是它和 `node --check` 用的是同一套解析器
（V8 之前的那层），但纯进程内、不起子进程、没有环境依赖。实测三类 TS 语法
（`as`断言、`: Type` 标注、`import { type X }`）全部检出，正常文件零误报。

**验证闸门本身有效**：往`scripts/user-manage.mjs` 注入三种 TS 语法，
确认三个诊断都报出来 —— 否则很容易写出一个永远绿的测试，那比没有测试更坏。

顺带补一个覆盖面断言。扫描逻辑坏掉时最危险的表现是「扫到 0 个文件，全绿」，
所以钉住几个必须扫到的文件。

**改动**：`tests/script-syntax.test.mjs`（判据换tsc，新增覆盖面断言）。
**验证**：`npm run check` 230 项（187 过 / 43 跳过 / 0 失败）· `npm run test:db` 48/48。

## 2026-10-07 · MySQL P10d：种子不导出，改为把漂移检查做严（分支 bunny）

计划里 P10 写着「种子降级为导出产物」。动手前先判断可行性，结论是**不该做**：

`SeedSoftware` 有 `officialLabel` 与 `officialUrl`，而运行库（`Software`）里**没有对应字段**。从数据库反向生成种子会静默丢掉它们 —— **那比「两个落点」更糟**。所以种子保持「人手维护的内容源 + 全新部署的引导数据」的定位，与数据库并存。

**改做的事：把漂移检查从「手写清单」变成「有契约的登记表」。**

这个坑本项目踩过三次 —— 漂移检查与同步脚本各有一份手写字段清单，新增可透传字段却漏登记，检查就对它**永远「相等」**：不报错、不警告，只是从此看不见那个字段。guide 就是这么漏掉的（漂移说 0 不一致，同步却每轮重写 55 条）。

- `lib/seed.ts` 新增 `SEED_CARRIED_FIELDS` / `SEED_DRIFT_EXCLUDED` / `SEED_DRIFT_FIELDS` / `SEED_SYNC_FIELDS`，两个脚本不再各写一份
- `tests/seed-contract.test.mjs` 钉住四条不变量：名字必须真的是 `Software` 的键（**写错名字和漏登记一样致命**）、CARRIED = DRIFT ∪ EXCLUDED、SYNC ⊆ DRIFT、每个登记字段实际能被 `seedToItem` 带过去

**检查强度**：比对字段从 13 个扩到 **24 个**。展开后先冒出 **23 条假漂移** —— 全部是「缺省 vs 显式空值」（`featured` 缺省 vs `false`）与 `guide` 未归一化（漂移比原始值、同步写归一化后的值）。两处都修掉后：**0 条真实差异**。

**顺带补上 `.mjs` 语法闸门**：`tests/script-syntax.test.mjs` 用 `node --check` 扫全仓 `.mjs`。`.mjs` 不做类型擦除，本项目在脚本里连踩**四次** TS 语法（`as Role`、`: UserRecord`、`import { type X }`），每次都是运行到才发现。**用语法检查而不是正则**——正则会把字符串里的 `as Foo` 误判成类型断言。

**验证**：`npm run check` 通过（新增 4 个测试）· `seed:drift` 24 字段 0 不一致 · `seed:sync --dry-run` 报「已是最新」。

## 2026-10-07 · MySQL P9：最小权限三账号，「API 是唯一写者」落成授权（分支 bunny）

`ashare_app` 原来对 `ashare.*` 是 **ALL PRIVILEGES —— 含 DROP / ALTER / CREATE**。一个只做 CRUD 的应用握着删表权限，等于把「改结构」与「改数据」的边界抹掉了：任何一次注入或代码事故的后果都从「改错数据」升级成「删库」。本轮把它拆开。

**三个账号**

| 账号 | 权限 | 谁用 |
|---|---|---|
| `ashare_app` | SELECT / INSERT / UPDATE / DELETE | 应用运行时，**不含任何 DDL** |
| `ashare_migrate` | ALL（DDL） | 只有 `db:migrate` / `db:reindex` |
| `ashare_ro` | 只读**已发布目录的 5 个视图** | 其他服务与报表 |

**只读账号刻意只授视图，不授基础表**：库级 SELECT 会让它看到 `users.password_hash`、`submissions`/`feedback` 里的用户内容、`audit_log`。视图用 `SQL SECURITY DEFINER`，只授视图就够，顺带把 `search_text`/`row_version` 这类内部列挡在外面。

**可验证，不是「配了就算」**：`npm run db:grants` 末尾把边界当断言跑，`tests/grants.test.mjs` 再钉进 `npm run test:db` —— 权限「配好了」和「还在」是两件事，下一次手动 GRANT 就可能悄悄放宽，而且不会有任何报错。

**实测**：应用账号对真实库 INSERT/SELECT/UPDATE/DELETE 全部可用 · 实机首页 / 搜索 / 详情 / 场景 / 站点地图 / 后台登录页全 200 · `db:reindex` 用迁移账号跑通真实 DDL · 应用 DROP/CREATE 与只读读 `users` 均被拒。

**顺带的坑**：降权后 `db:migrate` 会以 `command denied` 失败 —— 这是**预期**，已在 `lib/db.ts` 加 `migrationConnectionOptions()` 走 `MYSQL_MIGRATE_URL`。建视图的语句还必须带默认库，否则报 `No database selected`（报在 CREATE VIEW 上，容易误判成权限问题）。

**验证**：`npm run test:db` 48/48 · `npm run check` 221 项 · `npx eslint` 无告警 · `npx tsc --noEmit` 通过。

## 2026-10-07 · MySQL P11：规模验证，并查出列表查询一直是全表扫描（分支 bunny）

整个迁移的理由是「条目会几何式增长」，但**在此之前没有任何数字证明设计撑得住**。这轮把它测出来做成可重复的闸门 —— 结果闸门否掉了一个设计断言。

**新增闸门**：`npm run scale:check`（`--items N`，默认 5000）。往隔离库 `ashare_scale` 灌合成数据，测代表性查询，并**用 EXPLAIN 断言走索引**。

**查出的真问题**：默认排序的查询是全表扫描。`0001` 的 `idx_items_status_sort (status, sort_index, id)` 只覆盖 `WHERE(status)`，而默认排序是 `featured DESC, sort_index ASC, id ASC` —— 优化器既没法用它排序，就干脆扫表：`type=ALL / rows=5001 / key=(无)`。

**而这件事只看耗时发现不了**：5,000 条时全表扫描只要 14ms，比索引扫描还快。**规模闸门必须断言查询计划，不能只断言耗时。**

修法：`0005_list-indexes.sql` 按 ORDER BY 的列序与方向补三条复合索引（`featured` 是 DESC，用 MySQL 8 降序索引），删掉被完全覆盖的旧索引；场景/平台筛选从逐行 `EXISTS` 改成 `IN(子查询)` 走半连接；`catalogCounts` 加 30 秒 TTL 缓存（挂在根布局上，2 万条时原始聚合 387ms）。

**2 万条实测**：首页列表 16.7 → **13.6ms** · 深分页 47.9 → **36.2ms** · 单条写入 25.3 → 17.8ms · 列表计划 `type=ALL key=(无)` → `type=ref key=idx_items_status_featured`。

**最想要的性质成立**：详情单条从 5,000 到 20,000 几乎不变（4.2 → 5.5 ms）—— 按条读取是真正的 O(1)。

**如实记录未修的**：场景筛选 2 万条时 82ms。`item_scenes` 已有正确的覆盖索引，这是「筛出约 1,800 条再排序取前 60」的固有成本，不是缺索引。

**也刻意不设绝对耗时阈值**：阈值随机器变，容易变成假保证。改成断言查询计划与「按条读取保持平坦」。

**验证**：`npm run check` 221 项（182 过 / 40 跳过 / 0 失败）· `npm run test:db` 45/45（含新增的列表索引断言）· `npx tsc --noEmit` 通过 · 2 万条闸门通过。

## 2026-10-07 · MySQL P10c：数据库备份，并做了一次还原演练（分支 bunny）

数据都进库之后，「备份还只备文件」是风险最高的一件事 —— 文件快照恢复不了站点。本轮补上。

**改了什么**

- `scripts/backup.mjs` 增加 MySQL 导出到快照的 `db/ashare.sql`（`--single-transaction`，InnoDB 下不锁表，备份期间站点照常读写），manifest 记字节数与 SHA-256。
- **口令走 0600 的 `--defaults-extra-file`，绝不上命令行**（`-p<口令>` 会留在进程列表里），用完立即删。
- **导出失败让整个备份失败** —— 一份「看起来成功了」但没有库的快照，比没有备份更危险。
- 未配置 `MYSQL_URL` 时明确告警「本次没有备份数据库」；备份源也不再强求文件，只有数据库也能备。
- `npm run backup` 补上 `--env-file-if-exists=.env.local`（否则看不到 `MYSQL_URL`，会静默跳过导出）。

**只验证「生成了文件」不够，所以做了还原演练**：把 dump 导进临时库 `ashare_restore_check`，逐表比对 —— items 55/55、item_tags 199/199、item_links 94/94、clicks 73/73、schema_migrations 4/4。中文完好；**FULLTEXT 正确重建**：`MATCH AGAINST('+git')` 在还原库里同样返回 2 条。

**验证**：`npm run backup` 产出 dump（430 KiB）+ manifest 含 SHA-256 + 临时凭据文件已删 · 还原演练逐表一致 · `npm run check` 221 项（182 过 / 39 跳过 / 0 失败）。

**仍未做（P10d）**：种子降级为导出产物。

## 2026-10-07 · MySQL P10b：最后三个 JSON 落点改完（分支 bunny）

接上一轮，把仍在写 `data/store/catalog.json` 的脚本全部改到数据库。**现在没有任何脚本会写那份冻结的快照。**

**改了什么**

- `seed-sync`：读 `readCatalog()`、写 `persistCatalog(prune:false)` 单事务。
- `ingest-item.mjs`（收录脚本）：读库 + 逐条原子写。**语义变化**：从「一次写全量」变成「逐条写」；校验仍在写入之前全部完成，所以不会写一半才发现数据不合法。
- **退役 `seed-guides`**：一次性回填脚本，guide 早已补齐，库模式下它无事可做。

**顺带修掉「两个脚本互相甩锅」——比看起来严重**。

`seed:sync --dry-run` 报 3 条待同步（dbeaver / texstudio / freecad），而 `seed:drift` 说 0 不一致。根因是**对象键顺序**：DB 往返会重排 `links` 的键（`diskSha256`/`diskFile` 先后不同），直接 `JSON.stringify` 比对就判定「有变化」。

修掉 `links` 之后又冒出一条：**补 guide 55 条** —— 全部条目。同样原因：DB 往返把 `guide` 的键排成 `resources/intro/markdown`，而种子是 `intro/markdown/resources`。

两次都不是「误报一下就算了」：它们让 `seed:sync` **每轮重写 55 条**，完全不幂等。而 `seed:drift` 的 COMPARE 清单里根本没有 `guide`，所以漂移检查看不见这件事 —— 正是脚本注释里写的「两个脚本互相甩锅」。现在两处比对都改成递归按键排序，`seed:sync --dry-run` 报「运行库已是最新（55 条）」。

**验证**：`npx eslint scripts .workbuddy` 无告警 · `npm run check` 221 项（182 过 / 39 跳过 / 0 失败）· `seed:drift` 0 不一致 · `seed:sync --dry-run` 幂等 · `content:audit` 走库返回 55 条。

**仍未做（P10c）**：`backup.mjs` 的 `mysqldump`、种子降级为导出产物。

## 2026-10-07 · MySQL P10：脚本读路径改指向数据库（部分完成，分支 bunny）

P4 之后应用只写 MySQL，但脚本还在读 `data/store/catalog.json` —— 那份文件已经冻结。于是 `content:audit` / `stale-links` 报的是历史数字，而「脚本跑得好好的」，这类错最难发现。本轮把读路径掰过来。

**改了什么**

- `scripts/_shared.mjs` 的 `readCatalog`：**有 `MYSQL_URL` 就读库**，否则回落 JSON 并**明确告警**。一处改动覆盖 `content-audit` / `stale-links` / `check-links` / `smoke-detail`。
- `seed-drift` 改为种子 vs **运行库**；`stale-links --update` 改为**写库**（`--source seed` 时拒绝回写 —— 种子在 git 里，巡检不该改它）。
- **退役 `db-verify`**：它的职责是 P3/P4 的一次性 JSON↔DB 闸门；JSON 已冻结，继续比对必然假红。持续闸门交给 `seed:drift`。
- `seed:sync` / `seed:guides` 在 DB 模式下**直接拒绝**，免得「跑得很成功」却写进一份没人读的文件。

**两个坑，都写进了计划文档第七章**：

1. **老脚本都不加载 `.env.local`** —— 加了 DB 分支后它们仍然走 JSON，因为看不到 `MYSQL_URL`。已给六个 DB 相关脚本补上 `--env-file-if-exists=.env.local`。
2. **`stale-links --update` 不能顺手改 `updated_at`** —— 核验外链不是内容更新，改了会让条目虚假地跳到「最近更新」排序顶部。

**顺带修掉漂移检查自身的假阳性**：`seed-drift` 用 `JSON.stringify` 直接比对象，DB 往返把 `links` 的键重排（`diskSha256`/`diskFile` 先后不同）就报「不一致」。**一个会误报的漂移检测比没有更糟 —— 它会训练人忽略它。** 改成递归按键排序后比对。

**验证**：`npm run check` 221 项（182 过 / 39 跳过 / 0 失败）· `seed:drift` 读库 · `content:audit` 走库返回 55 条 · `stale-links` 读库。

**仍未做（P10b）**：`seed:sync` / `seed:guides` 的库版本、技能脚本 `ingest-item.mjs`、`backup.mjs` 的 `mysqldump`、种子降级为导出产物。

## 2026-10-07 · MySQL P8：媒体存储抽象，并修掉一个既有的防盗链缺口（分支 bunny）

图片一直写在 `public/media/`。单进程 + 持久磁盘时没问题，但多副本一上来，「请求落到哪台机器」就决定了图片 404 不 404 —— 这是横向扩容剩下的最后一块硬骨头。动手时顺带发现了一个**一直存在**的安全缺口。

**改了什么**

- `lib/media-storage.ts`：存储抽象，`MEDIA_DRIVER=local | s3`。上传、读取、删除三处全部改走它。
- `lib/s3.ts`：手写 SigV4 + fetch 的最小 S3 客户端（PUT / HEAD / GET / DELETE）。不引入 AWS SDK —— 与自研 markdown 解析器、自写迁移器同一个取舍。
- `/media` 路由改为从存储驱动读；防盗链仍在读取之前判定。
- `npm run media:check`：对真实 bucket 的冒烟，验证 PUT/HEAD/GET/DELETE 与字节往返。

**顺带修掉的既有缺口**：`public/media/**` 会被 `next start` **当静态文件直送**，`app/media/[...path]/route.ts` 根本不执行 —— 所以 `/media` 的防盗链**一直是无效的**。实测（生产模式、跨站 Referer）响应头是 next 的静态默认：`cache-control: public, max-age=0`、带 `last-modified`，没有 `immutable`，也没有 403。

修法：本地媒体根从 `public/media/` 移到 `data/media/`，让每个 `/media` 请求都必须过路由处理器。修完实测：**跨站 Referer 403 + no-store、无 Referer 200 + immutable、非法文件名 404**。（`/icons` 从来没问题，它在 `data/icons`。）

**一件必须说清的事**：`tests/s3.test.mjs` 验证的是 SigV4 最容易错的一步 —— **规范化与签名串**（逐字符字面量断言），加上请求形态（假端点往返）。**没有对着真实 bucket 签过**：region、path-style、STS token、bucket 策略这类环境差异只有真机能暴露。所以 S3 驱动是 opt-in，启用前必须跑 `media:check`。

**验证**：`tests/s3.test.mjs` 7/7 · `npm run test:db` 44/44 · `npm run check` 221 项（182 过 / 39 跳过 / 0 失败）· `npm run build` 通过 · 实机防盗链四项符合预期。

**兼容**：`data/media` 是新落点，`public/media` 保留在备份源里，存量部署把目录搬过去即可（`npm run backup` 两个落点都会备）。

## 2026-10-07 · MySQL P7：多用户账号与权限（分支 bunny）

单口令后台只能一个人用。本轮把账号、角色、审核流转补上，并让审计记到真人。

**改了什么**

- `users` 表（`0004_users.sql`）：口令仍只存 scrypt 哈希，`role` 两档，`disabled` 立即生效。
- **权限矩阵集中在 `lib/users.ts`**：`admin` 全权；`editor` 只能 `edit` / `moderate`。判断散在各个入口最容易出现「新加了入口忘了加检查」，所以只留一处。
- **会话带身份**：令牌是 `过期时间.角色.base64url(用户名).签名`，篡改任一字段都失效；**每个请求回查账号表** —— 停用与降权立即生效，而不是等 8 小时会话过期。
- **草稿→审核→发布**：`PublishStatus` 增加 `review`。`canSetStatus(role, from, to)` 带「从哪来」，否则编辑可以把已发布的条目拉回草稿。
- 后台三个写入口改用 `requirePermission`；审计的 `actor` 从写死的 `admin` 换成真实账号。
- `npm run user` 命令行管账号，口令一律交互式隐藏输入。

**引导模式**：账号表为空时 `ADMIN_PASSWORD_HASH` 仍可登录（签发 `env-admin`）。没有它，新部署在建出第一个账号之前根本进不去后台。

**三个踩到的坑（都写进了计划文档第七章）**：

1. **`.mjs` 不做类型擦除** —— CLI 里写了 `as Role`、`: UserRecord`、`import { type Role }`，连踩三次，且都是**运行时**才报 SyntaxError（`npm run check` 不覆盖 `scripts/*.mjs`）。
2. **`app/admin/actions.ts` 是 CRLF 行尾** —— 多行字符串替换会静默失配（单行能中、多行不中）。跨行替换必须按文件实际行尾归一化。
3. **状态流转必须带「从哪来」** —— 只看目标状态会让编辑把已发布的撤下来。

**验证**：`tests/users.test.mjs` 5/5 · `tests/security.test.mjs` 会话身份与四类篡改 · `npm run test:db` 44/44 · `npm run check` 214 项（175 过 / 39 跳过 / 0 失败）· `npm run build` 通过 · 实机：登录页含账号与口令字段、未登录 `/admin` 307、公开页不受影响。

**未做**：后台 `/admin/users` 管理界面与 `item_revisions` —— 列为 P7b，目前用命令行管账号。

## 2026-10-07 · MySQL P6：写路径彻底改写（分支 bunny）

读写两条路之前都还是「整表读改写」。P5 解决了读，本轮解决写 —— 这是多用户并发下最后一个正确性缺口。

**改了什么**

- 后台的保存 / 状态 / 删除改走 `lib/store-sql.ts` 的单条原子写：只碰一行加它的子行，不再重写整张表。
- **乐观锁**：编辑表单带上 `row_version`，落库时写进 `WHERE` 条件。不一致就返回 `conflict`，页面提示「刚被别人改过，请刷新后重试」，**不覆盖别人的改动**。
- **改名原子化**：同一事务里先改 slug 再更新字段。从前若写成「先删后插」，中途失败就直接丢条目 —— 现在目标被占用时返回 `conflict`，源条目保持不动。
- **审计**：新表 `audit_log`，记录操作人、动作、slug、字段级 diff 与前后版本号。

**踩到两个并发坑，都写进了计划文档第七章**：

1. **对「不存在」的行做 `SELECT ... FOR UPDATE` 会取间隙锁** —— 两个并发新建直接死锁。改成 `UPDATE ... WHERE slug = ? AND row_version = ?`：乐观检查就是这条语句本身，不需要先锁行。
2. **并发 INSERT 仍会死锁**（间隙锁 + 全文索引辅助表锁）。死锁是瞬态错误、InnoDB 已回滚，官方解法是有界重试 —— 新增 `withWriteTransaction`，对 `ER_LOCK_DEADLOCK` / `ER_LOCK_WAIT_TIMEOUT` 重试 3 次。测试日志里能看到它真的触发过。

**闸门里最有价值的一条**：断言「保存条目 A 之后，条目 B 的 `row_version` 与 `updated_at` 完全不变」。这正是替换掉整表写的证据 —— 从前每次保存都会重写所有行。

**顺带**：报告行号又漂了 6 处（`lib/store-json.ts` 与后台两个文件的改动），已同步 EXPECT 表与报告正文；`tests/db.test.mjs` 的迁移清单与表清单也补上了 0003。

**验证**：`tests/write-path.test.mjs` 10/10 · `npm run test:db` 39/39（串行）· `npm run db:verify` 0 差异 · `npm run check` 209 项（171 过 / 38 跳过 / 0 失败）· `npm run build` 通过。

**移入 P7**：草稿→审核→发布工作流。审核只有配上角色才有意义，单独做只是多一个状态位。

## 2026-10-07 · MySQL P5b：搜索下推，并修掉一个致命的召回缺陷（分支 bunny）

搜索是最后一条还在全量加载的读路径。原本只打算简单下推，结果被闸门拦下，牵出一个会让**最常见工具名搜不到**的配置问题。

**改了什么**

- `lib/catalog-sql.ts` 新增 `searchCatalog`：FULLTEXT + ngram 选候选；短于 2 字的词走 `LIKE` 兜底（ngram_token_size=2 下 FULLTEXT 对单字必然为空）；布尔模式操作符与 LIKE 通配符都做了净化；排序为「名称命中档 → 全文相关度 → 目录顺序」。
- `lib/catalog.ts` 增 `searchCatalog` 门面，`app/search/page.tsx` 接上分页。

**闸门抓住的缺陷**：用 `search_text` 的包含口径当预言机比对，搜 `git` 期望 2 条、实际 0 条。查下去发现 InnoDB 默认停用词表里有**单字母** `a` 与 `i`，而 ngram 会丢弃**包含**停用词的 token。受控实验（`ft_probe` 表）看得很清楚：

| 输入 | 留下的 token | 为什么 |
|---|---|---|
| `gimp` | `mp` | gi 含 i、im 含 i |
| `git` | 无 | gi 含 i，it 本身是停用词 |
| `code` | `co` `od` | de 本身是停用词 |

**后果**：搜 Git / Figma / KiCad / Inkscape 全部 0 条。这不是边缘情况，是目录里最常见的工具名。

**修法**：空表 `ft_stopwords` + `innodb_ft_server_stopword_table` 指向它 + `npm run db:reindex` 重建索引。新增 `scripts/db-reindex.mjs`，配置不对时**拒绝执行** —— 默认停用词表会让这些词静默搜不到，这必须是响亮的失败。配置检查同时进了 `tests/search-sql.test.mjs`。

**另一个关键事实**：停用词表是在**创建全文索引时绑定**的 —— 改完变量再往旧索引插数据，token 仍按旧表生成。所以必须重建索引，测试库也必须整库重建。这条写进了计划文档第七章。

**顺带修掉/发现的**：迁移文件名只允许 `[a-z0-9-]`，`0002_search_stopwords.sql` 的下划线会被**静默忽略**（migrate 只报「共 1 个迁移文件」）；三个数据库测试文件共用同一个测试库，并行会互相踩，`npm run test:db` 改为 `--test-concurrency=1` 串行跑全部四个。

**验证**：`tests/search-sql.test.mjs` 8/8（30+ 查询，含含 a/i 的名称、单字、纯符号）· `npm run test:db` 29/29 · `npm run db:verify` 0 差异 · `npm run check` 199 项（170 过 / 29 跳过 / 0 失败）· 生产构建实机：`git` 2 · `figma` 1 · `kicad` 1 · `inkscape` 1 · `python` 4 · `图像` 2 · `图` 10 · 不存在的词走空态。

**已知差异（刻意）**：SQL 搜索的字段是 `search_text`（名称 / 中文名 / 别名 / 标签 / 简介），不含长正文；内存实现还会扫 `body` / `whoFor` / `whoNot`。这是「不把 5 万字正文塞进全文索引」换来的取舍。

## 2026-10-07 · MySQL P5：读路径下推（分支 bunny）

P4 把存储换成了 MySQL，但**读法没变** —— 每次请求仍把整份目录读进内存再过滤。按 8.2 KB/条算，5,500 条时每个请求要吞 45 MB、每次保存要重写 45 MB。本轮把筛选、排序、计数、分页全部下推。

**改了什么**

- `lib/catalog-sql.ts`（新）：**列表只做窄投影**（卡片 14 个字段，不读 `body` / `guide`）；**子行按 `IN (?)` 收窄** —— 详情页只取一条，就不再整表读子表。
- `lib/catalog.ts` 变成驱动门面：SQL 路径下推，JSON 路径在内存里做等价的事。两条路径可互换，回滚路径仍然可用。
- 计数下推成聚合查询 —— 根布局每页都要用它，是全站最热的读。
- 首页分页（默认每页 60，`CATALOG_PAGE_SIZE` 可调）；**超过一页才渲染分页控件**，所以 55 条时界面与从前一模一样。
- 站点地图改读窄投影（只取 slug 与更新时间）。

**闸门：SQL 与内存实现逐字段一致。** `tests/catalog-sql.test.mjs` 拿种子的 55 条，对 13 种筛选组合 × 全部分页做逐字段比对，外加计数、精选、详情、替代品顺序、场景、窄投影、越界分页。这是本轮最有价值的一条 —— 只要回滚路径还在，两条路径就必须可互换。

**踩到四个坑，都写进了计划文档第七章**：

1. **Next 16 的 `generateSitemaps` 不提供 `/sitemap.xml`**，只生成 `/sitemap/[id].xml`；而 `robots.txt` 指向 `/sitemap.xml` —— 实测生产环境下该地址 404。先试了 `force-dynamic` 与 `revalidate`，都不是原因；最后删掉 `app/sitemap.ts`，自己写 `app/sitemap.xml/route.ts`（少则一张 urlset，多则索引）+ `app/sitemaps/[id]/route.ts`。顺带发现 `app/sitemap.ts` 与 `app/sitemap.xml/route.ts` 会直接冲突（`Conflicting route and metadata`）。
2. **静态化会让 sitemap 变空**：`revalidate` 那次构建时没有 `NEXT_PUBLIC_SITE_URL`，产物里 0 条 URL。所以两条路由都保持 `force-dynamic`。
3. **`toCatalogItem` 总是带上可选键**（值可能 `undefined`），窄投影必须逐字对齐，否则 `deepStrictEqual` 会因「键存在但为 undefined」判不等。同理 `featured: false` 与「没有 featured」在库里都归一成 0。
4. **`sort=name` 两个驱动不完全等价**：SQL 用 `utf8mb4_0900_ai_ci`，JSON 路径用 `Intl.Collator("zh-CN", { numeric: true })`，差异只在含数字的名称。要完全一致得另加排序键列。

**验证**：`tests/catalog-sql.test.mjs` 9/9 · `tests/sitemap.test.mjs` 6/6 · `npm run db:verify` 0 差异 · `npm run check` 191 项（170 过 / 21 跳过 / 0 失败）· 生产构建下 `/sitemap.xml` 200（71 条 URL）、首页 software 链接从 55 降到 15、`?page=2` 与第 1 页无重叠、详情/搜索/场景全 200、`/admin/clicks` 307。

**未完成**：`app/search/page.tsx` 仍在内存里全量打分。FULLTEXT + ngram 下推、单字 `LIKE` 兜底、结果分页留给 P5b。

## 2026-10-07 · MySQL P4：应用切到数据库（分支 bunny）

P3 证明「库里和线上一致」，本轮把应用真的切过去。

**结构**：`lib/store.ts` 变成按 `STORE_DRIVER` 转发的门面，**导出签名一字未改** —— 图谱证实它是唯一收口点，所以 20 个调用点一行未动。实现分到 `lib/store-json.ts`（迁移前的原实现）与 `lib/store-sql.ts`。目录读写又抽了一层 `lib/catalog-persist.ts`，让 ETL、`db:verify`、应用共用同一份 —— 连同名 SQL 都不该有两份。

**`STORE_DRIVER` 默认仍是 `json`**，`.env.local` 里显式设 `mysql`。理由不是保守：`npm test` 不加载 `.env.local`，`tests/admin-actions.test.mjs` 靠 `chdir` 到临时目录里的 JSON 文件做隔离；默认 mysql 会让「没有数据库的 CI」被迫连库。该测试现在也自己锁定驱动，不依赖环境。

**并发语义换了实现**：JSON 靠进程内文件队列串行，多进程下失效 —— 这正是迁移原因之一。SQL 侧改用 MySQL 命名锁（`GET_LOCK`）跨进程串行整表读改写。`tests/store-sql.test.mjs` 里有并发用例：两个 `updateCatalog` 同时跑，两个条目都得留下。P6 换成单条原子更新 + 乐观锁后撤掉这把大锁。

**契约测试打独立库**：`saveCatalog` 是整表镜像语义，跑在开发库上会把这 55 条清空。新建 `ashare_test` 库，用 `MYSQL_TEST_URL` 指向它，没设就整组跳过（CI 因此不红）。

**实机验证 + 直连证明**：五个页面全部 200，首页显示收录 55 款。更有力的一条是：**直接改库里 `vscode` 的 `name`，页面立刻跟着变；还原后页面同时还原** —— 排除了「悄悄回退到 JSON」的可能。

**两个新踩到的坑**：ESLint 的 `react-hooks/rules-of-hooks` 把 `useMysql()` 当成 React Hook，一次报 11 处错，已改名 `mysqlDriver()`；`lib/catalog-persist.ts` 里的相对导入必须带 `.ts` 后缀，否则 Node 跑脚本时解析不到。

**验证**：`npm run test:store` 7/7 · `npm run db:verify` 重构后仍 0 差异 · `npm run check` 176 项（164 过 / 12 跳过 / 0 失败）· 实机五页 200 · 直连改库页面同步变化。

**回滚方式**：`STORE_DRIVER=json` 即回到本机 JSON，无需回滚代码。

## 2026-10-07 · MySQL P3：ETL 与逐字段一致性闸门（分支 bunny）

P4 要把应用切到数据库，切之前必须先证明「数据库里的东西和现在线上跑的完全一样」。本轮就是这道闸门。

**新增**：`lib/catalog-rows.ts`（Software ↔ 数据库行的纯映射）、`lib/normalize.ts`、`scripts/db-import-json.mjs`、`scripts/db-verify.mjs`、`tests/catalog-rows.test.mjs`；`npm run db:import` / `db:verify`。

**为什么把映射写成纯函数**：ETL 导入、`db:verify` 还原、P4 的 `lib/store.ts` 三处必须共用同一份。各写一份的话，「导入的逻辑」与「读回的逻辑」会各自漂移，而漂移只有靠往返比对才发现。

**顺带抽出了 `lib/normalize.ts`**：`data/samples.ts` 的条目没有时间戳，靠 `lib/store.ts` 读时补。ETL 必须复用同一套规则，否则「导入时补了、读回时没补」只会在比对里冒出来。这次测试正是先抓到了 `yt-dlp 缺少 createdAt` 才发现的。

**@db:verify` 通过**：JSON 55 条 / DB 55 条 · **逐字段不一致 0** · 顺序一致 · 无多余条目 · clicks 73/73。

**顺带查清一个遗留字段**：`officialLabel` 是 `SeedSoftware` 的字段，不在 `Software` 契约里、应用侧无人读取，但经 `seedToItem` 的 `...rest` 泄漏进运行库（55 条里 50 条有）。ETL 丢弃它，且 `db:verify` 会显式报告「未入库字段」，不静默。根治要等 P10 收窄 `seedToItem` 的透传。

**三个新踩到的坑**（已进计划文档第七章）：mysql2 会把 JSON 列解析成对象，读回必须经 `itemRowFromDb()` 还原；`linksCheckedAt` 只精确到天，连接层设 `dateStrings: ["DATE"]` 免得漂一天；`db:verify` 里 `conn.query` 返回 `[rows, fields]`，别把 fields 也解构进来。

**行号守卫第二次拦下**：抽出 `normalize` 让 `lib/store.ts` 的 `seedCatalog` 从第 18 行移到 19 行，`npm run check` 立刻报 `lib/store.ts:18` 漂移。报告与 `verify-report-refs.mjs` 的 `EXPECT` 表已同步。

**验证**：`npm run db:import -- --dry-run` 回滚生效 · 二次导入幂等 · `npm run db:verify` 0 差异 · `tests/catalog-rows.test.mjs` 8/8 · `npm run check` 169 项（164 过 / 5 跳过 / 0 失败）。

**仍未改动任何业务代码**：`lib/store.ts` 只用到 `lib/normalize.ts`，切换是 P4 的事。

## 2026-10-07 · 接入 MySQL：P0 决策与 P1 基础设施（分支 bunny）

条目将几何式增长、要跑多进程多用户、还会有其他服务共用数据 —— 三个条件同时命中 README 自述的迁移前提。本轮只做地基，**不动任何业务代码**。

**决策（ADR 落在 `docs/MySQL 迁移计划.md`）**：MySQL 8 · 多个编辑账号（含审计）· 应用是唯一写者、其他服务走 API · FULLTEXT + ngram 做中文搜索 · 媒体最终迁对象存储 · **一次切换，不做双写**。

**为什么不做双写**：双写会造出第二个事实源，正是 `known-pitfalls` 里「两个落点」与「`--patch` 漏字段」的同一类问题。

**P1 交付**：`lib/db.ts`（连接池，刻意不带 `server-only` 以便 `.mjs` 脚本 import）、`db/migrations/0001_init.sql`（13 张表）、`scripts/db-migrate.mjs`、`next.config.ts` 外部化 `mysql2`、`.env.example` 增 `MYSQL_URL`、`tests/db.test.mjs`。

**schema 为什么不沿用「单表 + data JSON」**：那是为 55 条优化的。可筛选的多值字段（标签 / 场景 / 平台 / 替代品）拆成子表并各自建索引；`search_text` 冗余可搜文本供 FULLTEXT 使用，因为 MySQL 的 FULLTEXT 不能跨表。

**三个实测发现，都写进了计划文档第七章**：

1. **InnoDB FULLTEXT 看不到本事务刚插入的行** —— 同一事务内 `INSERT` 后 `MATCH` 查不到，提交后才命中。写入路径不能假设「写完立刻可搜」。
2. **`ngram_token_size=2` 下单字查询必然为空** —— `MATCH AGAINST('图')` 返回 0 行，中文单字搜索必须应用层 `LIKE` 兜底。这是产品级约束，不是 bug。
3. **连接池会让 Node 进程不退出** —— `node --test` 跑完会永久挂起，`tests/db.test.mjs` 用 `after()` 收尾。

**行号守卫又拦了一次**：把 `serverExternalPackages` 插在 `next.config.ts` 开头，`npm run check` 立刻报 2 处行号漂移（`docs/优化改进报告.md` 引用的 `:28` / `:30`）。改为追加到配置对象末尾，改动只增加尾部行，引用不再漂移。

**验证**：`npm run db:migrate` 连跑两次（第二次全 skip，幂等）· 13 张表齐、`items.search_text` 为 FULLTEXT · `npm run test:db` 5/5 · `npm run check` 161 项（156 过 / 5 跳过 / 0 失败）· 无 `MYSQL_URL` 时数据库测试整组跳过，`npm test` 不因缺库变红。

**本地环境**：系统服务 `MySQL84` 因权限无法启动，改用隔离实例（`%LOCALAPPDATA%\Ashare\mysql-data`，端口 3307，不注册服务、不动系统 datadir、不占默认 3306）。

**下一期**：P2 补齐面向规模的 schema，P3 做 ETL 与逐字段 `db:verify`（diff 必须为 0，否则不许切换）。

## 2026-10-04 · 补齐许可证并在详情页展示（分支 bunny）

上一轮把 35 条目录的 `license` 全部回填（18 条），但暴露两个问题：字段只存在后台表单、前台一个字都不展示；另有 10 条该补的没补。本轮处理两件事。

**回填 7 条，18 → 25**

| 条目 | SPDX | 依据 |
|---|---|---|
| audacity | `GPL-3.0` | 仓库 LICENSE.txt 原文 |
| thunderbird | `MPL-2.0` | 仓库 LICENSE 与正文第 4 段 |
| kicad | `GPL-3.0` | KiCad 官方镜像 API |
| freecad | `LGPL-2.1` | FreeCAD 仓库 API |
| dbeaver | `Apache-2.0` | DBeaver 仓库 API |
| libreoffice | `MPL-2.0 OR LGPL-3.0-or-later` | 官方许可页 |
| mineradio | `GPL-3.0` | 正文第 4 段 + 仓库 |

**LibreOffice 差点填错，值得单说**：GitHub API 报 `GPL-3.0`（它取了仓库里 COPYING 那一份），但官方许可是 **MPLv2 与 LGPLv3+ 双许可**。直接用 API 的单值会丢掉「可闭源」这个对读者最关键的信息。

**仍留空 10 条**：4 条专有（obsidian / figma / wps / geogebra 的非商业免费）本就无 SPDX 可写；另 6 条（inkscape / blender / texstudio / jasp / rstudio / zotero）仓库里没有 LICENSE 文件，查不到权威来源，按「不猜」原则留空。

**展示：新增 `lib/license-info.ts` + `components/LicenseNote.tsx`**

只给 `source === "opensource"` 显示。专有软件没有 SPDX 标识可写，非商业免费的 GeoGebra 是自家许可——给它们挂一个「未知」比不显示更糟，读者会以为是核验过但漏了。

行内不加「许可证：」前缀：天平图标已经说明了这是什么，重复一遍是噪音。

映射表把 SPDX 翻成一句人话（只回答「能不能闭源商用」），分三档：宽松（MIT/Apache/BSD）、弱 copyleft（LGPL/MPL，改动需开源但整体可闭源）、强 copyleft（GPL/AGPL，分发需开源）。AGPL 单独措辞——不是「用了就犯规」，而是「让用户联网访问」才触发义务，这两种情况必须分开说。

支持双许可 `A OR B`（取更宽松的那个）；`AND` 与 `WITH` 不推断——都需要逐个读原文才能判断，一条通用提示语会给出错误的宽松/严格结论。

**一个位置错误**

许可证行最初挂在「其他渠道」区块里，结果只有官网一条渠道的条目（VS Code / DBeaver / LibreOffice）完全不显示。**信息不该依附于「其他渠道」是否存在**，已提到页面里独立渲染。

**测试 12 项，其中一条是交叉核对**

「运行库里每条 license 都必须有对应展示文案」——这条立刻抓到两个缺口：LGPL-2.1 的简写形式没在表里、LibreOffice 的双许可无法解析。这类失配（数据正常但页面静默不显示）只有靠交叉核对才发现。

顺带修了 `tests/seed.test.mjs`：我自写的 SPDX 正则不支持 `OR`，把 LibreOffice 判成非法。改为把表达式交给 `describeLicense` 判定，不自己写正则。

**验证**：`npm run check` 125 全过（新增 12）· `npm run verify:report` 66 条引用 0 问题 · `seed:drift` 0 不一致 · 实机验证 8 个开源条目显示正确（含双许可与三档措辞）、5 个专有/未核验条目确认不显示。

## 2026-10-04 · 详情页新增「详细教程」区块（分支 bunny）

在「上手步骤」和「同类替代」之间插入详细教程，支持 Markdown 正文与 PDF / 网页 / 插图 / 链接四类配套资料。

**为什么加**：上手步骤回答「怎么开始」，但读者真正卡住的是步骤之外的具体问题 —— 某个参数怎么写、某个报错怎么处理。新增区块正好补上这一段，且不改动既有「先回答该不该用」的叙事顺序。

**Markdown 为什么自己解析**（`lib/markdown.ts`）：教程正文由后台表单录入，属于半可控输入。引三方库要拖进一整套 HTML 清洗，用 `dangerouslySetInnerHTML` 拼字符串则把清洗责任全交给正则 —— 嵌套标签、属性里的引号、转义边界，正则都覆盖不全。改为**解析成 AST 交给 React 渲染**，不解析的字符一律当纯文本，根本没有注入面。代价是只支持明确子集：标题、段落、列表、围栏代码块、引用、水平线、表格，以及行内代码 / 粗体 / 斜体 / 链接 / 图片。

**链接白名单比语法更重要**：行内链接与图片都过 `safeHref` / `safeImageSrc`，只收 https 与上传流程生成的站内 `/media/` 路径。实测 `javascript:alert(1)`、`data:text/html`、`<img onerror>`、`<iframe>` 全部降级为纯文本，不产出任何可点或可执行节点。

**踩到的两个真bug**（都是测试先发现的）：

1. 链接正则里的 `[^)]+` 会在 `javascript:alert(1)` 处提前截断，残留的 `)` 漏进正文；同时它也表达不了 URL 里合法的成对括号（维基类链接很常见）。改为按括号配平截取。
2. 未闭合的 ``` 围栏会一路读到文末，把整篇剩余内容吞进代码块——而我原来的注释恰好声称「不吞掉后面的内容」。改为遇到空行即收尾。

**顺带发现并修掉的工具链问题**：新增的 `lib/guide.ts` / `lib/markdown.ts` 之间有运行时导入，而 `node --test` 靠类型擦除直接跑 `.ts`，相对导入必须带 `.ts` 后缀才能被 Node 解析——项目里原本靠「不跨模块导入运行时值」绕开（见 `lib/click-analytics.ts` 注释）。开启 `allowImportingTsExtensions`（`noEmit` 已开，是官方支持的组合）后无需复制白名单，`npm run typecheck` 无回归。

**监控接入**：教程正文与资料里的外链一并纳入 `stale-links` 探活。核验日期是全条目共用的一个，只探 `links` 会让教程链接烂掉却始终显示「新鲜」；`content:audit` 也新增「详细教程」内容债项（权重 2）。

**验证**：`npm run check` 113 项全过（新增 `tests/guide.test.mjs` 17 项）· `npm run verify:report` 66 条引用 0 问题 · 实机 curl 确认区块顺序为「上手步骤 → 详细教程 → 同类替代」，目录 / 表格 / 代码块正常渲染、无残留 Markdown 标记 · 无教程的老条目不渲染该区块（存量数据零迁移）。

> 注：`data/software.ts` 里 LibreOffice 的 `license: "MPL-2.0 OR LGPL-3.0-or-later"` 会让 `tests/seed.test.mjs` 的 SPDX 校验失败 —— 该校验只认单个标识与 `AND`，不认合法的 `OR` 表达式。与本次改动无关，留给许可证回填的任务一并处理。

## 2026-10-04 · 修复防盗链在本地开发时全站 403（分支 bunny）

启动应用做实机验证时发现：curl 带同站 Referer 请求图标返回 403。

**根因**：`hotlinkOptionsFromEnv()` 只读 `NEXT_PUBLIC_SITE_URL`（`lib/hotlink.ts:89`），而 `.env.local` 里没配这个变量 —— `siteHost` 为空，`decideHotlink` 的同站判断（`lib/hotlink.ts:77`）直接失效。结果**本地开发时首屏所有图标都是 403**。

**为什么前几轮没发现**：那轮我是在 `SESSION_SECRET=... npm run start` 下手工构造了 `NEXT_PUBLIC_SITE_URL` 才做的六项验证，而真实开发流程是 `npm run dev` + `.env.local`。**验的环境不是实际使用的环境，等于没验。**

**修法**：新增 `requestHost()`（`lib/hotlink.ts:119-131`），拿请求自身的 host 作兜底 ——「谁在访问我」本来不需要任何配置。两个路由改为「配置缺失时用 requestHost 补上」（`app/icons/[slug]/route.ts:17-19`、`app/media/[...path]/route.ts:19-21`）。`x-forwarded-host` 只在 `TRUST_PROXY=1` 时采纳，与 `lib/guard.ts` 对 XFF 的既有约定一致。

**顺带验证**：伪装 Referer（`evilashare.example`、`ashare.example.evil.com`）仍 403；伪造 `X-Forwarded-Host` 不被采纳；同站子域名（`sub.localhost:3000`）放行（子域名本就是自己人）。

**顺带被报告防线拦住**：修完代码后 `npm run check` 报 9 处行号漂移 —— 正是上一轮建的 `verify-report-refs` 起作用。新增 `requestHost` 使 `lib/hotlink.ts` 之后 24 行全部下移（110→134、112→136、115→139…），报告与预期表已同步。这也再次说明：改了被报告引用的代码，必须同步更新行号，否则 `npm run check` 会拦。

**验证**：`npm run check` 96 全过 · `npm run verify:report` 62 条引用 0 问题 · 实机 curl 六项全部符合预期。

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
