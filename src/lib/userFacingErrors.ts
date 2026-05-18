

import { asterFapiErrorNeedsTradingSetup } from "@/lib/asterTradingSetupError";

export type UserErrorContext =
  | "portfolio"
  | "trade"
  | "deposit"
  | "withdraw"
  | "send"
  | "swap"
  | "onboarding"
  | "close"
  | "generic";

const DEFAULTS: Record<UserErrorContext, string> = {
  portfolio: "Could not load account data. Please try again.",
  trade: "Trade could not be completed. Please try again.",
  deposit: "Deposit could not be completed. Please try again.",
  withdraw: "Withdrawal could not be completed. Please try again.",
  send: "Transfer could not be completed. Please try again.",
  swap: "Swap could not be completed. Please try again.",
  onboarding: "Setup could not be completed. Please try again.",
  close: "Could not close position. Please try again.",
  generic: "Something went wrong. Please try again.",
};

const DEV_PATTERNS: RegExp[] = [
  /ASTER_[A-Z_]+/i,
  /PRIVATE_KEY|API_PRIVATE|API_KEY/i,
  /signer not configured/i,
  /configured on server/i,
  /process\.env/i,
  /invalid value for value\.nonce/i,
  /INVALID_ARGUMENT/i,
  /BAD_DATA/i,
  /version=\d+\.\d+\.\d+/i,
  /eth_sendTransaction/i,
  /Signer private key does not match/i,
  /x-evm-address/i,
  /query param does not match/i,
  /does not match connected wallet/i,
  /"hash"\s*:/i,
  /"gas"\s*:/i,
  /"input"\s*:/i,
  /"nonce"\s*:\s*"undefined"/i,
  /Cannot convert undefined to a BigInt/i,
  /code=BAD_DATA/i,
  /at \/Users\//i,
  /at \/home\//i,
  /Unexpected token/i,
  /JSON\.parse/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /Proxy error/i,
  /Failed to fetch/i,
];

export function extractErrorMessage(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (raw instanceof Error) return raw.message.trim();
  if (typeof raw === "object" && raw !== null && "error" in raw) {
    const e = (raw as { error?: unknown }).error;
    if (typeof e === "string") return e.trim();
  }
  return String(raw).trim();
}

export function isDeveloperOrInternalError(message: string): boolean {
  const m = message.trim();
  if (!m) return false;
  if (m.length > 180) return true;
  return DEV_PATTERNS.some((re) => re.test(m));
}

export function shouldOfferAsterEnableTrading(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false;
  const m = raw.toLowerCase();
  if (isDeveloperOrInternalError(raw)) return false;
  if (/setup still pending|agent:\s*(ok|pending)|builder:\s*(ok|pending)/i.test(raw)) return false;
  return asterFapiErrorNeedsTradingSetup(raw) || /complete .* trading setup/.test(m);
}

function stripInternalSuffixes(message: string): string {
  return message
    .replace(/\s*—\s*re-run enable aster trading.*/i, "")
    .replace(/\s*Re-run ["']?Enable Aster Trading["']?.*/i, "")
    .trim();
}

function mapKnownUserErrors(message: string, context: UserErrorContext): string | null {
  const m = message.toLowerCase();

  if (
    /user rejected|user denied|rejected the request|action_rejected|4001/.test(m) ||
    (m.includes("rejected") && m.includes("sign"))
  ) {
    return "Transaction cancelled.";
  }

  if (/insufficient|not enough|exceeds balance/.test(m)) {
    if (context === "send") return "Insufficient balance for this transfer.";
    if (context === "deposit") return "Insufficient balance for this deposit.";
    if (context === "withdraw") return "Insufficient balance for this withdrawal.";
    return "Insufficient balance for this action.";
  }

  if (/region|geo|restricted|not available in your/.test(m)) {
    return "This service is not available in your region.";
  }

  if (/switch to arbitrum|arbitrum network/.test(m)) {
    return "Please switch to Arbitrum in your wallet.";
  }

  if (/switch to bnb|bsc|bnb smart chain/.test(m)) {
    return "Please switch to BNB Smart Chain in your wallet.";
  }

  if (/switch to hyperliquid/.test(m)) {
    return "Please switch to Hyperliquid in your wallet.";
  }

  if (/connect.*wallet|wallet not connected|missing.*wallet/.test(m)) {
    return "Connect your wallet to continue.";
  }

  if (/minimum deposit|min.*usdc/.test(m)) {
    return "Deposit amount is below the minimum.";
  }

  if (/clock sync|timestamp|nonce expired|device time/.test(m)) {
    return "Request expired. Please try again.";
  }

  if (/signature rejected/.test(m)) {
    return "Signature cancelled. Please try again.";
  }

  if (/transaction reverted|reverted on-chain/.test(m)) {
    return "Transaction failed on-chain. Please try again.";
  }

  if (/timed out|timeout/.test(m)) {
    return "Request timed out. Please try again.";
  }

  if (/no route|liquidity|amount too small/.test(m)) {
    if (context === "swap") return "No swap route available. Try a different amount or pair.";
  }

  if (/setup still pending/i.test(m)) {
    return "On-chain approvals are still processing. Wait about a minute, then tap Try Again.";
  }

  if (/astherus sign-in expired|nonce expired before we could submit|nonce expired twice/i.test(m)) {
    return "Astherus sign-in timed out on Aster’s side. Tap Try Again and approve each wallet prompt quickly.";
  }

  if (/duplicate_api_key_label|label is duplicated|could not register a new api key/i.test(m)) {
    return "Aster could not create a new API key for this wallet. Wait a minute and tap Try Again.";
  }

  if (shouldOfferAsterEnableTrading(message)) {
    return "Complete enable trading setup to continue.";
  }

  return null;
}

export function toUserFacingError(
  raw: unknown,
  context: UserErrorContext = "generic",
): string {
  const message = stripInternalSuffixes(extractErrorMessage(raw));
  if (!message) return DEFAULTS[context];

  const mapped = mapKnownUserErrors(message, context);
  if (mapped) return mapped;

  if (isDeveloperOrInternalError(message)) return DEFAULTS[context];

  if (message.length > 120) return DEFAULTS[context];

  return message;
}
