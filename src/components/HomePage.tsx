"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getIconWithJupiter } from "@/config/tokenIcons";
import { ONDO_CATALOGUE } from "@/config/ondoCatalogue";
import { SECTORS, getSector, type SectorKey } from "@/config/equitySectors";
import { useJupiterLogos } from "@/hooks/useJupiterLogos";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { MarketsIcon, TradeIcon, SwapIcon, PortfolioIcon, LeaderboardIcon, SettingsIcon } from "./navIcons";

const MONO = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const PERP_MARKET_MAP: Record<string, string> = {
  GOLD: "XAUUSDT",
  SILVER: "XAGUSDT",
  OIL: "CLUSDT",
  PAXG: "PAXGUSDT",
  AAPL: "AAPLUSDT",
  TSLA: "TSLAUSDT",
  NVDA: "NVDAUSDT",
  MSFT: "MSFTUSDT",
  AMZN: "AMZNUSDT",
  GOOG: "GOOGUSDT",
  META: "METAUSDT",
  MSTR: "MSTRUSDT",
  HOOD: "HOODUSDT",
  QQQ: "QQQUSDT",
  EWY: "EWYUSDT",
  AAVE: "AAVEUSDT",
  UNI: "UNIUSDT",
  LINK: "LINKUSDT",
  RENDER: "RENDERUSDT",
  INJ: "INJUSDT",
  PEPE: "1MPEPE-PERP",
  SHIB: "1000SHIBUSDT",
  BONK: "1MBONK-PERP",
  BNB: "BNBUSDT",
  HYPER: "HYPERUSDT",
  XRP: "XRPUSDT",
  BTC: "BTCUSDT",
  DOGE: "DOGEUSDT",
  FARTCOIN: "FARTCOINUSDT",
  TRUMP: "TRUMPUSDT",
  PENGU: "PENGUUSDT",
  PUMP: "PUMPUSDT",
};

function resolveMarket(symbol: string): string {
  return PERP_MARKET_MAP[symbol] || `${symbol}-PERP`;
}

function navigateToMarket(symbol: string) {
  const market = resolveMarket(symbol);
  window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "trade", market } }));
}

const TRENDING_PERPS = [
  { symbol: "BNB", leverage: "200x", color: "#F3BA2F" },
  { symbol: "SILVER", leverage: "100x", color: "#C0C0C0" },
  { symbol: "GOLD", leverage: "75x", color: "#FFD700" },
  { symbol: "XRP", leverage: "100x", color: "#00AAE4" },
  { symbol: "BTC", leverage: "200x", color: "#F7931A" },
  { symbol: "HYPER", leverage: "300x", color: "#00E5A0" },
];


const XSTOCK_SWAP_CATALOGUE = [
  { symbol: "AAPLx", name: "Apple" },
  { symbol: "NVDAx", name: "NVIDIA" },
  { symbol: "MSFTx", name: "Microsoft" },
  { symbol: "AMZNx", name: "Amazon" },
  { symbol: "GOOGLx", name: "Alphabet" },
  { symbol: "METAx", name: "Meta" },
  { symbol: "TSLAx", name: "Tesla" },
  { symbol: "AVGOx", name: "Broadcom" },
  { symbol: "BRK.Bx", name: "Berkshire Hathaway" },
  { symbol: "LLYx", name: "Eli Lilly" },
  { symbol: "JPMx", name: "JPMorgan Chase" },
  { symbol: "UNHx", name: "UnitedHealth" },
  { symbol: "Vx", name: "Visa" },
  { symbol: "MAx", name: "Mastercard" },
  { symbol: "GSx", name: "Goldman Sachs" },
  { symbol: "COINx", name: "Coinbase" },
  { symbol: "MSTRx", name: "MicroStrategy" },
  { symbol: "PLTRx", name: "Palantir" },
  { symbol: "HOODx", name: "Robinhood" },
  { symbol: "NFLXx", name: "Netflix" },
  { symbol: "AMDx", name: "AMD" },
  { symbol: "CRMx", name: "Salesforce" },
  { symbol: "ORCLx", name: "Oracle" },
  { symbol: "CRWDx", name: "CrowdStrike" },
  { symbol: "APPx", name: "AppLovin" },
  { symbol: "INTCx", name: "Intel" },
  { symbol: "CSCOx", name: "Cisco" },
  { symbol: "IBMx", name: "IBM" },
  { symbol: "ABTx", name: "Abbott" },
  { symbol: "ABBVx", name: "AbbVie" },
  { symbol: "ACNx", name: "Accenture" },
  { symbol: "AZNx", name: "AstraZeneca" },
  { symbol: "BACx", name: "Bank of America" },
  { symbol: "CVXx", name: "Chevron" },
  { symbol: "KOx", name: "Coca-Cola" },
  { symbol: "CMCSAx", name: "Comcast" },
  { symbol: "DHRx", name: "Danaher" },
  { symbol: "XOMx", name: "Exxon Mobil" },
  { symbol: "HDx", name: "Home Depot" },
  { symbol: "HONx", name: "Honeywell" },
  { symbol: "JNJx", name: "Johnson & Johnson" },
  { symbol: "LINx", name: "Linde" },
  { symbol: "MRVLx", name: "Marvell" },
  { symbol: "MCDx", name: "McDonald's" },
  { symbol: "MDTx", name: "Medtronic" },
  { symbol: "MRKx", name: "Merck" },
  { symbol: "NVOx", name: "Novo Nordisk" },
  { symbol: "PEPx", name: "PepsiCo" },
  { symbol: "PFEx", name: "Pfizer" },
  { symbol: "PMx", name: "Philip Morris" },
  { symbol: "PGx", name: "Procter & Gamble" },
  { symbol: "TMOx", name: "Thermo Fisher" },
  { symbol: "WMTx", name: "Walmart" },
  { symbol: "GMEx", name: "GameStop" },
  { symbol: "SPYx", name: "S&P 500" },
  { symbol: "QQQx", name: "Nasdaq 100" },
  { symbol: "TQQQx", name: "TQQQ" },
  { symbol: "IWMx", name: "Russell 2000" },
  { symbol: "IJRx", name: "S&P Small Cap" },
  { symbol: "VTx", name: "Vanguard Total World" },
  { symbol: "VTIx", name: "Vanguard Total Market" },
  { symbol: "IEMGx", name: "MSCI Emerging Markets" },
  { symbol: "SCHFx", name: "Schwab Intl Equity" },
  { symbol: "GLDx", name: "Gold" },
  { symbol: "SLVx", name: "iShares Silver Trust" },
  { symbol: "PALLx", name: "Palladium" },
  { symbol: "PPLTx", name: "Platinum" },
  { symbol: "COPXx", name: "Global X Copper Miners" },
  { symbol: "BTBTx", name: "Bit Digital" },
  { symbol: "BMNRx", name: "Bitmine" },
  { symbol: "BTGOx", name: "Bitgo" },
  { symbol: "CRCLx", name: "Circle" },
  { symbol: "AMBRx", name: "Amber" },
  { symbol: "TONXx", name: "TON" },
  { symbol: "DFDVx", name: "DFDV" },
  { symbol: "KRAQx", name: "KRAQ" },
  { symbol: "OPENx", name: "OPEN" },
  { symbol: "STRCx", name: "Strategy PP Variable" },
  { symbol: "TBLLx", name: "TBLL" },
];

