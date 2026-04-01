import { NextRequest, NextResponse } from "next/server";
import { getBalance } from "@server/asterService";
import { resolveAsterCredentials } from "@server/asterCredentials";

const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;
const ARB_RPC = ALCHEMY_KEY
  ? `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
  : "https://arb1.arbitrum.io/rpc";
const ETH_RPC = ALCHEMY_KEY
  ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
  : "https://eth.llamarpc.com";


let priceCache: { prices: Record<string, number>; ts: number } = { prices: {}, ts: 0 };
const PRICE_TTL = 60_000;

async function getPrices(): Promise<Record<string, number>> {
  if (Date.now() - priceCache.ts < PRICE_TTL && Object.keys(priceCache.prices).length > 0) {
    return priceCache.prices;
  }
  const ids = "bitcoin,ethereum,binancecoin,usd-coin,tether,arbitrum";
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      const map: Record<string, number> = {};
      const changeMap: Record<string, number> = {};
      const idMap: Record<string, string[]> = {
        bitcoin: ["BTC", "WBTC"], ethereum: ["ETH", "WETH"],
        binancecoin: ["BNB"], "usd-coin": ["USDC"], tether: ["USDT"],
        arbitrum: ["ARB"],
      };
      for (const [cgId, syms] of Object.entries(idMap)) {
        if (data[cgId]?.usd) {
          for (const s of syms) {
            map[s] = data[cgId].usd;
            changeMap[s] = data[cgId].usd_24h_change || 0;
          }
        }
      }
      map["USDC"] = 1; map["USDT"] = 1;
      priceCache = { prices: map, ts: Date.now() };
      (priceCache as any).changes = changeMap;
      return map;
    }
  } catch (e) { console.error("Price fetch error:", e); }
  if (Object.keys(priceCache.prices).length > 0) return priceCache.prices;
  return { ETH: 2500, BNB: 600, BTC: 90000, USDC: 1, USDT: 1, ARB: 0.5 };
}

function getChange(symbol: string): number {
  return ((priceCache as any).changes || {})[symbol] || 0;
}

const HL_INFO_URL = "https://api.hyperliquid.xyz/info";

export interface WalletToken {
  asset: string;
  chain: "Arbitrum" | "Ethereum" | "Hyperliquid";
  amount: number;
  price: number;
  valueUsd: number;
  change24h: number;
}

export interface ProtocolDeposit {
  protocol: string;
  chain: "Arbitrum" | "Ethereum" | "Hyperliquid";
  asset: string;
  totalDeposited: number;
  free: number;
  locked: number;
  utilizationPct: number;
  connected: boolean;
}

async function fetchArbitrumWalletTokens(evmAddress: string): Promise<WalletToken[]> {
  const results: WalletToken[] = [];
  const prices = await getPrices();

  const ARB_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
  const ARB_USDT = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
  const ARB_TOKEN = "0x912CE59144191C1204E64559FE8253a0e49E6548";

  async function erc20Balance(token: string, decimals: number): Promise<number> {
    try {
      const res = await fetch(ARB_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1, method: "eth_call",
          params: [{ to: token, data: `0x70a08231000000000000000000000000${evmAddress.slice(2).toLowerCase()}` }, "latest"],
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return 0;
      const json = await res.json();
      if (!json.result || json.result === "0x") return 0;
      return parseInt(json.result, 16) / Math.pow(10, decimals);
    } catch { return 0; }
  }

  try {
    const ethRes = await fetch(ARB_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_getBalance",
        params: [evmAddress, "latest"],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (ethRes.ok) {
      const json = await ethRes.json();
      const ethAmount = parseInt(json.result || "0", 16) / 1e18;
      if (ethAmount > 0.00001) {
        results.push({
          asset: "ETH", chain: "Arbitrum", amount: ethAmount,
          price: prices["ETH"] || 0, valueUsd: ethAmount * (prices["ETH"] || 0),
          change24h: getChange("ETH"),
        });
      }
    }
  } catch {}

  const [usdcBal, usdtBal, arbBal] = await Promise.all([
    erc20Balance(ARB_USDC, 6),
    erc20Balance(ARB_USDT, 6),
    erc20Balance(ARB_TOKEN, 18),
  ]);

  if (usdcBal > 0.01) results.push({
    asset: "USDC", chain: "Arbitrum", amount: usdcBal,
    price: 1, valueUsd: usdcBal, change24h: 0,
  });
  if (usdtBal > 0.01) results.push({
    asset: "USDT", chain: "Arbitrum", amount: usdtBal,
    price: 1, valueUsd: usdtBal, change24h: 0,
  });
  if (arbBal > 0.01) {
    const arbPrice = prices["ARB"] || 0;
    results.push({
      asset: "ARB", chain: "Arbitrum", amount: arbBal,
      price: arbPrice, valueUsd: arbBal * arbPrice, change24h: getChange("ARB"),
    });
  }
  return results;
}


async function fetchEthereumWalletTokens(evmAddress: string): Promise<WalletToken[]> {
  const results: WalletToken[] = [];
  const prices = await getPrices();

  const ETH_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const ETH_USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

  async function erc20Balance(token: string, decimals: number): Promise<number> {
    try {
      const res = await fetch(ETH_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1, method: "eth_call",
          params: [{ to: token, data: `0x70a08231000000000000000000000000${evmAddress.slice(2).toLowerCase()}` }, "latest"],
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return 0;
      const json = await res.json();
      if (!json.result || json.result === "0x") return 0;
      return parseInt(json.result, 16) / Math.pow(10, decimals);
    } catch { return 0; }
  }

  try {
    const ethRes = await fetch(ETH_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [evmAddress, "latest"] }),
      signal: AbortSignal.timeout(8000),
    });
    if (ethRes.ok) {
      const json = await ethRes.json();
      const ethAmount = parseInt(json.result || "0", 16) / 1e18;
      if (ethAmount > 0.00001) {
        results.push({ asset: "ETH", chain: "Ethereum", amount: ethAmount,
          price: prices["ETH"] || 0, valueUsd: ethAmount * (prices["ETH"] || 0), change24h: getChange("ETH") });
      }
    }
  } catch {}

  const [usdcBal, usdtBal] = await Promise.all([
    erc20Balance(ETH_USDC, 6),
    erc20Balance(ETH_USDT, 6),
  ]);
  if (usdcBal > 0.01) results.push({ asset: "USDC", chain: "Ethereum", amount: usdcBal, price: 1, valueUsd: usdcBal, change24h: 0 });
  if (usdtBal > 0.01) results.push({ asset: "USDT", chain: "Ethereum", amount: usdtBal, price: 1, valueUsd: usdtBal, change24h: 0 });
  return results;
}

async function fetchHyperliquidDeposit(evmAddress: string): Promise<ProtocolDeposit | null> {
  if (!evmAddress) return null;
  try {
    const res = await fetch(HL_INFO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "clearinghouseState", user: evmAddress }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const accountValue = parseFloat(data?.marginSummary?.accountValue || "0");
    const totalMarginUsed = parseFloat(data?.marginSummary?.totalMarginUsed || "0");
    const withdrawable = parseFloat(data?.withdrawable || "0");
    if (accountValue <= 0) return null;
    const free = withdrawable > 0 ? withdrawable : accountValue - totalMarginUsed;
    return {
      protocol: "Hyperliquid",
      chain: "Hyperliquid",
      asset: "USDC",
      totalDeposited: accountValue,
      free: Math.max(0, free),
      locked: totalMarginUsed,
      utilizationPct: accountValue > 0 ? (totalMarginUsed / accountValue) * 100 : 0,
      connected: true,
    };
  } catch (e) {
    console.error("[Portfolio] Hyperliquid deposit error:", e);
    return null;
  }
}

async function fetchAsterDeposit(evmAddress: string): Promise<ProtocolDeposit | null> {
  if (!evmAddress) return null;
  try {
    const creds = await resolveAsterCredentials(evmAddress);
    if (!creds) return null;
    const balances = await getBalance(creds);
    const balanceArr = Array.isArray(balances) ? balances : [];
    const usdtEntry = balanceArr.find((b: any) => b.asset === "USDT");
    if (!usdtEntry) return null;
    const total = parseFloat(usdtEntry.balance || "0");
    const free = parseFloat(usdtEntry.availableBalance || usdtEntry.withdrawAvailable || "0");
    const locked = total - free;
    if (total <= 0) return { protocol: "Aster", chain: "Arbitrum", asset: "USDT", totalDeposited: 0, free: 0, locked: 0, utilizationPct: 0, connected: true };
    return {
      protocol: "Aster", chain: "Arbitrum", asset: "USDT",
      totalDeposited: total, free, locked,
      utilizationPct: total > 0 ? (locked / total) * 100 : 0,
      connected: true,
    };
  } catch (e) {
    console.error("[Portfolio] Aster deposit error:", e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const evmWallet = request.nextUrl.searchParams.get("evm") || "";

  if (evmWallet && !/^0x[a-fA-F0-9]{40}$/.test(evmWallet)) {
    return NextResponse.json({ error: "Invalid EVM wallet address" }, { status: 400 });
  }

  const walletTokens: WalletToken[] = [];
  const deposits: ProtocolDeposit[] = [];
  const sourceStatus: Record<string, "ok" | "error" | "not_connected"> = {};

  const fetches: Promise<void>[] = [];

  if (evmWallet) {
    fetches.push(
      fetchArbitrumWalletTokens(evmWallet)
        .then(tokens => { walletTokens.push(...tokens); sourceStatus["arbitrum-wallet"] = "ok"; })
        .catch(e => { console.error("[Portfolio] Arbitrum wallet:", e); sourceStatus["arbitrum-wallet"] = "error"; })
    );
    fetches.push(
      fetchEthereumWalletTokens(evmWallet)
        .then(tokens => { walletTokens.push(...tokens); sourceStatus["ethereum-wallet"] = "ok"; })
        .catch(e => { console.error("[Portfolio] Ethereum wallet:", e); sourceStatus["ethereum-wallet"] = "error"; })
    );
    fetches.push(
      fetchAsterDeposit(evmWallet)
        .then(dep => {
          if (dep) deposits.push(dep);
          sourceStatus["aster"] = dep ? "ok" : "not_connected";
        })
        .catch(e => { console.error("[Portfolio] Aster:", e); sourceStatus["aster"] = "error"; })
    );
    fetches.push(
      fetchHyperliquidDeposit(evmWallet)
        .then(dep => {
          if (dep) deposits.push(dep);
          sourceStatus["hyperliquid"] = dep ? "ok" : "not_connected";
        })
        .catch(e => { console.error("[Portfolio] Hyperliquid:", e); sourceStatus["hyperliquid"] = "error"; })
    );
  }

  if (!evmWallet) {
    sourceStatus["aster"] = "not_connected";
    sourceStatus["hyperliquid"] = "not_connected";
  }

  await Promise.allSettled(fetches);

  const walletBalance = walletTokens.reduce((s, t) => s + t.valueUsd, 0);
  const protocolDepositsTotal = deposits.reduce((s, d) => s + d.totalDeposited, 0);
  const freeMargin = deposits.reduce((s, d) => s + d.free, 0);
  const usedCollateral = deposits.reduce((s, d) => s + d.locked, 0);
  const availableFunds = walletBalance + freeMargin;
  const totalNetWorth = walletBalance + protocolDepositsTotal;

  walletTokens.sort((a, b) => b.valueUsd - a.valueUsd);

  return NextResponse.json(
    {
      walletBalance,
      protocolDeposits: protocolDepositsTotal,
      freeMargin,
      usedCollateral,
      availableFunds,
      totalNetWorth,
      walletTokens,
      deposits,
      sourceStatus,
      partialFailure: Object.values(sourceStatus).some(s => s === "error"),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
