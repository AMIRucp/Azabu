import { ethers } from "ethers";
import {
  getAsterBuilderAddress,
  getAsterSignerAddress,
  getAsterSignerPrivateKey,
} from "@/config/asterFapi";

export function getDeploySignerAddress(): string | null {
  const fromEnv = getAsterSignerAddress();
  if (fromEnv) {
    try {
      return ethers.getAddress(fromEnv);
    } catch {
    }
  }
  const pk = getAsterSignerPrivateKey();
  if (!pk) return null;
  try {
    return ethers.getAddress(new ethers.Wallet(pk).address);
  } catch {
    return null;
  }
}

export type AsterWalletSeparation = {
  user: string;
  signer: string | null;
  builder: string | null;
  userIsSigner: boolean;
  userIsBuilder: boolean;
  warning: string | null;
};

export function checkAsterWalletSeparation(userWallet: string): AsterWalletSeparation {
  let user: string;
  try {
    user = ethers.getAddress(userWallet.trim());
  } catch {
    return {
      user: userWallet,
      signer: null,
      builder: null,
      userIsSigner: false,
      userIsBuilder: false,
      warning: "Invalid wallet address",
    };
  }

  const signer = getDeploySignerAddress();
  let builder: string | null = null;
  try {
    const b = getAsterBuilderAddress();
    if (b) builder = ethers.getAddress(b);
  } catch {
    builder = null;
  }

  const userLc = user.toLowerCase();
  const userIsSigner = !!signer && signer.toLowerCase() === userLc;
  const userIsBuilder = !!builder && builder.toLowerCase() === userLc;

  let warning: string | null = null;
  if (userIsSigner) {
    warning =
      "Connect the wallet you used to deposit on Aster. This address signs trades for the app and may not show your full balance.";
  }

  return { user, signer, builder, userIsSigner, userIsBuilder, warning };
}