const PRE_IPO_CATALOGUE = [
  { symbol: "SPACEX", name: "SpaceX", price: "$676.67", change: "+9.1%", mcap: "$1.60T", icon: "/icons/stocks/spacex.webp" },
  { symbol: "OPENAI", name: "OpenAI", price: "$1,163.25", change: "+0.8%", mcap: "$956B", icon: "/icons/stocks/openai.webp" },
  { symbol: "ANTHROPIC", name: "Anthropic", price: "$476.53", change: "+26.9%", mcap: "$699B", icon: "/icons/stocks/anthropic.jpg" },
  { symbol: "ANDURIL", name: "Anduril", price: "$126.96", change: "+4.9%", mcap: "$107B", icon: "/icons/stocks/anduril.webp" },
  { symbol: "KALSHI", name: "Kalshi", price: "$536.65", change: "+46.5%", mcap: "$19.3B", icon: "/icons/stocks/kalshi.webp" },
  { symbol: "POLYMARKET", name: "Polymarket", price: "$183.19", change: "+11.8%", mcap: "$15.9B", icon: "/icons/stocks/polymarket.webp" },
  { symbol: "XAI", name: "xAI", price: "$96.97", change: "", mcap: "$321B", icon: "/icons/stocks/xai.webp" },
];

const MEME_CATALOGUE = [
  { symbol: "DOGE", name: "Dogecoin", leverage: "75x", vol: "$11.9M", venues: 2, price: "$0.0940", change: "+0.19%" },
  { symbol: "PEPE", name: "Pepe", leverage: "75x", vol: "$4.2M", venues: 2, price: "$0.003414", change: "-0.32%" },
  { symbol: "FARTCOIN", name: "Fartcoin", leverage: "50x", vol: "$3.1M", venues: 2, price: "$0.1947", change: "-1.02%" },
  { symbol: "TRUMP", name: "Trump", leverage: "50x", vol: "$2.8M", venues: 2, price: "$3.357", change: "+0.39%" },
  { symbol: "SHIB", name: "Shiba Inu", leverage: "75x", vol: "$2.4M", venues: 1, price: "$0.006005", change: "-0.88%" },
  { symbol: "BONK", name: "Bonk", leverage: "75x", vol: "$1.9M", venues: 2, price: "$0.006000", change: "+0.84%" },
  { symbol: "PENGU", name: "Pudgy Penguins", leverage: "75x", vol: "$1.5M", venues: 2, price: "$0.007057", change: "-2.39%" },
  { symbol: "PUMP", name: "Pump", leverage: "75x", vol: "$1.2M", venues: 3, price: "$0.001864", change: "-0.37%" },
];

const COMMODITIES_CATALOGUE = [
  { symbol: "GOLD", name: "Gold", leverage: "75x", vol: "$17.2M", venues: 1, price: "$4,498.18", change: "-2.18%" },
  { symbol: "SILVER", name: "Silver", leverage: "100x", vol: "$10.4M", venues: 1, price: "$67.96", change: "-3.05%" },
  { symbol: "OIL", name: "Crude Oil", leverage: "50x", vol: "$5.6M", venues: 1, price: "$95.92", change: "-2.01%" },
  { symbol: "PAXG", name: "PAX Gold", leverage: "75x", vol: "$1.8M", venues: 2, price: "$4,507.53", change: "-1.92%" },
];

const DEFI_PERPS_CATALOGUE = [
  { symbol: "HYPE", name: "Hyperliquid", leverage: "300x", vol: "$17.7M", venues: 2, price: "$40.003", change: "+1.56%" },
  { symbol: "LINK", name: "Chainlink", leverage: "75x", vol: "$5.2M", venues: 2, price: "$9.068", change: "+0.39%" },
  { symbol: "AAVE", name: "Aave", leverage: "75x", vol: "$3.1M", venues: 1, price: "$111.99", change: "+1.75%" },
  { symbol: "UNI", name: "Uniswap", leverage: "75x", vol: "$2.4M", venues: 1, price: "$3.576", change: "+0.56%" },
  { symbol: "RENDER", name: "Render", leverage: "75x", vol: "$1.8M", venues: 2, price: "$1.711", change: "+0.35%" },
  { symbol: "INJ", name: "Injective", leverage: "75x", vol: "$1.5M", venues: 2, price: "$3.113", change: "+0.26%" },
];

