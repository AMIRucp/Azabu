export interface RWAToken {
  symbol: string;
  mint: string;
  name: string;
  tradfiTicker: string;
  category: 'stock' | 'etf' | 'commodity';
  sector: string;
  provider: 'xstocks';
  decimals: 6;
}

export const RWA_INDEX: RWAToken[] = [
  { symbol: "AAPLx",  mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", name: "Apple Inc.", tradfiTicker: "AAPL", category: "stock", sector: "Tech", provider: "xstocks", decimals: 6 },
  { symbol: "AMZNx",  mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", name: "Amazon.com", tradfiTicker: "AMZN", category: "stock", sector: "Tech", provider: "xstocks", decimals: 6 },
  { symbol: "GOOGLx", mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", name: "Alphabet (Google)", tradfiTicker: "GOOGL", category: "stock", sector: "Tech", provider: "xstocks", decimals: 6 },
  { symbol: "MSFTx",  mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX", name: "Microsoft Corp.", tradfiTicker: "MSFT", category: "stock", sector: "Tech", provider: "xstocks", decimals: 6 },
  { symbol: "METAx",  mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", name: "Meta Platforms", tradfiTicker: "META", category: "stock", sector: "Tech", provider: "xstocks", decimals: 6 },
  { symbol: "NVDAx",  mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", name: "Nvidia Corp.", tradfiTicker: "NVDA", category: "stock", sector: "Semiconductors", provider: "xstocks", decimals: 6 },
  { symbol: "AVGOx",  mint: "XsgSaSvNSqLTtFuyWPBhK9196Xb9Bbdyjj4fH3cPJGo", name: "Broadcom Inc.", tradfiTicker: "AVGO", category: "stock", sector: "Semiconductors", provider: "xstocks", decimals: 6 },

  { symbol: "COINx",  mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu", name: "Coinbase Global", tradfiTicker: "COIN", category: "stock", sector: "Crypto", provider: "xstocks", decimals: 6 },
  { symbol: "CRCLx",  mint: "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1", name: "Circle (USDC issuer)", tradfiTicker: "CRCL", category: "stock", sector: "Crypto", provider: "xstocks", decimals: 6 },
  { symbol: "MSTRx",  mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ", name: "MicroStrategy (BTC proxy)", tradfiTicker: "MSTR", category: "stock", sector: "Crypto", provider: "xstocks", decimals: 6 },
  { symbol: "GSx",    mint: "XsgaUyp4jd1fNBCxgtTKkW64xnnhQcvgaxzsbAq5ZD1", name: "Goldman Sachs", tradfiTicker: "GS", category: "stock", sector: "Finance", provider: "xstocks", decimals: 6 },
  { symbol: "BACx",   mint: "XswsQk4duEQmCbGzfqUUWYmi7pV7xpJ9eEmLHXCaEQP", name: "Bank of America", tradfiTicker: "BAC", category: "stock", sector: "Finance", provider: "xstocks", decimals: 6 },

  { symbol: "TSLAx",  mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", name: "Tesla Inc.", tradfiTicker: "TSLA", category: "stock", sector: "Auto/EV", provider: "xstocks", decimals: 6 },

  { symbol: "CRWDx",  mint: "Xs7xXqkcK7K8urEqGg52SECi79dRp2cEKKuYjUePYDw", name: "CrowdStrike", tradfiTicker: "CRWD", category: "stock", sector: "Cybersecurity", provider: "xstocks", decimals: 6 },
  { symbol: "CSCOx",  mint: "Xsr3pdLQyXvDJBFgpR5nexCEZwXvigb8wbPYp4YoNFf", name: "Cisco Systems", tradfiTicker: "CSCO", category: "stock", sector: "Tech", provider: "xstocks", decimals: 6 },
  { symbol: "ACNx",   mint: "Xs5UJzmCRQ8DWZjskExdSQDnbE6iLkRu2jjrRAB1JSU", name: "Accenture", tradfiTicker: "ACN", category: "stock", sector: "Consulting/IT", provider: "xstocks", decimals: 6 },

  { symbol: "ABTx",   mint: "XsHtf5RpxsQ7jeJ9ivNewouZKJHbPxhPoEy6yYvULr7", name: "Abbott Labs", tradfiTicker: "ABT", category: "stock", sector: "Healthcare", provider: "xstocks", decimals: 6 },
  { symbol: "ABBVx",  mint: "XswbinNKyPmzTa5CskMbCPvMW6G5CMnZXZEeQSSQoie", name: "AbbVie Inc.", tradfiTicker: "ABBV", category: "stock", sector: "Pharma", provider: "xstocks", decimals: 6 },
  { symbol: "AZNx",   mint: "Xs3ZFkPYT2BN7qBMqf1j1bfTeTm1rFzEFSsQ1z3wAKU", name: "AstraZeneca", tradfiTicker: "AZN", category: "stock", sector: "Pharma", provider: "xstocks", decimals: 6 },
  { symbol: "DHRx",   mint: "Xseo8tgCZfkHxWS9xbFYeKFyMSbWEvZGFV1Gh53GtCV", name: "Danaher Corp.", tradfiTicker: "DHR", category: "stock", sector: "Healthcare", provider: "xstocks", decimals: 6 },

  { symbol: "CVXx",   mint: "XsNNMt7WTNA2sV3jrb1NNfNgapxRF5i4i6GcnTRRHts", name: "Chevron Corp.", tradfiTicker: "CVX", category: "stock", sector: "Energy", provider: "xstocks", decimals: 6 },

  { symbol: "CMCSAx", mint: "XsvKCaNsxg2GN8jjUmq71qukMJr7Q1c5R2Mk9P8kcS8", name: "Comcast Corp.", tradfiTicker: "CMCSA", category: "stock", sector: "Media", provider: "xstocks", decimals: 6 },
  { symbol: "NFLXx",  mint: "XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL", name: "Netflix Inc.", tradfiTicker: "NFLX", category: "stock", sector: "Streaming", provider: "xstocks", decimals: 6 },

  { symbol: "GMEx",   mint: "Xsf9mBktVB9BSU5kf4nHxPq5hCBJ2j2ui3ecFGxPRGc", name: "GameStop Corp.", tradfiTicker: "GME", category: "stock", sector: "Retail/Meme", provider: "xstocks", decimals: 6 },

  { symbol: "BRK.Bx", mint: "Xs6B6zawENwAbWVi7w92rjazLuAr5Az59qgWKcNb45x", name: "Berkshire Hathaway B", tradfiTicker: "BRK.B", category: "stock", sector: "Conglomerate", provider: "xstocks", decimals: 6 },

  { symbol: "GLDx",   mint: "Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re", name: "SPDR Gold Shares", tradfiTicker: "GLD", category: "commodity", sector: "Gold ETF", provider: "xstocks", decimals: 6 },
  { symbol: "QQQx",   mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ", name: "Invesco QQQ Trust", tradfiTicker: "QQQ", category: "etf", sector: "Nasdaq 100", provider: "xstocks", decimals: 6 },
  { symbol: "SPYx",   mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W", name: "SPDR S&P 500 ETF", tradfiTicker: "SPY", category: "etf", sector: "S&P 500", provider: "xstocks", decimals: 6 },
];

export const COMMODITY_RWAS: RWAToken[] = [
  { symbol: "GOLD",  mint: "GoLDYyyiVA1nsEFMnRvoEn5M3JRGX2KBkUDiJPMnXiVr", name: "Gold Token", tradfiTicker: "GOLD", category: "commodity", sector: "Precious Metals", provider: "xstocks" as any, decimals: 6 },
];

export const RWA_ALIASES: Record<string, string> = {
  'APPLE': 'AAPLx', 'AAPL': 'AAPLx',
  'AMAZON': 'AMZNx', 'AMZN': 'AMZNx',
  'GOOGLE': 'GOOGLx', 'ALPHABET': 'GOOGLx', 'GOOGL': 'GOOGLx',
  'MICROSOFT': 'MSFTx', 'MSFT': 'MSFTx',
  'META': 'METAx', 'FACEBOOK': 'METAx',
  'NVIDIA': 'NVDAx', 'NVDA': 'NVDAx',
  'TESLA': 'TSLAx', 'TSLA': 'TSLAx',
  'COINBASE': 'COINx', 'COIN': 'COINx',
  'MICROSTRATEGY': 'MSTRx', 'MSTR': 'MSTRx',
  'GAMESTOP': 'GMEx', 'GME': 'GMEx',
  'NETFLIX': 'NFLXx', 'NFLX': 'NFLXx',
  'CROWDSTRIKE': 'CRWDx', 'CRWD': 'CRWDx',
  'BROADCOM': 'AVGOx', 'AVGO': 'AVGOx',
  'GOLDMAN': 'GSx', 'GOLDMAN SACHS': 'GSx', 'GS': 'GSx',
  'BERKSHIRE': 'BRK.Bx', 'BRK': 'BRK.Bx',
  'CHEVRON': 'CVXx', 'CVX': 'CVXx',
  'CISCO': 'CSCOx', 'CSCO': 'CSCOx',
  'ABBOTT': 'ABTx', 'ABT': 'ABTx',
  'ABBVIE': 'ABBVx', 'ABBV': 'ABBVx',
  'COMCAST': 'CMCSAx', 'CMCSA': 'CMCSAx',
  'CIRCLE': 'CRCLx', 'CRCL': 'CRCLx',
  'ACCENTURE': 'ACNx', 'ACN': 'ACNx',
  'ASTRAZENECA': 'AZNx', 'AZN': 'AZNx',
  'DANAHER': 'DHRx', 'DHR': 'DHRx',
  'BANK OF AMERICA': 'BACx', 'BAC': 'BACx',
  'S&P500': 'SPYx', 'SP500': 'SPYx', 'S&P': 'SPYx', 'SPY': 'SPYx',
  'NASDAQ': 'QQQx', 'QQQ': 'QQQx', 'NASDAQ100': 'QQQx',
  'GOLD ETF': 'GLDx', 'GLD': 'GLDx',
  'GOLD': 'GOLD',
};

export function resolveRWA(input: string): RWAToken | null {
  const upper = input.toUpperCase().trim();

  const directMatch = [...RWA_INDEX, ...COMMODITY_RWAS].find(t => t.symbol.toUpperCase() === upper);
  if (directMatch) return directMatch;

  const aliasSymbol = RWA_ALIASES[upper];
  if (aliasSymbol) {
    if (aliasSymbol === 'GOLD') return COMMODITY_RWAS.find(t => t.symbol === 'GOLD') || null;
    return RWA_INDEX.find(t => t.symbol === aliasSymbol) || null;
  }

  const nameMatch = [...RWA_INDEX, ...COMMODITY_RWAS].find(t =>
    t.name.toUpperCase().includes(upper) ||
    t.tradfiTicker.toUpperCase() === upper
  );
  if (nameMatch) return nameMatch;

  return null;
}

export function getAllRWAs(): RWAToken[] {
  return [...RWA_INDEX, ...COMMODITY_RWAS];
}

export function getRWAsByCategory(cat: 'stock' | 'etf' | 'commodity'): RWAToken[] {
  return getAllRWAs().filter(t => t.category === cat);
}

export function getRWAsBySector(sector: string): RWAToken[] {
  return getAllRWAs().filter(t => t.sector.toLowerCase().includes(sector.toLowerCase()));
}
