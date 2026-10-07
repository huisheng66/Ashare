// 第 7 条：esp32-c3-adblock。内容全部核实自官方 README（Why this is interesting
// 对比表、Hardware、Build & flash、Security 三节、4MB flash tradeoff），未凭印象。
export const entries = {
  "esp32-c3-adblock": {
    slug: "esp32-c3-adblock",
    name: "esp32-c3-adblock",
    nameZh: "ESP32-C3 广告拦截器",
    aliases: [
      "esp32-c3-adblock",
      "esp32 c3",
      "esp32",
      "adblock",
      "pi-hole",
      "pihole",
      "dns 拦截",
      "广告拦截",
    ],
    summary:
      "跑在 2 美元 ESP32-C3 上的 DNS 广告拦截器：哈希存 flash 不用 PSRAM，14 万域名占 0.7MB 闪存、约 50KB 内存。",
    scenes: ["tools", "code", "data"],
    platforms: ["linux", "windows", "macos"],
    source: "opensource",
    tags: ["DNS", "广告拦截", "ESP32", "IoT", "开源"],
    body:
      "这是一个 Pi-hole 式的 DNS 广告拦截器，跑在一块 2 美元的 ESP32-C3 上，而且**不需要 PSRAM**。\n**技术上真正有意思的地方是它怎么存列表。** 多数 ESP32 DNS sinkhole 把域名列表（字符串）读进内存，所以要求外加 PSRAM；这个项目把域名存成**排序后的 40 位哈希写进 flash**，再二分查找。14 万多个域名占约 0.7MB flash，查询约 10 毫秒（含 WiFi 往返），内存只吃约 50KB。\n为什么是 40 位？这是那份 flash 预算下的甜点。碰撞按生日界算：14 万域名约 0 个碰撞，53.7 万时约 1 个（也就是有一个倒霉域名被误拦）。降到 32 位能省 20% flash，但 25 万域名时就会撞约 7 次；上 64 位则每个域名多浪费 3 字节去解决一个你不存在的问题。\n作者还说明这**不是 C3 的将就方案**：同样的技巧在更大的芯片上更划算——16MB flash 的 ESP32-S3 上用哈希能放约 270 万域名，而用字符串配 8MB PSRAM 只能放约 46.6 万。「哈希存 flash」在多数场景下都胜过「字符串存 PSRAM」，C3 只是把这个差距变得无法忽视。\n**功能上它做完了该做的事。** 屏蔽一个域名会连带屏蔽其子域名。支持 hosts 文件、纯域名列表、AdGuard/Adblock 基础规则（\`||ads.example.com^\` 屏蔽、\`@@||ok.example.com^\` 解除）三种格式的混合输入；正则、通配符、\`$\` 修饰符、双井号开头的装饰性规则这类 DNS 哈希列表表达不了的会被跳过并计数。首次 USB 烧录之后，固件和列表都能走 WiFi 更新——列表可以上传新构建的 blocklist.bin，也可以配一个 URL 让设备定期拉取，而默认列表每周一由 GitHub Actions 重新构建发布。WiFi 配网有开放热点 \`C3-AdBlock-XXXX\` 加捕获门户，不用重新烧录。\n**安全这一节要读，它写得比多数同类项目诚实。** 所有会改状态的端点都需要 HTTP Basic Auth；更关键的是每个变更端点还要求一个自定义 \`X-Requested-With: c3-adblock\` 头——因为浏览器会把缓存的 Basic Auth 凭据自动附到任何后续请求上，包括别的网页用一个图片标签指向 c3adblock.local/forgetwifi 触发的请求，没有 JS 也能做到。README 明说了 Basic Auth 在这里是**局域网信任边界控制，不是加密**：所有东西跑在 80 端口的明文 HTTP 上，这颗芯片没有现实预算跑 TLS；能嗅到你局域网流量的人可以离线读到 base64 的凭据。它防的是「同一网络里某个设备无凭据地调 API」和「浏览器标签页 CSRF」，不防路径上的攻击者。默认密码 \`CHANGE_ME_WEB_PASSWORD\` 是仓库里公开的值，固件会告警但**仍会正常启动**。\n代价与取舍：一块 ESP32-C3（SuperMini 约 2 美元）、需要稳定的 USB 供电（廉价松垮的转接头会在 WiFi 发射时让射频掉电）。4MB flash 有个硬取舍：固件 OTA 需要两个应用槽，留给列表约 1.3MB（**最多约 25 万域名**）；53.7 万的激进列表只装得下单应用分区表，那就**没有固件 OTA**了。这个选择在 partitions.csv 里。",
    officialUrl: "https://github.com/M-Abozaid/esp32-c3-adblock",
    links: {
      official: "https://github.com/M-Abozaid/esp32-c3-adblock",
      github: "https://github.com/M-Abozaid/esp32-c3-adblock",
    },
    officialLabel: "github.com/M-Abozaid/esp32-c3-adblock",
    whoFor:
      "有 ESP32-C3 或愿意买一块 SuperMini、想用一个不占内存的本地 DNS 拦掉全网广告，并且愿意自己烧录和配置列表的人。",
    whoNot:
      "要开箱即用图形界面的人（它是固件加一个网页面板，没有桌面应用）；或者对明文 HTTP 广播密码不放心的人——它明确说了这不是加密方案。",
    installTips: [
      "买 ESP32-C3 SuperMini（约 2 美元，4MB flash），不要买需要 PSRAM 的经典 ESP32——这套方案就是冲着「不用 PSRAM」去的。",
      "供电要稳：手机充电器或路由器 USB 口都行，廉价松垮的 USB-C→A 转接头会在 WiFi 发射时让射频掉电。USB-A→USB-C 转头可以直接插路由器背后的空闲 USB 口，不用电源和额外盒子。",
      "PlatformIO 必须用新版。发行版/apt 里的 platformio（比如 4.3.4）太老，会报 AttributeError: ... 'resultcallback'。",
      "烧录前先 cp src/secrets.example.h src/secrets.h 改密码。默认密码是仓库里公开的值，固件只告警不阻止启动。",
      "装外壳时天线端要留空：C3 的 PCB 天线是 USB-C 口对面短边上的折线，不要埋进塑料或靠近金属，否则 RSSI 会掉。层高 0.2mm、约 15% 填充，不需要支撑。",
    ],
    alternatives: [],
    icon: { letter: "E", color: "#2B6CB0", simpleIcon: "raspberry-pi" },
    guide: {
      intro: "从烧录一次到之后只走 WiFi 更新，重点讲清 4MB flash 那个必须自己做的取舍。",
      markdown: `# esp32-c3-adblock：2 美元硬件上的 DNS 拦截

## 它凭什么不用 PSRAM

一句话：把域名存成**排序后的 40 位哈希写进 flash**，查询时二分查找。

\`\`\`text
查询进来 ──▶ 提取域名 ──▶ FNV-1a 哈希（含父后缀）
         ──▶ 二分查找 flash 哈希表
              ├─ 命中 ──▶ 回 0.0.0.0   （已拦截）
              └─ 未命中 ──▶ 转发给上游解析器，原样带回结果
\`\`\`

对比一下两种做法：

| | 字符串读进内存 | 本项目（哈希进 flash） |
|---|---|---|
| 硬件 | ESP32 + PSRAM（约 8 美元） | ESP32-C3，无 PSRAM（约 2 美元） |
| 14.1 万域名 | 约 2.5MB 内存 | **0.67MB flash** |
| 内存占用 | 大部分内存 | **约 50KB** |
| 查询方式 | 字符串比较 | 约 18 次 flash 读（含 WiFi 往返约 10ms） |
| 碰撞 | 不存在 | 14.1 万时 0 个，53.7 万时 1 个 |

**为什么是 40 位？** 这是那份 flash 预算下的甜点，碰撞按生日界算。降到 32 位省 20% flash，但 25 万域名时约 7 个碰撞；上 64 位每个域名多浪费 3 字节解决一个你不存在的问题。

这个技巧在更大的芯片上更划算，不是 C3 的将就：16MB flash 的 ESP32-S3 上哈希能放约 270 万域名，字符串配 8MB PSRAM 只能放约 46.6 万。

## 硬件

- 任意 **ESP32-C3** 开发板（测试用 C3 SuperMini），4MB flash，**不需要 PSRAM**
- 经典 ESP32（DevKit / WROOM，4MB）也能编：\`pio run -e esp32dev -t upload\`（社区贡献、仅编译验证，C3 才是测试目标）
- **供电要稳**：手机充电器或路由器 USB 口。廉价松垮的 USB-C→A 转接头会在 WiFi 发射时让射频掉电
- **USB-A → USB-C 转头**可以直接插路由器背后的空闲 USB 口，不需要电源、不需要额外盒子

仓库里有个 C3 SuperMini 的可打印外壳（\`hardware/esp32-c3-supermini-enclosure.stl\`）。打印要点：不需要支撑，层高 0.2mm、约 15% 填充；**天线端必须留空**——C3 的 PCB 天线是 USB-C 口对面短边上的折线，埋进塑料或靠近金属会掉 RSSI；通风口留着，板子空闲时约 45-55°C。

## 烧录（一次性）

需要较新的 PlatformIO：VSCode 的 PlatformIO 扩展自带的内核，或在 venv 里 \`pip install -U platformio\`。**发行版/apt 里的 platformio（比如 4.3.4）太老**，会报 \`AttributeError: ... 'resultcallback'\`。

\`\`\`bash
# 1. 复制 secrets 模板（已 gitignore，留在本地）并编辑
cp src/secrets.example.h src/secrets.h

# 2. 构建列表哈希表（默认 = StevenBlack base + Hagezi Light，约 10 万条）
python3 tools/build_blocklist.py data/blocklist.bin

# 3. 烧录固件 + 列表文件系统（唯一一次需要 USB）
pio run -t upload
pio run -t uploadfs

# 4. 看它启动，记下 IP / 打开面板
pio device monitor          # -> http://c3adblock.local
\`\`\`

\`WIFI_SSID\` / \`WIFI_PASS\` 可以留占位符，用设备上的配网门户。但 **\`WEB_USER\` / \`WEB_PASS\` / \`OTA_PASS\` 不是可选的**——它们守着面板上所有会改状态的端点和网络 OTA，必须填真值。

## 配网不用重烧

连不上（或者从没设过 \`secrets.h\`）时，它会开一个开放热点 **\`C3-AdBlock-XXXX\`** 带捕获门户。手机连上，选你的网络，输密码，完成。

换网络时：面板上点 **Forget WiFi**，或者开机时按住 **BOOT** 键，门户会重新出现。

## 之后只走 WiFi

面板（\`http://c3adblock.local\`）里都能做：

- **列表更新** —— 把新构建的 \`blocklist.bin\` 传到 Blocklist → Upload；或者在 Remote auto-update 里设一个 URL，设备按计划拉取。默认列表**每周一**由 GitHub Actions 重建并发布到固定地址，贴一次之后设备自己保持新鲜
- **固件更新** —— 把 \`.pio/build/c3/firmware.bin\` 传到 Firmware → OTA update，设备校验后重启进新镜像；也可以从命令行推：

\`\`\`bash
pio run -t upload --upload-port c3adblock.local --upload-protocol espota
\`\`\`

## 你必须自己做的取舍

**4MB flash 装不下所有东西。** 固件 OTA 需要两个应用槽，这会留下约 1.3MB 给列表，也就是**最多约 25 万域名**。而 53.7 万域名的激进版「ultimate」列表只装得下单应用分区表，**代价是没有固件 OTA**。

这个选择写在 \`partitions.csv\` 里。默认配置下 25 万域名是安全的选择。

## 自定义列表

\`build_blocklist.py OUT.bin [SOURCE ...]\` 接受 URL 和本地文件的任意混合，支持三种格式：

- **hosts 文件** —— \`0.0.0.0 ads.example.com\`
- **纯域名列表** —— 每行一个域名
- **AdGuard / Adblock 基础规则** —— \`||ads.example.com^\` 屏蔽，\`@@||ok.example.com^\` 解除

两个行为要知道：屏蔽一个域名会连带屏蔽其子域名；\`@@\` 规则**只解除那一条精确记录**，不能从被屏蔽的父域名下把某个子域挖出来。

DNS 哈希列表表达不了的规则（正则、通配符、\`$\` 修饰符、\`##\` 装饰性规则）会被跳过并计数。某个源下载不到时构建会**直接停止**，不会静默产出一个更短的列表（要跳过用 \`--allow-missing\`）。

## 安全：先读这一段

**所有改状态的端点都要 HTTP Basic Auth**：\`/ban\`、\`/addblock\`、\`/unblock\`、\`/forgetwifi\`、\`/upload\`、\`/update\`、\`/setupdate\`、\`/fetchnow\`。只读的 \`/\` 和 \`/stats.json\` 保持开放。

**但 Basic Auth 在这里是局域网信任边界控制，不是加密。** README 自己说得很直白：所有东西跑在 80 端口明文 HTTP 上，这颗芯片没有现实预算跑 TLS；凭据是 base64 每次请求都发，能嗅你局域网流量的人（开放 WiFi、ARP 欺骗）可以离线读到。它防的是「同网络某个设备无凭据调 API」和「浏览器标签页 CSRF」，**不防路径上的攻击者**。

还有一个更隐蔽的洞已经修了：浏览器会把缓存的 Basic Auth 凭据自动附到任何后续请求上——包括别的网页用一个 \`<img src="http://c3adblock.local/forgetwifi">\` 触发的请求，不需要 JS。所以每个变更端点还要求一个自定义 \`X-Requested-With: c3-adblock\` 头，\`\<img\>/自动提交的 \`<form>\` 附不上，只有同源 \`fetch()\` 能附。这也是为什么 \`/forgetwifi\` 不再是一个能直接访问的裸 URL，要用面板上的按钮。

**默认密码必须改。** 如果 \`secrets.h\` 里还是示例文件的 \`CHANGE_ME_WEB_PASSWORD\` / \`CHANGE_ME_OTA_PASSWORD\`，设备会带着一个公开的密码启动——固件会在串口打警告、在面板上显示横幅，但**它照样启动运行**。

配网门户的开放热点（\`C3-AdBlock-XXXX\`）是设计如此、不加密的：它得能在你还不知道密码的时候被连上。

## 验证

把设备的 DNS 指向 C3 的 IP，或者把它作为主 DNS 后面的**备用解析器**加进去。然后：

\`\`\`bash
dig @<c3-ip> doubleclick.net   # -> 0.0.0.0  （已拦截）
dig @<c3-ip> github.com        # -> 真实 IP  （已转发）
\`\`\`

## 硬件侧的两个提示

第一，**别用松垮的转接头**。第二，外壳打印时**天线端留空**——C3 的 PCB 天线是 USB-C 对面短边上的折线。这两个是这类小项目最容易踩、也最难排查的坑。
`,
      resources: [
        {
          kind: "link",
          title: "README 全文：技术原理、烧录步骤与安全模型",
          url: "https://github.com/M-Abozaid/esp32-c3-adblock/blob/main/README.md",
          note: "最该读的是 Security 一节——README 明说 Basic Auth 是局域网信任边界控制而非加密，并解释了为什么每个变更端点还要额外要求 X-Requested-With 头。",
        },
        {
          kind: "link",
          title: "build_blocklist.py：把各种格式的列表编译成 flash 哈希表",
          url: "https://github.com/M-Abozaid/esp32-c3-adblock/blob/main/tools/build_blocklist.py",
          note: "支持 hosts 文件、纯域名列表、AdGuard 基础规则三种输入混合；源下载失败会直接中止而不是静默产出更短的列表。",
        },
        {
          kind: "link",
          title: "Releases：预构建固件与每周一的列表构建产物",
          url: "https://github.com/M-Abozaid/esp32-c3-adblock/releases",
          note: "blocklist 标签下的 blocklist.bin 是固定的周期性产物 URL，贴进面板的 Remote auto-update 就能保持列表自动新鲜。",
        },
      ],
    },
  },
};
