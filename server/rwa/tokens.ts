import { TOKEN_REGISTRY } from '../tokenRegistry';
import type { RwaCategory, RwaIssuer } from './categories';

export interface RwaToken {
  mint: string;
  symbol: string;
  name: string;
  category: RwaCategory;
  issuer: RwaIssuer;
  decimals: number;
  aliases: string[];
  underlyingTicker?: string;
  underlyingName?: string;
  website?: string;
  jupiterVerified: boolean;
}

function buildXStocksFromRegistry(): RwaToken[] {
  const tokens: RwaToken[] = [];
  for (const [, entry] of Object.entries(TOKEN_REGISTRY)) {
    if (entry.provider !== 'xstocks') continue;
    if (!entry.tradfiTicker) continue;

    const cat: RwaCategory =
      entry.category === 'etf' ? 'etfs' :
      entry.category === 'commodity' ? 'commodities' : 'equities';

    const ticker = entry.tradfiTicker.toUpperCase();
    const company = entry.company || entry.name;
    const aliases = [
      ticker,
      entry.symbol,
      entry.symbol.toUpperCase(),
      company.toLowerCase(),
      `${ticker.toLowerCase()} stock`,
      `$${ticker}`,
    ];

    tokens.push({
      mint: entry.address,
      symbol: entry.symbol,
      name: `${company} (xStocks)`,
      category: cat,
      issuer: 'xStocks',
      decimals: entry.decimals,
      aliases,
      underlyingTicker: ticker,
      underlyingName: company,
      website: 'xstocks.fi',
      jupiterVerified: true,
    });
  }
  return tokens;
}

export const XSTOCKS_TOKENS: RwaToken[] = buildXStocksFromRegistry();

export const ONDO_TOKENS: RwaToken[] = [
  {
    mint: 'rRsXLHe7sBHdyKU3KY3wbcSWXDwkpuARMQRFQBJFfjU',
    symbol: 'OUSG', name: 'Ondo Short-Term US Government Bond Fund',
    category: 'treasuries', issuer: 'Ondo', decimals: 6,
    underlyingTicker: 'OUSG', underlyingName: 'US Short-Term Treasuries',
    aliases: ['OUSG', 'ondo treasuries', 'ondo us gov', 'us gov bond', 'treasury token', 'tokenized treasury', 'rwa bond', 'government bond'],
    website: 'ondo.finance', jupiterVerified: true,
  },
  {
    mint: 'A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6',
    symbol: 'USDY', name: 'Ondo US Dollar Yield',
    category: 'yield', issuer: 'Ondo', decimals: 6,
    underlyingTicker: 'USDY', underlyingName: 'US Dollar Yield Token',
    aliases: ['USDY', 'ondo yield', 'dollar yield', 'yield token', 'ondo usdy', 'yield dollar', 'rwa stable'],
    website: 'ondo.finance', jupiterVerified: true,
  },
];

export const BLACKROCK_TOKENS: RwaToken[] = [
  {
    mint: 'GyWgeqpy5GueU2YbkE8xqUeVEokCMMCEeUrfbtMw6phr',
    symbol: 'BUIDL', name: 'BlackRock USD Institutional Digital Liquidity Fund',
    category: 'treasuries', issuer: 'BlackRock', decimals: 6,
    underlyingTicker: 'BUIDL',
    underlyingName: 'BlackRock BUIDL -- US Treasury Money Market Fund',
    aliases: ['BUIDL', 'blackrock', 'blackrock buidl', 'blackrock treasury'],
    website: 'blackrock.com', jupiterVerified: false,
  },
];

