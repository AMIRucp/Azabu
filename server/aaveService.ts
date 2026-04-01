export interface AaveReserve {
  chain: string;
  chainId: number;
  symbol: string;
  name: string;
  underlyingAsset: string;
  supplyApy: number;
  borrowApy: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  tvlUsd: number;
  ltv: number;
  liquidationThreshold: number;
  decimals: number;
  stablecoin: boolean;
  canSupply: boolean;
  canBorrow: boolean;
  iconUrl: string | null;
}

const AAVE_GQL = 'https://api.v3.aave.com/graphql';
const CACHE_TTL = 5 * 60 * 1000;
let cachedMarkets: AaveReserve[] | null = null;
let cacheTimestamp = 0;

const SUPPORTED_CHAINS = [1, 137, 42161, 8453];

const CHAIN_NAMES: Record<number, string> = {
  1: 'ethereum', 137: 'polygon', 42161: 'arbitrum', 8453: 'base',
};

const STABLECOINS = new Set([
  'USDC', 'USDT', 'DAI', 'FRAX', 'LUSD', 'GHO', 'PYUSD', 'crvUSD',
  'USDS', 'RLUSD', 'USDe', 'sUSDe', 'SGHO', 'USDbC', 'EURC', 'sGHO',
]);

const MARKETS_QUERY = `
query AaveMarkets($chainIds: [Int!]!) {
  markets(request: { chainIds: $chainIds }) {
    name
    chain { chainId name }
    reserves {
      underlyingToken { symbol address decimals imageUrl }
      supplyInfo {
        apy { value }
        maxLTV { value }
        liquidationThreshold { value }
        total { value }
        canBeCollateral
      }
      borrowInfo {
        apy { value }
        total { usd }
        borrowingState
      }
      isFrozen
      isPaused
      size { usd }
    }
  }
}`;

async function fetchAllMarkets(): Promise<AaveReserve[]> {
  if (cachedMarkets && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedMarkets;
  }

  try {
    const res = await fetch(AAVE_GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: MARKETS_QUERY, variables: { chainIds: SUPPORTED_CHAINS } }),
    });

    if (!res.ok) throw new Error(`Aave GQL error: ${res.status}`);

    const json = await res.json();
    if (json.errors?.length) {
      console.error('Aave GQL errors:', json.errors.map((e: any) => e.message).join('; '));
    }

    const allMarkets = json.data?.markets;
    if (!allMarkets) throw new Error('No markets data returned');

    const reserves: AaveReserve[] = [];
    const seen = new Map<string, AaveReserve>();

    for (const market of allMarkets) {
      const chainId = market.chain?.chainId;
      if (!chainId || !SUPPORTED_CHAINS.includes(chainId)) continue;
      const chainName = CHAIN_NAMES[chainId] || 'ethereum';

      for (const r of market.reserves) {
        if (r.isFrozen || r.isPaused) continue;

        const token = r.underlyingToken;
        if (!token?.address || !token?.symbol) continue;

        const sizeUsd = r.size?.usd ? parseFloat(r.size.usd) : 0;
        if (sizeUsd < 1000) continue;

        const supplyApy = r.supplyInfo?.apy?.value ? parseFloat(r.supplyInfo.apy.value) * 100 : 0;
        const borrowApy = r.borrowInfo?.apy?.value ? parseFloat(r.borrowInfo.apy.value) * 100 : 0;
        const totalBorrowUsd = r.borrowInfo?.total?.usd ? parseFloat(r.borrowInfo.total.usd) : 0;
        const totalSupplyUsd = sizeUsd + totalBorrowUsd;
        const ltv = r.supplyInfo?.maxLTV?.value ? parseFloat(r.supplyInfo.maxLTV.value) * 100 : 0;
        const liqThreshold = r.supplyInfo?.liquidationThreshold?.value
          ? parseFloat(r.supplyInfo.liquidationThreshold.value) * 100
          : 0;

        const canBorrow = r.borrowInfo?.borrowingState === 'ENABLED' || (r.borrowInfo?.borrowingState !== 'DISABLED' && borrowApy > 0);

        const reserve: AaveReserve = {
          chain: chainName,
          chainId,
          symbol: token.symbol,
          name: token.symbol,
          underlyingAsset: token.address.toLowerCase(),
          supplyApy,
          borrowApy,
          totalSupplyUsd,
          totalBorrowUsd,
          tvlUsd: sizeUsd,
          ltv,
          liquidationThreshold: liqThreshold,
          decimals: token.decimals ?? 18,
          stablecoin: STABLECOINS.has(token.symbol),
          canSupply: true,
          canBorrow,
          iconUrl: token.imageUrl || null,
        };

        const dedupeKey = `${chainId}-${token.address.toLowerCase()}`;
        const existing = seen.get(dedupeKey);
        if (!existing || reserve.totalSupplyUsd > existing.totalSupplyUsd) {
          seen.set(dedupeKey, reserve);
        }
      }
    }

    const result = Array.from(seen.values()).sort((a, b) => b.totalSupplyUsd - a.totalSupplyUsd);
    cachedMarkets = result;
    cacheTimestamp = Date.now();
    return result;
  } catch (e: any) {
    console.error('Aave market fetch error:', e.message);
    return cachedMarkets || [];
  }
}

export async function getAaveMarkets(chain?: string): Promise<AaveReserve[]> {
  const all = await fetchAllMarkets();
  if (!chain) return all;
  const chainLower = chain.toLowerCase();
  return all.filter(r => r.chain === chainLower);
}
