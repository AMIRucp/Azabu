import { useState } from "react";

interface RwaTokenItem {
  mint: string;
  symbol: string;
  name: string;
  underlyingTicker?: string;
  underlyingName?: string;
  issuer: string;
  jupiterVerified: boolean;
}

interface RwaBrowserCardProps {
  data: {
    type: 'browse';
    groups: Record<string, RwaTokenItem[]>;
    totalCount: number;
  };
  onSendMessage?: (msg: string) => void;
}

type TabKey = 'equities' | 'etfs' | 'treasuries' | 'commodities' | 'preipo' | 'wrapped';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'equities', label: 'Stocks' },
  { key: 'etfs', label: 'ETFs' },
  { key: 'preipo', label: 'Pre-IPO' },
  { key: 'treasuries', label: 'Treasuries' },
  { key: 'commodities', label: 'Commodities' },
  { key: 'wrapped', label: 'Wrapped' },
];

export function RwaBrowserCard({ data, onSendMessage }: RwaBrowserCardProps) {
  const availableTabs = TABS.filter(t => data.groups[t.key]?.length > 0);
  const [activeTab, setActiveTab] = useState<TabKey>(availableTabs[0]?.key || 'equities');
  const tokens = data.groups[activeTab] || [];

  return (
    <div
      className="rounded-xl overflow-hidden w-full"
      style={{ background: '#0F1320', border: '1px solid #1B2030' }}
      data-testid="card-rwa-browser"
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #1B2030' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: '#E6EDF3' }}>
            Tokenized Real World Assets
          </span>
          <span className="text-xs" style={{ color: '#6B7280' }}>
            {data.totalCount} tokens
          </span>
        </div>
      </div>

      <div className="flex gap-1 px-3 py-2 overflow-x-auto" style={{ borderBottom: '1px solid #1B2030' }}>
        {availableTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors"
            style={activeTab === tab.key
              ? { background: '#FFFFFF', color: '#0B0F14' }
              : { background: '#111520', color: '#9BA4AE' }
            }
            data-testid={`button-rwa-tab-${tab.key}`}
          >
            {tab.label}
            {data.groups[tab.key] && (
              <span className="ml-1 opacity-60">{data.groups[tab.key].length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-3">
        <div className="flex flex-wrap gap-2">
          {tokens.map(token => (
            <button
              key={token.mint}
              onClick={() => onSendMessage?.(`buy ${token.symbol}`)}
              className="flex flex-col items-start px-3 py-2 rounded-lg transition-colors"
              style={{ background: '#111520', border: '1px solid #1B2030' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#6B7280';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#1B2030';
              }}
              data-testid={`button-rwa-chip-${token.symbol}`}
            >
              <span className="text-xs font-semibold" style={{ color: '#E6EDF3' }}>
                {token.symbol}
              </span>
              <span className="text-[10px] leading-tight" style={{ color: '#6B7280' }}>
                {token.underlyingName || token.name}
              </span>
            </button>
          ))}
        </div>

        {tokens.length === 0 && (
          <p className="text-xs py-4 text-center" style={{ color: '#6B7280' }}>
            No tokens in this category.
          </p>
        )}
      </div>

      <div className="px-4 py-2" style={{ borderTop: '1px solid #1B2030' }}>
        <p className="text-[10px]" style={{ color: '#6B7280' }}>
          Tokenized assets are SPL tokens, not direct ownership. Not SIPC insured. Trade at your own risk.
        </p>
      </div>
    </div>
  );
}
