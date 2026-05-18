import { ethers } from "ethers";
import { getAsterSignerPrivateKey } from "@/config/asterFapi";

export function deriveAgentSignerForUser(userWallet: string): {
  address: string;
  privateKey: string;
} | null {
  const user = userWallet.trim().toLowerCase();
  if (!/^0x[a-f0-9]{40}$/i.test(user)) return null;

  const masterPk = getAsterSignerPrivateKey();
  if (!masterPk) return null;

  try {
    let masterBytes: Uint8Array;
    try {
      masterBytes = ethers.getBytes(masterPk);
    } catch {
      masterBytes = ethers.toUtf8Bytes(masterPk);
    }

    const userBytes = ethers.getBytes(user);
    const derivedHash = ethers.keccak256(
      ethers.concat([masterBytes, ethers.toUtf8Bytes("aster:agent:v1"), userBytes])
    );
    const wallet = new ethers.Wallet(derivedHash);
    return { address: wallet.address, privateKey: wallet.privateKey };
  } catch {
    return null;
  }
}

export const resolveAgentSignerForUser = deriveAgentSignerForUser;
