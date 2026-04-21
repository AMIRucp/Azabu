"use client";

import { useState } from "react";
import { X, Copy, Check, QrCode } from "lucide-react";
import { useEvmWallet } from "@/hooks/useEvmWallet";

const MONO = "'IBM Plex Mono', 'SF Mono', monospace";
const SANS = "Inter, -apple-system, sans-serif";

type Chain = "Arbitrum" | "Hyperliquid";

interface ReceiveModalProps {
  open: boolean;
  onClose: () => void;
  defaultChain?: Chain;
}

function QrImage({ data, size = 180 }: { data: string; size?: number }) {
  const bg = "11161C";
  const fg = "E6EDF3";
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=${bg}&color=${fg}&margin=10&ecc=M`;
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      style={{ borderRadius: 10, display: "block" }}
      data-testid="img-receive-qr"
    />
  );
}

const CHAIN_INFO: Record<Chain, { label: string; logo: string; network: string; explorer: (addr: string) => string }> = {
  Arbitrum: {
    label: "Arbitrum",
    logo: "/tokens/arb.webp",
    network: "Arbitrum One",
    explorer: (a) => `https://arbiscan.io/address/${a}`,
  },
  Hyperliquid: {
    label: "Hyperliquid",
    logo: "/tokens/hyperliquid.webp",
    network: "Hyperliquid EVM",
    explorer: (a) => `https://hyperscan.xyz/address/${a}`,
  },
};

export function ReceiveModal({ open, onClose, defaultChain }: ReceiveModalProps) {
  const { evmAddress } = useEvmWallet();

  const chains: Chain[] = evmAddress ? ["Arbitrum", "Hyperliquid"] : [];

  const initial: Chain = (defaultChain && chains.includes(defaultChain))
    ? defaultChain
    : chains[0] ?? "Arbitrum";

  const [selectedChain, setSelectedChain] = useState<Chain>(initial);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const address = evmAddress ?? "";

  const info = CHAIN_INFO[selectedChain];

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      data-testid="modal-receive"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: "calc(100vw - 24px)",
        background: "#111820",
        border: "1px solid #1B2030",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid #1B2030",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <QrCode size={14} color="#E6EDF3" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>Receive</span>
          </div>
          <button
            onClick={onClose}
            data-testid="button-receive-close"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {chains.length === 0 ? (
          <div style={{ padding: "20px 12px", textAlign: "center", color: "#6B7280", fontSize: 12, fontFamily: SANS }}>
            Connect a wallet to see your receive address.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 4, padding: "12px 12px 0" }}>
              {chains.map((c) => {
                const active = c === selectedChain;
                const ci = CHAIN_INFO[c];
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedChain(c)}
                    data-testid={`tab-receive-${c.toLowerCase()}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 8px", border: "none", borderRadius: 6,
                      cursor: "pointer", fontFamily: SANS, fontSize: 10, fontWeight: 600,
                      background: active ? "rgba(255,255,255,0.08)" : "transparent",
                      color: active ? "#E6EDF3" : "#6B7280",
                      transition: "all 0.15s",
                      minWidth: 0,
                    }}
                  >
                    <img src={ci.logo} alt={c} width={12} height={12} style={{ borderRadius: "50%", flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ci.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {address ? (
                <div style={{
                  background: "#000000", borderRadius: 10,
                  padding: 12, display: "inline-block",
                }}>
                  <QrImage data={address} size={140} />
                </div>
              ) : (
                <div style={{ width: 140, height: 140, background: "#000000", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS }}>No address</span>
                </div>
              )}

              <div style={{
                width: "100%",
                background: "#000000", borderRadius: 6,
                border: "1px solid #1B2030",
                padding: "8px 10px",
              }}>
                <div style={{
                  fontSize: 8, color: "#6B7280", fontFamily: SANS,
                  letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4, fontWeight: 600,
                }}>
                  {info.network} Address
                </div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
                }}>
                  <span style={{
                    fontSize: 10, color: "#E6EDF3", fontFamily: MONO,
                    wordBreak: "break-all", flex: 1,
                    overflow: "hidden", textOverflow: "ellipsis",
                  }} data-testid="text-receive-address">
                    {address || "—"}
                  </span>
                  {address && (
                    <button
                      onClick={copyAddress}
                      data-testid="button-copy-receive-address"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        padding: 4, flexShrink: 0,
                      }}
                    >
                      {copied
                        ? <Check size={13} color="#22C55E" />
                        : <Copy size={13} color="#6B7280" />}
                    </button>
                  )}
                </div>
              </div>

              <div style={{
                width: "100%",
                padding: "8px 10px",
                background: "rgba(212,165,116,0.06)",
                border: "1px solid rgba(212,165,116,0.15)",
                borderRadius: 6,
                fontSize: 9, color: "#9BA4AE", fontFamily: SANS, lineHeight: 1.5,
              }}>
                <span style={{ color: "#D4A574", fontWeight: 700 }}>Only send {selectedChain === "Arbitrum" ? "Arbitrum One" : "Hyperliquid EVM"} assets</span>{" "}
                to this address. Sending assets from the wrong network may result in permanent loss.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
