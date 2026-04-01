import axios from 'axios';
import { TOKEN_REGISTRY, REGISTRY_BY_MINT, STOCK_ALIASES, isStockToken } from './tokenRegistry';
import { RWA_BY_SYMBOL, RWA_BY_ALIAS, RWA_BY_MINT } from './rwa/tokens';

const JUPITER_API_KEY = process.env.JUPITER_API_KEY;
const headers: Record<string, string> = {};
if (JUPITER_API_KEY) headers['x-api-key'] = JUPITER_API_KEY;

export interface ResolvedToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string | null;
  isVerified: boolean;
  tags: string[];
  category?: 'crypto' | 'stock' | 'etf' | 'commodity';
  provider?: 'xstocks' | 'ondo' | 'remora';
  company?: string;
  tradfiTicker?: string;
}

const resolveCache = new Map<string, ResolvedToken | null>();

export async function resolveToken(symbolOrMint: string): Promise<ResolvedToken | null> {
  const upper = symbolOrMint.trim().toUpperCase();

  if (resolveCache.has(upper)) return resolveCache.get(upper) || null;

  const aliasResolved = STOCK_ALIASES[upper];
  const registryKey = aliasResolved || upper;

  if (TOKEN_REGISTRY[registryKey]) {
    const t = TOKEN_REGISTRY[registryKey];
    const resolved: ResolvedToken = {
      address: t.address, name: t.name, symbol: t.symbol,
      decimals: t.decimals, logoURI: t.logoURI,
      isVerified: true, tags: ['verified', 'strict'],
      category: t.category,
      provider: t.provider,
      company: t.company,
      tradfiTicker: t.tradfiTicker,
    };
    resolveCache.set(upper, resolved);
    return resolved;
  }

  if (REGISTRY_BY_MINT[symbolOrMint]) {
    const t = REGISTRY_BY_MINT[symbolOrMint];
    const resolved: ResolvedToken = {
      address: t.address, name: t.name, symbol: t.symbol,
      decimals: t.decimals, logoURI: t.logoURI,
      isVerified: true, tags: ['verified', 'strict'],
    };
    resolveCache.set(upper, resolved);
    return resolved;
  }

  const rwaBySymbol = RWA_BY_SYMBOL.get(upper);
  if (rwaBySymbol) {
    const resolved: ResolvedToken = {
      address: rwaBySymbol.mint, name: rwaBySymbol.name, symbol: rwaBySymbol.symbol,
      decimals: rwaBySymbol.decimals, logoURI: null,
      isVerified: rwaBySymbol.jupiterVerified, tags: rwaBySymbol.jupiterVerified ? ['verified'] : [],
      category: rwaBySymbol.category === 'equities' ? 'stock' : rwaBySymbol.category === 'etfs' ? 'etf' : rwaBySymbol.category === 'commodities' ? 'commodity' : undefined,
    };
    resolveCache.set(upper, resolved);
    return resolved;
  }

  const rwaByAlias = RWA_BY_ALIAS.get(symbolOrMint.toLowerCase());
  if (rwaByAlias) {
    const resolved: ResolvedToken = {
      address: rwaByAlias.mint, name: rwaByAlias.name, symbol: rwaByAlias.symbol,
      decimals: rwaByAlias.decimals, logoURI: null,
      isVerified: rwaByAlias.jupiterVerified, tags: rwaByAlias.jupiterVerified ? ['verified'] : [],
    };
    resolveCache.set(upper, resolved);
    return resolved;
  }

  const rwaByMint = RWA_BY_MINT.get(symbolOrMint);
  if (rwaByMint) {
    const resolved: ResolvedToken = {
      address: rwaByMint.mint, name: rwaByMint.name, symbol: rwaByMint.symbol,
      decimals: rwaByMint.decimals, logoURI: null,
      isVerified: rwaByMint.jupiterVerified, tags: rwaByMint.jupiterVerified ? ['verified'] : [],
    };
    resolveCache.set(upper, resolved);
    return resolved;
  }

  if (symbolOrMint.length >= 32 && symbolOrMint.length <= 44) {
    try {
      const res = await axios.get(
        `https://api.jup.ag/ultra/v1/search?query=${symbolOrMint}`,
        { headers, timeout: 8000 }
      );
      const tokens = res.data || [];
      const match = tokens.find((t: any) => (t.address || t.id) === symbolOrMint);
      if (match) {
        const resolved: ResolvedToken = {
          address: match.address || match.id,
          name: match.name,
          symbol: match.symbol,
          decimals: match.decimals,
          logoURI: match.icon || match.logoURI || null,
          isVerified: match.isVerified || (match.tags || []).includes('verified'),
          tags: match.tags || [],
        };
        resolveCache.set(upper, resolved);
        return resolved;
      }
    } catch {}
    resolveCache.set(upper, null);
    return null;
  }

  try {
    const res = await axios.get(
      `https://api.jup.ag/ultra/v1/search?query=${encodeURIComponent(upper)}`,
      { headers, timeout: 8000 }
    );
    const tokens = res.data || [];

    if (tokens.length === 0) {
      resolveCache.set(upper, null);
      return null;
    }

    const exactMatches = tokens.filter(
      (t: any) => t.symbol?.toUpperCase() === upper
    );

    if (exactMatches.length === 0) {
      const nameMatches = tokens.filter(
        (t: any) => {
          const name = t.name?.toUpperCase();
          if (!name) return false;
          return name === upper || name.includes(upper) || upper.includes(name);
        }
      );
      if (nameMatches.length > 0) {
        const verified = nameMatches.filter(
          (t: any) => t.isVerified || (t.tags || []).includes('verified')
        );
        const best = verified.length > 0 ? verified : nameMatches;
        best.sort((a: any, b: any) =>
          (b.organicScore || b.daily_volume || 0) - (a.organicScore || a.daily_volume || 0)
        );
        const t = best[0];
        const resolved: ResolvedToken = {
          address: t.address || t.id, name: t.name, symbol: t.symbol,
          decimals: t.decimals, logoURI: t.icon || t.logoURI || null,
          isVerified: t.isVerified || (t.tags || []).includes('verified'),
          tags: t.tags || [],
        };
        resolveCache.set(upper, resolved);
        return resolved;
      }
      resolveCache.set(upper, null);
      return null;
    }

    const verified = exactMatches.filter(
      (t: any) => t.isVerified || (t.tags || []).includes('verified')
    );

    if (verified.length === 1) {
      const t = verified[0];
      const resolved: ResolvedToken = {
        address: t.address || t.id, name: t.name, symbol: t.symbol,
        decimals: t.decimals, logoURI: t.icon || t.logoURI || null,
        isVerified: true, tags: t.tags || [],
      };
      resolveCache.set(upper, resolved);
      return resolved;
    }

    if (verified.length > 1) {
      verified.sort((a: any, b: any) =>
        (b.organicScore || b.daily_volume || 0) - (a.organicScore || a.daily_volume || 0)
      );
      const t = verified[0];
      const resolved: ResolvedToken = {
        address: t.address || t.id, name: t.name, symbol: t.symbol,
        decimals: t.decimals, logoURI: t.icon || t.logoURI || null,
        isVerified: true, tags: t.tags || [],
      };
      resolveCache.set(upper, resolved);
      return resolved;
    }

    exactMatches.sort((a: any, b: any) =>
      (b.organicScore || b.daily_volume || 0) - (a.organicScore || a.daily_volume || 0)
    );
    const t = exactMatches[0];
    const resolved: ResolvedToken = {
      address: t.address || t.id, name: t.name, symbol: t.symbol,
      decimals: t.decimals, logoURI: t.icon || t.logoURI || null,
      isVerified: false, tags: t.tags || [],
    };
    resolveCache.set(upper, resolved);
    return resolved;

  } catch {
    resolveCache.set(upper, null);
    return null;
  }
}

