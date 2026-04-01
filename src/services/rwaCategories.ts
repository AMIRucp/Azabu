export type AssetCategory =
  | "CRYPTO"
  | "DEFI"
  | "L1"
  | "L2"
  | "MEME"
  | "AI"
  | "COMMODITY"
  | "EQUITY_US"
  | "EQUITY_KR"
  | "ETF"
  | "PRELAUNCH";

export interface TradingHours {
  days: string;
  utcOpen: string;
  utcClose: string;
  description: string;
}

export interface MarketMeta {
  symbol: string;
  displayName: string;
  category: AssetCategory;
  tradingHoursInfo: TradingHours | null;
  icon: string;
}

const TRADING_HOURS: Partial<Record<AssetCategory, TradingHours>> = {
  COMMODITY: {
    days: "Sun-Fri",
    utcOpen: "Sun 23:00",
    utcClose: "Fri 22:00",
    description: "Sunday 23:00 - Friday 22:00 UTC",
  },
  EQUITY_US: {
    days: "Mon-Fri",
    utcOpen: "14:30",
    utcClose: "21:00",
    description: "Monday-Friday 14:30 - 21:00 UTC",
  },
  EQUITY_KR: {
    days: "Mon-Fri",
    utcOpen: "00:00",
    utcClose: "06:30",
    description: "Monday-Friday 00:00 - 06:30 UTC",
  },
  ETF: {
    days: "Mon-Fri",
    utcOpen: "14:30",
    utcClose: "21:00",
    description: "Monday-Friday 14:30 - 21:00 UTC",
  },
};

const CATEGORY_ICONS: Record<AssetCategory, string> = {
  CRYPTO: "C",
  DEFI: "DF",
  L1: "L1",
  L2: "L2",
  MEME: "MM",
  AI: "AI",
  COMMODITY: "CM",
  EQUITY_US: "US",
  EQUITY_KR: "KR",
  ETF: "IX",
  PRELAUNCH: "PL",
};

export function getTradingHours(category: AssetCategory): TradingHours | null {
  return TRADING_HOURS[category] || null;
}

export const RWA_RULES = {
  marginMode: "isolated" as const,
  liquidationMethod: "IOC-then-ADL",
  liquidationFees: false,
  fundingContinuous: true,
  markPriceCapOutsideHours: 0.005,
  liquidityPool: "XLP",
} as const;
