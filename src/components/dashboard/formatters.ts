export function fmtUsd(n: number, opts?: { signed?: boolean; compact?: boolean }) {
  const sign = opts?.signed && n > 0 ? "+" : opts?.signed && n < 0 ? "" : "";
  const abs = Math.abs(n);
  const str = abs.toLocaleString("en-US", {
    minimumFractionDigits: opts?.compact ? 0 : 2,
    maximumFractionDigits: opts?.compact ? 0 : 2,
  });
  return `${sign}$${str}`;
}

export function fmtPct(n: number, signed = true) {
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtVol(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtPrice(n: number) {
  if (n >= 100) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 4 });
}

export function navigateApp(page: string, extra?: Record<string, string>) {
  window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page, ...extra } }));
}

export function navigateMarket(symbol: string) {
  const market = symbol.includes("PERP") || symbol.includes("USDT") ? symbol : `${symbol}-PERP`;
  navigateApp("trade", { market });
}

export function fmtLeaderboardXp(xp: number) {
  if (xp >= 1000) return `${Math.round(xp / 1000)}k`;
  return xp.toLocaleString();
}

export function callsignInitials(name: string) {
  const parts = name.replace(/[^a-zA-Z0-9]/g, " ").trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
