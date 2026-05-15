import { NextRequest, NextResponse } from "next/server";

const ASTER_BASE = "https://www.asterdex.com";
const SOURCE_CODE = process.env.ASTER_SOURCE_CODE || "azabu";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const walletAddress = searchParams.get("walletAddress");

  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
  }

  const res = await fetch(`${ASTER_BASE}/bapi/futures/v1/public/future/web3/get-nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceAddr: walletAddress, type: "CREATE_API_KEY" }),
    signal: AbortSignal.timeout(8000),
  });

  const data = await res.json().catch(() => ({}));
  const d = data as { success?: boolean; data?: { nonce?: string }; message?: string };

  if (!res.ok || !d.success || !d.data?.nonce) {
    return NextResponse.json(
      { error: d.message || "Failed to get nonce" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    nonce: d.data.nonce,
    message: `You are signing into Astherus ${d.data.nonce}`,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature } = await request.json();

    if (!walletAddress || !signature) {
      return NextResponse.json({ error: "walletAddress and signature required" }, { status: 400 });
    }

    const res = await fetch(
      `${ASTER_BASE}/bapi/futures/v1/public/future/web3/broker-create-api-key`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "clientType": "broker",
          "accept": "*/*",
        },
        body: JSON.stringify({
          desc: "azabu-platform",
          ip: "",
          network: "ETH",
          signature,
          sourceAddr: walletAddress,
          type: "CREATE_API_KEY",
          sourceCode: SOURCE_CODE,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    const data = await res.json().catch(() => ({}));
    const d = data as {
      success?: boolean;
      data?: { apiKey?: string; apiSecret?: string; keyId?: string; apiName?: string };
      message?: string;
      code?: string;
    };

    if (!res.ok || !d.success || !d.data?.apiKey) {
      return NextResponse.json(
        { error: d.message || "Failed to create API key" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      apiKey: d.data.apiKey,
      apiSecret: d.data.apiSecret,
      keyId: d.data.keyId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
