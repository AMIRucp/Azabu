import { ExternalLink, ShieldAlert, ShieldCheck, Search } from "lucide-react";
import { TokenLogo } from "./TokenLogo";

interface DiscoveredToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string | null;
  daily_volume: number | null;
  created_at: string | null;
  freeze_authority: string | null;
  mint_authority: string | null;
  known_tags: string[];
}

function formatVolume(v: number | null): string {
  if (!v) return '--';
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
  return '$' + v.toFixed(0);
}

function shortenAddress(addr: string): string {
  return addr.slice(0, 4) + '...' + addr.slice(-4);
}

function SafetyIndicator({ token }: { token: DiscoveredToken }) {
  const hasFreezeAuth = !!token.freeze_authority;
  const hasMintAuth = !!token.mint_authority;
  const hasRisk = hasFreezeAuth || hasMintAuth;

  if (hasRisk) {
    return (
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
        style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
        data-testid={`badge-risk-${token.symbol}`}
      >
        <ShieldAlert className="h-2.5 w-2.5" />
        Risk
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}
      data-testid={`badge-safe-${token.symbol}`}
    >
      <ShieldCheck className="h-2.5 w-2.5" />
      Safe
    </div>
  );
}

interface NewTokensCardProps {
  tokens: DiscoveredToken[];
}

export function NewTokensCard({ tokens }: NewTokensCardProps) {
  return (
    <div
      className="w-full max-w-md rounded-xl overflow-hidden"
      style={{ background: '#111520', border: '1px solid #1B2030', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
      data-testid="new-tokens-card"
    >
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #1B2030' }}>
        <Search className="h-4 w-4" style={{ color: '#D4A574' }} />
        <span className="text-sm font-medium" style={{ color: '#E6EDF3' }}>
          New Token Discovery
        </span>
        <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>
          {tokens.length} tokens
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: '#1B2030' }}>
        {tokens.map((token, index) => (
          <div
            key={token.address}
            className="px-4 py-3 flex items-center gap-3"
            style={{ borderColor: '#1B2030' }}
            data-testid={`row-token-${index}`}
          >
            <TokenLogo src={token.logoURI} symbol={token.symbol} size={32} />

            <div className="flex flex-col flex-1 min-w-0 gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium truncate" style={{ color: '#E6EDF3' }}>
                  {token.symbol}
                </span>
                <SafetyIndicator token={token} />
              </div>
              <span className="text-xs truncate" style={{ color: '#6B7280' }}>
                {token.name}
              </span>
            </div>

            <div className="flex flex-col items-end gap-0.5 shrink-0">
              {token.daily_volume !== null && token.daily_volume > 0 && (
                <span className="text-xs font-mono" style={{ color: '#9BA4AE' }} data-testid={`text-volume-${index}`}>
                  {formatVolume(token.daily_volume)}
                </span>
              )}
              <a
                href={`https://solscan.io/token/${token.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px]"
                style={{ color: '#6B7280' }}
                data-testid={`link-solscan-${index}`}
              >
                {shortenAddress(token.address)}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2" style={{ borderTop: '1px solid #1B2030' }}>
        <span className="text-[10px]" style={{ color: '#6B7280' }}>
          via Jupiter Token API. Always DYOR before trading new tokens.
        </span>
      </div>
    </div>
  );
}
