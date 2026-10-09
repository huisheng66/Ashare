# 测试与验证

## 怎么跑

```bash
npm test          # 全部回归测试（node:test，tests/*.test.mjs，28 个文件）
npm run check     # 提交前完整检查：ESLint + next typegen & tsc + npm test
npm run test:db   # 数据库集成测试（--test-concurrency=1 串行：db / store-sql / catalog-sql / search-sql / write-path / users / grants）
```

- 测试使用**临时目录**，不写入业务目录。
- `tests/admin-actions.test.mjs` 显式设 `STORE_DRIVER=json` 做隔离，免得开发者环境的 MySQL 把单元测试变成集成测试——这也是 JSON 驱动保留的原因之一。

## 测试矩阵（28 个文件）

### 数据与存储

| 文件 | 覆盖 |
|---|---|
| `json-store.test.mjs` | 并发写、损坏文件、备份机制 |
| `store-sql.test.mjs` / `catalog-sql.test.mjs` | SQL 驱动的读写与行组装（`itemRowFromDb` 往返、卡片字段失配检测） |
| `db.test.mjs` / `grants.test.mjs` | 连接池、最小权限授权 |
| `write-path.test.mjs` | 写路径事务 |
| `search-sql.test.mjs` | 全文搜索（停用词、场景/平台过滤） |
| `seed.test.mjs` / `seed-contract.test.mjs` | 种子转换的字段透传完整性 |
| `data-model.test.mjs` | 类型契约 + **`validateSemantics` 语义自洽矩阵** |

### 内容规范与渲染

| 文件 | 覆盖 |
|---|---|
| `guide.test.mjs` | 教程校验、行格式往返（CALLS 出边 16 条，测试密集之最） |
| `rich-text.test.mjs` | markdown 渲染安全（无 XSS） |
| `body-columns.test.mjs` | 中文行宽分栏 |
| `license-info.test.mjs` | SPDX 解析与中文说明 |
| `stale.test.mjs` | 90 天新鲜度门槛与"全可达才回写"规则 |
| `catalog.test.mjs` / `catalog-rows.test.mjs` | 目录读取、场景分组、平替条目 |

### 安全关键（图谱证实有真实调用覆盖，不是空跑）

| 文件 | 覆盖 |
|---|---|
| `hotlink.test.mjs` | 防盗链判定，**含 `evilashare.example` 后缀伪装用例** |
| `security.test.mjs` / `proxy.test.mjs` | CSP、`/admin` 方法白名单、cookie 属性 |
| `admin-actions.test.mjs` | 后台权限守卫 |
| `user-actions.test.mjs` | 账号管理：**三条自伤防线**（不能停用/删除/降级自己）+ 编辑角色越权 |
| `s3.test.mjs` | SigV4 签名串字面量断言 + 请求形态往返（**未对真实 bucket 验签**——那要用 `media:check`） |

### 其余

`click-analytics.test.mjs`（渠道拆分与日序列）· `site.test.mjs`（站点 URL 与 sitemap）· `sitemap.test.mjs` · `users.test.mjs`（权限矩阵与状态流转）· `script-syntax.test.mjs`（脚本语法）

## 质量特征（图谱视角）

- 测试文件是 lib 层的最大消费方——**lib 无 React 依赖使其可被 node:test 直接 import**，这是分层的直接收益。
- 两个安全关键模块（`decideHotlink`、`validateSemantics`）都有专门测试文件对应。
- CI 与本地跑**完全相同**的命令（`ci.yml`），不存在"CI 过了本地不过"的分叉。

## 已知的内容缺口（非代码 bug）

- `photo` 场景在 `data/scenes.ts` 中有定义但运行库暂无条目——用 `npm run content:audit -- --scene photo` 确认与跟进。
