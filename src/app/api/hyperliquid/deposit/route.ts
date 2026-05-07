import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseUnits, type Address } from "viem";
import { arbitrum } from "viem/chains";

const HYPERLIQUID_BRIDGE = (process.env.HYPERLIQUID_BRIDGE_ADDRESS ) as Address;
const USDC_ARBITRUM = (process.env.USDC_ARBITRUM_ADDRESS ) as Address;
const MIN_DEPOSIT_AMOUNT = 5;

const USDC_PERMIT_ABI = [
  {
    name: "nonces",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const BRIDGE_ABI = [
  {
    name: "batchedDepositWithPermit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "deposits",
        type: "tuple[]",
        components: [
          { name: "user", type: "address" },
          { name: "usd", type: "uint64" },
          { name: "deadline", type: "uint64" },
          {
            name: "signature",
            type: "tuple",
            components: [
              { name: "r", type: "uint256" },
              { name: "s", type: "uint256" },
              { name: "v", type: "uint8" },
            ],
          },
        ],
      },
    ],
    outputs: [],
  },
] as const;

const PERMIT_DOMAIN = {
  name: "USD Coin",
  version: "2",
  chainId: 42161,
  verifyingContract: USDC_ARBITRUM,
} as const;

const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

let publicClient: ReturnType<typeof createPublicClient> | null = null;

function getPublicClient() {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: arbitrum,
      transport: http("https://arb1.arbitrum.io/rpc"),
    });
  }
  return publicClient;
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress, amount } = await request.json();

    if (!userAddress || !amount) {
      return NextResponse.json(
        { error: "userAddress and amount are required" },
        { status: 400 }
      );
    }

    if (amount < MIN_DEPOSIT_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum deposit amount is ${MIN_DEPOSIT_AMOUNT} USDC` },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    const client = getPublicClient();
    const address = userAddress as Address;

    const [balanceWei, nonce] = await Promise.all([
      client.readContract({
        address: USDC_ARBITRUM,
        abi: USDC_PERMIT_ABI,
        functionName: "balanceOf",
        args: [address],
      }),
      client.readContract({
        address: USDC_ARBITRUM,
        abi: USDC_PERMIT_ABI,
        functionName: "nonces",
        args: [address],
      }),
    ]);

    const balance = Number(balanceWei) / 1e6;

    if (balance < amount) {
      return NextResponse.json(
        { error: `Insufficient USDC balance. You have ${balance.toFixed(2)} USDC` },
        { status: 400 }
      );
    }

    const amountWei = parseUnits(amount.toString(), 6);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

    const message = {
      owner: address,
      spender: HYPERLIQUID_BRIDGE,
      value: amountWei,
      nonce,
      deadline,
    };

    return NextResponse.json({
      success: true,
      balance,
      domain: PERMIT_DOMAIN,
      types: PERMIT_TYPES,
      message: {
        owner: message.owner,
        spender: message.spender,
        value: message.value.toString(),
        nonce: message.nonce.toString(),
        deadline: message.deadline.toString(),
      },
      amountUsd: Math.floor(amount * 1e6),
      bridgeAddress: HYPERLIQUID_BRIDGE,
      bridgeAbi: BRIDGE_ABI,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to prepare deposit", details: errorMessage },
      { status: 500 }
    );
  }
}
