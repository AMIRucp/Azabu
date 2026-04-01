"use client";

import { useState, useEffect } from "react";
import { EvmSwapContent } from "@/components/swap/EvmSwapContent";

const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

function navigateToTrade(embedded?: boolean) {
  window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "trade" } }));
  if (!embedded) {
    window.location.href = "/trade";
  }
}

export function SwapPageContent({ embedded, onSwapComplete }: {
  embedded?: boolean;
  onSwapComplete?: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "perps") {
        navigateToTrade(embedded);
        return;
      }
      const assetParam = params.get("asset");
      if (assetParam) {
        localStorage.setItem("afx_perps_asset", assetParam);
        navigateToTrade(embedded);
        return;
      }
    }
  }, [embedded]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const perpsAsset = localStorage.getItem("afx_perps_preselect");
      if (perpsAsset && detail?.page !== "trade") {
        localStorage.removeItem("afx_perps_preselect");
        navigateToTrade(embedded);
      }
    };
    window.addEventListener("afx-navigate", handler);
    return () => window.removeEventListener("afx-navigate", handler);
  }, [embedded]);

  return (
    <div
      style={{
        width: "100%", maxWidth: 420, margin: "0 auto",
        background: "transparent",
        opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.4s, transform 0.4s",
      }}
      data-testid="swap-page-content"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap');
        @keyframes swpFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .swp-field:focus { outline: none; }
        .swp-field::placeholder { color: #1B2030 !important; }
        .swp-field::-webkit-inner-spin-button,
        .swp-field::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .swp-field { -moz-appearance: textfield; }
      `}</style>

      <div style={{ padding: "0 0 8px", fontFamily: SANS }}>
        <EvmSwapContent onComplete={onSwapComplete} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
        <img
          src="/azabu-logo.png"
          alt=""
          aria-hidden="true"
          style={{
            width: 16, height: 16, opacity: 0.06,
            pointerEvents: "none", userSelect: "none",
            filter: "grayscale(0.5)",
          }}
        />
      </div>
    </div>
  );
}

export default SwapPageContent;
