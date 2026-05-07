import type { TxCallbacks } from "./shared";
import { getWalletClient } from "@wagmi/core";
import { wagmiConfig } from "@/config/wagmiConfig";
import { toAccount } from "viem/accounts";
import type { Address } from "viem";

async function switchToEthereumMainnet() {
  const ethereum = (window as any).ethereum;
  if (!ethereum) return false;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x1" }],
    });
    return true;
  } catch {
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

interface WithdrawParams {
  destination: string;
  amount: string;
  onSuccess?: () => void;
}

export async function executeHyperliquidWithdraw(
  params: WithdrawParams,
  callbacks: TxCallbacks,
) {
  const { setTxState, setTxMsg, setTxSig } = callbacks;
  const { destination, amount, onSuccess } = params;

  try {
    setTxState("signing");
    setTxMsg("Preparing withdrawal...");

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) throw new Error("Amount must be a positive number");
    if (!destination || !destination.startsWith("0x")) throw new Error("Invalid destination address");

    const { ExchangeClient, HttpTransport } = await import("@nktkas/hyperliquid");

    setTxMsg("Switching to Ethereum mainnet for withdrawal signing...");
    const switched = await switchToEthereumMainnet();
    if (!switched) {
      setTxMsg("Please switch to Ethereum mainnet in MetaMask");
      setTxState("error");
      return;
    }

    const walletClient = await getWalletClient(wagmiConfig, { chainId: 1 });
    if (!walletClient || !walletClient.account) {
      setTxMsg("Failed to get wallet client. Please reconnect your wallet.");
      setTxState("error");
      throw new Error("Wallet client not available");
    }

    const customAccount = createWagmiAccount(walletClient, walletClient.account.address);
    const transport = new HttpTransport();
    const exchange = new ExchangeClient({ transport, wallet: customAccount });

    setTxMsg("Please sign withdrawal request in your wallet...");

    const result = await exchange.withdraw3({
      destination: destination as `0x${string}`,
      amount,
    });

    if (result.status === "ok") {
      setTxMsg(`Withdrawal initiated: ${amount} USDC`);
      setTxSig(null);
      setTxState("success");
      onSuccess?.();
    } else {
      const errorMsg = JSON.stringify(result);
      setTxMsg(`Withdrawal failed: ${errorMsg}`);
      setTxState("error");
      throw new Error(`Withdrawal failed: ${errorMsg}`);
    }
  } catch (e: any) {
    if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
      setTxMsg("Transaction rejected");
      setTxState("error");
      throw new Error("Transaction rejected");
    } else {
      setTxMsg(e.message || "Failed to initiate withdrawal");
      setTxState("error");
      throw e;
    }
  }
}
