import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import ts from "typescript";

/**
 * 每个 .mjs 都必须是合法的 JavaScript。
 *
 * 为什么值得单开一个测试：Node 24 对 .ts 做类型擦除，**但对 .mjs 不做**。
 * 在脚本里写下 `as Role`、`: UserRecord`、`import { type X }` 这类 TypeScript 语法，
 * 单元测试与 tsc 都不会报（tsc 不管 .mjs），只有真的运行那个脚本时才 SyntaxError。
 * 本项目在收录脚本与巡检脚本上连踩四次 —— 每次都是「脚本跑起来才发现」。
 *
 * 用TypeScript 编译器做语法判定，而不是正则：正则会把字符串或注释里的
 * "as Foo" 误判成类型断言。
 *
 * **为什么不 spawn `node --check`**：那要求每个 .mjs 都额外起一个子进程，
 * 慢，而且在 spawn 受限的环境（沙箱、CI 容器、某些 Windows 配置）里会整体失败 ——
 * 实测在本机所有 spawn 都返回 EBUSY，闸门变成「永远红」，等于没有闸门。
 * tsc 的语法检查是同一套解析器（V8 之前的那层），纯进程内，快且无环境依赖。
 */

function collect(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, found);
    else if (entry.name.endsWith(".mjs")) found.push(full);
  }
  return found;
}

const files = collect(process.cwd())
  .map((file) => path.relative(process.cwd(), file))
  .sort();

test("仓库里的 .mjs 没有混入 TypeScript 语法", () => {
  assert.ok(files.length >= 20, "只找到 " + files.length + " 个 .mjs，扫描逻辑可能不对");

  // allowJs 让 .mjs 进入程序，checkJs 关掉 —— 我们只要语法，不要语义检查。
  const program = ts.createProgram(files, {
    noEmit: true,
    allowJs: true,
    checkJs: false,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    skipLibCheck: true,
    noResolve: true,
  });

  const broken = [];
  for (const file of files) {
    const source = program.getSourceFile(path.resolve(file)) ?? program.getSourceFile(file);
    if (!source) {
      broken.push(file + "：tsc 没有收进程序（路径解析失败）");
      continue;
    }
    for (const diagnostic of program.getSyntacticDiagnostics(source)) {
      broken.push(file + "：" + ts.flattenDiagnosticMessageText(diagnostic.messageText, " "));
    }
  }

  assert.deepEqual(broken, [], ".mjs 里不能写 TypeScript 语法（Node 对 .mjs 不做类型擦除）");
});

test("扫描到的文件确实包含新增的脚本目录", () => {
  // 扫描逻辑坏掉时最危险的表现是「扫到 0 个文件，全绿」。钉住覆盖面下限。
  // 统一成正斜杠：path.relative 在 Windows 上给的是反斜杠，写死平台分隔符会误判。
  const slashed = files.map((file) => file.split(path.sep).join("/"));

  for (const required of ["scripts/db-migrate.mjs", "scripts/_shared.mjs", "tests/users.test.mjs"]) {
    assert.ok(slashed.includes(required), "没有扫到 " + required);
  }
  assert.ok(
    slashed.some((file) => file.startsWith("scripts/")),
    "scripts 目录下的 .mjs 一个都没扫到",
  );
});