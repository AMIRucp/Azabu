import type { UnifiedMarket } from '@/types/market';
import type { Protocol } from '@/config/protocolRegistry';
import { PROTOCOLS } from '@/config/protocolRegistry';
import { LIGHTER_MARKETS, LIGHTER_MARKET_BY_VENUE_TICKER } from '@/config/lighterMarkets';

function extractBase(symbol: string): string {
  return symbol.replace(/USDT$/i, '').replace(/^1000/, '').replace(/^1K/, '');
}

function makeName(base: string): string {
  const MAP: Record<string, string> = {
    BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'BNB',
    XRP: 'XRP', AVAX: 'Avalanche', ADA: 'Cardano', DOT: 'Polkadot',
    DOGE: 'Dogecoin', PEPE: 'Pepe', SHIB: 'Shiba Inu', WIF: 'dogwifhat',
    BONK: 'Bonk', LINK: 'Chainlink', UNI: 'Uniswap', AAVE: 'Aave',
    ARB: 'Arbitrum', OP: 'Optimism', SUI: 'Sui', APT: 'Aptos',
    NEAR: 'Near', LTC: 'Litecoin', ATOM: 'Cosmos', INJ: 'Injective',
    TIA: 'Celestia', JUP: 'Jupiter', RENDER: 'Render', SEI: 'Sei',
    FIL: 'Filecoin', FTM: 'Fantom', MKR: 'Maker', HYPE: 'Hyperliquid',
    TRUMP: 'Trump', ASTER: 'Aster', HNT: 'Helium', JTO: 'Jito',
    AAPL: 'Apple', TSLA: 'Tesla', NVDA: 'NVIDIA', META: 'Meta',
    GOOG: 'Alphabet', GOOGL: 'Alphabet', MSFT: 'Microsoft', AMZN: 'Amazon', QQQ: 'Nasdaq 100',
    HOOD: 'Robinhood', INTC: 'Intel', MU: 'Micron', SNDK: 'Western Digital',
    CRCL: 'Circle', EWY: 'S.Korea ETF', XAU: 'Gold', XAG: 'Silver',
    XCU: 'Copper', HG: 'Copper', XPT: 'Platinum', XPD: 'Palladium', CL: 'Crude Oil',
    NATGAS: 'Natural Gas', PAXG: 'Paxos Gold', MEGA: 'MEGA',
    OPN: 'OPN', KAT: 'KAT', POL: 'Polygon', STX: 'Stacks',
    ORDI: 'ORDI', PENDLE: 'Pendle', PYTH: 'Pyth', TAO: 'Bittensor',
    W: 'Wormhole', KMNO: 'Kamino', TNSR: 'Tensor', DRIFT: 'Drift',
    CLOUD: 'Cloud', IO: 'io.net', ZEX: 'Zeta', POPCAT: 'Popcat',
    TON: 'Toncoin', PNUT: 'Peanut', RAY: 'Raydium',
    ME: 'Magic Eden', PENGU: 'Pudgy Penguins', AI16Z: 'ai16z',
    BERA: 'Berachain', KAITO: 'Kaito', IP: 'Story Protocol',
    FARTCOIN: 'Fartcoin', PUMP: 'Pump.fun', MOODENG: 'Moo Deng',
    FWOG: 'FWOG', MICHI: 'Michi', MELANIA: 'Melania',
    LAUNCHCOIN: 'LaunchCoin', MNT: 'Mantle', ZEC: 'Zcash',
    USDJPY: 'USD/JPY', EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD',
    AUDUSD: 'AUD/USD', NZDUSD: 'NZD/USD', USDCHF: 'USD/CHF',
    USDCAD: 'USD/CAD', USDKRW: 'USD/KRW',
    SAMSUNG: 'Samsung', SKHYNIX: 'SK Hynix', HYUNDAI: 'Hyundai',
    KRCOMP: 'KOSPI Composite', HANMI: 'Hanmi Semiconductor', STRC: 'Sarcos Robotics',
    URA: 'Uranium ETF', SPY: 'S&P 500 ETF', IWM: 'Russell 2000 ETF',
    BOTZ: 'Robotics & AI ETF',
    MSTR: 'MicroStrategy', ASML: 'ASML', PLTR: 'Palantir',
    COIN: 'Coinbase', AMD: 'AMD', WTI: 'WTI Crude Oil',
    WTIOIL: 'WTI Crude Oil', CVX: 'Chevron', XOM: 'ExxonMobil', BMNR: 'BMNR',
    COST: 'Costco', NFLX: 'Netflix', ORCL: 'Oracle',
    RIVN: 'Rivian', SBET: 'SBET', GLXY: 'Galaxy Digital',
    GER40: 'DAX 40', US30: 'Dow Jones 30', UK100: 'FTSE 100',
    HK50: 'Hang Seng 50', US100: 'Nasdaq 100', JP225: 'Nikkei 225',
    US500: 'S&P 500', KR2550: 'KOSPI 2550',
    SPX: 'S&P 500', DJI: 'Dow Jones', NDX: 'Nasdaq 100',
    NIK: 'Nikkei 225', FTSE: 'FTSE 100', DAX: 'DAX 40', HSI: 'Hang Seng',
    BABA: 'Alibaba', BYD: 'BYD', GLD: 'SPDR Gold',
    USDMXN: 'USD/MXN', TRX: 'TRON',
    WLFI: 'WLFI', PIPPIN: 'Pippin', CAKE: 'PancakeSwap', ETC: 'Ethereum Classic',
    BULLA: 'Bulla', SIREN: 'Siren', EDGE: 'Edge', RIVER: 'River', SKYAI: 'SkyAI',
    DAM: 'DAM', BARD: 'Bard', TAG: 'Tag', STBL: 'Stable', PIEVERSE: 'Pieverse',
    LYN: 'Lyn', TOSHI: 'Toshi', ZRO: 'LayerZero', VVV: 'VVV', LIT: 'Lit',
    XMR: 'Monero', SKY: 'Sky', CHEEMS: 'Cheems', SOON: 'Soon', XPL: 'XPL',
    AVNT: 'Avant', FOLKS: 'Folks', BEAT: 'Beat', SKR: 'Sekiro', LIGHT: 'Light',
    TRUTH: 'Truth', ENSO: 'Enso', UAI: 'UAI', JCT: 'JCT', FET: 'Fetch.ai',
    XPIN: 'XPIN', CYS: 'Cysic', GUN: 'Gun', LAB: 'Lab', TRIA: 'Tria',
    MON: 'Mon', DASH: 'DoorDash', SPK: 'Spark', ACU: 'Acu', GWEI: 'Gwei',
    DKNG: 'DraftKings', HIMS: 'Hims & Hers', LLY: 'Eli Lilly',
    EUR: 'EUR/USD', JPY: 'JPY/USD',
    CLANKER: 'Clanker', AXS: 'Axie Infinity', FORM: 'Form', POWER: 'Power',
    ENA: 'Ethena', INX: 'INX', NAORIS: 'Naoris', XLM: 'Stellar',
    JELLYJELLY: 'JellyJelly', SAHARA: 'Sahara', RAVE: 'Rave', BANANAS31: 'Bananas31',
    BCH: 'Bitcoin Cash', BREV: 'Brev', KITE: 'Kite', EVAA: 'EVAA', ZAMA: 'Zama',
    BIO: 'Bio Protocol', INIT: 'Init', HEMI: 'Hemi', BLUAI: 'BluAI',
    PIXEL: 'Pixel', DEXE: 'DeXe', WET: 'Wet', ANIME: 'Anime', ENJ: 'Enjin',
    NIGHT: 'Night', ONDO: 'Ondo', BAS: 'BAS', APR: 'APR', USELESS: 'Useless',
    PHA: 'Phala', VANA: 'Vana', POLYX: 'Polymesh', TRADOOR: 'Tradoor',
    APE: 'ApeCoin', FLOCK: 'Flock', MYX: 'MYX', ZEN: 'Horizen', GIGGLE: 'Giggle',
    COAI: 'CoAI', GRASS: 'Grass', ZKP: 'ZKP', ZKC: 'ZKC', FOGO: 'Fogo',
    SAPIEN: 'Sapien', CC: 'CC', LINEA: 'Linea', HOLO: 'Holo', ARIA: 'Aria',
    LDO: 'Lido', ARC: 'Arc', WLD: 'Worldcoin', HANA: 'Hana', GRIFFAIN: 'Griffain',
    BOB: 'BOB', BTR: 'Bitlayer', FRAX: 'Frax', MOVE: 'Movement', DYM: 'Dymension',
    UMA: 'UMA', AIA: 'AIA', ESP: 'Espers', PTB: 'PTB', ROBO: 'Robo', ZORA: 'Zora',
    DOLO: 'Dolo', ELSA: 'Elsa', RESOLV: 'Resolv', ALLO: 'Allo', ETHFI: 'Ether.fi',
    CYBER: 'Cyber', DUSK: 'Dusk', DEGO: 'Dego', KAS: 'Kaspa', VIRTUAL: 'Virtuals',
    AUCTION: 'Bounce', KGEN: 'KGen', ZK: 'zkSync', MMT: 'MMT', RPL: 'Rocket Pool',
    MET: 'MET', SOMI: 'Somi', GALA: 'Gala', AIO: 'AIO', TURBO: 'Turbo',
    BMT: 'BMT', IR: 'IR', MANTRA: 'Mantra', PENGUIN: 'Penguin', ZBT: 'ZBT',
    AZTEC: 'Aztec', SENT: 'Sentinel', GUA: 'Gua', PLAY: 'Play', YB: 'YB',
    ORCA: 'Orca', CLO: 'Clo', SPACE: 'Space', COLLECT: 'Collect', FF: 'FF',
    OGN: 'Origin', FUN: 'FunFair', ALCH: 'Alchemy', TURTLE: 'Turtle', XAN: 'Xan',
    ROSE: 'Oasis', YGG: 'Yield Guild', MAGMA: 'Magma', LISTA: 'Lista', B2: 'B2',
    CRV: 'Curve', PARTI: 'Parti', TOWNS: 'Towns', CFG: 'Centrifuge',
    TRUST: 'Trust', FLOW: 'Flow', IRYS: 'Irys', XAI: 'XAI', SIGN: 'Sign',
    XNY: 'XNY', SOLV: 'Solv', BLESS: 'Bless', EIGEN: 'EigenLayer', ARPA: 'ARPA',
    SQD: 'Subsquid', LUNA2: 'Luna 2.0', AR: 'Arweave', DYDX: 'dYdX', EUL: 'Euler',
    BANK: 'Bank', GMT: 'STEPN', VELO: 'Velo', STG: 'Stargate', UB: 'UB',
    GPS: 'GPS', SENTIS: 'Sentis', NOM: 'Nom', AXL: 'Axelar', BIRB: 'Birb',
    MITO: 'Mito', OKB: 'OKB', RECALL: 'Recall', FIGHT: 'Fight', STO: 'STO',
    FHE: 'FHE', NEIRO: 'Neiro', STRK: 'Starknet', HYPER: 'Hyper', EDEN: 'Eden',
    FLOKI: 'Floki', SNX: 'Synthetix', DOOD: 'Doodles', BOME: 'BOME',
    WHITEWHALE: 'WhiteWhale', SHELL: 'Shell', ACX: 'Across', BEL: 'Bella',
    PROMPT: 'Prompt', ZIL: 'Zilliqa', TAKE: 'Take', BROCCOLI714: 'Broccoli',
    ZEREBRO: 'Zerebro', JASMY: 'Jasmy', COS: 'COS', WARD: 'Ward', ARTX: 'ARTX',
    PUMPBTC: 'PumpBTC', AWE: 'Awe', MEMES: 'Memes', ESPORTS: 'Esports',
    PROVE: 'Prove', OPEN: 'Open', AVL: 'Avail', HBAR: 'Hedera', COW: 'CoW',
    FLUX: 'Flux', LUNC: 'Luna Classic',
  };
  return MAP[base] || base;
}

