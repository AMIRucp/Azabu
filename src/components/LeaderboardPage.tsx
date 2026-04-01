"use client";

import { useState, useEffect } from "react";
import Badge, { BADGE_DEFINITIONS, getTierBadgeId, getTierName } from "@/components/Badge";
import useUserStore from "@/stores/useUserStore";
import SamuraiAvatar from "@/components/SamuraiAvatar";

const mono = "'IBM Plex Mono', 'Roboto Mono', monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

type Tab = "xp" | "volume";

interface LeaderEntry {
  rank: number;
  walletAddress: string;
  callsign?: string | null;
  pfpId?: string | null;
  xpTotal: number;
  level: number;
  tierBadge: string;
  rankName: string;
  volumeTotal: number;
  weeklyXp: number;
  achievements: string[];
}

// Demo/mock data so the page looks great before real entries accumulate
const DEMO_ENTRIES: LeaderEntry[] = [
  { rank: 1, walletAddress: "0xA1B2...C3D4", callsign: "MiyamotoX", xpTotal: 320000, level: 52, tierBadge: "tier-elite", rankName: "Elite", volumeTotal: 5800000, weeklyXp: 4200, achievements: ["first-blood","century","thousand-cuts","inferno","diamond-hands","og","top-10"] },
  { rank: 2, walletAddress: "0xF5E6...B7A8", callsign: "ShogunBull", xpTotal: 180000, level: 43, tierBadge: "tier-pro", rankName: "Pro", volumeTotal: 2200000, weeklyXp: 2800, achievements: ["first-blood","century","burning-spirit","explorer","whale","on-fire"] },
  { rank: 3, walletAddress: "0x2D3E...4F5A", callsign: "NinjaVault", xpTotal: 95000, level: 35, tierBadge: "tier-pro", rankName: "Pro", volumeTotal: 1100000, weeklyXp: 1900, achievements: ["first-blood","century","degen","max-degen","sniper","globe-trotter"] },
  { rank: 4, walletAddress: "0x8G9H...0I1J", callsign: null, xpTotal: 42000, level: 22, tierBadge: "tier-trader", rankName: "Trader", volumeTotal: 640000, weeklyXp: 1100, achievements: ["first-blood","century","explorer","night-owl","survivor"] },
  { rank: 5, walletAddress: "0xK2L3...M4N5", callsign: "SakuraDegen", xpTotal: 18500, level: 18, tierBadge: "tier-trader", rankName: "Trader", volumeTotal: 280000, weeklyXp: 640, achievements: ["first-blood","degen","burning-spirit","protocol-tourist"] },
  { rank: 6, walletAddress: "0xP6Q7...R8S9", callsign: "IchibanHODL", xpTotal: 8200, level: 13, tierBadge: "tier-challenger", rankName: "Challenger", volumeTotal: 95000, weeklyXp: 380, achievements: ["first-blood","explorer","diamond-hands"] },
  { rank: 7, walletAddress: "0xT0U1...V2W3", callsign: null, xpTotal: 3800, level: 9, tierBadge: "tier-challenger", rankName: "Challenger", volumeTotal: 42000, weeklyXp: 210, achievements: ["first-blood","degen"] },
  { rank: 8, walletAddress: "0xX4Y5...Z6A7", callsign: "KatanaKing", xpTotal: 1200, level: 5, tierBadge: "tier-novice", rankName: "Novice", volumeTotal: 18000, weeklyXp: 95, achievements: ["first-blood","night-owl"] },
];


const RANK_KANJI: Record<number, string> = {
  1: "一",
  2: "二",
  3: "三",
};

function fmtAddr(addr: string) {
  if (addr.length > 12) return addr.slice(0, 6) + "…" + addr.slice(-4);
  return addr;
}

