import { NextRequest } from "next/server";
import { resolveAsterFapiUserFromRequest } from "@/lib/asterApiUser";
import { coerceAsterFapiArray } from "@/lib/asterPositionRiskFilter";
import { asterFapiV3UserSignedGet } from "@/lib/asterFapiV3UserSignedGet";
import { resolveAgentSignerForUser } from "@/lib/asterUserAgentSigner";
import { asterPrivateJson } from "@/lib/asterUserApiResponse";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 500;

function normalizeSymbol(raw: string): string {
  return String(raw)
    .trim()
    .replace(/-/g, "")
    .replace(/USDC$/i, "USDT")
    .toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const queryUserId = searchParams.get("userId");
    const symbolRaw = searchParams.get("symbol");
    const limitRaw = searchParams.get("limit");

    if (!symbolRaw?.trim()) {
      return asterPrivateJson({
        orders: [],
        error: "symbol query required (e.g. BTCUSDT)",
        user: null,
      });
    }

    const resolvedUser = resolveAsterFapiUserFromRequest(request, queryUserId);
    if (!resolvedUser.ok) {
      return asterPrivateJson({ orders: [], error: resolvedUser.error, user: null });
    }
    const user = resolvedUser.user;

    const signerResolved = await resolveAgentSignerForUser(user);
    if (!signerResolved) {
      return asterPrivateJson({
        orders: [],
        error:
          "Aster signer not configured. Set ASTER_SIGNER_PRIVATE_KEY or ASTER_API_PRIVATE_KEY on the server.",
        user,
      });
    }

    const symbol = normalizeSymbol(symbolRaw);
    let limit = limitRaw ? parseInt(limitRaw, 10) : 50;
    if (!Number.isFinite(limit) || limit < 1) limit = 50;
    limit = Math.min(MAX_LIMIT, limit);

    const result = await asterFapiV3UserSignedGet(
      "allOrders",
      user,
      {
        address: signerResolved.address,
        privateKey: signerResolved.privateKey,
      },
      { symbol, limit: String(limit) }
    );

    if (!result.ok) {
      return asterPrivateJson({ orders: [], error: result.error, code: result.code, user });
    }

    const arr = coerceAsterFapiArray(result.data);
    if (arr) {
      return asterPrivateJson({ orders: arr, user, symbol, limit });
    }

    return asterPrivateJson({
      orders: [],
      error: "Unexpected allOrders response shape",
      user,
    });
  } catch (error) {
    return asterPrivateJson({
      orders: [],
      error: error instanceof Error ? error.message : "Unknown error",
      user: null,
    });
  }
}
