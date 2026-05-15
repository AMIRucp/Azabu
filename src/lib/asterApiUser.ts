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
