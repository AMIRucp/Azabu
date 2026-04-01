export interface LeverageVenue {
  name: string;
  maxNativeLeverage: number;
  hasMultiplier: boolean;
  chain: string;
}

const VENUES: LeverageVenue[] = [
  { name: "aster", maxNativeLeverage: 300, hasMultiplier: false, chain: "arbitrum" },
  { name: "hyperliquid", maxNativeLeverage: 200, hasMultiplier: false, chain: "hyperliquid" },
];

const GLOBAL_EFFECTIVE_CAP = 300;

export interface EffectiveLeverageResult {
  effective: number;
  safe: boolean;
  maxAllowed: number;
  venue: LeverageVenue | null;
  warning: string | null;
}

export function calcEffectiveLeverage(
  venue: string,
  nativeLev: number,
  multiplier: number = 1
): EffectiveLeverageResult {
  const v = VENUES.find(x => x.name === venue) ?? null;
  const effective = nativeLev * multiplier;
  const maxAllowed = GLOBAL_EFFECTIVE_CAP;

  let warning: string | null = null;
  if (effective > maxAllowed) {
    warning = `Effective leverage ${effective.toFixed(0)}x exceeds platform cap of ${maxAllowed}x`;
  } else if (v && nativeLev > v.maxNativeLeverage) {
    warning = `Native leverage ${nativeLev}x exceeds ${v.name} max of ${v.maxNativeLeverage}x`;
  } else if (effective >= 75) {
    warning = "Extreme leverage — liquidation within 1-2% price move";
  } else if (effective >= 50) {
    warning = "High effective leverage — increased liquidation risk";
  }

  const safe =
    effective <= maxAllowed &&
    (!v || nativeLev <= v.maxNativeLeverage) &&
    multiplier >= 1;

  return { effective, safe, maxAllowed, venue: v, warning };
}

export function getVenue(name: string): LeverageVenue | undefined {
  return VENUES.find(v => v.name === name);
}

export function venueSupportsMultiplier(_chain: string): boolean {
  return false;
}

export function getMaxMultiplierForAsset(symbol: string, nativeLev: number): number {
  const cap = GLOBAL_EFFECTIVE_CAP;
  const maxMult = Math.floor(cap / Math.max(nativeLev, 1));
  return Math.min(Math.max(maxMult, 1), 4);
}
