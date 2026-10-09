# Ashare MySQL 迁移计划

> **状态**：P0–P11 全部推进完毕（P7b 的后台账号界面除外），2026-10-07，已合入 `main`。
> **依据**：调用关系来自 `.codebase-memory/graph.db` 的图谱实测（1744 节点 / 4213 边，对应 commit `ce4e3f1`），不是目录浏览推断。文中标注为「实测」的结论都可用该图谱复核。
> **需求**：条目将**几何式增长**；**多进程、多用户**；**还会有其他服务**共用这份数据。

## 一、结论：必须迁移

三个条件同时命中 README 自述的迁移前提 ——「本地 JSON 存储需要单个 Node 进程与持久磁盘……扩展到这些环境前须迁移到支持事务的数据库」。这是前置条件被满足，不是「数据库更好」。

| 触发 | 现状为何撑不住 |
|---|---|
| 几何增长 | 每次请求把整个目录读进内存；每次保存重写整个目录；种子是 TypeScript 源码 |
| 多进程 | `lib/guard.ts` 的 `SlidingWindowLimiter` 在进程内存里，限速随进程数翻倍失效；`blocks.json` 各进程各读各写 |
| 多用户 | `saveItem` 是「读全量→改一条→写全量」，两人同时编辑会互相覆盖（当前靠单进程串行掩盖） |
| 其他服务 | 只有 React Server Component 直调 `lib/store.ts`，没有稳定 API 边界；DB 也没有最小权限划分 |

### 规模推算（基于实测的 8.2 KB/条）

`data/store/catalog.json` 实测 451,526 B / 55 条 = **8.2 KB/条**（含正文与教程 Markdown）。

| 条目数 | 每次请求读入内存 | 每次保存重写 |
|---|---|---|
| 55（现在） | 0.44 MB | 0.44 MB |
| 550 | 4.5 MB | 4.5 MB |
| 5,500 | **45 MB** | **45 MB** |
| 55,000 | **451 MB** | **451 MB** |

`React cache()` 只在**单次请求内**复用，进程间不共享，所以这是每次 SSR 的真实成本。**换成 MySQL 但保留「全量加载 + 内存过滤」的读法，照样死。** 数据库只解决「存」。

另外 `data/software.ts` 现在 50 条已 412 KB；涨到 5,500 条就是 45 MB 的 `.ts`，`tsc` 与 `next build` 会比数据库更早崩。**种子必须从「源码」降级为「数据产物」。**

## 二、图谱实测的迁移边界

### 收口点：`lib/store.ts`（这决定了应用侧几乎不用改）

图谱中指向它的生产调用点只有：

| 调用方 | 函数 |
|---|---|
| `app/admin/actions.ts`（8 处：saveItem / setItemStatus / deleteItem / markFeedbackRead / deleteFeedback / deleteSubmission / unblockIp / convertSubmission） | `updateCatalog` `updateFeedback` `updateSubmissions` `getSubmissions` `updateBlocks` |
| `app/admin/page.tsx`、`app/admin/items/[id]/page.tsx` | `getCatalogAll` |
| `app/admin/inbox/page.tsx`、`app/admin/layout.tsx` | `getFeedback` `getSubmissions` `getBlocks` |
| `app/submit/actions.ts`、`app/feedback/actions.ts` | `addSubmission` `addFeedback` |
| `lib/guard.ts` | `getBlocks` `updateBlocks` |
| `lib/catalog.ts` | `getCatalogAll` |

→ **保持导出签名不变，上面 20 个调用点一行都不用改。**

### 公开读路径已收口在 `lib/catalog.ts`

消费方：`app/page.tsx`、`app/search/page.tsx`、`app/scenes/[id]/page.tsx`、`app/software/[slug]/page.tsx`、`app/sitemap.ts`、`app/layout.tsx`、`app/admin/clicks/page.tsx`、`app/feedback/page.tsx`。

### 点击路径两个消费方

`app/track/actions.ts` → `recordClick`；`app/admin/clicks/page.tsx` → `scanClicks`（再经 `lib/click-analytics.ts`）。
→ 只要 `scanClicks()` 仍返回同一个 `ClickScan` 形状，`lib/click-analytics.ts` 与后台页也零改动。

### 逃逸通道：真正的工程量

这些地方**不经过任何 lib 层**，直接读写文件：

| 文件 | 位置 | 行为 |
|---|---|---|
| `scripts/_shared.mjs` | `readCatalog()` | 被 content-audit / stale-links / check-links / smoke-detail 共用 |
| `scripts/seed-drift.mjs` | 顶部 | 读运行库比对种子 |
| `scripts/seed-sync.mjs` | 中部 | 种子写运行库 |
| `scripts/seed-guides.mjs` | 顶部 | 回填 guide |
| `scripts/stale-links.mjs` | `--update` 分支 | 回写 linksCheckedAt |
| `scripts/backup.mjs` | `SOURCES` | 复制 `data/store` + `public/media` |
| `scripts/smoke-detail.mjs` | 顶部 | 读运行库做渲染冒烟 |
| `.workbuddy/skills/ashare-curation/scripts/ingest-item.mjs` | `CATALOG` / `writeAtomic` | 收录写入 + 原子替换 + SHA-256 |
| `lib/click-store.ts` | `CLICK_FILE` | 直接 append `clicks.jsonl` |

### 共变信号（图谱 `FILE_CHANGES_WITH`）

`CHANGELOG.md ↔ README.md` 0.80 · `CHANGELOG.md ↔ data/samples.ts` 1.00 · `known-pitfalls.md ↔ CHANGELOG.md` 0.75 · `known-pitfalls.md ↔ README.md` 0.75。
→ 迁移必须**同一次提交**带上 README、CHANGELOG、本文件、`.workbuddy/skills/ashare-curation/`。

## 三、已定决策

| 议题 | 决定 | 理由 |
|---|---|---|
| 数据库 | MySQL 8（本机 8.4.8） | 内置 ngram 中文分词，无需扩展；运维最普遍 |
| 多用户语义 | 多个编辑/运营共用后台（账号 + 角色 + 审计） | 最贴合当前形态；终端用户账号不在本期 |
| 服务边界 | 应用是唯一写者，其他服务走 API | 边界最清晰，DB 只对应用开放 |
| 中文搜索 | MySQL FULLTEXT + ngram | 无需新服务；后续可平滑替换为独立引擎 |
| 媒体存储 | 对象存储 | 多副本下本地 `public/media` 不可行 |
| 切换方式 | **一次切换，不做双写** | 双写会造出第二个事实源，正是 `known-pitfalls` 里「两个落点」「`--patch` 漏字段」的同类问题 |
| ORM | 不引入 | 与「自研 markdown 子集解析器」同一取向；有序 `.sql` + 自写 runner |

