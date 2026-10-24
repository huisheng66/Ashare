import assert from "node:assert/strict";
import { test } from "node:test";

import {
  handleRpcMessage,
  handleRpcPayload,
  MCP_PROTOCOL_VERSION,
  SERVER_INFO,
  TOOLS,
  wantsEventStream,
} from "../lib/mcp-protocol.ts";

/**
 * MCP 协议层的闸门：报文怎么进、怎么出。
 *
 * 这一组**不连数据库** —— 工具实现是注入的，协议层只负责握手、校验、错误码。
 * 这么拆的理由写在 lib/mcp-protocol.ts 头部：带 server-only 的模块在 node --test
 * 里一导入就抛错，而握手与参数校验恰恰最需要回归。
 */

/** 记录调用参数的假实现：不同工具回不同的假文本，同时把入参留下来断言。 */
function fakeInvoker(overrides = {}) {
  const calls = [];
  const invoke = async (name, args) => {
    calls.push({ name, args });
    if (overrides[name]) return overrides[name](args);
    return { text: "假的工具结果：" + name };
  };
  invoke.calls = calls;
  return invoke;
}

const call = (id, name, args) => ({
  jsonrpc: "2.0",
  id,
  method: "tools/call",
  params: { name, arguments: args },
});

test("initialize：回协商版本、工具能力与服务器信息", async () => {
  const invoke = fakeInvoker();
  const outcome = await handleRpcMessage(
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: MCP_PROTOCOL_VERSION } },
    invoke,
  );
  assert.equal(outcome.status, 200);
  const { result } = outcome.body;
  assert.equal(result.protocolVersion, MCP_PROTOCOL_VERSION);
  assert.deepEqual(result.capabilities.tools, { listChanged: false });
  assert.equal(result.serverInfo.name, SERVER_INFO.name);
  // 指令要能告诉模型「先搜再读」以及「照实转述不适合谁」——这两句是产品约束，不是装饰。
  assert.match(result.instructions, /search_tools/);
  assert.match(result.instructions, /不适合谁/);
});

test("initialize：客户端报不认识的版本时，回自己实现的版本而不是硬跟", async () => {
  const invoke = fakeInvoker();
  const outcome = await handleRpcMessage(
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "1999-01-01" } },
    invoke,
  );
  assert.equal(outcome.body.result.protocolVersion, MCP_PROTOCOL_VERSION);
});

test("通知（没有 id）回 202 且不带响应体", async () => {
  const invoke = fakeInvoker();
  const outcome = await handleRpcMessage({ jsonrpc: "2.0", method: "notifications/initialized" }, invoke);
  assert.equal(outcome.status, 202);
  assert.equal(outcome.body, null);
});

test("tools/list：三个工具，search_tools 的 query 是必填", async () => {
  const outcome = await handleRpcMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" }, fakeInvoker());
  const tools = outcome.body.result.tools;
  assert.deepEqual(tools.map((tool) => tool.name).sort(), ["get_tool", "list_scenes", "search_tools"]);
  const search = tools.find((tool) => tool.name === "search_tools");
  assert.deepEqual(search.inputSchema.required, ["query"]);
  // scene 的取值必须真的是目录里的场景 id，否则模型会照着 schema 传一个不存在的值。
  assert.ok(search.inputSchema.properties.scene.enum.includes("engineering"));
  assert.ok(search.inputSchema.properties.scene.enum.includes("music"));
  assert.equal(search.inputSchema.additionalProperties, false);
  // 每个工具都要有标题和描述：MCP 客户端列表里只显示这两项。
  for (const tool of TOOLS) {
    assert.ok(tool.title.length > 0 && tool.description.length > 20, tool.name + " 缺标题或描述");
  }
});

test("tools/call：正常路径把参数原样交给实现，返回 text 内容块", async () => {
  const invoke = fakeInvoker();
  const outcome = await handleRpcMessage(call(3, "search_tools", { query: "图片压缩", limit: 3 }), invoke);
  assert.equal(outcome.status, 200);
  assert.deepEqual(outcome.body.result.content, [{ type: "text", text: "假的工具结果：search_tools" }]);
  assert.equal(outcome.body.result.isError, undefined);
  assert.deepEqual(invoke.calls, [{ name: "search_tools", args: { query: "图片压缩", limit: 3 } }]);
});

test("tools/call：缺必填 / 类型不对 / 枚举越界 / 数值越界都给 -32602，且不调实现", async () => {
  const cases = [
    [{}, /缺少必填参数 query/],
    [{ query: 42 }, /query 必须是字符串/],
    [{ query: "x", scene: "not-a-scene" }, /scene 只能是/],
    [{ query: "x", platform: "android" }, /platform 只能是/],
    [{ query: "x", limit: 99 }, /limit 不能大于 12/],
    [{ query: "x", limit: 0 }, /limit 不能小于 1/],
    [{ query: "x", limit: 1.5 }, /limit 必须是整数/],
  ];
  for (const [args, pattern] of cases) {
    const invoke = fakeInvoker();
    const outcome = await handleRpcMessage(call(4, "search_tools", args), invoke);
    assert.equal(outcome.body.error.code, -32602, JSON.stringify(args));
    assert.match(outcome.body.error.message, pattern);
    assert.equal(invoke.calls.length, 0, "参数不合法时不该打到实现层");
  }
});

