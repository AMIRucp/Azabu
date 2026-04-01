export function fmtPrice(p: number): string {
  if (p === 0) return "--";
  if (p >= 10000) return p.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (p >= 100) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}

export function fmtCompact(v: number): string {
  if (!v || v === 0) return "--";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function fmtChange(c: number): string {
  if (c === 0) return "0.00%";
  return `${c >= 0 ? "+" : ""}${c.toFixed(2)}%`;
}

export function fmtFunding(r: number | undefined): string {
  if (r === undefined || r === 0) return "--";
  return `${r >= 0 ? "+" : ""}${r.toFixed(4)}%`;
}
