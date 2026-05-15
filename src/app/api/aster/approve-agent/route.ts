import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { ASTER_FAPI_BASE, getAsterBuilderAddress, getAsterBuilderMaxFeeRateString } from "@/config/asterFapi";
import { asterSyncedNowMs, nextAsterAuthNonceV3 } from "@/lib/asterServerTime";
import { resolveAgentSignerForUser } from "@/lib/asterUserAgentSigner";

const ASTER_CHAIN = process.env.ASTER_CHAIN?.trim() || "Mainnet";
const CHAIN_ID = 56;
const AGENT_EXPIRED = 1867945395040;
const AGENT_NAME = process.env.ASTER_AGENT_NAME?.trim() || "azabu";
const BUILDER_NAME = process.env.ASTER_BUILDER_NAME?.trim() || "azabu";

function inferType(v: unknown): string {
  if (typeof v === "boolean") return "bool";
  if (typeof v === "number" && Number.isInteger(v)) return "uint256";
  return "string";
}

function capitalizeKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k.charAt(0).toUpperCase() + k.slice(1)] = v;
  }
  return result;
}

function buildQueryString(params: Record<string, unknown>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join("&");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userAddress = searchParams.get("userAddress");

  if (!userAddress) {
    return NextResponse.json({ error: "userAddress required" }, { status: 400 });
  }

  let userNorm: string;
  try {
    userNorm = ethers.getAddress(userAddress.trim());
  } catch {
    return NextResponse.json({ error: "Invalid userAddress" }, { status: 400 });
  }

  const resolved = await resolveAgentSignerForUser(userNorm);
  if (!resolved) {
    return NextResponse.json(
      {
        error:
          "Signer not configured: set ASTER_SIGNER_PRIVATE_KEY or ASTER_API_PRIVATE_KEY on the server (address is derived from the key).",
      },
      { status: 500 }
    );
  }

  const builderAddr = getAsterBuilderAddress();
  const maxFee = getAsterBuilderMaxFeeRateString();

  const serverMs = await asterSyncedNowMs({ force: true });
  const nonce = parseInt(nextAsterAuthNonceV3(serverMs), 10);

  const rawParams: Record<string, unknown> = {
    agentName: AGENT_NAME,
    agentAddress: resolved.address,
    ipWhitelist: "",
    expired: AGENT_EXPIRED,
    canSpotTrade: true,
    canPerpTrade: true,
    canWithdraw: false,
    builder: builderAddr,
    maxFeeRate: maxFee,
    builderName: BUILDER_NAME,
    asterChain: ASTER_CHAIN,
    user: userNorm,
    nonce,
  };

  const message = capitalizeKeys(rawParams);
  const typeFields = Object.entries(message).map(([name, val]) => ({
    name,
    type: inferType(val),
  }));

  const domain = {
    name: "AsterSignTransaction",
    version: "1",
    chainId: CHAIN_ID,
    verifyingContract: "0x0000000000000000000000000000000000000000",
  };

  const types = { ApproveAgent: typeFields };

  const postParams: Record<string, unknown> = {
    ...rawParams,
    signatureChainId: CHAIN_ID,
  };

  return NextResponse.json({
    domain,
    types,
    primaryType: "ApproveAgent",
    message,
    postParams,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { postParams, signature } = await request.json() as {
      postParams: Record<string, unknown>;
      signature: string;
    };

    if (!postParams || !signature) {
      return NextResponse.json({ error: "postParams and signature required" }, { status: 400 });
    }

    const p = { ...(postParams as Record<string, unknown>) };
    const signatureChainId = p.signatureChainId;
    delete p.signatureChainId;
    const allParams: Record<string, unknown> = { ...p, signature, signatureChainId };
    const queryString = buildQueryString(allParams);
    const url = `${ASTER_FAPI_BASE}/fapi/v3/approveAgent?${queryString}`;


    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "NodeApp/1.0" },
      body: "",
      signal: AbortSignal.timeout(15000),
    });

    const rawText = await res.text();

    let data: Record<string, unknown> = {};
    try { data = JSON.parse(rawText); } catch { }
    const errObj = data as { msg?: string; message?: string; error?: string; code?: number };

    if (!res.ok) {
      const errMsg = errObj.msg || errObj.message || errObj.error || rawText || `Failed (${res.status})`;
      if (/already exists/i.test(errMsg)) {
        return NextResponse.json({ success: true, alreadyExists: true });
      }
      return NextResponse.json({ error: errMsg, code: errObj.code, raw: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
