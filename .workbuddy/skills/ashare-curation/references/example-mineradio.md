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

## 反例：不要这样收

```json
{ "slug": "gimp", "name": "GIMP", "body": "", "tags": [], "previews": [] }
```

这是当前运行库里 30 条的真实状态——能发布，但详情页没有正文、搜索正文零命中、标签缺失，等于没回答「适不适合」。收录的最低标准：**body 非空 + tags 至少 3 个**。
