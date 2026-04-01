"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const MONO = "'IBM Plex Mono', 'SF Mono', monospace";
const SANS = "Inter, -apple-system, sans-serif";

const STEPS = [
  { title: "Tap the wallet icon", desc: "Find the wallet icon in the top-right corner of the navigation bar" },
  { title: "Connect your EVM wallet", desc: "Choose MetaMask, Rabby, Coinbase Wallet, or any WalletConnect-compatible wallet" },
  { title: "Switch to Arbitrum", desc: "The app will prompt you to switch to the Arbitrum network automatically" },
  { title: "Start trading", desc: "Your balances and positions will appear automatically once connected" },
];

export function WalletConnectOnboarding({
  isMobile,
  onConnectClick,
}: {
  isMobile: boolean;
  onConnectClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);

  const updateProgress = useCallback(() => {
    const v = videoRef.current;
    if (v && v.duration) {
      setProgress(v.currentTime / v.duration);
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener("timeupdate", updateProgress);
    return () => v.removeEventListener("timeupdate", updateProgress);
  }, [updateProgress]);

  return (
    <div style={{ position: "relative" }}>
      {showInstructions && (
        <div
          data-testid="onboarding-instructions"
          style={{
            marginBottom: 14,
            background: "#0F1320",
            borderRadius: 12,
            border: "1px solid rgba(212,165,116,0.12)",
            padding: isMobile ? "16px 14px" : "20px 20px",
            animation: "fadeSlideDown 0.25s ease-out",
          }}
        >
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A574" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>
                Getting Started
              </span>
            </div>
            <button
              data-testid="close-instructions"
              onClick={() => setShowInstructions(false)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#4A5060", padding: 4, display: "flex",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {STEPS.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  border: "1.5px solid rgba(212,165,116,0.5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#D4A574", fontFamily: MONO,
                  marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#E6EDF3", fontFamily: SANS, lineHeight: 1.3 }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS, marginTop: 2, lineHeight: 1.4 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            data-testid="instructions-connect-btn"
            onClick={onConnectClick}
            style={{
              width: "100%", marginTop: 14, padding: "10px 0", borderRadius: 8,
              border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #D4A574, #D4551F)",
              color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS,
            }}
          >
            Connect Wallet
          </button>
        </div>
      )}

      <div
        data-testid="onboarding-video-card"
        style={{
          borderRadius: 14, overflow: "hidden",
          background: "#000000",
          border: "1px solid #1B2030",
          position: "relative",
        }}
      >
        <video
          ref={videoRef}
          data-testid="onboarding-video"
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: "100%", display: "block",
            borderRadius: "14px 14px 0 0",
          }}
        >
          <source src="/wallet-connect-flow.mp4" type="video/mp4" />
        </video>

        <div style={{
          height: 3,
          background: "rgba(255,255,255,0.04)",
          position: "relative",
        }}>
          <div
            data-testid="video-progress-bar"
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, #D4A574, #E8C4A0)",
              borderRadius: "0 2px 2px 0",
              transition: "width 0.15s linear",
              boxShadow: "0 0 8px rgba(212,165,116,0.4)",
            }}
          />
        </div>

        <div style={{
          padding: isMobile ? "12px 14px" : "14px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(212,165,116,0.08)",
              border: "1px solid rgba(212,165,116,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2.5" />
                <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>
                Connect Your Wallet
              </div>
              <div style={{ fontSize: 9, color: "#6B7280", fontFamily: MONO, marginTop: 1 }}>
                Arbitrum & Hyperliquid supported
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              data-testid="toggle-instructions"
              onClick={() => setShowInstructions(!showInstructions)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 7, padding: "6px 10px",
                color: showInstructions ? "#D4A574" : "#6B7280",
                fontSize: 10, fontWeight: 600, fontFamily: SANS,
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
              </svg>
              How to
            </button>
            <button
              data-testid="button-connect-onboarding"
              onClick={onConnectClick}
              style={{
                background: "linear-gradient(135deg, #D4A574, #D4551F)",
                border: "none", borderRadius: 7, padding: "6px 14px",
                color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: SANS,
                cursor: "pointer",
              }}
            >
              Connect
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
