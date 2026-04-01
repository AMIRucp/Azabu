const STATIC_LOGOS: Record<string, string> = {
  So11111111111111111111111111111111111111112: "/tokens/sol.png",
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "/tokens/usdc.png",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "/tokens/usdt.png",
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: "/tokens/jup.png",
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: "/tokens/bonk.png",
  EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm: "/tokens/wif.png",
  "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh": "/tokens/btc.png",
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs": "/tokens/eth.png",
  HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3: "/tokens/pyth.png",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "/tokens/ray.png",
  J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn: "/tokens/jitosol.png",
  jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL: "/tokens/jto.png",
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: "/tokens/msol.png",
  jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjdb9J: "/tokens/jupsol.png",
  "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4": "/tokens/jlp.png",
  HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzKKUCVpFHGnPSu: "/tokens/eurc.png",

  "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1": "/tokens/eth.png",
  "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f": "/tokens/btc.png",
  "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9": "/tokens/usdt.png",
  "0xaf88d065e77c8cC2239327C5EDb3A432268e5831": "/tokens/usdc.png",
  "0x912CE59144191C1204E64559FE8253a0e49E6548": "/tokens/arb.png",
  "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4": "/tokens/link.png",
  "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0": "/tokens/uni.png",
  "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8": "/tokens/usdc.png",
  "0x5979D7b546E38E9Ab8E801A3382f9e5C6a5B0D97": "/tokens/wsteth.png",

  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "/tokens/eth.png",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": "/tokens/btc.png",
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "/tokens/usdc.png",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": "/tokens/usdt.png",
  "0x514910771AF9Ca656af840dff83E8264EcF986CA": "/tokens/link.png",
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": "/tokens/uni.png",
  "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9": "/tokens/aave.png",
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": "/tokens/dai.png",
  "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0": "/tokens/matic.png",
  "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE": "/tokens/shib.png",
};

const T = (sym: string) => `/tokens/${sym.toLowerCase()}.png`;

