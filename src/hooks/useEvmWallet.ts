"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain, useReconnect } from "wagmi";
import {
  ETHEREUM_CHAIN_ID, ARBITRUM_CHAIN_ID, POLYGON_CHAIN_ID,
  BASE_CHAIN_ID, BNB_CHAIN_ID, AVALANCHE_CHAIN_ID, HYPERLIQUID_CHAIN_ID,
} from "@/config/wagmiConfig";

export interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

const SUPPORTED_CHAIN_IDS = new Set<number>([
  ETHEREUM_CHAIN_ID, ARBITRUM_CHAIN_ID, POLYGON_CHAIN_ID,
  BASE_CHAIN_ID, BNB_CHAIN_ID, AVALANCHE_CHAIN_ID, HYPERLIQUID_CHAIN_ID,
]);

const CHAIN_ADD_PARAMS: Record<number, object> = {
  [ETHEREUM_CHAIN_ID]: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    rpcUrls: ["https://mainnet.infura.io/v3/"],
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://etherscan.io"],
  },
  [ARBITRUM_CHAIN_ID]: {
    chainId: "0xa4b1",
    chainName: "Arbitrum One",
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://arbiscan.io"],
  },
  [BASE_CHAIN_ID]: {
    chainId: "0x2105",
    chainName: "Base",
    rpcUrls: ["https://mainnet.base.org"],
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://basescan.org"],
  },
  [BNB_CHAIN_ID]: {
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    rpcUrls: ["https://bsc-dataseed.binance.org"],
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    blockExplorerUrls: ["https://bscscan.com"],
  },
  [AVALANCHE_CHAIN_ID]: {
    chainId: "0xa86a",
    chainName: "Avalanche C-Chain",
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
    blockExplorerUrls: ["https://snowscan.xyz"],
  },
  [HYPERLIQUID_CHAIN_ID]: {
    chainId: "0x3E7",
    chainName: "Hyperliquid EVM",
    rpcUrls: ["https://rpc.hyperliquid.xyz/evm"],
    nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
    blockExplorerUrls: ["https://hyperscan.xyz"],
  },
};

