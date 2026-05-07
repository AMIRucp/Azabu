import type { TxCallbacks } from "./shared";
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
    const aggressivePrice = isBuy
      ? (markPrice * 1.10).toFixed(2)
      : (markPrice * 0.90).toFixed(2);

    const result = await exchange.order({
      orders: [{
        a: assetId,
        b: isBuy,
        p: aggressivePrice,
        s: size.toString(),
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
      const errorMsg = JSON.stringify(result);
      setTxMsg(`Close failed: ${errorMsg}`);
      setTxState("error");
      throw new Error(`Close failed: ${errorMsg}`);
    }
  } catch (e: any) {
    if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
      setTxMsg("Transaction rejected");
      setTxState("error");
      throw new Error("Transaction rejected");
    } else {
      setTxMsg(e.message || "Failed to close position");
      setTxState("error");
      throw e;
    }
  }
}
