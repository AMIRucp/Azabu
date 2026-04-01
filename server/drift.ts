import axios from 'axios';

const DRIFT_DATA_API = "https://data.api.drift.trade";
const DRIFT_GATEWAY = "https://dlob.drift.trade";

export interface DriftMarket {
  symbol: string;
  name: string;
  icon: string;
  marketIndex: number;
  marketName: string;
  maxLeverage: number;
  minCollateral: number;
  color: string;
  keywords: string[];
}

export const DRIFT_MARKETS: Record<string, DriftMarket> = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    icon: "◎",
    marketIndex: 0,
    marketName: "SOL-PERP",
    maxLeverage: 100,
    minCollateral: 10,
    color: "#9945FF",
    keywords: ["sol", "solana", "sol perp", "long sol", "short sol", "sol leverage", "sol futures", "sol-perp", "long solana", "short solana"],
  },
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    icon: "₿",
    marketIndex: 1,
    marketName: "BTC-PERP",
    maxLeverage: 100,
    minCollateral: 10,
    color: "#F7931A",
    keywords: ["btc", "bitcoin", "btc perp", "long btc", "short btc", "btc leverage", "bitcoin futures", "btc-perp", "long bitcoin", "short bitcoin"],
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    icon: "Ξ",
    marketIndex: 2,
    marketName: "ETH-PERP",
    maxLeverage: 100,
    minCollateral: 10,
    color: "#627EEA",
    keywords: ["eth", "ethereum", "eth perp", "long eth", "short eth", "eth leverage", "ethereum futures", "eth-perp", "long ethereum", "short ethereum"],
  },
  APT: {
    symbol: "APT",
    name: "Aptos",
    icon: "A",
    marketIndex: 3,
    marketName: "APT-PERP",
    maxLeverage: 50,
    minCollateral: 10,
    color: "#00BFA5",
    keywords: ["apt", "aptos", "apt perp", "long apt", "short apt", "apt leverage", "aptos futures", "apt-perp", "long aptos", "short aptos"],
  },
  BONK: {
    symbol: "1MBONK",
    name: "Bonk",
    icon: "B",
    marketIndex: 4,
    marketName: "1MBONK-PERP",
    maxLeverage: 10,
    minCollateral: 10,
    color: "#F5A623",
    keywords: ["bonk", "1mbonk", "bonk perp", "long bonk", "short bonk", "bonk leverage", "bonk futures", "1mbonk-perp", "long bonk", "short bonk"],
  },
  POL: {
    symbol: "POL",
    name: "Polygon",
    icon: "M",
    marketIndex: 5,
    marketName: "POL-PERP",
    maxLeverage: 20,
    minCollateral: 10,
    color: "#8247E5",
    keywords: ["pol", "polygon", "matic", "pol perp", "long pol", "short pol", "pol leverage", "polygon futures", "pol-perp", "long polygon", "short polygon"],
  },
  ARB: {
    symbol: "ARB",
    name: "Arbitrum",
    icon: "A",
    marketIndex: 6,
    marketName: "ARB-PERP",
    maxLeverage: 20,
    minCollateral: 10,
    color: "#28A0F0",
    keywords: ["arb", "arbitrum", "arb perp", "long arb", "short arb", "arb leverage", "arbitrum futures", "arb-perp"],
  },
  DOGE: {
    symbol: "DOGE",
    name: "Dogecoin",
    icon: "D",
    marketIndex: 7,
    marketName: "DOGE-PERP",
    maxLeverage: 50,
    minCollateral: 10,
    color: "#C2A633",
    keywords: ["doge", "dogecoin", "doge perp", "long doge", "short doge", "doge leverage", "dogecoin futures", "doge-perp"],
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    icon: "B",
    marketIndex: 8,
    marketName: "BNB-PERP",
    maxLeverage: 50,
    minCollateral: 10,
    color: "#F3BA2F",
    keywords: ["bnb", "binance", "bnb perp", "long bnb", "short bnb", "bnb leverage", "bnb futures", "bnb-perp"],
  },
  SUI: {
    symbol: "SUI",
    name: "Sui",
    icon: "S",
    marketIndex: 9,
    marketName: "SUI-PERP",
    maxLeverage: 50,
    minCollateral: 10,
    color: "#6FBCF0",
    keywords: ["sui", "sui perp", "long sui", "short sui", "sui leverage", "sui futures", "sui-perp"],
  },
  PEPE: {
    symbol: "1MPEPE",
    name: "Pepe",
    icon: "P",
    marketIndex: 10,
    marketName: "1MPEPE-PERP",
    maxLeverage: 10,
    minCollateral: 10,
    color: "#00A86B",
    keywords: ["pepe", "1mpepe", "pepe perp", "long pepe", "short pepe", "pepe leverage", "pepe futures", "1mpepe-perp"],
  },
  OP: {
    symbol: "OP",
    name: "Optimism",
    icon: "O",
    marketIndex: 11,
    marketName: "OP-PERP",
    maxLeverage: 20,
    minCollateral: 10,
    color: "#FF0420",
    keywords: ["op", "optimism", "op perp", "long op", "short op", "op leverage", "optimism futures", "op-perp"],
  },
  RENDER: {
    symbol: "RENDER",
    name: "Render",
    icon: "R",
    marketIndex: 12,
    marketName: "RENDER-PERP",
    maxLeverage: 50,
    minCollateral: 10,
    color: "#00B4D8",
    keywords: ["render", "rndr", "render perp", "long render", "short render", "render leverage", "render futures", "render-perp", "rndr perp"],
  },
  XRP: {
    symbol: "XRP",
    name: "XRP",
    icon: "X",
    marketIndex: 13,
    marketName: "XRP-PERP",
    maxLeverage: 50,
    minCollateral: 10,
    color: "#23292F",
    keywords: ["xrp", "ripple", "xrp perp", "long xrp", "short xrp", "xrp leverage", "xrp futures", "xrp-perp"],
  },
  HNT: {
    symbol: "HNT",
    name: "Helium",
    icon: "H",
    marketIndex: 14,
    marketName: "HNT-PERP",
    maxLeverage: 20,
    minCollateral: 10,
    color: "#474DFF",
    keywords: ["hnt", "helium", "hnt perp", "long hnt", "short hnt", "hnt leverage", "helium futures", "hnt-perp"],
  },
  INJ: {
    symbol: "INJ",
    name: "Injective",
    icon: "I",
    marketIndex: 15,
    marketName: "INJ-PERP",
    maxLeverage: 20,
    minCollateral: 10,
    color: "#00F2FE",
    keywords: ["inj", "injective", "inj perp", "long inj", "short inj", "inj leverage", "injective futures", "inj-perp"],
  },
  LINK: {
    symbol: "LINK",
    name: "Chainlink",
    icon: "L",
    marketIndex: 16,
    marketName: "LINK-PERP",
    maxLeverage: 50,
    minCollateral: 10,
    color: "#2A5ADA",
    keywords: ["link", "chainlink", "link perp", "long link", "short link", "link leverage", "chainlink futures", "link-perp"],
  },
  JTO: {
    symbol: "JTO",
    name: "Jito",
    icon: "J",
    marketIndex: 17,
    marketName: "JTO-PERP",
    maxLeverage: 50,
    minCollateral: 10,
    color: "#00D18C",
    keywords: ["jto", "jito", "jto perp", "long jto", "short jto", "jto leverage", "jito futures", "jto-perp"],
  },
  TIA: {
    symbol: "TIA",
    name: "Celestia",
    icon: "T",
    marketIndex: 18,
    marketName: "TIA-PERP",
    maxLeverage: 20,
    minCollateral: 10,
    color: "#7B2FBE",
    keywords: ["tia", "celestia", "tia perp", "long tia", "short tia", "tia leverage", "celestia futures", "tia-perp"],
  },
  JUP: {
    symbol: "JUP",
    name: "Jupiter",
    icon: "J",
    marketIndex: 19,
    marketName: "JUP-PERP",
    maxLeverage: 50,
    minCollateral: 10,
    color: "#00D18C",
    keywords: ["jup", "jupiter", "jup perp", "long jup", "short jup", "jup leverage", "jupiter futures", "jup-perp"],
  },
  WIF: {
    symbol: "WIF",
    name: "dogwifhat",
    icon: "W",
    marketIndex: 20,
    marketName: "WIF-PERP",
    maxLeverage: 10,
    minCollateral: 10,
    color: "#A855F7",
    keywords: ["wif", "dogwifhat", "wif perp", "long wif", "short wif", "wif leverage", "wif futures", "wif-perp"],
  },
};

