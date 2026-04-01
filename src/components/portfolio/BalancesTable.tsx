"use client";

import { useState } from "react";
import { ArrowRightLeft, QrCode } from "lucide-react";
import { TokenIcon, ChainBadge, formatUsd, formatAmount } from "./PortfolioCharts";
import type { WalletToken } from "@/hooks/usePortfolioData";
import { ARBITRUM_TOKEN_ADDRESSES, HYPERLIQUID_TOKEN_ADDRESSES } from "@/config/tokenAddresses";

const MONO = "'IBM Plex Mono', 'SF Mono', monospace";
const SANS = "Inter, -apple-system, sans-serif";

function isSendable(token: WalletToken): boolean {
  if (token.chain === "Arbitrum") return token.asset in ARBITRUM_TOKEN_ADDRESSES;
  if (token.chain === "Hyperliquid") return token.asset in HYPERLIQUID_TOKEN_ADDRESSES;
  return false;
}

function BalanceRow({
  token, index,
  onSend, onReceive,
}: {
  token: WalletToken; index: number;
  onSend?: (token: WalletToken) => void;
  onReceive?: (token: WalletToken) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const changeColor = token.change24h > 0 ? "#22C55E" : token.change24h < 0 ? "#EF4444" : "#6B7280";
  const sendable = isSendable(token);

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`balance-row-${index}`}
      style={{
        borderBottom: "1px solid #0F0F12",
        background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TokenIcon symbol={token.asset} size={28} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 12, color: "#E2E8F0", fontFamily: MONO }}>{token.asset}</div>
            <div style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS }}>{token.chain} Wallet</div>
          </div>
        </div>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#E2E8F0", fontFamily: MONO }}>{formatAmount(token.amount)}</div>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#E2E8F0", fontFamily: MONO }}>{formatUsd(token.price)}</div>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0", fontFamily: MONO }}>{formatUsd(token.valueUsd)}</div>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        <span style={{ fontSize: 11, color: changeColor, fontFamily: MONO }}>
          {token.change24h > 0 ? "+" : ""}{token.change24h.toFixed(1)}%
        </span>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        <ChainBadge chain={token.chain} />
      </td>
      <td style={{ padding: "10px 8px", textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}>
          {sendable && (
            <button
              onClick={() => onSend?.(token)}
              data-testid={`button-row-send-${index}`}
              title={`Send ${token.asset}`}
              style={{
                display: "flex", alignItems: "center", gap: 3,
                padding: "3px 7px", borderRadius: 4,
                background: "rgba(255,255,255,0.05)", border: "1px solid #2A2A3A",
                cursor: "pointer", color: "#9BA4AE",
                fontFamily: SANS, fontSize: 9, fontWeight: 600,
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#E6EDF3"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#9BA4AE"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            >
              <ArrowRightLeft size={9} />
              Send
            </button>
          )}
          <button
            onClick={() => onReceive?.(token)}
            data-testid={`button-row-receive-${index}`}
            title={`Receive ${token.asset}`}
            style={{
              display: "flex", alignItems: "center", gap: 3,
              padding: "3px 7px", borderRadius: 4,
              background: "rgba(255,255,255,0.05)", border: "1px solid #2A2A3A",
              cursor: "pointer", color: "#9BA4AE",
              fontFamily: SANS, fontSize: 9, fontWeight: 600,
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#E6EDF3"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#9BA4AE"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            <QrCode size={9} />
            Receive
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function BalancesTab({
  tokens,
  onSend,
  onReceive,
}: {
  tokens: WalletToken[];
  onSend?: (token: WalletToken) => void;
  onReceive?: (token: WalletToken) => void;
}) {
  if (!tokens.length) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6B7280", fontSize: 13, fontFamily: SANS }}>
        No wallet tokens found. Connect a wallet to see your balances.
      </div>
    );
  }

  const totalValue = tokens.reduce((s, t) => s + t.valueUsd, 0);

  return (
    <div>
      <div style={{ padding: "12px 16px", fontSize: 10, color: "#6B7280", fontFamily: SANS, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        WALLET TOKENS ({tokens.length}) -- Total: <span style={{ color: "#E2E8F0", fontFamily: MONO }}>{formatUsd(totalValue)}</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1B2030" }}>
              {["ASSET", "AMOUNT", "PRICE", "VALUE", "24H", "CHAIN", ""].map((h, i) => (
                <th key={`${h}-${i}`} style={{
                  padding: "8px 12px", fontSize: 9, color: "#6B7280", fontWeight: 500,
                  textAlign: i === 0 ? "left" : "right",
                  fontFamily: MONO, letterSpacing: "0.04em", borderBottom: "1px solid #1B2030",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tokens.map((t, i) => (
              <BalanceRow
                key={`${t.asset}-${t.chain}-${i}`}
                token={t}
                index={i}
                onSend={onSend}
                onReceive={onReceive}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
