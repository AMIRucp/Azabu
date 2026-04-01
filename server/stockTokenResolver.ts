import { TOKEN_REGISTRY, STOCK_ALIASES, setDynamicStockCheck, type RegisteredToken } from './tokenRegistry';

export interface StockToken {
  symbol: string;
  mint: string;
  name: string;
  issuer: 'xstocks' | 'ondo';
  underlying: string;
  decimals: number;
  category: 'stock' | 'etf' | 'commodity';
}

const ONDO_TICKER_MAP: Record<string, string> = {
  'TSLA': 'TSLAon', 'AAPL': 'AAPLon', 'NVDA': 'NVDAon', 'GOOGL': 'GOOGLon',
  'AMZN': 'AMZNon', 'MSFT': 'MSFTon', 'META': 'METAon', 'SPY': 'SPYon',
  'QQQ': 'QQQon', 'COIN': 'COINon', 'NFLX': 'NFLXon', 'DIS': 'DISon',
  'AMD': 'AMDon', 'INTC': 'INTCon', 'CRM': 'CRMon', 'AVGO': 'AVGOon',
  'PLTR': 'PLTRon', 'MSTR': 'MSTRon', 'HOOD': 'HOODon', 'BA': 'BAon',
  'JPM': 'JPMon', 'GS': 'GSon', 'V': 'Von', 'MA': 'MAon',
  'WMT': 'WMTon', 'COST': 'COSTon', 'HD': 'HDon', 'MCD': 'MCDon',
  'KO': 'KOon', 'PEP': 'PEPon', 'PFE': 'PFEon', 'JNJ': 'JNJon',
  'UNH': 'UNHon', 'LLY': 'LLYon', 'MRK': 'MRKon', 'ABBV': 'ABBVon',
  'XOM': 'XOMon', 'CVX': 'CVXon', 'LMT': 'LMTon', 'RTX': 'RTXon',
  'CAT': 'CATon', 'HON': 'HONon', 'GE': 'GEon', 'IBM': 'IBMon',
  'CRWD': 'CRWDon', 'SNOW': 'SNOWon', 'SHOP': 'SHOPon', 'ARM': 'ARMon',
  'QCOM': 'QCOMon', 'TXN': 'TXNon', 'ASML': 'ASMLon', 'NKE': 'NKEon',
  'SBUX': 'SBUXon', 'TQQQ': 'TQQQon',
};

const XSTOCK_MINTS: Record<string, StockToken> = {};
const ONDO_MINTS: Record<string, StockToken> = {};
const MINT_TO_STOCK: Record<string, StockToken> = {};

