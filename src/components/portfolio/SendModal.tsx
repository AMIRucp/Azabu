"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { X, Send, ChevronDown, AlertTriangle, ExternalLink, Check, Loader2 } from "lucide-react";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useToast } from "@/hooks/use-toast";
import type { WalletToken } from "@/hooks/usePortfolioData";
import { ARBITRUM_TOKEN_ADDRESSES, HYPERLIQUID_TOKEN_ADDRESSES, ERC20_ABI_MINIMAL } from "@/config/tokenAddresses";
import { ARBITRUM_CHAIN_ID, HYPERLIQUID_CHAIN_ID } from "@/config/wagmiConfig";
import { getIconWithJupiter } from "@/config/tokenIcons";

const MONO = "'IBM Plex Mono', 'SF Mono', monospace";
const SANS = "Inter, -apple-system, sans-serif";

type Chain = "Arbitrum" | "Hyperliquid";
type SendStatus = "idle" | "confirming" | "signing" | "submitting" | "success" | "error";

interface SendModalProps {
  open: boolean;
  onClose: () => void;
  walletTokens: WalletToken[];
  defaultChain?: Chain;
  defaultToken?: string;
}

const CHAIN_INFO: Record<Chain, { label: string; logo: string; explorerTx: (h: string) => string; chainId?: number }> = {
  Arbitrum:    { label: "Arbitrum",    logo: "/tokens/arb.webp",          explorerTx: (h) => `https://arbiscan.io/tx/${h}`,   chainId: ARBITRUM_CHAIN_ID },
  Hyperliquid: { label: "Hyperliquid", logo: "/tokens/hyperliquid.webp", explorerTx: (h) => `https://hyperscan.xyz/tx/${h}`, chainId: HYPERLIQUID_CHAIN_ID },
};

function TokenOption({ symbol }: { symbol: string }) {
  const icon = getIconWithJupiter(symbol, {});
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {icon.type === "img"
        ? <img src={icon.value} alt={symbol} width={16} height={16} style={{ borderRadius: "50%" }} />
        : <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#1C1C1C", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#9BA4AE" }}>{icon.value}</span>}
      {symbol}
    </span>
  );
}

function isTokenSendable(chain: Chain, symbol: string): boolean {
  if (chain === "Arbitrum") return symbol in ARBITRUM_TOKEN_ADDRESSES;
  if (chain === "Hyperliquid") return symbol in HYPERLIQUID_TOKEN_ADDRESSES;
  return false;
}

