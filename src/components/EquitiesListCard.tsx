import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface EquityItem {
  ticker: string;
  name: string;
  alias?: string;
}

interface ProviderData {
  label: string;
  description: string;
  categories: Record<string, EquityItem[]>;
}

const EQUITIES_DATA: Record<string, ProviderData> = {
  xstocks: {
    label: "xStocks by Backed",
    description: "1:1 backed SPL tokens -- $200M+ TVL -- 24/7 trading",
    categories: {
      "Tech Giants": [
        { ticker: "AAPLx", name: "Apple Inc.", alias: "AAPL" },
        { ticker: "NVDAx", name: "Nvidia", alias: "NVDA" },
        { ticker: "MSFTx", name: "Microsoft", alias: "MSFT" },
        { ticker: "METAx", name: "Meta Platforms", alias: "META" },
        { ticker: "AMZNx", name: "Amazon", alias: "AMZN" },
        { ticker: "TSLAx", name: "Tesla", alias: "TSLA" },
        { ticker: "NFLXx", name: "Netflix", alias: "NFLX" },
        { ticker: "INTCx", name: "Intel", alias: "INTC" },
        { ticker: "COINx", name: "Coinbase", alias: "COIN" },
        { ticker: "CRWDx", name: "CrowdStrike", alias: "CRWD" },
        { ticker: "MSTRx", name: "MicroStrategy", alias: "MSTR" },
      ],
      "Finance & Pharma": [
        { ticker: "GSx", name: "Goldman Sachs", alias: "GS" },
        { ticker: "IBMx", name: "IBM", alias: "IBM" },
        { ticker: "KOx", name: "Coca-Cola", alias: "KO" },
        { ticker: "LLYx", name: "Eli Lilly", alias: "LLY" },
        { ticker: "MRKx", name: "Merck", alias: "MRK" },
        { ticker: "HDx", name: "Home Depot", alias: "HD" },
        { ticker: "XOMx", name: "Exxon Mobil", alias: "XOM" },
        { ticker: "GMEx", name: "GameStop", alias: "GME" },
      ],
      "ETFs & Indices": [
        { ticker: "SPYx", name: "S&P 500 ETF (SPY)", alias: "SPY" },
        { ticker: "QQQx", name: "Nasdaq 100 ETF", alias: "QQQ" },
        { ticker: "GLDx", name: "Gold ETF (GLD)", alias: "GLD" },
      ],
    },
  },
  ondo: {
    label: "Ondo Global Markets",
    description: "200+ U.S. stocks & ETFs -- total return trackers, 24/5 trading, 1:1 backed",
    categories: {
      "Tech & AI": [
        { ticker: "TSLAon", name: "Tesla", alias: "TSLA" },
        { ticker: "NVDAon", name: "Nvidia", alias: "NVDA" },
        { ticker: "AAPLon", name: "Apple Inc.", alias: "AAPL" },
        { ticker: "MSFTon", name: "Microsoft", alias: "MSFT" },
        { ticker: "METAon", name: "Meta Platforms", alias: "META" },
        { ticker: "AMZNon", name: "Amazon", alias: "AMZN" },
        { ticker: "GOOGLon", name: "Google", alias: "GOOGL" },
        { ticker: "AVGOon", name: "Broadcom", alias: "AVGO" },
        { ticker: "CRWDon", name: "CrowdStrike", alias: "CRWD" },
        { ticker: "PLTRon", name: "Palantir", alias: "PLTR" },
      ],
      "Finance & Healthcare": [
        { ticker: "COINon", name: "Coinbase", alias: "COIN" },
        { ticker: "JPMon", name: "JPMorgan Chase", alias: "JPM" },
        { ticker: "GSon", name: "Goldman Sachs", alias: "GS" },
        { ticker: "Von", name: "Visa", alias: "V" },
        { ticker: "LLYon", name: "Eli Lilly", alias: "LLY" },
        { ticker: "UNHon", name: "UnitedHealth", alias: "UNH" },
        { ticker: "MSTRon", name: "MicroStrategy", alias: "MSTR" },
      ],
      "ETFs & Indices": [
        { ticker: "SPYon", name: "S&P 500 ETF", alias: "SPY" },
        { ticker: "QQQon", name: "Nasdaq 100 ETF", alias: "QQQ" },
        { ticker: "TQQQon", name: "Leveraged Nasdaq 3x", alias: "TQQQ" },
      ],
    },
  },
  commodities: {
    label: "Commodities & Metals (RWA)",
    description: "Tokenized real-world commodity exposure on Solana",
    categories: {
      "Precious Metals": [
        { ticker: "GOLD", name: "Gold (Gold Issuance)" },
        { ticker: "XAUt0", name: "Tether Gold" },
        { ticker: "GLDr", name: "Gold rStock (Remora)" },
        { ticker: "SLVr", name: "Silver rStock (Remora)" },
        { ticker: "PPLTr", name: "Platinum rStock (Remora)" },
        { ticker: "PALLr", name: "Palladium rStock (Remora)" },
      ],
      "Industrial Metals": [
        { ticker: "CPERr", name: "Copper rStock (Remora)" },
      ],
    },
  },
};

