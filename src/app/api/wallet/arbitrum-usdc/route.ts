import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { arbitrum } from "viem/chains";

const ARB_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("address");
  if (!raw?.trim()) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  let address: string;
  try {
    address = ethers.getAddress(raw.trim());
  } catch {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }

  try {
    const client = createPublicClient({
      chain: arbitrum,
      transport: http("https://arb1.arbitrum.io/rpc"),
    });
    const balance = await client.readContract({
      address: ARB_USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });
    return NextResponse.json({
      address,
      balance: formatUnits(balance, 6),
      symbol: "USDC",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to read balance",
        address,
      },
      { status: 500 }
    );
  }
}