const RWA_CATALOGUE = [
  { symbol: "AAPL", name: "Apple", category: "US Equity", leverage: "10x" },
  { symbol: "TSLA", name: "Tesla", category: "US Equity", leverage: "10x" },
  { symbol: "NVDA", name: "NVIDIA", category: "US Equity", leverage: "10x" },
  { symbol: "MSFT", name: "Microsoft", category: "US Equity", leverage: "10x" },
  { symbol: "AMZN", name: "Amazon", category: "US Equity", leverage: "10x" },
  { symbol: "GOOG", name: "Google", category: "US Equity", leverage: "10x" },
  { symbol: "META", name: "Meta", category: "US Equity", leverage: "10x" },
  { symbol: "MSTR", name: "MicroStrategy", category: "US Equity", leverage: "10x" },
  { symbol: "HOOD", name: "Robinhood", category: "US Equity", leverage: "10x" },
  { symbol: "DASH", name: "DoorDash", category: "US Equity", leverage: "10x" },
  { symbol: "GOLD", name: "Gold", category: "Commodity", leverage: "75x" },
  { symbol: "SILVER", name: "Silver", category: "Commodity", leverage: "100x" },
  { symbol: "QQQ", name: "Nasdaq 100", category: "ETF", leverage: "10x" },
  { symbol: "EWY", name: "South Korea", category: "ETF", leverage: "10x" },
];

function TrendingCard({ symbol, leverage, color, isActive }: {
  symbol: string; leverage: string; color: string; isActive: boolean;
}) {
  const jupLogos = useJupiterLogos();
  const icon = getIconWithJupiter(symbol, jupLogos);
  const displayName = symbol;

  return (
    <div
      data-testid={`card-trending-${symbol.toLowerCase()}`}
      style={{
        minWidth: 160,
        padding: "18px 16px",
        borderRadius: 14,
        background: isActive
          ? `linear-gradient(160deg, #080B0F, #0A0E13 40%, ${color}08 100%)`
          : "#080B0F",
        border: isActive
          ? `1px solid ${color}22`
          : "1px solid rgba(255,255,255,0.04)",
        boxShadow: isActive
          ? `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${color}10, inset 0 1px 0 rgba(255,255,255,0.03)`
          : "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: isActive ? 1 : 0.5,
        transform: isActive ? "scale(1)" : "scale(0.95)",
        cursor: "pointer",
        flexShrink: 0,
      }}
      onClick={() => navigateToMarket(symbol)}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon.type === "img" ? (
            <img
              src={icon.value}
              alt={displayName}
              style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>
              {icon.value}
            </div>
          )}
          <span style={{
            fontSize: 14, fontWeight: 700, color: "#E6EDF3",
            fontFamily: MONO, letterSpacing: "0.02em",
          }}>
            {displayName}
          </span>
        </div>
      </div>

      <div style={{
        height: 32, marginBottom: 12, position: "relative", overflow: "hidden",
        borderRadius: 4,
      }}>
        <MiniSparkline color={color} seed={symbol.length} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: color,
          fontFamily: MONO, letterSpacing: "0.04em",
        }}>
          PERP
        </span>
        <span style={{
          fontSize: 12, fontWeight: 700, color: "#E6EDF3",
          fontFamily: MONO, letterSpacing: "0.02em",
        }}>
          {leverage}
        </span>
      </div>
    </div>
  );
}

function MiniSparkline({ color, seed }: { color: string; seed: number }) {
  const points = Array.from({ length: 20 }, (_, i) => {
    const base = Math.sin(i * 0.5 + seed) * 8 + 16;
    const noise = Math.sin(i * 1.7 + seed * 3) * 4;
    return `${(i / 19) * 100},${base + noise}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`grad-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.7 }}
      />
      <polyline
        points={`0,32 ${points} 100,32`}
        fill={`url(#grad-${seed})`}
        stroke="none"
      />
    </svg>
  );
}

function NetworkCard({ name, icon, color }: {
  name: string; icon: string; color: string;
}) {
  return (
    <div
      data-testid={`card-network-${name.toLowerCase()}`}
      style={{
        padding: "16px 14px", borderRadius: 14,
        background: "#080B0F",
        border: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
        display: "flex", alignItems: "center", gap: 12,
      }}
    >
      <img
        src={icon}
        alt={name}
        style={{
          width: 40, height: 40, borderRadius: "50%",
          objectFit: "cover",
        }}
      />
      <div style={{
        fontSize: 16, fontWeight: 700, color: "#E6EDF3",
        fontFamily: SANS, lineHeight: 1.2,
      }}>
        {name}
      </div>
    </div>
  );
}

