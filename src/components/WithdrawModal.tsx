"use client";

import { useState, useCallback, useEffect } from "react";
import { useEvmWallet } from "@/hooks/useEvmWallet";

interface EthereumWindow extends Window {
  ethereum?: {
    request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    isMetaMask?: boolean;
  };
}

const MONO = "'IBM Plex Mono', 'SF Mono', monospace";
const SANS = "Inter, -apple-system, sans-serif";

type Protocol = "aster" | "hyperliquid";
type WithdrawStep = "amount" | "confirm" | "processing" | "success" | "error";

interface Eip712TypedDataField { name: string; type: string; }
interface Eip712Payload {
  domain: { name?: string; version?: string; chainId?: number; verifyingContract?: string };
  types: Record<string, Eip712TypedDataField[]>;
  message: Record<string, unknown>;
  primaryType?: string;
}

const PROTOCOLS: {
  id: Protocol; name: string; chain: string; asset: string;
  logo: string; chainLogo: string; color: string; desc: string;
}[] = [
  { id: "aster",       name: "Aster",       chain: "Arbitrum",    asset: "USDT", logo: "/tokens/aster-logo.webp",    chainLogo: "/tokens/arb.webp",           color: "#28A0F0", desc: "Withdraw from perps collateral" },
  { id: "hyperliquid", name: "Hyperliquid", chain: "Hyperliquid", asset: "USDC", logo: "/tokens/hyperliquid.webp",   chainLogo: "/tokens/hyperliquid.webp",   color: "#33FF88", desc: "Withdraw from perps account" },
];

