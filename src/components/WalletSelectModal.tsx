"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { ARBITRUM_CHAIN_ID, HYPERLIQUID_CHAIN_ID } from "@/config/wagmiConfig";
import { X, Download, ExternalLink, ArrowLeft, ChevronRight } from "lucide-react";

const metamaskIcon = "/icons/MetaMask.png";
const coinbaseIcon = "/icons/CoinBase.png";
const walletConnectIcon = "/icons/WalletConnect.jpg";
const rabbyIcon = "/icons/Rabby.jpg";
const trustIcon = "/icons/Trust.jpg";
const phantomIcon = "/icons/Phantom.jpg";


interface BrowserWindow {
  coinbaseWalletExtension?: unknown;
  trustwallet?: unknown;
  phantom?: { ethereum?: unknown };
  ethereum?: {
    isMetaMask?: boolean;
    isRabby?: boolean;
    isTrust?: boolean;
    isTrustWallet?: boolean;
    isPhantom?: boolean;
    providers?: Array<{
      isMetaMask?: boolean;
      isRabby?: boolean;
      isCoinbaseWallet?: boolean;
      isTrust?: boolean;
      isTrustWallet?: boolean;
      isPhantom?: boolean;
    }>;
  };
}

function getBrowserWindow(): BrowserWindow {
  if (typeof window === "undefined") return {};
  return window as unknown as BrowserWindow;
}

function detectMobileWalletBrowser(): "metamask" | "trust" | "coinbase" | "phantom" | null {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (ua.includes("MetaMaskMobile")) return "metamask";
  if (ua.includes("Trust/") || ua.includes("TrustWallet")) return "trust";
  if (ua.includes("CoinbaseWallet") || ua.includes("Coinbase/")) return "coinbase";
  if (ua.includes("Phantom")) return "phantom";
  const w = getBrowserWindow();
  if (w.ethereum?.isTrust || w.ethereum?.isTrustWallet || w.trustwallet) return "trust";
  if (w.phantom?.ethereum) return "phantom";
  return null;
}

function buildDeepLink(wallet: string, url: string): string {
  const encoded = encodeURIComponent(url);
  const host = url.replace(/^https?:\/\//, "");
  switch (wallet) {
    case "metamask": return `https://metamask.app.link/dapp/${host}`;
    case "trust": return `https://link.trustwallet.com/open_url?coin_id=60&url=${encoded}`;
    case "coinbase": return `https://go.cb-w.com/dapp?cb_url=${encoded}`;
    case "phantom": return `https://phantom.app/ul/browse/${encoded}?ref=${encoded}`;
    default: return url;
  }
}

type EvmWalletEntry = {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  textColor: string;
  shortName: string;
  detect: () => boolean;
  downloadUrl: string;
  deepLinkWallet?: string;
  connectorMatch: (connectorId: string, connectorName: string) => boolean;
  multiChain?: boolean;
  isWalletConnect?: boolean;
};

const EVM_WALLETS: EvmWalletEntry[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: metamaskIcon,
    gradient: "linear-gradient(180deg, #E2761B 0%, #7C410F 100%)",
    textColor: "#FFFFFF",
    shortName: "MM",
    detect: () => {
      const w = getBrowserWindow();
      if (!w.ethereum) return false;
      if (w.ethereum.isMetaMask && !w.ethereum.isRabby) return true;
      return w.ethereum.providers?.some(p => p.isMetaMask && !p.isRabby) ?? false;
    },
    downloadUrl: "https://metamask.io/download/",
    deepLinkWallet: "metamask",
    connectorMatch: (id, name) => {
      const lid = id.toLowerCase(); const ln = name.toLowerCase();
      return lid.includes("metamask") || lid === "io.metamask" || lid === "io.metamask.mobile" || ln.includes("metamask");
    },
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: trustIcon,
    gradient: "linear-gradient(180deg, #BB3375 0%, #B064FB 100%)",
    textColor: "#FFFFFF",
    shortName: "TW",
    detect: () => {
      const w = getBrowserWindow();
      return !!(w.ethereum?.isTrust || w.ethereum?.isTrustWallet || w.trustwallet ||
        w.ethereum?.providers?.some(p => p.isTrust || p.isTrustWallet));
    },
    downloadUrl: "https://trustwallet.com/download",
    deepLinkWallet: "trust",
    connectorMatch: (id, name) => {
      const lid = id.toLowerCase(); const ln = name.toLowerCase();
      return lid.includes("trust") || ln.includes("trust");
    },
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: walletConnectIcon,
    gradient: "linear-gradient(180deg, #3B99FC 0%, #235B96 100%)",
    textColor: "#FFFFFF",
    shortName: "WC",
    detect: () => true,
    downloadUrl: "",
    connectorMatch: (id) => id.toLowerCase() === "walletconnect",
    isWalletConnect: true,
  },
  {
    id: "coinbase-evm",
    name: "Coinbase Wallet",
    icon: coinbaseIcon,
    gradient: "linear-gradient(180deg, #6C9CFF 0%, #003199 100%)",
    textColor: "#FFFFFF",
    shortName: "CB",
    detect: () => {
      const w = getBrowserWindow();
      return !!w.coinbaseWalletExtension || (w.ethereum?.providers?.some(p => p.isCoinbaseWallet) ?? false);
    },
    downloadUrl: "https://www.coinbase.com/wallet/downloads",
    deepLinkWallet: "coinbase",
    connectorMatch: (id, name) => {
      const lid = id.toLowerCase(); const ln = name.toLowerCase();
      return lid.includes("coinbase") || lid === "coinbasewalletsdk" || lid === "coinbasewallet" || ln.includes("coinbase") || ln.includes("base wallet");
    },
    multiChain: true,
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: phantomIcon,
    gradient: "linear-gradient(180deg, #4E44CE 0%, #7066EF 100%)",
    textColor: "#FFFFFF",
    shortName: "PH",
    detect: () => {
      const w = getBrowserWindow();
      return !!(w.phantom?.ethereum || w.ethereum?.isPhantom ||
        w.ethereum?.providers?.some(p => p.isPhantom));
    },
    downloadUrl: "https://phantom.app/download",
    deepLinkWallet: "phantom",
    connectorMatch: (id, name) => {
      const lid = id.toLowerCase(); const ln = name.toLowerCase();
      return lid.includes("phantom") || ln.includes("phantom");
    },
  },
  {
    id: "rabby",
    name: "Rabby",
    icon: rabbyIcon,
    gradient: "linear-gradient(180deg, #865DFF 0%, #503899 100%)",
    textColor: "#FFFFFF",
    shortName: "RB",
    detect: () => {
      const w = getBrowserWindow();
      return !!w.ethereum?.isRabby || (w.ethereum?.providers?.some(p => p.isRabby) ?? false);
    },
    downloadUrl: "https://rabby.io/",
    connectorMatch: (id, name) => {
      const lid = id.toLowerCase(); const ln = name.toLowerCase();
      return lid.includes("rabby") || lid === "io.rabby" || ln.includes("rabby");
    },
  },
];