const SYMBOL_LOGO: Record<string, string> = {
  ETH: T("eth"), BTC: T("btc"), SOL: T("sol"), USDC: T("usdc"), USDT: T("usdt"),
  WETH: T("eth"), WBTC: T("btc"),
  ARB: T("arb"), LINK: T("link"), UNI: T("uni"), AAVE: T("aave"), DAI: T("dai"),
  MATIC: T("matic"), DOGE: T("doge"), SHIB: T("shib"), AVAX: T("avax"),
  BONK: T("bonk"), WIF: T("wif"), JUP: T("jup"), PYTH: T("pyth"),
  RAY: T("ray"), JTO: T("jto"), MSOL: T("msol"), JITOSOL: T("jitosol"),
  JUPSOL: T("jupsol"), JLP: T("jlp"), EURC: T("eurc"),
  GNS: T("gns"), WSTETH: T("wsteth"), STETH: T("steth"),
  OP: T("op"), CRV: T("crv"), LDO: T("ldo"), PEPE: T("pepe"),
  APE: T("ape"), FTM: T("ftm"), NEAR: T("near"), ATOM: T("atom"),
  DOT: T("dot"), SUI: T("sui"), APT: T("apt"), SEI: T("sei"),
  TIA: T("tia"), INJ: T("inj"), RENDER: T("render"), FET: T("fet"),
  TAO: T("tao"), WLD: T("wld"), ONDO: T("ondo"), MKR: T("mkr"),
  PENDLE: T("pendle"), W: T("w"),
  JTO_EVM: T("jto"), SOL_EVM: T("sol"),
  XRP: T("xrp"), LTC: T("ltc"), ORDI: T("ordi"), STX: T("stx"),
  POL: T("pol"), HNT: T("hnt"), RNDR: T("render"), BNB: T("bnb"),

  "SOL-PERP": T("sol"), "BTC-PERP": T("btc"), "ETH-PERP": T("eth"),
  "JUP-PERP": T("jup"), "JTO-PERP": T("jto"), "WIF-PERP": T("wif"),
  "1MBONK-PERP": T("bonk"), "1MPEPE-PERP": T("pepe"),
  "DOGE-PERP": T("doge"), "SUI-PERP": T("sui"), "APT-PERP": T("apt"),
  "ARB-PERP": T("arb"), "OP-PERP": T("op"), "LINK-PERP": T("link"),
  "BNB-PERP": T("bnb"), "XRP-PERP": T("xrp"), "TIA-PERP": T("tia"),
  "RENDER-PERP": T("render"), "INJ-PERP": T("inj"), "HNT-PERP": T("hnt"),
  "POL-PERP": T("pol"),

  "AVAX-USD": T("avax"), "NEAR-USD": T("near"),
  "BTC-USD": T("btc"), "ETH-USD": T("eth"), "SOL-USD": T("sol"),
  "ARB-USD": T("arb"), "LINK-USD": T("link"), "OP-USD": T("op"),
  "DOGE-USD": T("doge"), "WIF-USD": T("wif"), "PEPE-USD": T("pepe"),
  "XRP-USD": T("xrp"), "APT-USD": T("apt"), "AAVE-USD": T("aave"),
  "UNI-USD": T("uni"),

  ADA: T("ada"), FIL: T("fil"), HYPE: T("hype"), TRUMP: T("trump"),
  AXS: T("axs"), PAXG: T("paxg"), ASTER: T("aster"),
  APR: T("apr"), ARIA: T("aria"), COLLECT: T("collect"), H: T("h"), LAB: T("lab"), Q: T("q"), SIGN: T("sign"), STABLE: T("stable"), TRADOOR: T("tradoor"), MORPHO: T("morpho"), NMR: T("nmr"), CRO: T("cro"), AERO: T("aero"),
  PLAY: T("play"), SPACE: T("space"), LIGHT: T("light"), JCT: T("jct"), XPL: T("xpl"), RESOLV: T("resolv"), NFLX: T("nflx"),
  SYRUP: T("syrup"), APEX: T("apex"), MAGS: T("mags"),
  BMNR: T("bmnr"), YZY: T("yzy"),

  AAPL: T("aapl"), TSLA: T("tsla"), NVDA: T("nvda"), META: T("meta"),
  GOOG: T("goog"), GOOGL: T("googl"), MSFT: T("msft"), AMZN: T("amzn"), QQQ: T("qqq"),
  HOOD: T("hood"), INTC: T("intc"), MU: T("mu"), SNDK: T("sndk"),
  CRCL: T("crcl"), EWY: T("ewy"), AMD: T("amd"), COIN: T("coin"),
  MSTR: T("mstr"), ASML: T("asml"), PLTR: T("pltr"),
  AAPLUSDT: T("aapl"), TSLAUSDT: T("tsla"), NVDAUSDT: T("nvda"),
  METAUSDT: T("meta"), GOOGUSDT: T("goog"), GOOGLUSDT: T("googl"),
  MSFTUSDT: T("msft"), AMZNUSDT: T("amzn"), QQQUSDT: T("qqq"),
  HOODUSDT: T("hood"), INTCUSDT: T("intc"), MUUSDT: T("mu"),
  SNDKUSDT: T("sndk"), CRCLUSDT: T("crcl"), EWYUSDT: T("ewy"),
  AMDUSDT: T("amd"), COINUSDT: T("coin"), MSTRUSDT: T("mstr"),
  ASMLUSDT: T("asml"), PLTRUSDT: T("pltr"),

  XAU: T("xau"), XAG: T("xag"), XCU: T("xcu"), XPT: T("xpt"),
  XPD: T("xpd"), CL: T("cl"), NATGAS: T("natgas"), WTI: T("wti"),
  XAUUSDT: T("xau"), XAGUSDT: T("xag"), XCUUSDT: T("xcu"),
  XPTUSDT: T("xpt"), XPDUSDT: T("xpd"), CLUSDT: T("cl"),
  NATGASUSDT: T("natgas"), PAXGUSDT: T("paxg"), WTIUSDT: T("wti"),


  SAMSUNG: T("samsung"), SKHYNIX: T("skhynix"), HYUNDAI: T("hyundai"),
  KRCOMP: T("krcomp"), HANMI: T("hanmi"),
  SAMSUNGUSDC: T("samsung"), SKHYNIXUSDC: T("skhynix"), HYUNDAIUSDC: T("hyundai"),
  KRCOMPUSDC: T("krcomp"), HANMIUSDC: T("hanmi"),

  URA: T("ura"), SPY: T("spy"), IWM: T("iwm"), BOTZ: T("botz"),
  URAUSDC: T("ura"), SPYUSDC: T("spy"), IWMUSDC: T("iwm"), BOTZUSDC: T("botz"),
};

const SYMBOL_TO_MINT: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  WBTC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
  WETH: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
  BTC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
  ETH: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
  PYTH: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  JTO: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
  MSOL: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  mSOL: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  JitoSOL: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
  JupSOL: "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjdb9J",
  JLP: "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
  EURC: "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzKKUCVpFHGnPSu",
};

const cache = new Map<string, string | null>();

export { getCmcIcon as getCdnIcon } from '@/config/tokenIcons';

export function loadCdnIcons(): Promise<void> { return Promise.resolve(); }
export function onCdnIconsLoaded(cb: () => void) { cb(); }
export function getCdnLoaded() { return true; }