test("tools/call：未知工具报 -32602", async () => {
  const outcome = await handleRpcMessage(call(5, "delete_everything", {}), fakeInvoker());
  assert.equal(outcome.body.error.code, -32602);
  assert.match(outcome.body.error.message, /未知工具/);
});

test("工具抛错时返回 isError 结果而不是 JSON-RPC error", async () => {
  // 区别很重要：JSON-RPC error 会让多数客户端中断会话，isError 让模型看到原因后自己改。
  const invoke = fakeInvoker({
    get_tool: () => {
      throw new Error("数据库连接失败");
    },
  });
  const outcome = await handleRpcMessage(call(6, "get_tool", { slug: "kdenlive" }), invoke);
  assert.equal(outcome.status, 200);
  assert.equal(outcome.body.result.isError, true);
  assert.match(outcome.body.result.content[0].text, /数据库连接失败/);
});

test("未知方法 -32601；非法报文 400", async () => {
  const unknown = await handleRpcMessage({ jsonrpc: "2.0", id: 7, method: "resources/list" }, fakeInvoker());
  assert.equal(unknown.body.error.code, -32601);

  // 数组走批量分支，其余走单条分支 —— 两条入口都要拒绝畸形输入。
  for (const bad of [null, "字符串", 42, true]) {
    const outcome = await handleRpcPayload(bad, fakeInvoker());
    assert.equal(outcome.status, 400);
    assert.equal(outcome.body.error.code, -32600);
  }
  const nested = await handleRpcMessage([{ jsonrpc: "2.0", id: 1, method: "ping" }], fakeInvoker());
  assert.equal(nested.status, 400);

  const wrongVersion = await handleRpcMessage({ id: 8, method: "ping" }, fakeInvoker());
  assert.equal(wrongVersion.status, 400);
  assert.match(wrongVersion.body.error.message, /jsonrpc/);

  const noMethod = await handleRpcMessage({ jsonrpc: "2.0", id: 9 }, fakeInvoker());
  assert.equal(noMethod.status, 400);
});

test("ping 回空对象", async () => {
  const outcome = await handleRpcMessage({ jsonrpc: "2.0", id: 10, method: "ping" }, fakeInvoker());
  assert.deepEqual(outcome.body.result, {});
});

test("批量请求：2025-03-26 及更早的客户端会发，必须逐条处理并回数组", async () => {
  const invoke = fakeInvoker();
  const outcome = await handleRpcPayload(
    [
      { jsonrpc: "2.0", id: 20, method: "ping" },
      call(21, "search_tools", { query: "笔记" }),
      // 通知没有响应体，批量结果里不该出现它（否则客户端会以为多了个请求）
      { jsonrpc: "2.0", method: "notifications/initialized" },
    ],
    invoke,
  );
  assert.equal(outcome.status, 200);
  assert.ok(Array.isArray(outcome.body));
  assert.deepEqual(outcome.body.map((entry) => entry.id), [20, 21]);
  assert.equal(invoke.calls.length, 1);
});

test("批量请求：空数组 400，全是通知回 202", async () => {
  const empty = await handleRpcPayload([], fakeInvoker());
  assert.equal(empty.status, 400);
  assert.equal(empty.body.error.code, -32600);

  const onlyNotifications = await handleRpcPayload(
    [
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: 1 } },
    ],
    fakeInvoker(),
  );
  assert.equal(onlyNotifications.status, 202);
  assert.equal(onlyNotifications.body, null);
});

test("批量里单条出错不影响其它条", async () => {
  const outcome = await handleRpcPayload(
    [
      call(30, "search_tools", {}), // 缺 query
      { jsonrpc: "2.0", id: 31, method: "ping" },
    ],
    fakeInvoker(),
  );
  assert.equal(outcome.status, 200);
  assert.equal(outcome.body[0].error.code, -32602);
  assert.deepEqual(outcome.body[1].result, {});
});

test("SSE 协商：只接受 text/event-stream 才走流，两个都接受时优先 JSON", () => {
  assert.equal(wantsEventStream("text/event-stream"), true);
  assert.equal(wantsEventStream("text/event-stream;q=1.0"), true);
  // 规范要求客户端同时声明两者，此时一次性 JSON 更省事（有明确结尾）
  assert.equal(wantsEventStream("application/json, text/event-stream"), false);
  assert.equal(wantsEventStream("*/*"), false);
  assert.equal(wantsEventStream("application/json"), false);
  assert.equal(wantsEventStream(null), false);
});
