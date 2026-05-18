import { NextRequest } from "next/server";
import { resolveAsterFapiUserFromRequest } from "@/lib/asterApiUser";
import { checkAsterWalletSeparation } from "@/lib/asterDeployWalletCheck";
import { coerceAsterFapiArray } from "@/lib/asterPositionRiskFilter";
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
        balances: [],
        error: resolvedUser.error,
        queriedUser: null,
        debug: { headerWallet: headerWalletRaw, queryUserId },
      });
    }
    const user = resolvedUser.user;
    const separation = checkAsterWalletSeparation(user);
    const baseMeta = {
      user: separation.user,
      builder: separation.builder,
      userIsBuilder: separation.userIsBuilder,
      warning: separation.warning,
    };

    const signerResolved = await resolveAgentSignerForUser(user);
    if (!signerResolved) {
      return asterPrivateJson({
        balances: [],
        error:
          "Aster signer not configured. Set ASTER_SIGNER_PRIVATE_KEY or ASTER_API_PRIVATE_KEY on the server.",
        ...baseMeta,
        signer: null,
        userIsSigner: false,
        debug: { headerWallet: headerWalletRaw, queryUserId },
      });
    }

    const signer = signerResolved.address;
    const userIsSigner = user.toLowerCase() === signer.toLowerCase();
    const meta = {
      ...baseMeta,
      signer,
      userIsSigner,
    };

    const result = await asterFapiV3UserSignedGet("balance", user, {
      address: signer,
      privateKey: signerResolved.privateKey,
    });

    if (!result.ok) {
      const needsApproval = asterFapiErrorNeedsTradingSetup(result.error);
      return asterPrivateJson({
        balances: [],
        error: needsApproval ? ASTER_ENABLE_TRADING_MESSAGE : result.error,
        code: result.code,
        ...meta,
        debug: { headerWallet: headerWalletRaw, queryUserId },
      });
    }

    const arr = coerceAsterFapiArray(result.data);
    if (arr) {
      return asterPrivateJson({
        balances: arr,
        ...meta,
        debug: { headerWallet: headerWalletRaw, queryUserId },
      });
    }

    return asterPrivateJson({
      balances: [],
      error: "Unexpected balance response shape",
      ...meta,
      debug: { headerWallet: headerWalletRaw, queryUserId },
    });
  } catch (error) {
    return asterPrivateJson({
      balances: [],
      error: error instanceof Error ? error.message : "Unknown error",
      queriedUser: null,
    });
  }
}
