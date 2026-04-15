"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { ARBITRUM_CHAIN_ID, HYPERLIQUID_CHAIN_ID } from "@/config/wagmiConfig";
import { X, Download, ExternalLink, ArrowLeft, ChevronRight } from "lucide-react";

const coinbaseIcon = "https://altcoinsbox.com/wp-content/uploads/2023/01/coinbase-wallet-logo.webp";
const metamaskIcon = "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg";
const walletConnectIcon = "https://avatars.githubusercontent.com/u/37784886?s=200&v=4";
const rabbyIcon = "https://rabby.io/assets/images/logo-128.png";
const trustIcon = "https://trustwallet.com/assets/images/media/assets/TWT.png";
const phantomIcon = "https://phantom.app/img/phantom-logo.png";

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

/** Detect if running inside a mobile wallet's in-app browser */
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

/** Build a deep link to open the dapp inside a wallet's browser */
function buildDeepLink(wallet: string, url: string): string {
  const encoded = encodeURIComponent(url);
  const host = url.replace(/^https?:\/\//, "");
  switch (wallet) {
    case "metamask": return `https://metamask.app.link/dapp/${host}`;
    case "trust":    return `https://link.trustwallet.com/open_url?coin_id=60&url=${encoded}`;
    case "coinbase": return `https://go.cb-w.com/dapp?cb_url=${encoded}`;
    case "phantom":  return `https://phantom.app/ul/browse/${encoded}?ref=${encoded}`;
    default:         return url;
  }
}

type EvmWalletEntry = {
  id: string;
  name: string;
  icon: string;
  detect: () => boolean;
  downloadUrl: string;
  deepLinkWallet?: string;
  connectorMatch: (connectorId: string, connectorName: string) => boolean;
  multiChain?: boolean;
  isWalletConnect?: boolean;
  recommended?: boolean;
};

const EVM_WALLETS: EvmWalletEntry[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: metamaskIcon,
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
    recommended: true,
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: trustIcon,
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
    recommended: true,
  },
  {
    id: "phantom",
    name: "Phantom",
    icon: phantomIcon,
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
    id: "coinbase-evm",
    name: "Coinbase Wallet",
    icon: coinbaseIcon,
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
    id: "rabby",
    name: "Rabby",
    icon: rabbyIcon,
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
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: walletConnectIcon,
    detect: () => true,
    downloadUrl: "",
    connectorMatch: (id) => id.toLowerCase() === "walletconnect",
    isWalletConnect: true,
  },
];

type ChainTab = "arbitrum" | "hyperliquid";

function DownloadView({ name, icon, downloadUrl, deepLinkWallet, onBack }: {
  name: string; icon: string; downloadUrl: string; deepLinkWallet?: string; onBack: () => void;
}) {
  const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const dappUrl = typeof window !== "undefined" ? window.location.href : "";
  const deepLink = deepLinkWallet && isMobile ? buildDeepLink(deepLinkWallet, dappUrl) : null;

  return (
    <div className="flex flex-col items-center text-center px-6 py-2" data-testid="wallet-download-view">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <img src={icon} alt={name} className="w-full h-full object-cover rounded-2xl" />
      </div>
      <h3 className="text-lg font-medium mb-2" style={{ color: "#E6EDF3" }}>Get {name}</h3>
      <p className="text-sm mb-4 max-w-xs leading-relaxed" style={{ color: "#9BA4AE" }}>
        {isMobile ? `Open this app in ${name} to connect.` : `Install the extension to connect with Azabu.`}
      </p>
      {deepLink && (
        <a href={deepLink}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold mb-2 transition-all duration-200"
          style={{ background: "#D4A574", color: "#000", minHeight: 48 }}
          data-testid="link-open-in-wallet">
          Open in {name}
          <ExternalLink size={14} />
        </a>
      )}
      <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all duration-200"
        style={{ background: deepLink ? "rgba(255,255,255,0.06)" : "#FFFFFF", color: deepLink ? "#9BA4AE" : "#030305", minHeight: 48, border: deepLink ? "1px solid rgba(255,255,255,0.08)" : "none" }}
        data-testid="link-download-wallet">
        <Download size={16} />
        {isMobile ? `Download ${name}` : `Install ${name}`}
        <ExternalLink size={14} style={{ opacity: 0.6 }} />
      </a>
      <button onClick={onBack}
        className="mt-4 flex items-center gap-1.5 text-sm transition-colors duration-200"
        style={{ color: "#9BA4AE", minHeight: 44 }}
        data-testid="button-back-wallets">
        <ArrowLeft size={14} />
        Back to wallets
      </button>
    </div>
  );
}

