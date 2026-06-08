export function parseOneinchApiError(error: unknown): string {
  const err = error as {
    response?: {
      status?: number;
      data?: {
        description?: string;
        error?: string;
        message?: string;
        meta?: Array<{ type?: string; value?: string }>;
      };
    };
    message?: string;
  };

  const data = err?.response?.data;
  const meta = data?.meta;
  if (Array.isArray(meta)) {
    const reason = meta.find((m) => m.type === "reason")?.value ?? "";
    if (/not enough balance/i.test(reason)) {
      return "Insufficient balance or 1inch token approval. Approve the source token in your wallet, then try again.";
    }
  }
  const fromBody =
    (typeof data?.description === "string" && data.description) ||
    (typeof data?.error === "string" && data.error) ||
    (typeof data?.message === "string" && data.message) ||
    "";

  let msg = fromBody || (error instanceof Error ? error.message : "") || "Unknown error";
  const lower = msg.toLowerCase();

  if (/request failed with status code/.test(lower) && fromBody) {
    msg = fromBody;
  }

  if (/swap amount too small|amount too small/.test(lower)) {
    return "Amount is too small for this bridge pair.";
  }
  if (/pathfinder|no route|not supported|unsupported pair/.test(lower)) {
    return "No bridge route for this pair. Try different tokens or chains.";
  }
  if (/insufficient liquidity|liquidity/.test(lower)) {
    return "Insufficient liquidity for this bridge.";
  }
  if (/invalid address/.test(lower)) {
    return "Invalid wallet address. Reconnect your wallet and try again.";
  }
  if (/invalid order/.test(lower)) {
    return "Bridge order was rejected by 1inch. Check token approval and balance, then try again.";
  }
  if (/not enough balance|allowance|not enough balance or allowance/.test(lower)) {
    return "Insufficient balance or 1inch token approval. Approve the source token in your wallet, then try again.";
  }
  if (/invalid signature/.test(lower)) {
    return "Signature rejected. Try the bridge again and confirm in your wallet.";
  }

  return msg;
}

export function oneinchApiHttpStatus(error: unknown): number {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (typeof status === "number" && status >= 400 && status < 500) return status;
  return 500;
}
