export const MARKET_TICKER_ASSETS = [
  { label: "BTC", bases: ["BTC"] },
  { label: "ETH", bases: ["ETH"] },
  { label: "SOL", bases: ["SOL"] },
  { label: "GOLD", bases: ["GOLD", "PAXG"] },
  { label: "DOGE", bases: ["DOGE"] },
  { label: "HYPE", bases: ["HYPE"] },
  { label: "LINK", bases: ["LINK"] },
  { label: "XRP", bases: ["XRP"] },
  { label: "BNB", bases: ["BNB"] },
] as const;

export const MARKET_TICKER_LABELS = MARKET_TICKER_ASSETS.map((t) => t.label);
