import { promises as fs } from "node:fs";
import { appendFile } from "node:fs/promises";
import path from "node:path";

/**
 * 外链点击统计。
 *
 * 设计取舍：
 * - **只追加不读改写**。走 `JsonStore` 的读改写事务会让每次点击都串行等锁，
 *   而点击是高频、低价值、允许极小概率丢失的事件。JSONL 一次 append 即持久化。
 * - **只存 slug + 渠道 + 时间**，不存 IP、不存 UA。定位到具体条目的点击已经够用，
 *   存 IP 会把这份数据变成第二份用户数据，隐私成本远高于收益。
 * - **内存缓冲 + 定时落盘**。单次 append 会带来文件系统调用抖动，攒够一批再写。
 * - **失败只记日志不抛出**。统计挂了不能影响用户跳转。
 */

const CLICK_DIR = path.join(process.cwd(), "data", "store");
const CLICK_FILE = path.join(CLICK_DIR, "clicks.jsonl");

/** 单批上限，防止高频流量下无限占用内存。 */
const MAX_BATCH = 200;
/** 落盘间隔：5 秒内的点击合并成一次 append。 */
const FLUSH_INTERVAL_MS = 5000;

export type OutboundClick = {
  /** 条目 slug */
  slug: string;
  /** 渠道 id：official / homepage / github / disk */
  channel: string;
  /** ISO 时间戳 */
  at: string;
};

type ProcessGlobal = typeof globalThis & {
  __ashareClickBuffer?: OutboundClick[];
  __ashareClickTimer?: ReturnType<typeof setTimeout> | undefined;
};

const processRef = globalThis as ProcessGlobal;

async function flushToDisk(): Promise<void> {
  const batch = processRef.__ashareClickBuffer;
  if (!batch?.length) return;
  // 先摘走再落盘：期间新到的点击进下一批，不会被这一批重复写入。
  processRef.__ashareClickBuffer = [];
  try {
    await fs.mkdir(CLICK_DIR, { recursive: true });
    const payload = batch.map((c) => JSON.stringify(c)).join("\n") + "\n";
    await appendFile(CLICK_FILE, payload, "utf8");
  } catch (error) {
    console.error("[clicks] Could not append click records", error);
  }
}

function scheduleFlush(): void {
  if (processRef.__ashareClickTimer) return;
  const timer = setTimeout(() => {
    processRef.__ashareClickTimer = undefined;
    void flushToDisk();
  }, FLUSH_INTERVAL_MS);
  // 定时器不能拖住进程退出，否则部署时会挂住。
  timer.unref?.();
  processRef.__ashareClickTimer = timer;
}

/** 记录一次出站点击。永不抛出。 */
export async function recordClick(slug: string, channel: string): Promise<void> {
  try {
    const buffer = (processRef.__ashareClickBuffer ??= []);
    buffer.push({ slug, channel, at: new Date().toISOString() });
    if (buffer.length >= MAX_BATCH) {
      await flushToDisk();
      return;
    }
    scheduleFlush();
  } catch (error) {
    console.error("[clicks] Could not record click", error);
  }
}

/** 进程退出前把残留的点击落盘。 */
export async function flushClicks(): Promise<void> {
  const timer = processRef.__ashareClickTimer;
  if (timer) {
    clearTimeout(timer);
    processRef.__ashareClickTimer = undefined;
  }
  await flushToDisk();
}

/** 一条渠道的聚合计数。 */
export type ClickCount = { slug: string; channel: string; count: number };

/**
 * 汇总点击。按 (slug, channel) 聚合，count 降序。
 * 逐行解析：写入时断电可能留下半行，坏行不能影响其余记录。
 */
export async function clickSummary(): Promise<ClickCount[]> {
  let raw: string;
  try {
    raw = await fs.readFile(CLICK_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    console.error("[clicks] Could not read click log", error);
    return [];
  }
  const counts = new Map<string, ClickCount>();
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as Partial<OutboundClick>;
      if (typeof parsed.slug !== "string" || typeof parsed.channel !== "string") continue;
      const key = `${parsed.slug} ${parsed.channel}`;
      const hit = counts.get(key);
      if (hit) hit.count += 1;
      else counts.set(key, { slug: parsed.slug, channel: parsed.channel, count: 1 });
    } catch {
      // 跳过损坏行。
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}