## 四、目标架构

```
Next 页面 / Server Action / 脚本(.mjs)
        |
        +-- lib/store.ts        签名不变，内部改 SQL（catalog / feedback / submissions / blocks）
        +-- lib/click-store.ts  签名不变，内部改批量 INSERT + GROUP BY
        |
        +-- lib/db.ts           连接池 / query / withTransaction（不带 server-only，脚本可 import）
                 |
            mysql2/promise  ->  MySQL 8
                 |
        db/migrations/*.sql  +  scripts/db-migrate.mjs
```

`lib/db.ts` **不能**写 `import "server-only"`：`scripts/*.mjs` 要靠 Node 24 的类型擦除直接 import 它（项目已有先例：`seed-drift.mjs -> lib/seed.ts`）。也**不能**用 ``@/...`` 别名，脚本侧没有 paths 解析。

## 五、数据库设计

### 已落地：`db/migrations/0001_init.sql`（13 张表）

```
schema_migrations
items                        条目主表（单值字段 + 长文本 + search_text + row_version）
item_tags / item_scenes / item_platforms / item_alternatives   可筛选多值字段，各自建索引
item_links                   四类外链 + 镜像校验
item_previews                预览图顺序
item_guide_resources         教程配套资料
feedback / submissions       投稿与反馈（seq 保插入顺序）
ip_blocks                    IP 封禁
clicks                       出站点击
```

关键取舍：

- **否决「单表 + data JSON」**：55 条时够用，几万条时无法索引，其他服务也难消费。改为「单值字段进列、多值字段进子表」。
- **`search_text` 是冗余列**，由写入路径维护，配 `db:reindex` 重建。因为 MySQL 的 FULLTEXT 不能跨表；tags 在子表里，只能把可搜文本摊平到主表。
- **`clicks` 故意不建外键**：条目删除后必须保留历史点击（README 明确要求）。
- **`item_alternatives` 故意不建外键**：替代品可以尚未收录（`alternativesOf` 会过滤掉缺失项）。
- **`row_version` 做乐观锁**：多用户下防覆盖，`UPDATE ... WHERE row_version = ?` 冲突即 409。
- 所有时间列存 UTC `DATETIME(3)`，展示层再按 `Asia/Shanghai` 格式化。

### 后续迁移规划

| 版本 | 内容 | 归属期 |
|---|---|---|
| 0002 | `users` / `roles` / `audit_log` / `item_revisions` | P7 |
| 0003 | `clicks_daily` 日汇总（百万行后再上）+ 按月分区 | P5 |
| 0004 | `media_objects`（对象存储元数据） | P8 |
| 0005 | `ingestion_jobs`（批量收录队列） | P10 |

## 六、分期计划与闸门

| 期 | 内容 | 闸门 | 状态 |
|---|---|---|---|
| P0 | 决策 + 本文件（ADR） | 决策落地成文 | ✅ 完成 |
| P1 | `mysql2` / `0001_init.sql` / `lib/db.ts` / `scripts/db-migrate.mjs` / `next.config.ts` 外部化 / `.env.example` | migrate 幂等、13 张表齐、`npm run check` 绿 | ✅ 完成 |
| P2 | ~~面向规模的 schema 补全~~ **调整**：复核后 `0001` 已覆盖整个目录域，`0002`–`0005` 分别归属 P7 / P5 / P8 / P10，不提前建表 | —— | ✅ 合并进 P1 |
| P3 | ETL：55 条 JSON + 73 条 clicks 入 MySQL + `db:verify` 逐字段比对 | **diff = 0** | ✅ 完成 |
| P4 | `lib/store.ts` 拆成驱动门面 + `lib/store-json.ts` / `lib/store-sql.ts`；`STORE_DRIVER` 切换 | `npm run check` 全绿；**实机直连证明** | ✅ 完成 |
| P5 | 读路径：SQL 分页 / 筛选 / 计数 / 详情 / 站点地图 | **SQL 与内存实现逐字段一致** | ✅ 完成 |
| P5b | 搜索下推：FULLTEXT + ngram（含单字 `LIKE` 兜底）与结果分页 | 结果集与包含口径一致；停用词配置硬断言 | ✅ 完成 |
| P6 | 写路径：单条原子更新 + `row_version` 乐观锁 + 审计日志 | 并发编辑不丢数据；单条写不再重写整表 | ✅ 完成 |
| P7 | 多用户：`users` 表 / 角色矩阵 / 会话带身份 / 动态回查；**草稿→审核→发布**（`review` 状态 + `canSetStatus`） | 权限矩阵与账号存储有测试；编辑不能自行发布 | ✅ 完成 |
| P7b | 后台 `/admin/users` 管理界面；`item_revisions` 内容级历史 | 不靠命令行也能管账号 | 待推进 |
| P8 | 媒体存储抽象 + S3 兼容驱动（`lib/s3.ts` 手写 SigV4）；**顺带修掉 `public/media` 静态直送导致防盗链失效** | 跨站 Referer 403；本地与对象存储行为一致 | ✅ 完成 |
| P9 | 最小权限三账号（应用 DML / 迁移 DDL / 只读仅视图）+ 授权脚本与边界测试 | 应用不能 DROP；只读读不到口令哈希 | ✅ 完成 |
| P10 | 脚本读路径改指向数据库（`_shared.readCatalog`）+ `stale-links --update` 回写库 + 退役 `db:verify` | 脚本与应用看同一份数据 | ◐ 部分完成 |
| P10b | `seed-sync` / `ingest-item` 改库；退役一次性 `seed-guides` | 不再有任何脚本写冻结的 JSON | ✅ 完成 |
| P10c | `backup` 加 `mysqldump`（口令走临时 defaults 文件） | **还原演练逐表一致** | ✅ 完成 |
| P10d | **不导出**（见第七章 51 条：种子无法无损重建）；改为严格漂移 + 契约登记表 + `.mjs` 语法闸门 | 漂移检查覆盖全部 24 个透传字段且为 0 | ✅ 完成 |
| P11 | 规模验证闸门 `npm run scale:check`；**查出列表查询一直是全表扫描并修复**；默认驱动翻成 mysql | EXPLAIN 无全表扫描；2 万条下按条读取仍 O(1) | ✅ 完成 |

## 七、已实测的约束与坑（动代码前先读）