export function SendModal({ open, onClose, walletTokens, defaultChain, defaultToken }: SendModalProps) {
  const { evmAddress, getEvmSigner, switchToChain, evmChainId } = useEvmWallet();
  const { toast } = useToast();

  const availableChains: Chain[] = useMemo(() => {
    return evmAddress ? ["Arbitrum", "Hyperliquid"] : [];
  }, [evmAddress]);

  const initial = defaultChain && availableChains.includes(defaultChain) ? defaultChain : availableChains[0] ?? "Arbitrum";

  const [selectedChain, setSelectedChain] = useState<Chain>(initial);
  const [selectedToken, setSelectedToken] = useState<string>(defaultToken ?? "");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState<SendStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (defaultChain && availableChains.includes(defaultChain)) setSelectedChain(defaultChain);
      setSelectedToken(defaultToken ?? "");
      setAmount("");
      setRecipient("");
      setStatus("idle");
      setErrorMsg(null);
      setTxHash(null);
    }
  }, [open]);

  const chainTokens = useMemo(() => {
    return walletTokens.filter((t) => t.chain === selectedChain);
  }, [walletTokens, selectedChain]);

  const sendableTokens = useMemo(() => {
    return chainTokens.filter((t) => isTokenSendable(selectedChain, t.asset));
  }, [chainTokens, selectedChain]);

  const selectedTokenData = chainTokens.find((t) => t.asset === selectedToken);

  const handleChainChange = (c: Chain) => {
    setSelectedChain(c);
    setSelectedToken("");
    setAmount("");
    setStatus("idle");
    setErrorMsg(null);
    setTxHash(null);
  };

  const handleMax = () => {
    if (selectedTokenData) setAmount(String(selectedTokenData.amount));
  };

  const validate = (): string | null => {
    if (!selectedToken) return "Select a token";
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) return "Enter a valid amount";
    if (selectedTokenData && num > selectedTokenData.amount) return "Amount exceeds balance";
    if (!recipient.trim()) return "Enter recipient address";
    if (!recipient.match(/^0x[0-9a-fA-F]{40}$/)) return "Invalid EVM address";
    return null;
  };

  const sendEvm = useCallback(async () => {
    const targetChainId = CHAIN_INFO[selectedChain].chainId!;
    if (evmChainId !== targetChainId) {
      await switchToChain(selectedChain === "Arbitrum" ? "arbitrum" : "hyperliquid");
    }

    const signer = await getEvmSigner();
    if (!signer) throw new Error("Could not get EVM signer");

    const { ethers } = await import("ethers");
    const tokenMap = selectedChain === "Arbitrum" ? ARBITRUM_TOKEN_ADDRESSES : HYPERLIQUID_TOKEN_ADDRESSES;
    const tokenInfo = tokenMap[selectedToken];
    if (!tokenInfo) throw new Error("Unknown token: " + selectedToken);

    setStatus("signing");

    let tx;
    if (tokenInfo.native) {
      tx = await signer.sendTransaction({
        to: recipient.trim(),
        value: ethers.parseUnits(amount, tokenInfo.decimals),
      });
    } else {
      const contract = new ethers.Contract(tokenInfo.address!, ERC20_ABI_MINIMAL, signer);
      tx = await contract.transfer(recipient.trim(), ethers.parseUnits(amount, tokenInfo.decimals));
    }

    setStatus("submitting");
    await tx.wait(1);
    return tx.hash as string;
  }, [selectedChain, selectedToken, amount, recipient, getEvmSigner, evmChainId, switchToChain]);

  const handleSend = async () => {
    const err = validate();
    if (err) { setErrorMsg(err); return; }

    setErrorMsg(null);
    setStatus("confirming");
    try {
      const hash = await sendEvm();
      setTxHash(hash);
      setStatus("success");
      toast({ title: "Sent!", description: `${amount} ${selectedToken} sent successfully` });
    } catch (e: unknown) {
      const err = e as Error & { code?: number };
      setStatus("error");
      let msg = err.message || "Unknown error";
      if (err.code === 4001 || msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("user rejected")) {
        msg = "Transaction cancelled. No funds were sent.";
      } else if (msg.toLowerCase().includes("insufficient")) {
        msg = "Insufficient balance for this transfer.";
      }
      setErrorMsg(msg);
    }
  };

  const reset = () => {
    setStatus("idle");
    setErrorMsg(null);
    setTxHash(null);
    setAmount("");
    setRecipient("");
  };

  if (!open) return null;

  const info = CHAIN_INFO[selectedChain];
  const busy = status === "confirming" || status === "signing" || status === "submitting";

  return (
    <div
      data-testid="modal-send"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 440,
        background: "#111820",
        border: "1px solid #1B2030",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #1B2030",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Send size={15} color="#E6EDF3" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>Send</span>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            data-testid="button-send-modal-close"
            style={{ background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", padding: 4, opacity: busy ? 0.4 : 1 }}
          >
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {availableChains.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#6B7280", fontSize: 13, fontFamily: SANS }}>
            Connect a wallet to send funds.
          </div>
        ) : status === "success" && txHash ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Check size={24} color="#22C55E" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS, marginBottom: 6 }}>
              {amount} {selectedToken} sent
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", fontFamily: MONO, marginBottom: 20 }}>
              to {recipient.slice(0, 6)}...{recipient.slice(-4)}
            </div>
            <a
              href={info.explorerTx(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-send-explorer"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#E6EDF3", fontFamily: SANS }}
            >
              View on Explorer <ExternalLink size={11} />
            </a>
            <div style={{ marginTop: 20 }}>
              <button
                onClick={reset}
                data-testid="button-send-again"
                style={{
                  padding: "8px 20px", borderRadius: 8,
                  background: "rgba(255,255,255,0.06)", border: "1px solid #1B2030",
                  color: "#E6EDF3", fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Send again
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {availableChains.map((c) => {
                const active = c === selectedChain;
                const ci = CHAIN_INFO[c];
                return (
                  <button
                    key={c}
                    onClick={() => handleChainChange(c)}
                    disabled={busy}
                    data-testid={`tab-send-${c.toLowerCase()}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 10px", border: "none", borderRadius: 6,
                      cursor: busy ? "not-allowed" : "pointer",
                      fontFamily: SANS, fontSize: 11, fontWeight: 600,
                      background: active ? "rgba(255,255,255,0.08)" : "transparent",
                      color: active ? "#E6EDF3" : "#6B7280",
                      transition: "all 0.15s",
                    }}
                  >
                    <img src={ci.logo} alt={c} width={14} height={14} style={{ borderRadius: "50%" }} />
                    {ci.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                  Token
                </div>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setDropdownOpen((p) => !p)}
                    disabled={busy}
                    data-testid="button-select-token"
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "#000000", border: "1px solid #1B2030",
                      borderRadius: 8, cursor: busy ? "not-allowed" : "pointer",
                      color: "#E6EDF3", fontFamily: MONO, fontSize: 12,
                    }}
                  >
                    <span>
                      {selectedToken
                        ? <TokenOption symbol={selectedToken} />
                        : <span style={{ color: "#6B7280" }}>Select token</span>}
                    </span>
                    <ChevronDown size={14} color="#6B7280" style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  </button>
                  {dropdownOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 10,
                      background: "#111820", border: "1px solid #1B2030", borderRadius: 8,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                      maxHeight: 200, overflowY: "auto",
                    }}>
                      {sendableTokens.length === 0 && (
                        <div style={{ padding: "12px 14px", fontSize: 11, color: "#6B7280", fontFamily: SANS }}>
                          No sendable tokens found for this chain.
                        </div>
                      )}
                      {sendableTokens.map((t) => (
                        <button
                          key={t.asset}
                          onClick={() => { setSelectedToken(t.asset); setDropdownOpen(false); setAmount(""); }}
                          data-testid={`option-token-${t.asset.toLowerCase()}`}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 14px", background: "none", border: "none",
                            cursor: "pointer", transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          <TokenOption symbol={t.asset} />
                          <span style={{ fontSize: 11, color: "#9BA4AE", fontFamily: MONO }}>
                            {t.amount.toFixed(4)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedTokenData && (
                  <div style={{ fontSize: 10, color: "#6B7280", fontFamily: MONO, marginTop: 4 }}>
                    Balance: {selectedTokenData.amount.toFixed(selectedToken === "SOL" || ARBITRUM_TOKEN_ADDRESSES[selectedToken]?.native ? 6 : 4)} {selectedToken}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                  Amount
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={busy || !selectedToken}
                    data-testid="input-send-amount"
                    style={{
                      flex: 1, padding: "10px 12px",
                      background: "#000000", border: "1px solid #1B2030",
                      borderRadius: 8, color: "#E6EDF3",
                      fontFamily: MONO, fontSize: 14,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleMax}
                    disabled={busy || !selectedToken}
                    data-testid="button-send-max"
                    style={{
                      padding: "10px 14px",
                      background: "rgba(212,165,116,0.1)", border: "1px solid rgba(212,165,116,0.25)",
                      borderRadius: 8, color: "#D4A574",
                      fontFamily: SANS, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                  Recipient Address
                </div>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  disabled={busy}
                  data-testid="input-send-recipient"
                  style={{
                    width: "100%", padding: "10px 12px",
                    background: "#000000", border: "1px solid #1B2030",
                    borderRadius: 8, color: "#E6EDF3",
                    fontFamily: MONO, fontSize: 12,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {errorMsg && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "10px 12px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8,
                }}>
                  <AlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 11, color: "#EF4444", fontFamily: SANS }} data-testid="text-send-error">{errorMsg}</span>
                </div>
              )}

              <div style={{
                padding: "10px 12px",
                background: "rgba(255,255,255,0.02)", border: "1px solid #1B2030",
                borderRadius: 8,
                fontSize: 10, color: "#6B7280", fontFamily: SANS, lineHeight: 1.6,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Network fee</span>
                  <span style={{ fontFamily: MONO }}>~gas</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                  <span>Network</span>
                  <span style={{ fontFamily: MONO }}>{info.label}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => { if (!busy) onClose(); }}
                  disabled={busy}
                  data-testid="button-send-cancel"
                  style={{
                    flex: 1, padding: "12px",
                    background: "transparent", border: "1px solid #1B2030",
                    borderRadius: 8, color: "#6B7280",
                    fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={busy}
                  data-testid="button-send-submit"
                  style={{
                    flex: 2, padding: "12px",
                    background: busy ? "#1C1C1C" : "linear-gradient(135deg, #D4A574, #D4551F)",
                    border: "none", borderRadius: 8,
                    color: busy ? "#6B7280" : "#fff",
                    fontFamily: SANS, fontSize: 12, fontWeight: 700,
                    cursor: busy ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  {busy && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  {status === "confirming" && "Building transaction..."}
                  {status === "signing" && "Sign in wallet..."}
                  {status === "submitting" && "Submitting..."}
                  {(status === "idle" || status === "error") && "Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