function RwaItem({ symbol, name, category, leverage }: { symbol: string; name: string; category: string; leverage: string }) {
  const jupLogos = useJupiterLogos();
  const icon = getIconWithJupiter(symbol, jupLogos);
  return (
    <div
      data-testid={`rwa-item-${symbol.toLowerCase()}`}
      onClick={() => navigateToMarket(symbol)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", borderRadius: 8,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}
    >
      {icon.type === "img" ? (
        <img src={icon.value} alt={symbol} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#E6EDF3" }}>{icon.value}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#E6EDF3", fontFamily: MONO }}>{symbol}</div>
        <div style={{ fontSize: 9, color: "#6B7280", fontFamily: SANS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#D4A574", fontFamily: MONO }}>{leverage}</div>
        <div style={{ fontSize: 7, fontWeight: 600, color: "#4A5060", fontFamily: MONO, letterSpacing: "0.04em", textTransform: "uppercase" }}>{category}</div>
      </div>
    </div>
  );
}

function DefiPerpItem({ symbol, name, leverage, vol, venues, price, change }: { symbol: string; name: string; leverage: string; vol: string; venues: number; price: string; change: string }) {
  const jupLogos = useJupiterLogos();
  const icon = getIconWithJupiter(symbol, jupLogos);
  const isPositive = change.startsWith("+");
  return (
    <div
      data-testid={`defi-item-${symbol.toLowerCase()}`}
      onClick={() => navigateToMarket(symbol)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", borderRadius: 8,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}
    >
      {icon.type === "img" ? (
        <img src={icon.value} alt={symbol} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#E6EDF3" }}>{icon.value}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#E6EDF3", fontFamily: MONO }}>{symbol}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#D4A574", fontFamily: MONO }}>{leverage}</span>
        </div>
        <div style={{ fontSize: 9, color: "#6B7280", fontFamily: MONO }}>Vol. {vol}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#E6EDF3", fontFamily: MONO }}>{price}</div>
        <div style={{ fontSize: 9, fontWeight: 600, color: isPositive ? "#22C55E" : "#EF4444", fontFamily: MONO }}>{change}</div>
      </div>
    </div>
  );
}

function XStockSwapItem({ symbol, name, onClose, underlying, jupiterLogos }: { symbol: string; name: string; onClose?: () => void; underlying?: string; jupiterLogos?: Record<string, string> }) {
  const baseSymbol = underlying || symbol.replace(/x$/, "").replace(/\.B$/, "");
  const icon = getIconWithJupiter(baseSymbol, jupiterLogos || {});
  const letterLen = icon.type === "letter" ? icon.value.length : 0;
  const letterFs = letterLen > 3 ? 7 : letterLen > 2 ? 8 : 9;
  return (
    <div
      data-testid={`xstock-${symbol.toLowerCase()}`}
      onClick={() => {
        onClose?.();
        window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "swap", outputSymbol: symbol } }));
      }}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10,
        background: "linear-gradient(145deg, rgba(17,22,28,0.6), rgba(8,11,15,0.8))",
        border: "1px solid rgba(212,165,116,0.08)",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,165,116,0.25)"; e.currentTarget.style.background = "linear-gradient(145deg, rgba(212,165,116,0.04), rgba(8,11,15,0.8))"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(212,165,116,0.08)"; e.currentTarget.style.background = "linear-gradient(145deg, rgba(17,22,28,0.6), rgba(8,11,15,0.8))"; }}
    >
      {icon.type === "img" ? (
        <img src={icon.value} alt={baseSymbol} style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(212,165,116,0.1)", border: "1px solid rgba(212,165,116,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: letterFs, fontWeight: 800, color: "#D4A574", fontFamily: MONO }}>{icon.value}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#E6EDF3", fontFamily: MONO }}>{name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 9, color: "#D4A574", fontFamily: MONO, fontWeight: 600 }}>{symbol}</span>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 8, color: "#D4A574", fontFamily: MONO, fontWeight: 600 }}>SWAP</div>
      </div>
    </div>
  );
}

const GLITCH_PHRASES = [
  "Pre-IPO Tokens",
  "Tokenized Equities",
  "Index ETFs",
  "Blue Chips",
  "Real-World Assets",
];

const GLITCH_CHARS = "!@#$%^&*_+-=[]{}|;:<>?/~`01";

function GlitchRotator() {
  const [displayText, setDisplayText] = useState(GLITCH_PHRASES[0]);
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const cycle = () => {
      const nextIdx = (phraseIdx + 1) % GLITCH_PHRASES.length;
      const target = GLITCH_PHRASES[nextIdx];
      const maxLen = Math.max(GLITCH_PHRASES[phraseIdx].length, target.length);
      let tick = 0;
      const totalTicks = 12;

      const glitch = () => {
        tick++;
        if (tick <= totalTicks) {
          const resolved = Math.floor((tick / totalTicks) * target.length);
          let str = target.slice(0, resolved);
          for (let i = resolved; i < maxLen; i++) {
            str += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          }
          setDisplayText(str);
          timeout = setTimeout(glitch, 40);
        } else {
          setDisplayText(target);
          setPhraseIdx(nextIdx);
        }
      };
      glitch();
    };
    const interval = setTimeout(cycle, 2600);
    return () => { clearTimeout(interval); clearTimeout(timeout); };
  }, [phraseIdx]);

  return (
    <span style={{ fontFamily: MONO, color: "#D4A574" }}>{displayText}</span>
  );
}