const SPECIAL_SYMBOL_MAP: Record<string, string> = {
  "\u5E01\u5B89\u4EBA\u751F": "binancers",
  "\u6211\u8E0F\u9A6C\u6765\u4E86": "wtmll",
  "\u96EA\u7403": "xueqiu",
  "\u9F99\u867E": "longxia",
};

export function getStaticLogo(mintOrSymbol: string): string | null {
  if (!mintOrSymbol) return null;
  if (STATIC_LOGOS[mintOrSymbol]) return STATIC_LOGOS[mintOrSymbol];
  if (SPECIAL_SYMBOL_MAP[mintOrSymbol]) return `/tokens/${SPECIAL_SYMBOL_MAP[mintOrSymbol]}.png`;
  const upper = mintOrSymbol.toUpperCase();
  if (SYMBOL_LOGO[upper]) return SYMBOL_LOGO[upper];
  if (SYMBOL_LOGO[mintOrSymbol]) return SYMBOL_LOGO[mintOrSymbol];
  const mint = SYMBOL_TO_MINT[upper];
  if (mint && STATIC_LOGOS[mint]) return STATIC_LOGOS[mint];
  if (upper.endsWith("USDT")) {
    let base = upper.replace(/USDT$/, "");
    if (SYMBOL_LOGO[base]) return SYMBOL_LOGO[base];
    base = base.replace(/^1000/, "").replace(/^1M/, "").replace(/^1K/, "");
    if (SYMBOL_LOGO[base]) return SYMBOL_LOGO[base];
    return `/tokens/${base.toLowerCase()}.png`;
  }
  if (upper.endsWith("-PERP")) {
    const base = upper.replace(/-PERP$/, "").replace(/^1M/, "").replace(/^1K/, "");
    if (SYMBOL_LOGO[base]) return SYMBOL_LOGO[base];
    return `/tokens/${base.toLowerCase()}.png`;
  }
  if (upper.endsWith("-USD")) {
    const base = upper.replace(/-USD$/, "");
    if (SYMBOL_LOGO[base]) return SYMBOL_LOGO[base];
    return `/tokens/${base.toLowerCase()}.png`;
  }
  if (upper.length <= 20 && /^[A-Z0-9]+$/.test(upper)) {
    return `/tokens/${upper.toLowerCase()}.png`;
  }
  return null;
}

export async function getTokenLogo(mint: string): Promise<string | null> {
  const staticResult = getStaticLogo(mint);
  if (staticResult) return staticResult;
  if (cache.has(mint)) return cache.get(mint) || null;

  try {
    const res = await fetch(`https://api.jup.ag/tokens/v2/search?query=${mint}`);
    if (!res.ok) { cache.set(mint, null); return null; }
    const tokens = await res.json();
    const match = Array.isArray(tokens)
      ? tokens.find((t: any) => t.address === mint || t.mint === mint)
      : null;
    const icon = match?.icon || match?.logoURI || null;
    cache.set(mint, icon);
    return icon;
  } catch {
    cache.set(mint, null);
    return null;
  }
}

export async function getTokenLogos(mints: string[]): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  const toFetch: string[] = [];

  for (const mint of mints) {
    if (STATIC_LOGOS[mint]) {
      result[mint] = STATIC_LOGOS[mint];
    } else if (cache.has(mint)) {
      result[mint] = cache.get(mint) || null;
    } else {
      toFetch.push(mint);
    }
  }

  if (toFetch.length === 0) return result;

  const batches: string[][] = [];
  for (let i = 0; i < toFetch.length; i += 100) {
    batches.push(toFetch.slice(i, i + 100));
  }

  for (const batch of batches) {
    try {
      const query = batch.join(",");
      const res = await fetch(`https://api.jup.ag/tokens/v2/search?query=${query}`);
      if (!res.ok) {
        batch.forEach(m => { cache.set(m, null); result[m] = null; });
        continue;
      }
      const tokens: any[] = await res.json();
      const byAddress = new Map<string, string>();
      for (const t of tokens) {
        const addr = t.address || t.mint;
        const icon = t.icon || t.logoURI;
        if (addr && icon) byAddress.set(addr, icon);
      }
      for (const m of batch) {
        const icon = byAddress.get(m) || null;
        cache.set(m, icon);
        result[m] = icon;
      }
    } catch {
      batch.forEach(m => { cache.set(m, null); result[m] = null; });
    }
  }

  return result;
}

export function getLogoColor(symbol: string): string {
  const colors = [
    "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E",
    "#F97316", "#EAB308", "#22C55E", "#14B8A6",
    "#06B6D4", "#3B82F6", "#A855F7", "#D946EF",
  ];
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
