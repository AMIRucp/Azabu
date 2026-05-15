export type AsterBalRow = {
  asset?: string;
  balance?: string;
  crossWalletBalance?: string;
  availableBalance?: string;
  maxWithdrawAmount?: string;
  marginBalance?: string;
  crossUnPnl?: string;
  unrealizedProfit?: string;
};

const STABLE_ASSETS = new Set(["USDC", "USDT", "BUSD", "FDUSD"]);

export function asterRowEquity(b: AsterBalRow): number {
  const balance = parseFloat(String(b.balance ?? "0"));
  const cross = parseFloat(String(b.crossWalletBalance ?? "0"));
  const unrealized = parseFloat(String(b.crossUnPnl ?? b.unrealizedProfit ?? "0"));

  if (Number.isFinite(balance) && balance > 0) {
    return balance;
  }

  let total = Number.isFinite(cross) ? cross : 0;
  if (Number.isFinite(unrealized) && unrealized !== 0) {
    total += unrealized;
  }
  return total;
}

function asterRowWithdrawable(b: AsterBalRow): number {
  const n = parseFloat(
    String(
      b.maxWithdrawAmount ??
        b.availableBalance ??
        b.balance ??
        b.crossWalletBalance ??
        "0"
    )
  );
  return Number.isFinite(n) ? n : 0;
}

export type AsterParsedBalances = {
  totalEquity: number;
  withdrawable: number;
  primaryAsset: string;
};

export function parseAsterBalances(rows: unknown[]): AsterParsedBalances | null {
  const typed = rows.filter((x): x is AsterBalRow => x !== null && typeof x === "object");
  if (typed.length === 0) return null;

  const stable = typed.filter((b) => STABLE_ASSETS.has(String(b.asset ?? "").toUpperCase()));
  const list = stable.length > 0 ? stable : typed;

  let totalEquity = 0;
  let withdrawable = 0;
  for (const b of list) {
    totalEquity += asterRowEquity(b);
    withdrawable += asterRowWithdrawable(b);
  }

  const find = (name: string) => list.find((b) => String(b.asset).toUpperCase() === name);
  const primary =
    find("USDC") ?? find("USDT") ?? find("BUSD") ?? find("FDUSD") ?? list[0];

  return {
    totalEquity,
    withdrawable,
    primaryAsset: String(primary?.asset ?? "USDC").toUpperCase(),
  };
}
