import type { TxCallbacks, HyperliquidTradeParams } from "./shared";
import { recordTradeToDb } from "./shared";
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

export async function executeHyperliquidTrade(
  params: HyperliquidTradeParams,
  callbacks: TxCallbacks,
) {
  const { setTxState, setTxMsg, setTxSig } = callbacks;
  const { market, side, sizeNum, lev, otype, price, evmAddress, assetId, onTradeSuccess } = params;

  try {
    setTxState("signing");

    const coin = market.sym
      .replace(/-USDC$/i, "")
      .replace(/-USDT$/i, "")
      .replace(/-PERP$/i, "")
      .replace(/USDT$/i, "")
      .replace(/USDC$/i, "");

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

    if (assetId === undefined) {
      setTxMsg(`Select ${coin} from the market list so Hyperliquid asset id is set`);
      setTxState("error");
      return;
    }

    const isMarket = otype === "market";

    if (sizeNum <= 0) {
      setTxMsg("Order size must be greater than zero");
      setTxState("error");
      return;
    }

    if (!market.price || market.price <= 0) {
      setTxMsg("Invalid price for order");
      setTxState("error");
      return;
    }

    setTxMsg("Please sign order in your wallet...");

    const isBuy = side === "long";
    const rawPrice = isMarket
      ? isBuy
        ? market.price * 1.1
        : market.price * 0.9
      : parseFloat(price) || market.price;

    const result = await exchange.order({
      orders: [{
        a: assetId,
        b: isBuy,
        p: formatHlPerpPrice(rawPrice),
        s: formatHlSize(sizeNum),
        r: false,
        t: isMarket ? { limit: { tif: "Ioc" } } : { limit: { tif: "Gtc" } },
      }],
      grouping: "na",
    });

    if (result.status === "ok") {
      setTxMsg("Order placed on Hyperliquid");
      setTxSig(null);
      setTxState("success");

      recordTradeToDb({
        wallet: evmAddress,
        protocol: "hyperliquid",
        chain: "hyperliquid",
        market: coin,
        side,
        sizeUsd: sizeNum * market.price,
        entryPrice: market.price,
        leverage: lev,
        txSignature: "hl-" + Date.now(),
      });

      onTradeSuccess?.();
    } else {
      setTxMsg(toUserFacingError("Order could not be placed.", "trade"));
      setTxState("error");
    }
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e ? (e as { code?: number | string }).code : undefined;
    if (code === 4001 || code === "ACTION_REJECTED") {
      setTxMsg(toUserFacingError("Transaction cancelled.", "trade"));
    } else {
      setTxMsg(toUserFacingError(extractHyperliquidErrorMessage(e), "trade"));
    }
    setTxState("error");
  }
}
