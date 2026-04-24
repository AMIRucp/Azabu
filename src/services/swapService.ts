import { FusionSDK, NetworkEnum, OrderStatus, PrivateKeyProviderConnector } from "@1inch/fusion-sdk";
import { computeAddress, formatUnits, JsonRpcProvider, ethers } from "ethers";

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const NODE_URL = process.env.NODE_URL!;
const DEV_PORTAL_API_TOKEN = process.env.DEV_PORTAL_API_TOKEN!;

const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const ROUTER = '0x111111125421ca6dc452d289314280a0f8842a65';
const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)'
];

class SwapService {
  private sdk: FusionSDK;
  private provider: JsonRpcProvider;

  constructor() {
    const ethersRpcProvider = new JsonRpcProvider(NODE_URL);
    
    const ethersProviderConnector = {
      eth: {
        call(transactionConfig: any) {
          return ethersRpcProvider.call(transactionConfig);
        }
      },
      extend() {}
    };

    const connector = new PrivateKeyProviderConnector(PRIVATE_KEY, ethersProviderConnector);
    
    this.sdk = new FusionSDK({
      url: 'https://api.1inch.dev/fusion',
      network: NetworkEnum.ARBITRUM,
      blockchainProvider: connector,
      authKey: DEV_PORTAL_API_TOKEN
    });

    this.provider = ethersRpcProvider;
  }

  async getQuote(params: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    walletAddress: string;
  }) {
    try {
      const quote = await this.sdk.getQuote({
        ...params,
        source: 'azabu-app'
      });

      const preset = quote.presets[quote.recommendedPreset];
      if (!preset) {
        throw new Error('Recommended preset is not available in the quote.');
      }

      return {
        success: true,
        data: {
          recommendedPreset: quote.recommendedPreset,
          presets: quote.presets,
          auctionStartAmount: preset.auctionStartAmount,
          auctionEndAmount: preset.auctionEndAmount,
          quoteId: quote.quoteId
        }
      };
    } catch (error) {
      console.error('Quote error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get quote'
      };
    }
  }

  async executeSwap(params: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    walletAddress: string;
  }) {
    try {
      // Check and ensure allowances
      await this.ensureAllowance(params.fromTokenAddress, params.amount, params.walletAddress);

      // Create order
      const preparedOrder = await this.sdk.createOrder({
        ...params,
        source: 'azabu-app'
      });

      // Submit order
      const orderInfo = await this.sdk.submitOrder(preparedOrder.order, preparedOrder.quoteId);

      return {
        success: true,
        data: {
          orderHash: orderInfo.orderHash,
          order: preparedOrder.order
        }
      };
    } catch (error) {
      console.error('Swap execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute swap'
      };
    }
  }

  async getOrderStatus(orderHash: string) {
    try {
      const status = await this.sdk.getOrderStatus(orderHash);
      return {
        success: true,
        data: status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get order status'
      };
    }
  }

  private async ensureAllowance(tokenAddress: string, amount: string, walletAddress: string) {
    const wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    // Check balance
    const balance = await token.balanceOf(walletAddress);
    if (balance < BigInt(amount)) {
      throw new Error(`Insufficient balance. Have: ${balance}, Need: ${amount}`);
    }

    // Check and approve allowances
    for (const spender of [PERMIT2, ROUTER]) {
      const allowance = await token.allowance(walletAddress, spender);
      
      if (allowance < BigInt(amount)) {
        const tx = await token.approve(spender, MAX_UINT256);
        await tx.wait();
      }
    }
  }
}

export const swapService = new SwapService();