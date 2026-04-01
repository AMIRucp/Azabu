"use client";
import { useEffect, useRef, useCallback } from "react";
import { T, mono } from "./PerpsTerminal";

interface AsterProTerminalProps {
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

declare global {
  interface Window {
    FuturesSDK?: {
      createTradeUI: (options: any) => void;
      eventListener: {
        on: (event: string, handler: (data?: any) => void) => void;
      };
    };
  }
}

export default function AsterProTerminal({ symbol = "BTCUSDT", onSymbolChange }: AsterProTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const scriptLoaded = useRef(false);

  const initSDK = useCallback(() => {
    if (!containerRef.current || !window.FuturesSDK || initialized.current) return;
    initialized.current = true;

    const { origin } = window.location;

    window.FuturesSDK.createTradeUI({
      container: containerRef.current,
      config: {
        staticBaseUrl: `/aster-sdk/static/`,
        futuresWsHost: "wss://fstream.asterdex.com/compress",
        apiBaseUrl: origin,
        enableThemeToggle: false,
        supportLanguages: ["en"] as const,
        headerConfig: {
          disable: true,
        },
        footerConfig: {
          disable: true,
        },
        darkPalette: {
          primary: "#f97316",
          primaryHover: "#fb923c",
          buy: "#00d492",
          buyHover: "#00e6a0",
          sell: "#ef4461",
          sellHover: "#f25e78",
          bg1: T.bg,
          bg2: T.bgCard,
          bg3: T.bgEl,
          bg4: T.bgHover,
          bg5: T.bgInput,
          overallBg: T.bg,
          moduleBg: T.bgCard,
          newLine: T.border,
          depthBuyBg: "rgba(0,212,146,0.12)",
          depthSellBg: "rgba(239,68,97,0.12)",
          t: {
            primary: T.text,
            secondary: T.text2,
            third: T.text3,
            disabled: "#2a2a3a",
            yellow: T.yellow,
            sell: T.red,
            buy: T.green,
            white: "#ffffff",
            emphasize: "#ffffff",
          },
        },
        defaultTheme: "dark",
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
        proGridLayoutMargin: [2, 2],
      },
      state: {
        symbol,
        lng: "en",
      },
    });

    window.FuturesSDK.eventListener.on("symbolChange", (data: { symbol: string }) => {
      onSymbolChange?.(data.symbol);
    });
  }, [symbol, onSymbolChange]);

  useEffect(() => {
    let cancelled = false;

    const waitForSDK = (timeout = 5000) => {
      const start = Date.now();
      const poll = () => {
        if (cancelled) return;
        if (window.FuturesSDK) {
          scriptLoaded.current = true;
          initSDK();
          return;
        }
        if (Date.now() - start < timeout) {
          requestAnimationFrame(poll);
        }
      };
      poll();
    };

    if (window.FuturesSDK) {
      scriptLoaded.current = true;
      initSDK();
      return () => { cancelled = true; initialized.current = false; };
    }

    const existing = document.querySelector('script[src*="sdk.1.9.11"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => waitForSDK(1000), { once: true });
      waitForSDK();
      return () => { cancelled = true; initialized.current = false; };
    }

    const script = document.createElement("script");
    script.src = "/aster-sdk/sdk/sdk.1.9.11.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      if (!cancelled) initSDK();
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      initialized.current = false;
    };
  }, [initSDK]);

  return (
    <div
      data-testid="aster-pro-terminal"
      style={{
        width: "100%",
        height: "100%",
        background: T.bg,
        position: "relative",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
