"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MONO, SANS } from "./swapConstants";
import { BRIDGE_EVM_CHAINS } from "@/config/bridgeEvmChains";

export interface TokenOption {
  symbol: string;
  name?: string;
  address: string;
  decimals?: number;
  logoURI?: string;
}

export interface ChainOption {
  key: string;
  label: string;
  logo?: string;
}

export default function TokenSelectorModal({
  onSelect, onClose, tokens: tokenList, excludeMint, title = "Select token", chains, selectedChainKey, onSelectChain, loadingTokens,
}: {
  onSelect: (t: TokenOption) => void;
  onClose: () => void;
  tokens?: TokenOption[];
  excludeMint?: string;
  title?: string;
  chains?: ChainOption[];
  selectedChainKey?: string;
  onSelectChain?: (chainKey: string) => void;
  loadingTokens?: boolean;
}) {
  const [search, setSearch] = useState("");
  const tokenScrollRef = useRef<HTMLDivElement>(null);
  const [tokenScrollTop, setTokenScrollTop] = useState(0);
  const [tokenScrollHeight, setTokenScrollHeight] = useState(0);
  const [tokenClientHeight, setTokenClientHeight] = useState(0);
  const chainScrollRef = useRef<HTMLDivElement>(null);
  const [chainScrollTop, setChainScrollTop] = useState(0);
  const [chainScrollHeight, setChainScrollHeight] = useState(0);
  const [chainClientHeight, setChainClientHeight] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [chainSearch, setChainSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => { setTimeout(() => searchRef.current?.focus(), 100); }, []);

  useEffect(() => {
    setSearch("");
    setChainSearch("");
    setShowChainSelector(false);
  }, [selectedChainKey]);

  const availableTokens = tokenList ?? [];
  const chainOptions = chains ?? BRIDGE_EVM_CHAINS.map((c) => ({ key: c.key, label: c.label, logo: c.logo }));
  const selectedChain = chainOptions.find(c => c.key === selectedChainKey);
  const filteredTokens = useMemo(
    () => availableTokens.filter((t) => !excludeMint || t.address.toLowerCase() !== excludeMint.toLowerCase()),
    [availableTokens, excludeMint]
  );

  const displayList = useMemo(() => {
    const q = search.toLowerCase();
    return q ? filteredTokens.filter((t) =>
      t.symbol.toLowerCase().includes(q) || (t.name && t.name.toLowerCase().includes(q))
    ) : filteredTokens;
  }, [search, filteredTokens]);
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "transparent" }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed", zIndex: 9999,
          top: 50,
          left: "50%",
          transform: "translateX(-50%)",
          width: isMobile ? 390 : 428,
          height: isMobile ? 711 : 660,

          maxWidth: isMobile ? 390 : 428,
          maxHeight: isMobile ? 711 : 660,
          background: "linear-gradient(180deg, rgba(22,22,22,0.95) 0%, rgba(10,10,10,0.95) 100%)",
          border: "1px solid rgba(255,255,255,0.2)", borderRadius: isMobile ? 16 : 16,
          backdropFilter: "blur(16.65px)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "Inter, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="token-selector-modal"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 24px 0", flexShrink: 0 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 20, lineHeight: "28px", color: "#FFFFFF" }}>{title}</span>
          <button onClick={onClose} data-testid="button-close-token-selector"
            style={{ width: isMobile ? 40 : 31, height: isMobile ? 31 : 31, borderRadius: isMobile ? "50%" : 33, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <svg width={isMobile ? 20 : 20}
              height={isMobile ? 20 : 20} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.67" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", gap: 9, padding: isMobile ? "12px 16px 0" : "18px 29px 0", alignItems: "center" }}>
          <div style={{ width: isMobile ? 210 : 252, height: isMobile ? 36 : 41, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: "#111111", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 32, boxSizing: "border-box", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Token"
              autoComplete="off"
              data-testid="input-token-search"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#FFFFFF", fontSize: 14, fontWeight: 500, fontFamily: "Inter, sans-serif" }}
            />
          </div>
          {chainOptions.length > 0 && (
            <div onClick={() => setShowChainSelector(s => !s)} style={{ minWidth: isMobile ? 110 : 120, height: isMobile ? 36 : 41, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 10px", background: "#111111", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 32, cursor: "pointer", flexShrink: 0 }}>
              {selectedChain?.logo ? (
                <img src={selectedChain.logo} alt={selectedChain.label} style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1" fill="#888888" />
                  <rect x="9" y="1" width="6" height="6" rx="1" fill="#AAAAAA" />
                  <rect x="1" y="9" width="6" height="6" rx="1" fill="#AAAAAA" />
                  <rect x="9" y="9" width="6" height="6" rx="1" fill="#888888" />
                </svg>
              )}
              <span style={{ fontSize: 11, fontWeight: 600, color: "#E5E7EB", maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedChain?.label ?? "Chain"}
              </span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="#888888" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
        <div
          ref={tokenScrollRef}
          onScroll={e => {
            const el = e.currentTarget;
            setTokenScrollTop(el.scrollTop);
            setTokenScrollHeight(el.scrollHeight);
            setTokenClientHeight(el.clientHeight);
          }}
          style={{
            overflowY: "scroll", height: isMobile ? "100%" : 521,
            minHeight: isMobile ? 0 : 521, padding: "20px 23px", scrollbarWidth: "none", msOverflowStyle: "none"
          }}
        >
          {loadingTokens && (
            <div style={{ padding: "32px 0", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              Loading tokens…
            </div>
          )}
          {!loadingTokens && displayList.map((t, i) => {
            return (
              <button key={`${t.symbol}-${t.address || i}`} onClick={() => { onSelect(t); onClose(); }}
                data-testid={`token-option-${t.symbol}`}
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "15px 8px 15px 16px", width: "100%", height: 70, borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", boxSizing: "border-box", transition: "background 0.12s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "9999px", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: t.logoURI ? "transparent" : "linear-gradient(180deg, #2563EB 0%, #153885 100%)" }}>
                  {t.logoURI ? (
                    <img src={t.logoURI} alt={t.symbol} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                      onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = "none"; if (el.parentElement) el.parentElement.style.background = "linear-gradient(180deg, #2563EB 0%, #153885 100%)"; }}
                    />
                  ) : (
                    <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>{(t.symbol || "?").slice(0, 2)}</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 17, lineHeight: "26px", color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name || t.symbol}</span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 13, lineHeight: "20px", color: "#6B7280" }}>{t.symbol}</span>
                </div>
              </button>
            );
          })}
          {!loadingTokens && displayList.length === 0 && (
            <div style={{ padding: "24px 0", textAlign: "center", color: "#2A3340", fontSize: 13 }}>No tokens found</div>
          )}
        </div>
        <div style={{
          position: "absolute",
          right: 0,
          top: "20%",
          width: 6,
          height: 67,
          borderRadius: 23,
          background: "transparent",
        }}>
          <div style={{
            position: "absolute",
            width: "100%",
            height: 67,
            borderRadius: 23,
            background: "linear-gradient(180deg, #444444 0%, #FF6B00 51.92%, #444444 100%)",
            top: tokenScrollHeight > tokenClientHeight
              ? `${(tokenScrollTop / (tokenScrollHeight - tokenClientHeight)) * (521 - 67)}px`
              : "0px",
            transition: "top 0.1s",
          }} />
        </div>
      </div >
      {showChainSelector && chainOptions.length > 0 && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10000, background: "transparent" }}
            onClick={() => setShowChainSelector(false)}
          />
          <div style={{
            position: "fixed", zIndex: 10001, top: "50%", left: "50%",
            transform: isMobile
              ? "translate(-50%, -75%)"
              : "translate(-20%, -65%)",
            width: isMobile ? 360 : 316,
            maxHeight: isMobile ? 530 : 428,
            background: "linear-gradient(180deg, rgba(22,22,22,0.98) 0%, rgba(10,10,10,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16,
            backdropFilter: "blur(16.65px)",
            overflow: "hidden",
            fontFamily: "Inter, sans-serif",
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "16px 16px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: 41, background: "#111111", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 32 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  value={chainSearch}
                  onChange={e => setChainSearch(e.target.value)}
                  placeholder="Search Blockchain"
                  autoComplete="off"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#FFFFFF", fontSize: 14, fontFamily: "Inter, sans-serif" }}
                />
              </div>
            </div>
            <div
              ref={chainScrollRef}
              onScroll={e => {
                const el = e.currentTarget;
                setChainScrollTop(el.scrollTop);
                setChainScrollHeight(el.scrollHeight);
                setChainClientHeight(el.clientHeight);
              }}
              style={{ maxHeight: 380, overflowY: "scroll", padding: "0 8px 12px", scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {chainOptions
                .filter(c => c.label.toLowerCase().includes(chainSearch.toLowerCase()))
                .map(c => {
                  const isSelected = c.key === selectedChainKey;
                  return (
                  <button
                    key={c.key}
                    onClick={() => {
                      onSelectChain?.(c.key);
                      setShowChainSelector(false);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      width: "100%", padding: "8px 12px",
                      border: "none",
                      background: isSelected ? "rgba(212,165,116,0.12)" : "transparent",
                      cursor: "pointer", borderRadius: 12,
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {c.logo ? (
                      <img src={c.logo} alt={c.label}
                        style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)" }} />
                    )}
                    <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 17, lineHeight: "25.5px", color: "#FFFFFF" }}>{c.label}</span>
                  </button>
                );})}
            </div>
            <div style={{
              position: "absolute",
              right: 2,
              top: 60,
              width: 6,
              height: 67,
              borderRadius: 23,
              background: "transparent",
            }}>
              <div style={{
                position: "absolute",
                width: "100%",
                height: 67,
                borderRadius: 23,
                background: "linear-gradient(180deg, #444444 0%, #FF6B00 51.92%, #444444 100%)",
                top: chainScrollHeight > chainClientHeight
                  ? `${(chainScrollTop / (chainScrollHeight - chainClientHeight)) * (280 - 67)}px`
                  : "0px",
                transition: "top 0.1s",
              }} />
            </div>
          </div>
        </>
      )
      }
    </>
  );
}
