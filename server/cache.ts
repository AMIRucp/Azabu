interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const MAX_CACHE_SIZE = 500;
const cache = new Map<string, CacheEntry<unknown>>();

function evictStale(): void {
  const now = Date.now();
  const maxAge = 120_000;
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > maxAge) cache.delete(key);
  }
  if (cache.size > MAX_CACHE_SIZE) {
    const sorted = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = sorted.slice(0, cache.size - MAX_CACHE_SIZE);
    for (const [key] of toRemove) cache.delete(key);
  }
}

let sweepTimer: ReturnType<typeof setInterval> | null = null;
function ensureSweep(): void {
  if (!sweepTimer) {
    sweepTimer = setInterval(evictStale, 60_000);
    if (typeof sweepTimer === "object" && "unref" in sweepTimer) sweepTimer.unref();
  }
}

export function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
  ensureSweep();
  if (cache.size >= MAX_CACHE_SIZE) evictStale();
  cache.set(key, { data, timestamp: Date.now() });
}

const inFlight = new Map<string, Promise<unknown>>();

export function dedupeRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}
