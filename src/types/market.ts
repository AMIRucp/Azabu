import type { Protocol, Chain, MarketType } from '@/config/protocolRegistry';

export interface UnifiedMarket {
  id: string;
  protocol: Protocol;
  chain: Chain;
  type: MarketType;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  openInterest?: number;
  fundingRate?: number;
  maxLeverage?: number;
  markPrice?: number;
  indexPrice?: number;
  category?: string;
  name?: string;
  isMarketOpen?: boolean;
  isDayTradingClosed?: boolean;
  overnightMaxLeverage?: number | null;
  closingFee?: number;
  assetId?: number;
}
