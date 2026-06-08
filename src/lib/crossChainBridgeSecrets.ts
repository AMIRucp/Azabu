"use client";

import { HashLock } from "@1inch/cross-chain-sdk";

/** 32-byte hex secrets — keep in memory until Fusion+ escrows request them. */
export function generateBridgeSecrets(count: number): string[] {
  if (count < 1) throw new Error("Invalid secrets count");
  return Array.from({ length: count }, () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  });
}

export function buildBridgeSecretHashes(secrets: string[]): string[] {
  return secrets.map((s) => HashLock.hashSecret(s));
}

export function buildBridgeHashLock(secrets: string[]): string {
  if (secrets.length === 1) {
    return HashLock.forSingleFill(secrets[0]).toString();
  }
  return HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets)).toString();
}
