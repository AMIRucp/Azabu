"use client";

import { useState, useRef, useEffect } from 'react';
import useUserStore, { saveUser } from '@/stores/useUserStore';
import { LEVELS, getLevelInfo } from '@/services/xpService';
import { ACHIEVEMENTS } from '@/services/achievements';
import SamuraiAvatar from '@/components/SamuraiAvatar';

const MONO = "'IBM Plex Mono', monospace";
const SANS = "Inter, -apple-system, sans-serif";

export default function UserHeader({ onDisconnect }: { onDisconnect?: () => void }) {
  const {
    pfpId, callsign, rank, level, xp, shortAddress, address,
    streak, settings, initialized, totalTrades, totalVolume,
    winRate, achievements, joinedAt,
  } = useUserStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  if (!initialized) return null;

  const { current: currentLevel, next: nextLevel, progress: xpProgress } = getLevelInfo(xp);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        data-testid="user-header-badge"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.04)',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(212,165,116,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        }}
      >
        <SamuraiAvatar walletAddress={address} size={22} rank={rank} />
      </div>

      {showDropdown && (
        <div
          data-testid="user-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            width: 260,
            background: '#12151A',
            border: '1px solid #1E2329',
            borderRadius: 10,
            padding: 16,
            zIndex: 200,
            fontFamily: MONO,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
              paddingBottom: 14,
              borderBottom: '1px solid #1E2329',
            }}
          >
            <SamuraiAvatar walletAddress={address} size={40} rank={rank} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#EAECEF' }}>{callsign}</div>
              <div style={{ fontSize: 9, color: currentLevel.color, fontWeight: 600 }}>
                {rank} · Lv.{level}
              </div>
              <div style={{ fontSize: 8, color: '#6B7280', marginTop: 2 }}>{shortAddress}</div>
            </div>
            {streak > 0 && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 14, lineHeight: 1 }}>🔥</div>
                <div style={{ fontSize: 8, color: '#D4A574', marginTop: 2 }}>{streak}d</div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 8,
                color: '#5E6673',
                marginBottom: 3,
              }}
            >
              <span>{xp} XP</span>
              <span>{nextLevel ? `${nextLevel.xp} for Lv.${nextLevel.level}` : 'MAX'}</span>
            </div>
            <div
              style={{
                height: 3,
                background: '#1E2329',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${currentLevel.color}, #D4A574)`,
                  width: `${xpProgress * 100}%`,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 14,
              paddingBottom: 14,
              borderBottom: '1px solid #1E2329',
            }}
          >
            {[
              { l: 'Streak', v: `${streak}d` },
              { l: 'Trades', v: totalTrades.toString() },
              { l: 'Win Rate', v: `${winRate.toFixed(0)}%` },
              {
                l: 'Volume',
                v:
                  totalVolume >= 1_000_000
                    ? `$${(totalVolume / 1_000_000).toFixed(1)}M`
                    : totalVolume >= 1_000
                      ? `$${(totalVolume / 1_000).toFixed(1)}K`
                      : `$${totalVolume.toFixed(0)}`,
              },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ fontSize: 7, color: '#6B7280', fontFamily: SANS }}>{s.l}</div>
                <div style={{ fontSize: 11, color: '#EAECEF', fontWeight: 600 }}>{s.v}</div>
              </div>
            ))}
          </div>

          {achievements.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 8, color: '#6B7280', marginBottom: 6, fontFamily: SANS }}>
                ACHIEVEMENTS ({achievements.length}/{ACHIEVEMENTS.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = achievements.includes(a.id);
                  return (
                    <span
                      key={a.id}
                      title={unlocked ? `${a.name}: ${a.desc}` : '???'}
                      style={{
                        fontSize: 14,
                        opacity: unlocked ? 1 : 0.15,
                        cursor: 'default',
                        filter: unlocked ? 'none' : 'grayscale(1)',
                      }}
                    >
                      {a.icon}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {joinedAt && (
            <div style={{ fontSize: 8, color: '#6B7280', marginBottom: 12, fontFamily: SANS }}>
              Member since{' '}
              {new Date(joinedAt).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </div>
          )}

          {onDisconnect && (
            <button
              onClick={() => {
                setShowDropdown(false);
                onDisconnect();
              }}
              data-testid="button-user-disconnect"
              style={{
                width: '100%',
                padding: '6px 0',
                fontSize: 9,
                color: '#EF4444',
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 4,
                cursor: 'pointer',
                fontFamily: MONO,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Disconnect
            </button>
          )}
        </div>
      )}
    </div>
  );
}
