export const FUSION_PLUS_API = "https://api.1inch.dev/fusion-plus";

const CMC = (id: number) => `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;

export type BridgeSrcToken = {
  symbol: string;
  address: string;
  decimals: number;
  logo: string;
  native?: boolean;
};

export type BridgeSrcChain = {
  key: "ethereum" | "arbitrum" | "base";
  label: string;
  shortLabel: string;
  chainId: number;
  logo: string;
  color: string;
  explorer: string;
  tokens: BridgeSrcToken[];
};

export const BRIDGE_SRC_CHAINS: BridgeSrcChain[] = [
  {
    key: "ethereum", label: "Ethereum", shortLabel: "ETH", chainId: 1,
    logo: CMC(1027), color: "#627EEA", explorer: "https://etherscan.io",
    tokens: [
      { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, logo: CMC(3408) },
      { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, logo: CMC(825) },
    ],
  },
  {
    key: "arbitrum", label: "Arbitrum", shortLabel: "ARB", chainId: 42161,
    logo: "/tokens/arb-chain.png", color: "#28A0F0", explorer: "https://arbiscan.io",
    tokens: [
      { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, logo: CMC(3408) },
      { symbol: "USDT", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, logo: CMC(825) },
    ],
  },
  {
    key: "base", label: "Base", shortLabel: "BASE", chainId: 8453,
    logo: "/chains/base.svg", color: "#0052FF", explorer: "https://basescan.org",
    tokens: [
      { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, logo: CMC(3408) },
    ],
  },
];

export const BRIDGE_ARB_DST_TOKENS: BridgeSrcToken[] = [
  { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, logo: CMC(3408) },
  { symbol: "USDT", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, logo: CMC(825) },
];

export const BRIDGE_CHAINS = [
  {
    key: "ethereum" as const,
    chainId: 1,
    label: "Ethereum",
    color: "#627EEA",
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    explorer: "https://etherscan.io",
    tokens: {
      USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
      USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
      ETH:  { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18, native: true },
    },
  },
  {
    key: "arbitrum" as const,
    chainId: 42161,
    label: "Arbitrum",
    color: "#28A0F0",
    logo: "/tokens/arb-chain.png",
    explorer: "https://arbiscan.io",
    tokens: {
      USDC: { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
      USDT: { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
      ETH:  { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18, native: true },
    },
  },
  {
    key: "base" as const,
    chainId: 8453,
    label: "Base",
    color: "#0052FF",
    logo: "/chains/base.svg",
    explorer: "https://basescan.org",
    tokens: {
      USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
      ETH:  { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18, native: true },
    },
  },
] as const;

export type BridgeChainKey = typeof BRIDGE_CHAINS[number]["key"];

export function getBridgeChain(key: string) {
  return BRIDGE_CHAINS.find(c => c.key === key);
}

export const FUSION_PLUS_SRC_CHAINS = new Set([1, 8453]);
export const FUSION_PLUS_DST_CHAIN = 42161;

export const HL_BRIDGE_CONTRACT = "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7";
export const USDC_ARBITRUM = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

export const ERC20_APPROVE_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

export const HL_BRIDGE_ABI = [
  "function sendUSDC(uint64 amount, address destination) payable",
];