function WalletRow({ name, icon, statusText, statusColor, isConnecting, onClick, disabled, testId, badge, recommended }: {
  name: string; icon: string; statusText: string; statusColor: string; isConnecting: boolean;
  onClick: () => void; disabled: boolean; testId: string; badge?: string; recommended?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-3 w-full px-3.5 rounded-xl transition-all duration-200 group"
      style={{
        background: recommended ? "rgba(212,165,116,0.04)" : "rgba(255,255,255,0.02)",
        border: recommended ? "1px solid rgba(212,165,116,0.18)" : "1px solid rgba(255,255,255,0.04)",
        minHeight: 52,
        WebkitTapHighlightColor: "transparent",
      }}
      data-testid={testId}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)" }}>
        <img src={icon} alt={name} className="w-full h-full object-cover rounded-lg" />
      </div>
      <div className="flex flex-col items-start flex-1 min-w-0">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium" style={{ color: "#E6EDF3" }}>{name}</span>
          {recommended && (
            <span className="text-[9px] px-1.5 py-0.5 rounded"
              style={{ background: "rgba(212,165,116,0.15)", color: "#D4A574" }}>
              Recommended
            </span>
          )}
          {badge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded"
              style={{ background: "rgba(255,255,255,0.06)", color: "#71717A" }}>
              {badge}
            </span>
          )}
        </span>
        <span className="text-[10px]" style={{ color: statusColor }}>{statusText}</span>
      </div>
      <div style={{ color: "#9BA4AE", flexShrink: 0 }}>
        {isConnecting ? (
          <div className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#FFFFFF" }} />
        ) : (
          <ChevronRight size={16} className="opacity-40 group-hover:opacity-80 transition-opacity" />
        )}
      </div>
    </button>
  );
}

