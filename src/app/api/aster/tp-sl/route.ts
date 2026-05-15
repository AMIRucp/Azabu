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

async function placeConditionalOrder(
  user: string,
  signer: string,
  signerPrivateKey: string,
  symbol: string,
  side: string,
  quantity: string,
  stopPrice: string,
  orderType: "TAKE_PROFIT_MARKET" | "STOP_MARKET"
): Promise<{ ok: boolean; error?: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const now = await asterSyncedNowMs({ force: true });
    const apiNonce = nextAsterAuthNonceV3(now);

    const params: Record<string, string> = {
      symbol,
      side,
      type: orderType,
      quantity,
      stopPrice,
      nonce: apiNonce,
      user,
      signer,
    };

    const rawQueryString = buildRawQueryString(params);
    const signature = await signV3(rawQueryString, signerPrivateKey);
    const encodedQueryString = buildEncodedQueryString(params);

    const res = await fetch(
      `${ASTER_FAPI_BASE}/fapi/v3/order?${encodedQueryString}&signature=${encodeURIComponent(signature)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: AbortSignal.timeout(10000),
      }
    );

    const data = await res.json().catch(() => ({})) as { msg?: string; message?: string; code?: number };

    if (res.ok) return { ok: true };

    const msg = data.msg || data.message || `Failed (${res.status})`;
    if (attempt === 0 && isLikelyAsterClockSkewError(msg, data.code)) continue;

    return { ok: false, error: msg };
  }
  return { ok: false, error: "Failed after retry" };
}

export async function POST(request: NextRequest) {
  try {
    const { userId, symbol, side, quantity, takeProfit, stopLoss } = await request.json();

    if (!userId || !symbol || !side || !quantity) {
      return NextResponse.json({ error: "userId, symbol, side, quantity are required" }, { status: 400 });
    }

    const walletCheck = assertWalletMatchesUser(request, String(userId));
    if (!walletCheck.ok) return walletCheck.response;
    const user = walletCheck.user;

    const signerResolved = await resolveAgentSignerForUser(user);
    if (!signerResolved) {
      return NextResponse.json(
        {
          error:
            "Signer not configured: set ASTER_SIGNER_PRIVATE_KEY or ASTER_API_PRIVATE_KEY on the server.",
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
      return NextResponse.json({ error: "Signer private key does not match signer address" }, { status: 500 });
    }

    const errors: string[] = [];

    if (takeProfit) {
      const result = await placeConditionalOrder(
        user,
        signer,
        signerPk,
        symbol,
        side,
        String(quantity),
        String(takeProfit),
        "TAKE_PROFIT_MARKET"
      );
      if (!result.ok) errors.push(`TP: ${result.error}`);
    }

    if (stopLoss) {
      const result = await placeConditionalOrder(
        user,
        signer,
        signerPk,
        symbol,
        side,
        String(quantity),
        String(stopLoss),
        "STOP_MARKET"
      );
      if (!result.ok) errors.push(`SL: ${result.error}`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to set TP/SL", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