1. **InnoDB FULLTEXT 看不到本事务刚插入的行。** 实测：同一事务内 `INSERT` 后用 `MATCH ... AGAINST` 查不到，提交后才命中。写入路径与搜索路径不能假设「写完立刻可搜」。
2. **`ngram_token_size=2`，单字查询必然查不到。** `MATCH AGAINST('图')` 返回 0 行。中文单字搜索必须由应用层用 `LIKE` 兜底（或把 `ngram_token_size` 调成 1 并接受索引膨胀）。这是一条产品级约束，不是 bug。
3. **连接池会让 Node 进程不退出。** `node --test` 若开了连接池又不 `closePool()`，测试跑完会永久挂起（P1 实测踩到）。`tests/db.test.mjs` 已用 `after()` 收尾。
4. **`MODULE_TYPELESS_PACKAGE_JSON` 警告是既有的**，不是本次引入：`.mjs` 脚本 import `lib/*.ts` 时 Node 会告警并重解析。给 package.json 加 `type: module` 风险更大，保持现状。
5. **MySQL DDL 会隐式提交**，事务保护不了建表/改表。因此每个迁移都必须可重复执行（`IF NOT EXISTS` / 加列前先判断），`db-migrate` 也不把迁移包在事务里。
6. **Windows 上 `mysqld.exe` 是父子进程对**，父进程不占端口、子进程才监听。按「进程数」判断是否双实例会误判。
7. **`lib/store.ts` 的历史补齐逻辑已抽到 `lib/normalize.ts`。** 缺时间戳、单数 `preview` 这两条规则必须由应用、ETL、`db:verify` 共用一份；各写一份的话，「导入时补了、读回时没补」只会在往返比对里冒出来，极难归因。
8. **`officialLabel` 是 `SeedSoftware` 的遗留字段。** 不在 `Software` 契约里、应用侧无人读取，但会经 `seedToItem` 的 `...rest` 泄漏进运行库（55 条里 50 条有）。ETL 丢弃它，并由 `db:verify` 显式报告，不静默；根治要等 P10 收窄 `seedToItem` 的透传。
9. **mysql2 会把 JSON 列解析成对象。** `ItemRow` 用 JSON 字符串承载以便纯字符串比对，所以读回必须经 `itemRowFromDb()` 还原，否则 `fromBundle` 的 `JSON.parse` 会炸。
10. **`linksCheckedAt` 只精确到天，连接层设了 `dateStrings: ["DATE"]`。** 让它过一遍 `Date` 只平添时区漂移风险；DATETIME(3) 仍按 `Date` 返回。
11. **改 `lib/store.ts` 会触发报告行号漂移。** `docs/优化改进报告.md` 引用了它的行号，`scripts/verify-report-refs.mjs` 的 `EXPECT` 表要同步。P1/P3/P4 期间已触发三次 —— 守卫有效，但每次重构都要跟着改。
12. **`STORE_DRIVER` 默认必须是 `json`。** `npm test` 不加载 `.env.local`，`tests/admin-actions.test.mjs` 靠 `process.chdir` 到临时目录里的 JSON 文件做隔离；默认 mysql 会让「没有数据库的 CI」被迫连库，把纯逻辑回归变成集成测试。切换是显式的（`.env.local` / 生产设 `STORE_DRIVER=mysql`），该测试现在也自己锁定驱动。
13. **ESLint 的 `react-hooks/rules-of-hooks` 会把 `useXxx()` 当成 React Hook。** 门面里最初的 `useMysql()` 一次报出 11 处错。非 Hook 的布尔判定不要用 `use` 前缀。
14. **整表读改写要用 MySQL 命名锁（`GET_LOCK`）。** JSON 实现靠进程内文件队列串行，多进程下失效 —— 这正是迁移原因之一。`tests/store-sql.test.mjs` 有并发用例证明两个并发 `updateCatalog` 都不丢。P6 换成单条乐观锁后撤掉这把大锁。
15. **契约测试必须打独立库。** `saveCatalog` 是整表镜像语义，跑在开发库上会把 55 条目录清空；用 `MYSQL_TEST_URL` 指向 `ashare_test`，没设就整组跳过。
16. **Next 16 的 `generateSitemaps` 不提供 `/sitemap.xml`。** 它只生成 `/sitemap/[id].xml`（生产构建的路由表里只有 `/sitemap/[__metadata_id__]`），而 `robots.txt` 指向 `/sitemap.xml` —— 实测该地址 404。所以本站改成自查：`app/sitemap.xml/route.ts`（少则一张 urlset，多则索引）+ `app/sitemaps/[id]/route.ts`（分片）。另外 `app/sitemap.ts` 与 `app/sitemap.xml/route.ts` 会直接冲突，构建报 `Conflicting route and metadata`。
17. **`getSiteUrl()` 返回的是 `URL` 而不是字符串。** 把它当 `string` 传给辅助函数会得到 `TS2345`。
18. **`toCatalogItem` 总是带上可选键（值可能是 `undefined`）。** 窄投影必须逐字对齐，否则 `deepStrictEqual` 会因「键存在但为 undefined」判不等。同理 `featured: false` 与「没有 featured」在库里都归一成 0，读出来只能是 `undefined` —— `canonicalItem` 已把这两者定义为等价。
19. **`sort=name` 在两个驱动下不完全等价**：SQL 用 `utf8mb4_0900_ai_ci`，JSON 路径用 `Intl.Collator("zh-CN", { numeric: true })`。差异只在含数字的名称（"Python 3" vs "Python 10"）。要完全一致得另加一列排序键。
20. **`CATALOG_PAGE_SIZE` 可覆盖页大小**（默认 60，上限 500）。55 条不足一页、分页控件不渲染，所以**必须用小页大小才能实机验证分页**。
21. **InnoDB 默认停用词表含单字母 `a` 与 `i`，而 ngram 会丢弃「包含」停用词的 token。** 受控实验（`ft_probe` 表）：`gimp` → 只剩 `mp`（gi / im 都含 i）；`git` → 一个 token 不剩（gi 含 i，it 本身是停用词）；`code` → 留 `co` / `od`（de 是停用词）。后果是搜 **Git / Figma / KiCad / Inkscape 直接 0 条** —— 这不是边缘情况，是目录里最常见的工具名。修法：空表 `ft_stopwords` + `innodb_ft_server_stopword_table=ashare/ft_stopwords` + `npm run db:reindex`。`tests/search-sql.test.mjs` 把这条配置做成硬断言，配置一回退立刻红。
22. **停用词表是在「创建全文索引」时绑定的。** 改完变量再往旧索引插数据，token 仍按旧表生成 —— 所以必须重建索引；测试库也必须整库重建才能反映当前配置（`CREATE TABLE IF NOT EXISTS` 不够）。
23. **排查全文检索时别被 `innodb_ft_min_token_size`（默认 3）误导**：ngram 用的是 `ngram_token_size`（2），真正的元凶是停用词表。
24. **迁移文件名只允许 `[a-z0-9-]`。** `0002_search_stopwords.sql` 里的下划线不匹配 `^[0-9]{4}_[a-z0-9-]+\.sql$`，会被**静默忽略**（migrate 只报「共 1 个迁移文件」）。改用 `0002_search-stopwords.sql`。
25. **多个数据库测试文件共用同一个测试库，并行会互相踩。** `npm run test:db` 用 `--test-concurrency=1` 串行跑全部五个；单独跑某个文件时才安全。
26. **对「不存在」的行做 `SELECT ... FOR UPDATE` 会取间隙锁，两个并发新建直接死锁。** 改成 `UPDATE ... WHERE slug = ? AND row_version = ?` —— 乐观检查就是这条语句本身，根本不需要先锁行。
27. **并发 INSERT 仍会死锁**（间隙锁 + 全文索引的辅助表锁）。死锁是**瞬态错误**，InnoDB 已经回滚了整个事务，官方解法是有界重试：`withWriteTransaction` 对 `ER_LOCK_DEADLOCK` / `ER_LOCK_WAIT_TIMEOUT` 重试 3 次。实测确实触发过（日志可见）。
28. **改名必须在同一个事务里完成**，不能「先删后插」—— 中途失败会把条目弄丢。目标 slug 被占用时返回 `conflict`，源条目保持不动（有测试守着）。
29. **审计表只记「改了哪些字段」与版本号，不记前后值。** 正文可能几万字，存进去这张表会比目录本身还大。要内容级历史得等 P7b 的 `item_revisions`。
30. **每个请求都要回查账号表。** 只信 cookie 里的角色，会让「停用某人」或「给他降权」等到 8 小时会话过期才生效 —— 那是安全问题。主键查询很便宜；角色变了就要求重新登录。
31. **`.mjs` 不做类型擦除**：脚本里不能出现 `as Role`、`const x: UserRecord`、`import { type Role }`。CLI 里连踩三次，且都是**运行时**才报 SyntaxError（`npm run check` 不覆盖 `scripts/*.mjs`）。写脚本时按纯 JS 写。
32. **`app/admin/actions.ts` 是 CRLF 行尾。** 多行字符串替换会**静默失配**（单行能中、多行不中，极难察觉）。跨行替换要按文件实际行尾归一化。
33. **状态流转必须带「从哪来」。** 只看目标状态，编辑就能把**已发布**的条目拉回草稿。`canSetStatus(role, from, to)` 才对。
34. **引导模式**：账号表为空时 `ADMIN_PASSWORD_HASH` 仍可登录（签发 `env-admin`）。没有它，新部署在建出第一个账号之前根本进不去后台。
35. **`public/media/**` 会被 `next start` 当静态文件直送，路由处理器根本不执行。** 所以 `/media` 的防盗链**一直无效** —— 实测跨站 Referer 返回 200，响应头是 next 的静态默认（`cache-control: public, max-age=0`、带 `last-modified`），没有 `immutable`，也没有 403。修法：本地媒体根移到 `data/media/`，让每个 `/media` 请求都必须过 `app/media/[...path]/route.ts`。修完实测：跨站 403 + `no-store`、无 Referer 200 + `immutable`、非法文件名 404。`/icons` 从来没问题 —— 它在 `data/icons`，本就不在 `public/` 下。
36. **S3 驱动没有对着真实 bucket 验证过。** `tests/s3.test.mjs` 只验证 SigV4 的**规范化与签名串**（逐字符字面量断言）与请求形态（假端点往返）。region、path-style、STS token、bucket 策略这类环境差异只有真机能暴露 —— 启用前必须跑 `npm run media:check`。
37. **老的 npm 脚本都不加载 `.env.local`。** 给 `readCatalog` 加了 DB 分支后，`content:audit` / `seed:drift` 仍然走 JSON —— 因为它们看不到 `MYSQL_URL`。已给六个数据库相关脚本的 npm 定义补上 `--env-file-if-exists=.env.local`；回落 JSON 时**明确告警**，不静默。
38. **`stale-links --update` 不能顺手改 `updated_at`。** 核验外链不是内容更新，改了会让条目虚假地跳到「最近更新」排序顶部。只写 `links_checked_at`。
39. **备份的数据库那一半，凭据不能上命令行。** `mysqldump -p<口令>` 会把口令留在进程列表里；正确做法是写一个 0600 的 `--defaults-extra-file`，用完立即删。另外**导出失败必须让整个备份失败** —— 一份「看起来成功了」但没有库的快照，比没有备份更危险。
40. **只验证「生成了文件」不够，要验证「文件能还原」。** `mysqldump --databases` 产出里带 `USE `ashare``，导入别的库名要先替换；演练之后逐表比对行数，并确认 FULLTEXT 能重建（实测 `MATCH AGAINST('+git')` 在还原库同样返回 2 条）。

