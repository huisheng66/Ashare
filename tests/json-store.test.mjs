import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setImmediate } from "node:timers/promises";
import test from "node:test";
import { JsonStore } from "../lib/json-store.ts";

async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), "ashare-store-test-"));
  t.after(async () => {
    const resolved = path.resolve(dir);
    assert.equal(path.dirname(resolved), path.resolve(tmpdir()));
    assert.ok(path.basename(resolved).startsWith("ashare-store-test-"));
    await rm(resolved, { recursive: true, force: true });
  });
  return { store: new JsonStore(dir), dir };
}

test("concurrent read/modify/write operations preserve every submission", async (t) => {
  const { store } = await fixture(t);
  await Promise.all(Array.from({ length: 80 }, (_, id) => store.update("submissions", () => [], async (entries) => {
    await setImmediate();
    return [...entries, { id }];
  })));
  const entries = await store.read("submissions");
  assert.equal(entries.length, 80);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, 80);
});

test("only one concurrent initializer writes a missing catalog", async (t) => {
  const { store } = await fixture(t);
  let calls = 0;
  const results = await Promise.all(Array.from({ length: 20 }, () => store.readOrCreate("catalog", () => [{ id: ++calls }])));
  assert.equal(calls, 1);
  assert.ok(results.every((value) => value[0].id === 1));
});

test("corrupt and null JSON are never replaced by defaults", async (t) => {
  const { store, dir } = await fixture(t);
  for (const contents of ["{ broken", "null"]) {
    await writeFile(path.join(dir, "catalog.json"), contents);
    await assert.rejects(store.readOrCreate("catalog", () => ["seed"]));
    await assert.rejects(store.update("catalog", () => [], () => ["replacement"]));
    assert.equal(await readFile(path.join(dir, "catalog.json"), "utf8"), contents);
  }
});

test("failed writes keep persisted data, clean temporary files, and do not poison the queue", async (t) => {
  const { store, dir } = await fixture(t);
  await store.update("feedback", () => [], () => [{ id: 1 }]);
  const circular = {};
  circular.self = circular;
  await assert.rejects(store.update("feedback", () => [], () => circular));
  assert.deepEqual(await store.read("feedback"), [{ id: 1 }]);
  await store.update("feedback", () => [], (entries) => [...entries, { id: 2 }]);
  assert.deepEqual(await store.read("feedback"), [{ id: 1 }, { id: 2 }]);
  assert.deepEqual(await readdir(dir), ["feedback.json"]);
});

test("read results cannot mutate persistence and external changes are visible", async (t) => {
  const { store, dir } = await fixture(t);
  await store.update("blocks", () => ({}), () => ({ ip: 100 }));
  const value = await store.read("blocks");
  value.ip = 200;
  assert.deepEqual(await store.read("blocks"), { ip: 100 });
  await writeFile(path.join(dir, "blocks.json"), '{"ip":300}');
  assert.deepEqual(await store.read("blocks"), { ip: 300 });
});

test("catalog backups retain the previously committed version", async (t) => {
  const { store, dir } = await fixture(t);
  await store.update("catalog", () => [], () => [{ id: 1 }], { backup: true });
  await store.update("catalog", () => [], () => [{ id: 2 }], { backup: true });
  assert.deepEqual(JSON.parse(await readFile(path.join(dir, "catalog.bak.json"), "utf8")), [{ id: 1 }]);
  assert.deepEqual(await store.read("catalog"), [{ id: 2 }]);
});

test("separate store instances share the same file transaction queue", async (t) => {
  const { store, dir } = await fixture(t);
  const other = new JsonStore(dir);
  await Promise.all(Array.from({ length: 40 }, (_, index) => (index % 2 ? store : other).update("feedback", () => [], async (entries) => {
    await setImmediate();
    return [...entries, index];
  })));
  assert.equal((await store.read("feedback")).length, 40);
});
