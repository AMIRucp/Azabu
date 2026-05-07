"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, QrCode, ChevronRight } from "lucide-react";
import { DepositModal } from "./DepositModal";
import { WithdrawModal } from "./WithdrawModal";
import { SendModal } from "./portfolio/SendModal";
import { ReceiveModal } from "./portfolio/ReceiveModal";
import { usePortfolioData, type ChainFilter } from "@/hooks/usePortfolioData";
import usePositionStore from "@/stores/usePositionStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { WalletSelectModal } from "./WalletSelectModal";
import { formatUsd, CHAIN_COLORS } from "./portfolio/PortfolioCharts";
import PositionsTable from "./portfolio/PositionsTable";
import BalancesTab from "./portfolio/BalancesTable";
import DepositsTab from "./portfolio/DepositsTab";
import useSettingsStore from "@/stores/useSettingsStore";
import { getIconWithJupiter } from "@/config/tokenIcons";
import { useJupiterLogos } from "@/hooks/useJupiterLogos";
import { ConnectWalletEmblem } from "./ConnectWalletEmblem";

const MONO = "'IBM Plex Mono', 'SF Mono', monospace";
const SANS = "Inter, -apple-system, sans-serif";
const CARD   = "#0D0D0D";
const CARD2  = "#111111";
const BORDER = "#1C1C1C";
const BORDER2 = "#242424";
const ORANGE = "#D4A574";
const DIM    = "#4A4A4A";
const MID    = "#888888";
const BRIGHT = "#E6EDF3";

type ActiveTab = "overview" | "positions" | "balances" | "deposits";

const WATCH_TOKENS = [
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "SOL", name: "Solana" },
];

function formatBigUsd(v: number): string {
  if (useSettingsStore.getState().hideBalances) return "••••••";
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TokenIcon({ symbol, size = 28 }: { symbol: string; size?: number }) {
  const jupiterLogos = useJupiterLogos();
  const icon = getIconWithJupiter(symbol, jupiterLogos);
  if (icon.type === "img") {
    return <img src={icon.value} alt={symbol} width={size} height={size} style={{ borderRadius: "50%" }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 700, color: MID, fontFamily: MONO,
    }}>
      {icon.value}
    </div>
  );
}

function useTokenPrices() {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({
    ETH: { price: 0, change: 0 },
    BTC: { price: 0, change: 0 },
    SOL: { price: 0, change: 0 },
  });

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/markets/unified");
        if (!res.ok) return;
        const data = await res.json();
        const markets: any[] = data?.markets || [];
        const updated: Record<string, { price: number; change: number }> = {};
        
        for (const t of WATCH_TOKENS) {
          const match = markets.find((m: any) => {
            const base = m.baseAsset || "";
            return base === t.symbol;
          });
          
          updated[t.symbol] = match
            ? { 
                price: parseFloat(match.price || match.markPrice || "0"), 
                change: parseFloat(match.change24h || "0") 
              }
            : prices[t.symbol] || { price: 0, change: 0 };
        }
        setPrices(updated);
      } catch { }
    }
    fetchPrices();
    const iv = setInterval(fetchPrices, 2000);
    return () => clearInterval(iv);
  }, []);

  return prices;
}

