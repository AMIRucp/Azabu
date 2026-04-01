export const AAVE_POOL_ADDRESSES: Record<number, `0x${string}`> = {
  1: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  137: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  42161: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  8453: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
};

export const AAVE_POOL_ABI = [
  {
    name: 'supply',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' },
    ],
    outputs: [],
  },
  {
    name: 'borrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'interestRateMode', type: 'uint256' },
      { name: 'referralCode', type: 'uint16' },
      { name: 'onBehalfOf', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'to', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'repay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'interestRateMode', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const ERC20_APPROVE_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const AAVE_CHAIN_CONFIG: Record<number, { name: string; short: string }> = {
  1: { name: 'Ethereum', short: 'ETH' },
  137: { name: 'Polygon', short: 'MATIC' },
  42161: { name: 'Arbitrum', short: 'ARB' },
  8453: { name: 'Base', short: 'BASE' },
};

export const EVM_TOKEN_META: Record<string, Record<string, { address: `0x${string}`; decimals: number; logo: string }>> = {
  ETH: {
    '1': { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  },
  WETH: {
    '1': { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    '137': { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    '42161': { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
    '8453': { address: '0x4200000000000000000000000000000000000006', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  },
  USDC: {
    '1': { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, logo: 'https://assets.coingecko.com/coins/images/6319/small/USDC.png' },
    '137': { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6, logo: 'https://assets.coingecko.com/coins/images/6319/small/USDC.png' },
    '42161': { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, logo: 'https://assets.coingecko.com/coins/images/6319/small/USDC.png' },
    '8453': { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, logo: 'https://assets.coingecko.com/coins/images/6319/small/USDC.png' },
  },
  USDT: {
    '1': { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    '137': { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    '42161': { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  },
  WBTC: {
    '1': { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, logo: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png' },
    '137': { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8, logo: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png' },
    '42161': { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8, logo: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png' },
  },
  DAI: {
    '1': { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png' },
    '137': { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png' },
    '42161': { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png' },
  },
  LINK: {
    '1': { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
    '137': { address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
    '42161': { address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  },
  AAVE: {
    '1': { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png' },
    '137': { address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png' },
    '42161': { address: '0xba5DdD1f9d7F570dc94a51479a000E3BCE967196', decimals: 18, logo: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png' },
  },
};

export const CHAIN_EXPLORER: Record<number, string> = {
  1: 'https://etherscan.io',
  137: 'https://polygonscan.com',
  42161: 'https://arbiscan.io',
  8453: 'https://basescan.org',
};
