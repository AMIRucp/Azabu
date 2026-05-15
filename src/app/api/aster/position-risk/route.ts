import { NextRequest, NextResponse } from "next/server";
import { assertWalletMatchesUser } from "@/lib/asterApiUser";
import { asterFapiV3UserSignedGet } from "@/lib/asterFapiV3UserSignedGet";
import { resolveAgentSignerForUser } from "@/lib/asterUserAgentSigner";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userAddress = searchParams.get("userId");

    if (!userAddress) {
      return NextResponse.json({ error: "userId required", positions: [] }, { status: 200 });
    }

    const walletCheck = assertWalletMatchesUser(request, userAddress);
    if (!walletCheck.ok) {
      return NextResponse.json({ positions: [], error: "Unauthorized" }, { status: 200 });
    }
    const user = walletCheck.user;

    const signerResolved = await resolveAgentSignerForUser(user);
    if (!signerResolved) {
      return NextResponse.json(
        {
          positions: [],
          error:
            "Aster signer not configured. Set ASTER_SIGNER_PRIVATE_KEY or ASTER_API_PRIVATE_KEY on the server.",
        },
        { status: 200 }
      );
    }

    const result = await asterFapiV3UserSignedGet("positionRisk", user, {
      address: signerResolved.address,
      privateKey: signerResolved.privateKey,
    });

    if (!result.ok) {
      return NextResponse.json({ positions: [], error: result.error, code: result.code }, { status: 200 });
    }

    const raw = result.data;
    if (Array.isArray(raw)) {
      return NextResponse.json({ positions: raw });
    }

    return NextResponse.json({ positions: [], error: "Unexpected positionRisk response shape" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { positions: [], error: error instanceof Error ? error.message : "Unknown error" },
      { status: 200 }
    );
  }
}