41. **索引只覆盖 WHERE 是没用的，必须覆盖完整的 ORDER BY。** 0001 的 `idx_items_status_sort (status, sort_index, id)` 只覆盖 `WHERE(status)`，而默认排序是 `featured DESC, sort_index ASC, id ASC` —— 优化器既没法用它排序，就干脆全表扫描：2 万条时 `type=ALL / rows=5001 / key=(无)`。修法是按 ORDER BY 的列序与方向建索引（`featured` 是 DESC，要用 MySQL 8 的降序索引）。
42. **只看耗时发现不了全表扫描。** 5,000 条时全表扫描只要 14ms，比索引扫描还快 —— 光看时间永远不会报警。是 `EXPLAIN` 的 `key` 断言把它揪出来的。**规模闸门必须断言查询计划，不能只断言耗时。**
43. **计数这类全表聚合挂在根布局上，等于每页都付一次。** 实测 2 万条 318ms。筛选芯片上的数字晚 30 秒无所谓，每页多等三百毫秒不行 —— 加 30 秒 TTL 缓存。

44. **应用账号握着 DROP，就等于没有边界。** `ashare_app` 原来对 `ashare.*` 是 ALL PRIVILEGES（含 DROP / ALTER / CREATE）。一个只做 CRUD 的应用能删表，任何一次注入或代码事故的后果就从「改错数据」升级成「删库」。拆成三个账号：应用 DML、迁移 DDL、只读仅视图。
45. **只读账号比「只给 SELECT」更严的做法，是只给视图。** 库级 SELECT 会让只读账号看到 `users.password_hash`、`submissions`/`feedback` 里的用户内容、`audit_log`。视图用 `SQL SECURITY DEFINER`（默认），所以只授视图就够 —— 而且顺带把 `search_text`、`row_version` 这类内部列挡在外面，其他服务不会耦合到实现细节。
46. **建视图的语句必须带默认库。** 视图体里引用的表名不带库名，管理员连接没有默认库时会报 `No database selected` —— 而且报在 CREATE VIEW 上，容易误以为是权限问题。
47. **降权之后 `db:migrate` 会失败，这是预期不是故障。** 应用账号没有 DDL；`db:migrate` / `db:reindex` 改走 `MYSQL_MIGRATE_URL`，没配时回落并**明确告警**。

