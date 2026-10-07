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
 * 扫描上限。JSONL 每天只追加、永不压缩，理论上无上限；
 * 但后台统计不该为了画一张图把整份历史读进内存。超限时只统计最新的一段，
 * 并在页面上如实说明「仅统计最近 N 行」，不谎报全量。
 */
const MAX_SCAN_BYTES = 8 * 1024 * 1024;
const MAX_SCAN_LINES = 200_000;

export type ClickScan = {
  /** (slug, channel) 计数 */
  byChannel: Map<string, ClickCount>;
  /** 每条点击的日期（YYYY-MM-DD，北京时间）计数 */
  byDay: Map<string, number>;
  total: number;
  /** 因超出上限而跳过的行数 */
  skipped: number;
  /** 实际扫描的字节数 */
  bytes: number;
};

/** 取文件尾部不超过 limit 字节的片段，避免整文件读入。 */
async function readTail(limit: number): Promise<{ text: string; bytes: number }> {
  let handle;
  try {
    handle = await fs.open(CLICK_FILE, "r");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { text: "", bytes: 0 };
    console.error("[clicks] Could not open click log", error);
    return { text: "", bytes: 0 };
  }
  try {
    const { size } = await handle.stat();
    const start = Math.max(0, size - limit);
    const length = size - start;
    if (!length) return { text: "", bytes: 0 };
    const buffer = Buffer.allocUnsafe(length);
    await handle.read(buffer, 0, length, start);
    return { text: buffer.toString("utf8"), bytes: length };
  } catch (error) {
    console.error("[clicks] Could not read click log", error);
    return { text: "", bytes: 0 };
  } finally {
    await handle.close();
  }
}

/** 固定按北京时间分桶，与 formatDate 一致，避免服务端时区让日期漂一天。 */
function dayKey(iso: string): string | undefined {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** 单次扫描，产出所有视图共用的聚合结果。 */
export async function scanClicks(): Promise<ClickScan> {
  const { text, bytes } = await readTail(MAX_SCAN_BYTES);
  const scan: ClickScan = { byChannel: new Map(), byDay: new Map(), total: 0, skipped: 0, bytes };

  let firstPartial = true;
  let seen = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // 从尾部截断时首行可能只有半条记录，跳过而不是把它算成一个坏行。
    if (firstPartial) {
      firstPartial = false;
      if (!trimmed.startsWith("{")) continue;
    }
    if (seen >= MAX_SCAN_LINES) {
      scan.skipped += 1;
      continue;
    }
    seen += 1;
    let parsed: Partial<OutboundClick>;
    try {
      parsed = JSON.parse(trimmed) as Partial<OutboundClick>;
    } catch {
      // 写入时断电可能留下半行，跳过即可。
      scan.skipped += 1;
      continue;
    }
    if (typeof parsed.slug !== "string" || typeof parsed.channel !== "string") {
      scan.skipped += 1;
      continue;
    }
    scan.total += 1;

    const key = `${parsed.slug} ${parsed.channel}`;
    const hit = scan.byChannel.get(key);
    if (hit) hit.count += 1;
    else scan.byChannel.set(key, { slug: parsed.slug, channel: parsed.channel, count: 1 });

    const day = dayKey(String(parsed.at ?? ""));
    if (day) scan.byDay.set(day, (scan.byDay.get(day) ?? 0) + 1);
  }

  return scan;
}

/**
 * 汇总点击。按 (slug, channel) 聚合，count 降序。
 * 损坏行不影响其余记录。
 */
export async function clickSummary(): Promise<ClickCount[]> {
  const { byChannel } = await scanClicks();
  return [...byChannel.values()].sort((a, b) => b.count - a.count);
}
