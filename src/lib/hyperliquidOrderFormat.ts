

export function formatHlDecimal(value: number, maxDecimals: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid Hyperliquid numeric value");
  }
  let s = value.toFixed(maxDecimals);
  if (s.includes(".")) {
    s = s.replace(/0+$/, "").replace(/\.$/, "");
  }
  return s;
}

export function formatHlPerpPrice(price: number): string {
  if (price >= 10_000) return formatHlDecimal(price, 0);
  if (price >= 1_000) return formatHlDecimal(price, 1);
  if (price >= 1) return formatHlDecimal(price, 2);
  if (price >= 0.01) return formatHlDecimal(price, 4);
  return formatHlDecimal(price, 6);
}

export function formatHlSize(size: number): string {
  return formatHlDecimal(size, 6);
}

export function extractHyperliquidErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message;
    if (m.includes("deserialize") || m.includes("422")) return m;
    return m;
  }
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.body === "string") return o.body;
    try {
      return JSON.stringify(o);
    } catch {
      return "Hyperliquid request failed";
    }
  }
  return "Hyperliquid request failed";
}
