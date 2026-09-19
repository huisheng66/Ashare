import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, readdir, rm, rmdir, writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

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

function item(slug) {
  return { slug, name: slug, aliases: [], kind: "app", status: "draft", tags: [], summary: "Test software", body: "", scenes: ["tools"], platforms: ["windows"], source: "official", links: {}, tutorial: [], whoFor: "", whoNot: "", alternatives: [], previews: [], icon: { letter: "T", color: "#123456" } };
}
function form(slug, original = "") {
  const fd = new FormData();
  fd.set("slug", slug);
  fd.set("originalSlug", original);
  fd.set("name", "Test software");
  fd.set("summary", "Helpful utility");
  return fd;
}
const redirected = (promise, expected) => assert.rejects(promise, (error) => typeof error.location === "string" && (expected instanceof RegExp ? expected.test(error.location) : error.location === expected));

test("admin actions preserve data across validation, disk failures, and concurrent saves", async (t) => {
  const originalDirectory = process.cwd();
  const originalSecret = process.env.SESSION_SECRET;
  const dir = await mkdtemp(path.join(tmpdir(), "ashare-actions-test-"));
  const jar = new Map();
  let cookieOptions;
  globalThis.__ashareCookieJar = {
    get(name) { return jar.has(name) ? { value: jar.get(name) } : undefined; },
    set(name, value, options) { jar.set(name, value); cookieOptions = options; },
  };
  process.env.SESSION_SECRET = "test-only-session-secret-for-action-regression";
  process.chdir(dir);
  t.after(async () => {
    process.chdir(originalDirectory);
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
    hooks.deregister();
    delete globalThis.__ashareCookieJar;
    const resolved = path.resolve(dir);
    assert.equal(path.dirname(resolved), path.resolve(tmpdir()));
    assert.ok(path.basename(resolved).startsWith("ashare-actions-test-"));
    await rm(resolved, { recursive: true, force: true });
  });
  const actions = await import("../app/admin/actions.ts");
  const store = await import("../lib/store.ts");
  const auth = await import("../lib/auth.ts");

  await t.test("unauthenticated mutations are rejected", async () => {
    await redirected(actions.saveItem(form("first")), "/admin/login");
    assert.equal(existsSync(path.join(dir, "data", "store", "catalog.json")), false);
    await auth.startSession();
  });

  await t.test("renaming cannot overwrite another slug", async () => {
    await store.saveCatalog([item("first"), item("second")]);
    await redirected(actions.saveItem(form("second", "first")), /^\/admin\/items\/first\?e=/);
    assert.deepEqual((await store.getCatalogAll()).map((entry) => entry.slug), ["first", "second"]);
  });

  const imagePath = "/media/first/0123456789abcdef.png";
  const imageFile = path.join(dir, "public", imagePath);
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  await mkdir(path.dirname(imageFile), { recursive: true });
  await writeFile(imageFile, png);
  const first = { ...item("first"), previews: [imagePath] };

  await t.test("validation failures never delete existing images", async () => {
    await store.saveCatalog([first]);
    const fd = form("first", "first");
    fd.set("name", "");
    fd.set("removePreview", "0");
    await redirected(actions.saveItem(fd), /^\/admin\/items\/first\?e=/);
    assert.deepEqual(await readFile(imageFile), png);
    assert.deepEqual((await store.getCatalogAll())[0].previews, [imagePath]);
  });

  await t.test("spoofed upload MIME types are rejected before changing catalog or files", async () => {
    const fd = form("first", "first");
    fd.set("removePreview", "0");
    fd.set("previews", new File(["<html>not an image</html>"], "photo.png", { type: "image/png" }));
    await redirected(actions.saveItem(fd), /^\/admin\/items\/first\?e=/);
    assert.deepEqual(await readFile(imageFile), png);
  });

  await t.test("a failed catalog commit rolls back only newly uploaded files", async () => {
    const backupPath = path.join(dir, "data", "store", "catalog.bak.json");
    await rm(backupPath, { force: true });
    await mkdir(backupPath);
    const fd = form("first", "first");
    fd.set("removePreview", "0");
    fd.set("previews", new File([png], "photo.png", { type: "image/png" }));
    await assert.rejects(actions.saveItem(fd), (error) => !error.location);
    assert.deepEqual(await readdir(path.dirname(imageFile)), [path.basename(imageFile)]);
    assert.deepEqual((await store.getCatalogAll())[0].previews, [imagePath]);
    await rmdir(backupPath);
  });

  await t.test("concurrent saves of distinct items retain both entries", async () => {
    await store.saveCatalog([]);
    await Promise.all([
      redirected(actions.saveItem(form("first")), "/admin?saved=1"),
      redirected(actions.saveItem(form("second")), "/admin?saved=1"),
    ]);
    assert.deepEqual((await store.getCatalogAll()).map((entry) => entry.slug).sort(), ["first", "second"]);
  });

  await t.test("unrecognized publish status is rejected", async () => {
    const fd = new FormData();
    fd.set("slug", "first");
    fd.set("status", "unexpected");
    await redirected(actions.setItemStatus(fd), "/admin?e=invalid");
    assert.equal((await store.getCatalogAll()).find((entry) => entry.slug === "first").status, "draft");
  });

  await t.test("opening the submission editor preserves the source submission", async () => {
    await store.addSubmission({ id: "test-submission", kind: "app", name: "Submitted app", url: "https://example.com", need: "A useful utility", at: new Date().toISOString() });
    const fd = new FormData();
    fd.set("id", "test-submission");
    await redirected(actions.convertSubmission(fd), /^\/admin\/items\/new\?/);
    assert.equal((await store.getSubmissions()).length, 1);
  });

  await t.test("logout expires the cookie at its original admin path", async () => {
    await redirected(actions.logout(), "/admin/login");
    assert.equal(cookieOptions.path, "/admin");
    assert.equal(cookieOptions.maxAge, 0);
    assert.equal(cookieOptions.expires.getTime(), 0);
    assert.equal(await auth.hasValidSession(), false);
  });
});
