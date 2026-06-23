export type ActivePage =
  | "home"
  | "trade"
  | "perps"
  | "swap"
  | "portfolio"
  | "settings"
  | "leaderboard";

export type NavItem = {
  id: ActivePage | "predictions";
  label: string;
  disabled?: boolean;
  comingSoon?: boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  { id: "home", label: "Dashboard" },
  { id: "trade", label: "Trade" },
  { id: "perps", label: "Markets" },
  { id: "portfolio", label: "Portfolio", disabled: true },
];

export const SECONDARY_NAV: NavItem[] = [
  { id: "swap", label: "Swap" },
  { id: "leaderboard", label: "Leaderboard" },
];

export const EXTRA_NAV: NavItem[] = [
  { id: "predictions", label: "Predictions", disabled: true, comingSoon: true },
];

export const VALID_PAGES = new Set<ActivePage>([
  "home",
  "trade",
  "perps",
  "swap",
  "portfolio",
  "settings",
  "leaderboard",
]);
