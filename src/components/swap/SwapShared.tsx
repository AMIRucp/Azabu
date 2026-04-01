"use client";

import { ChevronDown, ExternalLink } from "lucide-react";
import { SANS, MONO } from "./swapConstants";

export function TokenSelector({ token, onClick, testId, balance }: {
  token: { symbol: string; logoURI?: string };
  onClick: () => void;
  testId: string;
  balance?: string | null;
}) {
  return (
    <button onClick={onClick} data-testid={testId} style={{
      display: "flex", alignItems: "center", gap: 12,
      width: "100%", padding: "12px 14px",
      borderRadius: 12, border: "1px solid #181A20",
      background: "linear-gradient(145deg, #0E1014 0%, #0C0E12 100%)",
      cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#252830"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#181A20"; }}
    >
      {token.logoURI ? (
        <img src={token.logoURI} alt="" style={{
          width: 36, height: 36, borderRadius: 18,
          background: "#0A0C10",
        }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: 18,
          background: "#161820",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, color: "#6B7280", fontFamily: SANS,
        }}>
          {token.symbol.charAt(0)}
        </div>
      )}
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#E6EDF3", fontFamily: SANS }}>
          {token.symbol}
        </div>
        {balance && (
          <div style={{ fontSize: 11, color: "#6B7280", fontFamily: MONO, marginTop: 1 }}>
            Balance: {balance}
          </div>
        )}
      </div>
      <ChevronDown style={{ width: 16, height: 16, color: "#6B7280", flexShrink: 0 }} />
    </button>
  );
}

export function SuccessView({ fromSymbol, toSymbol, fromAmt, toAmt, txLink, onNew }: {
  fromSymbol: string; toSymbol: string; fromAmt: string; toAmt: string; txLink: string; onNew: () => void;
}) {
  return (
    <div style={{ animation: "swpFadeIn 0.3s ease-out", padding: "24px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ margin: "0 auto 12px" }}>
          <circle cx="20" cy="20" r="18" fill="none" stroke="#9BA4AE" strokeWidth="1.5" opacity="0.2" />
          <path d="M12 20l6 6 10-12" fill="none" stroke="#9BA4AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#E6EDF3", marginBottom: 4, fontFamily: SANS }}>
          Swapped {fromAmt} {fromSymbol} {"\u2192"} {toAmt} {toSymbol}
        </div>
        {txLink && (
          <a href={txLink} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#6B7280", fontFamily: MONO, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }} data-testid="link-tx">
            View transaction <ExternalLink style={{ width: 12, height: 12 }} />
          </a>
        )}
      </div>
      <button onClick={onNew} data-testid="button-new-swap" style={{
        width: "100%", padding: "14px 0", borderRadius: 12, fontSize: 15,
        fontWeight: 550, fontFamily: SANS, cursor: "pointer",
        background: "transparent", border: "1px solid #181A20", color: "#9BA4AE",
        transition: "all 0.15s",
      }}>New Swap</button>
    </div>
  );
}
