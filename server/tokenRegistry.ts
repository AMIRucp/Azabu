export interface RegisteredToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  category?: 'crypto' | 'stock' | 'etf' | 'commodity';
  provider?: 'xstocks' | 'ondo' | 'remora';
  company?: string;
  tradfiTicker?: string;
  commodityType?: 'precious_metal' | 'industrial_metal' | 'energy';
  commodityLabel?: string;
  isSecurityToken?: boolean;
}

export const TOKEN_REGISTRY: Record<string, RegisteredToken> = {
  'SOL': {
    address: 'So11111111111111111111111111111111111111112',
    name: 'Solana', symbol: 'SOL', decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  'USDC': {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    name: 'USD Coin', symbol: 'USDC', decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  'USDT': {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    name: 'Tether USD', symbol: 'USDT', decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
  },
  'JUP': {
    address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    name: 'Jupiter', symbol: 'JUP', decimals: 6,
    logoURI: 'https://static.jup.ag/jup/icon.png',
  },
  'BONK': {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    name: 'Bonk', symbol: 'BONK', decimals: 5,
    logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  },
  'WIF': {
    address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    name: 'dogwifhat', symbol: 'WIF', decimals: 6,
    logoURI: 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betiber557wrze6lv2eyq.ipfs.nftstorage.link',
  },
  'PYTH': {
    address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    name: 'Pyth Network', symbol: 'PYTH', decimals: 6,
    logoURI: 'https://pyth.network/token.svg',
  },
  'RAY': {
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    name: 'Raydium', symbol: 'RAY', decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
  },
  'ORCA': {
    address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    name: 'Orca', symbol: 'ORCA', decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png',
  },
  'JTO': {
    address: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
    name: 'Jito', symbol: 'JTO', decimals: 9,
    logoURI: 'https://metadata.jito.network/token/jto/icon.png',
  },
  'RENDER': {
    address: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
    name: 'Render Token', symbol: 'RENDER', decimals: 8,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof/logo.png',
  },
  'HNT': {
    address: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
    name: 'Helium', symbol: 'HNT', decimals: 8,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux/logo.png',
  },
  'MOBILE': {
    address: 'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6',
    name: 'Helium Mobile', symbol: 'MOBILE', decimals: 6,
    logoURI: 'https://shdw-drive.genesysgo.net/6tcnBSybPG7piEDShBcrVtYJDPSvGrDbVvXmXKpzBvWP/mobile.png',
  },
  'JLP': {
    address: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4',
    name: 'Jupiter Liquidity Provider', symbol: 'JLP', decimals: 6,
    logoURI: 'https://static.jup.ag/jlp/icon.png',
  },
  'JUPSOL': {
    address: 'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v',
    name: 'Jupiter Staked SOL', symbol: 'jupSOL', decimals: 9,
    logoURI: 'https://static.jup.ag/jupSOL/icon.png',
  },

  'ABTX': {
    address: 'XsHtf5RpxsQ7jeJ9ivNewouZKJHbPxhPoEy6yYvULr7',
    name: 'Abbott Laboratories', symbol: 'ABTx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Abbott Laboratories', tradfiTicker: 'ABT',
  },
  'ABBVX': {
    address: 'XswbinNKyPmzTa5CskMbCPvMW6G5CMnZXZEeQSSQoie',
    name: 'AbbVie Inc.', symbol: 'ABBVx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'AbbVie Inc.', tradfiTicker: 'ABBV',
  },
  'ACNX': {
    address: 'Xs5UJzmCRQ8DWZjskExdSQDnbE6iLkRu2jjrRAB1JSU',
    name: 'Accenture', symbol: 'ACNx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Accenture', tradfiTicker: 'ACN',
  },
  'GOOGLX': {
    address: 'XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN',
    name: 'Alphabet Inc.', symbol: 'GOOGLx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Alphabet Inc.', tradfiTicker: 'GOOGL',
  },
  'AMZNX': {
    address: 'Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg',
    name: 'Amazon.com', symbol: 'AMZNx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Amazon.com', tradfiTicker: 'AMZN',
  },
  'AMBRX': {
    address: 'XsaQTCgebC2KPbf27KUhdv5JFvHhQ4GDAPURwrEhAzb',
    name: 'Amber', symbol: 'AMBRx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Amber', tradfiTicker: 'AMBR',
  },
  'AAPLX': {
    address: 'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp',
    name: 'Apple Inc.', symbol: 'AAPLx', decimals: 6,
    logoURI: '/graphics/apple-logo.jpg', category: 'stock', provider: 'xstocks', company: 'Apple Inc.', tradfiTicker: 'AAPL',
  },
  'APPX': {
    address: 'XsPdAVBi8Zc1xvv53k4JcMrQaEDTgkGqKYeh7AYgPHV',
    name: 'AppLovin', symbol: 'APPx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'AppLovin', tradfiTicker: 'APP',
  },
  'AZNX': {
    address: 'Xs3ZFkPYT2BN7qBMqf1j1bfTeTm1rFzEFSsQ1z3wAKU',
    name: 'AstraZeneca', symbol: 'AZNx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'AstraZeneca', tradfiTicker: 'AZN',
  },
  'BACX': {
    address: 'XswsQk4duEQmCbGzfqUUWYmi7pV7xpJ9eEmLHXCaEQP',
    name: 'Bank of America', symbol: 'BACx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Bank of America', tradfiTicker: 'BAC',
  },
  'BRKBX': {
    address: 'Xs6B6zawENwAbWVi7w92rjazLuAr5Az59qgWKcNb45x',
    name: 'Berkshire Hathaway', symbol: 'BRK.Bx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Berkshire Hathaway', tradfiTicker: 'BRK.B',
  },
  'AVGOX': {
    address: 'XsgSaSvNSqLTtFuyWPBhK9196Xb9Bbdyjj4fH3cPJGo',
    name: 'Broadcom Inc.', symbol: 'AVGOx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Broadcom Inc.', tradfiTicker: 'AVGO',
  },
  'CVXX': {
    address: 'XsNNMt7WTNA2sV3jrb1NNfNgapxRF5i4i6GcnTRRHts',
    name: 'Chevron Corp.', symbol: 'CVXx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Chevron Corp.', tradfiTicker: 'CVX',
  },
  'CRCLX': {
    address: 'XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1',
    name: 'Circle', symbol: 'CRCLx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Circle', tradfiTicker: 'CRCL',
  },
  'CSCOX': {
    address: 'Xsr3pdLQyXvDJBFgpR5nexCEZwXvigb8wbPYp4YoNFf',
    name: 'Cisco Systems', symbol: 'CSCOx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Cisco Systems', tradfiTicker: 'CSCO',
  },
  'KOX': {
    address: 'XsaBXg8dU5cPM6ehmVctMkVqoiRG2ZjMo1cyBJ3AykQ',
    name: 'Coca-Cola Co.', symbol: 'KOx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Coca-Cola Co.', tradfiTicker: 'KO',
  },
  'COINX': {
    address: 'Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu',
    name: 'Coinbase Global', symbol: 'COINx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Coinbase Global', tradfiTicker: 'COIN',
  },
  'CMCSAX': {
    address: 'XsvKCaNsxg2GN8jjUmq71qukMJr7Q1c5R2Mk9P8kcS8',
    name: 'Comcast Corp.', symbol: 'CMCSAx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Comcast Corp.', tradfiTicker: 'CMCSA',
  },
  'CRWDX': {
    address: 'Xs7xXqkcK7K8urEqGg52SECi79dRp2cEKKuYjUePYDw',
    name: 'CrowdStrike Holdings', symbol: 'CRWDx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'CrowdStrike Holdings', tradfiTicker: 'CRWD',
  },
  'DHRX': {
    address: 'Xseo8tgCZfkHxWS9xbFYeKFyMSbWEvZGFV1Gh53GtCV',
    name: 'Danaher Corp.', symbol: 'DHRx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Danaher Corp.', tradfiTicker: 'DHR',
  },
  'LLYX': {
    address: 'Xsnuv4omNoHozR6EEW5mXkw8Nrny5rB3jVfLqi6gKMH',
    name: 'Eli Lilly', symbol: 'LLYx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Eli Lilly', tradfiTicker: 'LLY',
  },
  'XOMX': {
    address: 'XsaHND8sHyfMfsWPj6kSdd5VwvCayZvjYgKmmcNL5qh',
    name: 'Exxon Mobil', symbol: 'XOMx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Exxon Mobil', tradfiTicker: 'XOM',
  },
  'GMEX': {
    address: 'Xsf9mBktVB9BSU5kf4nHxPq5hCBJ2j2ui3ecFGxPRGc',
    name: 'GameStop Corp.', symbol: 'GMEx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'GameStop Corp.', tradfiTicker: 'GME',
  },
  'GSX': {
    address: 'XsgaUyp4jd1fNBCxgtTKkW64xnnhQcvgaxzsbAq5ZD1',
    name: 'Goldman Sachs', symbol: 'GSx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Goldman Sachs', tradfiTicker: 'GS',
  },
  'HDX': {
    address: 'XszjVtyhowGjSC5odCqBpW1CtXXwXjYokymrk7fGKD3',
    name: 'Home Depot', symbol: 'HDx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Home Depot', tradfiTicker: 'HD',
  },
  'HONX': {
    address: 'XsRbLZthfABAPAfumWNEJhPyiKDW6TvDVeAeW7oKqA2',
    name: 'Honeywell', symbol: 'HONx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Honeywell', tradfiTicker: 'HON',
  },
  'INTCX': {
    address: 'XshPgPdXFRWB8tP1j82rebb2Q9rPgGX37RuqzohmArM',
    name: 'Intel Corp.', symbol: 'INTCx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Intel Corp.', tradfiTicker: 'INTC',
  },
  'IBMX': {
    address: 'XspwhyYPdWVM8XBHZnpS9hgyag9MKjLRyE3tVfmCbSr',
    name: 'IBM Corp.', symbol: 'IBMx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'IBM Corp.', tradfiTicker: 'IBM',
  },
  'JNJX': {
    address: 'XsGVi5eo1Dh2zUpic4qACcjuWGjNv8GCt3dm5XcX6Dn',
    name: 'Johnson & Johnson', symbol: 'JNJx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Johnson & Johnson', tradfiTicker: 'JNJ',
  },
  'JPMX': {
    address: 'XsMAqkcKsUewDrzVkait4e5u4y8REgtyS7jWgCpLV2C',
    name: 'JPMorgan Chase', symbol: 'JPMx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'JPMorgan Chase', tradfiTicker: 'JPM',
  },
  'LINX': {
    address: 'XsSr8anD1hkvNMu8XQiVcmiaTP7XGvYu7Q58LdmtE8Z',
    name: 'Linde plc', symbol: 'LINx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Linde plc', tradfiTicker: 'LIN',
  },
  'MRVLX': {
    address: 'XsuxRGDzbLjnJ72v74b7p9VY6N66uYgTCyfwwRjVCJA',
    name: 'Marvell Technology', symbol: 'MRVLx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Marvell Technology', tradfiTicker: 'MRVL',
  },
  'MAX': {
    address: 'XsApJFV9MAktqnAc6jqzsHVujxkGm9xcSUffaBoYLKC',
    name: 'Mastercard', symbol: 'MAx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Mastercard', tradfiTicker: 'MA',
  },
  'MCDX': {
    address: 'XsqE9cRRpzxcGKDXj1BJ7Xmg4GRhZoyY1KpmGSxAWT2',
    name: "McDonald's Corp.", symbol: 'MCDx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: "McDonald's Corp.", tradfiTicker: 'MCD',
  },
  'MDTX': {
    address: 'XsDgw22qRLTv5Uwuzn6T63cW69exG41T6gwQhEK22u2',
    name: 'Medtronic', symbol: 'MDTx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Medtronic', tradfiTicker: 'MDT',
  },
  'MRKX': {
    address: 'XsnQnU7AdbRZYe2akqqpibDdXjkieGFfSkbkjX1Sd1X',
    name: 'Merck & Co.', symbol: 'MRKx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Merck & Co.', tradfiTicker: 'MRK',
  },
  'METAX': {
    address: 'Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu',
    name: 'Meta Platforms', symbol: 'METAx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Meta Platforms', tradfiTicker: 'META',
  },
  'MSFTX': {
    address: 'XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX',
    name: 'Microsoft Corp.', symbol: 'MSFTx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Microsoft Corp.', tradfiTicker: 'MSFT',
  },
  'MSTRX': {
    address: 'XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ',
    name: 'MicroStrategy', symbol: 'MSTRx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'MicroStrategy', tradfiTicker: 'MSTR',
  },
  'NFLXX': {
    address: 'XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL',
    name: 'Netflix Inc.', symbol: 'NFLXx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Netflix Inc.', tradfiTicker: 'NFLX',
  },
  'NVOX': {
    address: 'XsfAzPzYrYjd4Dpa9BU3cusBsvWfVB9gBcyGC87S57n',
    name: 'Novo Nordisk', symbol: 'NVOx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Novo Nordisk', tradfiTicker: 'NVO',
  },
  'NVDAX': {
    address: 'Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh',
    name: 'Nvidia Corp.', symbol: 'NVDAx', decimals: 6,
    logoURI: '/graphics/nvidia-logo.png', category: 'stock', provider: 'xstocks', company: 'Nvidia Corp.', tradfiTicker: 'NVDA',
  },
  'ORCLX': {
    address: 'XsjFwUPiLofddX5cWFHW35GCbXcSu1BCUGfxoQAQjeL',
    name: 'Oracle Corp.', symbol: 'ORCLx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Oracle Corp.', tradfiTicker: 'ORCL',
  },
  'PLTRX': {
    address: 'XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4',
    name: 'Palantir Technologies', symbol: 'PLTRx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Palantir Technologies', tradfiTicker: 'PLTR',
  },
  'PEPX': {
    address: 'Xsv99frTRUeornyvCfvhnDesQDWuvns1M852Pez91vF',
    name: 'PepsiCo Inc.', symbol: 'PEPx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'PepsiCo Inc.', tradfiTicker: 'PEP',
  },
  'PFEX': {
    address: 'XsAtbqkAP1HJxy7hFDeq7ok6yM43DQ9mQ1Rh861X8rw',
    name: 'Pfizer Inc.', symbol: 'PFEx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Pfizer Inc.', tradfiTicker: 'PFE',
  },
  'PMX': {
    address: 'Xsba6tUnSjDae2VcopDB6FGGDaxRrewFCDa5hKn5vT3',
    name: 'Philip Morris', symbol: 'PMx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Philip Morris', tradfiTicker: 'PM',
  },
  'PGX': {
    address: 'XsYdjDjNUygZ7yGKfQaB6TxLh2gC6RRjzLtLAGJrhzV',
    name: 'Procter & Gamble', symbol: 'PGx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Procter & Gamble', tradfiTicker: 'PG',
  },
  'HOODX': {
    address: 'XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg',
    name: 'Robinhood Markets', symbol: 'HOODx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Robinhood Markets', tradfiTicker: 'HOOD',
  },
  'CRMX': {
    address: 'XsczbcQ3zfcgAEt9qHQES8pxKAVG5rujPSHQEXi4kaN',
    name: 'Salesforce Inc.', symbol: 'CRMx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Salesforce Inc.', tradfiTicker: 'CRM',
  },
  'TSLAX': {
    address: 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB',
    name: 'Tesla Inc.', symbol: 'TSLAx', decimals: 6,
    logoURI: '/graphics/tesla-logo.jpg', category: 'stock', provider: 'xstocks', company: 'Tesla Inc.', tradfiTicker: 'TSLA',
  },
  'TMOX': {
    address: 'Xs8drBWy3Sd5QY3aifG9kt9KFs2K3PGZmx7jWrsrk57',
    name: 'Thermo Fisher Scientific', symbol: 'TMOx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Thermo Fisher Scientific', tradfiTicker: 'TMO',
  },
  'UNHX': {
    address: 'XszvaiXGPwvk2nwb3o9C1CX4K6zH8sez11E6uyup6fe',
    name: 'UnitedHealth Group', symbol: 'UNHx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'UnitedHealth Group', tradfiTicker: 'UNH',
  },
  'VX': {
    address: 'XsqgsbXwWogGJsNcVZ3TyVouy2MbTkfCFhCGGGcQZ2p',
    name: 'Visa Inc.', symbol: 'Vx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Visa Inc.', tradfiTicker: 'V',
  },
  'WMTX': {
    address: 'Xs151QeqTCiuKtinzfRATnUESM2xTU6V9Wy8Vy538ci',
    name: 'Walmart Inc.', symbol: 'WMTx', decimals: 6,
    logoURI: '', category: 'stock', provider: 'xstocks', company: 'Walmart Inc.', tradfiTicker: 'WMT',
  },

  'SPYX': {
    address: 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W',
    name: 'SPDR S&P 500 ETF', symbol: 'SPYx', decimals: 6,
    logoURI: '', category: 'etf', provider: 'xstocks', company: 'SPDR S&P 500 ETF', tradfiTicker: 'SPY',
  },
  'QQQX': {
    address: 'Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ',
    name: 'Invesco QQQ Trust', symbol: 'QQQx', decimals: 6,
    logoURI: '', category: 'etf', provider: 'xstocks', company: 'Invesco QQQ Trust', tradfiTicker: 'QQQ',
  },
  'TQQQX': {
    address: 'XsjQP3iMAaQ3kQScQKthQpx9ALRbjKAjQtHg6TFomoc',
    name: 'ProShares UltraPro QQQ', symbol: 'TQQQx', decimals: 6,
    logoURI: '', category: 'etf', provider: 'xstocks', company: 'ProShares UltraPro QQQ', tradfiTicker: 'TQQQ',
  },
  'TBLLX': {
    address: 'XsqBC5tcVQLYt8wqGCHRnAUUecbRYXoJCReD6w7QEKp',
    name: 'US Treasury 6 Month Bill ETF', symbol: 'TBLLx', decimals: 6,
    logoURI: '', category: 'etf', provider: 'xstocks', company: 'US Treasury 6 Month Bill ETF', tradfiTicker: 'TBLL',
  },
  'VTIX': {
    address: 'XsssYEQjzxBCFgvYFFNuhJFBeHNdLWYeUSP8F45cDr9',
    name: 'Vanguard Total Stock Market ETF', symbol: 'VTIx', decimals: 6,
    logoURI: '', category: 'etf', provider: 'xstocks', company: 'Vanguard Total Stock Market ETF', tradfiTicker: 'VTI',
  },
  'GLDX': {
    address: 'Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re',
    name: 'SPDR Gold Shares', symbol: 'GLDx', decimals: 6,
    logoURI: '', category: 'commodity', provider: 'xstocks', company: 'SPDR Gold Shares', tradfiTicker: 'GLD',
  },

  'WBTC': {
    address: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
    name: 'Wrapped Bitcoin (Wormhole)', symbol: 'WBTC', decimals: 8,
    logoURI: '',
  },
  'CBBTC': {
    address: 'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij',
    name: 'Coinbase Wrapped BTC', symbol: 'cbBTC', decimals: 8,
    logoURI: '',
  },
  'WETH': {
    address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    name: 'Wrapped ETH (Wormhole)', symbol: 'WETH', decimals: 8,
    logoURI: '',
  },
  'WBNB': {
    address: '9gP2kCy3wA1ctvYWQk75guqXuHfrEomqydHLtcTCqiLa',
    name: 'Wrapped BNB (Wormhole)', symbol: 'WBNB', decimals: 8,
    logoURI: '',
  },
  'WAVAX': {
    address: 'KgV1GvrHQmRBY8sHQQeUKwTm2r2h8t4C8qt12Cw1HVE',
    name: 'Wrapped AVAX (Wormhole)', symbol: 'WAVAX', decimals: 8,
    logoURI: '',
  },
  'OUSG': {
    address: 'i7u4r16TcsJTgq1kAG8opmVZyVnAKBwLKu6ZPMwzxNc',
    name: 'Ondo Short-Term US Government Bond', symbol: 'OUSG', decimals: 6,
    logoURI: '',
  },
  'USDY': {
    address: 'A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6',
    name: 'Ondo US Dollar Yield', symbol: 'USDY', decimals: 6,
    logoURI: '',
  },
  'TSLAON': {
    address: 'KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo',
    name: 'Tesla (Ondo Tokenized)', symbol: 'TSLAon', decimals: 9,
    logoURI: '', category: 'stock', provider: 'ondo', company: 'Tesla Inc.', tradfiTicker: 'TSLA',
  },

  'GLDR': {
    address: 'AEv6xLECJ2KKmwFGX85mHb9S2c2BQE7dqE5midyrXHBb',
    name: 'Gold rStock', symbol: 'GLDr', decimals: 9,
    logoURI: 'https://remora-public.s3.us-east-2.amazonaws.com/logos/GLDr.svg',
    category: 'commodity', provider: 'remora', commodityType: 'precious_metal',
    commodityLabel: 'Gold', tradfiTicker: 'GLD',
  },
  'SLVR': {
    address: '7C56WnJ94iEP7YeH2iKiYpvsS5zkcpP9rJBBEBoUGdzj',
    name: 'Silver rStock', symbol: 'SLVr', decimals: 9,
    logoURI: 'https://remora-public.s3.us-east-2.amazonaws.com/logos/SLVr.svg',
    category: 'commodity', provider: 'remora', commodityType: 'precious_metal',
    commodityLabel: 'Silver', tradfiTicker: 'SLV',
  },
  'PPLTR': {
    address: 'EtTQ2QRyf33bd6B2uk7nm1nkinrdGKza66EGdjEY4s7o',
    name: 'Platinum rStock', symbol: 'PPLTr', decimals: 9,
    logoURI: 'https://remora-public.s3.us-east-2.amazonaws.com/logos/PPLTr.svg',
    category: 'commodity', provider: 'remora', commodityType: 'precious_metal',
    commodityLabel: 'Platinum', tradfiTicker: 'PPLT',
  },
  'PALLR': {
    address: '9eS6ZsnqNJGGKWq8LqZ95YJLZ219oDuJ1qjsLoKcQkmQ',
    name: 'Palladium rStock', symbol: 'PALLr', decimals: 9,
    logoURI: 'https://remora-public.s3.us-east-2.amazonaws.com/logos/PALLr.svg',
    category: 'commodity', provider: 'remora', commodityType: 'precious_metal',
    commodityLabel: 'Palladium', tradfiTicker: 'PALL',
  },
  'CPERR': {
    address: 'C3VLBJB2FhEb47s1WEgroyn3BnSYXaezqtBuu5WNmUGw',
    name: 'Copper rStock', symbol: 'CPERr', decimals: 9,
    logoURI: 'https://remora-public.s3.us-east-2.amazonaws.com/logos/CPERr.svg',
    category: 'commodity', provider: 'remora', commodityType: 'industrial_metal',
    commodityLabel: 'Copper', tradfiTicker: 'CPER',
  },
  'GOLD': {
    address: 'GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A',
    name: 'GOLD (Gold Issuance)', symbol: 'GOLD', decimals: 6,
    logoURI: '',
    category: 'commodity', commodityType: 'precious_metal',
    commodityLabel: 'Gold',
  },
};

export const STOCK_ALIASES: Record<string, string> = {
  'ABT': 'ABTX', 'ABBOTT': 'ABTX',
  'ABBV': 'ABBVX', 'ABBVIE': 'ABBVX',
  'ACN': 'ACNX', 'ACCENTURE': 'ACNX',
  'GOOGL': 'GOOGLX', 'GOOGLE': 'GOOGLX', 'ALPHABET': 'GOOGLX',
  'AMZN': 'AMZNX', 'AMAZON': 'AMZNX',
  'AMBR': 'AMBRX', 'AMBER': 'AMBRX',
  'AAPL': 'AAPLX', 'APPLE': 'AAPLX',
  'APP': 'APPX', 'APPLOVIN': 'APPX',
  'AZN': 'AZNX', 'ASTRAZENECA': 'AZNX',
  'BAC': 'BACX', 'BANKOFAMERICA': 'BACX',
  'BRK.B': 'BRKBX', 'BRKB': 'BRKBX', 'BRKA': 'BRKBX', 'BRK': 'BRKBX', 'BERKSHIRE': 'BRKBX',
  'AVGO': 'AVGOX', 'BROADCOM': 'AVGOX',
  'CVX': 'CVXX', 'CHEVRON': 'CVXX',
  'CRCL': 'CRCLX', 'CIRCLE': 'CRCLX',
  'CSCO': 'CSCOX', 'CISCO': 'CSCOX',
  'KO': 'KOX', 'COKE': 'KOX', 'COCACOLA': 'KOX', 'COCA-COLA': 'KOX',
  'COIN': 'COINX', 'COINBASE': 'COINX',
  'CMCSA': 'CMCSAX', 'COMCAST': 'CMCSAX',
  'CRWD': 'CRWDX', 'CROWDSTRIKE': 'CRWDX',
  'DHR': 'DHRX', 'DANAHER': 'DHRX',
  'LLY': 'LLYX', 'LILLY': 'LLYX', 'ELILILLY': 'LLYX',
  'XOM': 'XOMX', 'EXXON': 'XOMX',
  'GME': 'GMEX', 'GAMESTOP': 'GMEX',
  'GS': 'GSX', 'GOLDMAN': 'GSX',
  'HD': 'HDX', 'HOMEDEPOT': 'HDX',
  'HON': 'HONX', 'HONEYWELL': 'HONX',
  'INTC': 'INTCX', 'INTEL': 'INTCX',
  'IBM': 'IBMX',
  'JNJ': 'JNJX', 'JOHNSON': 'JNJX',
  'JPM': 'JPMX', 'JPMORGAN': 'JPMX',
  'LIN': 'LINX', 'LINDE': 'LINX',
  'MRVL': 'MRVLX', 'MARVELL': 'MRVLX',
  'MA': 'MAX', 'MASTERCARD': 'MAX',
  'MCD': 'MCDX', 'MCDONALDS': 'MCDX',
  'MDT': 'MDTX', 'MEDTRONIC': 'MDTX',
  'MRK': 'MRKX', 'MERCK': 'MRKX',
  'META': 'METAX',
  'MSFT': 'MSFTX', 'MICROSOFT': 'MSFTX',
  'MSTR': 'MSTRX', 'MICROSTRATEGY': 'MSTRX',
  'NFLX': 'NFLXX', 'NETFLIX': 'NFLXX',
  'NVO': 'NVOX', 'NOVONORDISK': 'NVOX',
  'NVDA': 'NVDAX', 'NVIDIA': 'NVDAX',
  'ORCL': 'ORCLX', 'ORACLE': 'ORCLX',
  'PLTR': 'PLTRX', 'PALANTIR': 'PLTRX',
  'PEP': 'PEPX', 'PEPSI': 'PEPX', 'PEPSICO': 'PEPX',
  'PFE': 'PFEX', 'PFIZER': 'PFEX',
  'PM': 'PMX', 'PHILIPMORRIS': 'PMX',
  'PG': 'PGX', 'PROCTER': 'PGX',
  'HOOD': 'HOODX', 'ROBINHOOD': 'HOODX',
  'CRM': 'CRMX', 'SALESFORCE': 'CRMX',
  'TSLA': 'TSLAX', 'TESLA': 'TSLAX', 'TSLAON': 'TSLAON',
  'TMO': 'TMOX', 'THERMOFISHER': 'TMOX',
  'UNH': 'UNHX', 'UNITEDHEALTH': 'UNHX',
  'V': 'VX', 'VISA': 'VX',
  'WMT': 'WMTX', 'WALMART': 'WMTX',
  'SPY': 'SPYX', 'S&P500': 'SPYX', 'SP500': 'SPYX', 'S&P': 'SPYX',
  'QQQ': 'QQQX', 'NASDAQ': 'QQQX',
  'TQQQ': 'TQQQX',
  'TBLL': 'TBLLX',
  'VTI': 'VTIX', 'VANGUARD': 'VTIX',
  'GLD': 'GLDX',
};

export const ALL_STOCK_TICKERS = new Set([
  ...Object.keys(STOCK_ALIASES),
  ...Object.keys(TOKEN_REGISTRY).filter(k => {
    const t = TOKEN_REGISTRY[k];
    return t.category === 'stock' || t.category === 'etf';
  }),
]);

let _dynamicStockCheck: ((s: string) => boolean) | null = null;

export function setDynamicStockCheck(fn: (s: string) => boolean): void {
  _dynamicStockCheck = fn;
}

export function isStockToken(symbol: string): boolean {
  const upper = symbol.toUpperCase().trim();
  if (ALL_STOCK_TICKERS.has(upper)) return true;
  const reg = TOKEN_REGISTRY[upper];
  if (reg && (reg.category === 'stock' || reg.category === 'etf' || reg.category === 'commodity')) return true;
  if (_dynamicStockCheck && _dynamicStockCheck(upper)) return true;
  return false;
}

export function resolveStockAlias(input: string): string {
  const upper = input.toUpperCase().trim();
  if (TOKEN_REGISTRY[upper]) return upper;
  if (STOCK_ALIASES[upper]) return STOCK_ALIASES[upper];
  return upper;
}

export function getStockMeta(symbol: string): RegisteredToken | null {
  const resolved = resolveStockAlias(symbol);
  return TOKEN_REGISTRY[resolved] || null;
}

export const REGISTRY_BY_MINT: Record<string, RegisteredToken> = {};
for (const [, token] of Object.entries(TOKEN_REGISTRY)) {
  REGISTRY_BY_MINT[token.address] = token;
}
