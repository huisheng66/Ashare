# 收录判定与来源核验

## 三类条目

| kind | 含义 | 典型来源 |
|---|---|---|
| `app` | 厂商正式版应用，含免费档与厂商写明的优惠入口 | 官网下载页、Microsoft Store、Mac App Store |
| `script` | 可复现的脚本与小工具 | 单文件脚本、CLI 工具、浏览器油猴脚本 |
| `opensource` | 开源项目的官方发行渠道 | GitHub Releases、Gitee Releases、项目官网 |

`kind` 描述条目形态，`source` 描述来源属性，两者独立：`official`（官方渠道）、`opensource`（开源发布）、`discount`（有优惠渠道）。徽章始终带文字，不靠颜色单独表意。

## 拒绝清单

后台 `saveItem` 会扫描 `name / summary / body / whoFor / whoNot / tags / tutorial / diskNote`，命中下列任一即拒绝保存：

`破解`、`序列号`、`绿色版`、`激活码`、`注册机`、`盗版`、`crack`、`keygen`、`nulled`

注意这是子串匹配——写「非绿色版，请只用官方渠道」也会被拒。要说这件事，改用「修改包」「非官方打包」这类表述。

同时不收录：非官方汉化包、商业软件盗版分发、需要序列号才能用的版本。

## 镜像（网盘）规则

1. 必须先填 `links.official` 或 `links.github`——镜像只能作补充，不能是唯一来源。
2. 必须填 `links.diskNote`：写明是谁提供的镜像、核验结论。
3. 镜像永远不做主 CTA。`primaryLink()` 的优先级固定为 官网 → GitHub → 主页。
4. 作者或项目方自己公开的网盘链接才算已核验；第三方转存不收。

## 核验清单

每条收录前逐项确认，把结论写进 `diskNote` / `discountNote` / CHANGELOG：

- [ ] 官网可达（用 `check-links.mjs`，403/405 需人工打开确认）
- [ ] 许可证确认（GitHub 看 LICENSE 文件与仓库头部的 license 字段，不要只信 README 的一句话）
- [ ] 平台确认（看 release 资产：`.exe` / `.msi` / `.dmg` / `.pkg` / AppImage / deb）
- [ ] 价格口径（免费 / 买断 / 订阅 / 有免费档），写进 `price`
- [ ] 最近更新时间（GitHub 看 latest release 日期；停止维护的要在正文里说明）
- [ ] 图标是否已有 `data/icons/<名>.svg`（现有 21 个：apple、blender、figma、freecad、gimp、git、gnuoctave、inkscape、jupyter、kicad、krita、libreoffice、linux、nodedotjs、obsidian、python、qgis、rstudio、syncthing、thunderbird、visualstudiocode）

## 核验手段

```bash
# GitHub 元数据
gh api repos/{owner}/{repo}
gh api repos/{owner}/{repo}/releases/latest

# 链接探活（批量）
node .workbuddy/skills/ashare-curation/scripts/check-links.mjs --all
```

命令行 `curl` 常被 Cloudflare 人机验证拦截（simple-icons CDN 就是这样失效的，项目因此把图标改成读本地 `data/icons/`）。抓不到时改用 WebFetch 或浏览器工具，不要因为命令行取不到就判定站点挂了。

## 核验陷阱（容易判错的地方）

- **仓库的 `homepage` 不一定是官网。** Audacity 的指向开发者 wiki。用常识加探活确认真正的官网地址。
- **许可证字段可能是 `NOASSERTION`。** 交叉看仓库 topics 与 LICENSE 文件；上游用 REUSE 多许可目录时（Inkscape 同时含 GPL-2.0 与 GPL-3.0），**宁愿写范围也不写死版本**，正文写「GPL 系列，以官网声明为准」并说明核验受限。误标许可证比不标更糟。
- **确认你查的是上游，不是过期镜像。** 有的项目 GitHub 仓库停在几年前（Inkscape 的镜像停在 2022），上游在 gitlab.com。看 `pushed_at` 与 `homepage` 判断。
- **Git 白名单只含 `github.com` / `gitlab.com` / `gitee.com` / `codeberg.org`。** 自托管实例（`gitlab.gnome.org`、`invent.kde.org`、`hg.mozilla.org`）填不进 `links.github`，这类条目只留官网链接。
- **探活异常不等于死链。** 实测 39 个链接里 4 个异常，只有 1 个是真死链——其余是 Cloudflare 拦自动化（换浏览器 UA 即 200）或本机代理问题。`403/405/超时` 都先人工确认再改 URL。
- **同一地址换工具结论可能相反。** `obsidian.md/download` 出现过：脚本首测超时 10s、重跑 200、`curl --noproxy` 直连 000。单次失败只说明「这条路径不通」。探活脚本默认会重试 1 次。
- **脚本输出「GitHub API 代验」是正常的**：github.com 网页端可能被网络策略拦住，脚本改用 api.github.com 确认同一仓库存在。
- **插件开源不等于主程序开源。** Obsidian 的插件生态几乎全开源，主程序却是专有软件——判定看主程序的许可证，不是看有没有公开仓库。

## 要如实写进正文的风险

第三方依赖、未签名、平台限制这类信息，是目录站可信度的来源，不要因为「不好看」而省略。参考 `data/samples.ts` 中 mineradio 的写法：明确写出「接入网易云音乐与 QQ 音乐的账号、搜索与歌单，因此登录态和可用性依赖这些平台的接口」「安装包未签名，Windows SmartScreen 首次运行会提示风险」。

## 拿不准时

来源性质无法核实（找不到官网、许可证缺失、下载页疑似第三方托管）→ 不收录，或先以 `status: "draft"` 入库，不要凭印象填来源字段。
