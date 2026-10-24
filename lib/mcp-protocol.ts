// 相对路径而不是 @/ 别名：本模块要被 tests/mcp.test.mjs 直接导入，
// 而 node --test 不认 tsconfig 的 paths（同 lib/catalog-sql.ts 第 11 行的注释）。
import { scenes } from "../data/scenes.ts";

/**
 * MCP（Model Context Protocol）服务端协议层：JSON-RPC 2.0 的报文组装与分发。
 *
 * 为什么单独一层、且**不 import 任何带 `server-only` 的模块**：
 * 工具实现要读数据库（lib/catalog.ts 带 server-only，测试里导入会直接抛错），
 * 但协议本身是纯函数 —— 握手、能力声明、参数校验、错误码都不需要数据库。
 * 拆开之后 `tests/mcp.test.mjs` 能用假实现跑完整报文流程，不必连 MySQL。
 *
 * 传输按 Streamable HTTP 实现，目标是**各家客户端都能接**而不是只伺候一家：
 *  - 响应默认 `application/json`；客户端只接受 SSE 时回单条 `event: message`；
 *  - 支持 2025-03-26 及更早客户端会发的**批量请求**（2025-06-18 才取消）；
 *  - 无状态，不下发 `Mcp-Session-Id`；协议版本以 initialize 协商结果为准。
 * 不做服务端推送的 SSE 长连接，理由：
 *  - 这里的工具都是一问一答的只读查询，没有服务端主动推送的需求；
 *  - 站点是自托管 Node + 反向代理，长连接会被代理超时与缓冲折腾；
 *  - 官方 SDK 支持这个子集，客户端不需要额外配置。
 *
 * 协议版本按 2025-06-18 实现。客户端报更老的版本时**回自己支持的版本**，
 * 由客户端决定是否继续（规范允许这样协商，服务端不能假装支持没实现的东西）。
 */

export const MCP_PROTOCOL_VERSION = "2025-06-18";

export const SERVER_INFO = {
  name: "ashare",
  title: "Ashare 软件目录",
  version: "0.1.0",
} as const;

/** 客户端可能发来的版本，用来判断要不要协商。 */
const KNOWN_VERSIONS = new Set(["2025-06-18", "2025-03-26", "2024-11-05"]);

export type ToolResultText = { text: string; isError?: boolean };
export type ToolInvoker = (name: string, args: Record<string, unknown>) => Promise<ToolResultText>;

export type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const SCENE_IDS = scenes.map((scene) => scene.id);

/**
 * 工具清单。
 *
 * 只做三件事：找、看、列场景。刻意不加「按标签聚合」「按相似度推荐」这类工具 ——
 * 每多一个工具，模型就要多判断一次该调谁；这三个已经能覆盖「我要一个能做 X 的工具」。
 */
export const TOOLS: ToolDefinition[] = [
  {
    name: "search_tools",
    title: "搜索软件与工具",
    description:
      "按用途、名称或拼音搜索 Ashare 收录的桌面软件、命令行工具与开源项目（约 670 条，中文界面）。" +
      "直接用需求描述就能搜（例如「批量压缩图片」「不花钱的视频剪辑」「markdown 笔记」），" +
      "支持拼音（tupian）与首字母（tp）。返回名称、一句话简介、平台、许可证、价格与详情页链接。",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "搜索词或需求描述，中文/英文/拼音均可" },
        scene: {
          type: "string",
          enum: SCENE_IDS,
          description: "限定使用场景（可选）。不确定就先调 list_scenes。",
        },
        platform: {
          type: "string",
          enum: ["windows", "macos", "linux"],
          description: "限定支持的平台（可选）",
        },
        limit: { type: "integer", minimum: 1, maximum: 12, description: "返回条数，默认 6" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_tool",
    title: "读取条目详情",
    description:
      "按 slug 读取一个条目的完整信息：适合谁、不适合谁、安装步骤、下载渠道（官网/GitHub/已核验镜像）、" +
      "许可证、同类替代与正文。slug 来自 search_tools 的返回结果。",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "条目 slug，例如 kdenlive" } },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  {
    name: "list_scenes",
    title: "列出使用场景",
    description:
      "列出目录的 12 个使用场景（开发、文档、设计、数据、办公、制图、工具、摄影与录像、游戏、教育、音乐、社交）及各自条目数，" +
      "用于确定 search_tools 的 scene 取值。",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

type RpcId = string | number | null;

function ok(id: RpcId, result: unknown) {
  return { jsonrpc: "2.0" as const, id, result };
}

function fail(id: RpcId, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id, error: { code, message } };
}

/** 单个参数校验：够用就好，不引 JSON Schema 库（只有 3 个工具、字段一只手数得过来）。 */
function validateArgs(tool: ToolDefinition, args: Record<string, unknown>): string | null {
  const schema = tool.inputSchema as {
    properties?: Record<string, { type?: string; enum?: unknown[]; minimum?: number; maximum?: number }>;
    required?: string[];
  };
  for (const key of schema.required ?? []) {
    const value = args[key];
    if (value === undefined || value === null || value === "") return `缺少必填参数 ${key}`;
  }
  for (const [key, rule] of Object.entries(schema.properties ?? {})) {
    const value = args[key];
    if (value === undefined || value === null) continue;
    if (rule.type === "string" && typeof value !== "string") return `${key} 必须是字符串`;
    if (rule.type === "integer" && !Number.isInteger(value)) return `${key} 必须是整数`;
    if (rule.enum && !rule.enum.includes(value)) return `${key} 只能是 ${rule.enum.join(" / ")}`;
    if (rule.type === "integer" && typeof value === "number") {
      if (rule.minimum !== undefined && value < rule.minimum) return `${key} 不能小于 ${rule.minimum}`;
      if (rule.maximum !== undefined && value > rule.maximum) return `${key} 不能大于 ${rule.maximum}`;
    }
  }
  return null;
}