interface EquitiesListCardProps {
  onSendMessage?: (text: string) => void;
}

export function EquitiesListCard({ onSendMessage }: EquitiesListCardProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className="w-full max-w-lg rounded-xl overflow-hidden"
      style={{
        background: "#111520",
        border: "1px solid #1B2030",
      }}
      data-testid="equities-list-card"
    >
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: "#1B2030" }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: "#E6EDF3" }}
          data-testid="text-equities-title"
        >
          Tokenized Equities on AFX
        </h3>
        <p
          className="text-xs mt-1"
          style={{ color: "#9BA4AE" }}
        >
          All tokens trade 24/7 on Solana via Jupiter. Tap any ticker to trade.
        </p>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(EQUITIES_DATA).map(([key, provider]) => {
          const isCollapsed = collapsed[key];
          return (
            <div
              key={key}
              className="pb-3"
              style={{ borderBottom: "1px solid #1B2030" }}
              data-testid={`section-provider-${key}`}
            >
              <button
                className="w-full flex items-center justify-between mb-1"
                onClick={() => toggleSection(key)}
                data-testid={`button-toggle-${key}`}
              >
                <div className="text-left">
                  <div
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "#E6EDF3" }}
                  >
                    {provider.label}
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "#9BA4AE" }}
                  >
                    {provider.description}
                  </div>
                </div>
                {isCollapsed ? (
                  <ChevronDown size={14} style={{ color: "#9BA4AE" }} />
                ) : (
                  <ChevronUp size={14} style={{ color: "#9BA4AE" }} />
                )}
              </button>

              {!isCollapsed &&
                Object.entries(provider.categories).map(([cat, items]) => (
                  <div key={cat} className="mt-2">
                    <div
                      className="text-[10px] uppercase tracking-wider mb-1.5"
                      style={{ color: "#9BA4AE" }}
                    >
                      {cat}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <button
                          key={item.ticker}
                          className="flex flex-col items-start px-2.5 py-1.5 rounded-lg transition-all duration-150"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(255,255,255,0.08)";
                            e.currentTarget.style.borderColor =
                              "rgba(255,255,255,0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "rgba(255,255,255,0.03)";
                            e.currentTarget.style.borderColor =
                              "rgba(255,255,255,0.06)";
                          }}
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "swap", outputSymbol: item.ticker } }));
                          }}
                          data-testid={`button-ticker-${item.ticker}`}
                        >
                          <span
                            className="text-xs font-bold font-mono"
                            style={{ color: "#FFFFFF" }}
                          >
                            {item.ticker}
                          </span>
                          <span
                            className="text-[10px]"
                            style={{ color: "#9BA4AE" }}
                          >
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>

      <div
        className="px-5 py-3 text-[11px]"
        style={{ color: "#9BA4AE", borderTop: "1px solid #1B2030" }}
      >
Tokenized assets are SPL tokens, not direct ownership. Not SIPC insured. Ondo GM tokens are total return trackers available to non-US investors. Trade at your own risk.
      </div>
    </div>
  );
}