function fmtXp(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtVol(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

// Achievement badges to show in grid (all 22 achievement badges only, no tier badges)
const ACHIEVEMENT_BADGES = BADGE_DEFINITIONS.filter((b) => b.category !== "tier");
// Tier badges
const TIER_BADGES = BADGE_DEFINITIONS.filter((b) => b.category === "tier");

interface Props {
  onClose?: () => void;
  isMobile?: boolean;
}

export default function LeaderboardPage({ onClose, isMobile: isMobileProp }: Props) {
  const [tab, setTab] = useState<Tab>("xp");
  const [activeSection, setActiveSection] = useState<"board" | "profile">("board");
  const [entries, setEntries] = useState<LeaderEntry[]>(DEMO_ENTRIES);
  const [loading, setLoading] = useState(false);
  const [callerRank, setCallerRank] = useState<number | null>(null);
  const [viewportMobile, setViewportMobile] = useState(false);

  useEffect(() => {
    const check = () => setViewportMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isMobile = isMobileProp ?? viewportMobile;

  const userStore = useUserStore();
  const walletAddress = userStore.address;
  const userXp = userStore.xp;
  const userLevel = userStore.level;
  const userAchievements = userStore.achievements;
  const userVolume = userStore.totalVolume;
  const userTierBadge = getTierBadgeId(userLevel);
  const userTierName = getTierName(userLevel);

  useEffect(() => {
    setLoading(true);
    const qs = `tab=${tab}${walletAddress ? `&wallet=${walletAddress}` : ""}`;
    fetch(`/api/leaderboard?${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.entries && data.entries.length > 0) {
          setEntries(data.entries);
        }
        if (data.callerRank) setCallerRank(data.callerRank);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, walletAddress]);

  const displayEntries = tab === "volume"
    ? [...entries].sort((a, b) => b.volumeTotal - a.volumeTotal)
    : [...entries].sort((a, b) => b.xpTotal - a.xpTotal);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#000000",
    color: "#F0F2F5",
    fontFamily: SANS,
    overflowY: "auto",
  };

  return (
    <div style={containerStyle} data-testid="leaderboard-page">
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: isMobile ? "16px 16px 0" : "20px 24px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.01)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          {onClose && (
            <button
              data-testid="leaderboard-close"
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, letterSpacing: "-0.03em" }}>
                Leaderboard
              </span>
              <span style={{ fontSize: isMobile ? 18 : 20, fontFamily: "serif", color: "rgba(255,215,0,0.7)" }}>
                番付
              </span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: mono, marginTop: 1 }}>
              Weekly rankings · resets every Monday 00:00 UTC
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: -1 }}>
          {(["board", "profile"] as const).map((s) => (
            <button
              key={s}
              data-testid={`leaderboard-section-${s}`}
              onClick={() => setActiveSection(s)}
              style={{
                padding: "8px 16px", border: "none", cursor: "pointer",
                background: "transparent",
                borderBottom: activeSection === s ? "2px solid #D4A574" : "2px solid transparent",
                color: activeSection === s ? "#F0F2F5" : "rgba(255,255,255,0.35)",
                fontSize: 12, fontWeight: activeSection === s ? 700 : 400,
                fontFamily: mono, letterSpacing: "0.04em", textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >
              {s === "board" ? "Rankings" : "My Badges"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeSection === "board" ? (
          <BoardSection
            tab={tab}
            setTab={setTab}
            entries={displayEntries}
            loading={loading}
            callerRank={callerRank}
            walletAddress={walletAddress}
            isMobile={isMobile}
          />
        ) : (
          <ProfileSection
            userAchievements={userAchievements}
            userXp={userXp}
            userLevel={userLevel}
            userVolume={userVolume}
            userTierBadge={userTierBadge}
            userTierName={userTierName}
            walletAddress={walletAddress}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
}

function BoardSection({
  tab, setTab, entries, loading, callerRank, walletAddress, isMobile
}: {
  tab: Tab; setTab: (t: Tab) => void; entries: LeaderEntry[];
  loading: boolean; callerRank: number | null; walletAddress?: string; isMobile?: boolean;
}) {
  const pad = isMobile ? "12px 16px" : "12px 24px";

  return (
    <div>
      {/* Stat tabs */}
      <div style={{
        display: "flex", gap: 8, padding: isMobile ? "12px 16px" : "12px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        {(["xp", "volume"] as const).map((t) => (
          <button
            key={t}
            data-testid={`leaderboard-tab-${t}`}
            onClick={() => setTab(t)}
            style={{
              padding: "4px 12px", borderRadius: 6, cursor: "pointer",
              background: tab === t ? "rgba(212,165,116,0.15)" : "rgba(255,255,255,0.04)",
              border: tab === t ? "1px solid rgba(212,165,116,0.3)" : "1px solid rgba(255,255,255,0.06)",
              color: tab === t ? "#D4A574" : "rgba(255,255,255,0.4)",
              fontSize: 10, fontWeight: 700, fontFamily: mono,
              textTransform: "uppercase", letterSpacing: "0.06em",
              transition: "all 0.15s",
            }}
          >
            {t === "xp" ? "XP Score" : "Volume"}
          </button>
        ))}
        {callerRank && (
          <div style={{
            marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.3)",
            fontFamily: mono, display: "flex", alignItems: "center", gap: 4,
          }}>
            Your rank: <span style={{ color: "#D4A574", fontWeight: 700 }}>#{callerRank}</span>
          </div>
        )}
      </div>

      {/* Column header */}
      {!isMobile && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "36px 40px 1fr 80px 80px auto",
          gap: 8, padding: "8px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: mono,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          <span>#</span>
          <span></span>
          <span>Trader</span>
          <span style={{ textAlign: "right" }}>Volume</span>
          <span style={{ textAlign: "right" }}>Level</span>
          <span style={{ textAlign: "right" }}>{tab === "xp" ? "XP" : "Vol"}</span>
        </div>
      )}
      {isMobile && (
        <div style={{
          display: "flex", justifyContent: "space-between",
          padding: "6px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: mono,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          <span style={{ marginLeft: 52 }}>Trader</span>
          <span>{tab === "xp" ? "XP" : "Vol"}</span>
        </div>
      )}

      {/* Rows */}
      {loading ? (
        <div style={{ padding: "40px 24px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontFamily: mono, fontSize: 11 }}>
          Loading rankings...
        </div>
      ) : (
        entries.slice(0, 50).map((entry) => {
          const isTop3 = entry.rank <= 3;
          const isMe = walletAddress && entry.walletAddress.toLowerCase() === walletAddress.toLowerCase();
          const statValue = tab === "xp" ? fmtXp(entry.xpTotal) : fmtVol(entry.volumeTotal);

          if (isMobile) {
            return (
              <div
                key={entry.walletAddress}
                data-testid={`leaderboard-row-${entry.rank}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  background: isMe ? "rgba(212,165,116,0.06)" : "transparent",
                  boxShadow: isMe ? "inset 0 0 0 1px rgba(212,165,116,0.12)" : undefined,
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 22, flexShrink: 0, textAlign: "center",
                  fontSize: isTop3 ? 14 : 11, fontWeight: 600, fontFamily: isTop3 ? "serif" : mono,
                  color: isTop3 ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0.28)",
                }}>
                  {isTop3 ? RANK_KANJI[entry.rank] : entry.rank}
                </div>

                {/* Tier badge — fixed width */}
                <div style={{ flexShrink: 0, width: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Badge id={entry.tierBadge} earned size={24} showTooltip={false} />
                </div>

                {/* Trader info — grows, clips */}
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: isMe ? "#D4A574" : "#F0F2F5",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    marginBottom: 3,
                  }}>
                    {entry.callsign ?? fmtAddr(entry.walletAddress)}
                    {isMe && <span style={{ fontSize: 9, color: "#D4A574", marginLeft: 5, fontFamily: mono }}>(you)</span>}
                  </div>
                  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    {entry.achievements.slice(0, 4).map((achId) => (
                      <Badge key={achId} id={achId} earned size={13} showTooltip={false} />
                    ))}
                    {entry.achievements.length > 4 && (
                      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", fontFamily: mono, lineHeight: "13px" }}>
                        +{entry.achievements.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stat — fixed right column */}
                <div style={{
                  flexShrink: 0, minWidth: 52, textAlign: "right",
                  fontSize: 12, fontWeight: 700, fontFamily: mono, color: "#F0F2F5",
                }}>
                  {statValue}
                </div>
              </div>
            );
          }

          return (
            <div
              key={entry.walletAddress}
              data-testid={`leaderboard-row-${entry.rank}`}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 40px 1fr 80px 80px auto",
                gap: 8,
                padding: "10px 24px",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                background: isMe ? "rgba(212,165,116,0.06)" : "transparent",
                boxShadow: isMe ? "inset 0 0 0 1px rgba(212,165,116,0.12)" : undefined,
                transition: "background 0.12s",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, fontFamily: mono, color: isTop3 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)", textAlign: "center" }}>
                {isTop3 ? <span style={{ fontFamily: "serif" }}>{RANK_KANJI[entry.rank]}</span> : entry.rank}
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Badge id={entry.tierBadge} earned size={26} showTooltip />
              </div>
              <div style={{ overflow: "hidden", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <SamuraiAvatar walletAddress={entry.walletAddress} size={28} rank={entry.rankName} style={{ flexShrink: 0 }} />
                <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isMe ? "#D4A574" : "#F0F2F5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {entry.callsign ?? fmtAddr(entry.walletAddress)}
                    </span>
                    {isMe && <span style={{ fontSize: 9, color: "#D4A574", flexShrink: 0, fontFamily: mono }}>(you)</span>}
                  </div>
                  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    {entry.achievements.slice(0, 4).map((achId) => (
                      <Badge key={achId} id={achId} earned size={14} showTooltip={false} />
                    ))}
                    {entry.achievements.length > 4 && (
                      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontFamily: mono, lineHeight: "14px" }}>
                        +{entry.achievements.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: mono }}>
                {fmtVol(entry.volumeTotal)}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: mono }}>L{entry.level}</span>
                <span style={{ marginLeft: 4, fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: mono }}>{entry.rankName}</span>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, fontWeight: 600, fontFamily: mono, color: "#F0F2F5" }}>
                {statValue}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function ProfileSection({
  userAchievements, userXp, userLevel, userVolume,
  userTierBadge, userTierName, walletAddress, isMobile,
}: {
  userAchievements: string[]; userXp: number; userLevel: number; userVolume: number;
  userTierBadge: string; userTierName: string; walletAddress?: string; isMobile?: boolean;
}) {
  const pad = isMobile ? 16 : 24;

  return (
    <div style={{ padding: `${pad}px` }}>
      {/* User stat card */}
      <div style={{
        padding: "16px", borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        marginBottom: 24, display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <SamuraiAvatar
            walletAddress={walletAddress || "0x0000000000000000000000000000000000000000"}
            size={72}
            rank={userTierName}
          />
          <Badge id={userTierBadge} earned size={22} showTooltip />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 800, color: "#F0F2F5",
            marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {walletAddress ? fmtAddr(walletAddress) : "Connect Wallet"}
          </div>
          <div style={{
            fontSize: 11, fontFamily: "serif", color: "rgba(255,215,0,0.7)", marginBottom: 6,
          }}>
            {userTierName === "Novice" ? "初心者" : userTierName === "Challenger" ? "挑戦者" :
             userTierName === "Trader" ? "商人" : userTierName === "Pro" ? "達人" :
             userTierName === "Elite" ? "精鋭" : "伝説"}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.06em" }}>Level</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#D4A574", fontFamily: mono }}>{userLevel}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.06em" }}>XP</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#F0F2F5", fontFamily: mono }}>{fmtXp(userXp)}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.06em" }}>Volume</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#F0F2F5", fontFamily: mono }}>{fmtVol(userVolume)}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.06em" }}>Badges</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#F0F2F5", fontFamily: mono }}>{userAchievements.length}/22</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier progression */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 10, fontFamily: mono, color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
        }}>
          Tier Progression
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TIER_BADGES.map((b) => {
            const tierLevel = { "tier-novice": 1, "tier-challenger": 6, "tier-trader": 16, "tier-pro": 31, "tier-elite": 51, "tier-legend": 76 }[b.id] ?? 1;
            const earned = userLevel >= tierLevel;
            return (
              <div key={b.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Badge id={b.id} earned={earned} size={44} showTooltip />
                <span style={{
                  fontSize: 8, fontFamily: mono, color: earned ? "#F0F2F5" : "rgba(255,255,255,0.2)",
                  textAlign: "center",
                }}>
                  {b.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement badge grid */}
      <div>
        <div style={{
          fontSize: 10, fontFamily: mono, color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>Achievement Badges</span>
          <span style={{ color: "#D4A574" }}>{userAchievements.length} / {ACHIEVEMENT_BADGES.length}</span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 68 : 72}px, 1fr))`,
          gap: 12,
        }}>
          {ACHIEVEMENT_BADGES.map((b) => {
            const earned = userAchievements.includes(b.id);
            return (
              <div
                key={b.id}
                data-testid={`profile-badge-${b.id}`}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}
              >
                <Badge id={b.id} earned={earned} size={isMobile ? 52 : 56} showTooltip />
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 8, fontWeight: 600,
                    color: earned ? "#F0F2F5" : "rgba(255,255,255,0.2)",
                    fontFamily: mono, lineHeight: 1.2,
                    maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {b.name}
                  </div>
                  <div style={{
                    fontSize: 10, fontFamily: "serif",
                    color: earned ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.1)",
                    lineHeight: 1.2,
                  }}>
                    {b.japanese}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