48. **`.mjs` 不做类型擦除 —— 本项目连踩四次。** `as Role`、`const x: UserRecord`、`import { type X }` 在 `.mjs` 里都是运行时才炸的 SyntaxError，而 `npm run check` 原先覆盖不到。已加 `tests/script-syntax.test.mjs`：用 `node --check` 扫全仓 `.mjs`。**用语法检查而不是正则** —— 正则会把字符串或注释里的 `as Foo` 误判成类型断言。
49. **手写的字段清单等于静默失明。** 漂移检查与同步脚本各有一份手写清单，新增可透传字段却漏登记，检查就对它永远「相等」——不报错、不警告。这个坑踩过三次（linksCheckedAt、guide、以及本轮）。改成 `lib/seed.ts` 的**登记表 + 契约测试**：CARRIED = DRIFT ∪ EXCLUDED、SYNC ⊆ DRIFT，且每个名字必须**真的是 Software 的键**（写错名字与漏登记同样致命：`item[field]` 两边都是 undefined）。
50. **「缺省」与「显式空值」不是差异。** `featured` 缺省 vs `false`、`[]` vs 缺省、`""` vs 缺省，语义相同。实测展开字段集后一次冒出 23 条假漂移，全部属于这一类；归一化之后是 0 条真实差异。
51. **种子无法从数据库无损重建。** `SeedSoftware` 有 `officialLabel` 与 `officialUrl`，运行库（`Software`）里没有对应字段。所以「种子降级为导出产物」**不做** —— 反向生成会静默丢掉它们，比现状更糟。种子的定位是「人手维护的内容源 + 全新部署的引导数据」，与数据库并存。改为把漂移检查做严：字段集从 13 个扩到 24 个。

## 八、本地开发环境

系统服务 `MySQL84` 因权限无法启动，因此本机用**隔离实例**：不注册服务、不动系统 datadir、不占默认 3306。

```powershell
$data = "$env:LOCALAPPDATA\Ashare\mysql-data"
# 启动（首次需先 --initialize-insecure）
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="$data" --port=3307 --bind-address=127.0.0.1 --mysqlx=0 --console
# 停止
Get-Process mysqld | Stop-Process -Force
```

- 数据目录：`%LOCALAPPDATA%\Ashare\mysql-data`（在仓库外，不进 git）
- 连接串在 `.env.local` 的 `MYSQL_URL`，账号 `ashare_app`，密码随机生成
- 应用通过 Next 自动加载 `.env.local`；脚本用 `node --env-file-if-exists=.env.local`
- root 为空密码且仅监听 `127.0.0.1`，**只适合本机开发**；生产必须用受管 MySQL 并开启 TLS（URL 加 `?ssl=1`）
- **必须设置全文检索的停用词表**（否则 git / figma / kicad 这类词搜不到，见第七章第 21 条）：

  ```ini
  # my.cnf，写进 [mysqld] 后重启
  innodb_ft_server_stopword_table=ashare/ft_stopwords
  ```

  本机隔离实例没有 my.cnf，用 root 执行一次 `SET GLOBAL innodb_ft_server_stopword_table='ashare/ft_stopwords'`（重启后需重设）。
  **重启 MySQL 后照这两步恢复**（实测：重启后 `npm run test:db` 会有2~3 项报错，形态很像代码 bug，其实是配置回退）：
  1. `SET GLOBAL innodb_ft_server_stopword_table='ashare/ft_stopwords';` —— 全局变量不写进 my.cnf，重启即丢
  2. `npm run db:reindex` —— 停用词表是**创建索引时**绑定的，只改变量不重建索引，token 仍按旧表生成
  `npm run db:reindex -- --check` 可随时核对当前生效的停用词表。
  **顺序很重要**：索引创建时就绑定停用词表，所以要先设变量、再建索引；已经建过的跑 `npm run db:reindex` 重建。`npm run db:reindex -- --check` 可随时核对配置。
- **后台账号**：`npm run user -- list | add <账号> --name "显示名" --role admin|editor | passwd <账号> | disable <账号> | enable <账号> | remove <账号>`。
  口令一律交互式隐藏输入，不走命令行参数（否则会留在 shell 历史与进程列表里）。
  账号表为空时可继续用 `ADMIN_PASSWORD_HASH` 登录（引导模式），建出第一个账号后即以表为准。
- **媒体落点**：默认写在 `data/media/`（**不是** `public/media/`，理由见第七章第 35 条）。
  多副本部署设 `MEDIA_DRIVER=s3` 并填 `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`
  （自建 MinIO 保持 `S3_FORCE_PATH_STYLE=1`）。**启用前先跑 `npm run media:check`** 对真实 bucket 冒烟。
  存量部署若已有 `public/media/` 下的图片，迁移时把目录搬到 `data/media/`（`npm run backup` 两个落点都会备）。

## 九、风险与对策

| 风险 | 对策 |
|---|---|
| 双源真相（JSON 与 DB 漂移） | 不做双写；P3 的 `db:verify` 是硬闸门，diff 不为 0 不许进 P4 |
| 读路径仍是全量加载 | P5 与数据增长赛跑；在条目涨到四位数前完成 |
| 并发编辑互相覆盖 | `row_version` 乐观锁 + 409；不再「全量写回」 |
| 连接池在 dev HMR 下泄漏 | `globalThis` 单例（与 `lib/click-store.ts` 的 `processRef` 同模式） |
| 附件列表顺序变化 | `feedback`/`submissions` 用 `at DESC, seq DESC` 复现「新条目在前」 |
| 点击日期漂一天 | `at` 存 UTC，分桶用 `+8 小时`（中国无夏令时） |
| 备份语义变化（`.bak` 只保上一次） | 改 `mysqldump --single-transaction` + `--keep N` |
| 单进程约束只解除一半 | 媒体与限速尚未迁移；横向扩容前必须完成 P8 |

## 十、验证状态

### P1（基础设施）

- `npm run db:migrate` 首次应用 `0001_init`；第二次运行全部 skip，幂等
- 13 张表齐全；`items.search_text` 为 `FULLTEXT` 索引；`ngram_token_size=2`
- 级联删除、slug 唯一、枚举拒绝非法值：均在事务内验证并回滚，不留数据
- `npm run test:db` 5/5 通过；无 `MYSQL_URL` 时整组跳过，`npm test` 不因缺库变红
- `npm run check` 161 项：156 通过 / 5 跳过 / 0 失败（Lint + 类型 + 回归）
- 未改动任何业务代码；`lib/db.ts` 目前只有测试引用，P4 起才被 `lib/store.ts` 使用

