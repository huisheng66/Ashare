import "server-only";

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { samples } from "@/data/samples";
import { software as seed } from "@/data/software";
import type { FeedbackEntry, SeedSoftware, Software, Submission } from "@/data/types";
import { JsonStore } from "./json-store";

const DIR = path.join(process.cwd(), "data", "store");
// One Node process owns this local store. Each mutation includes its read in the queue.
const store = new JsonStore(DIR);
let checkedCatalogIntegrity = false;

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

const seedCatalog = (): Software[] => [...seed.map(seedToItem), ...structuredClone(samples)];

function requireArray<T>(value: T[], name: string): T[] {
  if (!Array.isArray(value)) throw new Error(`[store] ${name}.json must contain an array`);
  return value;
}

/** Legacy single previews and missing timestamps remain readable without rewriting data. */
function normalize(items: Software[], fallbackTime?: Date): Software[] {
  const fallback = (fallbackTime ?? new Date()).toISOString();
  return requireArray(items, "catalog").map((item) => {
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

async function catalogTime(): Promise<Date | undefined> {
  try {
    return (await fs.stat(path.join(DIR, "catalog.json"))).mtime;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return undefined;
  }
}

export async function getCatalogAll(): Promise<Software[]> {
  const items = await store.readOrCreate("catalog", seedCatalog, async (current) => {
    if (checkedCatalogIntegrity) return;
    const recorded = await store.read<string>("catalog.sha256").catch((error: unknown) => {
      console.error("[store] Could not read catalog checksum", error);
      return null;
    });
    if (recorded && recorded !== createHash("sha256").update(JSON.stringify(current, null, 2)).digest("hex")) {
      console.warn("[store] catalog.json 与发布时的 SHA-256 不一致，文件可能被改动");
    }
    checkedCatalogIntegrity = true;
  });
  return normalize(items, await catalogTime());
}

export async function updateCatalog(
  change: (items: Software[]) => Software[] | Promise<Software[]>,
): Promise<void> {
  await store.update("catalog", seedCatalog, async (items) => {
    return requireArray(await change(normalize(items, await catalogTime())), "catalog");
  }, {
    backup: true,
    afterWrite: async (items) => {
      // The checksum is advisory. A sidecar failure must not report a committed save as failed.
      const digest = createHash("sha256").update(JSON.stringify(items, null, 2)).digest("hex");
      await store.update("catalog.sha256", () => "", () => digest).catch((error: unknown) => {
        console.error("[store] Could not update catalog checksum", error);
      });
    },
  });
}

export async function saveCatalog(items: Software[]): Promise<void> {
  await updateCatalog(() => items);
}

export async function getFeedback(): Promise<FeedbackEntry[]> {
  return requireArray((await store.read<FeedbackEntry[]>("feedback")) ?? [], "feedback");
}

export async function updateFeedback(change: (entries: FeedbackEntry[]) => FeedbackEntry[]): Promise<void> {
  await store.update<FeedbackEntry[]>("feedback", () => [], (entries) => change(requireArray(entries, "feedback")));
}

export async function addFeedback(entry: FeedbackEntry): Promise<void> {
  await updateFeedback((entries) => [entry, ...entries]);
}

export async function getSubmissions(): Promise<Submission[]> {
  return requireArray((await store.read<Submission[]>("submissions")) ?? [], "submissions");
}

export async function updateSubmissions(change: (entries: Submission[]) => Submission[]): Promise<void> {
  await store.update<Submission[]>("submissions", () => [], (entries) => change(requireArray(entries, "submissions")));
}

export async function addSubmission(entry: Submission): Promise<void> {
  await updateSubmissions((entries) => [entry, ...entries]);
}

export type Blocks = Record<string, number>;

function requireBlocks(value: Blocks): Blocks {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("[store] blocks.json must contain an object");
  }
  return value;
}

export async function getBlocks(): Promise<Blocks> {
  return requireBlocks((await store.read<Blocks>("blocks")) ?? {});
}

export async function updateBlocks(change: (blocks: Blocks) => Blocks): Promise<void> {
  await store.update<Blocks>("blocks", () => ({}), (blocks) => change(requireBlocks(blocks)));
}
