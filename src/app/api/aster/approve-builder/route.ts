import { NextRequest, NextResponse } from "next/server";
import { ASTER_FAPI_BASE, getAsterBuilderAddress, getAsterBuilderMaxFeeRateString } from "@/config/asterFapi";
import { asterSyncedNowMs, nextAsterAuthNonceV3 } from "@/lib/asterServerTime";

const ASTER_CHAIN = process.env.ASTER_CHAIN?.trim() || "Mainnet";
const CHAIN_ID = 56;
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
  const builderAddr = getAsterBuilderAddress();
  if (!builderAddr) {
    return NextResponse.json({ error: "ASTER_BUILDER_ADDRESS or signer not configured" }, { status: 500 });
  }

  const serverMs = await asterSyncedNowMs({ force: true });
  const nonce = parseInt(nextAsterAuthNonceV3(serverMs), 10);
  const maxFee = getAsterBuilderMaxFeeRateString();

  const signingParams: Record<string, unknown> = {
    builder: builderAddr,
    maxFeeRate: maxFee,
    builderName: BUILDER_NAME,
    asterChain: ASTER_CHAIN,
    user: userAddress,
    nonce,
  };

  const message = capitalizeKeys(signingParams);

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

  const types = { ApproveBuilder: typeFields };

  const postParams: Record<string, unknown> = {
    ...signingParams,
    signatureChainId: CHAIN_ID,
  };

  return NextResponse.json({ domain, types, primaryType: "ApproveBuilder", message, postParams });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.userAddress && !body.signature) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const { postParams, signature } = body as {
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
    const url = `${ASTER_FAPI_BASE}/fapi/v3/approveBuilder?${queryString}`;

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
