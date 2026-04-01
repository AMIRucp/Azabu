const DRIFT_MAX_LEVERAGE: Record<string, number> = {
  SOL: 20, BTC: 20, ETH: 20, BONK: 10, APT: 10, POL: 10,
  ARB: 10, DOGE: 10, BNB: 10, SUI: 10, PEPE: 10, OP: 10,
  RNDR: 10, XRP: 10, HNT: 10, INJ: 10, LINK: 10, JTO: 10,
  TIA: 10, JUP: 10, WIF: 10,
};

export function getMaxLeverage(platform: 'drift', market: string): number {
  const sym = market.toUpperCase().replace(/-PERP$/, '').replace(/\/USD$/, '');
  return DRIFT_MAX_LEVERAGE[sym] || 10;
}

export function validateLeverage(
  platform: 'drift',
  requestedLeverage: number,
  market: string
): { valid: boolean; maxAllowed: number; message?: string } {
  const maxAllowed = getMaxLeverage(platform, market);

  if (requestedLeverage > maxAllowed) {
    const sym = market.toUpperCase().replace(/-PERP$/, '').replace(/\/USD$/, '');
    return {
      valid: false,
      maxAllowed,
      message: `Max leverage for ${sym} on Drift is ${maxAllowed}x. Try: long ${sym} at ${maxAllowed}x`,
    };
  }
  return { valid: true, maxAllowed };
}
