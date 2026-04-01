import { NextRequest, NextResponse } from "next/server";

const RPCS: Record<string, string> = {
  ethereum: "https://cloudflare-eth.com",
  base: "https://mainnet.base.org",
  bnb: "https://bsc-dataseed.binance.org",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  arbitrum: "https://arb1.arbitrum.io/rpc",
};

const TOKENS: Record<string, Record<"USDC" | "USDT", { address: string; decimals: number }>> = {
  ethereum: {
    USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  },
  base: {
    USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    USDT: { address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6 },
  },
  bnb: {
    USDC: { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
    USDT: { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
  },
  avalanche: {
    USDC: { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
    USDT: { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6 },
  },
  arbitrum: {
    USDC: { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
    USDT: { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
  },
};

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  base: 8453,
  bnb: 56,
  avalanche: 43114,
  arbitrum: 42161,
};

async function fetchTokenBalance(
  rpc: string,
  walletAddress: string,
  tokenAddress: string,
  decimals: number
): Promise<number> {
  try {
    const callData = `0x70a08231000000000000000000000000${walletAddress.slice(2).toLowerCase()}`;
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: tokenAddress, data: callData }, "latest"],
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    if (!json.result || json.result === "0x") return 0;
    return parseInt(json.result, 16) / Math.pow(10, decimals);
  } catch {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const results: Record<string, { USDC: number; USDT: number; total: number; chainId: number }> = {};

  await Promise.all(
    Object.entries(RPCS).map(async ([chain, rpc]) => {
      const chainTokens = TOKENS[chain];
      const [usdc, usdt] = await Promise.all([
        fetchTokenBalance(rpc, address, chainTokens.USDC.address, chainTokens.USDC.decimals),
        fetchTokenBalance(rpc, address, chainTokens.USDT.address, chainTokens.USDT.decimals),
      ]);
      results[chain] = {
        USDC: usdc,
        USDT: usdt,
        total: usdc + usdt,
        chainId: CHAIN_IDS[chain],
      };
    })
  );

  const srcChains = Object.entries(results)
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => b[1].total - a[1].total);

  const bestSrcChain = srcChains[0]?.[0] ?? null;

  return NextResponse.json({ chains: results, bestSrcChain });
}
