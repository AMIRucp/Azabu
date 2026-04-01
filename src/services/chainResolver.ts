export type TradeChain = "arbitrum" | "hyperliquid";

export interface ExecutionPlan {
  needsBridge: boolean;
  sourceChain: TradeChain;
  targetChain: TradeChain;
  protocol: string;
  bridgeAmount: number;
  arbBalance: number;
  solBalance: number;
  requiredAmount: number;
}

interface ResolveParams {
  marketSymbol: string;
  chain: TradeChain;
  collateral: number;
  pairId?: number;
  evmAddress?: string | null;
}

interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

function detectProtocol(symbol: string): string {
  if (symbol.endsWith("USDT")) return "aster";
  return "hyperliquid";
}

async function getErc20Balance(address: string, tokenContract: string, provider: EIP1193Provider): Promise<number> {
  try {
    const { ethers } = await import("ethers");
    const bp = new ethers.BrowserProvider(provider as never);
    const contract = new ethers.Contract(
      tokenContract,
      ["function balanceOf(address) view returns (uint256)"],
      bp,
    );
    const bal = await contract.balanceOf(address);
    return Number(bal) / 1e6;
  } catch {
    return 0;
  }
}

const ARB_USDC_ADDR = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const ARB_USDT_ADDR = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";

export async function resolveExecution(
  params: ResolveParams,
  evmProvider?: EIP1193Provider | null,
): Promise<ExecutionPlan> {
  const { marketSymbol, collateral, evmAddress } = params;
  const protocol = detectProtocol(marketSymbol);
  const requiredAmount = collateral * 1.02;
  const isAster = protocol === "aster";

  let arbBalance = 0;

  if (evmAddress && evmProvider) {
    if (isAster) {
      arbBalance = await getErc20Balance(evmAddress, ARB_USDT_ADDR, evmProvider);
      if (arbBalance < requiredAmount) {
        const usdcBal = await getErc20Balance(evmAddress, ARB_USDC_ADDR, evmProvider);
        arbBalance = Math.max(arbBalance, usdcBal);
      }
    } else {
      arbBalance = await getErc20Balance(evmAddress, ARB_USDC_ADDR, evmProvider);
    }
  }

  return {
    needsBridge: false,
    sourceChain: "arbitrum",
    targetChain: "arbitrum",
    protocol,
    bridgeAmount: 0,
    arbBalance,
    solBalance: 0,
    requiredAmount,
  };
}