function categorize(base: string): string {
  const STOCKS = new Set([
    'AAPL','TSLA','NVDA','META','GOOG','GOOGL','MSFT','AMZN','HOOD','INTC','MU','SNDK','CRCL','DASH',
    'SAMSUNG','SKHYNIX','HYUNDAI','KRCOMP','HANMI','MSTR','ASML','PLTR','COIN','AMD','CVX',
    'XOM','BMNR','COST','NFLX','ORCL','RIVN','SBET','GLXY','BABA','BYD','RTX','USAR','TSM','CRWV','SMSN',
    'DKNG','HIMS','LLY','STRC',
  ]);
  const COMMODITIES = new Set([
    'XAU','GOLD','PAXG','GLD',
    'XAG','SILVER','SLV',
    'XPT','PLATINUM',
    'XPD','PALLADIUM',
    'XCU','HG','COPPER',
    'URA','URNM',
    'CL','WTI','OIL','USOIL','BRENT','BRENTOIL','CRUDE','WTIOIL',
    'NATGAS','NATURALGAS','NG',
    'CORN','WHEAT','SOY','SOYBEAN','SUGAR','COFFEE','COCOA','COTTON','LUMBER',
  ]);
  const INDICES = new Set([
    'SPX','DJI','NDX','NIK','FTSE','DAX','HSI','GER40','US30','UK100','HK50','US100','JP225','US500','KR2550',
    'SPY','QQQ','IWM','EWY','EWJ','BOTZ','KWEB','MAG7','SEMIS','DEFENSE','NUCLEAR','BIOTECH',
  ]);
  const MEMES = new Set([
    'DOGE','PEPE','SHIB','BONK','WIF','FLOKI','POPCAT','PNUT','FARTCOIN','MOODENG','BRETT',
    'NEIRO','CHEEMS','BOME','GOAT','CHILLGUY','TRUMP','MELANIA','TURBO','MEW','HMSTR','CATI',
    'DOGS','BANANA','MYRO','LAUNCHCOIN','JELLY','PURR','PENGU','AI16Z','FWOG','MICHI','PUMP',
  ]);
  const DEFI = new Set([
    'LINK','UNI','AAVE','MKR','COMP','CRV','SNX','SUSHI','YGG','GMX','DYDX','INJ','JUP',
    'ARB','OP','RENDER','SEI','TIA','FIL','FTM','HYPE','PENDLE','LDO','STG','RUNE','CAKE',
    'FET','ONDO','BLUR','ZRO','JTO','ENA','ETHFI','EIGEN','LISTA','STRK','RDNT','COW','UMA',
    'PEOPLE','OGN','LOOM','GRT','VIRTUAL','VVV','RESOLV',
  ]);
  const L1L2 = new Set([
    'BTC','ETH','SOL','BNB','XRP','AVAX','ADA','DOT','LTC','TRX','XLM','ATOM','NEAR','ALGO',
    'ICP','BCH','TON','HBAR','MINA','XMR','ZEC','ETC','NEO','ZEN','CELO','POLYX',
    'CFX','STX','ARK','NTRN','DYM','ZETA','MANTA','BLAST','SCR','HEMI','INITIA','AERO',
    'FLOW','SAGA','MNT','IMX','ZK','IO','OMNI','PYTH','ALT','W','BERA','LAYER','NIL',
    'SOPH','AVNT','MON','SUI','APT','POL','MATIC','KAS','STRAX',
  ]);
  const FOREX = new Set([
    'EUR','JPY','EURUSD','USDJPY','GBPUSD','AUDUSD','NZDUSD','USDCHF','USDCAD','USDKRW',
  ]);

  if (INDICES.has(base)) return 'index';
  if (STOCKS.has(base)) return 'stock';
  if (COMMODITIES.has(base)) return 'commodity';
  if (FOREX.has(base)) return 'forex';
  if (MEMES.has(base)) return 'meme';
  if (DEFI.has(base)) return 'defi';
  if (L1L2.has(base)) return 'l1l2';
  return 'crypto';
}


