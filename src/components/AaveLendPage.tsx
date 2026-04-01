"use client";

import { useEvmWallet } from "@/hooks/useEvmWallet";

const SANS = "Inter, -apple-system, sans-serif";
const MONO = "'IBM Plex Mono', 'SF Mono', monospace";

export default function AaveLendPage() {
  const { evmAddress, isEvmConnected, connectEvm } = useEvmWallet();

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 320, padding: 32, gap: 20, textAlign: "center",
    }}>
      <img src="/tokens/arb.webp" alt="Arbitrum" style={{ width: 48, height: 48, borderRadius: "50%" }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>
        Aave Lending — Arbitrum
      </div>
      <div style={{ fontSize: 13, color: "#6B7280", fontFamily: SANS, maxWidth: 320, lineHeight: 1.6 }}>
        Supply and borrow assets on Aave v3 via your EVM wallet. Earn yield on USDC, USDT, ETH and more.
      </div>
      {!isEvmConnected ? (
        <button
          data-testid="aave-connect-wallet"
          onClick={() => connectEvm()}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #D4A574, #D4541E)",
            color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: SANS, cursor: "pointer",
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div style={{ fontSize: 11, color: "#4B5563", fontFamily: MONO }}>
          {evmAddress?.slice(0, 6)}…{evmAddress?.slice(-4)} · Arbitrum
        </div>
      )}
      <div style={{
        padding: "8px 16px", borderRadius: 6,
        background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.2)",
        fontSize: 11, color: "#D4A574", fontFamily: MONO,
      }}>
        COMING SOON
      </div>
    </div>
  );
}
