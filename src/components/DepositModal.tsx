"use client";

import { useState, useCallback, useEffect } from "react";
import { useEvmWallet } from "@/hooks/useEvmWallet";

const MONO = "'IBM Plex Mono', 'SF Mono', monospace";
const SANS = "Inter, -apple-system, sans-serif";

type DepositStep = "amount" | "confirm" | "processing" | "success" | "error";

type AssetDef = {
  symbol: string;
  address: string;
  decimals: number;
  route: "hyperliquid" | "aster";
  routeLabel: string;
};

const DEPOSIT_ASSETS: AssetDef[] = [
  { symbol: "USDC",   address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, route: "hyperliquid", routeLabel: "Hyperliquid" },
  { symbol: "USDT",   address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, route: "aster",       routeLabel: "Aster" },
  { symbol: "USDC.e", address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", decimals: 6, route: "aster",       routeLabel: "Aster" },
];

const QUICK_AMOUNTS = [25, 50, 100, 250, 500, 1000];
const ACCENT = "#D4A574";

export function DepositModal({ open, onClose, defaultProtocol }: { open: boolean; onClose: () => void; defaultProtocol?: "aster" | "hyperliquid" }) {
  const { evmAddress, isEvmConnected, isArbitrum, switchToArbitrum, getEvmSigner } = useEvmWallet();

  const defaultAssetIdx = defaultProtocol === "aster" ? 1 : 0;
  const [step, setStep] = useState<DepositStep>("amount");
  const [selectedAsset, setSelectedAsset] = useState<AssetDef>(DEPOSIT_ASSETS[defaultAssetIdx]);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount("");
      setStatus("");
      setTxHash("");
      setErrorMsg("");
      setWalletBalance(null);
      setStep("amount");
      const idx = defaultProtocol === "aster" ? 1 : 0;
      setSelectedAsset(DEPOSIT_ASSETS[idx]);
    }
  }, [open, defaultProtocol]);

  useEffect(() => {
    if (step !== "amount") return;
    setWalletBalance(null);
    let cancelled = false;
    const fetchBalance = async () => {
      try {
        if (evmAddress && isEvmConnected) {
          const signer = await getEvmSigner();
          if (!signer || cancelled) return;
          const { ethers } = await import("ethers");
          const token = new ethers.Contract(selectedAsset.address, ["function balanceOf(address) view returns (uint256)"], signer);
          const raw = await token.balanceOf(evmAddress);
          if (!cancelled) setWalletBalance(ethers.formatUnits(raw, selectedAsset.decimals));
        }
      } catch {
        if (!cancelled) setWalletBalance(null);
      }
    };
    fetchBalance();
    return () => { cancelled = true; };
  }, [selectedAsset, step, evmAddress, isEvmConnected, getEvmSigner]);

  const canDeposit = useCallback(() => {
    if (!amount || parseFloat(amount) <= 0) return false;
    return isEvmConnected && !!evmAddress;
  }, [amount, isEvmConnected, evmAddress]);

  const handleDeposit = async () => {
    if (!canDeposit()) return;
    setStep("processing");
    setStatus("Preparing transaction...");
    try {
      if (selectedAsset.route === "aster") {
        await handleAsterDeposit();
      } else {
        await handleHyperliquidDeposit();
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Transaction failed");
      setStep("error");
    }
  };

  const handleAsterDeposit = async () => {
    if (!evmAddress) throw new Error("EVM wallet not connected");
    if (!isArbitrum) {
      setStatus("Switching to Arbitrum...");
      try { await switchToArbitrum(); } catch { throw new Error("Failed to switch to Arbitrum network. Please switch manually in your wallet."); }
      await new Promise(r => setTimeout(r, 500));
    }
    setStatus("Fetching deposit details...");
    const res = await fetch("/api/aster/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress: evmAddress, amount: parseFloat(amount), asset: selectedAsset.symbol }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to prepare deposit");
    const signer = await getEvmSigner();
    if (!signer) throw new Error("Could not get EVM signer");
    const { ethers } = await import("ethers");
    const tokenContract = new ethers.Contract(data.tokenAddress, data.erc20Abi, signer);
    const depositAmount = ethers.parseUnits(amount, data.decimals);
    setStatus("Checking token allowance...");
    const currentAllowance = await tokenContract.allowance(evmAddress, data.treasuryAddress);
    if (currentAllowance < depositAmount) {
      setStatus("Approving token spend... Please confirm in your wallet.");
      const approveTx = await tokenContract.approve(data.treasuryAddress, depositAmount);
      setStatus("Waiting for approval confirmation...");
      await approveTx.wait();
    }
    setStatus("Depositing funds... Please confirm in your wallet.");
    const treasury = new ethers.Contract(data.treasuryAddress, data.treasuryAbi, signer);
    const depositTx = await treasury.deposit(data.tokenAddress, depositAmount, data.broker);
    setStatus("Confirming deposit...");
    const receipt = await depositTx.wait();
    setTxHash(receipt.hash);
    setStep("success");
  };

  const handleHyperliquidDeposit = async () => {
    if (!evmAddress) throw new Error("EVM wallet not connected");
    
    if (!isArbitrum) {
      setStatus("Switching to Arbitrum...");
      try { 
        await switchToArbitrum(); 
      } catch { 
        throw new Error("Failed to switch to Arbitrum network. Please switch manually in your wallet."); 
      }
      await new Promise(r => setTimeout(r, 500));
    }

    setStatus("Preparing deposit...");
    
    const response = await fetch("/api/hyperliquid/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress: evmAddress, amount: parseFloat(amount) }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to prepare deposit");
    }

    const data = await response.json();

    setStatus("Please sign the permit (gasless approval)...");
    
    const signer = await getEvmSigner();
    if (!signer) throw new Error("Could not get wallet signer");

    const { ethers } = await import("ethers");
    
    const signature = await signer.signTypedData(
      data.domain,
      data.types,
      {
        owner: data.message.owner,
        spender: data.message.spender,
        value: BigInt(data.message.value),
        nonce: BigInt(data.message.nonce),
        deadline: BigInt(data.message.deadline),
      }
    );

    const r = signature.slice(0, 66);
    const s = "0x" + signature.slice(66, 130);
    const v = parseInt(signature.slice(130, 132), 16);

    setStatus("Submitting deposit transaction...");
    
    const bridge = new ethers.Contract(data.bridgeAddress, data.bridgeAbi, signer);

    const depositTx = await bridge.batchedDepositWithPermit([
      {
        user: evmAddress,
        usd: BigInt(data.amountUsd),
        deadline: BigInt(data.message.deadline),
        signature: { r: BigInt(r), s: BigInt(s), v },
      },
    ]);

    setStatus("Confirming transaction...");
    const receipt = await depositTx.wait();
    setTxHash(receipt.hash);
    setStep("success");
  };

  if (!open) return null;

  const parsedAmt = parseFloat(amount) || 0;
  const ready = canDeposit();

  return (
    <div
      data-testid="deposit-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        data-testid="deposit-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420,
          background: "#0D1219",
          border: `1px solid rgba(212,165,116,0.15)`,
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
                data-testid="deposit-back"
                onClick={() => setStep("amount")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", display: "flex", padding: 0 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/azabu-logo.png" alt="Azabu" style={{ width: 22, height: 22, objectFit: "contain" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>
                {step === "amount" ? "Deposit to Azabu" :
                 step === "confirm" ? "Confirm Deposit" :
                 step === "processing" ? "Processing..." :
                 step === "success" ? "Deposit Complete" : "Deposit Failed"}
              </span>
            </div>
          </div>
          <button
            data-testid="deposit-modal-close"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "none",
              width: 28, height: 28, borderRadius: 8, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div style={{ padding: "16px 20px" }}>

          {/* ── STEP: AMOUNT ── */}
          {step === "amount" && (
            <div>
              {!isEvmConnected && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, marginBottom: 14,
                  background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                  fontSize: 11, color: "#EF4444", fontFamily: SANS,
                }}>
                  Connect your wallet first to deposit.
                </div>
              )}

              {/* Token selector */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS, marginBottom: 6 }}>Select token</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {DEPOSIT_ASSETS.map(asset => {
                    const isSelected = selectedAsset.symbol === asset.symbol;
                    return (
                      <button
                        key={asset.symbol}
                        data-testid={`deposit-asset-${asset.symbol.replace('.', '')}`}
                        onClick={() => { setSelectedAsset(asset); setAmount(""); setWalletBalance(null); }}
                        style={{
                          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          padding: "10px 8px", borderRadius: 10,
                          border: `1px solid ${isSelected ? `${ACCENT}50` : "rgba(255,255,255,0.08)"}`,
                          background: isSelected ? `${ACCENT}12` : "rgba(255,255,255,0.02)",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? ACCENT : "#9CA3AF", fontFamily: MONO }}>
                          {asset.symbol}
                        </span>
                        <span style={{ fontSize: 8, color: "#4A5568", fontFamily: SANS }}>
                          Arbitrum
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount input */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS }}>Amount</span>
                  {walletBalance !== null && (
                    <span
                      data-testid="deposit-wallet-balance"
                      style={{ fontSize: 10, color: "#6B7280", fontFamily: MONO, cursor: "pointer" }}
                      onClick={() => setAmount(walletBalance)}
                    >
                      Balance: <span style={{ color: "#E6EDF3", fontWeight: 600 }}>{parseFloat(walletBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span> <span style={{ color: ACCENT, fontSize: 8 }}>MAX</span>
                    </span>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    data-testid="deposit-amount-input"
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    min={selectedAsset.route === "hyperliquid" ? "5" : "0"}
                    style={{
                      width: "100%", padding: "14px 80px 14px 16px", borderRadius: 12,
                      background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.08)`,
                      color: "#E6EDF3", fontSize: 22, fontWeight: 600, fontFamily: MONO,
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = `${ACCENT}50`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  />
                  <div style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 700, fontFamily: MONO }}>
                      {selectedAsset.symbol}
                    </span>
                  </div>
                </div>
                {selectedAsset.route === "hyperliquid" && (
                  <div style={{ fontSize: 9, color: parsedAmt > 0 && parsedAmt < 5 ? "#EF4444" : "#6B7280", fontFamily: SANS, marginTop: 6 }}>
                    Minimum deposit: 5 USDC
                  </div>
                )}
              </div>

              {/* Quick amounts */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    data-testid={`deposit-quick-${a}`}
                    onClick={() => setAmount(String(a))}
                    style={{
                      padding: "5px 12px", borderRadius: 6,
                      background: amount === String(a) ? `${ACCENT}15` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${amount === String(a) ? `${ACCENT}40` : "rgba(255,255,255,0.06)"}`,
                      color: amount === String(a) ? ACCENT : "#6B7280",
                      fontSize: 11, fontWeight: 600, fontFamily: MONO, cursor: "pointer",
                    }}
                  >
                    ${a}
                  </button>
                ))}
              </div>

              {/* Route indicator */}
              <div style={{
                padding: "8px 12px", borderRadius: 8, marginBottom: 16,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 10, color: "#4A5568", fontFamily: SANS }}>Routed via</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    background: selectedAsset.route === "hyperliquid" ? "rgba(51,255,136,0.15)" : "rgba(40,160,240,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: selectedAsset.route === "hyperliquid" ? "#33FF88" : "#28A0F0",
                    }} />
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, fontFamily: MONO,
                    color: selectedAsset.route === "hyperliquid" ? "#33FF88" : "#28A0F0",
                  }}>
                    {selectedAsset.routeLabel}
                  </span>
                  <span style={{ fontSize: 9, color: "#3A4050", fontFamily: SANS }}>on Arbitrum</span>
                </div>
              </div>

              <button
                data-testid="deposit-continue"
                onClick={() => { 
                  const minAmount = selectedAsset.route === "hyperliquid" ? 5 : 0;
                  if (parsedAmt >= minAmount && isEvmConnected) setStep("confirm"); 
                }}
                disabled={!isEvmConnected || parsedAmt <= 0 || (selectedAsset.route === "hyperliquid" && parsedAmt < 5)}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                  background: ready && parsedAmt > 0 && !(selectedAsset.route === "hyperliquid" && parsedAmt < 5)
                    ? `linear-gradient(135deg, ${ACCENT}, #C4956A)`
                    : "rgba(255,255,255,0.04)",
                  color: ready && parsedAmt > 0 && !(selectedAsset.route === "hyperliquid" && parsedAmt < 5) ? "#0D1219" : "#4A5060",
                  fontSize: 13, fontWeight: 700, fontFamily: SANS,
                  cursor: ready && parsedAmt > 0 && !(selectedAsset.route === "hyperliquid" && parsedAmt < 5) ? "pointer" : "not-allowed",
                }}
              >
                Continue
              </button>
            </div>
          )}

          {/* ── STEP: CONFIRM ── */}
          {step === "confirm" && (
            <div>
              <div style={{
                padding: 20, borderRadius: 12, marginBottom: 16,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 32, fontWeight: 300, color: "#E6EDF3", fontFamily: MONO, marginBottom: 4 }}>
                  {parsedAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", fontFamily: MONO }}>{selectedAsset.symbol}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
                  <div style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.04)", fontSize: 10, color: "#E6EDF3", fontFamily: MONO, fontWeight: 600 }}>
                    Wallet
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", borderRadius: 6,
                    background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`,
                  }}>
                    <img src="/azabu-logo.png" alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
                    <span style={{ fontSize: 10, color: ACCENT, fontFamily: MONO, fontWeight: 600 }}>Azabu</span>
                  </div>
                </div>
              </div>

              <div style={{
                padding: "8px 12px", borderRadius: 6, marginBottom: 12,
                background: "rgba(255,165,0,0.06)", border: "1px solid rgba(255,165,0,0.12)",
                fontSize: 10, color: "#FFA500", fontFamily: SANS, lineHeight: 1.5,
              }}>
                {selectedAsset.route === "aster"
                  ? "This will require two transactions: an approval and a deposit."
                  : "Using gasless permit signature - only one transaction required. Funds arrive in 1-2 minutes."}
              </div>

              <button
                data-testid="deposit-confirm-btn"
                onClick={handleDeposit}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                  background: `linear-gradient(135deg, ${ACCENT}, #C4956A)`,
                  color: "#0D1219", fontSize: 13, fontWeight: 700, fontFamily: SANS, cursor: "pointer",
                }}
              >
                Confirm Deposit
              </button>
            </div>
          )}

          {/* ── STEP: PROCESSING ── */}
          {step === "processing" && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{
                width: 48, height: 48, margin: "0 auto 16px",
                border: `3px solid rgba(212,165,116,0.2)`, borderTopColor: ACCENT,
                borderRadius: "50%", animation: "spin 1s linear infinite",
              }} />
              <div style={{ fontSize: 13, color: "#E6EDF3", fontFamily: SANS, fontWeight: 600, marginBottom: 6 }}>{status}</div>
              <div style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS }}>Do not close this window</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── STEP: SUCCESS ── */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{
                width: 48, height: 48, margin: "0 auto 16px", borderRadius: "50%",
                background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS, marginBottom: 6 }}>Deposited to Azabu</div>
              <div style={{ fontSize: 11, color: "#6B7280", fontFamily: SANS, marginBottom: 16 }}>
                {parsedAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedAsset.symbol} is now in your trading account
              </div>
              {txHash && (
                <a
                  href={`https://arbiscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 10, color: ACCENT, fontFamily: MONO, display: "block", marginBottom: 16, textDecoration: "none" }}
                >
                  View on Arbiscan →
                </a>
              )}
              <button
                data-testid="deposit-done-btn"
                onClick={onClose}
                style={{
                  padding: "10px 28px", borderRadius: 8, border: "none",
                  background: "rgba(34,197,94,0.1)", color: "#22C55E",
                  fontSize: 12, fontWeight: 700, fontFamily: SANS, cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}

          {/* ── STEP: ERROR ── */}
          {step === "error" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{
                width: 48, height: 48, margin: "0 auto 16px", borderRadius: "50%",
                background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS, marginBottom: 8 }}>Deposit Failed</div>
              <div style={{
                fontSize: 11, color: "#6B7280", fontFamily: MONO, marginBottom: 20,
                padding: "10px 14px", borderRadius: 8,
                background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)",
                wordBreak: "break-word", textAlign: "left",
              }}>
                {errorMsg}
              </div>
              <button
                data-testid="deposit-retry-btn"
                onClick={() => setStep("amount")}
                style={{
                  padding: "10px 28px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
                  background: "transparent", color: "#E6EDF3",
                  fontSize: 12, fontWeight: 700, fontFamily: SANS, cursor: "pointer",
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
