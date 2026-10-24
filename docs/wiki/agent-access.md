# 给 agent 用：MCP 端点

站内目录通过 **MCP（Model Context Protocol）** 暴露成只读工具，用户把它加进自己的 agent 之后，可以直接用自然语言问「有没有能批量压缩图片的免费工具」，不必先打开网页。

端点：`POST https://<站点>/api/mcp`

## 一句话架构

```
客户端 ──POST JSON-RPC──▶ app/api/mcp/route.ts    限流、CORS、站点地址
                                │
                                ├─▶ lib/mcp-protocol.ts   握手 / 能力 / 参数校验 / 错误码（纯函数）
                                └─▶ lib/mcp-tools.ts      工具实现（server-only，读目录）
```

三层的**边界是有原因的**：协议层不 import 任何带 `server-only` 的模块，所以 `tests/mcp.test.mjs` 能用假实现跑完整的报文流程，不必连 MySQL —— 而握手与参数校验恰恰最需要回归。工具实现要读库，进不了单测。

## 三个工具

| 工具 | 参数 | 返回 |
|---|---|---|
| `search_tools` | `query`（必填）、`scene`、`platform`、`limit`（1–12，默认 6） | 每条一行主信息（名称、一句话简介）+ 一行元信息（平台 · 来源 · 许可 · 价格）+ 详情页链接 |
| `get_tool` | `slug` | 适合 / 不适合 / 上手步骤 / 渠道 / 正文 / 同类替代 / 教程链接 |
| `list_scenes` | 无 | 12 个场景及条目数 |

**为什么不加更多工具**：每多一个工具，模型就要多判断一次该调谁。这三个覆盖「我要一个能做 X 的工具」这一条主路径。

**为什么返回 Markdown 而不是 JSON**：MCP 的 `content` 是给人/模型读的。链接、许可证说明（`GPL-3.0（分发衍生作品需同样开源）`）都要拼成人话，JSON 里只能拆成两个字段让模型自己合成；反过来，需要结构化的客户端能照文本自己解析，所以文本是更保守的选择。

**为什么详情不带 guide 全文**：一篇详细教程几千字，塞进上下文会把对话挤爆。给「详情页链接 + 字数」即可。

## 传输：Streamable HTTP，但不做服务端推送

- 只接受 `POST`；响应默认 `application/json`，客户端只吃 SSE 时改回单条 `event: message`（见「客户端接入」的兼容性表）。
- **不提供 SSE 长连接**：工具都是只读查询，没有服务端推送需求；而站点是自托管 Node + 反向代理，长连接会被代理缓冲与超时折腾。按规范，不支持 SSE 的服务端对 `GET` 返回 405 即可，客户端会自动只用 POST。
- 无状态：不下发 `Mcp-Session-Id`，不保存会话。
- 协议版本按 `2025-06-18` 实现；客户端报更老的版本时**回自己支持的版本**（规范允许协商），不假装支持没实现的东西。

## 安全边界

| 项 | 做法 | 理由 |
|---|---|---|
| 鉴权 | 无 | 目录本来就是公开数据 |
| 限流 | 60 次/分钟/IP | 一次 `search_tools` 约 7 次库查询（搜索 + 逐条取详情），不设限就是免费擦库通道 |
| 只读 | 只有 3 个查询工具 | 写接口一个都不暴露 |
| 字段 | 只返回公开字段 | 草稿、审计、点击数据一概不碰 |
| 索引 | `robots.txt` 增加 `Disallow: /api/`，响应带 `X-Robots-Tag: noindex` | 爬虫抓 API 没有意义，还会占限流额度 |
| CORS | `Access-Control-Allow-Origin: *`，不带凭据 | 只读公开数据，浏览器型客户端也能用 |

## 与站内搜索的关系

`search_tools` 走的是 `lib/catalog.ts` 的 `searchCatalog` —— 与搜索页同一套召回与排序（FULLTEXT + ngram、拼音通道、首字母通道、拼写纠正），所以「agent 搜到的」和「网页搜到的」不会打架。JSON 回滚路径（`STORE_DRIVER=json`）同样可用，只是没有 facets 与容错降级。