export interface DriftPosition {
  address: string;
  marketIndex: number;
  market: string;
  side: string;
  sizeBase: number;
  sizeUsd: number;
  entryPrice: number;
  markPrice: number;
  pnlUsd: number;
  pnlPct: number;
  liquidationPrice: number;
  leverage: number;
}

export async function driftGetPrice(marketSymbol: string): Promise<number | null> {
  const mkt = DRIFT_MARKETS[marketSymbol?.toUpperCase()];
  if (!mkt) return null;

  try {
    const res = await axios.get(`${DRIFT_GATEWAY}/l2`, {
      params: { marketName: mkt.marketName, depth: 1, includeOracle: true, includeVamm: true },
      timeout: 5000,
    });

    if (res.status !== 200) return null;
    const d = res.data;
    const raw = d?.oracle?.price ?? d?.oraclePrice ?? d?.oracle_price;
    if (raw) return parseFloat(raw) / 1e6;
    const bid = d.bids?.[0]?.price;
    const ask = d.asks?.[0]?.price;
    if (ask && bid) return (parseFloat(ask) + parseFloat(bid)) / 2 / 1e6;
    if (ask) return parseFloat(ask) / 1e6;

    return null;
  } catch {
    return null;
  }
}

export interface OrderbookLevel {
  price: number;
  size: number;
  total: number;
}

