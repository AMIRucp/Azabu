import { ethers } from "ethers";
import {
  ASTER_EIP712_CHAIN_ID,
  ASTER_FAPI_BASE,
  getAsterBuilderAddress,
  getAsterBuilderFeeRateString,
} from "@/config/asterFapi";
import { asterSyncedNowMs, isLikelyAsterClockSkewError, nextAsterAuthNonceV3 } from "@/lib/asterServerTime";
import { resolveAgentSignerForUser } from "@/lib/asterUserAgentSigner";

export const ASTER_CHAIN = "Mainnet";

const EIP712_DOMAIN = {
  name: "AsterSignTransaction",
  version: "1",
  chainId: ASTER_EIP712_CHAIN_ID,
  verifyingContract: ethers.ZeroAddress,
};

const EIP712_TYPES = {
  Message: [{ name: "msg", type: "string" }],
};

export type AsterResolvedSigner = {
  user: string;
  signer: string;
  privateKey: string;
  builder: string;
};

const SIGNER_CONFIG_ERROR =
  "Aster signer not configured. Set ASTER_SIGNER_PRIVATE_KEY or ASTER_API_PRIVATE_KEY on the server.";

export function buildAsterQueryString(params: Record<string, unknown>): string {
  return Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null)
    .map((k) => `${k}=${String(params[k as keyof typeof params])}`)
    .join("&");
}

export async function signAsterApiMessage(queryString: string, privateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.signTypedData(EIP712_DOMAIN, EIP712_TYPES, { msg: queryString });
}

export async function resolveAsterUserAndSigner(userWallet: string): Promise<
  | { ok: true; resolved: AsterResolvedSigner }
  | { ok: false; error: string; status: number }
> {
  let user: string;
  try {
    user = ethers.getAddress(userWallet.trim());
  } catch {
    return { ok: false, error: "Invalid userId", status: 400 };
  }

  const signerResolved = await resolveAgentSignerForUser(user);
  if (!signerResolved) {
    return { ok: false, error: SIGNER_CONFIG_ERROR, status: 500 };
  }

  let signer: string;
  let builder: string;
  try {
    signer = ethers.getAddress(signerResolved.address);
    builder = ethers.getAddress(getAsterBuilderAddress());
  } catch {
    return { ok: false, error: "Invalid signer or builder address", status: 400 };
  }

  const pkWallet = new ethers.Wallet(signerResolved.privateKey);
  if (pkWallet.address.toLowerCase() !== signer.toLowerCase()) {
    return { ok: false, error: "Signer private key does not match signer address", status: 500 };
  }

  return {
    ok: true,
    resolved: { user, signer, privateKey: signerResolved.privateKey, builder },
  };
}

export type AsterSignedFetchResult =
  | { ok: true; data: unknown; status: number }
  | { ok: false; error: string; code?: number; status: number };

export async function asterSignedFapiRequest(options: {
  method: "GET" | "POST" | "DELETE";
  path: string;
  endpointParams: Record<string, unknown>;
  user: string;
  signer: string;
  signerPrivateKey: string;
  formBody?: boolean;
  timeoutMs?: number;
}): Promise<AsterSignedFetchResult> {
  const { method, path, endpointParams, user, signer, signerPrivateKey, formBody, timeoutMs = 15000 } =
    options;

  for (let attempt = 0; attempt < 2; attempt++) {
    const now = await asterSyncedNowMs({ force: attempt > 0 });
    const apiNonce = nextAsterAuthNonceV3(now);

    const params: Record<string, unknown> = {
      ...endpointParams,
      nonce: apiNonce,
      user,
      signer,
    };

    const queryString = buildAsterQueryString(params);
    const signature = await signAsterApiMessage(queryString, signerPrivateKey);

    const encoded = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    const signedQuery = `${encoded}&signature=${encodeURIComponent(signature)}`;

    const url = formBody
      ? `${ASTER_FAPI_BASE}${path}`
      : `${ASTER_FAPI_BASE}${path}?${signedQuery}`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Azabu/1.0" },
      body: formBody ? signedQuery : method === "POST" || method === "DELETE" ? "" : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const data: unknown = await res.json().catch(() => ({}));
    const errObj = data as { msg?: string; message?: string; code?: number };

    if (res.ok) {
      return { ok: true, data, status: res.status };
    }

    const msg = errObj.msg || errObj.message || `Aster request failed (${res.status})`;
    if (attempt === 0 && isLikelyAsterClockSkewError(msg, errObj.code)) {
      continue;
    }

    return { ok: false, error: msg, code: errObj.code, status: res.status };
  }

  return { ok: false, error: "Aster request failed after retry", status: 500 };
}

export async function asterPlaceOrder(
  resolved: AsterResolvedSigner,
  orderParams: Record<string, unknown>
): Promise<AsterSignedFetchResult & { orderId?: string | number }> {
  const feeRateStr = getAsterBuilderFeeRateString();
  const result = await asterSignedFapiRequest({
    method: "POST",
    path: "/fapi/v3/order",
    user: resolved.user,
    signer: resolved.signer,
    signerPrivateKey: resolved.privateKey,
    endpointParams: {
      builder: resolved.builder,
      feeRate: feeRateStr,
      asterChain: ASTER_CHAIN,
      ...orderParams,
    },
  });

  if (!result.ok) return result;
  const d = result.data as { orderId?: string | number };
  return { ...result, orderId: d?.orderId };
}

export async function asterSetLeverage(
  resolved: AsterResolvedSigner,
  symbol: string,
  leverage: number
): Promise<void> {
  if (!leverage || leverage <= 1) return;
  try {
    await asterSignedFapiRequest({
      method: "POST",
      path: "/fapi/v3/leverage",
      user: resolved.user,
      signer: resolved.signer,
      signerPrivateKey: resolved.privateKey,
      endpointParams: {
        symbol: String(symbol),
        leverage: String(leverage),
        asterChain: ASTER_CHAIN,
      },
      timeoutMs: 8000,
    });
  } catch {
  }
}

export function agentApprovalHint(msg: string): string {
  if (/agent|builder|not approved|expired/i.test(msg)) {
    return `${msg} Re-run “Enable Aster Trading” if you changed signer keys.`;
  }
  return msg;
}
