"use client";

import { createConfig, http, createStorage, type CreateConnectorFn } from "wagmi";
import { arbitrum, polygon, mainnet, base, bsc, avalanche } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { defineChain } from "viem";

export const hyperliquidEvm = defineChain({
  id: 1337,
  name: "Hyperliquid",
  nativeCurrency: { name: "Hyperliquid", symbol: "HYPE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.hyperliquid.xyz/evm"] },
  },
  blockExplorers: {
    default: { name: "Hyperliquid Explorer", url: "https://explorer.hyperliquid.xyz" },
  },
});

function buildConnectors(): CreateConnectorFn[] {
  if (typeof window === "undefined") {
    return [
      injected({ shimDisconnect: true }),
      coinbaseWallet({ appName: "Azabu", darkMode: true }),
    ];
  }

  const list: CreateConnectorFn[] = [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "Azabu", darkMode: true }),
  ];

  const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

  if (wcProjectId) {
    list.push(
      walletConnect({
        projectId: wcProjectId,
        showQrModal: true,
        metadata: {
          name: "Azabu",
          description: "Alternative Futures Exchange — 275+ leveraged markets",
          url: window.location.origin,
          icons: ["https://azabu.fi/favicon.png"],
        },
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
    [arbitrum.id]: http("https://arb1.arbitrum.io/rpc"),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [hyperliquidEvm.id]: http(),
  },
  storage: typeof window !== "undefined" ? createStorage({
    storage: window.localStorage,
    key: "afx_wagmi",
  }) : createStorage({
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
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
