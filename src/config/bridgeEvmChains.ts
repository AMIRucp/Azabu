import { NetworkEnum } from "@1inch/cross-chain-sdk";

const CMC = (id: number) => `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;
export const NATIVE_EVM = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export type BridgeToken = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  native?: boolean;
};

export type BridgeEvmChain = {
  key: string;
  chainId: number;
  label: string;
  shortLabel: string;
  color: string;
  logo: string;
  explorer: string;
  fallbackTokens: BridgeToken[];
};

export const FUSION_PLUS_EVM_CHAIN_IDS: number[] = [
  NetworkEnum.ETHEREUM,
  NetworkEnum.POLYGON,
  NetworkEnum.BINANCE,
  NetworkEnum.OPTIMISM,
  NetworkEnum.ARBITRUM,
  NetworkEnum.AVALANCHE,
  NetworkEnum.GNOSIS,
  NetworkEnum.COINBASE,
  NetworkEnum.ZKSYNC,
  NetworkEnum.LINEA,
  NetworkEnum.SONIC,
  NetworkEnum.UNICHAIN,
];

const USDC_ETH = { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, logoURI: CMC(3408) };
const USDT_ETH = { symbol: "USDT", name: "Tether", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, logoURI: CMC(825) };
const ETH = { symbol: "ETH", name: "Ethereum", address: NATIVE_EVM, decimals: 18, logoURI: CMC(1027), native: true };

const USDC_ARB = { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, logoURI: CMC(3408) };
const USDT_ARB = { symbol: "USDT", name: "Tether", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, logoURI: CMC(825) };

export const BRIDGE_EVM_CHAINS: BridgeEvmChain[] = [
  {
    key: "ethereum",
    chainId: NetworkEnum.ETHEREUM,
    label: "Ethereum",
    shortLabel: "ETH",
    color: "#627EEA",
    logo: CMC(1027),
    explorer: "https://etherscan.io",
    fallbackTokens: [ETH, USDC_ETH, USDT_ETH],
  },
  {
    key: "arbitrum",
    chainId: NetworkEnum.ARBITRUM,
    label: "Arbitrum",
    shortLabel: "ARB",
    color: "#28A0F0",
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png",
    explorer: "https://arbiscan.io",
    fallbackTokens: [ETH, USDC_ARB, USDT_ARB],
  },
  {
    key: "base",
    chainId: NetworkEnum.COINBASE,
    label: "Base",
    shortLabel: "BASE",
    color: "#0052FF",
    logo: "/chains/base.svg",
    explorer: "https://basescan.org",
    fallbackTokens: [
      ETH,
      { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, logoURI: CMC(3408) },
    ],
  },
  {
    key: "polygon",
    chainId: NetworkEnum.POLYGON,
    label: "Polygon",
    shortLabel: "POL",
    color: "#8247E5",
    logo: CMC(3890),
    explorer: "https://polygonscan.com",
    fallbackTokens: [
      { symbol: "POL", name: "Polygon", address: NATIVE_EVM, decimals: 18, logoURI: CMC(3890), native: true },
      { symbol: "USDT", name: "Tether", address: "0xc2132D05D31c914a87C6611C10748AEb04B58a8F", decimals: 6, logoURI: CMC(825) },
      { symbol: "USDC", name: "USD Coin", address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6, logoURI: CMC(3408) },
    ],
  },
  {
    key: "bsc",
    chainId: NetworkEnum.BINANCE,
    label: "BNB Chain",
    shortLabel: "BSC",
    color: "#F0B90B",
    logo: CMC(1839),
    explorer: "https://bscscan.com",
    fallbackTokens: [
      { symbol: "BNB", name: "BNB", address: NATIVE_EVM, decimals: 18, logoURI: CMC(1839), native: true },
      { symbol: "USDT", name: "Tether", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, logoURI: CMC(825) },
      { symbol: "USDC", name: "USD Coin", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18, logoURI: CMC(3408) },
    ],
  },
  {
    key: "optimism",
    chainId: NetworkEnum.OPTIMISM,
    label: "Optimism",
    shortLabel: "OP",
    color: "#FF0420",
    logo: CMC(11840),
    explorer: "https://optimistic.etherscan.io",
    fallbackTokens: [
      ETH,
      { symbol: "USDC", name: "USD Coin", address: "0x0b2C639c533813c4AaB4b6850f1Ee1e3E1c9f3C5", decimals: 6, logoURI: CMC(3408) },
      { symbol: "USDT", name: "Tether", address: "0x94b008aA0059cDE0554BF00C0fF1fC2870ff207c", decimals: 6, logoURI: CMC(825) },
    ],
  },
  {
    key: "avalanche",
    chainId: NetworkEnum.AVALANCHE,
    label: "Avalanche",
    shortLabel: "AVAX",
    color: "#E84142",
    logo: CMC(5805),
    explorer: "https://snowtrace.io",
    fallbackTokens: [
      { symbol: "AVAX", name: "Avalanche", address: NATIVE_EVM, decimals: 18, logoURI: CMC(5805), native: true },
      { symbol: "USDC", name: "USD Coin", address: "0xB97EF9Ef8734C71904D8002FA8b19667e4218e8e", decimals: 6, logoURI: CMC(3408) },
      { symbol: "USDT", name: "Tether", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4eBF96A8", decimals: 6, logoURI: CMC(825) },
    ],
  },
  {
    key: "gnosis",
    chainId: NetworkEnum.GNOSIS,
    label: "Gnosis",
    shortLabel: "GNO",
    color: "#04795B",
    logo: CMC(1659),
    explorer: "https://gnosisscan.io",
    fallbackTokens: [
      { symbol: "xDAI", name: "xDAI", address: NATIVE_EVM, decimals: 18, logoURI: CMC(1659), native: true },
      { symbol: "USDC", name: "USD Coin", address: "0xDDAfbb505ad214D7447A94A11e1A2B30cCF1c6C", decimals: 6, logoURI: CMC(3408) },
    ],
  },
  {
    key: "zksync",
    chainId: NetworkEnum.ZKSYNC,
    label: "zkSync Era",
    shortLabel: "ZK",
    color: "#8C8DFC",
    logo: CMC(24091),
    explorer: "https://explorer.zksync.io",
    fallbackTokens: [ETH, USDC_ARB],
  },
  {
    key: "linea",
    chainId: NetworkEnum.LINEA,
    label: "Linea",
    shortLabel: "LINEA",
    color: "#61DFFF",
    logo: CMC(27657),
    explorer: "https://lineascan.build",
    fallbackTokens: [ETH, USDC_ARB],
  },
  {
    key: "sonic",
    chainId: NetworkEnum.SONIC,
    label: "Sonic",
    shortLabel: "S",
    color: "#1C1C1C",
    logo: CMC(32684),
    explorer: "https://sonicscan.org",
    fallbackTokens: [
      { symbol: "S", name: "Sonic", address: NATIVE_EVM, decimals: 18, logoURI: CMC(32684), native: true },
      { symbol: "USDC", name: "USD Coin", address: "0x29219dd400f2BfDdE2F5a51dC6D9f8C5d0c8d8d8d", decimals: 6, logoURI: CMC(3408) },
    ],
  },
  {
    key: "unichain",
    chainId: NetworkEnum.UNICHAIN,
    label: "Unichain",
    shortLabel: "UNI",
    color: "#FF007A",
    logo: CMC(7083),
    explorer: "https://uniscan.xyz",
    fallbackTokens: [ETH, USDC_ARB],
  },
];

export function getBridgeEvmChain(chainId: number): BridgeEvmChain | undefined {
  return BRIDGE_EVM_CHAINS.find((c) => c.chainId === chainId);
}

export function getBridgeEvmChainByKey(key: string): BridgeEvmChain | undefined {
  return BRIDGE_EVM_CHAINS.find((c) => c.key === key);
}

export function isFusionPlusEvmChain(chainId: number): boolean {
  return FUSION_PLUS_EVM_CHAIN_IDS.includes(chainId);
}
