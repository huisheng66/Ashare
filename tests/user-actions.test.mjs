import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * 账号管理的操作闸门。
 *
 * 与 admin-actions.test.mjs 同一套 mock：把 next/navigation 的 redirect 换成抛错，
 * 于是「被挡下」可以直接断言跳去了哪。
 *
 * **重点是那三条自伤防线**：停用自己、删除自己、把自己降级。
 * 这三条一旦漏掉，管理员就能在一次误操作里把唯一的账号管理能力弄丢 ——
 * 而且没有其他人能把它改回来。它是纯逻辑，不用连库。
 */

const project = fileURLToPath(new URL("../", import.meta.url));
const mockModules = {
  "server-only": "export {};",
  "next/headers": "export async function cookies() { return globalThis.__ashareCookieJar; } export async function headers() { return new Headers(); }",
  "next/cache": "export function revalidatePath() {}",
  "next/navigation": "export function redirect(location) { const error = new Error('redirect'); error.location = location; throw error; }",
};
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(mockModules, specifier)) {
      return { url: `data:text/javascript,${encodeURIComponent(mockModules[specifier])}`, shortCircuit: true };
    }
    let resolved;
    if (specifier.startsWith("@/")) resolved = path.join(project, specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) resolved = fileURLToPath(new URL(specifier, context.parentURL));
    if (resolved && existsSync(`${resolved}.ts`)) return { url: pathToFileURL(`${resolved}.ts`).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

const redirected = (promise, expected) =>
  assert.rejects(promise, (error) =>
    typeof error.location === "string" && (expected instanceof RegExp ? expected.test(error.location) : error.location === expected));

/**
 * 成功路径**也是**一次 redirect —— Next 的 server action 结束时必须 redirect 或
 * throw，所以「成功」表现为抛出一个 error.location 指向目标页的 Error。
 *
 * 这里必须把「预期的 redirect」和「真的报错」分开：早先用 `.catch(() => {})`
 * 会把 TypeError 之类一起吞掉，于是「代码坏了」也会显示成测试通过。
 * 断言跳去了哪，才能既确认成功、又确认去的是对的页面。
 */
async function redirectedTo(promise, expected) {
  try {
    await promise;
  } catch (error) {
    assert.ok(
      error instanceof Error && typeof error.location === "string",
      `期望跳转到 ${expected}，却抛了真错误：${error?.stack ?? error}`,
    );
    assert.equal(error.location, expected);
    return;
  }
  assert.fail(`期望跳转到 ${expected}，但 action 既没跳转也没抛错`);
}

function accountForm(fields) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

test("账号管理：权限与自伤防线", async (t) => {
  const originalDirectory = process.cwd();
  const originalSecret = process.env.SESSION_SECRET;
  const originalDriver = process.env.STORE_DRIVER;
  // 同样要显式锁 json：本地 MySQL 可能起着，但这个测试不该依赖它。
  process.env.STORE_DRIVER = "json";
  const dir = await mkdtemp(path.join(tmpdir(), "ashare-users-test-"));
  const jar = new Map();
  globalThis.__ashareCookieJar = {
    get(name) { return jar.has(name) ? { value: jar.get(name) } : undefined; },
    // 只保留测试需要的读写；cookie 属性在这个测试里用不上。
    set(name, value) { jar.set(name, value); },
  };
  process.env.SESSION_SECRET = "test-only-session-secret-for-user-actions";
  process.chdir(dir);
  t.after(async () => {
    process.chdir(originalDirectory);
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
    if (originalDriver === undefined) delete process.env.STORE_DRIVER;
    else process.env.STORE_DRIVER = originalDriver;
    hooks.deregister();
    delete globalThis.__ashareCookieJar;
    const resolved = path.resolve(dir);
    assert.equal(path.dirname(resolved), path.resolve(tmpdir()));
    assert.ok(path.basename(resolved).startsWith("ashare-users-test-"));
    await rm(resolved, { recursive: true, force: true });
  });

  const actions = await import("../app/admin/actions.ts");
  const auth = await import("../lib/auth.ts");
  const store = await import("../lib/store.ts");

  await t.test("未登录不能新建账号", async () => {
    await redirected(
      actions.createUser(accountForm({ username: "newbie", password: "long-enough-password", role: "editor" })),
      "/admin/login",
    );
    assert.deepEqual(await store.listUsers(), []);
  });

  /**
   * 用引导账号 `env-admin` 当第一个操作者。
   *
   * 刻意不随便起个名字：auth.currentUser() 每次请求都回查账号表，
   * 只有**真实存在**的账号、或引导账号 env-admin 才算已登录 ——
   * 所以拿一个库里有不存在的 "root" 去startSession 会直接被判未登录。
   */
  await auth.startSession("env-admin", "admin");

  await t.test("建号后可以查到，且口令是哈希不是明文", async () => {
    await redirectedTo(
      actions.createUser(
        accountForm({ username: "alice", displayName: "Alice", password: "a-very-long-password", role: "admin" }),
      ),
      "/admin/users?ok=created",
    );
    const users = await store.listUsers();
    assert.equal(users.length, 1);
    assert.equal(users[0].username, "alice");
    // listUsers 返回 PublicUser，压根不该带口令字段。
    assert.equal("passwordHash" in users[0], false);

    const record = await store.getUser("alice");
    assert.ok(record, "账号应存在");
    assert.notEqual(record.passwordHash, "a-very-long-password", "库里不能是明文");
    assert.match(record.passwordHash, /^[a-f\d]{32}:[a-f\d]{128}$/i, "应是 salt:hash 形态");
    // authenticate 返回身份对象而非布尔值 —— 顺手断言角色，比断言 true 更有用。
    assert.deepEqual(
      await auth.authenticate("alice", "a-very-long-password"),
      { username: "alice", role: "admin" },
      "新口令应能登录，且带正确角色",
    );
  });

  await t.test("重复账号名被拒，不会覆盖原有账号", async () => {
    const before = await store.getUser("alice");
    await redirected(
      actions.createUser(accountForm({ username: "alice", password: "another-long-password", role: "editor" })),
      "/admin/users?e=exists",
    );
    const after = await store.getUser("alice");
    assert.equal(after.passwordHash, before.passwordHash, "口令不该被覆盖");
    assert.equal(after.role, "admin", "角色不该被降级");
  });

  await t.test("口令过短被拒，账号不被创建", async () => {
    await redirected(
      actions.createUser(accountForm({ username: "bob", password: "short", role: "editor" })),
      "/admin/users?e=bad-password",
    );
    assert.equal(await store.getUser("bob"), undefined);
  });

  await t.test("非法账号名与非法角色被拒", async () => {
    await redirected(
      actions.createUser(accountForm({ username: "Bad Name", password: "long-enough-password" })),
      "/admin/users?e=bad-username",
    );
    await redirected(
      actions.createUser(accountForm({ username: "carol", password: "long-enough-password", role: "superuser" })),
      "/admin/users?e=bad-role",
    );
    assert.equal(await store.getUser("carol"), undefined);
  });

  // --- 三条自伤防线 ---
  //
  // 刻意用**真实存在**的 alice 来验，而不是引导账号 env-admin：
  // env-admin 是虚拟账号（只存在于 auth.ts 的常量里，数据库里没有），
  // 拿它测不出真问题 —— 而真问题恰恰是「操作真实账号时能不能挡住自己」。
  await auth.startSession("alice", "admin");

  await t.test("不能停用自己", async () => {
    await redirected(
      actions.setUserEnabled(accountForm({ username: "alice", enabled: "0" })),
      "/admin/users?e=self-disable",
    );
    const record = await store.getUser("alice");
    assert.ok(record, "账号应仍在");
    assert.equal(record.disabled, false, "自己必须仍是启用状态");
  });

  await t.test("不能删除自己", async () => {
    await redirected(actions.removeUser(accountForm({ username: "alice" })), "/admin/users?e=self-remove");
    assert.ok(await store.getUser("alice"), "账号不该被删掉");
  });

  await t.test("不能把自己降为编辑", async () => {
    await redirected(
      actions.setUserRole(accountForm({ username: "alice", role: "editor" })),
      "/admin/users?e=self-demote",
    );
    assert.equal((await store.getUser("alice")).role, "admin", "角色不该被改掉");
  });

  // --- 操作别人 ---
  await redirectedTo(
    actions.createUser(
      accountForm({ username: "bob", displayName: "Bob", password: "bob-password-long", role: "editor" }),
    ),
    "/admin/users?ok=created",
  );

  await t.test("可以停用与启用别人", async () => {
    await redirectedTo(
      actions.setUserEnabled(accountForm({ username: "bob", enabled: "0" })),
      "/admin/users?ok=disabled",
    );
    assert.equal((await store.getUser("bob")).disabled, true);
    // 停用后不能登录 —— 这正是「停用」的意义。
    assert.equal(await auth.authenticate("bob", "bob-password-long"), undefined, "停用后不能登录");
    await redirectedTo(
      actions.setUserEnabled(accountForm({ username: "bob", enabled: "1" })),
      "/admin/users?ok=enabled",
    );
    assert.equal((await store.getUser("bob")).disabled, false);
    assert.ok(await auth.authenticate("bob", "bob-password-long"), "重新启用后应能登录");
  });

  await t.test("可以给别人改角色", async () => {
    await redirectedTo(
      actions.setUserRole(accountForm({ username: "bob", role: "admin" })),
      "/admin/users?ok=role",
    );
    assert.equal((await store.getUser("bob")).role, "admin");
  });

  await t.test("可以重置别人的口令，旧口令随即失效", async () => {
    await redirectedTo(
      actions.setUserPassword(accountForm({ username: "bob", password: "brand-new-password" })),
      "/admin/users?ok=password",
    );
    assert.equal(await auth.authenticate("bob", "bob-password-long"), undefined, "旧口令应失效");
    assert.ok(await auth.authenticate("bob", "brand-new-password"), "新口令应生效");
  });

  await t.test("可以删除别人", async () => {
    await redirectedTo(actions.removeUser(accountForm({ username: "bob" })), "/admin/users?ok=removed");
    assert.equal(await store.getUser("bob"), undefined);
  });

  // --- 权限边界 ---
  await auth.startSession("alice", "admin");
  await redirectedTo(
    actions.createUser(
      accountForm({ username: "dave", password: "dave-password-long", role: "editor" }),
    ),
    "/admin/users?ok=created",
  );

  await t.test("编辑角色进不了账号管理", async () => {
    await auth.startSession("dave", "editor");
    await redirected(actions.removeUser(accountForm({ username: "alice" })), "/admin?e=forbidden");
    await redirected(
      actions.createUser(accountForm({ username: "eve", password: "eve-password-long" })),
      "/admin?e=forbidden",
    );
    await redirected(
      actions.setUserPassword(accountForm({ username: "alice", password: "hijack-password-long" })),
      "/admin?e=forbidden",
    );
    assert.ok(await store.getUser("alice"), "编辑不该能删掉管理员");
    // 口令也不能被改：上面那次重置若生效，管理员口令就变了。
    assert.ok(await auth.authenticate("alice", "a-very-long-password"), "编辑不该能改管理员口令");
  });

  await t.test("编辑角色连用户管理页都打不开", async () => {
    // requirePermission 在 actions.ts（server action侧），不在 auth.ts。
    await redirected(actions.requirePermission("users"), "/admin?e=forbidden");
    // 但仍可以做编辑该做的事。
    const actor = await actions.requirePermission("edit");
    assert.equal(actor.role, "editor");
  });
});