import type { TxCallbacks } from "./shared";
import {
  extractHyperliquidErrorMessage,
  formatHlPerpPrice,
  formatHlSize,
} from "@/lib/hyperliquidOrderFormat";
import { toUserFacingError } from "@/lib/userFacingErrors";
import { getWalletClient } from "@wagmi/core";
import { wagmiConfig } from "@/config/wagmiConfig";
import { toAccount } from "viem/accounts";
import type { Address } from "viem";

async function switchToHyperliquidEVM() {
  const ethereum = (window as any).ethereum;
  if (!ethereum) return false;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x539" }],
    });
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x539",
            chainName: "Hyperliquid",
            nativeCurrency: { name: "Hyperliquid", symbol: "HYPE", decimals: 18 },
            rpcUrls: ["https://api.hyperliquid.xyz/evm"],
            blockExplorerUrls: ["https://explorer.hyperliquid.xyz"],
          }],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

function createWagmiAccount(walletClient: any, address: Address) {
  return toAccount({
    address,
    signMessage: async ({ message }) =>
      walletClient.signMessage({ message, account: address }),
    signTransaction: async (tx) =>
      walletClient.signTransaction({ ...tx, account: address }),
    signTypedData: async ({ domain, types, primaryType, message }) =>
      walletClient.signTypedData({ domain, types, primaryType, message, account: address }),
  });
}

interface ClosePositionParams {
  assetId: number;
  size: number;
  side: "long" | "short";
  coin: string;
  markPrice?: number;
  onSuccess?: () => void;
}

export async function executeHyperliquidClose(
  params: ClosePositionParams,
  callbacks: TxCallbacks,
) {
  const { setTxState, setTxMsg, setTxSig } = callbacks;
  const { assetId, size, side, coin, markPrice, onSuccess } = params;

  try {
    setTxState("signing");
    setTxMsg("Preparing to close position...");

    const { ExchangeClient, HttpTransport } = await import("@nktkas/hyperliquid");

    setTxMsg("Switching to Hyperliquid network...");
    const switched = await switchToHyperliquidEVM();
    if (!switched) {
      setTxMsg("Please switch to Hyperliquid network in MetaMask");
      setTxState("error");
      return;
    }

    const walletClient = await getWalletClient(wagmiConfig, { chainId: 1337 });
    if (!walletClient || !walletClient.account) {
      setTxMsg("Failed to get wallet client");
      setTxState("error");
      return;
    }

    const customAccount = createWagmiAccount(walletClient, walletClient.account.address);
    const transport = new HttpTransport();
    const exchange = new ExchangeClient({ transport, wallet: customAccount });

    if (!markPrice || markPrice <= 0) throw new Error("Invalid mark price for close order");
    if (size <= 0) throw new Error("Invalid size for close order");

    setTxMsg("Please sign close order in your wallet...");

    const isBuy = side === "short";
    const rawPrice = isBuy ? markPrice * 1.1 : markPrice * 0.9;

    const result = await exchange.order({
      orders: [{
        a: assetId,
        b: isBuy,
        p: formatHlPerpPrice(rawPrice),
        s: formatHlSize(size),
        r: true,
        t: { limit: { tif: "Ioc" } },
      }],
      grouping: "na",
    });

    if (result.status === "ok") {
      setTxMsg(`Position closed: ${coin}`);
      setTxSig(null);
      setTxState("success");
      onSuccess?.();
    } else {
      setTxMsg(toUserFacingError("Could not close position.", "close"));
      setTxState("error");
      throw new Error(toUserFacingError(null, "close"));
    }
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e ? (e as { code?: number | string }).code : undefined;
    if (code === 4001 || code === "ACTION_REJECTED") {
      setTxMsg(toUserFacingError("Transaction cancelled.", "close"));
      setTxState("error");
      throw new Error(toUserFacingError("Transaction cancelled.", "close"));
    }
    const msg = toUserFacingError(extractHyperliquidErrorMessage(e), "close");
    setTxMsg(msg);
    setTxState("error");
    throw new Error(msg);
  }
}