export const PRESTOCKS_TOKENS: RwaToken[] = [
  {
    mint: 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh',
    symbol: 'SPACEX', name: 'SpaceX (PreStocks)',
    category: 'preipo', issuer: 'PreStocks', decimals: 9,
    underlyingTicker: 'SPACEX', underlyingName: 'SpaceX',
    aliases: ['SPACEX', 'spacex', 'space x', '$SPACEX', 'spacex prestocks'],
    website: 'prestocks.com', jupiterVerified: true,
  },
  {
    mint: 'PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF',
    symbol: 'OPENAI', name: 'OpenAI (PreStocks)',
    category: 'preipo', issuer: 'PreStocks', decimals: 9,
    underlyingTicker: 'OPENAI', underlyingName: 'OpenAI',
    aliases: ['OPENAI', 'openai', 'open ai', '$OPENAI', 'openai prestocks', 'chatgpt stock'],
    website: 'prestocks.com', jupiterVerified: true,
  },
  {
    mint: 'PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB',
    symbol: 'ANDURIL', name: 'Anduril (PreStocks)',
    category: 'preipo', issuer: 'PreStocks', decimals: 9,
    underlyingTicker: 'ANDURIL', underlyingName: 'Anduril Industries',
    aliases: ['ANDURIL', 'anduril', '$ANDURIL', 'anduril prestocks', 'ANDURL', 'andurl'],
    website: 'prestocks.com', jupiterVerified: true,
  },
  {
    mint: 'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw',
    symbol: 'ANTHROPIC', name: 'Anthropic (PreStocks)',
    category: 'preipo', issuer: 'PreStocks', decimals: 9,
    underlyingTicker: 'ANTHROPIC', underlyingName: 'Anthropic',
    aliases: ['ANTHROPIC', 'anthropic', '$ANTHROPIC', 'anthropic prestocks', 'claude stock', 'ANTHRP', 'anthrp'],
    website: 'prestocks.com', jupiterVerified: true,
  },
  {
    mint: 'PreC1KtJ1sBPPqaeeqL6Qb15GTLCYVvyYEwxhdfTwfx',
    symbol: 'XAI', name: 'xAI (PreStocks)',
    category: 'preipo', issuer: 'PreStocks', decimals: 9,
    underlyingTicker: 'XAI', underlyingName: 'xAI',
    aliases: ['XAI', 'xai', '$XAI', 'xai prestocks', 'grok stock'],
    website: 'prestocks.com', jupiterVerified: true,
  },
];

export const WRAPPED_TOKENS: RwaToken[] = [
  {
    mint: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
    symbol: 'WBTC', name: 'Wrapped Bitcoin (Wormhole)',
    category: 'wrapped', issuer: 'Wormhole', decimals: 8,
    underlyingTicker: 'BTC', underlyingName: 'Bitcoin',
    aliases: ['WBTC', 'BTC', 'bitcoin', 'wrapped bitcoin', 'wormhole btc'],
    jupiterVerified: true,
  },
  {
    mint: 'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij',
    symbol: 'cbBTC', name: 'Coinbase Wrapped BTC',
    category: 'wrapped', issuer: 'Coinbase', decimals: 8,
    underlyingTicker: 'BTC', underlyingName: 'Bitcoin (Coinbase)',
    aliases: ['cbBTC', 'coinbase btc', 'coinbase bitcoin'],
    jupiterVerified: true,
  },
  {
    mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    symbol: 'WETH', name: 'Wrapped ETH (Wormhole)',
    category: 'wrapped', issuer: 'Wormhole', decimals: 8,
    underlyingTicker: 'ETH', underlyingName: 'Ethereum',
    aliases: ['WETH', 'ETH', 'ethereum', 'wrapped ethereum', 'wormhole eth', 'ether'],
    jupiterVerified: true,
  },
  {
    mint: '9gP2kCy3wA1ctvYWQk75guqXuHfrEomqydHLtcTCqiLa',
    symbol: 'WBNB', name: 'Wrapped BNB (Wormhole)',
    category: 'wrapped', issuer: 'Wormhole', decimals: 8,
    underlyingTicker: 'BNB', underlyingName: 'BNB',
    aliases: ['WBNB', 'BNB', 'binance', 'wrapped bnb'],
    jupiterVerified: true,
  },
  {
    mint: 'KgV1GvrHQmRBY8sHQQeUKwTm2r2h8t4C8qt12Cw1HVE',
    symbol: 'WAVAX', name: 'Wrapped AVAX (Wormhole)',
    category: 'wrapped', issuer: 'Wormhole', decimals: 8,
    underlyingTicker: 'AVAX', underlyingName: 'Avalanche',
    aliases: ['WAVAX', 'AVAX', 'avalanche', 'wrapped avax'],
    jupiterVerified: true,
  },
];

