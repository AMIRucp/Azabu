import { ethers } from "ethers";
import { ERC20_APPROVE_ABI, FUSION_PLUS_LOP_ROUTER } from "@/config/bridgeConfig";
import { NATIVE_EVM } from "@/config/bridgeEvmChains";

const APPROVE_IFACE = new ethers.Interface(ERC20_APPROVE_ABI);

function toAtomicUnits(amount: string, decimals: number): bigint {
  const cleaned = amount.replace(/,/g, "").trim();
  if (!cleaned || cleaned === ".") return 0n;
  const [whole = "0", frac = ""] = cleaned.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  return BigInt((whole + paddedFrac).replace(/^0+/, "") || "0");
}

function isStableSymbol(symbol: string): boolean {
  return ["USDC", "USDT", "DAI", "USD"].includes(symbol.toUpperCase());
}

function deriveEthUsdPrice(
  fromAmount: number,
  toAmount: number,
  fromSymbol: string,
  toSymbol: string,
): number | null {
  if (!Number.isFinite(fromAmount) || !Number.isFinite(toAmount) || fromAmount <= 0 || toAmount <= 0) {
    return null;
  }
  if (fromSymbol.toUpperCase() === "ETH" && isStableSymbol(toSymbol)) return toAmount / fromAmount;
  if (toSymbol.toUpperCase() === "ETH" && isStableSymbol(fromSymbol)) return fromAmount / toAmount;
  return null;
}

function formatNativeGasCost(wei: bigint, nativeSymbol: string): string {
  if (wei <= 0n) return "Free";
  const native = parseFloat(ethers.formatUnits(wei, 18));
  if (!Number.isFinite(native) || native <= 0) return "Free";
  if (native < 0.000001) return `< 0.000001 ${nativeSymbol}`;
  return `${native.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${nativeSymbol}`;
}

function formatUsdCost(wei: bigint, ethUsdPrice: number | null): string | null {
  if (wei <= 0n || ethUsdPrice == null || !Number.isFinite(ethUsdPrice) || ethUsdPrice <= 0) {
    return null;
  }
  const native = parseFloat(ethers.formatUnits(wei, 18));
  if (!Number.isFinite(native) || native <= 0) return null;
  const usd = native * ethUsdPrice;
  if (usd < 0.01) return "< $0.01";
  return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatFusionPlusGasDisplay(params: {
  totalWei: bigint;
  nativeSymbol?: string;
  ethUsdPrice?: number | null;
}): string {
  const nativeSymbol = params.nativeSymbol ?? "ETH";
  const native = formatNativeGasCost(params.totalWei, nativeSymbol);
  if (native === "Free") return native;
  const usd = formatUsdCost(params.totalWei, params.ethUsdPrice ?? null);
  return usd ? `${native} (${usd})` : native;
}

export async function estimateFusionPlusSwapGas(params: {
  provider: ethers.Provider;
  walletAddress: string;
  srcTokenAddress: string;
  srcTokenDecimals: number;
  amount: string;
  nativeSymbol?: string;
  ethUsdPrice?: number | null;
}): Promise<{ totalWei: bigint; display: string; needsApproval: boolean }> {
  const nativeSymbol = params.nativeSymbol ?? "ETH";
  const isNative = params.srcTokenAddress.toLowerCase() === NATIVE_EVM.toLowerCase();
  if (isNative) {
    return { totalWei: 0n, display: "Free", needsApproval: false };
  }

  const atomic = toAtomicUnits(params.amount, params.srcTokenDecimals);
  if (atomic <= 0n) {
    return { totalWei: 0n, display: "—", needsApproval: false };
  }

  const token = new ethers.Contract(params.srcTokenAddress, ERC20_APPROVE_ABI, params.provider);
  const allowance = BigInt((await token.allowance(params.walletAddress, FUSION_PLUS_LOP_ROUTER)).toString());
  if (allowance >= atomic) {
    return { totalWei: 0n, display: "Free", needsApproval: false };
  }

  const data = APPROVE_IFACE.encodeFunctionData("approve", [FUSION_PLUS_LOP_ROUTER, ethers.MaxUint256]);
  const gasLimit = await params.provider.estimateGas({
    from: params.walletAddress,
    to: params.srcTokenAddress,
    data,
  });

  const feeData = await params.provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;
  const totalWei = gasLimit * gasPrice;

  return {
    totalWei,
    needsApproval: true,
    display: formatFusionPlusGasDisplay({
      totalWei,
      nativeSymbol,
      ethUsdPrice: params.ethUsdPrice,
    }),
  };
}

export { deriveEthUsdPrice };
