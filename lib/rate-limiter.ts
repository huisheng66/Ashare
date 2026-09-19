/** A bounded sliding window. Full capacity fails closed until stale buckets expire. */
export class SlidingWindowLimiter {
  private readonly buckets = new Map<string, { hits: number[]; expiresAt: number }>();
  private nextCleanup = 0;
  private readonly maxBuckets: number;

  constructor(maxBuckets = 10_000) {
    this.maxBuckets = maxBuckets;
  }

  allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
    if (now >= this.nextCleanup || (!this.buckets.has(key) && this.buckets.size >= this.maxBuckets)) {
      for (const [bucketKey, bucket] of this.buckets) {
        if (bucket.expiresAt <= now) this.buckets.delete(bucketKey);
      }
      this.nextCleanup = now + 60_000;
    }
    const hits = (this.buckets.get(key)?.hits ?? []).filter((time) => now - time < windowMs);
    if (hits.length >= limit) return false;
    if (!this.buckets.has(key) && this.buckets.size >= this.maxBuckets) return false;
    hits.push(now);
    this.buckets.set(key, { hits, expiresAt: now + windowMs });
    return true;
  }

  delete(key: string): void {
    this.buckets.delete(key);
  }
}
