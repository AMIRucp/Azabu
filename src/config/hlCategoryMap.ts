/**
 * HYPERLIQUID MARKET CATEGORY MAP — SINGLE SOURCE OF TRUTH
 *
 * 313 verified perp markets across 9 categories.
 * Maps base asset ticker → internal AFX category string.
 * Do NOT auto-classify from the API. Use this map exclusively.
 *
 * Majors assets (BTC, ETH, SOL …) are tagged 'l1l2' here because
 * the Majors TAB is handled by a separate baseAsset set-check in
 * matchesCategory(), not by category field.  They appear in both tabs.
 */

export const HL_BASE_CATEGORY: Record<string, string> = {

  // ── MAJORS (11 assets) ──────────────────────────────────────────────────
  BTC: 'l1l2', ETH: 'l1l2', SOL: 'l1l2', XRP: 'l1l2',
  BNB: 'l1l2', ADA: 'l1l2', BCH: 'l1l2', AVAX: 'l1l2',
  DOT: 'l1l2', LTC: 'l1l2', LINK: 'l1l2', QNT: 'l1l2', QUANT: 'l1l2',

  // ── MEME (38 assets) ─────────────────────────────────────────────────────
  DOGE: 'meme', FARTCOIN: 'meme', PUMP: 'meme', PEPE: 'meme',
  BONK: 'meme', TRUMP: 'meme', WIF: 'meme', PENGU: 'meme',
  SHIB: 'meme', SPX: 'meme', FLOKI: 'meme',
  TURBO: 'meme', BRETT: 'meme', BABY: 'meme', POPCAT: 'meme',
  MEME: 'meme', MOODENG: 'meme', TST: 'meme', PNUT: 'meme',
  MELANIA: 'meme', LUNC: 'meme', VINE: 'meme', NOT: 'meme',
  GALA: 'meme', MEW: 'meme', GOAT: 'meme', BOME: 'meme',
  SUPER: 'meme', NEIRO: 'meme', CHILLGUY: 'meme', NXPC: 'meme',
  DOOD: 'meme', PEOPLE: 'meme', YZY: 'meme', ZEREBRO: 'meme',
  USTC: 'meme', HMSTR: 'meme',

  // ── DEFI (76 assets) ─────────────────────────────────────────────────────
  HYPE: 'defi', ASTER: 'defi', XPL: 'defi',
  WLFI: 'defi', LIT: 'defi', CRV: 'defi', MON: 'defi',
  VIRTUAL: 'defi', AAVE: 'defi', VVV: 'defi', UNI: 'defi',
  MORPHO: 'defi', STABLE: 'defi', GAS: 'defi', REZ: 'defi',
  ONDO: 'defi', RESOLV: 'defi', FTT: 'defi', KAITO: 'defi',
  ETHFI: 'defi', DYDX: 'defi', JUP: 'defi', CC: 'defi',
  AXS: 'defi', GRIFFAIN: 'defi', SKY: 'defi', LDO: 'defi',
  POLYX: 'defi', INJ: 'defi', IP: 'defi', PENDLE: 'defi',
  ANIME: 'defi', PYTH: 'defi', INIT: 'defi', EIGEN: 'defi',
  AIXBT: 'defi', ZETA: 'defi', NIL: 'defi', AVNT: 'defi',
  GRASS: 'defi', MERL: 'defi', APEX: 'defi', MET: 'defi',
  '2Z': 'defi', SOPH: 'defi', HEMI: 'defi', LINEA: 'defi',
  SCR: 'defi', PURR: 'defi', COMP: 'defi', SKR: 'defi',
  IO: 'defi', '0G': 'defi', SNX: 'defi', FOGO: 'defi',
  ZORA: 'defi', SYRUP: 'defi', AZTEC: 'defi', WCT: 'defi',
  PROMPT: 'defi', LAYER: 'defi', MEGA: 'defi', RUNE: 'defi',
  GMX: 'defi', BANANA: 'defi', SUSHI: 'defi', HYPER: 'defi',
  STBL: 'defi', YGG: 'defi', ENS: 'defi', MAV: 'defi',
  BIO: 'defi', ARK: 'defi', PROVE: 'defi', LIGHTER: 'defi', KHYPE: 'defi', BASED: 'defi', PUMPBTC: 'defi',
  QNT: 'defi', BUDDY: 'meme', '4': 'meme', OG: 'meme', M: 'defi', FIGHT: 'meme', ESPORTS: 'meme', URA: 'defi', ZBT: 'defi', MAGS: 'meme', FEUSD: 'defi',

  // ── L1/L2 (70 assets) ───────────────────────────────────────────────────
  TAO: 'l1l2', ZEC: 'l1l2', PAXG: 'l1l2', ZRO: 'l1l2',
  SUI: 'l1l2', JTO: 'l1l2', XMR: 'l1l2', APT: 'l1l2',
  FET: 'l1l2', ENA: 'l1l2', AERO: 'l1l2', ARB: 'l1l2',
  OP: 'l1l2', NEAR: 'l1l2', TON: 'l1l2', XLM: 'l1l2',
  WLD: 'l1l2', SEI: 'l1l2', RENDER: 'l1l2', TIA: 'l1l2',
  AR: 'l1l2', HBAR: 'l1l2', TRX: 'l1l2', FIL: 'l1l2',
  ETC: 'l1l2', BERA: 'l1l2', POL: 'l1l2', STRK: 'l1l2',
  ALGO: 'l1l2', KAS: 'l1l2', SAND: 'l1l2', STX: 'l1l2',
  ATOM: 'l1l2', ICP: 'l1l2', NEO: 'l1l2', ZK: 'l1l2',
  CAKE: 'l1l2', ZEN: 'l1l2', MOVE: 'l1l2',
  MNT: 'l1l2', CFX: 'l1l2', S: 'l1l2', BSV: 'l1l2',
  GMT: 'l1l2', ME: 'l1l2', IMX: 'l1l2', W: 'l1l2',
  APE: 'l1l2', ALT: 'l1l2', CELO: 'l1l2', TNSR: 'l1l2',
  MINA: 'l1l2', TRB: 'l1l2', MAVIA: 'l1l2', DYM: 'l1l2',
  BLUR: 'l1l2', BIGTIME: 'l1l2', ACE: 'l1l2', USUAL: 'l1l2',
  UMA: 'l1l2', XAI: 'l1l2', MANTA: 'l1l2', ORDI: 'l1l2',
  BLAST: 'l1l2', SAGA: 'l1l2', IOTA: 'l1l2', RSR: 'l1l2',
  RTX: 'l1l2', USDE: 'l1l2',

  // ── STOCKS (37 assets) ──────────────────────────────────────────────────
  TSLA: 'stock', NVDA: 'stock', AAPL: 'stock', GOOGL: 'stock', DASH: 'stock',
  AMZN: 'stock', META: 'stock', MSFT: 'stock', COIN: 'stock',
  HOOD: 'stock', PLTR: 'stock', INTC: 'stock', MU: 'stock',
  NFLX: 'stock', TSM: 'stock', AMD: 'stock', ORCL: 'stock',
  RIVN: 'stock', MSTR: 'stock', BABA: 'stock', CRWV: 'stock',
  SKHYNIX: 'stock', SAMSUNG: 'stock', HYUNDAI: 'stock', SNDK: 'stock',
  SPACEX: 'stock', ANTHROPIC: 'stock', OPENAI: 'stock', CRCL: 'stock',
  DKNG: 'stock', HIMS: 'stock', LLY: 'stock', COST: 'stock',
  EWY: 'stock', EWJ: 'stock', KWEB: 'stock', USAR: 'stock', URNM: 'stock',
  HANMI: 'stock',

  // ── FOREX (2 assets — HL full-pair coin names) ───────────────────────────
  EURUSD: 'forex', USDJPY: 'forex',

  // ── COMMODITIES (21 assets) ──────────────────────────────────────────────
  CL: 'commodity', SILVER: 'commodity', BRENTOIL: 'commodity',
  GOLD: 'commodity', NATGAS: 'commodity', PLATINUM: 'commodity',
  COPPER: 'commodity', WTI: 'commodity', OIL: 'commodity',
  USOIL: 'commodity', PALLADIUM: 'commodity', WTIOIL: 'commodity',
  GLDMINE: 'commodity', NUCLEAR: 'commodity', ENERGY: 'commodity',
  USENERGY: 'commodity',
  // ISO precious-metal codes (Aster DEX tickers)
  XAU: 'commodity', XAG: 'commodity', XPT: 'commodity',
  XCU: 'commodity', XPD: 'commodity',

  // ── INDICES (18 assets) ──────────────────────────────────────────────────
  XYZ100: 'index', SP500: 'index', USA500: 'index', US500: 'index',
  SMALL2000: 'index', USTECH: 'index', MAG7: 'index', SEMI: 'index',
  USBOND: 'index', INFOTECH: 'index', DEFENSE: 'index',
  SEMIS: 'index', BIOTECH: 'index', ROBOT: 'index', BMNR: 'index',
  // Major US index ETFs
  QQQ: 'index', SPY: 'index', IWM: 'index',

};

/** Known builder-DEX prefixes — in "PREFIX:TICKER" the ticker is the base asset */
const KNOWN_DEX_PREFIXES = new Set(['VNTL', 'HYNA', 'CASH', 'KM', 'FLX', 'XYZ']);

/** Known stablecoin suffixes — in "BASE:STABLE" the left side is the base asset */
const KNOWN_STABLES = new Set(['USDC', 'USDE', 'USDH', 'USDT', 'USD']);

/**
 * Extract the base asset from a raw HL coin name.
 * Handles: plain "BTC", builder-DEX "VNTL:HYPE", and stable-denominated "BTC:USDE".
 * Also strips the k / 1000 prefix used for sub-cent meme coins.
 */
export function extractHlBase(coin: string): string {
  let display = coin;
  if (coin.includes(':')) {
    const [left, right] = coin.split(':');
    if (KNOWN_DEX_PREFIXES.has(left)) {
      display = right;
    } else if (KNOWN_STABLES.has(right)) {
      display = left;
    } else {
      display = right;
    }
  }
  return display.replace(/^k/, '').replace(/^1000/, '');
}
