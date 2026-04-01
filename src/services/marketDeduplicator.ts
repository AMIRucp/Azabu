import type { UnifiedMarket } from '@/types/market';

export interface DeduplicatedMarket {
  primary: UnifiedMarket;
  alternatives: UnifiedMarket[];
  totalVolume24h: number;
  totalOpenInterest: number;
  bestFundingRate: number;
  bestFundingProtocol: string;
  venueCount: number;
  chainCount: number;
  normalizedBase: string;
}

export function normalizeBaseAsset(raw: string): string {
  let s = raw.toUpperCase();

  s = s.replace(/-PERP$/i, '');
  s = s.replace(/[_\/]USDT$/i, '');
  s = s.replace(/[_\/]USDC$/i, '');
  s = s.replace(/[_\/]USD$/i, '');
  s = s.replace(/USDT$/i, '');
  s = s.replace(/USDC$/i, '');

  s = s.replace(/^1000/, '');

  const aliases: Record<string, string> = {
    'WBTC': 'BTC',
    'WETH': 'ETH',
    'WSOL': 'SOL',
    'WBNB': 'BNB',
    'CL': 'OIL',
    'WTI': 'OIL',
    'CRUDE': 'OIL',
    'XAU': 'GOLD',
    'XAG': 'SILVER',
    'HG': 'COPPER',
    'XCU': 'COPPER',
    'XPT': 'PLATINUM',
    'XPD': 'PALLADIUM',
    'GOOGL': 'GOOG',
    'SPX': 'SP500',
    'DJI': 'DOWJONES',
    'NDX': 'NASDAQ100',
    'NIK': 'NIKKEI225',
    'FTSE': 'FTSE100',
    'DAX': 'DAX40',
  };

  return aliases[s] || s;
}

export function deduplicateMarkets(
  allMarkets: UnifiedMarket[]
): DeduplicatedMarket[] {
  const groups = new Map<string, UnifiedMarket[]>();

  for (const market of allMarkets) {
    const base = normalizeBaseAsset(market.baseAsset);
    let key: string;

    if (market.type === 'spot') {
      const quote = (market.quoteAsset || 'USDC').toUpperCase();
      key = `spot:${base}/${quote}`;
    } else {
      key = base;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(market);
  }

  const result: DeduplicatedMarket[] = [];

  for (const [normalizedBase, markets] of groups) {
    const sorted = [...markets].sort((a, b) => {
      const levDiff = (b.maxLeverage || 0) - (a.maxLeverage || 0);
      if (levDiff !== 0) return levDiff;
      return (b.volume24h || 0) - (a.volume24h || 0);
    });

    const primary = sorted[0];
    const alternatives = sorted.slice(1);

    const totalVolume24h = markets.reduce((s, m) => s + (m.volume24h || 0), 0);
    const totalOpenInterest = markets.reduce((s, m) => s + (m.openInterest || 0), 0);

    let bestFunding = markets[0];
    for (const m of markets) {
      if (Math.abs(m.fundingRate || 0) < Math.abs(bestFunding.fundingRate || 0)) {
        bestFunding = m;
      }
    }

    const chainCount = new Set(markets.map((m) => m.chain)).size;

    result.push({
      primary,
      alternatives,
      totalVolume24h,
      totalOpenInterest,
      bestFundingRate: bestFunding.fundingRate || 0,
      bestFundingProtocol: bestFunding.protocol,
      venueCount: markets.length,
      chainCount,
      normalizedBase,
    });
  }

  result.sort((a, b) => b.totalVolume24h - a.totalVolume24h);

  return result;
}

export function getDedupId(market: DeduplicatedMarket): string {
  return `dedup:${market.normalizedBase}`;
}

export function findDeduplicatedForSymbol(
  deduped: DeduplicatedMarket[],
  symbol: string
): DeduplicatedMarket | undefined {
  return deduped.find(d =>
    d.primary.symbol === symbol ||
    d.alternatives.some(a => a.symbol === symbol)
  );
}