export function useEvmWallet() {
  const { address, isConnected, chainId, connector } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { reconnect } = useReconnect();

  const isEthereum = chainId === ETHEREUM_CHAIN_ID;
  const isArbitrum = chainId === ARBITRUM_CHAIN_ID;
  const isPolygon = chainId === POLYGON_CHAIN_ID;
  const isHyperliquid = chainId === HYPERLIQUID_CHAIN_ID;

  // Auto-reconnect when user returns to the app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reconnect();
      }
    };

    const handleFocus = () => {
      reconnect();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [reconnect]);

  // Auto-switch to supported chain if connected to unsupported chain
  useEffect(() => {
    if (isConnected && chainId !== undefined && !SUPPORTED_CHAIN_IDS.has(chainId)) {
      switchChainAsync({ chainId: ARBITRUM_CHAIN_ID as number }).catch(() => {});
    }
  }, [isConnected, chainId, switchChainAsync]);

  const connectEvm = useCallback(async (connectorId?: string) => {
    const target = connectorId
      ? connectors.find((c) => c.id === connectorId)
      : connectors[0];

    if (!target) {
      throw new Error(`No connector found for id: ${connectorId}`);
    }
    await connectAsync({ connector: target, chainId: ARBITRUM_CHAIN_ID });
  }, [connectAsync, connectors]);

  const disconnectEvm = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const switchToArbitrum = useCallback(async () => {
    if (!isConnected || isArbitrum) return;
    try {
      await switchChainAsync({ chainId: ARBITRUM_CHAIN_ID });
    } catch (err: unknown) {
      const switchErr = err as { code?: number };
      if (switchErr.code === 4902) {
        const provider = connector ? await connector.getProvider() : null;
        if (provider && typeof (provider as EIP1193Provider).request === "function") {
          await (provider as EIP1193Provider).request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0xa4b1",
              chainName: "Arbitrum One",
              rpcUrls: ["https://arb1.arbitrum.io/rpc"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: ["https://arbiscan.io"],
            }],
          });
          await switchChainAsync({ chainId: ARBITRUM_CHAIN_ID });
        } else {
          throw new Error("Please switch to Arbitrum network manually in your wallet");
        }
      } else {
        throw err;
      }
    }
  }, [isConnected, isArbitrum, switchChainAsync, connector]);

  const switchToPolygon = useCallback(async () => {
    if (!isConnected || isPolygon) return;
    try {
      await switchChainAsync({ chainId: POLYGON_CHAIN_ID });
    } catch (err: unknown) {
      const switchErr = err as { code?: number };
      if (switchErr.code === 4902) {
        const provider = connector ? await connector.getProvider() : null;
        if (provider && typeof (provider as EIP1193Provider).request === "function") {
          await (provider as EIP1193Provider).request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x89",
              chainName: "Polygon",
              rpcUrls: ["https://polygon-rpc.com"],
              nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
              blockExplorerUrls: ["https://polygonscan.com"],
            }],
          });
          await switchChainAsync({ chainId: POLYGON_CHAIN_ID });
        }
      }
    }
  }, [isConnected, isPolygon, switchChainAsync, connector]);

  const switchToHyperliquid = useCallback(async () => {
    if (!isConnected || isHyperliquid) return;
    try {
      await switchChainAsync({ chainId: HYPERLIQUID_CHAIN_ID });
    } catch (err: unknown) {
      const switchErr = err as { code?: number };
      if (switchErr.code === 4902) {
        const provider = connector ? await connector.getProvider() : null;
        if (provider && typeof (provider as EIP1193Provider).request === "function") {
          await (provider as EIP1193Provider).request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x3E7",
              chainName: "Hyperliquid EVM",
              rpcUrls: ["https://rpc.hyperliquid.xyz/evm"],
              nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
              blockExplorerUrls: ["https://hyperscan.xyz"],
            }],
          });
          await switchChainAsync({ chainId: HYPERLIQUID_CHAIN_ID });
        } else {
          throw new Error("Please switch to Hyperliquid network manually in your wallet");
        }
      } else {
        throw err;
      }
    }
  }, [isConnected, isHyperliquid, switchChainAsync, connector]);

  const switchToEthereum = useCallback(async () => {
    if (!isConnected || isEthereum) return;
    await switchChainAsync({ chainId: ETHEREUM_CHAIN_ID });
  }, [isConnected, isEthereum, switchChainAsync]);

  const switchToChain = useCallback(async (targetChain: "ethereum" | "arbitrum" | "hyperliquid" | "polygon") => {
    if (targetChain === "ethereum") return switchToEthereum();
    if (targetChain === "arbitrum") return switchToArbitrum();
    if (targetChain === "hyperliquid") return switchToHyperliquid();
    if (targetChain === "polygon") return switchToPolygon();
  }, [switchToEthereum, switchToArbitrum, switchToHyperliquid, switchToPolygon]);

  const switchToChainById = useCallback(async (targetChainId: number) => {
    if (!isConnected) return;
    if (chainId === targetChainId) return;
    try {
      await switchChainAsync({ chainId: targetChainId });
    } catch (err: unknown) {
      const switchErr = err as { code?: number };
      if (switchErr.code === 4902) {
        const addParams = CHAIN_ADD_PARAMS[targetChainId];
        if (addParams) {
          const prov = connector ? await connector.getProvider() : null;
          if (prov && typeof (prov as EIP1193Provider).request === "function") {
            await (prov as EIP1193Provider).request({
              method: "wallet_addEthereumChain",
              params: [addParams],
            });
            await switchChainAsync({ chainId: targetChainId });
          } else {
            throw new Error("Please add this network manually in your wallet");
          }
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
  }, [isConnected, chainId, switchChainAsync, connector]);

  const getEvmProvider = useCallback(async (): Promise<EIP1193Provider | null> => {
    if (!connector) return null;
    const provider = await connector.getProvider();
    if (!provider || typeof (provider as EIP1193Provider).request !== "function") return null;
    return provider as EIP1193Provider;
  }, [connector]);

  const getEvmSigner = useCallback(async () => {
    const provider = await getEvmProvider();
    if (!provider) return null;
    const { ethers } = await import("ethers");
    const browserProvider = new ethers.BrowserProvider(provider as never);
    return browserProvider.getSigner();
  }, [getEvmProvider]);

  const availableConnectors = useMemo(
    () => connectors.map((c) => ({ id: c.id, name: c.name, type: c.type })),
    [connectors],
  );

  return {
    evmAddress: address ?? null,
    isEvmConnected: isConnected,
    evmChainId: chainId ?? null,
    isEthereum,
    isArbitrum,
    isPolygon,
    isHyperliquid,
    connectEvm,
    disconnectEvm,
    switchToEthereum,
    switchToArbitrum,
    switchToPolygon,
    switchToHyperliquid,
    switchToChain,
    switchToChainById,
    getEvmProvider,
    getEvmSigner,
    availableConnectors,
  };
}
