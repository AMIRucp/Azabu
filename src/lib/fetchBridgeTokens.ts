import type { BridgeToken } from "@/config/bridgeEvmChains";
import { BRIDGE_EVM_CHAINS, getBridgeEvmChain } from "@/config/bridgeEvmChains";
import { normalizeOneInchTokenMap } from "@/lib/oneinchTokenList";

const POPULAR_SYMBOLS = new Set([
  "USDC",
  "USDT",
  "ETH",
  "WETH",
  "BNB",
  "WBNB",
  "POL",
  "WMATIC",
  "AVAX",
  "WAVAX",
]);

function sortTokens(list: BridgeToken[]): BridgeToken[] {
  return [...list].sort((a, b) => {
    const rank = (s: string) => (POPULAR_SYMBOLS.has(s) ? 0 : 1);
    const d = rank(a.symbol) - rank(b.symbol);
    return d !== 0 ? d : a.symbol.localeCompare(b.symbol);
  });
}

function parseTokenResponse(data: {
  tokens?: unknown;
  source?: string;
}): BridgeToken[] {
  const raw = data?.tokens ?? data;
  const map = normalizeOneInchTokenMap({ tokens: raw });
  return Object.values(map).filter((t) => t.symbol && t.address);
}

export async function fetchBridgeTokensForChain(chainId: number): Promise<BridgeToken[]> {
  const chain = getBridgeEvmChain(chainId);
  const fallback = chain?.fallbackTokens ?? [];

  try {
    const res = await fetch(`/api/bridge/tokens?chainId=${chainId}`, { cache: "no-store" });
    if (!res.ok) return fallback;

    const data = await res.json();
    const list = parseTokenResponse(data);

    if (list.length === 0) return fallback;
    if (data.source === "fallback" && list.length <= fallback.length) return fallback;
    return sortTokens(list);
  } catch {
    return fallback;
  }
}


export async function prefetchAllBridgeTokens(): Promise<Record<number, BridgeToken[]>> {
  try {
    await fetch("/api/bridge/tokens?warm=1", { cache: "no-store" });
  } catch {
  }

  const entries = await Promise.all(
    BRIDGE_EVM_CHAINS.map(async (chain) => {
      const list = await fetchBridgeTokensForChain(chain.chainId);
      return [chain.chainId, list] as const;
    }),
  );

  return Object.fromEntries(entries);
}