export async function loadAsterMarkets(): Promise<UnifiedMarket[]> {
  const BASE = 'https://fapi.asterdex.com';
  try {
    const [infoRes, tickerRes, fundingRes] = await Promise.all([
      fetch(`${BASE}/fapi/v1/exchangeInfo`, { signal: AbortSignal.timeout(10000) }),
      fetch(`${BASE}/fapi/v1/ticker/24hr`, { signal: AbortSignal.timeout(10000) }),
      fetch(`${BASE}/fapi/v1/premiumIndex`, { signal: AbortSignal.timeout(10000) }).catch(() => null),
    ]);

    if (!infoRes.ok || !tickerRes.ok) return [];

    const infoData = await infoRes.json();
    const tickerData = await tickerRes.json();
    const fundingData = fundingRes?.ok ? await fundingRes.json() : [];

    const symbols: any[] = (infoData.symbols || []).filter(
      (s: any) => s.status === 'TRADING' && s.contractType === 'PERPETUAL'
    );

    const tickerMap = new Map<string, any>();
    for (const t of tickerData) tickerMap.set(t.symbol, t);

    const fundingMap = new Map<string, any>();
    for (const f of fundingData) fundingMap.set(f.symbol, f);

    let oiMap = new Map<string, number>();
    try {
      const topSymbols = symbols
        .filter((s: any) => {
          const t = tickerMap.get(s.symbol);
          return t && parseFloat(t.quoteVolume) > 0;
        })
        .sort((a: any, b: any) => {
          const volA = parseFloat(tickerMap.get(a.symbol)?.quoteVolume || '0');
          const volB = parseFloat(tickerMap.get(b.symbol)?.quoteVolume || '0');
          return volB - volA;
        })
        .map((s: any) => s.symbol)
        .slice(0, 20);
      const oiResults = await Promise.allSettled(
        topSymbols.map((sym: string) =>
          fetch(`${BASE}/fapi/v1/openInterest?symbol=${sym}`, { signal: AbortSignal.timeout(5000) })
            .then(r => r.ok ? r.json() : null)
        )
      );
      for (const r of oiResults) {
        if (r.status === 'fulfilled' && r.value?.symbol) {
          oiMap.set(r.value.symbol, parseFloat(r.value.openInterest) || 0);
        }
      }
    } catch {}

    const ASTER_LEV: Record<string, number> = {
      HYPEUSDT: 300,
      ASTERUSDT: 200, BNBUSDT: 200, BTCUSDT: 200, ETHUSDT: 200,
      SOLUSD1: 100, SOLUSDT: 100, XAGUSDT: 100, XRPUSDT: 100,
      '0GUSDT': 75, '1000BONKUSDT': 75, '1000CHEEMSUSDT': 75, '1000FLOKIUSDT': 75, '1000LUNCUSDT': 75, '1000PEPEUSDT': 75,
      '1000SHIBUSDT': 75, AAVEUSDT: 75, ADAUSDT: 75, APEUSDT: 75, APTUSDT: 75, ARBUSDT: 75,
      ARUSDT: 75, ATOMUSDT: 75, AUCTIONUSDT: 75, AVAXUSDT: 75, AVNTUSDT: 75, AXLUSDT: 75,
      AXSUSDT: 75, BCHUSDT: 75, BERAUSDT: 75, BIOUSDT: 75, BOMEUSDT: 75, CAKEUSDT: 75,
      CCUSDT: 75, COWUSDT: 75, CRVUSDT: 75, DOGEUSDT: 75, DOTUSDT: 75,
      DYDXUSDT: 75, EIGENUSDT: 75, ENAUSDT: 75, ETHFIUSDT: 75, EULUSDT: 75, FETUSDT: 75,
      FFUSDT: 75, FILUSDT: 75, GALAUSDT: 75, GMTUSDT: 75, GRASSUSDT: 75, HBARUSDT: 75,
      ICPUSDT: 75, INJUSDT: 75, IPUSDT: 75, JASMYUSDT: 75, JTOUSDT: 75, JUPUSDT: 75,
      KASUSDT: 75, LAUSDT: 75, LDOUSDT: 75, LINEAUSDT: 75, LINKUSDT: 75, LTCUSDT: 75,
      MELANIAUSDT: 75, METUSDT: 75, MONUSDT: 75, MOVEUSDT: 75, NOMUSDT: 75, ONDOUSDT: 75,
      OPUSDT: 75, PAXGUSDT: 75, PENDLEUSDT: 75, PENGUUSDT: 75, PNUTUSDT: 75, POLUSDT: 75,
      PUMPUSDT: 75, PYTHUSDT: 75, RENDERUSDT: 75, ROSEUSDT: 75, SEIUSDT: 75, SIGNUSDT: 75,
      SKYUSDT: 75, SNXUSDT: 75, SOMIUSDT: 75, SPXUSDT: 75, STABLEUSDT: 75, STRKUSDT: 75,
      STXUSDT: 75, SUIUSDT: 75, SUSDT: 75, TAOUSDT: 75, TIAUSDT: 75, TONUSDT: 75,
      TRXUSDT: 75, TURBOUSDT: 75, UNIUSDT: 75, VANAUSDT: 75, VIRTUALUSDT: 75, WLDUSDT: 75,
      WLFIUSDT: 75, XAUUSDT: 75, XLMUSDT: 75, XMRUSDT: 75, XPLUSDT: 75, XTZUSDT: 75,
      YBUSDT: 75, ZECUSDT: 75, ZENUSDT: 75, ZILUSDT: 75, ZKUSDT: 75, ZROUSDT: 75,
      '1000BTTCUSDT': 50, ACXUSDT: 50, ALLOUSDT: 50, ANIMEUSDT: 50, APRUSDT: 50, ARPAUSDT: 50,
      ATUSDT: 50, B2USDT: 50, BANANAS31USDT: 50, BANKUSDT: 50, BATUSDT: 50,
      BREVUSDT: 50, CFGUSDT: 50, CLANKERUSDT: 50, CLOUSDT: 50, CLUSDT: 50, CYBERUSDT: 50,
      DEXEUSDT: 50, DOODUSDT: 50, DUSKUSDT: 50, DYMUSDT: 50, EDENUSDT: 50,
      ENJUSDT: 50, ENSOUSDT: 50, ETCUSDT: 50, FARTCOINUSDT: 50, FLUXUSDT: 50, FOLKSUSDT: 50,
      FORMUSDT: 50, FRAXUSDT: 50, GIGGLEUSDT: 50, GPSUSDT: 50, GRIFFAINUSDT: 50, GUSDT: 50,
      GWEIUSDT: 50, HEMIUSDT: 50, HYPERUSDT: 50, INITUSDT: 50, IOTAUSDT: 50,
      KGENUSDT: 50, KITEUSDT: 50, LENDUSDT: 50, LITUSDT: 50, LUNA2USDT: 50, MANTRAUSDT: 50,
      MMTUSDT: 50, NIGHTUSDT: 50, OGNUSDT: 50, ONUSDT: 50, ORCAUSDT: 50, PARTIUSDT: 50,
      PHAUSDT: 50, PIXELUSDT: 50, PLAYUSDT: 50, POLYXUSDT: 50, RPLUSDT: 50, SAHARAUSDT: 50,
      SHELLUSDT: 50, SIRENUSDT: 50, SKYAIUSDT: 50, SQDUSDT: 50, STGUSDT: 50,
      TNSRUSDT: 50, TRIAUSDT: 50, TRUMPUSDT: 50, TRUSTUSDT: 50, TRUTHUSDT: 50,
      TURTLEUSDT: 50, UAIUSDT: 50, UMAUSDT: 50, USELESSUSDT: 50, WETUSDT: 50,
      WIFUSDT: 50, XAIUSDT: 50, XANUSDT: 50, YGGUSDT: 50, ZBTUSDT: 50,
      AWEUSDT: 40, BEATUSDT: 40, LYNUSDT: 40, NAORISUSDT: 40, PROMPTUSDT: 40, RECALLUSDT: 40,
      '1INCHUSDT': 25, ALCHUSDT: 25, ARCUSDT: 25, AZTECUSDT: 25, CFXUSDT: 25,
      COMPUSDT: 25, ENSUSDT: 25, EOSUSDT: 25, ESPUSDT: 25, FTMUSDT: 25, GRTUSDT: 25,
      IMXUSDT: 25, IOUSDT: 25, KAVAUSDT: 25, MATICUSDT: 25, MKRUSDT: 25, NEARUSDT: 25,
      NMRUSDT: 25, OPNUSDT: 25, RUNEUSDT: 25, SANDUSDT: 25, SOLVUSDT: 25, STOUSDT: 25,
      USD1USDT: 25, WOOUSDT: 25,
      AIAUSDT: 20, BOBUSDT: 20, EWYUSDT: 20, GUAUSDT: 20, JELLYJELLYUSDT: 20, OKBUSDT: 20,
      PIPPINUSDT: 20, POWERUSDT: 20, RLSUSDT: 20, ROBOUSDT: 20,
      AAPLUSDT: 10, AMZNUSDT: 10, BELUSDT: 10, BLUAIUSDT: 10, COSUSDT: 10,
      CRCLUSDT: 10, DASHUSDT: 10, FLOWUSDT: 10, GOOGUSDT: 10, HANAUSDT: 10, HOODUSDT: 10,
      INTCUSDT: 10, METAUSDT: 10, MSFTUSDT: 10, MSTRUSDT: 10, NATGASUSDT: 10,
      NVDAUSDT: 10, QQQUSDT: 10, TSLAUSDT: 10, ZEREBROUSDT: 10,
      BUSDT: 5, KATUSDT: 5, LISTAUSDT: 5, MEGAUSDT: 5, MOODENGUSDT: 5, PTBUSDT: 5,
      TOWNSUSDT: 5, BARDUSDT: 5,
      MUUSDT: 3, SNDKUSDT: 3, XCUUSDT: 3, XPDUSDT: 3, XPTUSDT: 3, FUNUSDT: 3, VELOUSDT: 3,
    };

    const ASTER_EXCLUDED = new Set(['QQQUSDT', 'BTCUSD1', 'ETHUSD1']);

    return symbols.map((s) => {
      const ticker = tickerMap.get(s.symbol) || {};
      const funding = fundingMap.get(s.symbol) || {};
      const base = extractBase(s.symbol);

      const maxLev = ASTER_LEV[s.symbol] || 20;

      const oi = oiMap.get(s.symbol) || 0;

      return {
        id: `aster:${s.symbol}`,
        protocol: 'aster' as Protocol,
        chain: 'arbitrum' as const,
        type: 'perp' as const,
        symbol: s.symbol,
        baseAsset: base,
        quoteAsset: s.quoteAsset || 'USDT',
        price: parseFloat(ticker.lastPrice) || 0,
        change24h: parseFloat(ticker.priceChangePercent) || 0,
        volume24h: parseFloat(ticker.quoteVolume) || 0,
        openInterest: oi,
        fundingRate: parseFloat(funding.lastFundingRate) * 100 || 0,
        maxLeverage: maxLev,
        markPrice: parseFloat(funding.markPrice) || parseFloat(ticker.lastPrice) || 0,
        indexPrice: parseFloat(funding.indexPrice) || 0,
        category: categorize(base),
        name: makeName(base),
      };
    }).filter(m => {
      if (ASTER_EXCLUDED.has(m.symbol)) return false;
      const CRYPTO_CATS = new Set(['crypto', 'meme', 'defi']);
      const floor = CRYPTO_CATS.has(m.category) ? 50_000 : 5_000;
      return m.volume24h >= floor;
    });
  } catch {
    return [];
  }
}


