import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import {
  asterWeb3CreateApiKey,
  asterWeb3GetNonce,
  asterWeb3SignInMessage,
  getAsterWeb3IpWhitelist,
} from "@/lib/asterWeb3CreateApiKey";
import { getAsterSetupStatus } from "@/lib/asterSetupStatus";
import { deriveAgentSignerForUser } from "@/lib/asterUserAgentSigner";
import { ASTER_WEB3_SIGN_CHAIN_ID, verifyAsterWeb3SignMessage } from "@/lib/asterWeb3Sign";
import { stashAsterWeb3Nonce, takeAsterWeb3Nonce } from "@/lib/asterWeb3NonceSession";

export const dynamic = "force-dynamic";

function normalizeWallet(walletAddress: string): string | null {
  try {
    return ethers.getAddress(walletAddress.trim());
  } catch {
    return null;
  }
}

function derivedAgentPayload(userNorm: string) {
  const signer = deriveAgentSignerForUser(userNorm);
  if (!signer) return null;
  return { agentAddress: signer.address };
}

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get("walletAddress");
  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
  }

  const userNorm = normalizeWallet(walletAddress);
  if (!userNorm) {
    return NextResponse.json({ error: "Invalid walletAddress" }, { status: 400 });
  }

  const forceWeb3 = request.nextUrl.searchParams.get("forceWeb3") === "1";
  const agent = derivedAgentPayload(userNorm);

  if (!forceWeb3) {
    const status = await getAsterSetupStatus(userNorm);
    if (!status.needsCreateApiWallet && status.hasAsterAccount && agent) {
      return NextResponse.json({
        alreadyExists: true,
        agentAddress: agent.agentAddress,
      });
    }
  }

  return NextResponse.json({
    needsCreate: true,
    flow: "CREATE_API_KEY",
    ip: getAsterWeb3IpWhitelist(),
    agentAddress: agent?.agentAddress,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, prepare, signature, nonce } = body as {
      walletAddress?: string;
      prepare?: boolean;
      signature?: string;
      nonce?: string;
    };

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
    }

    const userNorm = normalizeWallet(walletAddress);
    if (!userNorm) {
      return NextResponse.json({ error: "Invalid walletAddress" }, { status: 400 });
    }

    const forceWeb3 = (body as { forceWeb3?: boolean }).forceWeb3 === true;
    const agent = derivedAgentPayload(userNorm);
    const clientMessage =
      typeof (body as { message?: string }).message === "string"
        ? (body as { message: string }).message
        : null;

    if (prepare === true || (!signature && !nonce)) {
      if (!forceWeb3) {
        const status = await getAsterSetupStatus(userNorm);
        if (!status.needsCreateApiWallet && status.hasAsterAccount && agent) {
          return NextResponse.json({
            success: true,
            alreadyExists: true,
            agentAddress: agent.agentAddress,
          });
        }
      }

      const freshNonce = await asterWeb3GetNonce(userNorm, "CREATE_API_KEY");
      const { message } = stashAsterWeb3Nonce(userNorm, freshNonce);
      return NextResponse.json({
        prepare: true,
        nonce: freshNonce,
        message,
        ip: getAsterWeb3IpWhitelist(),
        flow: "CREATE_API_KEY",
        signMethod: "signMessage",
        chainId: ASTER_WEB3_SIGN_CHAIN_ID,
        agentAddress: agent?.agentAddress,
      });
    }

    if (!signature || !nonce) {
      return NextResponse.json(
        { error: "Call POST with prepare:true for a fresh nonce, sign, then POST signature + nonce" },
        { status: 400 }
      );
    }

    const session = takeAsterWeb3Nonce(userNorm);
    const resolvedNonce = session?.nonce ?? String(nonce);
    const message =
      session?.message ??
      (clientMessage && clientMessage.includes(resolvedNonce)
        ? clientMessage
        : asterWeb3SignInMessage(resolvedNonce));

    if (!verifyAsterWeb3SignMessage(message, String(signature), userNorm)) {
      return NextResponse.json(
        {
          error:
            "Signature does not match wallet or message. Sign the exact Astherus text when prompted.",
        },
        { status: 400 }
      );
    }

    await asterWeb3CreateApiKey({
      walletAddress: userNorm,
      signature: String(signature),
      ip: getAsterWeb3IpWhitelist(),
      uniqueDesc: forceWeb3,
    });

    const derived = deriveAgentSignerForUser(userNorm);
    if (!derived) {
      return NextResponse.json({ error: "Aster signer not configured on server" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      agentAddress: derived.address,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const nonceExpired = /nonce expired/i.test(msg);
    const duplicate = /duplicate|label is duplicated/i.test(msg);
    const status = nonceExpired ? 410 : duplicate ? 409 : 500;
    return NextResponse.json(
      {
        error: msg,
        nonceExpired,
        duplicateLabel: duplicate,
        needsNewSign: nonceExpired || duplicate,
      },
      { status },
    );
  }
}