### P3（ETL 与一致性闸门）

- `npm run db:import` 导入 55 条 items 与 73 条 clicks；`--dry-run` 末尾回滚（第二次正式导入时 clicks 表已非空，反证回滚确实生效）
- 二次导入幂等：items 走 UPSERT（`row_version` 不动，避免覆盖编辑并发计数），子表 DELETE + INSERT 保序；clicks 无自然键，默认只在表为空时导入
- `npm run db:verify` 通过：**JSON 55 条 / DB 55 条 · 逐字段不一致 0 · 顺序一致 · 数据库无多余条目 · clicks 73/73**
- 附件三表（feedback / submissions / ip_blocks）运行库尚未产生过数据，JSON 与 DB 均为 0
- `db:verify` 显式报告未入库字段：`officialLabel ×50`（契约外，非失败）
- `tests/catalog-rows.test.mjs` 8/8：拿全部 55 条做「Software → 行 → Software」往返，含顺序敏感字段与镜像校验三件套
- `npm run check` 169 项：164 通过 / 5 跳过 / 0 失败

### P4（应用切到数据库）

- 结构：`lib/store.ts` 变成按 `STORE_DRIVER` 转发的门面（**导出签名一字未改**，20 个调用点零改动），实现分到 `lib/store-json.ts` 与 `lib/store-sql.ts`；目录读写抽到 `lib/catalog-persist.ts`，ETL / `db:verify` / 应用三处共用
- `npm run test:store` 7/7：往返、增删、**并发 `updateCatalog` 不互相覆盖**、级联清理、feedback 排序与已读、submissions、blocks 毫秒往返（打的是隔离库 `ashare_test`）
- `npm run db:verify` 重构后仍是 0 差异 —— P3 的闸门没有被 P4 破坏
- `npm run check` 176 项：164 通过 / 12 跳过 / 0 失败
- **实机验证**：`npm run dev`（`STORE_DRIVER=mysql`）下 `/`、`/software/vscode`、`/search?q=python`、`/scenes/code`、`/admin/login` 全部 200；首页显示收录 55 款
- **直连证明**：直接改库里 `vscode` 的 `name`，`/software/vscode` 与首页立刻跟着变；还原后页面同时还原。这排除了「悄悄回退到 JSON」的可能 —— 实机跑的就是 MySQL

### P5（读路径：SQL 分页 / 筛选 / 计数 / 详情 / 站点地图）

- `lib/catalog.ts` 变成驱动门面：SQL 路径把筛选、排序、分页全部下推；JSON 路径在内存里做等价的事
- 新增 `lib/catalog-sql.ts`：**列表只做窄投影**（卡片 14 个字段，绝不 `SELECT *`，不读 `body` / `guide`）；**子行按 `IN (?)` 收窄** —— 详情页只取一条，就不再整表读 `item_tags`
- 计数下推成聚合查询：根布局每页都要用它，是全站最热的读
- 详情 / 同类替代 / 场景 / 精选 / 站点地图全部改成定向查询；点击页只为出现过的 slug 补名称
- `app/page.tsx` 分页（默认每页 60，`CATALOG_PAGE_SIZE` 可调）；**超过一页才渲染分页控件**，所以 55 条时界面与从前完全一致
- `tests/catalog-sql.test.mjs` 9/9：13 种筛选组合 × 全部分页，**SQL 结果与内存实现逐字段一致**；另覆盖计数、精选、详情、替代品顺序、场景、窄投影、越界分页、站点地图
- `tests/sitemap.test.mjs` 6/6：XML 结构与转义
- **实机验证（生产构建 `npm run build` + `npm run start`）**：`/sitemap.xml` 200 且 `application/xml`、71 条 URL；`/sitemaps/0` 200；非法 id 与越界分片降级为空 urlset；首页 software 链接从 55 降到 15（10 张卡 + 5 条精选），`?page=2` 与第 1 页无重叠（重叠的 5 条是每页都显示的精选行）；`/software/vscode`、`/search?q=python`、`/scenes/code` 全 200；`/admin/clicks` 307 跳登录
- `npm run check` 191 项：170 通过 / 21 跳过 / 0 失败
### P5b（搜索下推）

