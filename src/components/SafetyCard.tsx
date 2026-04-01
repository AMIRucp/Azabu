import { Shield, ShieldAlert, Check, X, AlertTriangle, Users } from "lucide-react";
import { ActionGraphic } from './ActionGraphic';
import { TokenLogo } from './TokenLogo';

interface SafetyCardProps {
  data: any;
}

export function SafetyCard({ data }: SafetyCardProps) {
  const isSafe = data?.isSafe;
  const risks = data?.risks || [];
  const tokenInfo = data?.tokenInfo;
  const score = data?.score ?? null;
  const topHolders = data?.topHolders || [];
  const topConcentration = data?.topHolderConcentration;

  const riskLevel = score !== null
    ? (score >= 80 ? 'low' : score >= 50 ? 'medium' : score >= 25 ? 'high' : 'critical')
    : (isSafe ? 'low' : risks.length > 2 ? 'critical' : risks.length > 1 ? 'high' : 'medium');

  const riskColors: Record<string, string> = {
    low: '#22C55E',
    medium: '#9BA4AE',
    high: '#EF4444',
    critical: '#EF4444',
  };
  const topColor = riskColors[riskLevel];

  return (
    <div
      className="w-full max-w-sm rounded-xl overflow-hidden"
      style={{ background: '#111520', border: '1px solid #1B2030', borderTop: `3px solid ${topColor}`, boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
      data-testid="safety-card"
    >
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: '#1C1C1F' }}>
        {isSafe
          ? <Shield className="h-4 w-4" style={{ color: topColor }} />
          : <ShieldAlert className="h-4 w-4" style={{ color: topColor }} />
        }
        <span className="text-title3">Token safety analysis</span>
        {tokenInfo?.symbol && <span className="text-footnote ml-1">-- {tokenInfo.symbol}</span>}
      </div>

      <div className="p-5 space-y-3">
        <ActionGraphic action="safety" />
        {tokenInfo && (
          <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: '#1C1C1F' }}>
            <TokenLogo src={tokenInfo.logoURI || null} symbol={tokenInfo.symbol || "?"} size={32} />
            <div className="flex flex-col flex-1">
              <span className="text-body-emphasis">{tokenInfo.name}</span>
              <span className="text-footnote">{tokenInfo.symbol}</span>
            </div>
            {score !== null && (
              <div className="flex flex-col items-center">
                <span className="text-lg font-semibold" style={{ color: topColor }}>{score}</span>
                <span className="text-footnote" style={{ color: '#6B7280' }}>/100</span>
              </div>
            )}
          </div>
        )}

        {score !== null && !tokenInfo && (
          <div className="flex items-center justify-between py-1 pb-3 border-b" style={{ borderColor: '#1C1C1F' }}>
            <span className="text-callout">Safety score</span>
            <span className="text-body-emphasis" style={{ color: topColor }}>{score}/100</span>
          </div>
        )}

        <div className="flex items-center justify-between py-1">
          <span className="text-callout">Mint authority disabled</span>
          {data?.mintAuthDisabled ? (
            <Check className="h-4 w-4" style={{ color: '#22C55E' }} data-testid="mint-auth-check" />
          ) : (
            <X className="h-4 w-4" style={{ color: '#EF4444' }} data-testid="mint-auth-x" />
          )}
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-callout">Freeze authority disabled</span>
          {data?.freezeAuthDisabled ? (
            <Check className="h-4 w-4" style={{ color: '#22C55E' }} data-testid="freeze-auth-check" />
          ) : (
            <X className="h-4 w-4" style={{ color: '#EF4444' }} data-testid="freeze-auth-x" />
          )}
        </div>

        {data?.isToken2022 && (
          <div className="flex items-center justify-between py-1">
            <span className="text-callout">Token-2022 program</span>
            <AlertTriangle className="h-4 w-4" style={{ color: '#9BA4AE' }} />
          </div>
        )}

        <div className="flex items-center justify-between py-1">
          <span className="text-callout">LP burned</span>
          {data?.lpBurned ? (
            <Check className="h-4 w-4" style={{ color: '#22C55E' }} />
          ) : (
            <X className="h-4 w-4" style={{ color: '#EF4444' }} />
          )}
        </div>

        {topConcentration !== null && topConcentration !== undefined && (
          <div className="pt-2 border-t" style={{ borderColor: '#1C1C1F' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="h-3.5 w-3.5" style={{ color: '#9BA4AE' }} />
              <span className="text-subhead">Top holder concentration</span>
            </div>
            <div className="w-full rounded-full h-2" style={{ background: '#1C1C1F' }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(topConcentration, 100)}%`,
                  background: topConcentration > 50 ? '#EF4444' : topConcentration > 20 ? '#9BA4AE' : '#22C55E',
                }}
              />
            </div>
            <span className="text-footnote mt-1 block" style={{ color: '#9BA4AE' }}>
              Top holder: {topConcentration.toFixed(1)}% of supply
            </span>
          </div>
        )}

        {risks.length > 0 && (
          <div className="mt-2 pt-3 border-t" style={{ borderColor: '#1C1C1F' }}>
            <span className="text-subhead block mb-2" style={{ color: '#EF4444' }}>Identified risks:</span>
            <ul className="space-y-1">
              {risks.map((risk: string, i: number) => (
                <li key={i} className="text-footnote flex items-start gap-1.5">
                  <span style={{ color: '#EF4444' }}>-</span> {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isSafe && risks.length === 0 && (
          <div className="mt-2 p-3 rounded-lg text-footnote text-center" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
            No risks detected. Token appears safe.
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <span className="text-[10px] italic" style={{ color: '#6B7280' }}>Source: On-chain analysis via Helius RPC</span>
      </div>
    </div>
  );
}
