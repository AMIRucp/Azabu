import { formatUnits } from "ethers";

export interface TokenState {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  lastFetch: number | null;
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000;

class TokenCacheManager {
  private cache: Map<number, CacheEntry<TokenState[]>> = new Map();
  private pendingRequests: Map<number, Promise<TokenState[]>> = new Map();
  private metrics: Map<number, CacheMetrics> = new Map();

  async fetchTokens(chainId: number): Promise<TokenState[]> {
    if (this.isCacheValid(chainId)) {
      this.recordHit(chainId);
      return this.cache.get(chainId)!.data;
    }

    if (this.pendingRequests.has(chainId)) {
      return this.pendingRequests.get(chainId)!;
    }

    const fetchPromise = this.fetchWithRetry(chainId);
    this.pendingRequests.set(chainId, fetchPromise);

    try {
      const tokens = await fetchPromise;
      this.cache.set(chainId, {
        data: tokens,
        timestamp: Date.now(),
        ttl: CACHE_TTL_MS,
      });
      return tokens;
    } finally {
      this.pendingRequests.delete(chainId);
    }
  }

  private async fetchWithRetry(
    chainId: number,
    attempt: number = 1
  ): Promise<TokenState[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

      const response = await fetch(
        `/api/swap/oneinch/tokens?chainId=${chainId}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const tokens = this.validateAndTransformTokens(data);

      if (tokens.length === 0) {
        throw new Error("No tokens returned from API");
      }

      return tokens;
    } catch (error) {
      this.recordError(chainId);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(chainId, attempt + 1);
      }

      throw new Error(
        `Failed to fetch tokens after ${MAX_RETRIES} attempts: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private validateAndTransformTokens(data: any): TokenState[] {
    if (!data.tokens || typeof data.tokens !== "object") {
      throw new Error("Invalid token data structure");
    }

    return Object.values(data.tokens)
      .filter((token: any) => this.isValidToken(token))
      .map((token: any) => ({
        symbol: String(token.symbol).toUpperCase(),
        name: String(token.name),
        address: String(token.address).toLowerCase(),
        decimals: Number(token.decimals) || 18,
        logoURI: token.logoURI ? String(token.logoURI) : undefined,
      }));
  }

  private isValidToken(token: any): boolean {
    return (
      token &&
      typeof token === "object" &&
      typeof token.symbol === "string" &&
      typeof token.name === "string" &&
      typeof token.address === "string" &&
      token.symbol.length > 0 &&
      token.address.length > 0
    );
  }

  private isCacheValid(chainId: number): boolean {
    const entry = this.cache.get(chainId);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  private recordHit(chainId: number): void {
    const metrics = this.getMetrics(chainId);
    metrics.hits++;
  }

  private recordError(chainId: number): void {
    const metrics = this.getMetrics(chainId);
    metrics.errors++;
  }

  private getMetrics(chainId: number): CacheMetrics {
    if (!this.metrics.has(chainId)) {
      this.metrics.set(chainId, {
        hits: 0,
        misses: 0,
        errors: 0,
        lastFetch: null,
      });
    }
    return this.metrics.get(chainId)!;
  }

  getStats(chainId?: number) {
    if (chainId !== undefined) {
      return {
        chainId,
        metrics: this.metrics.get(chainId),
        cached: this.cache.has(chainId),
        age: this.cache.has(chainId)
          ? Date.now() - this.cache.get(chainId)!.timestamp
          : null,
      };
    }

    return {
      totalChains: this.cache.size,
      metrics: Object.fromEntries(this.metrics),
      cacheSize: this.cache.size,
    };
  }

  clearCache(chainId?: number): void {
    if (chainId !== undefined) {
      this.cache.delete(chainId);
      this.metrics.delete(chainId);
    } else {
      this.cache.clear();
      this.metrics.clear();
    }
  }

  async preloadTokens(chainIds: number[]): Promise<void> {
    await Promise.allSettled(
      chainIds.map((id) => this.fetchTokens(id).catch(() => null))
    );
  }

  formatAmount(amount: string, decimals: number): string {
    return formatUnits(amount, decimals);
  }

  reset(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.metrics.clear();
  }
}

export const tokenCacheManager = new TokenCacheManager();
