import { NextRequest, NextResponse } from "next/server";
import { swapBuildSchema } from '@server/validation';
import { JUPITER_FEE_ACCOUNT, JUPITER_PLATFORM_FEE_BPS } from "@/config/integratorFees";

const JUP_API = "https://api.jup.ag/swap/v1";
const API_KEY = process.env.JUPITER_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = swapBuildSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const body = parsed.data as Record<string, unknown>;

    // Inject integrator fee account + bps if configured and not already set by client
    if (JUPITER_FEE_ACCOUNT && !body.feeAccount) {
      body.feeAccount = JUPITER_FEE_ACCOUNT;
    }
    if (JUPITER_PLATFORM_FEE_BPS > 0 && body.quoteResponse && typeof body.quoteResponse === "object") {
      const qr = body.quoteResponse as Record<string, unknown>;
      if (!qr.platformFeeBps) {
        qr.platformFeeBps = JUPITER_PLATFORM_FEE_BPS;
      }
    }

    const res = await fetch(`${JUP_API}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { "x-api-key": API_KEY } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Swap build error:", err);
    return NextResponse.json({ error: "Swap build failed" }, { status: 502 });
  }
}
