"use client";

import { useState, useEffect, useCallback } from "react";
import { useEvmWallet } from "@/hooks/useEvmWallet";

const SANS = "Inter, -apple-system, sans-serif";
const MONO = "'IBM Plex Mono', 'SF Mono', monospace";
const STORAGE_KEY = "aster_pro_two_step_v2";

type Step = "prompt" | "switching" | "signing" | "submitting" | "success" | "error";

function isApproved(address: string): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const list: string[] = JSON.parse(stored);
    return list.includes(address.toLowerCase());
  } catch {
    return false;
  }
}

function markApproved(address: string) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const list: string[] = stored ? JSON.parse(stored) : [];
    if (!list.includes(address.toLowerCase())) {
      list.push(address.toLowerCase());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  } catch {}
}

interface Props {
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
}

export function AsterAgentApprovalModal({ open, onClose, onApproved }: Props) {
  const { evmAddress } = useEvmWallet();
  const [step, setStep] = useState<Step>("prompt");
  const [errorMsg, setErrorMsg] = useState("");
  const [phaseLabel, setPhaseLabel] = useState("");

  useEffect(() => {
    if (open) {
      setStep("prompt");
      setErrorMsg("");
      setPhaseLabel("");
    }
  }, [open]);

  const handleApprove = useCallback(async () => {
    if (!evmAddress) return;
    setErrorMsg("");
    setPhaseLabel("");

    const ethereum = (window as unknown as {
      ethereum?: {
        request: (args: { method: string; params: unknown[] }) => Promise<string>;
        chainId?: string;
      };
    }).ethereum;
    if (!ethereum) {
      setErrorMsg("MetaMask not found");
      setStep("error");
      return;
    }

    const signTyped = async (payload: {
      domain: object;
      types: Record<string, Array<{ name: string; type: string }>>;
      primaryType: string;
      message: object;
    }): Promise<string> => {
      const typedData = JSON.stringify({
        domain: payload.domain,
        types: {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
          ...payload.types,
        },
        primaryType: payload.primaryType,
        message: payload.message,
      });
      return ethereum.request({
        method: "eth_signTypedData_v4",
        params: [evmAddress, typedData],
      });
    };

    const currentChainId = ethereum.chainId;
    const BSC = "0x38";

    const restoreChain = async () => {
      if (currentChainId && currentChainId !== BSC) {
        try {
          await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: currentChainId }] });
        } catch {
          /* best effort */
        }
      }
    };

    try {
      setStep("switching");
      try {
        await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BSC }] });
      } catch (switchErr: unknown) {
        const se = switchErr as { code?: number };
        if (se?.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: BSC,
                chainName: "BNB Smart Chain",
                nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
                rpcUrls: ["https://bsc-dataseed.binance.org/"],
                blockExplorerUrls: ["https://bscscan.com"],
              },
            ],
          });
        } else {
          throw new Error("Please switch to BNB Smart Chain to authorize Aster trading.");
        }
      }

      setStep("signing");
      setPhaseLabel("Step 1 of 2 — approve trading agent");
      const agentRes = await fetch(`/api/aster/approve-agent?userAddress=${encodeURIComponent(evmAddress)}`);
      const agentData = await agentRes.json();
      if (!agentRes.ok) throw new Error(agentData.error || "Failed to prepare agent approval");

      const agentSig = await signTyped({
        domain: agentData.domain,
        types: agentData.types,
        primaryType: agentData.primaryType,
        message: agentData.message,
      });

      setStep("submitting");
      setPhaseLabel("Submitting agent approval…");
      const agentPost = await fetch("/api/aster/approve-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postParams: agentData.postParams, signature: agentSig }),
      });
      const agentPostData = await agentPost.json();
      if (!agentPost.ok) {
        const errMsg = String(agentPostData.error || "Agent approval failed");
        const already = agentPostData.alreadyExists === true || /already exists/i.test(errMsg);
        if (!already) {
          if (/device time|timestamp|nonce/i.test(errMsg)) {
            throw new Error("Clock sync error — please try again.");
          }
          if (/no aster user found/i.test(errMsg)) {
            throw new Error("No Aster account found. Please deposit to Aster first at app.asterdex.com.");
          }
          throw new Error(errMsg);
        }
      }

      setStep("signing");
      setPhaseLabel("Step 2 of 2 — approve builder (fee cap)");
      const buildRes = await fetch(`/api/aster/approve-builder?userAddress=${encodeURIComponent(evmAddress)}`);
      const buildData = await buildRes.json();
      if (!buildRes.ok) throw new Error(buildData.error || "Failed to prepare builder approval");

      const buildSig = await signTyped({
        domain: buildData.domain,
        types: buildData.types,
        primaryType: buildData.primaryType,
        message: buildData.message,
      });

      setStep("submitting");
      setPhaseLabel("Submitting builder approval…");
      const buildPost = await fetch("/api/aster/approve-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postParams: buildData.postParams, signature: buildSig }),
      });
      const buildPostData = await buildPost.json();

      if (!buildPost.ok) {
        const errMsg = buildPostData.error || "Builder approval failed";
        if (/already exists/i.test(errMsg) || buildPostData.alreadyExists) {
          markApproved(evmAddress);
          setStep("success");
          setTimeout(() => onApproved(), 1500);
          return;
        }
        if (/device time|timestamp|nonce/i.test(errMsg)) {
          throw new Error("Clock sync error — please try again.");
        }
        if (/no aster user found/i.test(errMsg)) {
          throw new Error("No Aster account found. Please deposit to Aster first at app.asterdex.com.");
        }
        throw new Error(errMsg);
      }

      markApproved(evmAddress);
      setStep("success");
      setTimeout(() => onApproved(), 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Authorization failed";
      setErrorMsg(msg.includes("rejected") || msg.includes("4001") ? "Signature rejected. Please try again." : msg);
      setStep("error");
    } finally {
      await restoreChain();
    }
  }, [evmAddress, onApproved]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#0D1219",
          border: "1px solid rgba(40,160,240,0.2)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>Enable Aster Trading</span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              width: 28,
              height: 28,
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6B7280",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {step === "prompt" && (
            <>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  marginBottom: 16,
                  background: "rgba(40,160,240,0.06)",
                  border: "1px solid rgba(40,160,240,0.15)",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E6EDF3", fontFamily: SANS, marginBottom: 6 }}>
                  Two-step setup (official Aster Code)
                </div>
                <div style={{ fontSize: 11, color: "#9BA4AE", fontFamily: SANS, lineHeight: 1.6 }}>
                  On BSC (no gas): (1) approve the <strong>trading agent</strong> so the server signer can place orders, (2) approve the{" "}
                  <strong>builder</strong> fee cap. Both are required — builder alone is not enough.
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                {[
                  { icon: "✓", text: "Agent: server wallet may trade on your Aster account" },
                  { icon: "✓", text: "Builder: fee rate cap for routed orders" },
                  { icon: "✗", text: "Agent cannot withdraw your funds (as configured)" },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 0",
                      borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: item.icon === "✓" ? "#22C55E" : "#EF4444",
                        fontFamily: MONO,
                        width: 16,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ fontSize: 11, color: "#9BA4AE", fontFamily: SANS }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  marginBottom: 16,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 10,
                  color: "#6B7280",
                  fontFamily: MONO,
                }}
              >
                {evmAddress ? `${evmAddress.slice(0, 10)}...${evmAddress.slice(-8)}` : "—"}
              </div>
              <button
                onClick={handleApprove}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #1a3a5c, #0f2540)",
                  color: "#28A0F0",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: SANS,
                  boxShadow: "0 0 20px rgba(40,160,240,0.15)",
                }}
              >
                Authorize Aster Trading
              </button>
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: "transparent",
                  color: "#6B7280",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: SANS,
                  marginTop: 8,
                }}
              >
                Not now
              </button>
            </>
          )}

          {(step === "switching" || step === "signing" || step === "submitting") && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  border: "3px solid rgba(40,160,240,0.15)",
                  borderTopColor: "#28A0F0",
                  animation: "spin 1s linear infinite",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 13, color: "#E6EDF3", fontFamily: SANS, fontWeight: 600, marginBottom: 6 }}>
                {step === "switching" ? "Switching to BNB Smart Chain..." : step === "signing" ? "Sign in your wallet..." : "Submitting to Aster..."}
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", fontFamily: SANS }}>
                {phaseLabel ? `${phaseLabel} — ` : ""}
                {step === "signing" ? "Check your wallet for a signature request" : "Please wait"}
              </div>
            </div>
          )}

          {step === "success" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  background: "rgba(40,160,240,0.1)",
                  border: "2px solid rgba(40,160,240,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#28A0F0" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS, marginBottom: 6 }}>Aster Trading Enabled</div>
              <div style={{ fontSize: 11, color: "#6B7280", fontFamily: SANS }}>Agent and builder are set. You can place orders from this app.</div>
            </div>
          )}

          {step === "error" && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  margin: "0 auto 14px",
                  background: "rgba(239,68,68,0.1)",
                  border: "2px solid rgba(239,68,68,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS, marginBottom: 8 }}>Authorization Failed</div>
              <div
                style={{
                  fontSize: 11,
                  color: "#EF4444",
                  fontFamily: MONO,
                  marginBottom: 16,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  wordBreak: "break-word",
                }}
              >
                {errorMsg}
              </div>
              <button
                onClick={() => setStep("prompt")}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#6B7280",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: SANS,
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function useAsterAgentApproval() {
  const { evmAddress, isEvmConnected } = useEvmWallet();
  const [showModal, setShowModal] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (isEvmConnected && evmAddress) setApproved(isApproved(evmAddress));
    else setApproved(false);
  }, [evmAddress, isEvmConnected]);

  const requireApproval = useCallback((): boolean => {
    if (!evmAddress || !isEvmConnected) return false;
    if (isApproved(evmAddress)) {
      setApproved(true);
      return false;
    }
    setShowModal(true);
    return true;
  }, [evmAddress, isEvmConnected]);

  const handleApproved = useCallback(() => {
    setApproved(true);
    setShowModal(false);
  }, []);

  return {
    showModal,
    approved,
    requireApproval,
    handleApproved,
    closeModal: () => setShowModal(false),
  };
}
