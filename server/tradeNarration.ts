function fmtPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  if (price >= 0.01) return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  return price.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 8 });
}

function fmtAmount(amount: number): string {
  if (amount >= 1e6) return (amount / 1e6).toFixed(2) + 'M';
  if (amount >= 1e3) return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (amount >= 1) return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function fmtPct(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export function narrateSwap(
  from: string,
  to: string,
  amount: number,
  outAmount: number,
  priceImpact?: number,
): string {
  const perToken = amount > 0 ? outAmount / amount : 0;
  let narration = `Swapped ${fmtAmount(amount)} ${from} for ${fmtAmount(outAmount)} ${to}`;
  if (perToken > 0 && from !== to) {
    narration += ` at $${fmtPrice(perToken)} per token`;
  }
  narration += '.';
  if (priceImpact !== undefined && priceImpact > 0) {
    narration += ` Price impact: ${priceImpact.toFixed(2)}%.`;
  }
  return narration;
}

export function narratePerpsOpen(
  side: string,
  market: string,
  leverage: number,
  collateral: number,
  sizeUsd: number,
  entryPrice: number | null,
  liquidationPrice?: number | null,
): string {
  let narration = `Opened ${leverage}x ${side} ${market}-PERP`;
  if (entryPrice) {
    narration += ` at $${fmtPrice(entryPrice)}`;
  }
  narration += `. Position value: $${fmtAmount(sizeUsd)} on $${fmtAmount(collateral)} collateral.`;
  if (liquidationPrice) {
    narration += ` Est. liquidation: $${fmtPrice(liquidationPrice)}.`;
  }
  return narration;
}

export function narratePerpsClose(
  market: string,
  side: string,
  entryPrice: number,
  exitPrice: number,
  pnl: number,
  pnlPct: number,
): string {
  const pnlSign = pnl >= 0 ? '+' : '';
  return `Closed ${side} ${market}-PERP. Entry: $${fmtPrice(entryPrice)}, Exit: $${fmtPrice(exitPrice)}. PnL: ${pnlSign}$${fmtPrice(Math.abs(pnl))} (${fmtPct(pnlPct)}).`;
}

export function narrateLend(
  action: 'supply' | 'withdraw' | 'borrow' | 'repay',
  amount: number,
  token: string,
  protocol: string,
  apy?: number,
): string {
  const actionLabel = action === 'supply' ? 'Supplied' : action === 'withdraw' ? 'Withdrew' : action === 'borrow' ? 'Borrowed' : 'Repaid';
  let narration = `${actionLabel} ${fmtAmount(amount)} ${token} ${action === 'withdraw' ? 'from' : 'to'} ${protocol}`;
  if (apy !== undefined && apy > 0) {
    narration += ` at ${apy.toFixed(1)}% APY`;
  }
  narration += '.';
  return narration;
}

export function narrateStake(
  action: 'stake' | 'unstake',
  amount: number,
  token: string,
  protocol: string,
  outputToken?: string,
): string {
  if (action === 'stake') {
    return `Staked ${fmtAmount(amount)} ${token} via ${protocol}${outputToken ? ` for ${outputToken}` : ''}.`;
  }
  return `Unstaked ${fmtAmount(amount)} ${token} via ${protocol}${outputToken ? ` back to ${outputToken}` : ''}.`;
}

export function narrateAlert(
  token: string,
  targetPrice: number,
  direction: 'above' | 'below',
): string {
  return `Alert set: ${token} ${direction} $${fmtPrice(targetPrice)}.`;
}

export function narrateSend(
  amount: number,
  token: string,
  recipient: string,
): string {
  const shortAddr = recipient.length > 12
    ? `${recipient.slice(0, 4)}...${recipient.slice(-4)}`
    : recipient;
  return `Sent ${fmtAmount(amount)} ${token} to ${shortAddr}.`;
}

export function narrateDCA(
  action: 'create' | 'cancel',
  inputToken: string,
  outputToken: string,
  amountPerCycle?: number,
  frequency?: string,
  numCycles?: number,
): string {
  if (action === 'cancel') {
    return `Cancelled recurring ${inputToken} to ${outputToken} buy order.`;
  }
  let narration = `Set up recurring buy: ${fmtAmount(amountPerCycle || 0)} ${inputToken} to ${outputToken}`;
  if (frequency) narration += ` ${frequency}`;
  if (numCycles) narration += ` for ${numCycles} cycles`;
  narration += '.';
  return narration;
}
