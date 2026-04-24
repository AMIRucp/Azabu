import { NextRequest, NextResponse } from "next/server";
import { fusionSwapService } from "@/services/fusionSwapService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteId, signature } = body;

    if (!quoteId || !signature) {
      return NextResponse.json(
        { error: "Missing required parameters: quoteId and signature" },
        { status: 400 }
      );
    }

    const result = await fusionSwapService.submitOrder({ quoteId, signature });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
