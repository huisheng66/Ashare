# 范本：一条完整条目怎么写

`data/samples.ts` 里的 **Mineradio** 是种子中少数带完整正文的条目，可直接对照。它好在三件事：正文说清了取舍、如实写了风险、发布渠道可核验。

## 结构拆解

**summary（一句话）** — 说清是什么 + 形态，不写评价。

**body 四段，空行分隔**（页面按空行切段，不解析 Markdown）：

1. 它是什么、解决什么
2. 核心特性，具体而非形容——"播放后会进入电影镜头式的节奏视觉，歌词舞台与粒子舞台同步工作"
3. 代价与风险——"接入网易云音乐与 QQ 音乐的账号、搜索与歌单，因此登录态和可用性依赖这些平台的接口，也会随作者更新而变化。安装包未签名，Windows SmartScreen 首次运行会提示风险。"
4. 来源与发布渠道——"项目以 GPL-3.0 在 GitHub 开源，安装包由 GitHub Releases 发布。"

**tutorial** — 从实际下载步骤写："从 GitHub Releases 下载 Mineradio-2.2.0-Setup.exe（macOS 用对应的 .dmg）。"

**whoFor / whoNot** — 谈任务和偏好，不谈身份。

**links** — 只有 `github`（host 在白名单内），没有网盘镜像，因此不需要 `diskNote`。

**license / version / linksCheckedAt** — 核验到的结构化字段，**不要只写在正文第 4 段**：

| 字段 | 写法 | 核验来源 |
|---|---|---|
| `license` | SPDX 标识，如 `GPL-3.0-only`、`MIT`、`Unlicense`。**查不到就整个字段留空**，不要写「未知」或猜一个 | 上游仓库的 LICENSE/COPYING 原文；GitHub API 的 `license.spdx_id` 为 `NOASSERTION` 时必须读原文 |
| `version` | 当前稳定版，如 `3.12`、`26.10.0`。**预发布与已停更仓库不采用**（`v3.15.0rc3`、停更仓库的 tag 都不算） | `releases/latest` 的 tag；无 release 时查官网或官方下载页 |
| `linksCheckedAt` | 核验日期 `YYYY-MM-DD`，表示「外链最近一次确认可达」 | `check-links` 探活通过后填当天 |

写进正文无法机器校验，也无法用于死链巡检（`npm run stale-links`）。留空是有意义的信息——它明确告诉后来人「这里没核过」，而填一个猜的值会让人误以为已核验。

> Mineradio 本身的 `license` 目前还是空的，尽管正文第 4 段写了「GPL-3.0」——它正是「只写在正文里」的反例。注意 `npm run stale-links` **只查 `linksCheckedAt`（链接是否还活着），不查 license 是否缺失**，后者要靠 `content:audit` 或直接查运行库。

## 可直接复制的骨架

```json
{
  "slug": "example-tool",
  "name": "Example Tool",
  "nameZh": "示例工具",
  "aliases": ["ET", "示例"],
  "kind": "opensource",
  "status": "published",
  "source": "opensource",
  "tags": ["图像处理", "批处理", "命令行"],
  "summary": "一句话说清它是什么、和同类比差别在哪。",
  "body": "第一段：它解决什么问题，适合什么流程。\n\n第二段：核心特性，写具体行为，不写「强大」「易用」。\n\n第三段：代价与风险——依赖什么、有没有平台限制、维护状况。\n\n第四段：许可证与发布渠道，说明去哪下。",
  "license": "GPL-3.0-only",
  "version": "2.2.0",
  "linksCheckedAt": "2026-10-04",
  "scenes": ["design"],
  "platforms": ["windows", "macos"],
  "price": "",
  "links": {
    "github": "https://github.com/owner/repo"
  },
  "tutorial": [
    "从 GitHub Releases 下载对应平台的安装包。",
    "首次启动时在系统设置里允许运行。"
  ],
  "whoFor": "要批量处理图片、愿意用命令行的人。",
  "whoNot": "只想点几下就出图、不接受命令行的人。",
  "alternatives": ["gimp"],
  "featured": false,
  "previews": [],
  "icon": { "letter": "E", "color": "#0071e3" }
}
```

填入 `scenes` / `alternatives` 前先确认 id 与 slug 存在（`npm run content:audit` 会列出场景库存；alternatives 必须是已在目录中的 slug）。

**种子里 `links` 与 `officialUrl` 并存时，`links.official` 才是生效字段**（坑位 70）——上面骨架用 `links` 形式。

## 反例：不要这样收

```json
{ "slug": "gimp", "name": "GIMP", "body": "", "tags": [], "previews": [] }
```

这是运行库里 10 条缺正文与标签条目的真实状态（`npm run content:audit` 可查当前数字）——能发布，但详情页没有正文、搜索正文零命中、标签缺失，等于没回答「适不适合」。收录的最低标准：**body 非空 + tags 至少 3 个**。
