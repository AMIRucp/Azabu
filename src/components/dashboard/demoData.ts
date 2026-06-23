import { dashboardTokens } from "./tokens";

export const DEMO_PORTFOLIO = {
  portfolio: 24840,
  todayPnl: 384.2,
  todayPnlPct: 1.57,
  unrealisedPnl: 56.2,
  positionCount: 3,
  freeMargin: 18240,
  freeMarginPct: 73.4,
  marginRatioPct: 26.6,
  rank: 14,
  xp: 3240,
  xpToPro: 2180,
  handle: "YourHandle",
  level: "L18 Trader",
} as const;

export const DEMO_TRENDING = [
  { base: "BTC", price: 93420, change24h: 2.84, volume24h: 1.2e9, oi: 480e6 },
  { base: "SOL", price: 138.2, change24h: 4.1, volume24h: 310e6, oi: 190e6 },
  { base: "DOGE", price: 0.1621, change24h: -3.4, volume24h: 88e6, oi: 41e6 },
] as const;

export const TRENDING_META: Record<string, { name: string; tag: string; tagColor: string; tagBg: string; maxLev: string }> = {
  BTC: { name: "Bitcoin", tag: "CRYPTO", tagColor: dashboardTokens.color.teal, tagBg: "rgba(0, 194, 168, 0.2)", maxLev: "200X" },
  SOL: { name: "Solana", tag: "CRYPTO", tagColor: dashboardTokens.color.teal, tagBg: "rgba(0, 194, 168, 0.2)", maxLev: "100X" },
  DOGE: { name: "Dogecoin", tag: "MEME", tagColor: dashboardTokens.color.memePink, tagBg: "rgba(244, 114, 182, 0.2)", maxLev: "50X" },
};

export const MOVER_META: Record<string, { name: string; maxLeverage: number }> = {
  SOL: { name: "Solana", maxLeverage: 100 },
  BTC: { name: "Bitcoin", maxLeverage: 200 },
  LINK: { name: "Chainlink", maxLeverage: 75 },
  GOLD: { name: "Gold", maxLeverage: 50 },
  AMZN: { name: "Amazon", maxLeverage: 10 },
  ETH: { name: "Ethereum", maxLeverage: 100 },
  DOGE: { name: "Dogecoin", maxLeverage: 50 },
};

export const DEMO_LEADERBOARD = [
  { rank: 1, callsign: "MiyamotoX", xp: 320000 },
  { rank: 2, callsign: "ShogunBull", xp: 180000 },
  { rank: 3, callsign: "NinjaVault", xp: 95000 },
  { rank: 4, callsign: "RoninFlow", xp: 42000 },
  { rank: 5, callsign: "SakuraDegen", xp: 18500 },
  { rank: 6, callsign: "IchibanHODL", xp: 8200 },
  { rank: 7, callsign: "TokyoWhale", xp: 3800 },
  { rank: 8, callsign: "KatanaKing", xp: 1200 },
] as const;
