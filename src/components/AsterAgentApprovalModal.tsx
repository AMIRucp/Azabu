"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import {
  isAsterApprovedInStorage,
  markAsterApprovedInStorage,
  unmarkAsterApprovedInStorage,
} from "@/lib/asterApprovalStorage";
import { fetchAsterSetupStatus } from "@/lib/asterSetupStatusClient";
import {
  ensureAsterApiWallet,
  fetchAsterAgentAddress,
  pollAsterSetupStatusClient,
} from "@/lib/asterOnboardingClient";
import type { AsterSetupStatus } from "@/lib/asterSetupStatus";
import { toUserFacingError } from "@/lib/userFacingErrors";

const SANS = "Inter, -apple-system, sans-serif";
const MONO = "'IBM Plex Mono', 'SF Mono', monospace";

type Step = "prompt" | "checking" | "switching" | "signing" | "submitting" | "success" | "error";

interface Props {
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
}

type EthProvider = {
  request: (args: { method: string; params: unknown[] }) => Promise<string>;
  chainId?: string;
};

function getEthereum(): EthProvider | undefined {
  return (window as unknown as { ethereum?: EthProvider }).ethereum;
}

export function AsterAgentApprovalModal({ open, onClose, onApproved }: Props) {
  const { evmAddress } = useEvmWallet();
  const [step, setStep] = useState<Step>("prompt");
  const [errorMsg, setErrorMsg] = useState("");
  const [phaseLabel, setPhaseLabel] = useState("");
  const [setupHint, setSetupHint] = useState("");
  const statusRef = useRef<AsterSetupStatus | null>(null);

  useEffect(() => {
    if (open) {
      setStep("prompt");
      setErrorMsg("");
      setPhaseLabel("");
      setSetupHint("");
      statusRef.current = null;
    }
  }, [open]);

  const refreshSetupHint = useCallback(async (address: string) => {
    const status = await fetchAsterSetupStatus(address);
    statusRef.current = status;
    if (!status) {
      setSetupHint("");
      return status;
    }

    const short = `${status.derivedAgentAddress.slice(0, 8)}…${status.derivedAgentAddress.slice(-6)}`;

    if (status.needsCreateApiWallet) {
      setSetupHint(
        "Step 1: Create your futures account (sign the message on BNB Chain / chain 56). Step 2: Approve the trading agent and builder on BSC (no gas)."
      );
    } else if (status.needsWeb3Registration || !status.hasAsterAccount) {
      setSetupHint(
        "Step 1: Sign the Astherus message to open your futures account (no deposit required for registration). Step 2: Approve agent Azabu on BNB Chain."
      );
    } else if (status.ready) {
      setSetupHint("Trading agent and builder are already approved for this wallet.");
    } else if (!status.agentApproved) {
      setSetupHint(
        `Azabu will register a dedicated trading agent (${short}) for this wallet, then ask you to approve it on BNB Chain (no gas).`
      );
    } else if (!status.builderApproved) {
      setSetupHint("Your trading agent is set up. One more signature is needed to approve the platform builder.");
    } else {
      setSetupHint("");
    }
    return status;
  }, []);

  useEffect(() => {
    if (!open || !evmAddress) return;
    void refreshSetupHint(evmAddress);
  }, [open, evmAddress, refreshSetupHint]);

  const handleApprove = useCallback(async () => {
    if (!evmAddress) return;
    setErrorMsg("");
    setPhaseLabel("");

    const ethereum = getEthereum();
    if (!ethereum) {
      setErrorMsg(toUserFacingError("Connect a wallet extension to continue.", "onboarding"));
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
          
        }
      }
    };

    const submitAgentApproval = async (): Promise<boolean> => {
      const runOnce = async () => {
        setStep("signing");
        setPhaseLabel("Approving trading agent");
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
            if (/no aster user found|account does not exist|open a futures account/i.test(errMsg)) {
              throw new Error("ASTER_ACCOUNT_MISSING");
            }
            throw new Error(errMsg);
          }
        }
      };

      try {
        await runOnce();
      } catch (e) {
        if (e instanceof Error && e.message === "ASTER_ACCOUNT_MISSING") {
          setStep("signing");
          setPhaseLabel("Registering Aster futures account…");
          await ensureAsterApiWallet(evmAddress, ethereum, { forceWeb3: true });
          await runOnce();
        } else {
          throw e;
        }
      }
      return true;
    };

    const submitBuilderApproval = async (): Promise<boolean> => {
      setStep("signing");
      setPhaseLabel("Finishing setup");
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
        if (/already exists/i.test(errMsg) || buildPostData.alreadyExists) return true;
        if (/device time|timestamp|nonce/i.test(errMsg)) {
          throw new Error("Clock sync error — please try again.");
        }
        if (/no aster user found|account does not exist|open a futures account/i.test(errMsg)) {
          throw new Error(
            "Futures account not registered for this wallet. Run setup again and complete the Astherus sign step first."
          );
        }
        throw new Error(errMsg);
      }
      return true;
    };

    try {
      setStep("checking");
      setPhaseLabel("Checking Aster setup");
      let status = statusRef.current ?? (await refreshSetupHint(evmAddress));
      if (!status) {
        status = await refreshSetupHint(evmAddress);
      }

      if (status?.ready) {
        markAsterApprovedInStorage(evmAddress);
        setStep("success");
        setTimeout(() => onApproved(), 800);
        return;
      }

      let needsAgent = !status?.agentApproved;
      let needsBuilder = !status?.builderApproved;

      if (!needsAgent && !needsBuilder) {
        markAsterApprovedInStorage(evmAddress);
        setStep("success");
        setTimeout(() => onApproved(), 800);
        return;
      }

      if (!status) throw new Error("Could not verify Aster setup");

      let agentAddress = status.derivedAgentAddress || null;

      const needsAstherusSign =
        status.needsCreateApiWallet ||
        status.needsWeb3Registration ||
        !status.hasAsterAccount;

      if (needsAstherusSign) {
        setStep("signing");
        setPhaseLabel("Sign in to Astherus (check your wallet)");
        const created = await ensureAsterApiWallet(evmAddress, ethereum, {
          forceWeb3: status.needsCreateApiWallet || !status.hasAsterAccount,
          onStatus: (msg) => setPhaseLabel(msg),
        });
        agentAddress = created.agentAddress;
        status = (await refreshSetupHint(evmAddress)) ?? status;
        if (!status) throw new Error("Could not verify Aster registration");
      }

      if (!agentAddress) {
        agentAddress = (await fetchAsterAgentAddress(evmAddress)) ?? status.derivedAgentAddress ?? null;
      }
      if (!agentAddress) {
        throw new Error("Failed to resolve API wallet agent address");
      }
      if (needsAstherusSign) {
        setPhaseLabel(`Agent ${agentAddress.slice(0, 8)}…${agentAddress.slice(-6)}`);
      }

      needsAgent = !status?.agentApproved;
      needsBuilder = !status?.builderApproved;

      if (!needsAgent && !needsBuilder) {
        markAsterApprovedInStorage(evmAddress);
        setStep("success");
        setTimeout(() => onApproved(), 800);
        return;
      }

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

      let agentOk = !needsAgent;
      let builderOk = !needsBuilder;

      if (needsAgent) {
        agentOk = await submitAgentApproval();
      }

      if (needsBuilder) {
        builderOk = await submitBuilderApproval();
      }

      setStep("checking");
      setPhaseLabel("Verifying Aster setup");
      const after = await pollAsterSetupStatusClient(evmAddress);
      if (after?.ready) {
        markAsterApprovedInStorage(evmAddress);
        setStep("success");
        setTimeout(() => onApproved(), 1500);
        return;
      }

      if (agentOk && builderOk) {
        markAsterApprovedInStorage(evmAddress);
        setStep("success");
        setTimeout(() => onApproved(), 1500);
        return;
      }

      const detail = after
        ? `Agent: ${after.agentApproved ? "ok" : "pending"}, Builder: ${after.builderApproved ? "ok" : "pending"}`
        : "Could not reach Aster";
      throw new Error(
        `Setup still pending (${detail}). Wait a moment and tap Try Again, or deposit on Aster if you have not funded the account.`
      );
    } catch (e: unknown) {
      setErrorMsg(toUserFacingError(e, "onboarding"));
      setStep("error");
    } finally {
      await restoreChain();
    }
  }, [evmAddress, onApproved, refreshSetupHint]);

  const busy = step === "checking" || step === "switching" || step === "signing" || step === "submitting";
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
          <span style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>Enable Trading</span>
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
                  { icon: "✓", text: "Agent can withdraw perps collateral (server IP whitelisted)" },
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
              {setupHint ? (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    marginBottom: 16,
                    background: "rgba(40,160,240,0.04)",
                    border: "1px solid rgba(40,160,240,0.12)",
                    fontSize: 11,
                    color: "#9BA4AE",
                    fontFamily: SANS,
                    lineHeight: 1.55,
                  }}
                >
                  {setupHint}
                </div>
              ) : null}
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

          {(step === "checking" || step === "switching" || step === "signing" || step === "submitting") && (
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
                {step === "checking" ? "Checking Aster setup..." : step === "switching" ? "Switching to BNB Smart Chain..." : step === "signing" ? "Sign in your wallet..." : "Submitting to Aster..."}
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
  const [statusLoading, setStatusLoading] = useState(false);

  const syncServerStatus = useCallback(async (address: string) => {
    setStatusLoading(true);
    try {
      const status = await fetchAsterSetupStatus(address);
      if (status?.ready) {
        markAsterApprovedInStorage(address);
        setApproved(true);
        return true;
      }
      unmarkAsterApprovedInStorage(address);
      setApproved(false);
      return false;
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEvmConnected || !evmAddress) {
      setApproved(false);
      return;
    }
    if (isAsterApprovedInStorage(evmAddress)) {
      setApproved(true);
    }
    void syncServerStatus(evmAddress);
  }, [evmAddress, isEvmConnected, syncServerStatus]);

  const requireApproval = useCallback((): boolean => {
    if (!evmAddress || !isEvmConnected) return false;
    if (approved) return false;
    setShowModal(true);
    return true;
  }, [evmAddress, isEvmConnected, approved]);

  const handleApproved = useCallback(() => {
    if (evmAddress) markAsterApprovedInStorage(evmAddress);
    setApproved(true);
    setShowModal(false);
    if (evmAddress) void syncServerStatus(evmAddress);
  }, [evmAddress, syncServerStatus]);

  const openEnableTradingModal = useCallback(() => {
    if (!evmAddress || !isEvmConnected) return;
    setShowModal(true);
  }, [evmAddress, isEvmConnected]);

  return {
    showModal,
    approved,
    statusLoading,
    requireApproval,
    openEnableTradingModal,
    handleApproved,
    closeModal: () => setShowModal(false),
    refreshSetupStatus: () => (evmAddress ? syncServerStatus(evmAddress) : Promise.resolve(false)),
  };
}
