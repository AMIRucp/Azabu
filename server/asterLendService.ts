const ASTER_LEND_MARKETS = [
  {
    symbol: 'ASTER',
    name: 'Aster Token',
    protocol: 'Venus',
    supplyApy: 8.2,
    borrowApy: 12.5,
    ltv: 80,
    totalSupplyUsd: 142_000_000,
    totalBorrowUsd: 98_000_000,
    utilization: 69,
    canSupply: true,
    canBorrow: true,
    stablecoin: false,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    protocol: 'Venus',
    supplyApy: 5.4,
    borrowApy: 7.8,
    ltv: 85,
    totalSupplyUsd: 320_000_000,
    totalBorrowUsd: 256_000_000,
    utilization: 80,
    canSupply: true,
    canBorrow: true,
    stablecoin: true,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    protocol: 'Venus',
    supplyApy: 4.9,
    borrowApy: 7.2,
    ltv: 85,
    totalSupplyUsd: 285_000_000,
    totalBorrowUsd: 213_000_000,
    utilization: 75,
    canSupply: true,
    canBorrow: true,
    stablecoin: true,
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    protocol: 'Venus',
    supplyApy: 3.1,
    borrowApy: 5.6,
    ltv: 75,
    totalSupplyUsd: 198_000_000,
    totalBorrowUsd: 118_000_000,
    utilization: 60,
    canSupply: true,
    canBorrow: true,
    stablecoin: false,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    protocol: 'Venus',
    supplyApy: 2.8,
    borrowApy: 4.9,
    ltv: 80,
    totalSupplyUsd: 175_000_000,
    totalBorrowUsd: 105_000_000,
    utilization: 60,
    canSupply: true,
    canBorrow: true,
    stablecoin: false,
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    protocol: 'Venus',
    supplyApy: 1.9,
    borrowApy: 3.8,
    ltv: 75,
    totalSupplyUsd: 210_000_000,
    totalBorrowUsd: 105_000_000,
    utilization: 50,
    canSupply: true,
    canBorrow: true,
    stablecoin: false,
  },
  {
    symbol: 'asBNB',
    name: 'Staked BNB (Income Collateral)',
    protocol: 'Pendle',
    supplyApy: 11.4,
    borrowApy: 0,
    ltv: 70,
    totalSupplyUsd: 85_000_000,
    totalBorrowUsd: 0,
    utilization: 0,
    canSupply: true,
    canBorrow: false,
    stablecoin: false,
  },
  {
    symbol: 'USDF',
    name: 'USD Fiat (Income Collateral)',
    protocol: 'Pendle',
    supplyApy: 9.8,
    borrowApy: 0,
    ltv: 75,
    totalSupplyUsd: 62_000_000,
    totalBorrowUsd: 0,
    utilization: 0,
    canSupply: true,
    canBorrow: false,
    stablecoin: true,
  },
  {
    symbol: 'kHYPE',
    name: 'Karak HYPE (Yield Token)',
    protocol: 'Pendle',
    supplyApy: 14.2,
    borrowApy: 0,
    ltv: 65,
    totalSupplyUsd: 38_000_000,
    totalBorrowUsd: 0,
    utilization: 0,
    canSupply: true,
    canBorrow: false,
    stablecoin: false,
  },
];

let cachedMarkets: any[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function getAsterLendMarkets() {
  if (cachedMarkets && Date.now() - cacheTime < CACHE_TTL) {
    return cachedMarkets;
  }

  try {
    const res = await fetch('https://fapi.asterdex.com/fapi/v3/ticker/24hr');
    if (res.ok) {
      const tickers = await res.json();
      const priceMap: Record<string, number> = {};
      for (const t of tickers) {
        const sym = (t.symbol || '').replace(/USDT$/, '');
        if (t.lastPrice) priceMap[sym] = parseFloat(t.lastPrice);
      }

      for (const m of ASTER_LEND_MARKETS) {
        if (priceMap[m.symbol]) {
          (m as any).price = priceMap[m.symbol];
        }
      }
    }
  } catch {}

  const markets = ASTER_LEND_MARKETS.map(m => ({
    ...m,
    tvlUsd: m.totalSupplyUsd,
    iconUrl: null,
    underlyingAsset: '',
    decimals: 18,
    chainId: 56,
    chain: 'aster',
    liquidationThreshold: m.ltv + 5,
  }));

  cachedMarkets = markets;
  cacheTime = Date.now();
  return markets;
}
