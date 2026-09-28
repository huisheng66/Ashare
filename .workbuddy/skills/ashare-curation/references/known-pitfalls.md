# 踩坑库

收录过程中真实踩过的坑。**每次收录结束追加新条目，不删历史**。同一类问题第二次出现时，把它提升进 SKILL.md 主流程，不要继续留在这里。

## 数据落点

1. **改 `data/samples.ts` 对已有部署不生效。** 运行库 `data/store/catalog.json` 只要存在，种子就永不重灌。两条路径都要更新，否则下次重建运行库会丢内容。
2. **种子转换的条目天然缺字段。** `seedToItem()` 只把 `installTips` 映射成 `tutorial`，`body` 和 `tags` 都是空的——2026-09 的运行库里 32 条有 30 条是这样。补内容时不必惊讶，这是设计使然。
3. **`catalog.sha256.json` 必须同步。** 只改 `catalog.json` 不更新旁车，启动时会打「文件可能被改动」告警。写入脚本已自动同步。
4. **种子与运行库会漂移。** 2026-09 的状态：`data/samples.ts` 里有 mineradio，运行库里没有，导致「音乐」场景计数为 0，与 CHANGELOG 记录矛盾。
5. **`seedCatalog()` 不去重 slug。** 种子与 samples 若 slug 撞车会生成重复条目，加种子前先查现有 slug。

## 校验陷阱

6. **破解词是子串匹配。** 写「非绿色版，请用官方渠道」也会被拒。要表达这件事改用「修改包」「非官方打包」。
7. **图片路径必须匹配** `/media/<slug>/<16 位十六进制>.<ext>`。不符合的既读不出来（`app/media/[...path]/route.ts` 返回 404），后台也删不掉。手写路径极易出错，宁可留空。
8. **`icon.simpleIcon` 只有 21 个可用**（`data/icons/`）。缺失会 404 再回退字母图标，不会报错，容易漏检。
9. **后台保留原生表单控件**（select/checkbox/file），因为 Radix 的不参与原生表单事件会破坏草稿恢复——别在后台表单里换 Radix Select。

## 核验陷阱

10. **`curl` / 命令行取不到 ≠ 站点挂了。** simple-icons CDN 就是这样被 Cloudflare 人机验证拦掉的，项目因此把图标改成读本地。抓不到时换 WebFetch 或浏览器工具再判。
11. **`403/405` 多为拦截自动化请求**，不是死链。`check-links.mjs` 会自动回退 GET，仍失败才需人工打开。
12. **主 CTA 优先级固定为 官网 → GitHub → 主页**，网盘镜像永远不做主 CTA（`primaryLink()` 的行为）。

## 渲染行为

13. **`body` 按空行切段**，不解析 Markdown。`**加粗**`、`- 列表` 会原样显示成文本。
14. **`price` 影响结构化数据**：留空才输出 `offers.price = "0"`；填了价格就不再输出 offers——不要给付费条目谎报免费。
15. **`status: "draft"` 前台完全不可见**（`allPublished` 过滤），可以先用草稿态入库再慢慢补。

## 2026-09-28 首次实战（音乐场景 3 条）新增

16. **github.com 网页端直连会超时，api.github.com 却可达。** 本机探测时 3 个 GitHub 链接全部 8s 超时，官网都正常——差点误判成死链。`check-links.mjs` 已加 GitHub API 代验回退。以后看到 GitHub 链接「失败」先怀疑网络策略，而不是项目归档。
17. **仓库的 `homepage` 字段不一定是官网。** Audacity 的 homepage 指向 `wiki.audacityteam.org/wiki/For_Developers`（开发者 wiki），真官网是 `audacityteam.org`。填 `links.official` 要用常识判断加探活确认。
18. **GitHub 的 `license` 字段可能是 `NOASSERTION`。** Audacity 就是如此，需交叉看 topics（`gplv2`）与仓库内 LICENSE 文件；仍拿不准就在正文写「请自行核对 LICENSE」，不要硬填版本号。
19. **种子里的 `price` 有写成「免费」的**（mineradio）。这与「留空视为免费」不一致：填了值就不会输出 JSON-LD 的 `offers`，且卡片显示重复。新条目统一留空。
20. **种子与运行库不一致时，`content:audit` 读的是运行库。** 本次音乐场景显示 0 条，但种子里其实有 mineradio——审计数字反映的是线上真实状态，别拿种子当依据。

