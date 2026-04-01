const DEX_API = "https://api.dexscreener.com";

export interface DexPair {
  pairAddress: string;
  baseToken: { address?: string; name?: string; symbol?: string };
  quoteToken: { address?: string; name?: string; symbol?: string };
  dexId: string;
  chainId: string;
  priceUsd: number | null;
  priceNative: number | null;
  priceChange: { m5: number | null; h1: number | null; h6: number | null; h24: number | null };
  volume: { h24: number | null; h6: number | null; h1: number | null };
  liquidity: { usd: number | null; base: number | null; quote: number | null };
  fdv: number | null;
  marketCap: number | null;
  txns: { h24: { buys: number; sells: number } | null };
  url: string;
  pairCreatedAt: number | null;
}

export interface LaunchProfile {
  tokenAddress: string;
  chainId: string;
  icon: string | null;
  description: string | null;
  url: string;
  links: any[];
  name: string;
  pair: DexPair | null;
}

function normalisePair(p: any): DexPair | null {
  if (!p) return null;
  return {
    pairAddress: p.pairAddress,
    baseToken: p.baseToken || {},
    quoteToken: p.quoteToken || {},
    dexId: p.dexId || "unknown",
    chainId: p.chainId || "solana",
    priceUsd: p.priceUsd ? parseFloat(p.priceUsd) : null,
    priceNative: p.priceNative ? parseFloat(p.priceNative) : null,
    priceChange: {
      m5: p.priceChange?.m5 ?? null,
      h1: p.priceChange?.h1 ?? null,
      h6: p.priceChange?.h6 ?? null,
      h24: p.priceChange?.h24 ?? null,
    },
    volume: {
      h24: p.volume?.h24 ?? null,
      h6: p.volume?.h6 ?? null,
      h1: p.volume?.h1 ?? null,
    },
    liquidity: {
      usd: p.liquidity?.usd ?? null,
      base: p.liquidity?.base ?? null,
      quote: p.liquidity?.quote ?? null,
    },
    fdv: p.fdv ?? null,
    marketCap: p.marketCap ?? null,
    txns: { h24: p.txns?.h24 ?? null },
    url: p.url || `https://dexscreener.com/solana/${p.pairAddress}`,
    pairCreatedAt: p.pairCreatedAt ?? null,
  };
}

export async function fetchDexScreenerToken(mintAddress: string): Promise<DexPair | null> {
  if (!mintAddress || mintAddress.startsWith("PLACEHOLDER")) return null;
  try {
    const res = await fetch(
      `${DEX_API}/token-pairs/v1/solana/${encodeURIComponent(mintAddress)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pairs: any[] = Array.isArray(data) ? data : (data.pairs || []);
    if (!pairs.length) return null;
    const best = pairs
      .filter((p: any) => p.chainId === "solana" && p.liquidity?.usd > 0)
      .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
      || pairs[0];
    return normalisePair(best);
  } catch { return null; }
}

export async function searchDexScreener(query: string): Promise<DexPair | null> {
  if (!query?.trim()) return null;
  try {
    const res = await fetch(
      `${DEX_API}/latest/dex/search?q=${encodeURIComponent(query.trim())}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pairs: any[] = data.pairs || [];
    const solana = pairs
      .filter((p: any) => p.chainId === "solana" && p.liquidity?.usd > 0)
      .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    if (!solana.length) return null;
    return normalisePair(solana[0]);
  } catch { return null; }
}

export async function fetchNewLaunches(): Promise<LaunchProfile[] | null> {
  try {
    const res = await fetch(
      `${DEX_API}/token-profiles/latest/v1`,
      { signal: AbortSignal.timeout(7000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const profiles: any[] = Array.isArray(data) ? data : [];
    const seen = new Set<string>();
    const filtered = profiles
      .filter((p: any) => {
        if (p.chainId !== "solana") return false;
        if (seen.has(p.tokenAddress)) return false;
        seen.add(p.tokenAddress);
        return true;
      })
      .slice(0, 8)
      .map((p: any) => ({
        tokenAddress: p.tokenAddress,
        chainId: p.chainId,
        icon: p.icon || null,
        description: p.description || null,
        url: p.url || `https://dexscreener.com/solana/${p.tokenAddress}`,
        links: p.links || [],
        name: p.links?.find((l: any) => l.type === "website")?.label
          || p.description?.split(" ").slice(0, 3).join(" ")
          || p.tokenAddress.slice(0, 8) + "...",
        pair: null,
      }));
    return filtered;
  } catch { return null; }
}

export async function enrichLaunchesWithPairData(launches: LaunchProfile[]): Promise<LaunchProfile[]> {
  if (!launches?.length) return [];
  const enriched = await Promise.all(
    launches.slice(0, 5).map(async (launch) => {
      try {
        const pair = await fetchDexScreenerToken(launch.tokenAddress);
        return { ...launch, pair };
      } catch {
        return { ...launch, pair: null };
      }
    })
  );
  return enriched;
}

export function fmtDexNumber(n: number | null | undefined, prefix = "$"): string {
  if (n == null || isNaN(n)) return "--";
  if (n >= 1_000_000_000) return `${prefix}${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

export function fmtDexPrice(p: number | null | undefined): string {
  if (p == null || isNaN(p)) return "--";
  if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  if (p >= 0.0001) return `$${p.toFixed(6)}`;
  return `$${p.toExponential(4)}`;
}
