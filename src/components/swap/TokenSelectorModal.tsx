"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MONO, SANS } from "./swapConstants";

export interface TokenOption {
  symbol: string;
  name?: string;
  address: string;
  decimals?: number;
  logoURI?: string;
}

export default function TokenSelectorModal({
  onSelect, onClose, tokens: tokenList, excludeMint,
}: {
  onSelect: (t: TokenOption) => void;
  onClose: () => void;
  tokens?: TokenOption[];
  excludeMint?: string;
}) {
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => searchRef.current?.focus(), 100); }, []);

  const displayList = useMemo(() => {
    if (!tokenList) return [];
    const q = search.toLowerCase();
    return q ? tokenList.filter((t) => 
      t.symbol.toLowerCase().includes(q) || (t.name && t.name.toLowerCase().includes(q))
    ) : tokenList;
  }, [tokenList, search]);

  const popular = tokenList ? tokenList.slice(0, 7) : [];

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed", zIndex: 9999, top: "50%", left: "50%",
          transform: "translate(-50%,-50%)", width: "calc(100% - 32px)", maxWidth: 380, maxHeight: "70vh",
          background: "#0A0C10", border: "1px solid #181A20", borderRadius: 14,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: SANS,
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="token-selector-modal"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 10px" }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#E6EDF3" }}>Select token</span>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "#0E1014", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280" }} data-testid="button-close-token-selector">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 16px 10px", padding: "9px 12px", borderRadius: 9, border: "1px solid #181A20", background: "#0C0E12" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or symbol..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#E6EDF3", fontSize: 13, fontFamily: SANS }}
            autoComplete="off"
            data-testid="input-token-search"
          />
        </div>

        <div style={{ display: "flex", gap: 6, padding: "0 16px 10px", flexWrap: "wrap" }}>
          {popular.map((t) => (
            <button key={t.symbol || t.address} onClick={() => { onSelect(t); onClose(); }} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 11px",
              borderRadius: 16, border: "1px solid #181A20", background: "transparent",
              color: "#9BA4AE", fontSize: 12, cursor: "pointer", transition: "border-color 0.12s",
              fontFamily: SANS, fontWeight: 450,
            }} data-testid={`popular-token-${t.symbol}`}>
              {t.logoURI && <img src={t.logoURI} alt="" style={{ width: 14, height: 14, borderRadius: 7, filter: "grayscale(50%) brightness(0.9)" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
              {t.symbol}
            </button>
          ))}
        </div>

        <div style={{ height: 1, background: "#0E1014", margin: "0 16px" }} />

        <div style={{ overflowY: "auto", flex: 1, padding: "6px 8px", maxHeight: 320 }}>
          {displayList.map((t, i) => {
            return (
              <button key={`${t.symbol}-${t.address || i}`} onClick={() => { onSelect(t); onClose(); }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                borderRadius: 8, border: "none", width: "100%", cursor: "pointer",
                background: "transparent", transition: "background 0.1s", textAlign: "left",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                data-testid={`token-option-${t.symbol}`}
              >
                <div style={{ width: 32, height: 32, borderRadius: 16, border: "1px solid #181A20", background: "#0E1014", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {t.logoURI ? (
                    <img src={t.logoURI} alt="" style={{ width: 30, height: 30, borderRadius: 15, filter: "grayscale(50%) brightness(0.9)" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <span style={{ fontSize: 12, color: "#6B7280", fontFamily: MONO }}>{(t.symbol || "?")[0]}</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#E4E4E7" }}>{t.name}</span>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>{t.symbol}</span>
                </div>
              </button>
            );
          })}
          {displayList.length === 0 && (
            <div style={{ padding: "24px 0", textAlign: "center", color: "#2A3340", fontSize: 13 }}>No tokens found</div>
          )}
        </div>
      </div>
    </>
  );
}