## 2026-09-28 第二批（补齐空壳 5 条）新增

21. **种子形态与运行库形态不是一回事。** `data/software.ts` 的条目用 `officialUrl` / `officialLabel` / `installTips`，运行库用 `links` / `tutorial` / `body` / `tags`。改种子时不能直接把运行库的字段粘过去。
22. **`seedToItem()` 历史上会把 `body` 硬编码成 `""`、`tags` 硬编码成 `[]`。** 也就是说补进运行库的正文，全新部署时会全部丢失——只剩 30 条空壳。已改为透传（种子新增可选 `body` / `tags` / `kind` / `links`，缺省行为不变），并由 `tests/seed.test.mjs` 守住；再加可透传字段必须同步补测试，否则会静默丢字段。
23. **`links` 是对象映射，不是数组。** 形如 `{ official, github, disk, diskNote }`。写一次性 `node -e` 统计时用 `Array.isArray(item.links)` 判断会得出「全部条目都没链接」的错误结论。要统计就用 `npm run content:audit -- --json`，别临时写判断。
24. **`source` 决定徽章，`kind` 决定筛选，两者可以不一致，改的时候要一起想。** GeoGebra 种子标 `source: "opensource"` 被推导成 `kind: "opensource"`，但它其实源码公开、许可闭源——前台会显示「开源」徽章。修正要同时改 `source: "official"` 和 `kind: "app"`。
25. **判断「是否开源」不能只看有没有 GitHub 仓库。** GeoGebra 的 GitHub 仓库 `license` 字段是 `null`；开源与否以许可证为准，不是以源码可见为准。`source: "opensource"` 会直接渲染成开源徽章，误标比不标更糟。
26. **跨场景混批会破坏「一批一提交」。** SKILL 要求一次一个场景，但补历史空壳时最容易顺手挑「最缺的 5 条」——结果 blender/dbeaver/figma/freecad/geogebra 跨了 4 个场景，CHANGELOG 只能分组写。补字段也要按场景分批。

## 2026-09-28 第三批（设计场景 3 条）新增

27. **`--patch` 是顶层浅合并，`links` 这种嵌套对象会被整个替换。** 只想加 `links.github` 却在草稿里写了 `links: { github: ... }`，官网链接会被抹掉。补链接必须把已有的 key 一起写回。
28. **探活异常 ≠ 死链，改地址前必须人工复核。** 全量 39 个链接里 4 个异常，只有 1 个是真的：krita 的 `krita.org/download/` 已 404（正确地址 `krita.org/en/download/`）。inkscape.org 与 jasp-stats.org 的 403 是 Cloudflare 拦自动化——换成浏览器 UA 就 200；texstudio.org 的超时是本机代理隧道失败，站点活着（4.9.8）。
29. **许可证目录可能是 REUSE 多许可。** Inkscape 的 `LICENSES/` 同时含 GPL-2.0-or-later 与 GPL-3.0-or-later，GitLab API 的 `license` 字段还是空的。这种情况不要写死版本，正文写「GPL 系列，以官网声明为准」并说明核验受限。反例：GIMP 的 `COPYING` 明确是 GPLv3，可以直接写。
30. **GitHub 上的项目可能是过期镜像。** `inkscape/inkscape` 的 `pushed_at` 停在 2022，上游其实在 gitlab.com。用 GitHub 核验会拿到陈旧信息——先看仓库的 `homepage` 或 `pushed_at` 判断是不是上游。
31. **Git host 白名单只含 gitlab.com，不含自托管实例。** GIMP 上游在 `gitlab.gnome.org`、Krita 在 `invent.kde.org`，两者都填不进 `links.github`（会被校验拦下）。这类条目只留官网链接即可，不要为了凑 GitHub 链接去填镜像。

