import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getAsterAgentName } from "@/config/asterFapi";
import { getAsterSetupStatus } from "@/lib/asterSetupStatus";
import { resolveAsterFapiUserFromRequest } from "@/lib/asterApiUser";
import { deriveAgentSignerForUser } from "@/lib/asterUserAgentSigner";

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

  const signer = deriveAgentSignerForUser(user);
  if (!signer) {
    return NextResponse.json({
      user,
      agentAddress: null,
      needsCreateApiWallet: true,
      agentName: getAsterAgentName(),
    });
  }

  const status = await getAsterSetupStatus(user);

  return NextResponse.json({
    user,
    agentAddress: signer.address,
    hasApiWallet: status.hasApiWallet,
    needsCreateApiWallet: status.needsCreateApiWallet,
    agentName: getAsterAgentName(),
  });
}
