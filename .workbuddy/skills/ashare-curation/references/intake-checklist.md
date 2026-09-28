# 收录自检清单

每条条目写入前逐项过一遍。复制到当次任务里逐条打勾，不勾完不写入。

## 来源（一票否决）

- [ ] 官网可达（`check-links.mjs` 通过，或人工打开确认过 403 是拦截而非失效）
- [ ] 许可证已确认（看 LICENSE 文件 / GitHub API 的 license 字段，不信 README 一句话）
- [ ] 平台按 release 资产实际填（`.exe`/`.msi`/`.dmg`/`.pkg`/AppImage/deb）
- [ ] 价格口径清楚，写进 `price` 或明确留空
- [ ] 最近更新时间已知；停止维护的要在正文里写明
- [ ] Git 链接 host 在白名单内
- [ ] 用了网盘镜像：已填 `diskNote`，且已有 `official` 或 `github`
- [ ] 全文不含破解相关词（含「绿色版」「序列号」，注意是子串匹配）

## 内容（完成标准）

- [ ] `body` 非空，至少 2 段，段落之间空一行，没有 Markdown 语法
- [ ] 正文第三段写了代价/风险（第三方依赖、未签名、平台限制、维护状态）
- [ ] 正文交代了许可证与发布渠道
- [ ] `tags` 至少 3 个，写用途和品类，不写形容词
- [ ] `summary` ≤ 500，说清「是什么 + 和谁比差别」
- [ ] `whoFor` / `whoNot` 只谈任务和水平，不出现「学生」「上班族」这类身份标签
- [ ] `aliases` 填了常见叫法（搜索权重 90/80，仅次于名称）
- [ ] `tutorial` 每步是一个数组元素，动词开头
- [ ] `alternatives` 填了同场景已存在的 slug
- [ ] `previews` 没有图就留空，不硬凑
- [ ] `scenes` 选的是用户的需求而非软件品类

## 写入

- [ ] 已跑 `npm run backup`
- [ ] `ingest-item.mjs --dry-run` 零错误（警告要逐条看过）
- [ ] 写入后 `catalog.sha256.json` 已同步（脚本自动做）
- [ ] **草稿里出现的每个字段都在种子里同步了**——逐项念一遍 `aliases` / `tags` / `body` / `links` / `summary` / `price`，这个字段已经漏过两次
- [ ] 同步了种子文件（`data/software.ts` 或 `data/samples.ts`，条目在哪个就改哪个）
- [ ] `npm run seed:drift` 报「不一致 0 条」
- [ ] `npm run check` 通过
- [ ] `npm run content:audit` 对应缺口数字下降
- [ ] `CHANGELOG.md` 已加条目（来源、许可证、核验结论、已知风险）
