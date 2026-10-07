import type { Software } from "@/data/types";

/**
 * 历史数据补齐：缺失的时间戳与单数 previews。
 *
 * 从 lib/store.ts 抽出来，是因为 ETL 导入与 db:verify 还原必须和线上读取用同一套规则。
 * 若各写一份，「导入时补了、读回时没补」这类差异只会在往返比对里冒出来，很难归因。
 * 纯函数，不 import server-only，脚本与测试都能直接用。
 */
export function normalizeItems(items: Software[], fallbackTime?: Date): Software[] {
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