const QUICK_PCT = [25, 50, 75, 100];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS }}>{label}</span>
      <span style={{ fontSize: 10, color: "#E6EDF3", fontFamily: MONO, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export function WithdrawModal({
  open, onClose, defaultProtocol,
}: {
  open: boolean;
  onClose: () => void;
  defaultProtocol?: Protocol;
}) {
  const { evmAddress, isEvmConnected, isArbitrum, switchToArbitrum, getEvmSigner } = useEvmWallet();

  const [step, setStep]         = useState<WithdrawStep>("amount");
  const [protocol, setProtocol] = useState<Protocol>(defaultProtocol ?? "aster");
  const [amount, setAmount]     = useState("");
  const [status, setStatus]     = useState("");
  const [txHash, setTxHash]     = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [platformBalance, setPlatformBalance] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setAmount(""); setStatus(""); setTxHash(""); setErrorMsg(""); setPlatformBalance(null);
      setProtocol(defaultProtocol ?? "aster");
      setStep("amount");
    }
  }, [open, defaultProtocol]);

  // Fetch platform balance when entering amount step
  useEffect(() => {
    if (step !== "amount") return;
    setPlatformBalance(null);
    let cancelled = false;

    const load = async () => {
      try {
        if (protocol === "aster" && evmAddress) {
          const res = await fetch(`/api/aster/balance?userId=${evmAddress}`);
          if (!res.ok) return;
          const data = await res.json();
          const usdt = (data.balances || []).find((b: { asset: string; crossWalletBalance?: string; balance?: string }) => b.asset === "USDT" || b.asset === "USDC");
          const bal = usdt ? parseFloat(usdt.crossWalletBalance || usdt.balance || "0") : 0;
          if (!cancelled) setPlatformBalance(bal);
        } else if (protocol === "hyperliquid" && evmAddress) {
          const res = await fetch(`/api/hyperliquid/account?address=${evmAddress}`);
          if (!res.ok) return;
          const data = await res.json();
          const acctVal = parseFloat(data.crossBalance?.accountValue || data.balance?.accountValue || "0");
          const marginUsed = parseFloat(data.crossBalance?.totalMarginUsed || data.balance?.totalMarginUsed || "0");
          if (!cancelled) setPlatformBalance(Math.max(0, acctVal - marginUsed));
        }
      } catch {
        if (!cancelled) setPlatformBalance(null);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [protocol, step, evmAddress]);

  const selected = PROTOCOLS.find(p => p.id === protocol);

  const isConnected = useCallback(() => {
    return isEvmConnected && !!evmAddress;
  }, [isEvmConnected, evmAddress]);

  const maxAmount = platformBalance ?? 0;

  const setPercentage = (pct: number) => {
    if (maxAmount <= 0) return;
    const val = (maxAmount * pct) / 100;
    setAmount(val.toFixed(2));
  };

  const handleWithdraw = async () => {
    if (!isConnected() || !amount || parseFloat(amount) <= 0) return;
    setStep("processing");
    setStatus("Preparing withdrawal...");
    try {
      if (protocol === "aster")            await handleAsterWithdraw();
      else if (protocol === "hyperliquid") await handleHlWithdraw();
    } catch (e: unknown) {
      console.error("[withdraw]", e);
      setErrorMsg(e instanceof Error ? e.message : "Withdrawal failed");
      setStep("error");
    }
  };

  // ─── Aster ────────────────────────────────────────────────────────────────
  const handleAsterWithdraw = async () => {
    if (!evmAddress) throw new Error("EVM wallet not connected");

    if (!isArbitrum) {
      setStatus("Switching to Arbitrum...");
      try { await switchToArbitrum(); } catch { throw new Error("Please switch to Arbitrum manually."); }
      await new Promise(r => setTimeout(r, 500));
    }

    setStatus("Fetching withdrawal details...");
    const res = await fetch("/api/aster/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress: evmAddress, amount: parseFloat(amount), asset: "USDT" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to prepare withdrawal");

    const signer = await getEvmSigner();
    if (!signer) throw new Error("Could not get EVM signer");

    const { ethers } = await import("ethers");
    const withdrawAmount = ethers.parseUnits(amount, data.decimals);

    setStatus("Withdrawing from Aster... Please confirm in your wallet.");
    const treasury = new ethers.Contract(data.treasuryAddress, data.treasuryAbi, signer);
    const tx = await treasury.withdraw(data.tokenAddress, withdrawAmount);

    setStatus("Confirming withdrawal...");
    const receipt = await tx.wait();

    setTxHash(receipt.hash);
    setStep("success");
  };

  // ─── Hyperliquid ──────────────────────────────────────────────────────────
  const handleHlWithdraw = async () => {
    if (!evmAddress) throw new Error("EVM wallet not connected");

    setStatus("Building withdrawal payload...");
    const res = await fetch(
      `/api/hyperliquid/withdraw?destination=${encodeURIComponent(evmAddress)}&amount=${encodeURIComponent(amount)}`,
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to prepare withdrawal");

    const payload = data as { eip712Payload: Eip712Payload; nonce: number; amountStr: string };
    const { eip712Payload, nonce, amountStr } = payload;

    setStatus("Please sign the withdrawal request in your wallet...");

    // Sign via MetaMask eth_signTypedData_v4
    const provider = (window as EthereumWindow).ethereum;
    if (!provider) throw new Error("No Ethereum provider found. Please install MetaMask.");

    const { ethers } = await import("ethers");

    let signature: string;
    try {
      // Try ethers v6 wallet signing
      const browserProvider = new ethers.BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const { domain, types, message } = eip712Payload;
      // Remove EIP-712 domain type if present (ethers v6 doesn't want it)
      const { EIP712Domain: _omit, ...filteredTypes } = types;
      signature = await signer.signTypedData(domain, filteredTypes, message as Record<string, unknown>);
    } catch {
      // Fallback: raw eth_signTypedData_v4
      signature = (await provider.request({
        method: "eth_signTypedData_v4",
        params: [evmAddress, JSON.stringify(eip712Payload)],
      })) as string;
    }

    // Parse signature into r, s, v
    const sig = ethers.Signature.from(signature);
    const hlSig = { r: sig.r, s: sig.s, v: sig.v };

    setStatus("Submitting withdrawal to Hyperliquid...");
    const action = {
      type: "withdraw3",
      signatureChainId: "0xa4b1", // Arbitrum
      hyperliquidChain: "Mainnet",
      destination: evmAddress,
      amount: amountStr,
      time: nonce,
    };

    const submitRes = await fetch("/api/hyperliquid/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, nonce, signature: hlSig }),
    });
    const submitData = await submitRes.json();
    if (!submitRes.ok || submitData.status === "err") {
      throw new Error(submitData.response || submitData.error || "HL withdrawal rejected");
    }

    setTxHash("HL:" + nonce);
    setStep("success");
  };

  if (!open) return null;

  const explorerUrl = txHash
    ? txHash.startsWith("HL:")
      ? `https://app.hyperliquid.xyz/portfolio`
      : `https://arbiscan.io/tx/${txHash}`
    : null;

  return (
    <div
      data-testid="withdraw-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        data-testid="withdraw-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420,
          background: "#0D1219",
          border: "1px solid rgba(51,255,136,0.1)",
          borderRadius: 16, overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {step === "confirm" && (
              <button
                data-testid="withdraw-back"
                onClick={() => setStep("amount")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", display: "flex", padding: 0 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
            )}
            <span style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>
              {step === "amount" ? "Withdraw Funds" :
               step === "confirm" ? "Confirm Withdrawal" :
               step === "processing" ? "Processing..." :
               step === "success" ? "Withdrawal Complete" :
               "Withdrawal Failed"}
            </span>
          </div>
          <button
            data-testid="withdraw-modal-close"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "none",
              width: 28, height: 28, borderRadius: 8, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6B7280",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div style={{ padding: "16px 20px" }}>

          {/* Step: Amount */}
          {step === "amount" && selected && (
            <div>
              {/* Inline protocol toggle */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {PROTOCOLS.map(p => (
                  <button
                    key={p.id}
                    data-testid={`withdraw-protocol-${p.id}`}
                    onClick={() => setProtocol(p.id)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                      fontFamily: SANS,
                      background: protocol === p.id ? `${p.color}18` : "rgba(255,255,255,0.02)",
                      border: protocol === p.id ? `1px solid ${p.color}50` : "1px solid rgba(255,255,255,0.06)",
                      color: protocol === p.id ? p.color : "#6B7280",
                      transition: "all 0.15s",
                    }}
                  >
                    <img src={p.logo} alt={p.name} style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} />
                    <span>{p.name}</span>
                    <span style={{ fontSize: 9, opacity: 0.7 }}>{p.asset}</span>
                  </button>
                ))}
              </div>
              {!isConnected() && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, marginBottom: 14,
                  background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                  fontSize: 11, color: "#EF4444", fontFamily: SANS,
                }}>
                  Connect your {selected.chain} wallet to withdraw.
                </div>
              )}

              {/* Platform balance */}
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 14,
                background: "rgba(51,255,136,0.04)", border: "1px solid rgba(51,255,136,0.12)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS }}>Available in {selected.name}</span>
                <span data-testid="withdraw-platform-balance" style={{ fontSize: 13, fontWeight: 700, color: "#33FF88", fontFamily: MONO }}>
                  {platformBalance === null
                    ? "Loading..."
                    : `${platformBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selected.asset}`}
                </span>
              </div>

              {/* Amount input */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS, marginBottom: 6 }}>
                  Amount ({selected.asset})
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    data-testid="withdraw-amount-input"
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: "100%", padding: "12px 60px 12px 14px", borderRadius: 10,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "#E6EDF3", fontSize: 20, fontWeight: 600, fontFamily: MONO,
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(51,255,136,0.3)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  />
                  <span style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    fontSize: 12, color: "#6B7280", fontWeight: 600, fontFamily: MONO,
                  }}>
                    {selected.asset}
                  </span>
                </div>
              </div>

              {/* Quick % buttons */}
              <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                {QUICK_PCT.map(pct => (
                  <button
                    key={pct}
                    data-testid={`withdraw-pct-${pct}`}
                    onClick={() => setPercentage(pct)}
                    style={{
                      flex: 1, padding: "6px 0", borderRadius: 6,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#6B7280", fontSize: 11, fontWeight: 600,
                      fontFamily: MONO, cursor: "pointer",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#33FF88"; e.currentTarget.style.borderColor = "rgba(51,255,136,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  >
                    {pct === 100 ? "MAX" : `${pct}%`}
                  </button>
                ))}
              </div>

              {/* Info rows */}
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 14,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
              }}>
                <Row label="Protocol" value={selected.name} />
                <Row label="Chain" value={selected.chain} />
                <Row label="Asset" value={selected.asset} />
                {protocol === "hyperliquid" && (
                  <div style={{ marginTop: 6, fontSize: 9, color: "#6B7280", fontFamily: SANS }}>
                    HL withdrawals arrive in 1–5 minutes via the Hyperliquid bridge.
                  </div>
                )}
                {protocol === "aster" && (
                  <div style={{ marginTop: 6, fontSize: 9, color: "#6B7280", fontFamily: SANS }}>
                    Reducing collateral increases your liquidation risk.
                  </div>
                )}
              </div>

              {/* Destination */}
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS, marginBottom: 4 }}>Destination wallet</div>
                <div style={{ fontSize: 11, color: "#9BA4AE", fontFamily: MONO, wordBreak: "break-all" }}>
                  {evmAddress || "—"}
                </div>
              </div>

              <button
                data-testid="withdraw-continue"
                onClick={() => {
                  if (isConnected() && parseFloat(amount) > 0) setStep("confirm");
                }}
                disabled={!isConnected() || !amount || parseFloat(amount) <= 0}
                style={{
                  width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
                  background: isConnected() && parseFloat(amount) > 0
                    ? "linear-gradient(135deg, #1a4a2e, #0f3322)"
                    : "rgba(255,255,255,0.04)",
                  color: isConnected() && parseFloat(amount) > 0 ? "#33FF88" : "#4A5060",
                  fontSize: 13, fontWeight: 700, cursor: isConnected() && parseFloat(amount) > 0 ? "pointer" : "not-allowed",
                  fontFamily: SANS, letterSpacing: "0.03em",
                  boxShadow: isConnected() && parseFloat(amount) > 0 ? "0 0 20px rgba(51,255,136,0.15)" : "none",
                }}
              >
                Review Withdrawal
              </button>
            </div>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && selected && (
            <div>
              <div style={{
                padding: "16px", borderRadius: 10, marginBottom: 16,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#E6EDF3", fontFamily: MONO }}>
                    {parseFloat(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 14, color: "#6B7280", fontFamily: MONO, marginTop: 2 }}>{selected.asset}</div>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
                  <Row label="From" value={selected.name} />
                  <Row label="Chain" value={selected.chain} />
                  <Row label="To wallet" value={`${evmAddress?.slice(0, 8)}...${evmAddress?.slice(-6)}`} />
                  {protocol === "hyperliquid" && (
                    <Row label="ETA" value="1–5 minutes" />
                  )}
                </div>
              </div>

              <div style={{
                padding: "8px 12px", borderRadius: 8, marginBottom: 14,
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                fontSize: 10, color: "#EF4444", fontFamily: SANS,
              }}>
                This will move funds out of your {selected.name} account. Open positions may be affected.
              </div>

              <button
                data-testid="withdraw-confirm"
                onClick={handleWithdraw}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #1a4a2e, #0f3322)",
                  color: "#33FF88", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: SANS, letterSpacing: "0.03em",
                  boxShadow: "0 0 20px rgba(51,255,136,0.15)",
                }}
              >
                Confirm Withdrawal
              </button>
            </div>
          )}

          {/* Step: Processing */}
          {step === "processing" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", margin: "0 auto 16px",
                border: "3px solid rgba(51,255,136,0.15)",
                borderTopColor: "#33FF88",
                animation: "spin 1s linear infinite",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 13, color: "#E6EDF3", fontFamily: SANS, fontWeight: 600, marginBottom: 8 }}>
                Processing withdrawal...
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", fontFamily: SANS }}>{status}</div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && selected && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
                background: "rgba(51,255,136,0.1)", border: "2px solid rgba(51,255,136,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#33FF88" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS, marginBottom: 6 }}>
                Withdrawal Submitted
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", fontFamily: SANS, marginBottom: 16 }}>
                {parseFloat(amount).toFixed(2)} {selected.asset} from {selected.name}
                {protocol === "hyperliquid" ? " — funds arrive in 1–5 minutes." : "."}
              </div>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="withdraw-explorer-link"
                  style={{
                    display: "inline-block", padding: "8px 18px", borderRadius: 8,
                    background: "rgba(51,255,136,0.08)", border: "1px solid rgba(51,255,136,0.2)",
                    color: "#33FF88", fontSize: 11, fontFamily: MONO, textDecoration: "none",
                    marginBottom: 12,
                  }}
                >
                  {protocol === "hyperliquid" ? "View Portfolio" : "View on Explorer ↗"}
                </a>
              )}
              <button
                data-testid="withdraw-done"
                onClick={onClose}
                style={{
                  display: "block", width: "100%", padding: "10px 0", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  color: "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: SANS,
                }}
              >
                Done
              </button>
            </div>
          )}

          {/* Step: Error */}
          {step === "error" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
                background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS, marginBottom: 6 }}>
                Withdrawal Failed
              </div>
              <div style={{
                fontSize: 11, color: "#EF4444", fontFamily: MONO, marginBottom: 16,
                padding: "8px 12px", borderRadius: 8,
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                wordBreak: "break-word",
              }}>
                {errorMsg}
              </div>
              <button
                data-testid="withdraw-retry"
                onClick={() => { setStep("amount"); setErrorMsg(""); }}
                style={{
                  display: "block", width: "100%", padding: "10px 0", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  color: "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: SANS,
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
