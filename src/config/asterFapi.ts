export const ASTER_FAPI_BASE =
  (typeof process !== "undefined" && process.env.ASTER_FAPI_BASE?.replace(/\/$/, "")) ||
  "https://fapi.asterdex.com";

export const ARBITRUM_MAINNET_CHAIN_ID = 42161;

const _eip = parseInt(process.env.ASTER_EIP712_CHAIN_ID ?? "", 10);
export const ASTER_EIP712_CHAIN_ID =
  Number.isFinite(_eip) && _eip > 0 ? _eip : 1666;

const _rw = parseInt(process.env.ASTER_RECV_WINDOW_MS ?? "60000", 10);
export const ASTER_RECV_WINDOW_MS = String(
  Math.min(60_000, Math.max(5_000, Number.isFinite(_rw) && _rw > 0 ? _rw : 60_000))
);

export const ASTER_FAPI_SERVER_TIME_PATH = "/fapi/v3/time" as const;

export function asterFapiServerTimeUrl(): string {
  return `${ASTER_FAPI_BASE}${ASTER_FAPI_SERVER_TIME_PATH}`;
}

export function getAsterSignerAddress(): string {
  if (typeof process === "undefined") return "";
  return (process.env.ASTER_SIGNER_ADDRESS || process.env.ASTER_API_KEY || "").trim();
}

export function getAsterSignerPrivateKey(): string {
  if (typeof process === "undefined") return "";
  return (process.env.ASTER_SIGNER_PRIVATE_KEY || process.env.ASTER_API_PRIVATE_KEY || "").trim();
}

export function getAsterAgentName(): string {
  if (typeof process === "undefined") return "Azabu";
  return process.env.ASTER_AGENT_NAME?.trim() || "Azabu";
}

export function getAsterBuilderAddress(): string {
  const b = typeof process !== "undefined" && process.env.ASTER_BUILDER_ADDRESS?.trim();
  if (b) return b;
  return getAsterSignerAddress();
}

export function getAsterBuilderFeeRateString(): string {
  return String(process.env.ASTER_BUILDER_FEE_RATE ?? "0.00001");
}

export function getAsterBuilderMaxFeeRateString(): string {
  return String(process.env.ASTER_BUILDER_MAX_FEE_RATE ?? process.env.ASTER_BUILDER_FEE_RATE ?? "0.00001");
}

export function getAsterAgentIpWhitelist(): string {
  if (typeof process === "undefined") return "";
  return process.env.ASTER_IP_WHITELIST?.trim() || "";
}
