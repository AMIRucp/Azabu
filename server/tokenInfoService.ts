import axios from 'axios';

const JUPITER_TOKEN_API = 'https://tokens.jup.ag';
const JUPITER_ULTRA_API = 'https://api.jup.ag/ultra/v1';

const JUPITER_API_KEY = process.env.JUPITER_API_KEY;
const searchHeaders: Record<string, string> = {};
if (JUPITER_API_KEY) searchHeaders['x-api-key'] = JUPITER_API_KEY;

export interface TokenInfoResult {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string | null;
  isVerified: boolean;
  tags: string[];
  dailyVolume: number | null;
  organicScore: number | null;
  freezeAuthority: string | null;
  mintAuthority: string | null;
  permanentDelegate: string | null;
  knownAccounts: Record<string, string>;
}

const infoCache = new Map<string, TokenInfoResult | null>();
const CACHE_TTL = 5 * 60 * 1000;
const cacheTimes = new Map<string, number>();

export async function getTokenResearch(query: string): Promise<TokenInfoResult | null> {
  const upper = query.trim().toUpperCase();
  const now = Date.now();

  if (infoCache.has(upper) && cacheTimes.get(upper)! > now - CACHE_TTL) {
    return infoCache.get(upper) || null;
  }

  try {
    const res = await axios.get(
      `https://api.jup.ag/ultra/v1/search?query=${encodeURIComponent(query.trim())}`,
      { headers: searchHeaders, timeout: 8000 }
    );

    const tokens = res.data || [];
    if (tokens.length === 0) {
      infoCache.set(upper, null);
      cacheTimes.set(upper, now);
      return null;
    }

    let match = tokens.find((t: any) =>
      t.symbol?.toUpperCase() === upper || (t.address || t.id) === query.trim()
    );

    if (!match) {
      match = tokens[0];
    }

    if (upper !== match.symbol?.toUpperCase() && tokens.length > 1) {
      const exactMatches = tokens.filter((t: any) => t.symbol?.toUpperCase() === upper);
      if (exactMatches.length > 0) {
        const verified = exactMatches.filter(
          (t: any) => t.isVerified || (t.tags || []).includes('verified')
        );
        match = verified.length > 0
          ? verified.sort((a: any, b: any) => (b.organicScore || b.daily_volume || 0) - (a.organicScore || a.daily_volume || 0))[0]
          : exactMatches.sort((a: any, b: any) => (b.organicScore || b.daily_volume || 0) - (a.organicScore || a.daily_volume || 0))[0];
      }
    }

    const result: TokenInfoResult = {
      address: match.address || match.id || '',
      name: match.name || 'Unknown',
      symbol: match.symbol || upper,
      decimals: match.decimals || 9,
      logoURI: match.icon || match.logoURI || null,
      isVerified: match.isVerified || (match.tags || []).includes('verified') || false,
      tags: match.tags || [],
      dailyVolume: match.daily_volume || match.dailyVolume || null,
      organicScore: match.organicScore || null,
      freezeAuthority: match.freeze_authority || match.freezeAuthority || null,
      mintAuthority: match.mint_authority || match.mintAuthority || null,
      permanentDelegate: match.permanent_delegate || match.permanentDelegate || null,
      knownAccounts: match.known_accounts || {},
    };

    infoCache.set(upper, result);
    cacheTimes.set(upper, now);
    return result;
  } catch (e: any) {
    console.error('Token research fetch error:', e.message);
    infoCache.set(upper, null);
    cacheTimes.set(upper, now);
    return null;
  }
}

export interface DiscoveredToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string | null;
  daily_volume: number | null;
  created_at: string | null;
  freeze_authority: string | null;
  mint_authority: string | null;
  known_tags: string[];
}

export async function getRecentTokens(limit: number = 20): Promise<DiscoveredToken[]> {
  try {
    const response = await fetch(`${JUPITER_TOKEN_API}/tokens_with_markets`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('Jupiter token API error:', response.status);
      return getTokensViaUltraSearch('solana', limit);
    }

    const tokens: any[] = await response.json();

    const filtered = tokens
      .filter((t: any) => {
        if (!t.symbol || !t.name || !t.address) return false;
        if (t.symbol.length > 12) return false;
        if (t.daily_volume !== undefined && t.daily_volume !== null && t.daily_volume < 1000) return false;
        if (t.freeze_authority) return false;
        return true;
      })
      .sort((a: any, b: any) => {
        const volA = a.daily_volume || 0;
        const volB = b.daily_volume || 0;
        return volB - volA;
      })
      .slice(0, limit)
      .map((t: any) => ({
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        decimals: t.decimals || 9,
        logoURI: t.logoURI || null,
        daily_volume: t.daily_volume || null,
        created_at: t.created_at || null,
        freeze_authority: t.freeze_authority || null,
        mint_authority: t.mint_authority || null,
        known_tags: t.tags || [],
      }));

    return filtered;
  } catch (e: any) {
    console.error('Failed to fetch recent tokens:', e.message);
    return getTokensViaUltraSearch('solana', limit);
  }
}

async function getTokensViaUltraSearch(query: string, limit: number): Promise<DiscoveredToken[]> {
  try {
    const hdrs: Record<string, string> = { Accept: 'application/json' };
    if (JUPITER_API_KEY) hdrs['x-api-key'] = JUPITER_API_KEY;
    const response = await fetch(`${JUPITER_ULTRA_API}/search?query=${encodeURIComponent(query)}`, {
      headers: hdrs,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return [];
    const tokens: any[] = await response.json();
    return tokens
      .filter((t: any) => t.symbol && t.name && (t.address || t.id))
      .slice(0, limit)
      .map((t: any) => ({
        address: t.address || t.id,
        name: t.name,
        symbol: t.symbol,
        decimals: t.decimals || 9,
        logoURI: t.icon || t.logoURI || null,
        daily_volume: t.daily_volume || null,
        created_at: t.created_at || null,
        freeze_authority: null,
        mint_authority: null,
        known_tags: t.tags || [],
      }));
  } catch (e: any) {
    console.error('Ultra search fallback failed:', e.message);
    return [];
  }
}

export async function getNewTokens(limit: number = 15): Promise<DiscoveredToken[]> {
  try {
    const response = await fetch(`${JUPITER_TOKEN_API}/tokens/new`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const fallback = await getRecentTokens(limit);
      return fallback;
    }

    const tokens: any[] = await response.json();

    const filtered = tokens
      .filter((t: any) => {
        if (!t.symbol || !t.name || !t.address) return false;
        if (t.symbol.length > 12) return false;
        return true;
      })
      .slice(0, limit)
      .map((t: any) => ({
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        decimals: t.decimals || 9,
        logoURI: t.logoURI || null,
        daily_volume: t.daily_volume || null,
        created_at: t.created_at || null,
        freeze_authority: t.freeze_authority || null,
        mint_authority: t.mint_authority || null,
        known_tags: t.tags || [],
      }));

    if (filtered.length === 0) {
      return getRecentTokens(limit);
    }

    return filtered;
  } catch (e: any) {
    console.error('Failed to fetch new tokens, falling back to ultra search:', e.message);
    const ultraResults = await getTokensViaUltraSearch('trending', limit);
    if (ultraResults.length > 0) return ultraResults;
    return getRecentTokens(limit);
  }
}
