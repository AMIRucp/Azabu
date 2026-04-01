export const SOLANA_TOKEN_MINTS: Record<string, string> = {
  SOL:   'So11111111111111111111111111111111111111112',
  USDC:  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT:  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  JUP:   'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  JTO:   'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  BONK:  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF:   'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  RAY:   '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA:  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  KMNO:  'KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS',
  DRIFT: 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH',
  PYTH:  'HZ1JovNiVvGrGs1DaYCLXaqCGXPJ2eiJNSrqsWu82wNZ',
  PNUT:  '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump',
  FARTCOIN: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
  WEN:   'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk',
  POPCAT:'7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
  MOTHER:'3S8qX1MsMqRbiwKg2cQyx7nis1oHMgaCuc9c4VfvVdPN',
  MOODENG:'ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzc8We',
  NEKO:  '5iGjUQkzB1EgU5sqC3zr5Vk7Ywt6HAnfnJHKzVsGnhp',
};

export const ETHEREUM_TOKEN_ADDRESSES: Record<string, { address?: string; decimals: number; native?: boolean }> = {
  ETH:  { native: true, decimals: 18 },
  USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
  WBTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
};

export const ARBITRUM_TOKEN_ADDRESSES: Record<string, { address?: string; decimals: number; native?: boolean }> = {
  ETH:  { native: true, decimals: 18 },
  USDC: { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
  USDT: { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
  ARB:  { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
  WBTC: { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8 },
  WETH: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
  LINK: { address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18 },
  UNI:  { address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', decimals: 18 },
};

export const HYPERLIQUID_TOKEN_ADDRESSES: Record<string, { address?: string; decimals: number; native?: boolean }> = {
  HYPE: { native: true, decimals: 18 },
  USDC: { address: '0x6d1e7cDE53ba9467B783CB7c530ce054', decimals: 6 },
};

export const ERC20_ABI_MINIMAL = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];