export async function loadHyperliquidMarkets(): Promise<UnifiedMarket[]> {
  try {
    const { HL_BASE_CATEGORY, extractHlBase } = await import('@/config/hlCategoryMap');

    const res = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const [meta, assetCtxs] = await res.json();

    return (meta.universe as any[])
      .map((asset: any, i: number) => {
        if (asset.isDelisted) return null;
        const ctx = assetCtxs[i];
        if (!ctx) return null;
        const coin = asset.name as string;

        // Extract base asset and look up in hardcoded whitelist
        const base = extractHlBase(coin);
        const cat = HL_BASE_CATEGORY[base];
        if (!cat) return null; // not on the verified list → exclude

        // displayBase: the human-readable ticker (with k/1000 prefix stripped)
        const displayBase = coin.includes(':')
          ? (coin.split(':')[1] !== undefined &&
            ['USDC','USDE','USDH','USDT','USD'].includes(coin.split(':')[1])
              ? coin.split(':')[0]
              : coin.split(':')[1])
          : coin;

        const midPx = ctx.midPx ? parseFloat(ctx.midPx) : parseFloat(ctx.markPx);
        const prevDayPx = parseFloat(ctx.prevDayPx);
        const change24h = prevDayPx > 0 ? ((midPx - prevDayPx) / prevDayPx) * 100 : 0;

        return {
          id: `hyperliquid:${coin}`,
          protocol: 'hyperliquid' as Protocol,
          chain: 'hyperliquid' as const,
          type: 'perp' as const,
          symbol: coin,
          baseAsset: displayBase,
          quoteAsset: 'USDC',
          price: midPx,
          change24h,
          volume24h: parseFloat(ctx.dayNtlVlm) || 0,
          openInterest: parseFloat(ctx.openInterest) || 0,
          fundingRate: parseFloat(ctx.funding) * 100 || 0,
          maxLeverage: asset.maxLeverage || 3,
          markPrice: parseFloat(ctx.markPx) || 0,
          indexPrice: parseFloat(ctx.oraclePx) || 0,
          category: cat,
          name: makeName(displayBase),
        };
      })
      .filter((m) => m !== null && m!.volume24h >= 100_000) as UnifiedMarket[];
  } catch {
    return [];
  }
}

