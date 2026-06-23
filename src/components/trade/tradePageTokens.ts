/** Figma-matched design tokens for the Trade page */
export const tradePageTokens = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",

  // Figma palette
  bg: "#000000",
  green: "#00C087",
  greenDim: "rgba(0,192,135,0.10)",
  greenBorder: "rgba(0,192,135,0.40)",
  red: "#FF4D4D",
  redSoft: "#E85D5D",
  redDim: "rgba(255,77,77,0.10)",
  selectorBg: "#121212",
  selectorBorder: "rgba(255,255,255,0.10)",
  orange: "#FF7A00",
  white: "#FFFFFF",
  label: "#888888",
  muted: "#888888",
  dimText: "#555555",

  stroke: "#1E1E1E",
  strokeLight: "rgba(255,255,255,0.06)",
  cardBorder: "#262626",
  cardBg: "#111111",
  panelBg: "#000000",
  inputBg: "rgba(255,255,255,0.03)",
  tabActiveBg: "rgba(255,255,255,0.07)",

  /** Figma Trade title: white left, fades to dark grey on the right */
  titleGradient: "linear-gradient(90deg, #FFFFFF 0%, #FFFFFF 30%, #B8B8B8 58%, #4A4A4A 82%, #282828 100%)",

  orderBookWidth: 260,
  sidebarWidth: 296,
  bottomHeight: 200,
} as const;

export const CAT_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  crypto: { label: "CRYPTO", color: "#C8A050", bg: "rgba(200,160,80,0.12)", border: "rgba(200,160,80,0.25)" },
  defi: { label: "DEFI", color: "#4ADE80", bg: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.20)" },
  meme: { label: "MEME", color: "#C084FC", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.22)" },
  l1l2: { label: "L1/L2", color: "#8BA4C4", bg: "rgba(139,164,196,0.12)", border: "rgba(139,164,196,0.22)" },
  stock: { label: "STOCK", color: "#38BDF8", bg: "rgba(56,189,248,0.10)", border: "rgba(56,189,248,0.22)" },
  commodity: { label: "COMM", color: "#FBBF24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.22)" },
  index: { label: "INDEX", color: "#A78BFA", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.22)" },
  forex: { label: "FX", color: "#2DD4BF", bg: "rgba(45,212,191,0.10)", border: "rgba(45,212,191,0.22)" },
};