const COMPANY_ALIASES: Record<string, string> = {
  'apple': 'AAPL', 'tesla': 'TSLA', 'nvidia': 'NVDA',
  'amazon': 'AMZN', 'microsoft': 'MSFT', 'google': 'GOOGL',
  'alphabet': 'GOOGL', 'meta': 'META', 'facebook': 'META',
  'coinbase': 'COIN', 'palantir': 'PLTR', 'robinhood': 'HOOD',
  'microstrategy': 'MSTR', 'strategy': 'MSTR',
  'broadcom': 'AVGO', 'crowdstrike': 'CRWD', 'circle': 'CRCL',
  'netflix': 'NFLX', 'disney': 'DIS', 'gamestop': 'GME',
  'jpmorgan': 'JPM', 'goldman': 'GS', 'berkshire': 'BRK.B',
  'snowflake': 'SNOW', 'shopify': 'SHOP', 'salesforce': 'CRM',
  'oracle': 'ORCL', 'adobe': 'ADOB', 'intuit': 'INTU',
  'servicenow': 'NOW', 'datadog': 'DDOG', 'mongodb': 'MDB',
  'palo alto': 'PANW', 'zscaler': 'ZS', 'okta': 'OKTA',
  'arm': 'ARM', 'amd': 'AMD', 'qualcomm': 'QCOM',
  'texas instruments': 'TXN', 'analog devices': 'ADI',
  'marvell': 'MRVL', 'asml': 'ASML',
  'boeing': 'BA', 'lockheed': 'LMT', 'raytheon': 'RTX',
  'caterpillar': 'CAT', 'deere': 'DE', 'honeywell': 'HON',
  'ups': 'UPS', 'union pacific': 'UNP',
  'exxon': 'XOM', 'chevron': 'CVX', 'conocophillips': 'COP',
  'walmart': 'WMT', 'costco': 'COST', 'home depot': 'HD',
  'mcdonalds': 'MCD', "mcdonald's": 'MCD', 'nike': 'NKE',
  'starbucks': 'SBUX', 'target': 'TGT', "lowe's": 'LOW', 'lowes': 'LOW',
  'procter': 'PG', 'p&g': 'PG', 'coca-cola': 'KO', 'coke': 'KO',
  'pepsi': 'PEP', 'pepsico': 'PEP',
  'johnson': 'JNJ', 'j&j': 'JNJ',
  'pfizer': 'PFE', 'merck': 'MRK', 'abbvie': 'ABBV',
  'eli lilly': 'LLY', 'lilly': 'LLY',
  'unitedhealth': 'UNH', 'thermo fisher': 'TMO',
  'danaher': 'DHR', 'abbott': 'ABT',
  'visa': 'V', 'mastercard': 'MA',
  'bank of america': 'BAC', 'ibm': 'IBM', 'intel': 'INTC',
  'cisco': 'CSCO', 'comcast': 'CMCSA',
  's&p': 'SPY', 's&p 500': 'SPY', 'sp500': 'SPY',
  'nasdaq': 'QQQ', 'gold': 'GLD',
  'novo nordisk': 'NVO', 'astrazeneca': 'AZN',
  'philip morris': 'PM', 'ge': 'GE', 'general electric': 'GE',
};

let isLoaded = false;

function populateFromStaticRegistry(): void {
  for (const [key, token] of Object.entries(TOKEN_REGISTRY)) {
    if (token.category === 'stock' || token.category === 'etf' || token.category === 'commodity') {
      if (token.provider === 'xstocks' && token.tradfiTicker) {
        const underlying = token.tradfiTicker.toUpperCase();
        const st: StockToken = {
          symbol: token.symbol,
          mint: token.address,
          name: token.company || token.name,
          issuer: 'xstocks',
          underlying,
          decimals: token.decimals,
          category: token.category,
        };
        XSTOCK_MINTS[underlying] = st;
        MINT_TO_STOCK[token.address] = st;
      }
      if (token.provider === 'ondo' && token.tradfiTicker) {
        const underlying = token.tradfiTicker.toUpperCase();
        const st: StockToken = {
          symbol: token.symbol,
          mint: token.address,
          name: token.company || token.name,
          issuer: 'ondo',
          underlying,
          decimals: token.decimals,
          category: token.category,
        };
        if (!ONDO_MINTS[underlying]) {
          ONDO_MINTS[underlying] = st;
          MINT_TO_STOCK[token.address] = st;
        }
      }
    }
  }
}

populateFromStaticRegistry();