- `lib/catalog-sql.ts` 新增 `searchCatalog`：FULLTEXT + ngram 选候选，短于 2 字的词走 `LIKE` 兜底；布尔模式操作符（`+ - > < ( ) ~ * " ``）与 LIKE 通配符（`% _`）都做了净化；排序为「名称命中档 → 全文相关度 → 目录顺序」
- `lib/catalog.ts` 增 `searchCatalog` 门面，`app/search/page.tsx` 接上分页
- `tests/search-sql.test.mjs` 8/8：**用 `search_text` 的包含口径当预言机**，对 30+ 查询（中文任务词、英文名、含 a/i 的名称、单字、纯符号）断言结果集不漏也不多
- **修掉一个严重的召回缺陷**：InnoDB 默认停用词表含单字母 `a`/`i`，ngram 丢弃包含停用词的 token，导致搜 Git / Figma / KiCad 全部 0 条。空停用词表 + `npm run db:reindex` 修复，并把配置检查做成硬断言
- **实机（生产构建）**：`git` 2 · `figma` 1 · `kicad` 1 · `inkscape` 1 · `python` 4 · `图像` 2 · `图` 10（单字 LIKE 兜底）· `zzzznotfound` 空态
- `npm run check` 199 项：170 通过 / 29 跳过 / 0 失败；`npm run test:db` 29/29（串行）
- **已知差异**：SQL 搜索的字段是 `search_text`（名称 / 中文名 / 别名 / 标签 / 简介），**不含长正文**；内存实现还扫 `body` / `whoFor` / `whoNot`。这是「不把 5 万字正文塞进全文索引」换来的取舍，不是疏漏

### P6（写路径：单条原子写 + 乐观锁 + 审计）

- 后台的保存 / 状态 / 删除不再走「读全量 → 改一条 → 写全量」，改为 `lib/store-sql.ts` 的单条原子写
- **乐观锁**：编辑表单带 `row_version`，落库时写进 `WHERE` 条件；不一致返回 `conflict`，页面提示「刚被别人改过，请刷新后重试」，**不覆盖别人的改动**
- **改名原子化**：同一个事务里先改 slug 再更新字段；目标被占用时返回 `conflict`，源条目保持不动
- **审计**：新表 `audit_log`（`0003_audit-log.sql`），记录操作人、动作、slug、字段级 diff 与前后版本号
- **死锁重试**：`lib/db.ts` 新增 `withWriteTransaction`，对 `ER_LOCK_DEADLOCK` / `ER_LOCK_WAIT_TIMEOUT` 有界重试（实测触发）
- `tests/write-path.test.mjs` 10/10：**单条保存只碰一行**（断言其它条目的 `row_version` 与 `updated_at` 不变 —— 这是替换掉整表写的核心证据）、并发同一条恰好一成功一 conflict、不同条目并发都不丢、改名与改名撞车、级联删除、状态变更版本校验、审计读取
- `npm run check` 209 项：171 通过 / 38 跳过 / 0 失败；`npm run test:db` 39/39（串行）· `npm run db:verify` 0 差异 · `npm run build` 通过
### P7（账号与权限）

- `users` 表（`0004_users.sql`）：口令仍只存 scrypt 哈希；`role` 两档，`disabled` 立即生效
- **权限矩阵集中在 `lib/users.ts`**：`admin` 全权；`editor` 只能 `edit` / `moderate`。散在各个入口里最容易出现「新加了入口忘了加检查」
- **会话带身份**：令牌是 `过期时间.角色.base64url(用户名).签名`，篡改任一字段都失效；**每个请求回查账号表**，停用与降权立即生效
- **草稿→审核→发布**：`PublishStatus` 增加 `review`；`canSetStatus(role, from, to)` 保证编辑不能自己上线、也不能把已发布的撤下
- 后台三个写入口改用 `requirePermission("edit"|"publish")`；审计的 `actor` 从写死的 `admin` 换成真实账号
- `npm run user` 命令行管账号（隐藏输入口令）
- `tests/users.test.mjs` 5/5：权限矩阵、状态流转、`toPublicUser` 不泄露哈希、用户名规则、账号 CRUD 往返
- `tests/security.test.mjs`：会话令牌携带身份，篡改有效期/角色/用户名/签名一律失效，非 ASCII 用户名往返
- `npm run check` 214 项：175 通过 / 39 跳过 / 0 失败；`npm run test:db` 44/44 · `npm run build` 通过
- **实机**：`/admin/login` 200 含账号与口令字段；未登录 `/admin` 307 跳登录；公开页不受影响
### P8（媒体存储）

- `lib/media-storage.ts`：存储抽象，`MEDIA_DRIVER=local | s3`。上传、读取、删除三处全部改走它
- `lib/s3.ts`：手写 SigV4 + fetch 的最小 S3 客户端（PUT / HEAD / GET / DELETE），不引入 AWS SDK
- `/media` 路由改为从存储驱动读；防盗链仍在读取之前判定
- **修掉一个既有安全缺口**：本地媒体根从 `public/media/` 移到 `data/media/` —— 原位置会被 `next start` 静态直送，路由处理器不执行，防盗链形同虚设
- `npm run media:check`：对真实 bucket 的 PUT/HEAD/GET/DELETE 冒烟（唯一能验证 S3 配置的手段）
- `tests/s3.test.mjs` 7/7：SigV4 规范化逐字符断言、URI 编码规则、Authorization 语法、密钥变更换签名、假端点字节往返、本地驱动读写删与目录穿越拒绝
- `npm run check` 221 项：182 通过 / 39 跳过 / 0 失败；`npm run test:db` 44/44 · `npm run build` 通过
- **实机（生产模式）**：无 Referer 200 + `immutable`、同站 200、**跨站 403 + `no-store`**、非法文件名 404
- **未做**：没有对着真实 bucket 签过 —— 已提供 `media:check`，但要等有凭证的环境才能跑

### P10（脚本读路径改指向数据库，部分完成）

- `scripts/_shared.mjs` 的 `readCatalog` 改为**有 `MYSQL_URL` 就读库**，否则回落 JSON 并**明确告警**（不静默）。这一处覆盖 `content-audit` / `stale-links` / `check-links` 四个脚本
- `seed-drift` 改为种子 vs **运行库**（读库）；`smoke-detail` 同样走 `readCatalog`
- `stale-links --update` 改为写库（只写 `links_checked_at`）；`--source seed` 时拒绝回写 —— 种子在 git 里，巡检不该改它
- **退役 `db-verify`**：它的职责是 P3/P4 的一次性 JSON↔DB 一致性闸门；JSON 已冻结，继续比对必然假红。持续闸门由 `seed:drift` 承担
- `seed:sync` / `seed:guides` 在 DB 模式下**直接拒绝**，免得「跑得很成功」却写进一份没人读的文件
- `seed:sync` 改为写库（`persistCatalog(prune:false)` 单事务）；**退役一次性 `seed-guides`**（guide 早已补齐，库模式下它无事可做）
- `ingest-item.mjs`（技能脚本）改为读库 + 逐条原子写。**语义变化**：从「一次写全量」变成「逐条写」，校验仍在写入之前全部完成，所以不会写一半才发现数据不合法。
- **仍未做（P10c）**：`backup.mjs` 的 `mysqldump`、种子降级为导出产物
- **幂等性修复**：`seed:sync` 与 `seed:drift` 的对象比对改为递归按键排序 —— 原来 DB 往返重排 `links` / `guide` 的键，会让 `seed:sync` **每轮重写 55 条**，而 `seed:drift` 的 COMPARE 清单里没有 `guide`，看不见这件事。现在 `seed:sync --dry-run` 报「已是最新」
- `npm run check` 221 项：182 通过 / 39 跳过 / 0 失败；`content:audit` / `seed:drift` / `seed:sync --dry-run` 全部走库（无回落告警）

### P10c（数据库备份）

- `scripts/backup.mjs` 增加 MySQL 导出（`db/ashare.sql`，`--single-transaction` 不锁表），manifest 记字节数与 SHA-256
- 口令走 0600 的 `--defaults-extra-file`，用完立即删；**导出失败让整个备份失败**，不留残缺快照
- 未配置 `MYSQL_URL` 时明确告警「本次没有备份数据库」；备份源不再强求文件，只有数据库也能备
- **还原演练**（导进临时库 `ashare_restore_check` 后逐表比对）：items 55/55 · item_tags 199/199 · item_links 94/94 · clicks 73/73 · schema_migrations 4/4 · 中文完好 · **FULLTEXT 正确重建**（`MATCH AGAINST('+git')` 同样 2 条）
- **仍未做（P10d）**：种子降级为导出产物

### P11（规模验证）

- `npm run scale:check`：往隔离库 `ashare_scale` 灌 N 条合成数据，测代表性查询并**用 EXPLAIN 断言走索引**（`--keep` 保留数据）
- **查出并修掉一个真问题**：默认排序的查询是全表扫描（见第七章 41/42）。`0005_list-indexes.sql` 按 ORDER BY 补三条复合索引，删掉被完全覆盖的旧索引；场景/平台筛选从逐行 `EXISTS` 改成 `IN(子查询)`；`catalogCounts` 加 30 秒 TTL 缓存

**2 万条实测（同一次运行的修复前 → 修复后）**：

| 查询 | 修复前 | 修复后 |
|---|---|---|
| 首页列表 | 16.7 ms | **13.6 ms** |
| 深分页（第 50 页） | 47.9 ms | **36.2 ms** |
| 按场景筛选 | 95.5 ms | 82.4 ms |
| 组合筛选 | 16.3 ms | 14.0 ms |
| 总数计数 | 4.4 ms | 3.5 ms |
| 聚合计数（每页） | 387.0 ms | 318.1 ms（**应用侧 30 秒缓存**） |
| 全文搜索（唯一串） | 30.9 ms | 33.2 ms |
| 详情单条 | 4.4 ms | **5.5 ms** |
| 站点地图分片 | 82.8 ms | 94.7 ms |
| 单条写入 | 25.3 ms | 17.8 ms |

- **详情单条从 5,000 到 20,000 几乎不变（4.2 → 5.5 ms）** —— 按条读取是真正的 O(1)，这是整次迁移最想要的性质
- **计划断言**：列表 `type=ref key=idx_items_status_featured`（修复前 `type=ALL key=(无)`）；搜索 `type=fulltext key=ft_items_search`
- **已知特性（如实记录，未修）**：场景筛选 2 万条时 82ms。`item_scenes` 已有正确的覆盖索引（`idx_item_scenes_scene`，`Using index`），这 82ms 是「筛出约 1,800 条再排序取前 60」的固有成本，不是缺索引
- **刻意不设绝对耗时阈值**：阈值随机器变，容易变成假保证。改成断言查询计划与「按条读取保持平坦」

**P11 收尾：默认驱动翻成 mysql**

`lib/store.ts` 与 `lib/catalog.ts` 的判定从 `STORE_DRIVER === "mysql"` 改成 `!== "json"`。

理由是**默认值本身就是一种决定**：原来的写法意味着「忘了配就静默退回 JSON」，
而 JSON 路径的读写代价（每次请求整目录读进内存、每次保存重写整目录）正是这次迁移
要消除的东西。忘了配就悄悄跑在一个为回滚保留的实现上，这类错比启动失败难发现得多 ——
启动失败会有人看见，静默降级不会。

**JSON 实现保留而非删除**（与原计划的「P11 删除 JSON 分支」不同）：
它是迁移出问题时**唯一的回滚路径**，也是 `tests/admin-actions.test.mjs` 的隔离手段
（该测试显式设 `STORE_DRIVER=json`，否则开发者环境里的 mysql 会把它变成集成测试）。
删掉就没有回头路，且双路径一致性闸门（`tests/catalog-sql.test.mjs`）会失去对照物。

**两个门面的判定必须一致**：store 走 json 而 catalog 走 SQL，会让写入与读取落在
两份数据上 —— 那是静默的数据分裂，不是配置错误。已在两处注释里点明这层关系。

**验证**：`npm run check` 230 项（187 过 / 43 跳过 / 0 失败）· `npm run test:db` 48/48 ·
**实机**：删掉 `STORE_DRIVER` 后直接调 SQL 实现读到真实条目数，确认默认路径真的连库
（测试全绿不足以证明这一点 —— `admin-actions.test.mjs` 自己就设了 json）。

### P9（服务边界与最小权限）

- **三个账号，各司其职**：`ashare_app` 只有 SELECT/INSERT/UPDATE/DELETE（**不含任何 DDL**）；`ashare_migrate` 持 DDL，只有 `db:migrate` / `db:reindex` 用；`ashare_ro` 只能读已发布目录的 **5 个视图**
- `npm run db:grants`：幂等地建账号、按 URL 同步口令、收紧应用账号、建视图、复查边界
- `scripts/db-grants.mjs` 末尾把边界当断言跑：应用 DROP/CREATE 拒绝、只读读 `users` 拒绝、只读写目录拒绝、迁移改结构允许
- `tests/grants.test.mjs` 3/3 把这些断言钉进 `npm run test:db` —— 权限「配好了」和「还在」是两件事，下一次手动 GRANT 就可能悄悄放宽，且不会有任何报错
- `lib/db.ts` 新增 `migrationConnectionOptions()`：结构变更优先用 `MYSQL_MIGRATE_URL`
- **实测**：应用账号对真实库 INSERT/SELECT/UPDATE/DELETE 全部可用 · 实机首页 / 搜索 / 详情 / 场景 / 站点地图 / 后台登录页全 200 · `db:reindex` 用迁移账号完成真实 DDL（DROP + ADD FULLTEXT）
- `npm run test:db` 48/48 · `npm run check` 通过

### P10d（种子与漂移检查）

- **结论：种子不从数据库导出。** `SeedSoftware` 的 `officialLabel`/`officialUrl` 在运行库里没有对应物，反向生成会静默丢字段 —— 那比「两个落点」更糟。理由写进了第七章 51 条与 `lib/seed.ts` 的注释
- 改做的事：**把漂移检查从「手写清单」变成「有契约的登记表」**
  - `lib/seed.ts` 新增 `SEED_CARRIED_FIELDS` / `SEED_DRIFT_EXCLUDED` / `SEED_DRIFT_FIELDS` / `SEED_SYNC_FIELDS`
  - 两个脚本不再各写一份清单，都从登记表取
  - `tests/seed-contract.test.mjs` 3/3 钉住不变量：每个名字必须真的是 `Software` 的键；CARRIED = DRIFT ∪ EXCLUDED；SYNC ⊆ DRIFT；且每个登记字段**实际**能被 `seedToItem` 带过去
- **检查强度**：比对字段从 13 个扩到 **24 个**，同时归一化「缺省 vs 显式空值」与键顺序 → 展开后先是 23 条假漂移，修完 **0 条真实差异**
- `tests/script-syntax.test.mjs`：用 `node --check` 扫全仓 `.mjs`（`.mjs` 不做类型擦除，这个坑踩了四次）
- `npm run check` 通过 · `seed:sync --dry-run` 报「已是最新」

## 十一、能力边界

本计划的调用关系来自图谱实测，但**图谱对 `.mjs` 的跨语言解析有损耗**（CALLS 边以 TS 为主）。第二章「逃逸通道」一表是图谱 + 全文检索交叉核对的结果，仍可能有遗漏；脚本侧的真实改动面要到 P10 逐个直读确认。
