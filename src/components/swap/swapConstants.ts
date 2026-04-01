"use client";

export const MONO = "'JetBrains Mono', monospace";
export const SANS = "'Inter', system-ui, sans-serif";

export const SLIPPAGE_PRESETS = [0.1, 0.3, 0.5, 1.0, 2.0];

export interface TokenState {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

const CMC_ICON_EVM = (id: number) => `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;
const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const SWAP_CHAINS = [
  {
    key: "ethereum" as const,
    label: "Ethereum",
    shortLabel: "ETH",
    chainId: 1,
    color: "#627EEA",
    logo: "/tokens/ethereum.png",
    explorer: "https://etherscan.io",
  },
  {
    key: "arbitrum" as const,
    label: "Arbitrum",
    shortLabel: "ARB",
    chainId: 42161,
    color: "#28A0F0",
    logo: "/tokens/arb.webp",
    explorer: "https://arbiscan.io",
  },
  {
    key: "base" as const,
    label: "Base",
    shortLabel: "BASE",
    chainId: 8453,
    color: "#0052FF",
    logo: "/chains/base.svg",
    explorer: "https://basescan.org",
  },
] as const;

export type SwapChainKey = typeof SWAP_CHAINS[number]["key"];

export const CHAINS = [
  { key: "arbitrum", label: "Arbitrum", color: "#28A0F0", engine: "1inch" },
] as const;

export type ChainKey = typeof CHAINS[number]["key"];

export const ETH_TOKENS: TokenState[] = [
  { symbol: "ETH",   name: "Ethereum",        address: NATIVE_ETH,                                        decimals: 18, logoURI: CMC_ICON_EVM(1027) },
  { symbol: "USDC",  name: "USD Coin",         address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",    decimals: 6,  logoURI: CMC_ICON_EVM(3408) },
  { symbol: "USDT",  name: "Tether",           address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",    decimals: 6,  logoURI: CMC_ICON_EVM(825)  },
  { symbol: "WBTC",  name: "Wrapped Bitcoin",  address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",    decimals: 8,  logoURI: CMC_ICON_EVM(1)    },
  { symbol: "WETH",  name: "Wrapped Ether",    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",    decimals: 18, logoURI: CMC_ICON_EVM(1027) },
  { symbol: "DAI",   name: "Dai",              address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",    decimals: 18, logoURI: CMC_ICON_EVM(4943) },
  { symbol: "UNI",   name: "Uniswap",          address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",    decimals: 18, logoURI: CMC_ICON_EVM(7083) },
  { symbol: "LINK",  name: "Chainlink",        address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",    decimals: 18, logoURI: CMC_ICON_EVM(1975) },
  { symbol: "AAVE",  name: "Aave",             address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",    decimals: 18, logoURI: CMC_ICON_EVM(7278) },
  { symbol: "MKR",   name: "Maker",            address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",    decimals: 18, logoURI: CMC_ICON_EVM(1518) },
  { symbol: "CRV",   name: "Curve DAO",        address: "0xD533a949740bb3306d119CC777fa900bA034cd52",    decimals: 18, logoURI: CMC_ICON_EVM(6538) },
  { symbol: "LDO",   name: "Lido DAO",         address: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",    decimals: 18, logoURI: CMC_ICON_EVM(8000) },
  { symbol: "PEPE",  name: "Pepe",             address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",    decimals: 18, logoURI: CMC_ICON_EVM(24478) },
  { symbol: "stETH", name: "Lido Staked ETH",  address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",    decimals: 18, logoURI: CMC_ICON_EVM(8085) },
  { symbol: "SHIB",  name: "Shiba Inu",        address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",    decimals: 18, logoURI: CMC_ICON_EVM(5994) },
];

export const ARB_TOKENS: TokenState[] = [
  { symbol: "ETH",    name: "Ethereum",         address: NATIVE_ETH,                                        decimals: 18, logoURI: CMC_ICON_EVM(1027)  },
  { symbol: "USDC",   name: "USD Coin",          address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",    decimals: 6,  logoURI: CMC_ICON_EVM(3408)  },
  { symbol: "USDT",   name: "Tether",            address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",    decimals: 6,  logoURI: CMC_ICON_EVM(825)   },
  { symbol: "ARB",    name: "Arbitrum",          address: "0x912CE59144191C1204E64559FE8253a0e49E6548",    decimals: 18, logoURI: CMC_ICON_EVM(11841) },
  { symbol: "WBTC",   name: "Wrapped Bitcoin",   address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",    decimals: 8,  logoURI: CMC_ICON_EVM(1)     },
  { symbol: "WETH",   name: "Wrapped Ether",     address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",    decimals: 18, logoURI: CMC_ICON_EVM(1027)  },
  { symbol: "LINK",   name: "Chainlink",         address: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",    decimals: 18, logoURI: CMC_ICON_EVM(1975)  },
  { symbol: "UNI",    name: "Uniswap",           address: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",    decimals: 18, logoURI: CMC_ICON_EVM(7083)  },
  { symbol: "AAVE",   name: "Aave",              address: "0xba5DdD1f9d7F570dc94a51479a000E3BCE967196",    decimals: 18, logoURI: CMC_ICON_EVM(7278)  },
  { symbol: "DAI",    name: "Dai",               address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",    decimals: 18, logoURI: CMC_ICON_EVM(4943)  },
  { symbol: "PENDLE", name: "Pendle",            address: "0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8",    decimals: 18, logoURI: CMC_ICON_EVM(16929) },
  { symbol: "PEPE",   name: "Pepe",              address: "0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00",    decimals: 18, logoURI: CMC_ICON_EVM(24478) },
  { symbol: "GNS",    name: "Gains Network",     address: "0x18c11FD286C5EC11c3b683Caa813B77f5163A122",    decimals: 18, logoURI: CMC_ICON_EVM(13663) },
  { symbol: "RDNT",   name: "Radiant Capital",   address: "0x3082CC23568eA640225c2467653dB90e9250AaA0",    decimals: 18, logoURI: CMC_ICON_EVM(23790) },
  { symbol: "MAGIC",  name: "Magic",             address: "0x539bdE0d7Dbd336b79148AA742883198BBF60342",    decimals: 18, logoURI: CMC_ICON_EVM(14783) },
  { symbol: "GRAIL",  name: "Camelot",           address: "0x3d9907F9a368ad0a51Be60f7Da3b97cf940982D8",    decimals: 18, logoURI: CMC_ICON_EVM(23191) },
  { symbol: "STG",    name: "Stargate Finance",  address: "0x6694340fc020c5E6B96567843da2df01b2CE1eb6",    decimals: 18, logoURI: CMC_ICON_EVM(18934) },
  { symbol: "SUSHI",  name: "SushiSwap",         address: "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A",    decimals: 18, logoURI: CMC_ICON_EVM(6758)  },
  { symbol: "CRV",    name: "Curve DAO",         address: "0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978",    decimals: 18, logoURI: CMC_ICON_EVM(6538)  },
  { symbol: "LDO",    name: "Lido DAO",          address: "0x13Ad51ed4F1B7e9Dc168d8a00cB3f4dDD85EfA60",    decimals: 18, logoURI: CMC_ICON_EVM(8000)  },
  { symbol: "GRT",    name: "The Graph",         address: "0x9623063377AD1B27544C965cCd7342f7EA7e88C7",    decimals: 18, logoURI: CMC_ICON_EVM(6719)  },
  { symbol: "MKR",    name: "Maker",             address: "0x2e9a6Df78E42a30712c10a9Dc4b1C8656f8F2879",    decimals: 18, logoURI: CMC_ICON_EVM(1518)  },
];

export const BASE_TOKENS: TokenState[] = [
  { symbol: "ETH",   name: "Ethereum",        address: NATIVE_ETH,                                        decimals: 18, logoURI: CMC_ICON_EVM(1027) },
  { symbol: "USDC",  name: "USD Coin",         address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",    decimals: 6,  logoURI: CMC_ICON_EVM(3408) },
  { symbol: "WETH",  name: "Wrapped Ether",    address: "0x4200000000000000000000000000000000000006",    decimals: 18, logoURI: CMC_ICON_EVM(1027) },
  { symbol: "DAI",   name: "Dai",              address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",    decimals: 18, logoURI: CMC_ICON_EVM(4943) },
  { symbol: "cbETH", name: "Coinbase Staked ETH", address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", decimals: 18, logoURI: CMC_ICON_EVM(21535) },
  { symbol: "AERO",  name: "Aerodrome",        address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",    decimals: 18, logoURI: CMC_ICON_EVM(29270) },
  { symbol: "DEGEN", name: "Degen",            address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",    decimals: 18, logoURI: CMC_ICON_EVM(30096) },
  { symbol: "BRETT", name: "Brett",             address: "0x532f27101965dd16442E59d40670FaF5eBB142E4",    decimals: 18, logoURI: CMC_ICON_EVM(31407) },
  { symbol: "TOSHI", name: "Toshi",            address: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4",    decimals: 18, logoURI: CMC_ICON_EVM(29559) },
];

export const POPULAR_TOKENS: TokenState[] = [
  { symbol: "ETH",  name: "Ethereum",        address: NATIVE_ETH,                                             decimals: 18, logoURI: CMC_ICON_EVM(1027) },
  { symbol: "USDC", name: "USD Coin",         address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",          decimals: 6,  logoURI: CMC_ICON_EVM(3408) },
  { symbol: "USDT", name: "Tether",           address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",          decimals: 6,  logoURI: CMC_ICON_EVM(825)  },
  { symbol: "ARB",  name: "Arbitrum",         address: "0x912CE59144191C1204E64559FE8253a0e49E6548",          decimals: 18, logoURI: CMC_ICON_EVM(11841) },
  { symbol: "WBTC", name: "Wrapped Bitcoin",  address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",          decimals: 8,  logoURI: CMC_ICON_EVM(1) },
  { symbol: "WETH", name: "Wrapped Ether",    address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",          decimals: 18, logoURI: CMC_ICON_EVM(1027) },
];
