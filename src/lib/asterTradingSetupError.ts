
export function asterFapiErrorNeedsTradingSetup(error: string | null | undefined): boolean {
  if (!error?.trim()) return false;
  const m = error.toLowerCase();
  return (
    /no agent found/.test(m) ||
    /agent not approved|approve.*agent|trading agent/.test(m) ||
    /builder/.test(m) ||
    /not approved/.test(m) ||
    /expired/.test(m) ||
    /signer/.test(m) ||
    /enable aster/.test(m) ||
    /enable trading/.test(m) ||
    /futures account/.test(m) ||
    /account does not exist/.test(m) ||
    /open a futures account/.test(m) ||
    /illegal parameter/.test(m) ||
    /invalid api-key|ip, or permissions/.test(m)
  );
}

export const ASTER_ENABLE_TRADING_MESSAGE = "Enable trading for this wallet.";
