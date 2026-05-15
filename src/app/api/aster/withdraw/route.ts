import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { assertWalletMatchesUser } from "@/lib/asterApiUser";
import {
  ASTER_EIP712_CHAIN_ID,
  ASTER_FAPI_BASE,
  ARBITRUM_MAINNET_CHAIN_ID,
} from "@/config/asterFapi";
import { asterSyncedNowMs, isLikelyAsterClockSkewError, nextAsterAuthNonceV3 } from "@/lib/asterServerTime";
import { resolveAgentSignerForUser } from "@/lib/asterUserAgentSigner";

const API_AUTH_DOMAIN = {
  name: "AsterSignTransaction",
  version: "1",
  chainId: ASTER_EIP712_CHAIN_ID,
  verifyingContract: ethers.ZeroAddress,
};

const API_AUTH_TYPES = {
  Message: [{ name: "msg", type: "string" }],
};

const WITHDRAW_DOMAIN = {
  name: "Aster",
  version: "1",
  chainId: ARBITRUM_MAINNET_CHAIN_ID,
  verifyingContract: ethers.ZeroAddress,
};

const WITHDRAW_TYPES = {
  Action: [
    { name: "type",              type: "string"  },
    { name: "destination",       type: "address" },
    { name: "destination Chain", type: "string"  },
    { name: "token",             type: "string"  },
    { name: "amount",            type: "string"  },
    { name: "fee",               type: "string"  },
    { name: "nonce",             type: "uint256" },
    { name: "aster chain",       type: "string"  },
  ],
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

async function signApiAuth(rawQueryString: string, signerPrivateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(signerPrivateKey);
  return wallet.signTypedData(API_AUTH_DOMAIN, API_AUTH_TYPES, { msg: rawQueryString });
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress, amount, asset = "USDC" } = (await request.json()) as {
      userAddress?: string;
      amount?: number | string;
      asset?: string;
    };

    if (!userAddress || !amount) {
      return NextResponse.json({ error: "userAddress and amount are required" }, { status: 400 });
    }

    const amountNum = parseFloat(String(amount));
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    let fee = "0.5";
    try {
      const feeRes = await fetch(
        `https://www.asterdex.com/bapi/futures/v1/public/future/aster/estimate-withdraw-fee?chainId=${ARBITRUM_MAINNET_CHAIN_ID}&network=EVM&currency=${asset}&accountType=perp`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (feeRes.ok) {
        const feeData = await feeRes.json();
        if (feeData.data?.gasCost) fee = feeData.data.gasCost.toString();
      }
    } catch {
    }

    const userNonce = (BigInt(Date.now()) * 1000n).toString();

    return NextResponse.json({
      success: true,
      domain: WITHDRAW_DOMAIN,
      types: WITHDRAW_TYPES,
      message: {
        type: "Withdraw",
        destination: userAddress,
        "destination Chain": "Arbitrum",
        token: asset,
        amount: amountNum.toString(),
        fee,
        nonce: userNonce,
        "aster chain": "Mainnet",
      },
      fee,
      userNonce,
      asset,
      chainId: ARBITRUM_MAINNET_CHAIN_ID,
      receiver: userAddress,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to prepare withdrawal", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userAddress, amount, asset, fee, userNonce, userSignature } = (await request.json()) as {
      userAddress?: string;
      amount?: number | string;
      asset?: string;
      fee?: string;
      userNonce?: string;
      userSignature?: string;
    };

    if (!userAddress || !userSignature || userNonce === undefined || userNonce === null) {
      return NextResponse.json(
        { error: "userAddress, userNonce, and userSignature are required" },
        { status: 400 }
      );
    }

    const walletCheck = assertWalletMatchesUser(request, String(userAddress));
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
      return NextResponse.json({ error: "Resolved signer private key does not match signer address" }, { status: 500 });
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      const now = await asterSyncedNowMs({ force: true });
      const apiNonce = nextAsterAuthNonceV3(now);

      const allParams: Record<string, string> = {
        chainId: String(ARBITRUM_MAINNET_CHAIN_ID),
        asset: String(asset ?? "USDC"),
        amount: String(amount ?? ""),
        fee: String(fee ?? "0"),
        receiver: user,
        userNonce: String(userNonce),
        userSignature: String(userSignature),
        nonce: apiNonce,
        user,
        signer,
      };

      const rawQueryString = buildRawQueryString(allParams);
      const signature = await signApiAuth(rawQueryString, signerPk);
      const encodedQueryString = buildEncodedQueryString(allParams);

      const formBody = `${encodedQueryString}&signature=${encodeURIComponent(signature)}`;

      const res = await fetch(`${ASTER_FAPI_BASE}/fapi/v3/aster/user-withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
        signal: AbortSignal.timeout(15000),
      });

      const data: unknown = await res.json().catch(() => ({}));
      const errObj = data as { msg?: string; message?: string; code?: number; withdrawId?: string; hash?: string };

      if (res.ok) {
        return NextResponse.json({
          success: true,
          withdrawId: errObj.withdrawId,
          hash: errObj.hash,
        });
      }

      const msg = errObj.msg || errObj.message || `Withdrawal failed (${res.status})`;

      if (attempt === 0 && isLikelyAsterClockSkewError(msg, errObj.code)) {
        continue;
      }

      return NextResponse.json({ error: msg, code: errObj.code }, { status: res.status });
    }

    return NextResponse.json({ error: "Withdrawal failed after retry" }, { status: 500 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit withdrawal", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