export async function loadHyperliquidSpotMarkets(): Promise<UnifiedMarket[]> {
  try {
    const res = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'spotMetaAndAssetCtxs' }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const [meta, assetCtxs] = await res.json();

    const tokens: { name: string; szDecimals: number; weiDecimals: number; index: number; tokenId: string; isCanonical?: boolean }[] = meta.tokens || [];
    const universe: { name: string; tokens: [number, number]; isCanonical?: boolean }[] = meta.universe || [];

    const tokenByIndex = new Map<number, typeof tokens[0]>();
    tokens.forEach((t, i) => tokenByIndex.set(i, t));

    return universe
      .map((pair, i) => {
        const ctx = assetCtxs[i];
        if (!ctx) return null;

        const midPx = ctx.midPx ? parseFloat(ctx.midPx) : 0;
        if (midPx <= 0) return null;

        const prevDayPx = ctx.prevDayPx ? parseFloat(ctx.prevDayPx) : 0;
        const change24h = prevDayPx > 0 ? ((midPx - prevDayPx) / prevDayPx) * 100 : 0;
        const volume = ctx.dayNtlVlm ? parseFloat(ctx.dayNtlVlm) : 0;

        const baseToken = tokenByIndex.get(pair.tokens[0]);
        const quoteToken = tokenByIndex.get(pair.tokens[1]);
        if (!baseToken) return null;

        const baseName = baseToken.name;
        const quoteName = quoteToken?.name || 'USDC';

        const displayName = pair.name.startsWith('@') ? baseName : pair.name.split('/')[0] || baseName;

        return {
          id: `hyperliquid-spot:${baseName}/${quoteName}`,
          protocol: 'hyperliquid' as Protocol,
          chain: 'hyperliquid' as const,
          type: 'spot' as const,
          symbol: `${baseName}/${quoteName}`,
          baseAsset: displayName,
          quoteAsset: quoteName,
          price: midPx,
          change24h,
          volume24h: volume,
          category: categorize(displayName),
          name: makeName(displayName),
        };
      })
      .filter((m) => m !== null && m!.volume24h >= 1_000_000) as UnifiedMarket[];
  } catch {
    return [];
  }
}

