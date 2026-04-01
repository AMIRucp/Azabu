import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import {
  JUPITER_PERPETUALS_PROGRAM_ID,
  JLP_POOL_ACCOUNT_PUBKEY,
} from "./constants";

export function generatePositionRequestPda({
  positionPubkey,
  requestChange,
  counter,
}: {
  positionPubkey: PublicKey;
  requestChange: "increase" | "decrease";
  counter?: BN;
}) {
  if (!counter) {
    counter = new BN(Math.floor(Math.random() * 1_000_000_000));
  }

  const requestChangeEnum = requestChange === "increase" ? [1] : [2];
  const [positionRequest, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("position_request"),
      new PublicKey(positionPubkey).toBuffer(),
      counter.toArrayLike(Buffer, "le", 8),
      Buffer.from(requestChangeEnum),
    ],
    JUPITER_PERPETUALS_PROGRAM_ID,
  );

  return { positionRequest, counter, bump };
}

export function generatePositionPda({
  custody,
  collateralCustody,
  walletAddress,
  side,
}: {
  custody: PublicKey;
  collateralCustody: PublicKey;
  walletAddress: PublicKey;
  side: "long" | "short";
}) {
  const [position, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("position"),
      walletAddress.toBuffer(),
      JLP_POOL_ACCOUNT_PUBKEY.toBuffer(),
      custody.toBuffer(),
      collateralCustody.toBuffer(),
      // @ts-ignore - Side enum: long=1, short=2
      side === "long" ? [1] : [2],
    ],
    JUPITER_PERPETUALS_PROGRAM_ID,
  );

  return { position, bump };
}

export function getPerpetualsPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("perpetuals")],
    JUPITER_PERPETUALS_PROGRAM_ID,
  )[0];
}
