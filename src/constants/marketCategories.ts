export const MARKET_CATEGORIES = [
  { id: "trending", label: "Trending", tagId: null, icon: "fire" },
  { id: "politics", label: "Politics", tagId: 2, icon: "vote" },
  { id: "sports", label: "Sports", tagId: 100639, icon: "trophy" },
  { id: "crypto", label: "Crypto", tagId: 21, icon: "bitcoin" },
  { id: "finance", label: "Finance", tagId: 120, icon: "chart" },
  { id: "geopolitics", label: "Geopolitics", tagId: 100265, icon: "globe" },
  { id: "tech", label: "Tech", tagId: 1401, icon: "cpu" },
  { id: "culture", label: "Culture", tagId: 596, icon: "film" },
] as const;

export type MarketCategoryId = (typeof MARKET_CATEGORIES)[number]["id"];

export const EVM_CHAINS = [
  { id: 1, name: "Ethereum", color: "#3B82F6" },
  { id: 137, name: "Polygon", color: "#A1A1AA" },
  { id: 8453, name: "Base", color: "#0052FF" },
  { id: 42161, name: "Arbitrum", color: "#28A0F0" },
] as const;