import { normalizeTokenInput } from './tokenNormalizer';

export async function resolveTokenSmart(rawInput: string): Promise<{
  token: ResolvedToken | null;
  corrected: boolean;
  original: string;
  correctedTo?: string;
  confidence: string;
  suggestion?: string;
}> {
  const norm = normalizeTokenInput(rawInput);

  let token = await resolveToken(norm.normalized);

  if (!token && norm.corrected) {
    token = await resolveToken(norm.original.toUpperCase());
  }

  return {
    token,
    corrected: norm.corrected,
    original: norm.original,
    correctedTo: norm.corrected ? norm.normalized : undefined,
    confidence: norm.confidence,
    suggestion: norm.suggestion,
  };
}

const logoCache = new Map<string, string | null>();

export async function getTokenLogo(mint: string): Promise<string | null> {
  if (logoCache.has(mint)) return logoCache.get(mint)!;

  if (REGISTRY_BY_MINT[mint] && REGISTRY_BY_MINT[mint].logoURI) {
    const logo = REGISTRY_BY_MINT[mint].logoURI;
    logoCache.set(mint, logo);
    return logo;
  }

  try {
    const res = await axios.get(
      `https://api.jup.ag/ultra/v1/search?query=${mint}`,
      { headers, timeout: 8000 }
    );
    const tokens = res.data || [];
    const match = tokens.find((t: any) => (t.address || t.id) === mint);
    const logo = match?.icon || match?.logoURI || null;
    logoCache.set(mint, logo);
    return logo;
  } catch {
    logoCache.set(mint, null);
    return null;
  }
}
