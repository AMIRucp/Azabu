"use client";
import { useEvmWallet } from "./useEvmWallet";

export function useWallets() {
  const { evmAddress, isEvmConnected, disconnectEvm } = useEvmWallet();

  return {
    solanaAddress: null,
    solanaConnected: false,
    solanaDisconnect: async () => {},
    anyConnected: isEvmConnected,
    addresses: {
      sol: null,
      evm: evmAddress,
    },
    evmAddress,
    isEvmConnected,
    disconnectEvm,
  };
}