function TabButton({ label, value, count, current, onClick }: {
  label: string; value: ActiveTab; count?: number; current: ActiveTab; onClick: (v: ActiveTab) => void;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      data-testid={`tab-${value}`}
      style={{
        padding: "8px 14px", fontSize: 11, fontWeight: active ? 600 : 400,
        fontFamily: SANS, letterSpacing: "0.01em",
        color: active ? BRIGHT : DIM,
        background: "transparent", border: "none",
        borderBottom: active ? `2px solid ${ORANGE}` : "2px solid transparent",
        cursor: "pointer", transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}{count !== undefined && count > 0 ? <span style={{
        marginLeft: 4, fontSize: 8, fontWeight: 700, fontFamily: MONO,
        background: ORANGE, color: "#fff", borderRadius: 8, padding: "0px 4px",
      }}>{count}</span> : null}
    </button>
  );
}

function ChainPill({ label, value, current, logo, onClick }: {
  label: string; value: ChainFilter; current: ChainFilter; logo?: string; onClick: (v: ChainFilter) => void;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      data-testid={`filter-chain-${value}`}
      style={{
        padding: "4px 10px", fontSize: 10, fontWeight: 600,
        fontFamily: SANS, letterSpacing: "0.03em",
        background: active ? "#1A1A1A" : "transparent",
        color: active ? BRIGHT : DIM,
        border: `1px solid ${active ? BORDER2 : "transparent"}`,
        borderRadius: 6, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 5,
        transition: "all 0.12s",
      }}
    >
      {logo && <img src={logo} alt={label} width={12} height={12} style={{ borderRadius: "50%", opacity: active ? 1 : 0.5 }} />}
      {label}
    </button>
  );
}

/* Stat pill inside the portfolio card */
function StatPill({ label, value, valueColor = MID }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 8, fontWeight: 600, color: DIM, fontFamily: SANS, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: valueColor, fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

/* Action button — slim horizontal row */
function ActionBtn({ label, icon, onClick, testId }: { label: string; icon: React.ReactNode; onClick: () => void; testId: string }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        padding: "9px 6px",
        background: hov ? "#161616" : CARD,
        border: `1px solid ${hov ? BORDER2 : BORDER}`,
        borderRadius: 8, cursor: "pointer",
        transition: "all 0.12s",
        flex: 1,
        minWidth: 0,
      }}
    >
      <span style={{ color: hov ? BRIGHT : MID, display: "flex", alignItems: "center", transition: "color 0.12s", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: hov ? BRIGHT : MID, fontFamily: SANS, transition: "color 0.12s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

/* Overview tab */
function OverviewTab({ positions, unrealizedPnl, freeMargin, usedCollateral }: {
  positions: any[]; unrealizedPnl: number; freeMargin: number; usedCollateral: number;
}) {
  if (positions.length === 0) {
    return (
      <div style={{ padding: "24px 12px", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: DIM, fontFamily: SANS, letterSpacing: "0.04em" }}>No open positions</div>
      </div>
    );
  }
  return (
    <div style={{ padding: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 6 }}>
        {[
          { label: "Unrealized PnL",   value: unrealizedPnl, color: unrealizedPnl >= 0 ? "#22C55E" : "#EF4444" },
          { label: "Free Margin",      value: freeMargin,    color: BRIGHT },
          { label: "Used Collateral",  value: usedCollateral, color: "#EF4444" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#0A0A0A", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: 7, color: DIM, fontFamily: SANS, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: MONO }}>{formatBigUsd(s.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const mobile = useIsMobile(640);
  const {
    loading, noWallet, chainFilter, setChainFilter, fetchPortfolio,
    walletBalance, protocolDeposits, freeMargin, usedCollateral,
    totalNetWorth, totalPnl, unrealizedPnl,
    walletTokens, deposits, positions, data,
    perpPositionCount,
  } = usePortfolioData();

  const refreshPositions = usePositionStore((s) => s.refresh);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [sendDefaultToken, setSendDefaultToken] = useState<string | undefined>(undefined);
  const [sendDefaultChain, setSendDefaultChain] = useState<"Arbitrum" | "Hyperliquid" | undefined>(undefined);
  const [receiveDefaultChain, setReceiveDefaultChain] = useState<"Arbitrum" | "Hyperliquid" | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [refreshing, setRefreshing] = useState(false);
  const tokenPrices = useTokenPrices();

  const holdingsCount = walletTokens.filter((t) => (t.valueUsd || 0) > 0.01).length;
  const pnlPositive = totalPnl >= 0;
  const pnlColor = totalPnl > 0 ? "#22C55E" : totalPnl < 0 ? "#EF4444" : DIM;
  const pnlPct = totalNetWorth > 0 ? (totalPnl / totalNetWorth) * 100 : 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshPositions();
    await fetchPortfolio();
    setTimeout(() => setRefreshing(false), 800);
  };

  const actionButtons = [
    { label: "Send",     icon: <ArrowRightLeft size={14} />,  action: () => setSendModalOpen(true),     testId: "button-send-portfolio" },
    { label: "Receive",  icon: <QrCode size={14} />,           action: () => setReceiveModalOpen(true),  testId: "button-receive-portfolio" },
    { label: "Deposit",  icon: <ArrowDownToLine size={14} />,  action: () => setDepositModalOpen(true),  testId: "button-deposit-portfolio" },
    { label: "Withdraw", icon: <ArrowUpFromLine size={14} />,  action: () => setWithdrawModalOpen(true), testId: "button-withdraw-portfolio" },
  ] as const;

  /* ─── NO WALLET STATE ───────────────────────────────────────────────── */
  if (noWallet) {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: mobile ? "12px 12px" : "32px 28px", display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Top row: portfolio card + watch */}
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "3fr 2fr", gap: 8 }}>

          {/* Portfolio card */}
          <div data-testid="card-portfolio-hero" style={{
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: mobile ? "12px 12px 10px" : "24px 24px 20px",
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: DIM, fontFamily: SANS, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Total Portfolio Value
            </div>
            <div style={{ fontSize: mobile ? 28 : 44, fontWeight: 200, color: "#333", fontFamily: MONO, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 12 }}>
              $0.00
            </div>
            <div style={{ height: 1, background: BORDER, marginBottom: 10 }} />
            <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>Connect wallet to view portfolio</span>
          </div>

          {/* Watch */}
          {!mobile && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "24px 24px 20px" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: DIM, fontFamily: SANS, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
                Markets
              </div>
              {WATCH_TOKENS.map((t, i) => {
                const p = tokenPrices[t.symbol];
                const pos = (p?.change || 0) >= 0;
                return (
                  <div key={t.symbol} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 0", borderBottom: i < WATCH_TOKENS.length - 1 ? `1px solid ${BORDER}` : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <TokenIcon symbol={t.symbol} size={22} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: BRIGHT, fontFamily: SANS }}>{t.symbol}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: BRIGHT, fontFamily: MONO }}>
                        {p?.price ? `$${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                      </div>
                      <div style={{ fontSize: 9, color: pos ? "#22C55E" : "#EF4444", fontFamily: MONO }}>
                        {pos ? "+" : ""}{(p?.change || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          {actionButtons.map((btn) => (
            <ActionBtn key={btn.label} label={btn.label} icon={btn.icon} onClick={btn.action} testId={btn.testId} />
          ))}
        </div>

        {/* Connect CTA */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 6, paddingBottom: 6 }}>
          <ConnectWalletEmblem
            variant="full"
            onClick={() => setWalletModalOpen(true)}
          />
        </div>

        <WalletSelectModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
      </div>
    );
  }

  /* ─── CONNECTED STATE ───────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: mobile ? "0" : "32px 28px", display: "flex", flexDirection: "column", gap: mobile ? 0 : 8 }}>

      {/* ── PORTFOLIO VALUE CARD ─────────────────────────────────────── */}
      <div
        data-testid="card-portfolio-hero"
        style={{
          background: "#14161A",
          border: `1px solid ${BORDER}`,
          borderRadius: mobile ? 14 : 16,
          padding: mobile ? "12px 12px 10px" : "24px 24px 20px",
          margin: mobile ? "12px 12px 0" : "0",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Wallet size={13} color={ORANGE} />
            <span style={{ fontSize: mobile ? 12 : 14, fontWeight: 600, color: ORANGE, fontFamily: SANS }}>Portfolio</span>
          </div>
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            data-testid="button-refresh-portfolio"
            style={{
              width: 24, height: 24, borderRadius: 6, background: "transparent",
              border: `1px solid ${BORDER}`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <RefreshCw size={10} color={DIM} style={{ transition: "transform 0.6s", transform: refreshing ? "rotate(360deg)" : "none" }} />
          </button>
        </div>

        {/* Big value */}
        <div style={{ marginBottom: 12 }}>
          {loading ? (
            <div style={{ width: 160, height: 32, background: "#1A1A1A", borderRadius: 6 }} />
          ) : (
            <div style={{ fontSize: mobile ? 28 : 48, fontWeight: 200, color: BRIGHT, fontFamily: MONO, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {formatBigUsd(totalNetWorth)}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ height: 1, background: BORDER, marginBottom: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: mobile ? 8 : 12 }}>
          <StatPill label="Wallet" value={loading ? "—" : formatBigUsd(walletBalance)} />
          <StatPill label="Free Margin" value={loading ? "—" : formatBigUsd(freeMargin)} />
          <StatPill label="Collateral" value={loading ? "—" : formatBigUsd(usedCollateral)} />
        </div>
      </div>

      {/* ── ACTION BUTTONS ───────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 6, padding: mobile ? "8px 12px" : "0" }}>
        {actionButtons.map((btn, i) => (
          <ActionBtn
            key={btn.label}
            label={btn.label}
            icon={btn.icon}
            onClick={btn.action}
            testId={mobile ? btn.testId : `${btn.testId}-desktop`}
          />
        ))}
      </div>

      {/* ── DESKTOP WATCH STRIP ──────────────────────────────────────── */}
      {!mobile && (
        <div style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
          padding: "16px 24px",
          display: "flex", alignItems: "center", gap: 0,
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: DIM, fontFamily: SANS, letterSpacing: "0.1em", textTransform: "uppercase", marginRight: 28 }}>
            Markets
          </span>
          <div style={{ display: "flex", flex: 1, gap: 0 }}>
            {WATCH_TOKENS.map((t, i) => {
              const p = tokenPrices[t.symbol];
              const pos = (p?.change || 0) >= 0;
              return (
                <div key={t.symbol} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  paddingRight: 32, marginRight: 32,
                  borderRight: i < WATCH_TOKENS.length - 1 ? `1px solid ${BORDER}` : "none",
                }}>
                  <TokenIcon symbol={t.symbol} size={22} />
                  <div>
                    <div style={{ fontSize: 9, color: DIM, fontFamily: SANS, letterSpacing: "0.06em", marginBottom: 2 }}>{t.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: BRIGHT, fontFamily: MONO }}>
                      {p?.price ? `$${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: pos ? "#22C55E" : "#EF4444", fontFamily: MONO,
                    marginLeft: 4,
                    padding: "2px 6px", borderRadius: 4,
                    background: pos ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
                  }}>
                    {pos ? "+" : ""}{(p?.change || 0).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── HOLDINGS GRID ────────────────────────────────────────────── */}
      {walletTokens.filter((t) => (t.valueUsd || 0) > 0.01).length > 0 && (
        <div style={{ padding: mobile ? "4px 12px" : "0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: MID, fontFamily: SANS }}>Holdings</span>
            <button
              onClick={() => setActiveTab("balances")}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2, color: ORANGE, fontSize: 10, fontWeight: 600, fontFamily: SANS }}
            >
              View all <ChevronRight size={10} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${mobile ? 2 : 3}, 1fr)`, gap: 6 }}>
            {walletTokens.filter((t) => (t.valueUsd || 0) > 0.01).slice(0, 6).map((t) => {
              const sym = t.asset;
              return (
                <div
                  key={`${sym}-${t.chain}`}
                  data-testid={`card-holding-${sym.toLowerCase()}`}
                  style={{
                    background: CARD, border: `1px solid ${BORDER}`,
                    borderRadius: 10, padding: mobile ? "10px 12px" : "14px 16px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <TokenIcon symbol={sym} size={mobile ? 22 : 26} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: mobile ? 11 : 12, fontWeight: 700, color: BRIGHT, fontFamily: SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sym}</div>
                      <div style={{ fontSize: 9, color: DIM, fontFamily: MONO, marginTop: 1 }}>
                        {t.amount !== undefined ? t.amount.toFixed(4) : "—"}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: mobile ? 11 : 12, fontWeight: 700, color: BRIGHT, fontFamily: MONO }}>{formatBigUsd(t.valueUsd || 0)}</div>
                    <div style={{ fontSize: 8, color: DIM, fontFamily: SANS, marginTop: 1 }}>{t.chain}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TABS ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${BORDER}`,
        overflowX: "auto", background: "transparent",
        padding: mobile ? "0 6px" : "0",
      }}>
        <TabButton label="Overview"  value="overview"  current={activeTab} onClick={setActiveTab} />
        <TabButton label="Positions" value="positions" count={perpPositionCount} current={activeTab} onClick={setActiveTab} />
        <TabButton label="Balances"  value="balances"  current={activeTab} onClick={setActiveTab} />
        <TabButton label="Deposits"  value="deposits"  current={activeTab} onClick={setActiveTab} />
      </div>

      <div style={{
        background: CARD,
        borderRadius: mobile ? 0 : 12,
        borderTop: "none",
        borderRight: mobile ? "none" : `1px solid ${BORDER}`,
        borderBottom: mobile ? "none" : `1px solid ${BORDER}`,
        borderLeft: mobile ? "none" : `1px solid ${BORDER}`,
        overflow: "hidden",
        minHeight: 120,
      }}>
        {activeTab === "overview" && (
          <OverviewTab
            positions={positions}
            unrealizedPnl={unrealizedPnl}
            freeMargin={freeMargin}
            usedCollateral={usedCollateral}
          />
        )}
        {activeTab === "positions" && (
          <PositionsTable filter={chainFilter === "all" ? "all" : chainFilter} />
        )}
        {activeTab === "balances" && (
          <BalancesTab
            tokens={walletTokens}
            onSend={(token) => { setSendDefaultToken(token.asset); setSendDefaultChain(token.chain); setSendModalOpen(true); }}
            onReceive={(token) => { setReceiveDefaultChain(token.chain); setReceiveModalOpen(true); }}
          />
        )}
        {activeTab === "deposits" && (
          <DepositsTab deposits={deposits} sourceStatus={data?.sourceStatus || {}} />
        )}
      </div>

      <WalletSelectModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
      <DepositModal open={depositModalOpen} onClose={() => setDepositModalOpen(false)} />
      <WithdrawModal open={withdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} />
      <SendModal
        open={sendModalOpen}
        onClose={() => { setSendModalOpen(false); setSendDefaultToken(undefined); setSendDefaultChain(undefined); }}
        walletTokens={walletTokens}
        defaultToken={sendDefaultToken}
        defaultChain={sendDefaultChain}
      />
      <ReceiveModal
        open={receiveModalOpen}
        onClose={() => { setReceiveModalOpen(false); setReceiveDefaultChain(undefined); }}
        defaultChain={receiveDefaultChain}
      />
    </div>
  );
}

