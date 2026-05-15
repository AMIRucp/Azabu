import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { assertWalletMatchesUser } from "@/lib/asterApiUser";
import { checkAsterWalletSeparation } from "@/lib/asterDeployWalletCheck";
import { asterFapiV3UserSignedGet } from "@/lib/asterFapiV3UserSignedGet";
import { resolveAgentSignerForUser } from "@/lib/asterUserAgentSigner";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userAddress = searchParams.get("userId");

    if (!userAddress) {
      return NextResponse.json({ error: "userId required", balances: [] }, { status: 200 });
    }

    const walletCheck = assertWalletMatchesUser(request, userAddress);
    if (!walletCheck.ok) {
      let user = userAddress;
      try {
        user = ethers.getAddress(String(userAddress).trim());
      } catch {
      }
      return NextResponse.json({ balances: [], error: "Unauthorized", user }, { status: 200 });
    }
    const user = walletCheck.user;
    const separation = checkAsterWalletSeparation(user);
    const meta = {
      user: separation.user,
      signer: separation.signer,
      builder: separation.builder,
      userIsSigner: separation.userIsSigner,
      userIsBuilder: separation.userIsBuilder,
      warning: separation.warning,
    };

    const signerResolved = await resolveAgentSignerForUser(user);
    if (!signerResolved) {
      return NextResponse.json(
        {
          balances: [],
          error:
            "Aster signer not configured. Set ASTER_SIGNER_PRIVATE_KEY or ASTER_API_PRIVATE_KEY on the server.",
          ...meta,
        },
        { status: 200 }
      );
    }

    const result = await asterFapiV3UserSignedGet("balance", user, {
      address: signerResolved.address,
      privateKey: signerResolved.privateKey,
    });

    if (!result.ok) {
      return NextResponse.json(
        { balances: [], error: result.error, code: result.code, ...meta },
        { status: 200 }
      );
    }

    const raw = result.data;

    if (Array.isArray(raw)) {
      return NextResponse.json({ balances: raw, ...meta });
    }

    return NextResponse.json(
      { balances: [], error: "Unexpected balance response shape", ...meta },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { balances: [], error: error instanceof Error ? error.message : "Unknown error" },
      { status: 200 }
    );
  }
}