function XStocksTeaser({ onOpen }: { onOpen: () => void }) {
  const jupLogos = useJupiterLogos();
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        data-testid="xstocks-teaser"
        onClick={onOpen}
        style={{
          position: "relative", overflow: "hidden",
          borderRadius: 14, cursor: "pointer",
          background: "#000000",
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "24px 24px 20px",
          transition: "border-color 0.25s, box-shadow 0.25s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.4)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <div style={{
          position: "absolute", top: -40, right: -40, width: 200, height: 200,
          background: "radial-gradient(circle, rgba(212,165,116,0.04), transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -30, width: 180, height: 180,
          background: "radial-gradient(circle, rgba(255,255,255,0.015), transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <img src="/azabu-logo.png" alt="Azabu" style={{ height: 20, opacity: 0.85 }} />
          <div style={{
            fontSize: 8, color: "rgba(255,255,255,0.35)", fontFamily: MONO, fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Equities
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 20, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS,
            letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 6,
          }}>
            Trade <GlitchRotator />
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: SANS, lineHeight: 1.5 }}>
            {XSTOCK_SWAP_CATALOGUE.length + PRE_IPO_CATALOGUE.length + ONDO_CATALOGUE.length}+ instruments. On-chain settlement. 24/7.
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {XSTOCK_SWAP_CATALOGUE.slice(0, 6).map((item, i) => {
              const ic = getIconWithJupiter(item.symbol.replace(/x$/, "").replace(/\.B$/, ""), jupLogos);
              return ic.type === "img" ? (
                <img key={item.symbol} src={ic.value} alt="" style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: "1.5px solid #08090C",
                  marginLeft: i > 0 ? -6 : 0, objectFit: "cover",
                }} />
              ) : null;
            })}
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid #08090C",
              marginLeft: -6,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: MONO,
            }}>
              +{XSTOCK_SWAP_CATALOGUE.length - 6}
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "#D4A574", fontSize: 11, fontWeight: 600,
            fontFamily: SANS, letterSpacing: "0.01em",
          }}>
            Explore
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectorIcon({ sector, size = 12, color = "#6B7280" }: { sector: SectorKey; size?: number; color?: string }) {
  const s = size;
  const p: Record<string, () => JSX.Element> = {
    "tech-mega": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="8" rx="1.5" stroke={color} strokeWidth="1.3"/><path d="M6 14h4" stroke={color} strokeWidth="1.3" strokeLinecap="round"/><path d="M8 11v3" stroke={color} strokeWidth="1.3"/></svg>,
    "tech-growth": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 12l4-4 3 2 5-6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 4h3v3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    "ai-quantum": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke={color} strokeWidth="1.3"/><path d="M8 2v2.5M8 11.5V14M2 8h2.5M11.5 8H14M3.8 3.8l1.8 1.8M10.4 10.4l1.8 1.8M12.2 3.8l-1.8 1.8M5.6 10.4L3.8 12.2" stroke={color} strokeWidth="1" strokeLinecap="round"/></svg>,
    "cybersecurity": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 1.5L3 4v4c0 3.3 2.1 5.3 5 6.5 2.9-1.2 5-3.2 5-6.5V4L8 1.5z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 8l1.5 1.5L10.5 6" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    "finance": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="6" width="12" height="8" rx="1" stroke={color} strokeWidth="1.3"/><path d="M4 6V4.5a4 4 0 018 0V6" stroke={color} strokeWidth="1.3"/><circle cx="8" cy="10" r="1.5" stroke={color} strokeWidth="1.2"/></svg>,
    "crypto": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.3"/><path d="M6 6.5C6 5.67 6.9 5 8 5s2 .67 2 1.5S9.1 8 8 8s-2 .67-2 1.5S6.9 11 8 11s2-.67 2-1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round"/><path d="M8 4v1M8 11v1" stroke={color} strokeWidth="1.2" strokeLinecap="round"/></svg>,
    "healthcare": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M6 2h4v4h4v4h-4v4H6v-4H2V6h4V2z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    "consumer": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 4h2l1.5 7h7L14 5H5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6.5" cy="13.5" r="1" stroke={color} strokeWidth="1"/><circle cx="11.5" cy="13.5" r="1" stroke={color} strokeWidth="1"/></svg>,
    "industrials": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 14V8l4-3v3l4-3v3l4-3v8H2z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    "space": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2c0 0-3 3-3 7s3 5 3 5 3-1 3-5S8 2 8 2z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/><path d="M5.5 12l-2 1.5M10.5 12l2 1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="7" r="1" fill={color}/></svg>,
    "energy": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M9 1.5L4 9h4l-1 5.5L12 7H8l1-5.5z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    "mining": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 8l4-6 4 6" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/><path d="M2 14l2-6h8l2 6H2z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/><circle cx="8" cy="10" r="1.5" stroke={color} strokeWidth="1"/></svg>,
    "china-em": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.3"/><path d="M2 8h12M8 2c-2 2-2 10 0 12M8 2c2 2 2 10 0 12" stroke={color} strokeWidth="1" strokeLinecap="round"/></svg>,
    "telecom": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 10v4M6 14h4" stroke={color} strokeWidth="1.3" strokeLinecap="round"/><path d="M4.5 7.5a5 5 0 017 0" stroke={color} strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 5a8 8 0 0111 0" stroke={color} strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="10" r="1" fill={color}/></svg>,
    "real-estate": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 8l6-5 6 5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 8v5.5h10V8" stroke={color} strokeWidth="1.3"/><path d="M6.5 13.5v-3h3v3" stroke={color} strokeWidth="1.1"/></svg>,
    "semiconductors": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="4" y="4" width="8" height="8" rx="1" stroke={color} strokeWidth="1.3"/><path d="M6 4V2M10 4V2M6 12v2M10 12v2M4 6H2M4 10H2M12 6h2M12 10h2" stroke={color} strokeWidth="1.2" strokeLinecap="round"/></svg>,
    "index-etf": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="10" width="2.5" height="4" rx=".5" fill={color} opacity=".5"/><rect x="5.5" y="7" width="2.5" height="7" rx=".5" fill={color} opacity=".65"/><rect x="9" y="4" width="2.5" height="10" rx=".5" fill={color} opacity=".8"/><rect x="12.5" y="2" width="2.5" height="12" rx=".5" fill={color}/></svg>,
    "intl-etf": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.3"/><ellipse cx="8" cy="8" rx="3" ry="6" stroke={color} strokeWidth="1"/><path d="M2 8h12" stroke={color} strokeWidth="1"/></svg>,
    "bond-etf": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke={color} strokeWidth="1.3"/><path d="M2 6.5h12M5 3v10" stroke={color} strokeWidth="1" opacity=".5"/><path d="M7 8h4M7 10h3" stroke={color} strokeWidth="1" strokeLinecap="round"/></svg>,
    "commodity-etf": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 13c0-3 2-5 5-5s5 2 5 5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="5" r="2.5" stroke={color} strokeWidth="1.3"/></svg>,
    "infrastructure-etf": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 14V6M12 14V6M4 6l4-4 4 4" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 14h12" stroke={color} strokeWidth="1.3" strokeLinecap="round"/><path d="M4 9h8M4 11.5h8" stroke={color} strokeWidth="1" opacity=".4"/></svg>,
    "inverse-etf": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 4l4 4-3 2 5 4" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 4h3v3" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 4L10 8" stroke={color} strokeWidth="1.3" strokeLinecap="round"/></svg>,
    "other": () => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.3"/><circle cx="8" cy="11" r=".8" fill={color}/><path d="M6.5 6c0-1.1.67-2 1.5-2s1.5.9 1.5 2c0 .7-.5 1.2-1 1.5-.3.2-.5.5-.5.8V9" stroke={color} strokeWidth="1.2" strokeLinecap="round"/></svg>,
  };
  const Render = p[sector] || p["other"]!;
  return <Render />;
}

