import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";

const SANS = "'IBM Plex Sans', -apple-system, sans-serif";
const MONO = "'IBM Plex Mono', 'IBM Plex Mono', monospace";

interface HelpCategory {
  label: string;
  commands: string[];
}

const CATEGORIES: HelpCategory[] = [
  {
    label: "Trade",
    commands: [
      "swap 2 SOL for USDC",
      "buy 50 dollars of BONK",
      "sell all my WIF",
    ],
  },
  {
    label: "Perpetuals",
    commands: [
      "long 1 SOL at 10x",
      "short 0.5 BTC at 5x",
      "my positions",
    ],
  },
  {
    label: "Orders",
    commands: [
      "buy SOL at $120",
      "stop loss SOL at $80",
      "buy $50 of SOL every day",
    ],
  },
  {
    label: "Send",
    commands: [
      "send 1 SOL to 7UgjR4...",
      "send 50 USDC to Alex",
    ],
  },
  {
    label: "Portfolio",
    commands: [
      "show my holdings",
      "is BONK safe?",
      "price of SOL",
    ],
  },
  {
    label: "Earn",
    commands: [
      "lend 1000 USDC",
      "lend on aave",
      "earn rates",
    ],
  },
  {
    label: "Launch",
    commands: [
      "launch a token called DREAMS",
      "create token VIBES",
    ],
  },
  {
    label: "Markets",
    commands: [
      "how's the market",
      "crypto news",
      "show top markets",
    ],
  },
];

function dispatchPrefill(text: string) {
  window.dispatchEvent(new CustomEvent('afx-prefill-chat', { detail: text }));
}

interface FeatureHelpData {
  title: string;
  explanation: string;
  steps: string[];
  exampleChips: string[];
  relatedChips: string[];
}

export function FeatureHelpCard({ data, onSendMessage }: { data: FeatureHelpData; onSendMessage?: (msg: string) => void }) {
  if (!data) return null;

  const send = (msg: string) => {
    if (onSendMessage) {
      onSendMessage(msg);
    } else {
      dispatchPrefill(msg);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      data-testid="feature-help-card"
      style={{
        background: '#161618',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 20,
        fontFamily: SANS,
        maxWidth: 520,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <BookOpen size={16} style={{ color: '#3B82F6' }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{data.title}</div>
      </div>

      <div style={{ fontSize: 14, color: '#9BA4AE', lineHeight: 1.6, marginBottom: 18 }}>
        {data.explanation}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {data.steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#3B82F6', fontFamily: MONO,
            }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 13, color: '#E6EDF3', lineHeight: 1.5 }}>{step}</div>
          </div>
        ))}
      </div>

      {data.exampleChips.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11, fontFamily: MONO, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: '#6B7280', marginBottom: 8,
          }}>
            Try it
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.exampleChips.map((chip, i) => (
              <button
                key={i}
                data-testid={`help-chip-example-${i}`}
                onClick={() => send(chip)}
                className="help-chip-action"
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid rgba(59,130,246,0.2)',
                  background: 'rgba(59,130,246,0.06)',
                  fontSize: 13, fontFamily: SANS, color: '#3B82F6',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {data.relatedChips.length > 0 && (
        <div>
          <div style={{
            fontSize: 11, fontFamily: MONO, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: '#6B7280', marginBottom: 8,
          }}>
            Related
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.relatedChips.map((chip, i) => (
              <button
                key={i}
                data-testid={`help-chip-related-${i}`}
                onClick={() => send(chip)}
                className="help-chip-action"
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  fontSize: 13, fontFamily: SANS, color: '#9BA4AE',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                {chip} <ChevronRight size={12} />
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .help-chip-action:hover {
          background: rgba(255,255,255,0.04) !important;
          color: #E6EDF3 !important;
        }
      `}</style>
    </motion.div>
  );
}

export function HelpCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-lg rounded-lg overflow-hidden"
      style={{
        background: '#0F1320',
        border: '1px solid #111520',
      }}
      data-testid="card-help"
    >
      <div className="px-4 pt-3 pb-2">
        <p className="text-caption" style={{ color: '#6B7280', letterSpacing: '0.08em' }}>
          REFERENCE
        </p>
      </div>

      <div className="px-4 pb-4 grid grid-cols-2 gap-x-6 gap-y-3.5">
        {CATEGORIES.map((cat) => (
          <div key={cat.label} data-testid={`help-section-${cat.label.toLowerCase()}`}>
            <p
              className="text-xs font-medium mb-1"
              style={{ color: '#9BA4AE' }}
            >
              {cat.label}
            </p>
            <div className="space-y-px">
              {cat.commands.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => dispatchPrefill(cmd)}
                  className="help-cmd block w-full text-left text-[12.5px] py-0.5 truncate"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  data-testid={`button-help-example-${cmd.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2.5" style={{ borderTop: '1px solid #111520' }}>
        <p className="text-[11px]" style={{ color: '#3D3D3A' }}>
          Type anything. Natural language works.
        </p>
      </div>
    </motion.div>
  );
}
