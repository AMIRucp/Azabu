import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { assertWalletMatchesUser } from "@/lib/asterApiUser";
import { ASTER_EIP712_CHAIN_ID, ASTER_FAPI_BASE } from "@/config/asterFapi";
import { asterSyncedNowMs, isLikelyAsterClockSkewError, nextAsterAuthNonceV3 } from "@/lib/asterServerTime";
import { resolveAgentSignerForUser } from "@/lib/asterUserAgentSigner";

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
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

function buildEncodedQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
}

async function signV3(rawQueryString: string, privateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.signTypedData(EIP712_DOMAIN, EIP712_TYPES, { msg: rawQueryString });
}

function normalizeAsterSymbol(symbol: string): string {
  return symbol.replace(/-/g, "").replace(/USDC$/i, "USDT").toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, symbol, orderId, origClientOrderId } = body as {
      userId?: string;
      symbol?: string;
      orderId?: string | number;
      origClientOrderId?: string;
    };

    if (!userId || !symbol) {
      return NextResponse.json({ error: "userId and symbol are required" }, { status: 400 });
    }

    const hasOrderId = orderId !== undefined && orderId !== null && String(orderId).trim() !== "";
    const hasOrig = typeof origClientOrderId === "string" && origClientOrderId.trim() !== "";
    if (!hasOrderId && !hasOrig) {
      return NextResponse.json(
        { error: "Either orderId or origClientOrderId is required" },
        { status: 400 }
      );
    }

    const walletCheck = assertWalletMatchesUser(request, String(userId));
    if (!walletCheck.ok) return walletCheck.response;
    const user = walletCheck.user;

    const signerResolved = await resolveAgentSignerForUser(user);
    if (!signerResolved) {
      return NextResponse.json(
        {
          error:
            "Aster signer not configured. Set ASTER_SIGNER_PRIVATE_KEY or ASTER_API_PRIVATE_KEY on the server.",
        },
        { status: 500 }
      );
    }

    const signerPk = signerResolved.privateKey;
    let signer: string;
    try {
      signer = ethers.getAddress(signerResolved.address);
    } catch {
      return NextResponse.json({ error: "Invalid resolved signer address" }, { status: 500 });
    }

    const pkWallet = new ethers.Wallet(signerPk);
    if (pkWallet.address.toLowerCase() !== signer.toLowerCase()) {
      return NextResponse.json({ error: "Signer key does not match signer address" }, { status: 500 });
    }

    const sym = normalizeAsterSymbol(String(symbol));

    for (let attempt = 0; attempt < 2; attempt++) {
      const now = await asterSyncedNowMs({ force: true });
      const apiNonce = nextAsterAuthNonceV3(now);

      const params: Record<string, string> = {
        symbol: sym,
      };
      if (hasOrderId) params.orderId = String(orderId).trim();
      if (hasOrig) params.origClientOrderId = origClientOrderId!.trim();
      params.nonce = apiNonce;
      params.user = user;
      params.signer = signer;

      const rawQueryString = buildRawQueryString(params);
      const signature = await signV3(rawQueryString, signerPk);
      const encodedQueryString = buildEncodedQueryString(params);

      const url = `${ASTER_FAPI_BASE}/fapi/v3/order?${encodedQueryString}&signature=${encodeURIComponent(signature)}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: AbortSignal.timeout(15000),
      });

      const data: unknown = await res.json().catch(() => ({}));
      const errObj = data as { msg?: string; message?: string; code?: number; orderId?: string | number };

      if (res.ok) {
        return NextResponse.json({ success: true, orderId: errObj.orderId, data });
      }

      const msg = errObj.msg || errObj.message || `Cancel failed (${res.status})`;

      if (attempt === 0 && isLikelyAsterClockSkewError(msg, errObj.code)) {
        continue;
      }

      return NextResponse.json({ error: msg, code: errObj.code }, { status: res.status });
    }

    return NextResponse.json({ error: "Cancel failed after retry" }, { status: 500 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
