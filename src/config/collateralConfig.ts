export type TradeChain = "arbitrum" | "hyperliquid" | "lighter";

export interface CollateralRequirement {
  chain: TradeChain;
  balanceKey: string;
  token: string;
  tokenFullName: string;
  chainLabel: string;
  depositUrl: string;
}

const COLLATERAL_MAP: Record<TradeChain, CollateralRequirement> = {
  arbitrum: {
    chain: "arbitrum",
    balanceKey: "asterUsdt",
    token: "USDT",
    tokenFullName: "USDT in Aster account",
    chainLabel: "Aster",
    depositUrl: "",
  },
  hyperliquid: {
    chain: "hyperliquid",
    balanceKey: "hyperliquid",
    token: "USDC",
    tokenFullName: "USDC in Hyperliquid account",
    chainLabel: "Hyperliquid",
    depositUrl: "",
  },
  lighter: {
    chain: "lighter",
    balanceKey: "lighter",
    token: "USDC",
    tokenFullName: "USDC in Lighter account",
    chainLabel: "Lighter",
    depositUrl: "",
  },
};

export function getCollateralRequirement(chain: string): CollateralRequirement {
  return (COLLATERAL_MAP as Record<string, CollateralRequirement>)[chain] || COLLATERAL_MAP.arbitrum;
}
