import { NextRequest } from "next/server";
import { resolveAsterFapiUserFromRequest } from "@/lib/asterApiUser";
import { coerceAsterPositionRiskRows } from "@/lib/asterPositionRiskFilter";
import { asterPositionRowIsOpen, mapAsterPositionRiskRows } from "@/lib/asterPositionMap";
import { asterFapiV3UserSignedGet } from "@/lib/asterFapiV3UserSignedGet";
import { resolveAgentSignerForUser } from "@/lib/asterUserAgentSigner";
import { asterPrivateJson } from "@/lib/asterUserApiResponse";
import {
  asterFapiErrorNeedsTradingSetup,
  ASTER_ENABLE_TRADING_MESSAGE,
} from "@/lib/asterTradingSetupError";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const queryUserId = searchParams.get("userId");
    const headerWalletRaw = request.headers.get("x-evm-address") || null;

    const resolvedUser = resolveAsterFapiUserFromRequest(request, queryUserId);
    if (!resolvedUser.ok) {
      return asterPrivateJson({
        positions: [],
        error: resolvedUser.error,
        user: null,
        debug: { headerWallet: headerWalletRaw, queryUserId },
      });
    }
    const user = resolvedUser.user;

    const signerResolved = await resolveAgentSignerForUser(user);
    if (!signerResolved) {
      return asterPrivateJson({
        positions: [],
        error:
          "Aster signer not configured. Set ASTER_SIGNER_PRIVATE_KEY or ASTER_API_PRIVATE_KEY on the server.",
        user,
        debug: { headerWallet: headerWalletRaw, queryUserId },
      });
    }

    const result = await asterFapiV3UserSignedGet("positionRisk", user, {
      address: signerResolved.address,
      privateKey: signerResolved.privateKey,
    });

    if (!result.ok) {
      const needsApproval = asterFapiErrorNeedsTradingSetup(result.error);
      return asterPrivateJson({
        positions: [],
        error: needsApproval ? ASTER_ENABLE_TRADING_MESSAGE : result.error,
        code: result.code,
        user,
        signer: signerResolved.address,
        debug: { headerWallet: headerWalletRaw, queryUserId },
      });
    }

    const arr = coerceAsterPositionRiskRows(result.data);
    if (arr) {
      const openRows = arr.filter(
        (row) => row && typeof row === "object" && asterPositionRowIsOpen(row as Record<string, unknown>)
      );
      const mapped = mapAsterPositionRiskRows(openRows);
      return asterPrivateJson({
        positions: openRows,
        mappedPositions: mapped,
        user,
        signer: signerResolved.address,
        debug: { headerWallet: headerWalletRaw, queryUserId },
      });
    }

    return asterPrivateJson({
      positions: [],
      error: "Unexpected positionRisk response shape",
      user,
      signer: signerResolved.address,
      debug: { headerWallet: headerWalletRaw, queryUserId },
    });
  } catch (error) {
    return asterPrivateJson({
      positions: [],
      error: error instanceof Error ? error.message : "Unknown error",
      user: null,
    });
  }
}
