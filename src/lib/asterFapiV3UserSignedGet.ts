import { ethers } from "ethers";
import { ASTER_EIP712_CHAIN_ID, ASTER_FAPI_BASE } from "@/config/asterFapi";
import { asterSyncedNowMs, isLikelyAsterClockSkewError, nextAsterAuthNonceV3 } from "@/lib/asterServerTime";

const EIP712_DOMAIN = {
  name: "AsterSignTransaction",
  version: "1",
  chainId: ASTER_EIP712_CHAIN_ID,
  verifyingContract: ethers.ZeroAddress,
};

const EIP712_TYPES = {
  Message: [{ name: "msg", type: "string" }],
};

function buildRawQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

function buildEncodedQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
}

async function signV3(rawQueryString: string, signerPrivateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(signerPrivateKey);
  return wallet.signTypedData(EIP712_DOMAIN, EIP712_TYPES, { msg: rawQueryString });
}

export type AsterFapiV3UserSignedPath = "balance" | "positionRisk";

const PATH_MAP: Record<AsterFapiV3UserSignedPath, string> = {
  balance: "/fapi/v3/balance",
  positionRisk: "/fapi/v3/positionRisk",
};

export async function asterFapiV3UserSignedGet(
  kind: AsterFapiV3UserSignedPath,
  userChecksummed: string,
  signer: { address: string; privateKey: string }
): Promise<{ ok: true; data: unknown } | { ok: false; error: string; code?: number }> {
  const user = ethers.getAddress(userChecksummed);
  const signerAddr = ethers.getAddress(signer.address);
  const pkWallet = new ethers.Wallet(signer.privateKey);
  if (pkWallet.address.toLowerCase() !== signerAddr.toLowerCase()) {
    return { ok: false, error: "Signer private key does not match signer address" };
  }

  const rel = PATH_MAP[kind];

  for (let attempt = 0; attempt < 2; attempt++) {
    const now = await asterSyncedNowMs({ force: attempt > 0 });
    const nonce = nextAsterAuthNonceV3(now);
    const allParams: Record<string, string> = {
      nonce,
      user,
      signer: signerAddr,
    };

    const rawQueryString = buildRawQueryString(allParams);
    const signature = await signV3(rawQueryString, signer.privateKey);
    const encodedQueryString = buildEncodedQueryString(allParams);

    const res = await fetch(
      `${ASTER_FAPI_BASE}${rel}?${encodedQueryString}&signature=${encodeURIComponent(signature)}`,
      {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
      }
    );

    const raw: unknown = await res.json().catch(() => ({}));

    if (res.ok) {
      return { ok: true, data: raw };
    }

    const errObj = raw as { msg?: string; message?: string; code?: number };
    const msg = errObj.msg || errObj.message || `Aster ${kind} request failed (${res.status})`;

    if (attempt === 0 && isLikelyAsterClockSkewError(msg, errObj.code)) {
      continue;
    }

    return { ok: false, error: msg, code: errObj.code };
  }

  return { ok: false, error: `Aster ${kind} failed after retry` };
}