export function WalletSelectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isConnected: isEvmConnected, address: evmAddress } = useAccount();
  const { connectAsync, connectors: evmConnectors } = useConnect();
  const { disconnectAsync: evmDisconnect } = useDisconnect();
  const [tab, setTab] = useState<ChainTab>("arbitrum");
  const [downloadView, setDownloadView] = useState<{ name: string; icon: string; url: string; deepLinkWallet?: string } | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Detect mobile wallet browser and auto-prioritise that wallet
  const mobileWalletBrowser = useMemo(() => detectMobileWalletBrowser(), []);

  const sortedWallets = useMemo(() => {
    if (!mobileWalletBrowser) return EVM_WALLETS;
    return [...EVM_WALLETS].sort((a, b) => {
      if (a.deepLinkWallet === mobileWalletBrowser) return -1;
      if (b.deepLinkWallet === mobileWalletBrowser) return 1;
      return 0;
    });
  }, [mobileWalletBrowser]);

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
    if (isEvmConnected && connectingId) { setConnectingId(null); onClose(); }
  }, [isEvmConnected, connectingId, onClose]);

  useEffect(() => {
    if (!open) { setDownloadView(null); setConnectingId(null); setConnectError(null); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleEvmClick = useCallback(async (entry: EvmWalletEntry, targetChainId: number) => {
    if (isEvmConnected) return;
    setConnectError(null);

    const isMobileBrowser = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isDetected = entry.isWalletConnect || entry.detect();

    if (entry.isWalletConnect && !hasWalletConnect) {
      setConnectError("WalletConnect not configured — set NEXT_PUBLIC_WC_PROJECT_ID");
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

    // On mobile browser: wallet not injected → use WalletConnect if available
    // WalletConnect will show a deep link that opens the wallet app for approval only
    if (isMobileBrowser && !isDetected && !entry.isWalletConnect) {
      const wcConnector = evmConnectors.find(c => c.id === "walletConnect");
      if (wcConnector) {
        setConnectingId(entry.id);
        try {
          await connectAsync({ connector: wcConnector, chainId: targetChainId });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("User rejected") && !msg.includes("user rejected")) {
            setConnectError(`Open ${entry.name} and approve the connection request.`);
          }
          setConnectingId(null);
        }
        return;
      }
      // No WalletConnect configured — show download view
      setDownloadView({ name: entry.name, icon: entry.icon, url: entry.downloadUrl, deepLinkWallet: entry.deepLinkWallet });
      return;
    }

    if (!isDetected && !targetConnector) {
      setDownloadView({ name: entry.name, icon: entry.icon, url: entry.downloadUrl, deepLinkWallet: entry.deepLinkWallet });
      return;
    }

    if (!targetConnector) {
      setConnectError(`No connector found for ${entry.name}. Install the extension and refresh.`);
      return;
    }

    setConnectingId(entry.id);
    try {
      await connectAsync({ connector: targetConnector, chainId: targetChainId });
    } catch (err: unknown) {
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

  const getEvmStatus = useCallback((entry: EvmWalletEntry): { text: string; color: string } => {
    if (entry.isWalletConnect) {
      if (!hasWalletConnect) return { text: "Requires WC Project ID — see docs", color: "#EF4444" };
      return { text: "MetaMask · Trust · Phantom · any wallet", color: "#22C55E" };
    }
    if (entry.detect()) return { text: "Available", color: "#22C55E" };
    const connector = findEvmConnector(entry);
    if (connector) return { text: "Available", color: "#22C55E" };
    const eip6963 = evmConnectors.find(c => {
      const rdns = (c as unknown as { info?: { rdns?: string } })?.info?.rdns ?? "";
      const lid = entry.id.toLowerCase();
      return (lid === "metamask" && rdns.includes("metamask")) ||
             (lid === "rabby" && rdns.includes("rabby")) ||
             (lid === "coinbase-evm" && rdns.includes("coinbase")) ||
             (lid === "trust" && rdns.includes("trust")) ||
             (lid === "phantom" && rdns.includes("phantom"));
    });
    if (eip6963) return { text: "Available", color: "#22C55E" };
    // On mobile, show "Connect via WalletConnect" for non-injected wallets
    const isMobileBrowser = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobileBrowser && entry.deepLinkWallet) return { text: "Tap to connect via WalletConnect", color: "#D4A574" };
    return { text: "Not installed", color: "#6B7280" };
  }, [findEvmConnector, hasWalletConnect, evmConnectors]);

  if (!open) return null;

  const chainTabs: { id: ChainTab; label: string; color: string; connected: boolean; logo: string }[] = [
    { id: "arbitrum", label: "Arbitrum", color: "#28A0F0", connected: isEvmConnected, logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png" },
    { id: "hyperliquid", label: "Hyperliquid", color: "#33FF88", connected: isEvmConnected, logo: "/tokens/hyperliquid.webp" },
  ];

  const evmChainId = tab === "hyperliquid" ? HYPERLIQUID_CHAIN_ID : ARBITRUM_CHAIN_ID;
  const evmTabColor = tab === "hyperliquid" ? "#33FF88" : "#28A0F0";
  const evmTabLabel = tab === "hyperliquid" ? "Hyperliquid" : "Arbitrum";

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center"
      style={{ zIndex: 9999 }}
      data-testid="wallet-select-modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
        data-testid="wallet-modal-backdrop"
      />

      {/* Sheet — bottom sheet on mobile, centered modal on desktop */}
      <div
        className="relative w-full sm:max-w-sm sm:mx-4 sm:rounded-2xl rounded-t-2xl overflow-hidden"
        style={{
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          maxHeight: "92vh",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 sm:pt-5">
          <h2 className="text-base font-medium" style={{ color: "#E6EDF3", letterSpacing: "0.01em" }}
            data-testid="text-modal-title">
            {downloadView ? "Install Wallet" : "Connect Wallet"}
          </h2>
          <button onClick={onClose}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ color: "#9BA4AE", minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
            data-testid="button-close-modal">
            <X size={18} />
          </button>
        </div>

        {/* Mobile wallet browser banner */}
        {mobileWalletBrowser && !downloadView && (
          <div className="mx-5 mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
            style={{ background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.2)" }}>
            <span style={{ fontSize: 10, color: "#D4A574" }}>
              Detected: {mobileWalletBrowser.charAt(0).toUpperCase() + mobileWalletBrowser.slice(1)} browser — tap to connect instantly
            </span>
          </div>
        )}

        {/* Chain tabs */}
        {!downloadView && (
          <div className="px-5 pb-2">
            <div className="flex rounded-lg p-0.5" style={{ background: "rgba(255,255,255,0.04)" }}
              data-testid="chain-tab-group">
              {chainTabs.map(ct => (
                <button key={ct.id} onClick={() => setTab(ct.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-[11px] font-medium transition-all duration-200"
                  style={{
                    background: tab === ct.id ? "rgba(255,255,255,0.08)" : "transparent",
                    color: tab === ct.id ? "#E6EDF3" : "#6F7785",
                    minHeight: 40,
                  }}
                  data-testid={`tab-${ct.id}`}>
                  <img src={ct.logo} alt={ct.label} className="w-4 h-4 rounded-full"
                    style={{ opacity: tab === ct.id ? 1 : 0.5 }} />
                  {ct.label}
                  {ct.connected && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: "calc(92vh - 160px)", WebkitOverflowScrolling: "touch" }}>
          {downloadView ? (
            <DownloadView
              name={downloadView.name}
              icon={downloadView.icon}
              downloadUrl={downloadView.url}
              deepLinkWallet={downloadView.deepLinkWallet}
              onBack={() => setDownloadView(null)}
            />
          ) : (
            <>
              {isEvmConnected && evmAddress && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-3"
                  style={{ background: `${evmTabColor}0F`, border: `1px solid ${evmTabColor}26` }}
                  data-testid={`status-${tab}-connected`}>
                  <div className="w-2 h-2 rounded-full" style={{ background: evmTabColor, boxShadow: `0 0 6px ${evmTabColor}60` }} />
                  <span className="text-xs" style={{ color: "#9BA4AE", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
                  </span>
                  <span className="text-[9px] ml-auto" style={{ color: "#22C55E" }}>Connected</span>
                  <button onClick={() => { evmDisconnect(); onClose(); }}
                    className="text-[9px] px-2 py-1 rounded"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)", minHeight: 28 }}
                    data-testid="button-disconnect-evm">
                    Disconnect
                  </button>
                </div>
              )}

              {tab === "hyperliquid" && !isEvmConnected && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
                  style={{ background: "rgba(51,255,136,0.04)", border: "1px solid rgba(51,255,136,0.12)" }}>
                  <span className="text-[10px]" style={{ color: "#9BA4AE" }}>
                    Hyperliquid uses your EVM wallet. Same address as Arbitrum.
                  </span>
                </div>
              )}

              {connectError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                  data-testid="wallet-connect-error">
                  <span className="text-[10px] leading-snug" style={{ color: "#F87171" }}>{connectError}</span>
                </div>
              )}

              <div className="mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: evmTabColor }}>
                  {evmTabLabel} Wallets
                </span>
              </div>
              <div className="flex flex-col gap-1.5" data-testid={`${tab}-wallet-list`}>
                {sortedWallets.map(entry => {
                  const status = getEvmStatus(entry);
                  const isDisabled = !!(!!connectingId || isEvmConnected);
                  return (
                    <WalletRow
                      key={entry.id}
                      name={entry.name}
                      icon={entry.icon}
                      statusText={status.text}
                      statusColor={status.color}
                      isConnecting={connectingId === entry.id}
                      onClick={() => handleEvmClick(entry, evmChainId)}
                      disabled={isDisabled}
                      testId={`button-wallet-${entry.id}`}
                      recommended={entry.recommended}
                      badge={entry.multiChain ? "Multi-chain" : undefined}
                    />
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] text-center" style={{ color: "#6B7280" }}>
              Connect your EVM wallet to access all perpetuals markets
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
