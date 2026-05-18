import { ethers } from "ethers";
import { getAsterWeb3CreateNetwork } from "@/lib/asterWeb3CreateApiKey";

export const ASTER_WEB3_SIGN_CHAIN_ID = Number(getAsterWeb3CreateNetwork()) || 56;
export const ASTER_WEB3_BSC_CHAIN_HEX = "0x38";

export function asterWeb3SignInMessageBytes(message: string): string {
  return ethers.hexlify(ethers.toUtf8Bytes(message));
}

export function verifyAsterWeb3SignMessage(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  const want = ethers.getAddress(expectedAddress).toLowerCase();
  const payloads: (string | Uint8Array)[] = [
    message,
    ethers.getBytes(asterWeb3SignInMessageBytes(message)),
  ];
  for (const payload of payloads) {
    try {
      const recovered = ethers.verifyMessage(payload, signature);
      if (recovered.toLowerCase() === want) return true;
    } catch {
      /* try next encoding */
    }
  }
  return false;
}

type EthProvider = {
  chainId?: string;
  request: (args: { method: string; params: unknown[] }) => Promise<string>;
};

export async function ensureWalletOnBscChain(ethereum: EthProvider): Promise<string | undefined> {
  const previous = ethereum.chainId;
  if (previous?.toLowerCase() === ASTER_WEB3_BSC_CHAIN_HEX) return previous;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ASTER_WEB3_BSC_CHAIN_HEX }],
    });
  } catch (switchErr: unknown) {
    const se = switchErr as { code?: number };
    if (se?.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ASTER_WEB3_BSC_CHAIN_HEX,
            chainName: "BNB Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com"],
          },
        ],
      });
    } else {
      throw new Error("Please switch to BNB Smart Chain (chain 56) to sign for Aster.");
    }
  }
  return previous;
}

export async function restoreWalletChain(ethereum: EthProvider, chainIdHex?: string): Promise<void> {
  if (!chainIdHex || chainIdHex.toLowerCase() === ASTER_WEB3_BSC_CHAIN_HEX) return;
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch {
    
  }
}

export async function signAsterWeb3MessageWithWallet(
  message: string,
  walletAddress: string,
  ethereum: EthProvider,
  options?: { alreadyOnBsc?: boolean },
): Promise<string> {
  const account = ethers.getAddress(walletAddress.trim());
  if (!options?.alreadyOnBsc) {
    await ensureWalletOnBscChain(ethereum);
  }
  try {
    return await ethereum.request({
      method: "personal_sign",
      params: [message, account],
    });
  } catch {
    const hexMessage = asterWeb3SignInMessageBytes(message);
    return await ethereum.request({
      method: "personal_sign",
      params: [hexMessage, account],
    });
  }
}
