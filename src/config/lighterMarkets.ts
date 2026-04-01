export interface LighterMarketConfig {
  internalSymbol: string;
  venueTicker: string;
  maxLeverage: number;
  category: 'index' | 'forex' | 'stock';
  name: string;
}

export const LIGHTER_MARKETS: LighterMarketConfig[] = [
  { internalSymbol: 'URA',    venueTicker: 'URAd-PERP',    maxLeverage: 10,  category: 'index', name: 'Uranium ETF' },
  { internalSymbol: 'SPY',    venueTicker: 'SPYd-PERP',    maxLeverage: 20,  category: 'index', name: 'S&P 500 ETF' },
  { internalSymbol: 'QQQ',    venueTicker: 'QQQd-PERP',    maxLeverage: 20,  category: 'index', name: 'Nasdaq 100 ETF' },
  { internalSymbol: 'MAGS',   venueTicker: 'MAGSd-PERP',   maxLeverage: 10,  category: 'index', name: 'Magnificent 7 ETF' },
  { internalSymbol: 'KRCOMP', venueTicker: 'KRCOMP-PERP',  maxLeverage: 10,  category: 'index', name: 'KOSPI Composite' },
  { internalSymbol: 'IWM',    venueTicker: 'IWMd-PERP',    maxLeverage: 10,  category: 'index', name: 'Russell 2000 ETF' },
  { internalSymbol: 'DIA',    venueTicker: 'DIAd-PERP',    maxLeverage: 10,  category: 'index', name: 'Dow Jones ETF' },
  { internalSymbol: 'BOTZ',   venueTicker: 'BOTZd-PERP',   maxLeverage: 10,  category: 'index', name: 'Robotics & AI ETF' },
  { internalSymbol: 'USDKRW', venueTicker: 'USDKRW-PERP',  maxLeverage: 25,  category: 'forex', name: 'USD/KRW' },
  { internalSymbol: 'USDJPY', venueTicker: 'USDJPY-PERP',  maxLeverage: 25,  category: 'forex', name: 'USD/JPY' },
  { internalSymbol: 'USDCHF', venueTicker: 'USDCHF-PERP',  maxLeverage: 25,  category: 'forex', name: 'USD/CHF' },
  { internalSymbol: 'USDCAD', venueTicker: 'USDCAD-PERP',  maxLeverage: 25,  category: 'forex', name: 'USD/CAD' },
  { internalSymbol: 'NZDUSD', venueTicker: 'NZDUSD-PERP',  maxLeverage: 25,  category: 'forex', name: 'NZD/USD' },
  { internalSymbol: 'GBPUSD', venueTicker: 'GBPUSD-PERP',  maxLeverage: 25,  category: 'forex', name: 'GBP/USD' },
  { internalSymbol: 'EURUSD', venueTicker: 'EURUSD-PERP',  maxLeverage: 50,  category: 'forex', name: 'EUR/USD' },
  { internalSymbol: 'AUDUSD', venueTicker: 'AUDUSD-PERP',  maxLeverage: 25,  category: 'forex', name: 'AUD/USD' },
  { internalSymbol: 'TSLA',    venueTicker: 'TSLAd-PERP',    maxLeverage: 10,  category: 'stock', name: 'Tesla' },
  { internalSymbol: 'SNDK',    venueTicker: 'SNDKd-PERP',    maxLeverage: 10,  category: 'stock', name: 'SanDisk' },
  { internalSymbol: 'SKHYNIX', venueTicker: 'SKHYNIX-PERP',  maxLeverage: 10,  category: 'stock', name: 'SK Hynix' },
  { internalSymbol: 'SAMSUNG', venueTicker: 'SAMSUNG-PERP',  maxLeverage: 10,  category: 'stock', name: 'Samsung' },
  { internalSymbol: 'PLTR',    venueTicker: 'PLTRd-PERP',    maxLeverage: 10,  category: 'stock', name: 'Palantir' },
  { internalSymbol: 'NVDA',    venueTicker: 'NVDAd-PERP',    maxLeverage: 10,  category: 'stock', name: 'NVIDIA' },
  { internalSymbol: 'MSTR',    venueTicker: 'MSTRd-PERP',    maxLeverage: 10,  category: 'stock', name: 'MicroStrategy' },
  { internalSymbol: 'MSFT',    venueTicker: 'MSFTd-PERP',    maxLeverage: 10,  category: 'stock', name: 'Microsoft' },
  { internalSymbol: 'META',    venueTicker: 'METAd-PERP',    maxLeverage: 10,  category: 'stock', name: 'Meta' },
  { internalSymbol: 'INTC',    venueTicker: 'INTCd-PERP',    maxLeverage: 10,  category: 'stock', name: 'Intel' },
  { internalSymbol: 'HYUNDAI', venueTicker: 'HYUNDAI-PERP',  maxLeverage: 10,  category: 'stock', name: 'Hyundai' },
  { internalSymbol: 'HOOD',    venueTicker: 'HOODd-PERP',    maxLeverage: 10,  category: 'stock', name: 'Robinhood' },
  { internalSymbol: 'HANMI',   venueTicker: 'HANMI-PERP',    maxLeverage: 10,  category: 'stock', name: 'Hanmi Financial' },
  { internalSymbol: 'GOOGL',   venueTicker: 'GOOGLd-PERP',   maxLeverage: 10,  category: 'stock', name: 'Alphabet' },
  { internalSymbol: 'CRCL',    venueTicker: 'CRCLd-PERP',    maxLeverage: 10,  category: 'stock', name: 'Circle' },
];

export const LIGHTER_MARKET_BY_SYMBOL = new Map<string, LighterMarketConfig>(
  LIGHTER_MARKETS.map((m) => [m.internalSymbol, m])
);

export const LIGHTER_MARKET_BY_VENUE_TICKER = new Map<string, LighterMarketConfig>(
  LIGHTER_MARKETS.map((m) => [m.venueTicker, m])
);

export const LIGHTER_EXCLUSIVE_SYMBOLS = new Set(LIGHTER_MARKETS.map((m) => m.internalSymbol));
