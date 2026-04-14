// Stub — Hyperliquid backend integration removed.
// These exports keep the UI compiling without live data.

export const DEX_BADGE_COLORS: Record<string, string> = {
  CORE: '#D4A574',
  SPOT: '#3B82F6',
};

export function getDexBadge(_symbol: string): string {
  return '';
}
