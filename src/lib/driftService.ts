export interface DriftPosition {
  market: string;
  marketIndex: number;
  direction: string;
  size: number;
  notional: number;
  unrealisedPnl: number;
}

export interface DriftAccountInfo {
  totalCollateral: number;
  freeCollateral: number;
  marginRatio: number | null;
  positions: DriftPosition[];
  spotBalances: DriftSpotBalance[];
  noAccount: boolean;
}

export interface DriftSpotBalance {
  token: string;
  marketIndex: number;
  type: "deposit" | "borrow";
  balance: number;
}

export interface DriftOrder {
  orderId: number;
  market: string;
  side: string;
  orderType: string;
  price: number;
  size: number;
}

export async function fetchDriftAccount(pubkey: string): Promise<DriftAccountInfo> {
  const res = await fetch(`/api/drift/account?pubkey=${pubkey}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch account");
  return data;
}

export async function buildPerpOrderTx(params: {
  userPublicKey: string;
  marketSymbol: string;
  direction: "long" | "short";
  usdcSize: number;
  leverage?: number;
  orderType?: "market" | "limit";
  limitPrice?: number | null;
  reduceOnly?: boolean;
}): Promise<{ txBase64: string; marketIndex: number; error?: string; needsInit?: boolean; needsDeposit?: boolean }> {
  const res = await fetch("/api/drift/perp-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}
