import { NextRequest, NextResponse } from "next/server";
import { resolveAsterCredentials } from "@server/asterCredentials";
import { getBalance } from "@server/asterService";

const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;

const ARB_RPC = ALCHEMY_KEY
  ? `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
  : "https://arb1.arbitrum.io/rpc";

const ARB_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const ARB_USDT = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";

const HL_INFO_URL = "https://api.hyperliquid.xyz/info";

async function fetchArbTokenBalance(evmAddress: string, tokenContract: string): Promise<number> {
  try {
    const data = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        {
          to: tokenContract,
          data: `0x70a08231000000000000000000000000${evmAddress.slice(2).toLowerCase()}`,
        },
        "latest",
      ],
    });

    const res = await fetch(ARB_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data,
    });

    if (!res.ok) return 0;
    const json = await res.json();
    if (!json.result || json.result === "0x") return 0;
    return parseInt(json.result, 16) / 1e6;
  } catch {
    return 0;
  }
}

async function fetchHlBalance(evmAddress: string): Promise<number> {
  try {
    const res = await fetch(HL_INFO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "clearinghouseState", user: evmAddress }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const withdrawable = parseFloat(data?.withdrawable || "0");
    const accountValue = parseFloat(data?.marginSummary?.accountValue || "0");
    return withdrawable > 0 ? withdrawable : accountValue;
  } catch {
    return 0;
  }
}

async function fetchAsterAccountBalance(evmAddress: string): Promise<number> {
  try {
    const creds = await resolveAsterCredentials(evmAddress);
    if (!creds) return 0;
    const raw = await getBalance(creds);
    const balances: { asset: string; crossWalletBalance?: string; balance?: string }[] = Array.isArray(raw) ? raw : [];
    const usdt = balances.find((b) => b.asset === "USDT" || b.asset === "USDC");
    return usdt ? parseFloat(usdt.crossWalletBalance || usdt.balance || "0") : 0;
  } catch {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  const arbAddress = req.nextUrl.searchParams.get("arbitrum");

  if (!arbAddress) {
    return NextResponse.json({ error: "Provide arbitrum address" }, { status: 400 });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(arbAddress)) {
    return NextResponse.json({ error: "Invalid Arbitrum address" }, { status: 400 });
  }

  const balances: Record<string, number> = {
    arbitrum: 0,
    arbitrumUsdc: 0,
    arbitrumUsdt: 0,
    asterUsdt: 0,
    hyperliquid: 0,
  };
  const tokenBalances: Record<string, Record<string, number>> = {
    arbitrum: { USDC: 0, USDT: 0 },
    aster: { USDT: 0 },
    hyperliquid: { USDC: 0 },
  };

  const fetches: Promise<void>[] = [];

  fetches.push((async () => {
    try {
      const [usdcBal, usdtBal] = await Promise.all([
        fetchArbTokenBalance(arbAddress, ARB_USDC),
        fetchArbTokenBalance(arbAddress, ARB_USDT),
      ]);
      tokenBalances.arbitrum.USDC = usdcBal;
      tokenBalances.arbitrum.USDT = usdtBal;
      balances.arbitrum = usdcBal;
      balances.arbitrumUsdc = usdcBal;
      balances.arbitrumUsdt = usdtBal;
    } catch (e) {
      console.error("Arbitrum balance scan error:", e);
    }
  })());

  fetches.push((async () => {
    try {
      const asterBal = await fetchAsterAccountBalance(arbAddress);
      tokenBalances.aster.USDT = asterBal;
      balances.asterUsdt = asterBal;
    } catch (e) {
      console.error("Aster account balance scan error:", e);
    }
  })());

  fetches.push((async () => {
    try {
      const hlBal = await fetchHlBalance(arbAddress);
      tokenBalances.hyperliquid.USDC = hlBal;
      balances.hyperliquid = hlBal;
    } catch (e) {
      console.error("Hyperliquid balance scan error:", e);
    }
  })());

  await Promise.all(fetches);

  const total = balances.asterUsdt + balances.hyperliquid;
  const fundedChains = (balances.asterUsdt > 5 ? 1 : 0) + (balances.hyperliquid > 5 ? 1 : 0);

  return NextResponse.json({ balances, tokenBalances, total, fundedChains });
}
