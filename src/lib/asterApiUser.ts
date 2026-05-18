import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

export const ASTER_WALLET_HEADER = "x-evm-address";

export function getWalletFromRequest(request: NextRequest): string | null {
  const raw = request.headers.get(ASTER_WALLET_HEADER);
  if (!raw?.trim()) return null;
  try {
    return ethers.getAddress(raw.trim());
  } catch {
    return null;
  }
}

export function assertWalletMatchesUser(
  request: NextRequest,
  claimedUser: string
): { ok: true; user: string } | { ok: false; response: NextResponse } {
  let user: string;
  try {
    user = ethers.getAddress(String(claimedUser).trim());
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Invalid userId" }, { status: 400 }) };
  }

  if (process.env.ASTER_SKIP_WALLET_BIND === "1") {
    return { ok: true, user };
  }

  const headerWallet = getWalletFromRequest(request);
  if (!headerWallet) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing x-evm-address header (connect wallet)" },
        { status: 401 }
      ),
    };
  }

  if (headerWallet.toLowerCase() !== user.toLowerCase()) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Wallet does not match userId" }, { status: 403 }),
    };
  }

  return { ok: true, user };
}

export function resolveAsterFapiUserFromRequest(
  request: NextRequest,
  queryUserId: string | null
): { ok: true; user: string } | { ok: false; error: string } {
  const rawQuery = queryUserId?.trim() || null;
  const headerWallet = getWalletFromRequest(request);

  if (process.env.ASTER_SKIP_WALLET_BIND === "1") {

    if (headerWallet) {
      if (rawQuery) {
        let queryAddr: string;
        try {
          queryAddr = ethers.getAddress(rawQuery);
        } catch {
          return { ok: false, error: "Invalid userId" };
        }
        if (queryAddr.toLowerCase() !== headerWallet.toLowerCase()) {
          return {
            ok: false,
            error: "userId query param does not match x-evm-address (remove userId to use the connected wallet)",
          };
        }
      }
      return { ok: true, user: headerWallet };
    }
    if (!rawQuery?.trim()) {
      return { ok: false, error: "userId query param or x-evm-address header required" };
    }
    try {
      return { ok: true, user: ethers.getAddress(rawQuery.trim()) };
    } catch {
      return { ok: false, error: "Invalid userId address" };
    }
  }

  if (!headerWallet) {
    return { ok: false, error: "Missing x-evm-address header (connect wallet)" };
  }

  if (!rawQuery) {
    return { ok: true, user: headerWallet };
  }

  let queryAddr: string;
  try {
    queryAddr = ethers.getAddress(rawQuery);
  } catch {
    return { ok: false, error: "Invalid userId" };
  }

  if (queryAddr.toLowerCase() !== headerWallet.toLowerCase()) {
    return { ok: false, error: "userId must match connected wallet (x-evm-address)" };
  }

  return { ok: true, user: queryAddr };
}