export async function loadLighterMarkets(): Promise<UnifiedMarket[]> {
  const BASE = 'https://mainnet.zklighter.elliot.ai';
  try {
    // /api/v1/orderBookDetails returns live prices, volume, OI, and % change
    const res = await fetch(`${BASE}/api/v1/orderBookDetails`, {
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return buildLighterFallback();

    const data = await res.json();
    // Response shape: { order_book_details: [...] }
    const rawMarkets: any[] = data.order_book_details || data.markets || data.data || [];

    // Build a lookup by symbol (Lighter uses plain symbol like "EURUSD", not "EURUSD-PERP")
    const rawBySymbol = new Map<string, any>();
    for (const m of rawMarkets) {
      if (m.symbol) rawBySymbol.set(m.symbol.toUpperCase(), m);
    }

    const results: UnifiedMarket[] = [];

    for (const cfg of LIGHTER_MARKETS) {
      // Match by internalSymbol (e.g. "EURUSD"), not venueTicker ("EURUSD-PERP")
      const raw = rawBySymbol.get(cfg.internalSymbol.toUpperCase());

      let price = 0;
      let change24h = 0;
      let volume24h = 0;
      let openInterest = 0;
      let fundingRate = 0;
      let markPrice = 0;
      let indexPrice = 0;

      if (raw && raw.status === 'active') {
        price = Number(raw.last_trade_price) || 0;
        markPrice = price;
        // daily_price_change is already a percentage (e.g. -3.62)
        change24h = Number(raw.daily_price_change) || 0;
        volume24h = Number(raw.daily_quote_token_volume) || 0;
        openInterest = Number(raw.open_interest) || 0;
        // funding rate not in orderBookDetails — fetched separately if needed
        fundingRate = 0;
      }

      const baseAsset = cfg.internalSymbol;
      const quoteAsset = cfg.category === 'forex'
        ? baseAsset.startsWith('USD')
          ? baseAsset.slice(3)
          : 'USD'
        : 'USDC';

      results.push({
        id: `lighter:${cfg.venueTicker}`,
        protocol: 'lighter' as Protocol,
        chain: 'lighter' as const,
        type: 'perp' as const,
        symbol: cfg.venueTicker,
        baseAsset,
        quoteAsset,
        price,
        change24h,
        volume24h,
        openInterest,
        fundingRate,
        maxLeverage: cfg.maxLeverage,
        markPrice,
        indexPrice,
        category: cfg.category,
        name: cfg.name,
      });
    }

    return results;
  } catch {
    return buildLighterFallback();
  }
}

function buildLighterFallback(): UnifiedMarket[] {
  return LIGHTER_MARKETS.map((cfg) => {
    const baseAsset = cfg.internalSymbol;
    const quoteAsset = cfg.category === 'forex'
      ? baseAsset.startsWith('USD')
        ? baseAsset.slice(3)
        : 'USD'
      : 'USDC';
    return {
      id: `lighter:${cfg.venueTicker}`,
      protocol: 'lighter' as Protocol,
      chain: 'lighter' as const,
      type: 'perp' as const,
      symbol: cfg.venueTicker,
      baseAsset,
      quoteAsset,
      price: 0,
      change24h: 0,
      volume24h: 0,
      openInterest: 0,
      fundingRate: 0,
      maxLeverage: cfg.maxLeverage,
      markPrice: 0,
      indexPrice: 0,
      category: cfg.category,
      name: cfg.name,
    };
  });
}

export async function refreshAllMarkets(
  _origin: string
): Promise<UnifiedMarket[]> {
  const [aster, hl, hlSpot, lighter] = await Promise.allSettled([
    loadAsterMarkets(),
    loadHyperliquidMarkets(),
    loadHyperliquidSpotMarkets(),
    loadLighterMarkets(),
  ]);
  return [
    ...(aster.status === 'fulfilled' ? aster.value : []),
    ...(hl.status === 'fulfilled' ? hl.value : []),
    ...(hlSpot.status === 'fulfilled' ? hlSpot.value : []),
    ...(lighter.status === 'fulfilled' ? lighter.value : []),
  ];
}

export function getMarketsByProtocol(
  markets: UnifiedMarket[],
  proto: Protocol,
  type?: 'perp' | 'spot'
): UnifiedMarket[] {
  return markets.filter(
    (m) => m.protocol === proto && (!type || m.type === type)
  );
}

export function getAllPerps(markets: UnifiedMarket[]): UnifiedMarket[] {
  return markets.filter((m) => m.type === 'perp');
}

export function getAllSpot(markets: UnifiedMarket[]): UnifiedMarket[] {
  return markets.filter((m) => m.type === 'spot');
}
