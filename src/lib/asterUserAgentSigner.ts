import { ethers } from "ethers";
import { getAsterSignerPrivateKey } from "@/config/asterFapi";

export async function resolveAgentSignerForUser(userWallet: string): Promise<{
  address: string;
  privateKey: string;
} | null> {
  const user = userWallet.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/i.test(user)) return null;

  const pk = getAsterSignerPrivateKey();
  if (!pk) return null;

  try {
    const wallet = new ethers.Wallet(pk);
    return { address: wallet.address, privateKey: wallet.privateKey };
  } catch {
    return null;
  }
}
