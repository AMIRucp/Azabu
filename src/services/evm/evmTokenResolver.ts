const EVM_TOKEN_MAP: Record<string, { address: string; decimals: number; name: string }> = {
  'ETH':  { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, name: 'Wrapped Ether' },
  'WETH': { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, name: 'Wrapped Ether' },
  'USDC': { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, name: 'USD Coin' },
  'USDT': { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, name: 'Tether' },
  'BTC':  { address: '0x47904963fc8b2340414262125aF798B9655E58Cd', decimals: 8, name: 'Bitcoin' },
  'WBTC': { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8, name: 'Wrapped Bitcoin' },
  'ARB':  { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, name: 'Arbitrum' },
  'LINK': { address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18, name: 'Chainlink' },
  'SOL':  { address: '0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07', decimals: 9, name: 'Solana' },
  'DOGE': { address: '0xC4da4c24fd591125c3F47b340b6f4f76111883d8', decimals: 8, name: 'Dogecoin' },
  'UNI':  { address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', decimals: 18, name: 'Uniswap' },
  'AAVE': { address: '0xba5DdD1f9d7F570dc94a51479a000E3BCE967196', decimals: 18, name: 'Aave' },
  'DAI':  { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18, name: 'Dai' },
  'XRP':  { address: '0xc14e065b0067dE91534e032868f5Ac6ecf2c6868', decimals: 6, name: 'XRP' },
  'AVAX': { address: '0x565609fAF65B92F7be02468acF86f8979423F76', decimals: 18, name: 'Avalanche' },
  'NEAR': { address: '0x1FF7F3EFBb9481Cbd7db4F932cBCD4467144237C', decimals: 24, name: 'Near' },
  'ATOM': { address: '0x7D7F1765aCbaF847b9A1f7137FE8Ed4931FbfEbA', decimals: 6, name: 'Cosmos' },
  'OP':   { address: '0xaC800FD6159c2a2CB8fE94BB74B46c745C1E8412', decimals: 18, name: 'Optimism' },
};

export function resolveEvmToken(symbol: string) {
  return EVM_TOKEN_MAP[symbol.toUpperCase()] || null;
}

export function getEvmTokenList() {
  return Object.entries(EVM_TOKEN_MAP).map(([symbol, data]) => ({
    symbol,
    ...data,
  }));
}
