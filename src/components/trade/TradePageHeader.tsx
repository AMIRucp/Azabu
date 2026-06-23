"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, X } from "lucide-react";
import TokenIcon from "@/components/shared/TokenIcon";
import useMarketStore from "@/stores/useMarketStore";
import { fmtPrice, fmtCompact, fmtChange } from "@/utils/marketFormatters";
import { CAT_BADGE, tradePageTokens as T } from "./tradePageTokens";

const MarketBrowser = dynamic(() => import("@/components/perps/MarketBrowser"), { ssr: false });

const L1L2_ASSETS = new Set([
  "SOL", "ETH", "AVAX", "ARB", "OP", "MATIC", "POL", "SUI", "APT", "SEI",
  "TIA", "NEAR", "ATOM", "DOT", "ADA", "BNB", "FTM", "INJ", "STRK", "ZK",
]);

interface TradePageHeaderProps {
  selectedAsset: string;
  assetProtocol: string;
  rawSym: string;
  currentPrice: number | null;
  priceChange: number | null;
  fundingRate: number | null;
  vol24h?: number;
  openInterest?: number;
  maxLev: number;
  category?: string;
  isMobile?: boolean;
  onAssetChange: (sym: string, protocol?: string, meta?: { assetId?: number; baseAsset?: string }) => void;
}

export default function TradePageHeader({
  selectedAsset,
  rawSym,
  currentPrice,
  priceChange,
  fundingRate,
  vol24h,
  openInterest,
  maxLev,
  category,
  isMobile,
  onAssetChange,
}: TradePageHeaderProps) {
  const markets = useMarketStore((s) => s.markets);
  const livePrices = useMarketStore((s) => s.livePrices);
  const [pickerOpen, setPickerOpen] = useState(false);

  const indexPrice = currentPrice ?? 0;
  const badge =
    (category && CAT_BADGE[category]) ||
    (L1L2_ASSETS.has(selectedAsset.toUpperCase()) ? CAT_BADGE.l1l2 : CAT_BADGE.crypto);

  const closePicker = useCallback(() => setPickerOpen(false), []);

  const handleSelectMarket = useCallback(
    (symbol: string, protocol?: string, meta?: { category?: string; baseAsset?: string; assetId?: number }) => {
      const base =
        meta?.baseAsset ||
        symbol.replace(/-PERP$/i, "").replace(/USDT$/i, "").replace(/\/[A-Z]+$/, "").split("-")[0];
      onAssetChange(base, protocol, { assetId: meta?.assetId, baseAsset: base });
      setPickerOpen(false);
    },
    [onAssetChange]
  );

  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePicker();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerOpen, closePicker]);

  useEffect(() => {
    document.body.style.overflow = pickerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [pickerOpen]);

  const stats = [
    { label: "LAST PRICE", value: currentPrice !== null ? `$${fmtPrice(currentPrice)}` : "—", color: T.white },
    {
      label: "24H CHANGE",
      value: priceChange !== null ? fmtChange(priceChange) : "—",
      color: (priceChange ?? 0) >= 0 ? T.green : T.redSoft,
    },
    { label: "24H VOLUME", value: vol24h && vol24h > 0 ? fmtCompact(vol24h) : "—", color: T.white },
    { label: "OPEN INTEREST", value: openInterest && openInterest > 0 ? fmtCompact(openInterest) : "—", color: T.white },
    {
      label: "FUNDING RATE",
      value:
        fundingRate !== null && fundingRate !== undefined
          ? `${fundingRate >= 0 ? "+" : ""}${(fundingRate * 100).toFixed(3)}%`
          : "—",
      color: (fundingRate ?? 0) >= 0 ? T.green : T.redSoft,
    },
    { label: "INDEX PRICE", value: indexPrice > 0 ? `$${fmtPrice(indexPrice)}` : "—", color: T.white },
  ];

  const assetSelector = (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        data-testid="trade-asset-selector"
        onClick={() => setPickerOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 14px 8px 10px",
          borderRadius: 999,
          background: T.selectorBg,
          border: `1px solid ${T.selectorBorder}`,
          cursor: "pointer",
          minWidth: isMobile ? "100%" : 220,
        }}
      >
        <TokenIcon symbol={selectedAsset} size={28} />
        <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: T.sans, letterSpacing: "-0.01em" }}>
              {selectedAsset}-PERP
            </span>
            <span
              style={{
                fontSize: 8,
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 4,
                color: badge.color,
                background: badge.bg,
                border: `1px solid ${badge.border}`,
                letterSpacing: "0.03em",
                lineHeight: 1.2,
              }}
            >
              {badge.label}
            </span>
          </div>
          <div style={{ fontSize: 10, color: T.label, fontFamily: T.sans, marginTop: 2 }}>
            Up to {maxLev}x
          </div>
        </div>
        <ChevronDown
          size={12}
          strokeWidth={2}
          style={{
            color: T.label,
            flexShrink: 0,
            transform: pickerOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {pickerOpen && (
        <>
          <div
            data-testid="trade-asset-picker-backdrop"
            style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.55)" }}
            onClick={closePicker}
          />
          <div
            data-testid="trade-asset-picker"
            style={{
              position: "fixed",
              zIndex: 90,
              background: "#050505",
              border: `1px solid ${T.stroke}`,
              borderRadius: isMobile ? 0 : 14,
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.75)",
              display: "flex",
              flexDirection: "column",
              ...(isMobile
                ? { inset: 0 }
                : {
                    top: 96,
                    left: 32,
                    right: T.sidebarWidth + 32,
                    bottom: 24,
                  }),
            }}
          >
            {!isMobile && (
              <button
                data-testid="trade-asset-picker-close"
                onClick={closePicker}
                aria-label="Close market picker"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: 2,
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: `1px solid ${T.stroke}`,
                  background: "rgba(255,255,255,0.04)",
                  color: T.label,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} />
              </button>
            )}
            <div style={{ flex: 1, minHeight: 0 }}>
              <MarketBrowser
                mode="picker"
                allMarkets={markets}
                livePrices={livePrices}
                onSelectMarket={handleSelectMarket}
                isMobile={!!isMobile}
                activeSym={rawSym}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      data-testid="trade-page-header"
      style={{
        flexShrink: 0,
        padding: isMobile ? "12px 16px 0" : "12px 32px 0",
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 10 : 8,
      }}
    >
      {/* Row 1: title only */}
      <div
        style={{
          display: "inline-block",
          width: "fit-content",
          fontSize: isMobile ? 32 : 48,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          fontFamily: T.sans,
          backgroundImage: T.titleGradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }}
      >
        Trade
      </div>

      {/* Row 2: asset selector (left) + stats (right) — matches Figma */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {assetSelector}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px 20px",
            }}
          >
            {stats.map((s) => (
              <StatCell key={s.label} label={s.label} value={s.value} color={s.color} />
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            minHeight: 48,
          }}
        >
          {assetSelector}

          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 40,
              paddingRight: 520,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {stats.map((s) => (
              <StatCell key={s.label} label={s.label} value={s.value} color={s.color} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      data-testid={`trade-stat-${label.toLowerCase().replace(/\s/g, "-")}`}
      style={{ flexShrink: 0, textAlign: "left" }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.1em",
          color: T.label,
          fontFamily: T.sans,
          textTransform: "uppercase",
          marginBottom: 6,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color,
          fontFamily: T.mono,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}