export interface OrderbookData {
  asks: OrderbookLevel[];
  bids: OrderbookLevel[];
  midPrice: number;
  spread: number;
  spreadPct: number;
}

export async function driftGetOrderbook(marketSymbol: string, depth: number = 10): Promise<OrderbookData | null> {
  const mkt = DRIFT_MARKETS[marketSymbol?.toUpperCase()];
  if (!mkt) return null;

  try {
    const res = await axios.get(`${DRIFT_GATEWAY}/l2`, {
      params: { marketName: mkt.marketName, depth, includeOracle: true, includeVamm: true },
      timeout: 5000,
    });
    if (res.status !== 200) return null;
    const d = res.data;

    const rawAsks: OrderbookLevel[] = (d.asks || []).slice(0, depth).map((a: any) => ({
      price: parseFloat(a.price) / 1e6,
      size: parseFloat(a.size) / 1e9,
      total: 0,
    }));
    const rawBids: OrderbookLevel[] = (d.bids || []).slice(0, depth).map((b: any) => ({
      price: parseFloat(b.price) / 1e6,
      size: parseFloat(b.size) / 1e9,
      total: 0,
    }));

    let askTotal = 0;
    for (const a of rawAsks) { askTotal += a.size * a.price; a.total = askTotal; }
    let bidTotal = 0;
    for (const b of rawBids) { bidTotal += b.size * b.price; b.total = bidTotal; }

    const bestBid = rawBids[0]?.price || 0;
    const bestAsk = rawAsks[0]?.price || 0;
    const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk;
    const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
    const spreadPct = midPrice > 0 ? (spread / midPrice) * 100 : 0;

    return { asks: rawAsks, bids: rawBids, midPrice, spread, spreadPct };
  } catch {
    return null;
  }
}