## 测试

`tests/mcp.test.mjs`（10 项，**不连库**）：握手协商、通知回 202、工具清单与 schema、参数校验（缺必填 / 类型 / 枚举 / 数值越界）、未知工具、工具抛错走 `isError` 而非 JSON-RPC error、非法报文 400。

工具实现本身的正确性由 `npm run test:db` 与页面冒烟覆盖 —— 它们读的是同一个 `lib/catalog.ts`。

## 已知限制

- 没有 `resources` / `prompts` 能力：目录数据用工具表达比用资源表达更自然。
- 没有订阅（`listChanged: false`）：目录更新频率是每天几条，不值得为它维护推送。
- 没有鉴权与配额分级：公开只读，靠 IP 限流挡住脚本。

## 客户端接入：目标是「谁都能接」

MCP 客户端在传输与配置键上并不统一，这一节按「怎么连上」分类，而不是按产品列表。

### 一、支持远程 URL 的客户端（直接填地址）

| 客户端 | 做法 |
|---|---|
| Claude Code | `claude mcp add --transport http ashare https://<站点>/api/mcp` |
| Cursor | `~/.cursor/mcp.json` 或项目 `.cursor/mcp.json`：`{"mcpServers":{"ashare":{"url":"<URL>"}}}` |
| VS Code / Copilot | `.vscode/mcp.json`：`{"servers":{"ashare":{"type":"http","url":"<URL>"}}}`；可移植写法用工作区根 `.mcp.json`（顶层键 `mcpServers`） |
| Codex CLI | `codex mcp add ashare --url <URL>`（落盘在 `~/.codex/config.toml`） |
| Gemini CLI | `gemini mcp add -s user --transport http ashare <URL>` |
| Antigravity | `~/.gemini/config/mcp_config.json`：`{"mcpServers":{"ashare":{"serverUrl":"<URL>"}}}`（它的键是 `serverUrl`，不是 `url`） |
| Zed | 设置里的 `context_servers` 增加一项，填 `url` |
| WorkBuddy | `~/.workbuddy/mcp.json`：`{"mcpServers":{"ashare":{"url":"<URL>"}}}` |

键名与文件位置随版本变过（`servers` vs `mcpServers`、`url` vs `serverUrl`），照对应客户端的文档抄。

### 二、只支持 stdio 的客户端（用桥）

Claude Desktop 这类只认 `command + args` 的客户端，用社区的 `mcp-remote` 把远程地址当本地命令拉起：

```json
{
  "mcpServers": {
    "ashare": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<站点>/api/mcp", "--transport", "http-only"]
    }
  }
}
```

**`--transport http-only` 不能省**：桥默认先试 SSE、失败再回退，而本端点不提供服务端推送流（`GET` 返 405），不锁死的话每次启动都要白等一轮。

### 三、远程托管型（Anthropic 云端 Connectors 等）

这类是**云端**去连你的服务器，不是本机连：域名必须公网可达、TLS 有效，`localhost` 一定不行。
站点部署在公网时天然满足。

### 兼容性靠这三件事

| 差异点 | 各家做法 | 我们的处理 |
|---|---|---|
| 响应格式 | 有的只吃 `text/event-stream` | 默认 JSON；`Accept` 里**只有** SSE 时改回单条 `event: message` |
| 批量请求 | 2025-03-26 及更早会发数组 | 逐条处理并回数组；通知不产生响应体；空数组 400、全通知 202 |
| 会话 | 有的会带 `Mcp-Session-Id` | 无状态，不下发也不校验；带了就忽略 |
| 预检 | 浏览器型客户端会发 OPTIONS | 允许 `Content-Type / Accept / Authorization / MCP-Protocol-Version / Mcp-Session-Id / Last-Event-ID` |

本地开发把域名换成 `http://localhost:3000`；未配 `NEXT_PUBLIC_SITE_URL` 时，工具返回的链接会退回到请求来源的 origin。
