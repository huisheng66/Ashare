// 从 GitHub 热榜录入的条目。逐条核实官方文档后写入，不凭印象。
// 由 scripts/add-trending.mjs 校验并并入 data/software.ts。
//
// 本批目标：实用工具优先（AI/agent 类同质化严重且生命周期短，不占名额）。
// 顺带补齐 content-audit 指出的空场景（tools / games / photo / education / social）。
export const entries = {
  caddy: {
    slug: "caddy",
    name: "Caddy",
    nameZh: "Caddy",
    aliases: ["caddy", "caddyserver", "web 服务器", "https 服务器", "反向代理"],
    summary: "写几行配置就自动拿到 HTTPS 证书，反代和静态文件一起搞定，不需要碰证书续期。",
    scenes: ["code", "engineering"],
    platforms: ["windows", "macos", "linux"],
    source: "opensource",
    tags: ["Web 服务器", "HTTPS", "反向代理", "开源"],
    body:
      "Caddy 是用 Go 写的 HTTP 服务器，主打「HTTPS 不用配」。传统做法是 certbot：申请证书、配续期定时任务、处理续期失败。少一步就掉链子——续期任务静默失败，证书过期那天才发现。Caddy 把这件事写进了协议本身：Caddyfile 里出现一个真实域名，它就自动申请并续期证书，没有定时任务可配。\n配置是单文件 Caddyfile，语法接近 nginx 但短得多。常见需求——静态目录、反向代理、自动跳转 https、gzip——各是一两行。反向代理开箱支持 WebSocket，不用额外配置。\n代价要提前知道：配置文件位置不统一，官方不强制，macOS 与 Windows 随安装方式变；模块多但概念少，碰到冷门需求可能要落到 JSON 配置；数据目录里存着 TLS 私钥，不能当缓存清。适合已经决定「就用它」的人——从 nginx 迁过来要重写配置，收益未必抵得上重写成本。",
    officialUrl: "https://caddyserver.com/",
    links: {
      official: "https://caddyserver.com/",
      github: "https://github.com/caddyserver/caddy",
    },
    officialLabel: "caddyserver.com",
    whoFor: "要把自己的服务暴露到公网、需要一张可信的 HTTPS 证书，又不想学 certbot 与续期 cron 的人。",
    whoNot: "只在本机跑个开发服务器；或者已经在同一台机器上用 nginx 跑得顺，不打算为自动证书换掉它。",
    installTips: [
      "Debian/Ubuntu 别直接用 apt 源里的包，版本往往落后好几轮。官方仓库要先导入 signing key 再装。",
      "装完先看 systemctl status caddy 有没有起来。装包会自动注册并启动 systemd 服务，不需要手动 run。",
      "证书要放在数据目录里，那个目录不能当缓存清——里面有私钥和 OCSP staple，清了要重新申请。",
    ],
    // 站内暂无同类 Web 服务器。与其塞一个不相干的工具，不如留空——
    // 详情页的 alternativesOf 会安全降级，读者不会看到错乱的推荐。
    alternatives: [],
    icon: { letter: "C", color: "#2D3142", simpleIcon: "caddy" },
    guide: {
      intro: "以「第一次部署会卡在哪」为主线：自动 HTTPS 到底做了什么、80/443 端口为什么必须留着、改配置为什么不能重启、以及数据目录为什么不能清。",
      markdown: `## 自动 HTTPS 到底省掉了什么

传统做法是 certbot 或 acme.sh：申请证书、配置续期定时任务、处理续期失败。少一步就掉链子——续期任务静默失败，证书过期那天才发现。

Caddy 把这件事写进了协议本身：**Caddyfile 里出现一个真实域名，Caddy 就自动去申请证书并自己续期**，不用配任何定时任务。

最小配置只有一行：

\`\`\`caddy
example.com {
    root * /var/www/html
    file_server
}
\`\`\`

这一个块做了三件事：监听 80 与 443、为 \`example.com\` 申请并续期证书、把 \`/var/www/html\` 当静态目录发出去。

## 端口不能省

80 和 443 要同时留着。80 端口不是「http 的备用口」，验证和跳转都要用：Let's Encrypt 的 HTTP-01 验证走 80 端口，所有 http 请求也靠它跳到 https。

Caddy 默认在这两个端口上监听。改端口配置去做非标准端口当然可以，但那样就**失去了自动 HTTPS**——证书验证和跳转都依赖标准端口。

容器里要注意：镜像默认不会占用宿主机的 80/443，映射时显式写出来。

\`\`\`bash
docker run -d -p 80:80 -p 443:443 -p 443:443/udp \\
  -v $PWD/Caddyfile:/etc/caddy/Caddyfile \\
  caddy
\`\`\`

443 的 **UDP 也要映射**。这是 HTTP/3（基于 QUIC）用的，只映射 TCP 的话 HTTP/3 不会生效——不会坏，只是回落成 HTTP/2。追求完整行为才需要它。

## 内网地址不申请证书

\`localhost\`、IP 地址、\`.local\` 结尾的域名这类**内部主机名不触发证书申请**，Caddy 直接按 HTTP 处理。所以本地调试不需要任何证书配置。

想让内网域名也用上正规证书，用 \`tls internal\` 签一张自签证书：

\`\`\`caddy
nas.lan {
    tls internal
    reverse_proxy localhost:8080
}
\`\`\`

自签证书浏览器会警告，要手动信任。用 \`caddy trust\` 可以装进本机信任库。

## 改配置不要重启

**生产环境改配置用 \`caddy reload\`，不要 stop 再 start。** 重启意味着几秒到几十秒的连接中断，reload 是平滑的。

\`\`\`bash
caddy validate --config /etc/caddy/Caddyfile
caddy reload  --config /etc/caddy/Caddyfile
\`\`\`

\`caddy validate\` 值得单独说一句：它不只检查语法，还会**真的加载并初始化所有模块**，因此能抓出「语法对但证书文件不存在」这类问题。\`caddy adapt\` 只做语法转换，抓不到。

写完先 validate 再 reload，比 reload 失败后回滚省事。

\`\`\`bash
caddy fmt --overwrite /etc/caddy/Caddyfile
\`\`\`

\`caddy fmt --overwrite\` 会把 Caddyfile 按规范缩进整理好。手写的 Caddyfile 缩进常常乱七八糟，格式化之后 diff 清晰得多。

## 反向代理

代理到本地服务，\`reverse_proxy\` 一行就够：

\`\`\`caddy
api.example.com {
    reverse_proxy localhost:3000
}
\`\`\`

WebSocket 不需要额外配置，Caddy 会自动处理 Upgrade 头。

前面挂静态资源、后面兜 API，一个文件里写完：

\`\`\`caddy
example.com {
    handle /api/* {
        reverse_proxy localhost:3000
    }
    handle {
        root * /var/www/html
        file_server
    }
}
\`\`\`

\`handle\` 块**按顺序匹配，第一个命中的生效**，所以具体的放前面，兜底的放最后。这个顺序和 nginx 的 \`location\` 相反，写反了会全被兜底块吃掉。

## 文件在哪

| 内容 | Linux | macOS | Windows |
| --- | --- | --- | --- |
| 配置文件 | \`/etc/caddy/Caddyfile\` | 无固定位置 | 无固定位置 |
| 数据目录 | \`$HOME/.local/share/caddy\` | \`$HOME/Library/Application Support/Caddy\` | \`%AppData%\\Caddy\` |
| 配置目录 | \`$HOME/.config/caddy\` | \`$HOME/Library/Application Support/Caddy\` | \`%AppData%\\Caddy\` |

Caddy 官方**没有强制配置文件的统一位置**——除了当前目录下的 \`Caddyfile\` 会被自动找到。包管理器安装的版本把配置文件放在 \`/etc/caddy/Caddyfile\`。

macOS 与 Windows 用 Homebrew / Chocolatey / Scoop 装的，配置文件位置随安装方式变，用 \`caddy adapt\` 不带参数跑一次能看出它当前读的是哪个文件。

**数据目录不能当缓存清。** 里面有 TLS 私钥、证书、OCSP staple。删掉不会立刻坏，但下次启动要重新走一遍验证和申请。
`,
      resources: [
        {
          kind: "html",
          title: "安装：各系统的官方仓库与命令",
          url: "https://caddyserver.com/docs/install",
          note: "Debian/Fedora/Arch 的仓库导入步骤、macOS 与 Windows 的包管理器命令都在这一页。第三方包管理器单列且标注了「社区维护」。",
        },
        {
          kind: "html",
          title: "命令行：validate / reload / fmt 的用法差异",
          url: "https://caddyserver.com/docs/command-line",
          note: "解释了为什么 validate 比 adapt 更强（会真的初始化模块），以及 reload 依赖 admin 端点的原因。",
        },
      ],
    },
  },
};