export async function loadStockTokenRegistry(): Promise<void> {
  try {
    const res = await fetch('https://tokens.jup.ag/tokens?tags=verified', { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.warn(`Jupiter Token API returned ${res.status}, using static registry only`);
      isLoaded = true;
      return;
    }
    const tokens = await res.json();
    let xCount = 0;
    let ondoCount = 0;

    for (const t of tokens) {
      if (!t.symbol || !t.address) continue;

      if (t.symbol.endsWith('x') && !XSTOCK_MINTS[t.symbol.slice(0, -1).toUpperCase()]) {
        const isXstock = t.name?.includes('xStock') || t.name?.includes('Backed') ||
                         t.tags?.includes('xstocks') || t.address?.startsWith('Xs');
        if (isXstock) {
          const underlying = t.symbol.slice(0, -1).toUpperCase();
          const st: StockToken = {
            symbol: t.symbol,
            mint: t.address,
            name: t.name || underlying,
            issuer: 'xstocks',
            underlying,
            decimals: t.decimals || 6,
            category: 'stock',
          };
          XSTOCK_MINTS[underlying] = st;
          MINT_TO_STOCK[t.address] = st;
          xCount++;
        }
      }

      if (t.symbol.endsWith('on') && t.symbol.length > 2) {
        const isOndo = t.name?.includes('Ondo') || t.tags?.includes('ondo');
        if (isOndo) {
          const underlying = t.symbol.slice(0, -2).toUpperCase();
          if (!underlying) continue;
          const st: StockToken = {
            symbol: t.symbol,
            mint: t.address,
            name: t.name || underlying,
            issuer: 'ondo',
            underlying,
            decimals: t.decimals || 6,
            category: underlying.length <= 4 && /^[A-Z]+$/.test(underlying) ? 'stock' : 'etf',
          };
          if (!ONDO_MINTS[underlying]) {
            ONDO_MINTS[underlying] = st;
            MINT_TO_STOCK[t.address] = st;
            ondoCount++;
          }
        }
      }
    }

    isLoaded = true;
    setDynamicStockCheck(isStockTicker);
    console.log(`Stock registry loaded: ${Object.keys(XSTOCK_MINTS).length} xStocks (${xCount} from Jupiter), ${ondoCount} Ondo tokens`);
  } catch (err: any) {
    console.error('Failed to load stock token registry from Jupiter:', err.message);
    isLoaded = true;
    setDynamicStockCheck(isStockTicker);
  }
}

export function resolveStockToken(input: string): StockToken | null {
  const normalized = input.toLowerCase().replace(/\s+stock$/, '').replace(/\s+shares?$/, '').trim();

  let underlying = COMPANY_ALIASES[normalized];
  if (!underlying) {
    const upper = normalized.toUpperCase();
    if (upper.endsWith('X') && XSTOCK_MINTS[upper.slice(0, -1)]) {
      return XSTOCK_MINTS[upper.slice(0, -1)];
    }
    if (upper.endsWith('ON') && upper.length > 2 && ONDO_MINTS[upper.slice(0, -2)]) {
      return ONDO_MINTS[upper.slice(0, -2)];
    }

    const staticAlias = STOCK_ALIASES[upper];
    if (staticAlias) {
      const reg = TOKEN_REGISTRY[staticAlias];
      if (reg && reg.tradfiTicker) {
        underlying = reg.tradfiTicker.toUpperCase();
      } else {
        underlying = upper;
      }
    } else {
      underlying = upper;
    }
  }

  if (XSTOCK_MINTS[underlying]) return XSTOCK_MINTS[underlying];
  if (ONDO_MINTS[underlying]) return ONDO_MINTS[underlying];

  return null;
}

export function getStockByMint(mint: string): StockToken | null {
  return MINT_TO_STOCK[mint] || null;
}

export function isStockTicker(input: string): boolean {
  return resolveStockToken(input) !== null;
}

export function getAllStockUnderlyings(): string[] {
  const all = new Set<string>();
  for (const k of Object.keys(XSTOCK_MINTS)) all.add(k);
  for (const k of Object.keys(ONDO_MINTS)) all.add(k);
  return Array.from(all);
}

export function isRegistryLoaded(): boolean {
  return isLoaded;
}

export function getOndoSymbol(tradfiTicker: string): string | null {
  const upper = tradfiTicker.toUpperCase();
  return ONDO_TICKER_MAP[upper] || null;
}

export function resolveOndoToken(input: string): StockToken | null {
  const upper = input.toUpperCase().trim();
  if (upper.endsWith('ON') && upper.length > 2) {
    const underlying = upper.slice(0, -2);
    if (ONDO_MINTS[underlying]) return ONDO_MINTS[underlying];
  }
  return null;
}
