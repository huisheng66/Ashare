import "server-only";

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { samples } from "@/data/samples";
import { software as seed } from "@/data/software";
import type {
  FeedbackEntry,
  SeedSoftware,
  Software,
  Submission,
} from "@/data/types";

const DIR = path.join(process.cwd(), "data", "store");

// 单进程内存缓存 + 每文件串行写队列；原子写（tmp + rename），权限 0600
const memory = new Map<string, unknown>();
const queues = new Map<string, Promise<void>>();

async function readJSON<T>(name: string): Promise<T | null> {
  if (memory.has(name)) return memory.get(name) as T;
  try {
    const raw = await fs.readFile(path.join(DIR, `${name}.json`), "utf8");
    memory.set(name, JSON.parse(raw) as T);
  } catch {
    memory.set(name, null);
  }
  return memory.get(name) as T | null;
}

async function writeJSON(name: string, value: unknown): Promise<void> {
  memory.set(name, value);
  const run = (queues.get(name) ?? Promise.resolve()).then(async () => {
    await fs.mkdir(DIR, { recursive: true });
    const file = path.join(DIR, `${name}.json`);
    // 目录数据的写前备份：上一版存为 .bak，误操作可回滚
    if (name === "catalog") {
      await fs.copyFile(file, path.join(DIR, "catalog.bak.json")).catch(
        () => {},
      );
    }
    const tmp = path.join(DIR, `${name}.tmp`);
    await fs.writeFile(tmp, JSON.stringify(value, null, 2), { mode: 0o600 });
    await fs.rename(tmp, file);
  });
  queues.set(name, run);
  return run;
}

const serialize = (items: Software[]) => JSON.stringify(items, null, 2);

function seedToItem(s: SeedSoftware): Software {
  const { installTips, officialUrl, ...rest } = s;
  const now = new Date().toISOString();
  return {
    ...rest,
    kind: s.source === "opensource" ? "opensource" : "app",
    status: "published",
    tags: [],
    body: "",
    tutorial: installTips,
    links: { official: officialUrl },
    previews: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function seedCatalog(): Promise<Software[]> {
  const items = [...seed.map(seedToItem), ...samples];
  await saveCatalog(items);
  return items;
}

/** 旧数据兼容：单张 preview 迁移为 previews 数组；缺失的时间戳用目录文件 mtime 补齐 */
function normalize(items: Software[], fallbackTime?: Date): Software[] {
  const fallback = (fallbackTime ?? new Date()).toISOString();
  return items.map((item) => {
    const next = { ...item };
    if (!next.previews) {
      const legacy = (item as unknown as { preview?: string }).preview;
      next.previews = legacy ? [legacy] : [];
    }
    if (!next.createdAt) next.createdAt = fallback;
    if (!next.updatedAt) next.updatedAt = fallback;
    return next;
  });
}

export async function getCatalogAll(): Promise<Software[]> {
  const items = await readJSON<Software[]>("catalog");
  if (!items) return seedCatalog();
  let mtime: Date | undefined;
  try {
    mtime = (await fs.stat(path.join(DIR, "catalog.json"))).mtime;
  } catch {
    // 文件不存在时不会走到这里
  }
  const normalized = normalize(items, mtime);
  const recorded = await readJSON<string>("catalog.sha256");
  if (recorded) {
    const actual = createHash("sha256")
      .update(JSON.stringify(items, null, 2))
      .digest("hex");
    if (actual !== recorded) {
      console.warn(
        "[store] catalog.json 与发布时的 SHA-256 不一致，文件可能被改动",
      );
    }
  }
  return normalized;
}

export async function saveCatalog(items: Software[]): Promise<void> {
  await writeJSON("catalog", items);
  await writeJSON(
    "catalog.sha256",
    createHash("sha256").update(serialize(items)).digest("hex"),
  );
}

export async function getFeedback(): Promise<FeedbackEntry[]> {
  return (await readJSON<FeedbackEntry[]>("feedback")) ?? [];
}

export async function saveFeedback(entries: FeedbackEntry[]): Promise<void> {
  await writeJSON("feedback", entries);
}

export async function getSubmissions(): Promise<Submission[]> {
  return (await readJSON<Submission[]>("submissions")) ?? [];
}

export async function saveSubmissions(entries: Submission[]): Promise<void> {
  await writeJSON("submissions", entries);
}

export async function addSubmission(entry: Submission): Promise<void> {
  await saveSubmissions([entry, ...(await getSubmissions())]);
}

export type Blocks = Record<string, number>; // ip -> 封禁截止 epoch ms

export async function getBlocks(): Promise<Blocks> {
  return (await readJSON<Blocks>("blocks")) ?? {};
}

export async function saveBlocks(blocks: Blocks): Promise<void> {
  await writeJSON("blocks", blocks);
}
