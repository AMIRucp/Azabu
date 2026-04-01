interface RwaSearchResult {
  mint: string;
  symbol: string;
  name: string;
  category: string;
  underlyingTicker?: string;
  underlyingName?: string;
  issuer: string;
  jupiterVerified: boolean;
}

interface RwaSearchCardProps {
  data: {
    type: 'search';
    query: string;
    results: RwaSearchResult[];
  };
  onSendMessage?: (msg: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  equities: 'Stock',
  etfs: 'ETF',
  preipo: 'Pre-IPO',
  treasuries: 'Treasury',
  commodities: 'Commodity',
  wrapped: 'Wrapped',
};

export function RwaSearchCard({ data, onSendMessage }: RwaSearchCardProps) {
  return (
    <div
      className="rounded-xl overflow-hidden w-full"
      style={{ background: '#0F1320', border: '1px solid #1B2030' }}
      data-testid="card-rwa-search"
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #1B2030' }}>
        <span className="text-sm font-medium" style={{ color: '#E6EDF3' }}>
          {data.results.length} result{data.results.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: '#111520' }}>
        {data.results.map(token => (
          <div
            key={token.mint}
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottomColor: '#111520' }}
          >
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: '#E6EDF3' }}>
                  {token.symbol}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: '#111520', color: '#6B7280' }}
                >
                  {CATEGORY_LABELS[token.category] || token.category}
                </span>
              </div>
              <span className="text-xs truncate" style={{ color: '#6B7280' }}>
                {token.underlyingName || token.name}
              </span>
            </div>
            <button
              onClick={() => onSendMessage?.(`buy ${token.symbol}`)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0 ml-3"
              style={{ background: '#FFFFFF', color: '#0B0F14' }}
              data-testid={`button-rwa-buy-${token.symbol}`}
            >
              Buy
            </button>
          </div>
        ))}
      </div>

      {data.results.length === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-xs" style={{ color: '#6B7280' }}>
            No RWAs found. Try a ticker (AAPLx), company (Apple), or category (stocks).
          </p>
        </div>
      )}
    </div>
  );
}