export async function driftGetPositions(walletPubkey: string): Promise<DriftPosition[]> {
  if (!walletPubkey) return [];

  try {
    const accountsRes = await axios.get(`${DRIFT_DATA_API}/authority/${walletPubkey}/accounts`, {
      timeout: 8000,
    });
    const accounts = accountsRes.data?.accounts ?? [];
    if (accounts.length === 0) return [];

    const accountId = accounts[0]?.accountId ?? accounts[0]?.userAccount ?? walletPubkey;

    const posRes = await axios.get(`${DRIFT_DATA_API}/user/${accountId}/positions`, {
      timeout: 8000,
    });
    const records = posRes.data?.records ?? posRes.data?.positions ?? [];

    let prices: Record<number, number> = {};
    try {
      const priceRes = await axios.get(`${DRIFT_DATA_API}/stats/markets/prices`, { timeout: 5000 });
      const markets = priceRes.data?.markets ?? [];
      for (const m of markets) {
        if (m.marketType === "perp" && m.currentPrice) {
          prices[m.marketIndex] = parseFloat(m.currentPrice);
        }
      }
    } catch {}

    return records
      .filter((p: any) => {
        const base = p.baseAssetAmount ?? p.baseSize ?? p.size;
        return base && base !== "0" && parseFloat(base) !== 0;
      })
      .map((p: any) => {
        const base = parseFloat(p.baseAssetAmount ?? p.baseSize ?? p.size ?? "0") / 1e9;
        const quote = parseFloat(p.quoteAssetAmount ?? p.quoteSize ?? "0") / 1e6;
        const entry = parseFloat(p.quoteEntryAmount ?? p.entryPrice ?? "0") / 1e6;
        const pnl = parseFloat(p.unsettledPnl ?? p.pnl ?? "0") / 1e6;
        const mktIndex = p.marketIndex ?? 0;
        const mktSymbol = Object.values(DRIFT_MARKETS).find(m => m.marketIndex === mktIndex)?.symbol ?? "SOL";
        const side = base > 0 ? "long" : "short";
        const entryPrice = base !== 0 ? Math.abs(entry / base) : 0;
        const currentPrice = prices[mktIndex] ?? entryPrice;
        const sizeUsd = Math.abs(base) * currentPrice;

        return {
          address: p.pubkey ?? p.userAccount ?? '',
          marketIndex: mktIndex,
          market: mktSymbol,
          side,
          sizeBase: Math.abs(base),
          sizeUsd,
          entryPrice,
          markPrice: currentPrice,
          pnlUsd: pnl,
          pnlPct: sizeUsd > 0 ? (pnl / sizeUsd) * 100 : 0,
          liquidationPrice: parseFloat(p.liquidationPrice ?? "0") / 1e6 || 0,
          leverage: parseFloat(p.leverage ?? "1") || 1,
        };
      });
  } catch (e: any) {
    console.warn("driftGetPositions failed:", e.message);
    return [];
  }
}

export function driftDeepLink(marketName: string, side: string = "long"): string {
  return `https://app.drift.trade/trade/${encodeURIComponent(marketName)}?side=${side}`;
}

export function driftEarnLink(path: string): string {
  return `https://app.drift.trade${path}`;
}

export interface DriftSpotMarket {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  marketIndex: number;
  fallbackSupplyApy: number;
  fallbackBorrowApy: number;
}

export const DRIFT_SPOT_MARKETS: DriftSpotMarket[] = [
  { symbol: "USDC", name: "USD Coin", icon: "$", color: "#2775CA", marketIndex: 0, fallbackSupplyApy: 0.0159, fallbackBorrowApy: 0.048 },
  { symbol: "SOL", name: "Solana", icon: "◎", color: "#9945FF", marketIndex: 1, fallbackSupplyApy: 0.021, fallbackBorrowApy: 0.065 },
  { symbol: "BTC", name: "Bitcoin", icon: "₿", color: "#F7931A", marketIndex: 2, fallbackSupplyApy: 0.008, fallbackBorrowApy: 0.032 },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ", color: "#627EEA", marketIndex: 3, fallbackSupplyApy: 0.012, fallbackBorrowApy: 0.038 },
  { symbol: "USDT", name: "Tether", icon: "₮", color: "#26A17B", marketIndex: 4, fallbackSupplyApy: 0.022, fallbackBorrowApy: 0.055 },
];

export interface DriftStrategyVault {
  name: string;
  description: string;
  token: string;
  manager: string;
  vaultAddress: string;
  color: string;
}

export const DRIFT_STRATEGY_VAULTS: DriftStrategyVault[] = [
  {
    name: "Supercharger Vault",
    description: "Delta-neutral yield on BTC + ETH perps. Market-neutral, auto-rebalanced.",
    token: "USDC",
    manager: "Drift Labs",
    vaultAddress: "DBD8hAwLDRQkTsu3LRLXZ3F3GqpKTzFNGGTP3PNEHuoM",
    color: "#F5C842",
  },
  {
    name: "Turbocharge Vault",
    description: "Amplified SOL yield. Long SOL + delta-hedged. High APY, higher volatility.",
    token: "USDC",
    manager: "Drift Labs",
    vaultAddress: "FQSfzFDGNkFMiJQMSa7GXEfPMqJXGnFvGYDsGCVDdaN",
    color: "#9945FF",
  },
  {
    name: "Neutral Vault",
    description: "Flat market-neutral yield strategy. Earns funding rates without directional risk.",
    token: "USDC",
    manager: "Drift Labs",
    vaultAddress: "3xxgYc3jXPdjqpMdrRyKtcddh4ZdtqpaN33sR9YHecNj",
    color: "#34D399",
  },
];

export interface DriftAmplifyStrategy {
  name: string;
  token: string;
  apyRange: string;
  description: string;
  color: string;
}

