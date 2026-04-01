export type RwaCategory =
  | 'equities'
  | 'etfs'
  | 'treasuries'
  | 'yield'
  | 'commodities'
  | 'wrapped'
  | 'preipo';

export type RwaIssuer =
  | 'xStocks'
  | 'Ondo'
  | 'BlackRock'
  | 'Remora'
  | 'GoldIssuance'
  | 'Tether'
  | 'Wormhole'
  | 'Coinbase'
  | 'PreStocks';

export const CATEGORY_CONFIG: Record<RwaCategory, { label: string; description: string }> = {
  equities: {
    label: 'Stocks',
    description: 'Tokenized U.S. equities backed 1:1 by real shares',
  },
  etfs: {
    label: 'ETFs',
    description: 'Tokenized exchange-traded funds',
  },
  treasuries: {
    label: 'Treasuries',
    description: 'US Treasury and government bond tokens',
  },
  yield: {
    label: 'Yield',
    description: 'Yield-bearing dollar tokens backed by treasuries and deposits',
  },
  commodities: {
    label: 'Commodities',
    description: 'Tokenized gold, silver, platinum, and energy',
  },
  wrapped: {
    label: 'Wrapped',
    description: 'Cross-chain wrapped tokens on Solana',
  },
  preipo: {
    label: 'Pre-IPO',
    description: 'Tokenized pre-IPO stocks via PreStocks',
  },
};

export function categoryFromKeyword(keyword: string): RwaCategory | null {
  const lower = keyword.toLowerCase();
  if (/pre.?ipo|prestocks|private.?compan/.test(lower)) return 'preipo';
  if (/stock|equit|share/.test(lower)) return 'equities';
  if (/etf/.test(lower)) return 'etfs';
  if (/treasur|bond|t-?bill|gov/.test(lower)) return 'treasuries';
  if (/commodit|gold|silver|oil|metal/.test(lower)) return 'commodities';
  if (/wrap|wbtc|weth|cross.?chain/.test(lower)) return 'wrapped';
  return null;
}
