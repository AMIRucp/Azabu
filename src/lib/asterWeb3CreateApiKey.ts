import { ethers } from "ethers";
import { getAsterAgentIpWhitelist } from "@/config/asterFapi";

export const ASTER_BAPI_BASE = "https://www.asterdex.com";

export const ASTER_WEB3_GET_NONCE_PATH = "/bapi/futures/v1/public/future/web3/get-nonce";
export const ASTER_WEB3_CREATE_API_KEY_PATH =
  "/bapi/futures/v1/public/future/web3/broker-create-api-key";

export type AsterWeb3NonceType = "CREATE_API_KEY" | "LOGIN";

export function asterWeb3SignInMessage(nonce: string): string {
  return `You are signing into Astherus ${nonce}`;
}

export function getAsterWeb3SourceCode(): string {

  return process.env.ASTER_SOURCE_CODE?.trim() || "ae";
}

export function getAsterWeb3CreateNetwork(): string {
  return process.env.ASTER_CREATE_API_NETWORK?.trim() || "56";
}

export function getAsterWeb3IpWhitelist(): string {
  return getAsterAgentIpWhitelist();
}

const ASTER_API_KEY_DESC_MAX_LEN = 20;

export function asterWeb3ApiKeyDescForWallet(walletAddress: string): string {
  const base = (process.env.ASTER_API_KEY_DESC?.trim() || "azabu").slice(0, 10);
  const addr = ethers.getAddress(walletAddress.trim()).toLowerCase();
  const suffix = addr.slice(2, 10);
  const desc = `${base}-${suffix}`;
  return desc.length <= ASTER_API_KEY_DESC_MAX_LEN
    ? desc
    : desc.slice(0, ASTER_API_KEY_DESC_MAX_LEN);
}

export function asterWeb3ApiKeyDescRetry(baseDesc: string): string {
  const tail = (Date.now() % 10000).toString().padStart(4, "0");
  const prefix = baseDesc.slice(0, ASTER_API_KEY_DESC_MAX_LEN - 5);
  return `${prefix}-${tail}`;
}

type BapiEnvelope<T> = {
  success?: boolean;
  code?: string;
  message?: string | null;
  data?: T;
};

export type AsterWeb3CreateApiKeyResult = {
  apiKey: string;
  apiSecret: string;
  keyId?: number;
  apiName?: string | null;
};

export async function asterWeb3GetNonce(
  walletAddress: string,
  type: AsterWeb3NonceType = "CREATE_API_KEY"
): Promise<string> {
  const sourceAddr = ethers.getAddress(walletAddress.trim());

  const res = await fetch(`${ASTER_BAPI_BASE}${ASTER_WEB3_GET_NONCE_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceAddr, type }),
    signal: AbortSignal.timeout(8000),
  });

  const data = (await res.json().catch(() => ({}))) as BapiEnvelope<{ nonce?: string }>;

  if (!res.ok || !data.success || !data.data?.nonce) {
    throw new Error(data.message || "Failed to get nonce");
  }

  return String(data.data.nonce);
}

function buildCreateApiKeyBody(
  sourceAddr: string,
  signature: string,
  desc: string,
  opts?: { network?: string; ip?: string; sourceCode?: string }
): Record<string, string> {

  return {
    desc,
    ip: opts?.ip?.trim() ?? getAsterWeb3IpWhitelist() ?? "",
    network: opts?.network ?? getAsterWeb3CreateNetwork(),
    signature,
    sourceAddr,
    type: "CREATE_API_KEY",
    sourceCode: opts?.sourceCode ?? getAsterWeb3SourceCode(),
  };
}

async function asterWeb3CreateApiKeyRequest(
  sourceAddr: string,
  signature: string,
  desc: string,
  opts?: { network?: string; ip?: string; sourceCode?: string }
): Promise<AsterWeb3CreateApiKeyResult> {
  const res = await fetch(`${ASTER_BAPI_BASE}${ASTER_WEB3_CREATE_API_KEY_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      clientType: "broker",
      accept: "*/*",
    },
    body: JSON.stringify(buildCreateApiKeyBody(sourceAddr, signature, desc, opts)),
    signal: AbortSignal.timeout(15000),
  });

  const data = (await res.json().catch(() => ({}))) as BapiEnvelope<{
    apiKey?: string;
    apiSecret?: string;
    keyId?: number;
    apiName?: string | null;
  }>;

  if (!res.ok || !data.success || !data.data?.apiKey) {
    const msg = data.message || "Failed to create API key";
    if (/account does not exist|open a futures account/i.test(msg)) {
      throw new Error(
        `${msg} — For regular wallets use ASTER_SOURCE_CODE=ae (see Aster web3-api-key-demo).`
      );
    }
    const err = new Error(msg) as Error & { duplicateLabel?: boolean; authFailed?: boolean };
    if (/label is duplicated|duplicate/i.test(msg)) {
      err.duplicateLabel = true;
    }
    if (/nonce expired/i.test(msg)) {
      (err as Error & { nonceExpired?: boolean }).nonceExpired = true;
    }
    if (/auth failed|signature|illegal parameter/i.test(msg)) {
      err.authFailed = true;
    }
    throw err;
  }

  return {
    apiKey: data.data.apiKey,
    apiSecret: data.data.apiSecret ?? "",
    keyId: data.data.keyId,
    apiName: data.data.apiName,
  };
}

export async function asterWeb3CreateApiKey(params: {
  walletAddress: string;
  signature: string;
  desc?: string;
  network?: string;
  ip?: string;
  sourceCode?: string;
  /** When true, never retry create with the same signature (nonce is single-use). */
  uniqueDesc?: boolean;
}): Promise<AsterWeb3CreateApiKeyResult> {
  const sourceAddr = ethers.getAddress(params.walletAddress.trim());
  const baseDesc = params.desc ?? asterWeb3ApiKeyDescForWallet(sourceAddr);
  const desc = params.uniqueDesc ? asterWeb3ApiKeyDescRetry(baseDesc) : baseDesc;
  const opts = {
    network: params.network,
    ip: params.ip,
    sourceCode: params.sourceCode,
  };

  return asterWeb3CreateApiKeyRequest(sourceAddr, params.signature, desc, opts);
}
