# 条目录入字段规格

草稿是一个 JSON 对象（或数组），交给 `scripts/ingest-item.mjs` 校验并写入。字段取自 `data/types.ts` 的 `Software`，校验规则与后台 `app/admin/actions.ts` 保持一致——脚本拦得住的，后台也拦得住。

## 字段表

| 字段 | 类型 | 必填 | 上限 / 约束 | 说明 |
|---|---|---|---|---|
| `slug` | string | 是 | `/^[a-z0-9][a-z0-9-]{0,99}$/` | URL 片段，全站唯一。改名等于换页，旧链接会 404 |
| `name` | string | 是 | 100 | 官方名，如 `Visual Studio Code` |
| `nameZh` | string | 否 | 100 | 常用中文名 |
| `aliases` | string[] | 否 | 总长 2000 | 别名、缩写，搜索权重很高（90/80 分），务必填常见叫法 |
| `kind` | `"app"` \| `"script"` \| `"opensource"` | 是 | 白名单 | 条目形态，决定前台**筛选**。种子里可显式写；不写时按 `source === "opensource"` → `opensource`，否则 `app` |
| `status` | `"draft"` \| `"published"` | 是 | 白名单 | `draft` 前台不可见；草稿可先入库再补内容 |
| `source` | `"official"` \| `"opensource"` \| `"discount"` | 是 | 白名单 | 来源属性，决定前台**徽章**（蓝/绿/橙红）。**判据是许可证，不是仓库是否可见** |
| `tags` | string[] | 否 | 总长 2000 | 3–5 个，搜索权重 50 分；写用途和品类，不写形容词 |
| `summary` | string | 是 | 500 | 一句话，决定卡片说服力，搜索权重 30 分 |
| `body` | string | 否 | 50000 | 纯文本，**空行分段**，页面按 `/\n+/` 切段。**不解析 Markdown/HTML** |
| `scenes` | SceneId[] | 是 | 12 个 id | `code` `docs` `design` `data` `office` `engineering` `tools` `photo` `games` `education` `music` `social` |
| `platforms` | Platform[] | 是 | `windows` `macos` `linux` | 按 release 资产实际支持填 |
| `price` | string | 否 | 100 | 留空按「免费」展示；付费写 `会员 ¥68/月` 这类短文案 |
| `links.official` | string | 见下 | HTTPS，≤2048 | 官网，主 CTA 首选 |
| `links.homepage` | string | 否 | 同上 | 产品主页（官网另有下载页时填） |
| `links.github` | string | 否 | 同上 + host 白名单 | 只允许 `github.com` / `gitlab.com` / `gitee.com` / `codeberg.org` |
| `links.disk` | string | 否 | 同上 | 网盘镜像。**必须先有 official 或 github**，且必须填 `diskNote` |
| `links.diskNote` | string | 条件必填 | 1000 | 镜像说明（谁提供的、核验结论） |
| `tutorial` | string[] | 否 | 总长 10000 | 一个元素一步。后台表单每行一步，会自动按行拆分 |
| `whoFor` | string | 否 | 2000 | 适合谁 |
| `whoNot` | string | 否 | 2000 | 不适合谁 |
| `discountNote` | string | 否 | 1000 | 优惠渠道说明；`source === "discount"` 时必填 |
| `alternatives` | string[] | 否 | 总长 2000 | 其他条目的 slug；后台表单用逗号分隔（支持中英文逗号） |
| `featured` | boolean | 否 | — | 编辑精选，影响默认排序（精选优先）与首页横滑行 |
| `previews` | string[] | 否 | 最多 6 | 见下方图片路径规则 |
| `iconImage` | string | 否 | — | 自定义图标图，见下方规则 |
| `icon.letter` | string | 是 | 2 字符 | 无图时的字母块，取名称首字母 |
| `icon.color` | string | 是 | `#rrggbb` | 品牌色，格式不符会回退 `#0071e3`；渲染为 `${color}14` 浅底 |
| `icon.simpleIcon` | string | 否 | slug 格式 | 对应 `data/icons/<名称>.svg`（现有 21 个，缺失会 404 并回退字母） |
| `createdAt` / `updatedAt` | string | 否 | ISO | 写入脚本自动维护；`sort=updated` 依赖 `updatedAt` |

## 图片路径规则（容易踩）

`previews` 与 `iconImage` 的值必须匹配：

```
/media/<slug>/<16 位十六进制>.<jpg|jpeg|png|webp|gif>
```

这是上传流程生成的格式，`mediaParts()` 用它做白名单校验——不符合的文件既读不出来（`app/media/[...path]/route.ts` 返回 404），后台也删不掉。**没有图片就留空数组**，前端会回退到字母图标，不影响发布。

## `source` 与 `kind` 的判定（改分类时必看）

这两个字段各管一件事，改动时要一起想：

- `source` → 前台**徽章**（官方 / 开源 / 优惠）。判据是**许可证**：有明确的开源许可证（MIT、GPL、Apache…）才是 `opensource`。
- `kind` → 前台**筛选**（应用 / 脚本 / 开源）。

常见误判：

- **源码可见 ≠ 开源。** GeoGebra 源码公开但采用自家非商业许可，GitHub 的 `license` 字段是 `null`。这类要写 `source: "official"` + `kind: "app"`，并在正文写明「非商业用途免费，商用需授权」。
- **种子里 `source: "opensource"` 会被自动推导成 `kind: "opensource"`。** 若实际不是开源，必须显式写 `kind` 覆盖，同时把 `source` 改掉——只改一个会让徽章和筛选互相矛盾。
- `tests/seed.test.mjs` 会校验这两者不打架。

## 写作要点

- **口吻**：短句、具体、不煽动。像懂行的朋友报货，不像广告。
- **适合 / 不适合**：只谈任务和水平（「要跑统计检验但不想写代码」），不谈身份（不写「适合学生」「上班族必备」）。
- **body 三段式**：① 它是什么、解决什么 ② 跟同类比差别和取舍在哪 ③ 坑与注意（依赖第三方接口、未签名、平台限制等）。段落之间空一行。
- **别用 Markdown**：`**加粗**`、`- 列表` 会原样显示成文本。
- **price 只在有明确定价时填**。留空会让 JSON-LD 输出 `price: "0"`；付费条目填了价格就不再输出 offers——不要给付费条目谎报免费。
- **summary 是卡片的门面**：写「是什么 + 和谁比差别」，不写空话。
- **aliases 和 tags 决定能不能被搜到**：搜索打分 `name 200 > 前缀 120 > 包含 100 > 别名 90/80 > 标签 50 > 简介 30 > 正文 10`。
