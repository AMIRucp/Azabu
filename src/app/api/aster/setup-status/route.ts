import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { resolveAsterFapiUserFromRequest } from "@/lib/asterApiUser";
import { getAsterSetupStatus } from "@/lib/asterSetupStatus";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const queryUser = searchParams.get("userAddress");

  const resolved = resolveAsterFapiUserFromRequest(request, queryUser);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  let user: string;
  try {
    user = ethers.getAddress(resolved.user);
  } catch {
    return NextResponse.json({ error: "Invalid userAddress" }, { status: 400 });
  }

  const status = await getAsterSetupStatus(user);

  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      Vary: "x-evm-address",
    },
  });
}
