import { FusionSDK, NetworkEnum, OrderStatus } from "@1inch/fusion-sdk";
import { JsonRpcProvider, ethers } from "ethers";

const ROUTER = "0x111111125421ca6dc452d289314280a0f8842a65";

const CHAIN_TO_NETWORK: Record<number, NetworkEnum> = {
  1:     NetworkEnum.ETHEREUM,
  42161: NetworkEnum.ARBITRUM,
};

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
];

type OrderCacheEntry = { order: any; quoteId: string; typedData: any; timeoutId: NodeJS.Timeout; chainId: number };
const g = globalThis as typeof globalThis & { _fusionOrderCache?: Map<string, OrderCacheEntry> };
if (!g._fusionOrderCache) g._fusionOrderCache = new Map<string, OrderCacheEntry>();
const orderCache = g._fusionOrderCache;

class FusionSwapService {
  private sdks: Map<number, FusionSDK> = new Map();
  private provider: JsonRpcProvider | null = null;

  private getSDK(chainId: number): FusionSDK {
    if (this.sdks.has(chainId)) return this.sdks.get(chainId)!;

    const DEV_PORTAL_API_TOKEN = process.env.DEV_PORTAL_API_TOKEN;
    const NODE_URL = process.env.NODE_URL;

    if (!DEV_PORTAL_API_TOKEN || !NODE_URL) {
      throw new Error("Missing DEV_PORTAL_API_TOKEN or NODE_URL environment variables");
    }

    const network = CHAIN_TO_NETWORK[chainId];
    if (!network) throw new Error(`Unsupported chain: ${chainId}`);

    if (!this.provider) {
      this.provider = new JsonRpcProvider(NODE_URL);
    }

    const ethersProviderConnector = {
      eth: { call: (tx: any) => this.provider!.call(tx) },
      extend: () => {},
    };

    const sdk = new FusionSDK({
      url: "https://api.1inch.dev/fusion",
      network,
      blockchainProvider: ethersProviderConnector as any,
      authKey: DEV_PORTAL_API_TOKEN,
    });

    this.sdks.set(chainId, sdk);
    return sdk;
  }

  private initializeSDK() {
    const NODE_URL = process.env.NODE_URL;
    if (!NODE_URL) throw new Error("Missing NODE_URL");
    if (!this.provider) this.provider = new JsonRpcProvider(NODE_URL);
  }

