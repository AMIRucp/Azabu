export type HlCategory = 'crypto' | 'l1l2' | 'meme' | 'defi' | 'stocks' | 'commodities' | 'indices' | 'sectors' | 'private';

const STOCK_TICKERS = new Set([
  'AAPL','TSLA','NVDA','META','GOOG','GOOGL','MSFT','AMZN','HOOD','INTC','MU','SNDK','CRCL',
  'SAMSUNG','SKHYNIX','HYUNDAI','KRCOMP','HANMI','MSTR','ASML','PLTR','COIN','AMD','CVX',
  'XOM','BMNR','COST','NFLX','ORCL','RIVN','SBET','GLXY','BABA','BYD','RTX','USAR','TSM','CRWV','SMSN',
]);

/**
 * Commodity tickers for Hyperliquid.
 *
 * HL uses plain English-style names (not CME contract codes like ZC, ZS, RB).
 * Currently live (as of 2026-03-24):
 *   - PAXG  — Paxos Gold (tokenised ERC-20 that tracks gold price)
 *
 * Note: "GAS" on HL refers to NEO's GAS utility token (crypto) — NOT natural gas.
 */
const COMMODITY_TICKERS = new Set([
  'XAU','GOLD','PAXG','GLD',
  'XAG','SILVER','SLV',
  'XPT','PLATINUM',
  'XPD','PALLADIUM',
  'XCU','HG','COPPER',
  'GLDMINE','GDX','GDXJ',
  'URA','URNM',
  'WTI','USOIL','CL','OIL','BRENT','BRENTOIL','CRUDE',
  'NATGAS','NATURALGAS','NG',
  'CORN','WHEAT','SOY','SOYBEAN','SUGAR','COFFEE','COCOA','COTTON','LUMBER',
]);

const INDEX_TICKERS = new Set([
  'SPX','DJI','NDX','NIK','FTSE','DAX','HSI','GER40','US30','UK100','HK50','US100','JP225','US500','KR2550',
  'SP500','USA500','XYZ100','SMALL2000','USTECH','SKHX','USBOND',
  'SPY','QQQ','IWM','EWY','EWJ','BOTZ','KWEB','MAG7','SEMIS','DEFENSE','NUCLEAR','BIOTECH',
]);

const SECTOR_TICKERS = new Set([
  'ENERGY','USENERGY','INFOTECH','ROBOT','SEMI',
]);

const PRIVATE_TICKERS = new Set([
  'OPENAI','SPACEX','ANTHROPIC',
]);

const MEME_TICKERS = new Set([
  'DOGE','PEPE','SHIB','BONK','WIF','FLOKI','POPCAT','PNUT','FARTCOIN','MOODENG','BRETT',
  'NEIRO','CHEEMS','BOME','GOAT','CHILLGUY','TRUMP','MELANIA','TURBO','MEW','HMSTR','CATI',
  'DOGS','BANANA','MYRO','LAUNCHCOIN','JELLY','PURR','PENGU','AI16Z','FWOG','MICHI','PUMP',
]);

const DEFI_TICKERS = new Set([
  'LINK','UNI','AAVE','MKR','COMP','CRV','SNX','SUSHI','YGG','GMX','DYDX','INJ','JUP',
  'ARB','OP','RENDER','SEI','TIA','FIL','FTM','HYPE','PENDLE','LDO','STG','RUNE','CAKE',
  'FET','ONDO','BLUR','ZRO','JTO','ENA','ETHFI','EIGEN','LISTA','STRK','RDNT','COW','UMA',
  'PEOPLE','OGN','LOOM','GRT','VIRTUAL','VVV','RESOLV',
]);

const L1L2_TICKERS = new Set([
  'BTC','ETH','SOL','BNB','XRP','AVAX','ADA','DOT','LTC','TRX','XLM','ATOM','NEAR','ALGO',
  'ICP','BCH','TON','HBAR','MINA','XMR','DASH','ZEC','ETC','NEO','ZEN','CELO','POLYX',
  'CFX','STX','ARK','NTRN','DYM','ZETA','MANTA','BLAST','SCR','HEMI','INITIA','AERO',
  'FLOW','SAGA','MNT','IMX','ZK','IO','OMNI','PYTH','ALT','W','BERA','LAYER','NIL',
  'SOPH','AVNT','MON','SUI','APT','POL','MATIC','KAS','STRAX',
]);

export function parseHlSymbol(coin: string): { prefix: string; ticker: string } {
  const raw = coin.replace(/-USD$/i, '').replace(/-USDC$/i, '').replace(/-USDT$/i, '').toUpperCase();
  if (raw.includes(':')) {
    const [prefix, ticker] = raw.split(':');
    return { prefix, ticker };
  }
  return { prefix: '', ticker: raw };
}

export function categorizeHlMarket(coin: string): HlCategory {
  const { prefix, ticker } = parseHlSymbol(coin);

  if (PRIVATE_TICKERS.has(ticker)) return 'private';
  if (INDEX_TICKERS.has(ticker)) return 'indices';
  if (STOCK_TICKERS.has(ticker)) return 'stocks';
  if (COMMODITY_TICKERS.has(ticker)) return 'commodities';
  if (SECTOR_TICKERS.has(ticker)) return 'sectors';
  if (prefix === 'VNTL') return 'sectors';
  if (MEME_TICKERS.has(ticker)) return 'meme';
  if (DEFI_TICKERS.has(ticker)) return 'defi';
  if (L1L2_TICKERS.has(ticker)) return 'l1l2';
  if (prefix === 'HYNA') return 'crypto';

  return 'crypto';
}

export function getDexBadge(coin: string): string {
  const { prefix } = parseHlSymbol(coin);
  return prefix || 'CORE';
}

export function getHlDisplayName(coin: string): string {
  const { ticker } = parseHlSymbol(coin);
  return ticker;
}

export const DEX_BADGE_COLORS: Record<string, string> = {
  CORE: '#D4A574',
  XYZ: '#FF6B35',
  CASH: '#3B82F6',
  KM: '#8B5CF6',
  FLX: '#EC4899',
  VNTL: '#F59E0B',
  HYNA: '#10B981',
};

export function hlCategoryToAfxCategory(hlCat: HlCategory): string {
  switch (hlCat) {
    case 'stocks': return 'stock';
    case 'commodities': return 'commodity';
    case 'indices': return 'index';
    case 'sectors': return 'sector';
    case 'private': return 'private';
    case 'meme': return 'meme';
    case 'defi': return 'defi';
    case 'l1l2': return 'l1l2';
    case 'crypto': return 'crypto';
    default: return 'crypto';
  }
}
