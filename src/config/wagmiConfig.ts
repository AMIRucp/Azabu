"use client";

import { createConfig, http, createStorage, type CreateConnectorFn } from "wagmi";
import { arbitrum, polygon, mainnet, base, bsc, avalanche } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { defineChain } from "viem";

export const hyperliquidEvm = defineChain({
  id: 999,
  name: "Hyperliquid EVM",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.hyperliquid.xyz/evm"] },
  },
  blockExplorers: {
    default: { name: "Hyperscan", url: "https://hyperscan.xyz" },
  },
});

function buildConnectors(): CreateConnectorFn[] {
  const list: CreateConnectorFn[] = [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "AFX", darkMode: true }),
  ];

  const wcProjectId = typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_WC_PROJECT_ID
    : undefined;

  if (wcProjectId) {
    list.push(
      walletConnect({
        projectId: wcProjectId,
        showQrModal: true,
      }),
    );
  }

  return list;
}

export const wagmiConfig = createConfig({
  chains: [arbitrum, mainnet, polygon, base, bsc, avalanche, hyperliquidEvm],
  connectors: buildConnectors(),
  multiInjectedProviderDiscovery: true,
  transports: {
    [arbitrum.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [hyperliquidEvm.id]: http(),
  },
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    key: "afx_wagmi",
  }),
  ssr: true,
});

export const ETHEREUM_CHAIN_ID = mainnet.id;
export const ARBITRUM_CHAIN_ID = arbitrum.id;
export const POLYGON_CHAIN_ID = polygon.id;
export const BASE_CHAIN_ID = base.id;
export const BNB_CHAIN_ID = bsc.id;
export const AVALANCHE_CHAIN_ID = avalanche.id;
export const HYPERLIQUID_CHAIN_ID = hyperliquidEvm.id;