export const REMORA_TOKENS: RwaToken[] = [
  {
    mint: 'AEv6xLECJ2KKmwFGX85mHb9S2c2BQE7dqE5midyrXHBb',
    symbol: 'GLDr', name: 'Gold rStock',
    category: 'commodities', issuer: 'Remora', decimals: 9,
    underlyingTicker: 'GLD', underlyingName: 'Gold',
    aliases: ['GLDr', 'GLDR', 'gold rstock', 'remora gold'],
    website: 'remora.markets', jupiterVerified: true,
  },
  {
    mint: '7C56WnJ94iEP7YeH2iKiYpvsS5zkcpP9rJBBEBoUGdzj',
    symbol: 'SLVr', name: 'Silver rStock',
    category: 'commodities', issuer: 'Remora', decimals: 9,
    underlyingTicker: 'SLV', underlyingName: 'Silver',
    aliases: ['SLVr', 'SLVR', 'silver rstock', 'remora silver'],
    website: 'remora.markets', jupiterVerified: true,
  },
  {
    mint: 'EtTQ2QRyf33bd6B2uk7nm1nkinrdGKza66EGdjEY4s7o',
    symbol: 'PPLTr', name: 'Platinum rStock',
    category: 'commodities', issuer: 'Remora', decimals: 9,
    underlyingTicker: 'PPLT', underlyingName: 'Platinum',
    aliases: ['PPLTr', 'PPLTR', 'platinum rstock', 'remora platinum'],
    website: 'remora.markets', jupiterVerified: true,
  },
  {
    mint: '9eS6ZsnqNJGGKWq8LqZ95YJLZ219oDuJ1qjsLoKcQkmQ',
    symbol: 'PALLr', name: 'Palladium rStock',
    category: 'commodities', issuer: 'Remora', decimals: 9,
    underlyingTicker: 'PALL', underlyingName: 'Palladium',
    aliases: ['PALLr', 'PALLR', 'palladium rstock', 'remora palladium'],
    website: 'remora.markets', jupiterVerified: true,
  },
  {
    mint: 'C3VLBJB2FhEb47s1WEgroyn3BnSYXaezqtBuu5WNmUGw',
    symbol: 'CPERr', name: 'Copper rStock',
    category: 'commodities', issuer: 'Remora', decimals: 9,
    underlyingTicker: 'CPER', underlyingName: 'Copper',
    aliases: ['CPERr', 'CPERR', 'copper rstock', 'remora copper'],
    website: 'remora.markets', jupiterVerified: true,
  },
];

export const COMMODITY_TOKENS: RwaToken[] = [
  {
    mint: 'GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A',
    symbol: 'GOLD', name: 'GOLD (Gold Issuance)',
    category: 'commodities', issuer: 'GoldIssuance', decimals: 6,
    underlyingTicker: 'GOLD', underlyingName: 'Gold',
    aliases: ['GOLD', 'gold issuance', 'gold token'],
    jupiterVerified: true,
  },
];

export const ALL_RWA_TOKENS: RwaToken[] = [
  ...XSTOCKS_TOKENS,
  ...ONDO_TOKENS,
  ...BLACKROCK_TOKENS,
  ...PRESTOCKS_TOKENS,
  ...REMORA_TOKENS,
  ...COMMODITY_TOKENS,
];

export const RWA_BY_MINT = new Map<string, RwaToken>(
  ALL_RWA_TOKENS.map(t => [t.mint, t])
);

export const RWA_BY_SYMBOL = new Map<string, RwaToken>(
  ALL_RWA_TOKENS.map(t => [t.symbol.toUpperCase(), t])
);

export const RWA_BY_ALIAS = new Map<string, RwaToken>();
for (const token of ALL_RWA_TOKENS) {
  for (const alias of token.aliases) {
    RWA_BY_ALIAS.set(alias.toLowerCase(), token);
  }
}