function XStocksModal({ onClose, isMobile, jupiterLogos }: { onClose: () => void; isMobile: boolean; jupiterLogos: Record<string, string> }) {
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    if (isMobile && searchRef.current) searchRef.current.focus();
    return () => { document.body.style.overflow = ""; };
  }, [isMobile]);

  const allEquities = useMemo(() => {
    const items: { symbol: string; name: string; underlying?: string; sector: SectorKey }[] = [];
    for (const item of XSTOCK_SWAP_CATALOGUE) {
      const u = item.symbol.replace(/x$/, "");
      items.push({ symbol: item.symbol, name: item.name, sector: getSector(u) });
    }
    for (const item of ONDO_CATALOGUE) {
      items.push({ symbol: item.symbol, name: item.name, underlying: item.underlying, sector: getSector(item.underlying) });
    }
    return items;
  }, []);

  const filtered = useMemo(() => {
    let list = allEquities;
    if (activeSector) list = list.filter(i => i.sector === activeSector);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || (i.underlying || "").toLowerCase().includes(q));
    }
    return list;
  }, [allEquities, activeSector, search]);

  const grouped = useMemo(() => {
    const map = new Map<SectorKey, typeof filtered>();
    for (const item of filtered) {
      const arr = map.get(item.sector) || [];
      arr.push(item);
      map.set(item.sector, arr);
    }
    return SECTORS.filter(s => map.has(s.key)).map(s => ({ ...s, items: map.get(s.key)! }));
  }, [filtered]);

  const sectorCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of allEquities) {
      counts.set(item.sector, (counts.get(item.sector) || 0) + 1);
    }
    return counts;
  }, [allEquities]);

  return (
    <div
      data-testid="xstocks-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: isMobile ? "#000000" : "rgba(0,0,0,0.75)",
        backdropFilter: isMobile ? "none" : "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0,
      }}
    >
      <div
        data-testid="xstocks-modal"
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute",
          ...(isMobile ? { inset: 0 } : {
            top: 48, left: "50%", bottom: 16,
            transform: "translateX(-50%)", width: "min(90vw, 860px)",
          }),
          borderRadius: isMobile ? 0 : 16,
          background: "#000000",
          border: isMobile ? "none" : "1px solid rgba(212,165,116,0.15)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{
          flexShrink: 0,
          padding: isMobile ? "12px 16px 10px" : "20px 20px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: isMobile ? "#000000" : "linear-gradient(135deg, rgba(212,165,116,0.04), transparent 60%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            {isMobile ? (
              <button
                data-testid="xstocks-modal-back"
                onClick={onClose}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  color: "#E6EDF3", fontSize: 13, fontWeight: 600, fontFamily: SANS,
                  padding: "4px 0",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                Equities
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src="/azabu-logo.png" alt="Azabu" style={{ height: 18, opacity: 0.85 }} />
                <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)" }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>Stocks & Pre-IPO</div>
                  <div style={{ fontSize: 9, color: "#6B7280", fontFamily: MONO }}>Equity perpetuals on Aster &amp; Hyperliquid</div>
                </div>
              </div>
            )}
            {!isMobile && (
              <button
                data-testid="xstocks-modal-close"
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "none",
                  width: 28, height: 28, borderRadius: 8, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#6B7280",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <input
              ref={searchRef}
              data-testid="xstocks-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${allEquities.length} equities...`}
              style={{
                width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                color: "#E6EDF3", fontSize: 12, fontFamily: SANS, outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(212,165,116,0.3)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <div style={{
            display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2,
            scrollbarWidth: "none",
          }}>
            <button
              data-testid="sector-filter-all"
              onClick={() => setActiveSector(null)}
              style={{
                flexShrink: 0, padding: "5px 10px", borderRadius: 6,
                border: "1px solid " + (!activeSector ? "rgba(212,165,116,0.4)" : "rgba(255,255,255,0.06)"),
                background: !activeSector ? "rgba(212,165,116,0.1)" : "rgba(255,255,255,0.03)",
                color: !activeSector ? "#D4A574" : "#6B7280",
                fontSize: 10, fontWeight: 600, fontFamily: SANS, cursor: "pointer",
                whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
              }}
            >
              All
              <span style={{ fontSize: 9, opacity: 0.7 }}>{allEquities.length}</span>
            </button>
            {SECTORS.filter(s => sectorCounts.has(s.key)).map(s => {
              const active = activeSector === s.key;
              return (
                <button
                  key={s.key}
                  data-testid={`sector-filter-${s.key}`}
                  onClick={() => setActiveSector(active ? null : s.key)}
                  style={{
                    flexShrink: 0, padding: "5px 10px", borderRadius: 6,
                    border: "1px solid " + (active ? "rgba(212,165,116,0.4)" : "rgba(255,255,255,0.06)"),
                    background: active ? "rgba(212,165,116,0.1)" : "rgba(255,255,255,0.03)",
                    color: active ? "#D4A574" : "#6B7280",
                    fontSize: 10, fontWeight: 500, fontFamily: SANS, cursor: "pointer",
                    whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <SectorIcon sector={s.key} size={11} color={active ? "#D4A574" : "#6B7280"} />
                  {s.label}
                  <span style={{ fontSize: 9, opacity: 0.6 }}>{sectorCounts.get(s.key)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 16px", minHeight: 0, WebkitOverflowScrolling: "touch" }}>
          {!activeSector && !search && (
            <>
              <div style={{
                fontSize: 9, fontWeight: 600, color: "rgba(212,165,116,0.7)",
                fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase",
                marginBottom: 8, paddingLeft: 2,
              }}>
                Pre-IPO Tokens
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 18 }}>
                {PRE_IPO_CATALOGUE.map(item => (
                  <div
                    key={item.symbol}
                    data-testid={`preipo-${item.symbol.toLowerCase()}`}
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "swap", outputSymbol: item.symbol } }));
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10,
                      background: "rgba(212,165,116,0.03)",
                      border: "1px solid rgba(212,165,116,0.08)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,165,116,0.2)"; e.currentTarget.style.background = "rgba(212,165,116,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(212,165,116,0.08)"; e.currentTarget.style.background = "rgba(212,165,116,0.03)"; }}
                  >
                    <img src={item.icon} alt={item.name} style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>{item.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 9, color: "#D4A574", fontFamily: MONO, fontWeight: 600 }}>{item.symbol}</span>
                        <span style={{ fontSize: 8, color: "#4A5060", fontFamily: MONO }}>Pre-IPO</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#E6EDF3", fontFamily: MONO }}>{item.price}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 2 }}>
                        {item.change && (
                          <span style={{ fontSize: 9, fontWeight: 600, fontFamily: MONO, color: item.change.startsWith("+") ? "#22C55E" : "#EF4444" }}>{item.change}</span>
                        )}
                        <span style={{ fontSize: 8, color: "#4A5060", fontFamily: MONO }}>{item.mcap}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {grouped.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#4A5060", fontSize: 12, fontFamily: SANS }}>
              No equities match your search.
            </div>
          )}

          {grouped.map(group => (
            <div key={group.key} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.3)",
                fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase",
                marginBottom: 8, paddingLeft: 2,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <SectorIcon sector={group.key} size={11} color="rgba(255,255,255,0.3)" />
                <span>{group.label}</span>
                <span style={{ color: "rgba(255,255,255,0.12)" }}>{group.items.length}</span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
                gap: 5,
              }}>
                {group.items.map(item => (
                  <XStockSwapItem key={item.symbol} symbol={item.symbol} name={item.name} onClose={onClose} underlying={item.underlying} jupiterLogos={jupiterLogos} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {!isMobile && (
          <div style={{
            flexShrink: 0,
            padding: "10px 16px 12px", borderTop: "1px solid rgba(255,255,255,0.04)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#0D1219",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#FFF" }}>A</div>
              <span style={{ fontSize: 8, color: "#4A5060", fontFamily: MONO }}>Equity perps on Aster &amp; Hyperliquid</span>
            </div>
            <button
              data-testid="xstocks-swap-cta"
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "swap" } }));
              }}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg, #D4A574, #D4551F)",
                color: "#fff", fontSize: 10, fontWeight: 700,
                fontFamily: SANS, cursor: "pointer",
              }}
            >
              Start Swapping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


function BalanceStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#6B7280", fontFamily: MONO, letterSpacing: "0.04em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#8B949E", fontFamily: MONO }}>
        ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const isMobile = useIsMobile();
  const { data: portfolio, loading: portfolioLoading } = usePortfolioData();
  const { evmAddress } = useEvmWallet();
  const anyWalletConnected = !!evmAddress;
  const jupiterLogos = useJupiterLogos();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const advance = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % TRENDING_PERPS.length);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(advance, 2800);
    return () => clearInterval(timer);
  }, [advance, isHovered]);

  const visibleStart = activeIndex;
  const cardCount = isMobile ? 2 : 3;

  const getVisibleIndices = () => {
    const indices: number[] = [];
    for (let i = 0; i < cardCount; i++) {
      indices.push((visibleStart + i) % TRENDING_PERPS.length);
    }
    return indices;
  };

  const visibleIndices = getVisibleIndices();

  return (
    <div
      data-testid="page-home-content"
      style={{
        height: "100%", overflowY: "auto",
        display: "flex", flexDirection: "column", alignItems: isMobile ? "center" : "flex-start",
        padding: isMobile ? "12px 12px 100px" : "48px 48px 80px",
      }}
    >
      <div style={{ maxWidth: isMobile ? 600 : "100%", width: "100%" }}>

        <div style={{ marginBottom: isMobile ? 12 : 28 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
            gap: isMobile ? 6 : 10,
          }}>
            {[
              { id: "swap",        label: "Swap",        page: "swap",        icon: <SwapIcon active={true} size={22} /> },
              { id: "perpswap",    label: "Trade",       page: "trade",       icon: <TradeIcon active={true} size={22} />, highlight: true },
              { id: "perps",       label: "Markets",     page: "perps",       icon: <MarketsIcon active={true} size={22} /> },
              { id: "portfolio",   label: "Portfolio",   page: "portfolio",   icon: <PortfolioIcon active={true} size={22} /> },
              { id: "leaderboard", label: "Leaderboard", page: "leaderboard", icon: <LeaderboardIcon active={true} size={22} /> },
              { id: "settings",    label: "Settings",    page: "settings",    icon: <SettingsIcon active={true} size={22} /> },
            ].map(btn => {
              const isHighlight = (btn as { highlight?: boolean }).highlight;
              return (
                <button
                  key={btn.id}
                  data-testid={`action-${btn.id}`}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: btn.page } }));
                  }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: isMobile ? "12px 6px" : "16px 8px", borderRadius: 10,
                    background: isHighlight ? "rgba(212,165,116,0.07)" : "rgba(255,255,255,0.025)",
                    border: isHighlight ? "1px solid rgba(212,165,116,0.22)" : "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer", transition: "all 0.15s",
                    boxShadow: isHighlight ? "0 0 18px rgba(212,165,116,0.06)" : "none",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isHighlight ? "rgba(212,165,116,0.13)" : "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = isHighlight ? "rgba(212,165,116,0.4)" : "rgba(255,255,255,0.12)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isHighlight ? "rgba(212,165,116,0.07)" : "rgba(255,255,255,0.025)";
                    e.currentTarget.style.borderColor = isHighlight ? "rgba(212,165,116,0.22)" : "rgba(255,255,255,0.06)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {btn.icon}
                  <span style={{
                    fontSize: isMobile ? 8 : 10, fontWeight: isHighlight ? 700 : 500,
                    color: isHighlight ? "#E8C4A0" : "rgba(255,255,255,0.55)",
                    fontFamily: MONO, letterSpacing: "0.04em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {btn.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          data-testid="home-portfolio-card"
          style={{
            marginBottom: 28,
            padding: isMobile ? "12px 12px 10px" : "20px 20px 18px",
            borderRadius: 14,
            background: "linear-gradient(145deg, rgba(17,22,28,0.95), rgba(13,17,23,0.95))",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            <Wallet size={12} style={{ color: "#D4A574" }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#D4A574",
              fontFamily: SANS,
            }}>
              Portfolio
            </span>
          </div>

          {!anyWalletConnected ? (
            <div>
              <div style={{
                fontSize: isMobile ? 24 : 34, fontWeight: 800, color: "#E6EDF3",
                fontFamily: SANS, letterSpacing: "-0.03em",
                marginBottom: 4, lineHeight: 1,
              }}>
                $0.00
              </div>
              <div style={{
                fontSize: 10, color: "#6B7280", fontFamily: SANS,
                marginBottom: 10, lineHeight: 1.4,
              }}>
                Connect a wallet to view your balance.
              </div>
              <button
                data-testid="button-home-connect-wallet"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("afx-open-wallet-modal"));
                }}
                style={{
                  padding: "8px 16px", borderRadius: 6,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#E6EDF3", fontSize: 10, fontWeight: 600,
                  fontFamily: SANS, cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                Connect Wallet
              </button>
            </div>
          ) : portfolioLoading ? (
            <div>
              <div style={{
                fontSize: isMobile ? 24 : 40, fontWeight: 300, color: "#3A3F4E",
                fontFamily: MONO, letterSpacing: "-0.03em",
                lineHeight: 1,
              }}>
                --
              </div>
              <div style={{ fontSize: 10, color: "#484F58", fontFamily: SANS, marginTop: 6 }}>
                Loading balances...
              </div>
            </div>
          ) : (
            <div>
              <div
                data-testid="text-home-net-worth"
                style={{
                  fontSize: isMobile ? 24 : 40, fontWeight: 300, color: "#E6EDF3",
                  fontFamily: MONO, letterSpacing: "-0.03em",
                  marginBottom: 10, lineHeight: 1,
                }}
              >
                ${(portfolio?.totalNetWorth ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ display: "flex", gap: isMobile ? 12 : 20, flexWrap: "wrap" }}>
                <BalanceStat label="Wallet" value={portfolio?.walletBalance ?? 0} />
                <BalanceStat label="Free Margin" value={portfolio?.freeMargin ?? 0} />
                <BalanceStat label="Collateral" value={portfolio?.usedCollateral ?? 0} />
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 10,
          }}>
            <div style={{
              fontSize: 9, fontWeight: 600, color: "#4A5060",
              fontFamily: MONO, letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              Trending Perpetuals
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {TRENDING_PERPS.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: visibleIndices.includes(i) ? "#E6EDF3" : "rgba(255,255,255,0.12)",
                    cursor: "pointer",
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>
          </div>

          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
              gap: isMobile ? 6 : 10,
            }}
          >
            {visibleIndices.map(idx => {
              const perp = TRENDING_PERPS[idx];
              return (
                <TrendingCard
                  key={`${perp.symbol}-${idx}`}
                  symbol={perp.symbol}
                  leverage={perp.leverage}
                  color={perp.color}
                  isActive={true}
                />
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 9, fontWeight: 600, color: "#4A5060",
            fontFamily: MONO, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 10,
          }}>
            Supported Networks
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            <NetworkCard
              name="Ethereum"
              icon="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png"
              color="#627EEA"
            />
            <NetworkCard
              name="Arbitrum"
              icon="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png"
              color="#28A0F0"
            />
          </div>

        </div>


        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 9, fontWeight: 600, color: "#4A5060",
            fontFamily: MONO, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 8,
          }}>
            Equity Perpetuals
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr",
            gap: 4,
          }}>
            {RWA_CATALOGUE.map(r => (
              <RwaItem key={r.symbol} {...r} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 9, fontWeight: 600, color: "#4A5060",
            fontFamily: MONO, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 8,
          }}>
            DeFi Perpetuals
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr",
            gap: 4,
          }}>
            {DEFI_PERPS_CATALOGUE.map(d => (
              <DefiPerpItem key={d.symbol} {...d} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 9, fontWeight: 600, color: "#4A5060",
            fontFamily: MONO, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 8,
          }}>
            Tokenized Commodities
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr",
            gap: 4,
          }}>
            {COMMODITIES_CATALOGUE.map(d => (
              <DefiPerpItem key={d.symbol} {...d} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 9, fontWeight: 600, color: "#4A5060",
            fontFamily: MONO, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 8,
          }}>
            Meme Perpetuals
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr",
            gap: 4,
          }}>
            {MEME_CATALOGUE.map(d => (
              <DefiPerpItem key={d.symbol} {...d} />
            ))}
          </div>
        </div>

        <div style={{ textAlign: "left" }}>
          <button
            data-testid="button-start-trading"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "trade" } }));
            }}
            style={{
              padding: "12px 32px", borderRadius: 10,
              background: "linear-gradient(135deg, #D4A574, #D4541E)",
              border: "none", color: "#fff",
              fontSize: 13, fontWeight: 700,
              fontFamily: SANS, cursor: "pointer",
              letterSpacing: "0.02em",
              boxShadow: "0 4px 16px rgba(212,165,116,0.25)",
              transition: "opacity 0.15s, transform 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Start Trading
          </button>
        </div>
      </div>
      <img
        src="/azabu-logo.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute", bottom: 40, right: 40,
          width: 120, height: 120, opacity: 0.018,
          pointerEvents: "none", userSelect: "none",
          filter: "grayscale(1)",
        }}
      />
    </div>
  );
}