export type RpcOutcome = {
  /** HTTP 状态码。通知类报文用 202。 */
  status: number;
  /** null 表示无响应体（通知、客户端回执）。 */
  body: unknown | null;
};

/**
 * 处理一条 JSON-RPC 报文。
 *
 * 返回 HTTP 状态码而不是直接抛错：解析失败要 400，业务错误要 200 + JSON-RPC error，
 * 这个区分由传输层决定，协议层只如实给出。
 */
export async function handleRpcPayload(raw: unknown, call: ToolInvoker): Promise<RpcOutcome> {
  // 批量请求：2025-06-18 取消了它，但 2025-03-26 及更早的客户端会发。
  // 我们对这两种版本都声称支持（KNOWN_VERSIONS），就得真的处理，否则老客户端
  // 一发批量就拿到 400 —— 而它们会把 400 当成服务端坏了。
  if (Array.isArray(raw)) {
    if (!raw.length) return { status: 400, body: fail(null, -32600, "空数组不是合法的批量请求") };
    const responses: unknown[] = [];
    let status = 200;
    for (const message of raw) {
      const outcome = await handleRpcMessage(message, call);
      // 通知与客户端回执没有响应体，批量里直接略过（规范如此，不是丢数据）。
      if (outcome.body !== null) responses.push(outcome.body);
      if (outcome.status >= 400) status = 400;
    }
    // 整批都是通知：按规范回 202 且不带响应体。
    if (!responses.length) return { status: 202, body: null };
    return { status, body: responses };
  }
  return handleRpcMessage(raw, call);
}

/**
 * 该不该用 SSE 回这条响应。
 *
 * 规范要求客户端在 Accept 里同时声明 `application/json` 与 `text/event-stream`，
 * 服务端二选一即可。只有当客户端**只**接受 SSE 时才走流 —— 两个都接受时优先 JSON：
 * 一次性返回、有明确结尾，客户端不用为「一条消息的流」写收尾逻辑。
 */
export function wantsEventStream(accept: string | null): boolean {
  if (!accept) return false;
  const acceptsSse = accept.includes("text/event-stream");
  const acceptsJson = accept.includes("application/json") || accept.includes("*/*");
  return acceptsSse && !acceptsJson;
}

export async function handleRpcMessage(raw: unknown, call: ToolInvoker): Promise<RpcOutcome> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    // 批量在 handleRpcPayload 里已经拆开；走到这里的数组只可能是嵌套的畸形报文。
    return { status: 400, body: fail(null, -32600, "请求必须是 JSON-RPC 对象") };
  }

  const message = raw as { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown };
  if (message.jsonrpc !== "2.0") {
    return { status: 400, body: fail(null, -32600, "缺少 jsonrpc: \"2.0\"") };
  }
  if (typeof message.method !== "string") {
    return { status: 400, body: fail(null, -32600, "缺少 method") };
  }

  const hasId = Object.prototype.hasOwnProperty.call(message, "id");
  const id = (hasId ? (message.id as RpcId) : null) ?? null;

  // 通知（没有 id）：客户端回执、取消等，一律 202 且不回体。
  // 响应 notification 会让客户端把服务端当成发起了新请求。
  if (!hasId) return { status: 202, body: null };

  switch (message.method) {
    case "initialize": {
      const params = (message.params ?? {}) as { protocolVersion?: string };
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      // 只回自己真正实现的版本。客户端拿到不匹配的版本时，按规范决定继续还是断开。
      const protocolVersion = KNOWN_VERSIONS.has(requested) ? requested : MCP_PROTOCOL_VERSION;
      return {
        status: 200,
        body: ok(id, {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions:
            "Ashare 是按使用场景组织的桌面软件与工具目录。先用 search_tools 按需求搜（中文、拼音、首字母都行），" +
            "再用 get_tool 读详情。目录只收录合法可核验来源，不提供破解版；" +
            "推荐时请照实转述「不适合谁」与许可证限制。",
        }),
      };
    }

    case "ping":
      return { status: 200, body: ok(id, {}) };

    case "tools/list":
      return { status: 200, body: ok(id, { tools: TOOLS }) };

    case "tools/call": {
      const params = (message.params ?? {}) as { name?: unknown; arguments?: unknown };
      if (typeof params.name !== "string") {
        return { status: 200, body: fail(id, -32602, "tools/call 缺少 name") };
      }
      const tool = TOOLS.find((entry) => entry.name === params.name);
      if (!tool) return { status: 200, body: fail(id, -32602, `未知工具 ${params.name}`) };

      const args = (params.arguments ?? {}) as Record<string, unknown>;
      if (typeof args !== "object" || Array.isArray(args)) {
        return { status: 200, body: fail(id, -32602, "arguments 必须是对象") };
      }
      const invalid = validateArgs(tool, args);
      if (invalid) return { status: 200, body: fail(id, -32602, invalid) };

      try {
        const result = await call(tool.name, args);
        return {
          status: 200,
          body: ok(id, {
            content: [{ type: "text", text: result.text }],
            isError: result.isError === true ? true : undefined,
          }),
        };
      } catch (error) {
        // 工具内部异常作为 isError 结果返回，而不是 JSON-RPC error：
        // 前者模型能看到并自行改参数重试，后者很多客户端会直接中断整个会话。
        const message = error instanceof Error ? error.message : String(error);
        return {
          status: 200,
          body: ok(id, { content: [{ type: "text", text: "工具执行失败：" + message }], isError: true }),
        };
      }
    }

    default:
      return { status: 200, body: fail(id, -32601, `未实现的方法 ${message.method}`) };
  }
}