function DownloadView({ name, icon, downloadUrl, deepLinkWallet, onBack }: {
  name: string; icon: string; downloadUrl: string; deepLinkWallet?: string; onBack: () => void;
}) {
  const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const dappUrl = typeof window !== "undefined" ? window.location.href : "";
  const deepLink = deepLinkWallet && isMobile ? buildDeepLink(deepLinkWallet, dappUrl) : null;

  return (
    <div className="flex flex-col items-center text-center px-4 py-6">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden bg-[#1A1B1E] border border-[#2A2B2E]">
        <img src={icon} alt={name} className="w-full h-full object-cover rounded-2xl" />
      </div>
      <h3 className="text-lg font-semibold mb-1 text-white">Get {name}</h3>
      <p className="text-sm mb-6 max-w-xs leading-relaxed text-[#9BA4AE]">
        {isMobile ? `Open this app in ${name} to connect.` : `Install the extension to connect with Azabu.`}
      </p>

      {deepLink && (
        <a
          href={deepLink}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium mb-3 transition-all bg-[#D4A574] text-black hover:opacity-90"
        >
          Open in {name}
          <ExternalLink size={14} />
        </a>
      )}

      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all bg-white text-black hover:bg-gray-100"
      >
        <Download size={16} />
        {isMobile ? `Download ${name}` : `Install ${name}`}
        <ExternalLink size={14} className="opacity-60" />
      </a>

      <button
        onClick={onBack}
        className="mt-6 flex items-center gap-1.5 text-sm text-[#9BA4AE] hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        Back to wallets
      </button>
    </div>
  );
}

function WalletRow({ name, icon, statusText, statusColor, isConnecting, onClick, disabled }: {
  name: string; icon: string;
  statusText: string; statusColor: string; isConnecting: boolean;
  onClick: () => void; disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-4 w-full transition-all duration-200 group"
      style={{ height: "48px" }}
    >
      {/* Gradient circle with initials */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: "48px", height: "48px", borderRadius: "12px", overflow: "hidden" }}
      >
        <img src={icon} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Wallet name */}
      <div className="flex-1 text-left">
        <span className="text-lg font-normal font-sans" style={{ color: "#FFFFFF", lineHeight: "28px", letterSpacing: "-1px" }}>
          {name}
        </span>
      </div>

      {/* Status or connecting indicator */}
      <div className="shrink-0">
        {isConnecting ? (
          <div className="w-4 h-4 rounded-full border-2 animate-spin border-white/20 border-t-white" />
        ) : (
          <span className="text-xs" style={{ color: statusColor }}>{statusText}</span>
        )}
      </div>
    </button>
  );
}

