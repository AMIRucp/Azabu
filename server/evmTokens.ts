export interface EvmToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  coingeckoSlug?: string;
}

const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const EVM_TOKENS: Record<string, EvmToken> = {
  ETH: { symbol: "ETH", name: "Ethereum", address: NATIVE_ETH, decimals: 18, coingeckoSlug: "ethereum" },
  WETH: { symbol: "WETH", name: "Wrapped Ether", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18, coingeckoSlug: "weth" },
  USDC: { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, coingeckoSlug: "usd-coin" },
  "USDC.e": { symbol: "USDC.e", name: "Bridged USDC", address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", decimals: 6 },
  USDT: { symbol: "USDT", name: "Tether", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, coingeckoSlug: "tether" },
  DAI: { symbol: "DAI", name: "Dai", address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18, coingeckoSlug: "dai" },
  ARB: { symbol: "ARB", name: "Arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18, coingeckoSlug: "arbitrum" },
  WBTC: { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", decimals: 8, coingeckoSlug: "wrapped-bitcoin" },
  LINK: { symbol: "LINK", name: "Chainlink", address: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4", decimals: 18, coingeckoSlug: "chainlink" },
  UNI: { symbol: "UNI", name: "Uniswap", address: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0", decimals: 18, coingeckoSlug: "uniswap" },
  AAVE: { symbol: "AAVE", name: "Aave", address: "0xba5DdD1f9d7F570dc94a51479a000E3BCE967196", decimals: 18, coingeckoSlug: "aave" },
  GMX: { symbol: "GMX", name: "GMX", address: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", decimals: 18, coingeckoSlug: "gmx" },
  PENDLE: { symbol: "PENDLE", name: "Pendle", address: "0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8", decimals: 18, coingeckoSlug: "pendle" },
  CRV: { symbol: "CRV", name: "Curve DAO", address: "0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978", decimals: 18, coingeckoSlug: "curve-dao-token" },
  LDO: { symbol: "LDO", name: "Lido DAO", address: "0x13Ad51ed4F1B7e9Dc168d8a00cB3f4dDD85EfA60", decimals: 18, coingeckoSlug: "lido-dao" },
  GRT: { symbol: "GRT", name: "The Graph", address: "0x9623063377AD1B27544C965cCd7342f7EA7e88C7", decimals: 18 },
  RDNT: { symbol: "RDNT", name: "Radiant", address: "0x3082CC23568eA640225c2467653dB90e9250AaA0", decimals: 18 },
  MAGIC: { symbol: "MAGIC", name: "Magic", address: "0x539bdE0d7Dbd336b79148AA742883198BBF60342", decimals: 18 },
};

const EVM_ALIASES: Record<string, string> = {
  eth: "ETH", ether: "ETH", ethereum: "ETH",
  weth: "WETH",
  usdc: "USDC", "usd coin": "USDC",
  usdt: "USDT", tether: "USDT",
  dai: "DAI",
  arb: "ARB", arbitrum: "ARB",
  wbtc: "WBTC", bitcoin: "WBTC", btc: "WBTC",
  link: "LINK", chainlink: "LINK",
  uni: "UNI", uniswap: "UNI",
  aave: "AAVE",
  gmx: "GMX",
  pendle: "PENDLE",
  crv: "CRV", curve: "CRV",
  ldo: "LDO", lido: "LDO",
  grt: "GRT",
  rdnt: "RDNT", radiant: "RDNT",
  magic: "MAGIC",
};

const EVM_ONLY_SYMBOLS = new Set([
  "ARB", "LINK", "UNI", "AAVE", "GMX", "PENDLE", "CRV", "LDO", "GRT", "RDNT", "MAGIC", "DAI", "WETH",
]);

export function resolveEvmToken(input: string): EvmToken | null {
  const lower = input.toLowerCase().trim();
  const symbol = EVM_ALIASES[lower] || input.toUpperCase();
  return EVM_TOKENS[symbol] || null;
}

export function isEvmSwap(fromSymbol: string, toSymbol: string, activeChain?: string): boolean {
  if (activeChain === 'evm') return true;

  const fromUpper = fromSymbol.toUpperCase();
  const toUpper = toSymbol.toUpperCase();

  if (EVM_ONLY_SYMBOLS.has(fromUpper) || EVM_ONLY_SYMBOLS.has(toUpper)) return true;

  const fromLower = fromSymbol.toLowerCase();
  const toLower = toSymbol.toLowerCase();
  if (fromLower === "eth" || toLower === "eth") return true;
  if (fromLower === "ether" || toLower === "ether") return true;

  return false;
}