## 2026-09-28 第四批（制图场景 3 条）新增

32. **数据检查全绿 ≠ 页面是对的。** 前几批只跑 `npm run check` 与 `content:audit`，从没真的打开过详情页——这两者都只碰数据。现在补了 `scripts/smoke-detail.mjs`（`npm run smoke:detail`，需先起 dev），逐条验证正文每段渲染、外链出现、徽章与 `source` 一致、价格展示。
33. **判断徽章不能全文搜「开源」。** 页脚的收录标准说明和「同类替代」里的其他条目都会带出这个词，全文搜一定误报。按 CSS 类判断：官方 `text-official`、开源 `text-opensource`、优惠 `text-discount`。
34. **后台任务里用 `npm run dev &` 起的服务会被回收。** 后台 Bash 任务结束时子进程跟着没了，端口连不上。要让服务常驻就把 `npm run dev` 本身作为后台任务运行，不要加 `&`。
35. **本机访问 localhost 要走 `--noproxy '*'`。** 环境里配了代理，curl 直连 127.0.0.1 会拿到 502（CONNECT tunnel failed），看起来像服务没起来。这个坑同样解释了 texstudio.org 的「超时」——那是代理隧道失败，站点其实是好的。
36. **`content-audit --scene` 只收窄统计与待补清单，场景库存仍按全量算。** 否则会显示出「其他场景 0 条」这种误导数字（第一版实现就踩了）。

## 2026-09-28 第五批（办公场景 3 条）新增

37. **API 的 `license` 拿不到时，直接读上游 LICENSE 文件比反复试 API 快。** 本批三个项目：LocalSend 是 Apache-2.0（API 直接给出），Joplin 是 NOASSERTION（读 LICENSE 才知道是 AGPL-3.0-or-later，且部分子目录另有声明），Thunderbird 根本不在 GitHub（源码在 hg.mozilla.org，官网 about 页确认 MPL-2.0）。
38. **许可证可能带附加条款，正文要照实写。** Joplin 的 LICENSE 里还写着「Joplin® 是 JOPLIN SAS 的注册商标，图标与 logo 需授权才能使用」——这类限制比许可证本身更容易被二次分发者踩到，值得单独写进正文。
39. **跨场景条目按 `scenes[0]` 归属，否则会被两批同时跳过。** joplin 是 `["office","docs"]`、obsidian 是 `["docs","office"]`——如果按「出现在该场景就算」来挑批，两边都会以为对方会处理。`content-audit --scene` 现在会把主场景不一致的条目标出来。
40. **冒烟脚本需要 dev 服务常驻，但后台任务里用 `&` 起的服务会被回收。** 把 `npm run dev` 本身作为后台任务跑；用完后记得停掉，别占着端口。

## 2026-09-28 第六批（开发场景 3 条）新增

41. **`--patch` 的每个字段是整体替换，不是追加。** 第二批给 blender / dbeaver / figma / freecad / geogebra 补 `aliases` 时只写了新别名，把原有的「3d」「建模」「sql 客户端」全覆盖了，而且漏同步种子——靠 `npm run seed:drift` 才发现。补别名必须把原有的带上。
42. **`aliases` 漂移最难被发现。** 它不影响详情页观感，也不计入「完成标准」的硬检查，同步漏了没人看得出。写完两个落点一定要跑 `npm run seed:drift`。
43. **「GPL-2.0」不等于「GPL-2.0-or-later」。** Git 的 COPYING 明确写「本项目只认 GPL 第二版这一份（v2，不是 v2.2 或 v3）」，是 GPL-2.0-only。写成 or-later 是错的。反过来 Inkscape 的 REUSE 目录两种都有，那就只能写范围。
44. **许可证名称要按原文写，不要套用常见缩写。** Python 是 PSF License Version 2，不是 MIT 也不是 GPL；Node.js 的 LICENSE 是 MIT 但注明「仓库内含第三方组件，各自另有许可」。这类差异对二次分发有实际影响，正文照实写。
45. **脚本可以通过 `import "../data/software.ts"` 直接读种子。** Node 的类型擦除能处理 `.ts`（该文件的 `import type` 在运行时被移除），所以 `seed-drift.mjs` 不需要正则去解析 TS——直接导入比解析可靠得多。