export const DRIFT_AMPLIFY_STRATEGIES: DriftAmplifyStrategy[] = [
  { name: "SOL Amplify", token: "SOL", apyRange: "8-24%", description: "Long SOL + delta-hedged borrow position. Earns yield on leveraged SOL.", color: "#9945FF" },
  { name: "BTC Amplify", token: "BTC", apyRange: "5-14%", description: "Leveraged BTC long with auto-managed hedge. Earns funding + price exposure.", color: "#F7931A" },
  { name: "USDC Amplify", token: "USDC", apyRange: "6-18%", description: "Leveraged stable yield. Earns borrow spread across multiple Drift markets.", color: "#2775CA" },
];

export interface DriftInsuranceMarket {
  symbol: string;
  icon: string;
  color: string;
  indicativeApy: string;
  description: string;
}

export const DRIFT_INSURANCE_MARKETS: DriftInsuranceMarket[] = [
  { symbol: "USDC", icon: "$", color: "#2775CA", indicativeApy: "4-8%", description: "Earns from USDC market fees + liquidations" },
  { symbol: "SOL", icon: "◎", color: "#9945FF", indicativeApy: "6-12%", description: "Earns from SOL market fees + liquidation surplus" },
];

export async function driftFetchMarketPrices(): Promise<Record<string, { price: number; change24h: number; changePct: number }>> {
  try {
    const res = await axios.get(`${DRIFT_DATA_API}/stats/markets/prices`, { timeout: 5000 });
    const markets = res.data?.markets ?? [];
    const result: Record<string, { price: number; change24h: number; changePct: number }> = {};
    for (const m of markets) {
      if (m.marketType === "perp" && m.currentPrice) {
        result[m.symbol] = {
          price: parseFloat(m.currentPrice),
          change24h: parseFloat(m.priceChange ?? "0"),
          changePct: parseFloat(m.priceChangePercent ?? "0"),
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

export interface DriftMarketStats {
  price: number;
  change24h: number;
  changePct: number;
  vol24h: number;
  openInterestLong: number;
  openInterestShort: number;
  fundingRate: number;
  markPrice: number;
}

export async function driftFetchMarketStats(): Promise<Record<string, DriftMarketStats>> {
  try {
    const res = await axios.get(`${DRIFT_DATA_API}/stats/markets`, { timeout: 8000 });
    const items = Array.isArray(res.data) ? res.data : (res.data?.markets ?? []);
    const result: Record<string, DriftMarketStats> = {};
    for (const m of items) {
      if (m.marketType === "perp" && m.symbol) {
        const price = parseFloat(m.oraclePrice || m.price || "0");
        if (!price) continue;
        result[m.symbol] = {
          price,
          change24h: parseFloat(m.priceChange24h || "0"),
          changePct: parseFloat(m.priceChange24hPercent || "0"),
          vol24h: parseFloat(m.quoteVolume || "0"),
          openInterestLong: parseFloat(m.openInterest?.long || "0"),
          openInterestShort: Math.abs(parseFloat(m.openInterest?.short || "0")),
          fundingRate: parseFloat(m.fundingRate?.long || m.fundingRate24h || "0"),
          markPrice: parseFloat(m.markPrice || m.oraclePrice || "0"),
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function driftFetchFundingRate(marketName: string): Promise<{ hourlyPct: number; annualPct: number } | null> {
  try {
    const symbol = marketName.includes("-PERP") ? marketName : `${marketName}-PERP`;
    const res = await axios.get(`${DRIFT_DATA_API}/market/${symbol}/fundingRates`, {
      timeout: 5000,
    });
    if (res.status !== 200) return null;
    const records = res.data?.records ?? res.data?.fundingRates ?? [];
    const latest = records[0] ?? records[records.length - 1];
    if (!latest) return null;
    const rate = parseFloat(latest.fundingRate);
    const twap = parseFloat(latest.oraclePriceTwap);
    if (!twap) return null;
    const hourlyPct = (rate / twap) * 100;
    const annualPct = hourlyPct * 24 * 365.25;
    return { hourlyPct, annualPct };
  } catch {
    return null;
  }
}

export interface DriftTradeRecord {
  ts: number;
  date: string;
  market: string;
  marketIndex: number;
  side: string;
  type: string;
  price: number;
  sizeUsd: number;
  sizeBase: number;
  pnl: number;
  fee: number;
  leverage: number;
  txSig: string;
}

export async function driftGetTradeHistory(walletPubkey: string, limit: number = 20): Promise<DriftTradeRecord[]> {
  if (!walletPubkey) return [];

  try {
    const accountsRes = await axios.get(`${DRIFT_DATA_API}/authority/${walletPubkey}/accounts`, {
      timeout: 8000,
    });
    const accounts = accountsRes.data?.accounts ?? [];
    if (accounts.length === 0) return [];

    const accountId = accounts[0]?.accountId ?? accounts[0]?.userAccount ?? walletPubkey;

    const tradesRes = await axios.get(`${DRIFT_DATA_API}/user/${accountId}/tradeRecords`, {
      params: { limit },
      timeout: 10000,
    });
    const records = tradesRes.data?.records ?? tradesRes.data?.trades ?? tradesRes.data ?? [];

    return records
      .filter((t: any) => t)
      .slice(0, limit)
      .map((t: any) => {
        const ts = parseInt(t.ts ?? t.timestamp ?? "0") * 1000;
        const mktIndex = t.marketIndex ?? 0;
        const mktSymbol = Object.values(DRIFT_MARKETS).find(m => m.marketIndex === mktIndex)?.symbol ?? "SOL";
        const baseAmount = parseFloat(t.baseAssetAmount ?? t.baseSize ?? "0") / 1e9;
        const quoteAmount = parseFloat(t.quoteAssetAmount ?? t.quoteSize ?? "0") / 1e6;
        const fee = parseFloat(t.fee ?? "0") / 1e6;
        const pnl = parseFloat(t.pnl ?? t.realizedPnl ?? "0") / 1e6;
        const price = baseAmount !== 0 ? Math.abs(quoteAmount / baseAmount) : 0;
        const side = baseAmount > 0 ? "long" : "short";
        const isClose = (t.actionExplanation ?? "").toLowerCase().includes("close") ||
                        (t.action ?? "").toLowerCase().includes("close") ||
                        Math.abs(pnl) > 0;

        return {
          ts,
          date: ts > 0 ? new Date(ts).toISOString() : "",
          market: mktSymbol,
          marketIndex: mktIndex,
          side,
          type: isClose ? "close" : "open",
          price,
          sizeUsd: Math.abs(quoteAmount),
          sizeBase: Math.abs(baseAmount),
          pnl,
          fee,
          leverage: parseFloat(t.leverage ?? "1") || 1,
          txSig: t.txSig ?? t.txSignature ?? "",
        };
      });
  } catch (e: any) {
    console.warn("driftGetTradeHistory failed:", e.message);
    return [];
  }
}

export interface DriftAccountSummary {
  noAccount: boolean;
  totalCollateral: number;
  freeCollateral: number;
  unrealizedPnl: number;
  totalPositionSize: number;
  accountLeverage: number;
  healthScore: number;
  positions: any[];
  spotBalances: any[];
}

export async function driftGetAccountSummary(walletPubkey: string): Promise<DriftAccountSummary> {
  if (!walletPubkey) {
    return { noAccount: true, totalCollateral: 0, freeCollateral: 0, unrealizedPnl: 0, totalPositionSize: 0, accountLeverage: 0, healthScore: 100, positions: [], spotBalances: [] };
  }

  try {
    const { createDriftClient } = await import("./driftClient");
    const { convertToNumber, QUOTE_PRECISION, BASE_PRECISION, PRICE_PRECISION, SpotBalanceType } = await import("@drift-labs/sdk");
    const BN = (await import("bn.js")).default;
    const { PERP_INDEX_TO_SYMBOL, SPOT_INDEX_TO_SYMBOL } = await import("./driftClient");

    const built = await createDriftClient(walletPubkey);
    const driftClient = built.driftClient;

    if (!built.userExists) {
      await driftClient.unsubscribe();
      return { noAccount: true, totalCollateral: 0, freeCollateral: 0, unrealizedPnl: 0, totalPositionSize: 0, accountLeverage: 0, healthScore: 100, positions: [], spotBalances: [] };
    }

    const user = driftClient.getUser();
    await user.fetchAccounts();
    const userAccount = user.getUserAccount();

    const positions = userAccount.perpPositions
      .filter((p: any) => p.baseAssetAmount.toNumber() !== 0)
      .map((p: any) => {
        const baseAmt = convertToNumber(p.baseAssetAmount, BASE_PRECISION);
        const quoteAmt = convertToNumber(p.quoteAssetAmount, QUOTE_PRECISION);
        const quoteEntry = convertToNumber(p.quoteEntryAmount, QUOTE_PRECISION);
        const entryPrice = baseAmt !== 0 ? Math.abs(quoteEntry / baseAmt) : 0;
        let markPrice = entryPrice;
        let sizeUsd = Math.abs(quoteAmt);
        try {
          const oracleData = driftClient.getOracleDataForPerpMarket(p.marketIndex);
          markPrice = convertToNumber(oracleData.price, PRICE_PRECISION);
          sizeUsd = Math.abs(baseAmt) * markPrice;
        } catch {}
        let unrealizedPnl = 0;
        try {
          unrealizedPnl = convertToNumber(user.getUnrealizedPNL(true, p.marketIndex), QUOTE_PRECISION);
        } catch {
          unrealizedPnl = convertToNumber(p.settledPnl, QUOTE_PRECISION);
        }
        let liqPrice: number | null = null;
        try {
          const liqPriceBN = user.liquidationPrice(p.marketIndex);
          if (liqPriceBN && !liqPriceBN.isNeg()) liqPrice = convertToNumber(liqPriceBN, PRICE_PRECISION);
        } catch {}
        return {
          market: PERP_INDEX_TO_SYMBOL[p.marketIndex] || `market-${p.marketIndex}`,
          marketIndex: p.marketIndex,
          direction: baseAmt > 0 ? "long" : "short",
          size: Math.abs(baseAmt),
          sizeUsd,
          entryPrice,
          markPrice,
          unrealizedPnl,
          pnlPct: sizeUsd > 0 ? (unrealizedPnl / sizeUsd) * 100 : 0,
          liquidationPrice: liqPrice,
        };
      });

    const spotBalances = userAccount.spotPositions
      .filter((s: any) => s.scaledBalance.toNumber() !== 0)
      .map((s: any) => {
        const isDeposit = s.balanceType && JSON.stringify(s.balanceType) === JSON.stringify(SpotBalanceType.DEPOSIT);
        const spotMarket = driftClient.getSpotMarketAccount(s.marketIndex);
        const precision = spotMarket ? spotMarket.decimals : 6;
        const precisionBN = new BN(10).pow(new BN(precision));
        return {
          token: SPOT_INDEX_TO_SYMBOL[s.marketIndex] || `spot-${s.marketIndex}`,
          marketIndex: s.marketIndex,
          type: isDeposit ? "deposit" : "borrow",
          balance: convertToNumber(s.scaledBalance, precisionBN),
        };
      });

    const totalCollateral = convertToNumber(user.getTotalCollateral(), QUOTE_PRECISION);
    const freeCollateral = convertToNumber(user.getFreeCollateral(), QUOTE_PRECISION);
    let accountLeverage = 0;
    try {
      const leverageBN = user.getLeverage();
      accountLeverage = convertToNumber(leverageBN, new BN(10000));
    } catch {}

    await driftClient.unsubscribe();

    let unrealizedPnl = 0;
    let totalPositionSize = 0;
    for (const p of positions) {
      unrealizedPnl += p.unrealizedPnl || 0;
      totalPositionSize += p.sizeUsd || 0;
    }

    const maintenanceMarginReq = totalPositionSize * 0.05;
    const healthScore = maintenanceMarginReq > 0
      ? Math.min(100, (totalCollateral / maintenanceMarginReq) * 100)
      : 100;

    return { noAccount: false, totalCollateral, freeCollateral, unrealizedPnl, totalPositionSize, accountLeverage, healthScore, positions, spotBalances };
  } catch (e: any) {
    if (e.message?.includes("Account does not exist") || e.message?.includes("has not been initialized")) {
      return { noAccount: true, totalCollateral: 0, freeCollateral: 0, unrealizedPnl: 0, totalPositionSize: 0, accountLeverage: 0, healthScore: 100, positions: [], spotBalances: [] };
    }
    console.warn("driftGetAccountSummary failed:", e.message);
    throw e;
  }
}

export async function driftFetchSpotApys(): Promise<Array<DriftSpotMarket & { supplyApy: number; borrowApy: number; live: boolean }>> {
  return DRIFT_SPOT_MARKETS.map(m => ({
    ...m,
    supplyApy: m.fallbackSupplyApy,
    borrowApy: m.fallbackBorrowApy,
    live: false,
  }));
}