export function WalletSelectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isConnected: isEvmConnected, address: evmAddress } = useAccount();
  const { connectAsync, connectors: evmConnectors } = useConnect();
  const { disconnectAsync: evmDisconnect } = useDisconnect();
  const [downloadView, setDownloadView] = useState<{ name: string; icon: string; downloadUrl: string; deepLinkWallet?: string } | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const mobileWalletBrowser = useMemo(() => detectMobileWalletBrowser(), []);

  // Order wallets: Popular first (MetaMask, Trust, WalletConnect, Coinbase), then Others (Phantom, Rabby)
  const orderedWallets = useMemo(() => {
    const popular = ["metamask", "trust", "walletconnect", "coinbase-evm"];
    const others = ["phantom", "rabby"];
    return [
      ...EVM_WALLETS.filter(w => popular.includes(w.id)),
      ...EVM_WALLETS.filter(w => others.includes(w.id)),
    ];
  }, []);

  const hasWalletConnect = useMemo(
    () => evmConnectors.some(c => c.id === "walletConnect"),
    [evmConnectors]
  );

  const findEvmConnector = useCallback((entry: EvmWalletEntry) => {
    return evmConnectors.find(c => entry.connectorMatch(c.id, c.name));
  }, [evmConnectors]);

  useEffect(() => {
    if (!connectingId) return;
    const timeout = setTimeout(() => setConnectingId(null), 15000);
    return () => clearTimeout(timeout);
  }, [connectingId]);

  useEffect(() => {
    if (connectingId && !isEvmConnected) {
      onClose();
    }
  }, [connectingId, isEvmConnected, onClose]);

  useEffect(() => {
    if (isEvmConnected && connectingId) { setConnectingId(null); }
  }, [isEvmConnected, connectingId]);

  useEffect(() => {
    if (!open) { setDownloadView(null); setConnectingId(null); setConnectError(null); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleWalletClick = useCallback(async (entry: EvmWalletEntry) => {
    if (isEvmConnected) return;
    setConnectError(null);

    const chainId = ARBITRUM_CHAIN_ID; // Default to Arbitrum per design
    const isMobileBrowser = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isDetected = entry.isWalletConnect || entry.detect();

    if (entry.isWalletConnect && !hasWalletConnect) {
      setConnectError("WalletConnect not configured");
      return;
    }

    const connector = findEvmConnector(entry);
    const eip6963Match = !connector && !entry.isWalletConnect
      ? evmConnectors.find(c => {
        const rdns = (c as unknown as { info?: { rdns?: string } })?.info?.rdns ?? "";
        const lid = entry.id.toLowerCase();
        if (lid === "metamask" && rdns.includes("metamask")) return true;
        if (lid === "rabby" && rdns.includes("rabby")) return true;
        if (lid === "coinbase-evm" && rdns.includes("coinbase")) return true;
        if (lid === "trust" && rdns.includes("trust")) return true;
        if (lid === "phantom" && rdns.includes("phantom")) return true;
        return false;
      })
      : null;
    const injectedFallback = !connector && !entry.isWalletConnect
      ? evmConnectors.find(c => c.id === "injected" || c.type === "injected")
      : null;

    const targetConnector = connector || eip6963Match || injectedFallback;

    if (isMobileBrowser && !isDetected && !entry.isWalletConnect) {
      const wcConnector = evmConnectors.find(c => c.id === "walletConnect");
      if (wcConnector) {
        setConnectingId(entry.id);
        try {
          await connectAsync({ connector: wcConnector, chainId });
        } catch (err) {
          setConnectError(`Open ${entry.name} and approve the connection request.`);
          setConnectingId(null);
        }
        return;
      }
      setDownloadView({ name: entry.name, icon: entry.icon, downloadUrl: entry.downloadUrl, deepLinkWallet: entry.deepLinkWallet });
      return;
    }

    if (!isDetected && !targetConnector) {
      setDownloadView({ name: entry.name, icon: entry.icon, downloadUrl: entry.downloadUrl, deepLinkWallet: entry.deepLinkWallet });
      return;
    }

    if (!targetConnector) {
      setConnectError(`No connector found for ${entry.name}. Install the extension and refresh.`);
      return;
    }

    setConnectingId(entry.id);
    try {
      await connectAsync({ connector: targetConnector, chainId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        setConnectError("Connection rejected — try again when ready");
      } else if (msg.includes("Already processing")) {
        setConnectError("Wallet is busy — check your wallet app");
      } else {
        setConnectError(`Connection failed. Open ${entry.name} and approve the request.`);
      }
      setConnectingId(null);
    }
  }, [connectAsync, evmConnectors, isEvmConnected, findEvmConnector, hasWalletConnect]);

  const getWalletStatus = useCallback((entry: EvmWalletEntry): { text: string; color: string } => {
    return { text: "", color: "transparent" };
  }, [findEvmConnector, hasWalletConnect]);

  if (!open || !portalReady) return null;

  // Split wallets into Popular and Others
  const popularWallets = orderedWallets.filter(w => ["metamask", "trust", "walletconnect", "coinbase-evm"].includes(w.id));
  const otherWallets = orderedWallets.filter(w => ["phantom", "rabby"].includes(w.id));

  return createPortal(
    <div
      data-testid="wallet-select-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Connect wallet"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      <div className="relative" style={{ zIndex: 1, maxWidth: "100%" }}>

        {/* Wallet 3D image - upper right */}
        <img
          src="/icons/Wallet.png"
          alt="wallet"
          style={{
            position: "absolute",
            width: "220px",
            height: "220px",
            transform: "rotate(0)",
            right: "-110px",
            top: "115px",
            zIndex: 3,
          }}
        />
        {/* Coin image - directly below wallet, no gap */}
        <img
          src="/icons/Coin.png"
          alt="coin"
          style={{
            position: "absolute",
            width: "165px",
            height: "185px",
            right: "-90px",
            top: "290px",
            zIndex: 0,
          }}
        />

        {/* Modal panel */}
        <div
          className="relative w-[380px] overflow-hidden"
          style={{
            zIndex: 1,
            background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(16.65px)",
            borderRadius: "22px",
            height: "580px",
            marginBottom: "16px",
          }}
        >
          {/* Header with gradient text */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <h2
              className="text-4xl font-semibold tracking-[-1px]"
              style={{
                background: "linear-gradient(98.1deg, #FFFFFF 29.04%, #808080 64.68%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: "34px",
              }}
            >
              Connect<br /> Wallet
            </h2>

            {/* Close button - circular with border */}
            <button
              onClick={onClose}
              className="flex items-center justify-center transition-all duration-200 hover:bg-white/5"
              style={{
                width: "40px",
                height: "40px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "33px",
              }}
            >
              <X size={20} style={{ color: "#9CA3AF" }} />
            </button>
          </div>

          {/* Content */}
          <div className="pb-0 px-6 pt-6">
            {downloadView ? (
              <DownloadView
                name={downloadView.name}
                icon={downloadView.icon}
                downloadUrl={downloadView.downloadUrl}
                deepLinkWallet={downloadView.deepLinkWallet}
                onBack={() => setDownloadView(null)}
              />
            ) : (
              <>
                {isEvmConnected && evmAddress && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 bg-[#1A1B1E] border-l-4 border-l-[#22C55E]">
                    <span className="text-sm text-[#9BA4AE] font-mono">
                      {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
                    </span>
                    <button
                      onClick={() => { evmDisconnect(); onClose(); }}
                      className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      Disconnect
                    </button>
                  </div>
                )}

                {connectError && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <span>{connectError}</span>
                  </div>
                )}
                {/* POPULAR Section */}
                <div className="mb-4">
                  <div className="mb-4">
                    <span
                      className="text-sm font-medium tracking-[-1px] uppercase"
                      style={{ color: "#9CA3AF", lineHeight: "16px" }}
                    >
                      POPULAR
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {popularWallets.map(wallet => {
                      const status = getWalletStatus(wallet);
                      return (
                        <WalletRow
                          key={wallet.id}
                          name={wallet.name}
                          icon={wallet.icon}
                          statusText={status.text}
                          statusColor={status.color}
                          isConnecting={connectingId === wallet.id}
                          onClick={() => handleWalletClick(wallet)}
                          disabled={!!connectingId || isEvmConnected}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* OTHERS Section */}
                <div className="pt-2">
                  <div className="mb-4">
                    <span
                      className="text-sm font-medium tracking-[-1px] uppercase"
                      style={{ color: "#9CA3AF", lineHeight: "16px" }}
                    >
                      OTHERS
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {otherWallets.map(wallet => {
                      const status = getWalletStatus(wallet);
                      return (
                        <WalletRow
                          key={wallet.id}
                          name={wallet.name}
                          icon={wallet.icon}
                          statusText={status.text}
                          statusColor={status.color}
                          isConnecting={connectingId === wallet.id}
                          onClick={() => handleWalletClick(wallet)}
                          disabled={!!connectingId || isEvmConnected}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* New to crypto wallets - outside modal */}
        <div className="flex items-center justify-between px-7 pt-3">
          <span className="text-sm font-normal" style={{ color: "#9CA3AF" }}>
            New to crypto wallets?
          </span>
          <a href="#" className="text-sm font-medium hover:opacity-80"
            style={{
              background: "linear-gradient(90deg, #E2761B 0%, #FFAD68 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Learn More ›
          </a>
        </div>

      </div>
    </div>,
    document.body,
  );
};