## 2026-09-28 第七批（文档场景 3 条）新增

46. **同一地址不同工具结论可能相反，探活失败要交叉验证再下结论。** `obsidian.md/download` 第一次探活超时 10000ms，重跑就是 200；用 `curl --noproxy '*'` 直连又是 000（连不上），而走代理的脚本是 200。工具、代理、DNS 各有各的失败方式——单次失败只能说明「这条路径不通」，不能说明站点挂了。脚本现在默认失败后重试 1 次（`--retries 0` 关闭）。
47. **`check-links` 以前只能测已入库的链接，选题阶段没法用。** 核验候选地址时只能先用 curl 手测，结果还和脚本不一致。现在支持 `--url <地址>` 直接测，写入前先把候选地址过一遍，别把错地址写进库再回头改。
48. **有社区插件仓库不等于开源，判断依据是主程序的许可证。** Obsidian 的插件生态几乎全开源，但主程序是专有软件（个人免费、商业付费），`source` 应为 `official`、`kind` 应为 `app`，正文要明说「不是开源项目」。反过来也成立：没有公开仓库不代表闭源。同理，`links.github` 只填上游，别拿社区仓库凑。
49. **`--patch` 的字段清单要原样同步到种子。** 第七批草稿改了 `aliases`/`tags`/`body`/`links` 四项，运行库写完只同步了后三项，`aliases` 又被漏掉——`seed:drift` 报出 3 条不一致。这是第二次栽在同一个字段上（见 #41）。写种子时照着草稿的字段名逐项核对，不要凭印象。

## 2026-09-28 精简与安全加固（第八轮）新增

50. **`--url` 让脚本能请求任意地址，必须防 SSRF。** 上一轮给 `check-links` 加了 `--url` 却没有限制目标：候选地址若来自网页或投稿，脚本就会去打 `169.254.169.254`（云元数据）、内网管理口、`file://`。现在抓取统一走 `safeFetch`：只放行 http/https、预解析 DNS 拒绝私有/保留网段、`redirect: "manual"` 手动跟随并**逐跳**校验。测本机服务用 `--allow-private`，但它**只放行第 0 跳**——否则「测一下 dev server」会被一个 302 带进内网。
51. **IPv6 的私有段判断容易写错位宽。** 第一版取首段的前 8 位去比 `fe80::/10`，结果 `fe80::1` 判成了公网地址。正确做法是取首段前 16 位：`head & 0xfe00 === 0xfc00`（fc00::/7）与 `head & 0xffc0 === 0xfe80`（fe80::/10）。改完用 16 个地址的用例表回归。
52. **`--keep` 是 `fs.rm -r`，只认自己产出的快照。** 名字符合 `ashare-backup-YYYYMMDD-HHMMSS` 不代表是本脚本写的——万一 `--out` 指到的目录里本来就有同名文件夹呢。现在删除前要求目录内有带 `createdAt` 的 `manifest.json`，归档则用 `tar -tzf` 确认含 manifest，否则跳过并提示。
53. **全量探活每轮都会报同样 4 个「异常」，全是误报。** inkscape.org / jasp-stats.org 的 403 是 Cloudflare 拦自动化，texstudio.org / gimp.org 的超时是本机代理隧道。脚本现在对这几个域名附一句「已人工确认」的提示，省掉每轮重复的人工复核；但提示带日期，过期要重验，别让它变成掩盖真死链的遮羞布。