  // STEP 1: Get Quote
  async getQuote(params: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    walletAddress: string;
    chainId: number;
    preset?: string;
  }) {
    try {
      const sdk = this.getSDK(params.chainId);

      const quoteParams: any = {
        fromTokenAddress: params.fromTokenAddress,
        toTokenAddress: params.toTokenAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
        source: "azabu-swap",
      };

      if (params.preset) quoteParams.preset = params.preset;

      const quote = await sdk.getQuote(quoteParams);

      const presetKey = (params.preset || quote.recommendedPreset) as "fast" | "medium" | "slow";
      const preset = quote.presets[presetKey];
      if (!preset) throw new Error("Preset not found in quote");

      const quoteId = quote.quoteId || `quote-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      return {
        success: true,
        quoteId,
        presets: quote.presets,
        recommendedPreset: quote.recommendedPreset,
        auctionStartAmount: preset.auctionStartAmount,
        auctionEndAmount: preset.auctionEndAmount,
      };
    } catch (error: any) {
      const apiError = error?.response?.data?.description || error?.response?.data?.error || error?.response?.data?.message;
      const errMsg = apiError || (error instanceof Error ? error.message : "Unknown error");
      
      if (errMsg.includes("liquidity") || errMsg.includes("Liquidity")) {
        throw new Error("Insufficient liquidity for this pair");
      } else if (errMsg.includes("not supported") || errMsg.includes("unsupported")) {
        throw new Error("This token pair is not supported");
      } else if (errMsg.includes("amount") && errMsg.includes("small")) {
        throw new Error("Amount too small for this swap");
      } else if (errMsg.toLowerCase().includes("pathfinder") || errMsg.toLowerCase().includes("no route")) {
        throw new Error("No swap route found for this pair");
      }
      throw new Error(errMsg);
    }
  }

  // STEP 2: Create Order
  async createOrder(params: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    walletAddress: string;
    chainId: number;
    preset?: string;
  }) {
    try {
      const sdk = this.getSDK(params.chainId);
      const network = CHAIN_TO_NETWORK[params.chainId];

      const orderParams: any = {
        fromTokenAddress: params.fromTokenAddress,
        toTokenAddress: params.toTokenAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
        source: "azabu-swap",
      };

      if (params.preset) orderParams.preset = params.preset;

      const preparedOrder = await sdk.createOrder(orderParams);
      const typedData = preparedOrder.order.getTypedData(network);

      const CACHE_TTL_MS = 10 * 60 * 1000;
      const timeoutId = setTimeout(() => {
        orderCache.delete(preparedOrder.quoteId);
      }, CACHE_TTL_MS);

      orderCache.set(preparedOrder.quoteId, {
        order: preparedOrder.order,
        quoteId: preparedOrder.quoteId,
        typedData,
        timeoutId,
        chainId: params.chainId,
      });

      return {
        success: true,
        quoteId: preparedOrder.quoteId,
        typedData,
      };
    } catch (error: any) {
      const apiError = error?.response?.data?.description || error?.response?.data?.error || error?.response?.data?.message;
      const errMsg = apiError || (error instanceof Error ? error.message : "Unknown error");

      if (errMsg.toLowerCase().includes("insufficient amount") || errMsg.toLowerCase().includes("amount too small")) {
        throw new Error("Amount too small, try a larger amount");
      } else if (errMsg.toLowerCase().includes("balance") || errMsg.toLowerCase().includes("allowance")) {
        throw new Error("Insufficient balance or token not approved");
      } else if (errMsg.toLowerCase().includes("liquidity")) {
        throw new Error("Insufficient liquidity for this swap");
      } else if (errMsg.toLowerCase().includes("expired") || errMsg.toLowerCase().includes("stale")) {
        throw new Error("Quote expired, please try again");
      }
      throw new Error(errMsg);
    }
  }

  async submitOrder(params: { quoteId: string; signature: string }) {
    try {
      const cached = orderCache.get(params.quoteId);
      if (!cached) {
        throw new Error(`Order not found in cache for quoteId: ${params.quoteId}. Has the server restarted?`);
      }

      const sdk = this.getSDK(cached.chainId);

      let info: any;
      try {
        info = await (sdk as any)._submitOrder(cached.order, cached.quoteId, params.signature);
      } catch (submitErr: any) {
        const responseData = submitErr?.response?.data;
        const errorDesc = responseData?.description || responseData?.error || responseData?.message;
        if (errorDesc) {
          if (errorDesc.includes("NotEnoughBalanceOrAllowance")) throw new Error("Insufficient balance or token not approved");
          if (errorDesc.includes("liquidity") || errorDesc.includes("Liquidity")) throw new Error("Insufficient liquidity for this swap");
          if (errorDesc.includes("slippage") || errorDesc.includes("Slippage")) throw new Error("Price moved too much. Try increasing slippage tolerance");
          throw new Error(errorDesc);
        }
        throw submitErr;
      }

      clearTimeout(cached.timeoutId);
      orderCache.delete(params.quoteId);

      return { success: true, orderHash: info.orderHash, status: "submitted" };
    } catch (error: any) {
      const apiError = error?.response?.data?.description || error?.response?.data?.error || error?.response?.data?.message;
      const errMsg = apiError || (error instanceof Error ? error.message : "Unknown error");
      
      if (errMsg.toLowerCase().includes("balance") || errMsg.toLowerCase().includes("allowance")) {
        throw new Error("Insufficient balance or token not approved");
      } else if (errMsg.toLowerCase().includes("liquidity")) {
        throw new Error("Insufficient liquidity for this swap");
      } else if (errMsg.toLowerCase().includes("slippage")) {
        throw new Error("Price moved too much. Try increasing slippage tolerance");
      } else if (errMsg.toLowerCase().includes("expired") || errMsg.toLowerCase().includes("stale")) {
        throw new Error("Order expired. Please try again");
      } else if (errMsg.toLowerCase().includes("signature") || errMsg.toLowerCase().includes("invalid")) {
        throw new Error("Invalid signature. Please try again");
      }
      throw new Error(errMsg);
    }
  }

  async getOrderStatus(orderHash: string, chainId: number = 42161) {
    try {
      const sdk = this.getSDK(chainId);
      const data = await sdk.getOrderStatus(orderHash);
      return {
        success: true,
        status: data.status,
        fills: data.fills || [],
        isCompleted: data.status === OrderStatus.Filled,
        isExpired: data.status === OrderStatus.Expired,
        isCancelled: data.status === OrderStatus.Cancelled,
      };
    } catch (error) {
      throw new Error(`Get order status failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async checkAllowance(params: {
    tokenAddress: string;
    walletAddress: string;
    amount: string;
  }): Promise<{ needsApproval: boolean; currentAllowance: string }> {
    try {
      this.initializeSDK();
      if (!this.provider) throw new Error("Provider not initialized");

      const token = new ethers.Contract(params.tokenAddress, ERC20_ABI, this.provider);
      const routerAllowance = await token.allowance(params.walletAddress, ROUTER);
      const needsApproval = BigInt(routerAllowance.toString()) < BigInt(params.amount);

      return { needsApproval, currentAllowance: routerAllowance.toString() };
    } catch (error) {
      throw new Error(`Check allowance failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

export const fusionSwapService = new FusionSwapService();
