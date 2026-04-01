import { BookOpen, Cog, TrendingUp, AlertTriangle, Layers, ExternalLink, Eye, BarChart2, Shield } from "lucide-react";

interface KnowledgeSection {
  type: "definition" | "mechanic" | "implication" | "risk" | "context" | "summary" | "detail" | "outlook";
  headline: string;
  body: string;
}

interface KnowledgeData {
  sections: KnowledgeSection[];
  sources?: Array<{ name: string; domain: string }>;
  entities?: string[];
  tradeRationale?: string | null;
  followups?: string[];
}

interface KnowledgeCardProps {
  data: KnowledgeData;
  onSendMessage?: (msg: string) => void;
}

const SECTION_ICONS: Record<string, typeof BookOpen> = {
  definition: BookOpen,
  mechanic: Cog,
  implication: TrendingUp,
  risk: AlertTriangle,
  context: Layers,
  summary: Eye,
  detail: BarChart2,
  outlook: Shield,
};

const SECTION_LABELS: Record<string, string> = {
  definition: "Definition",
  mechanic: "Mechanism",
  implication: "Why It Matters",
  risk: "Risk",
  context: "Related",
  summary: "Overview",
  detail: "Key Data",
  outlook: "Watch For",
};

const SECTION_ACCENTS: Record<string, string> = {
  summary: "#3B82F6",
  detail: "#9BA4AE",
  risk: "#EF4444",
  outlook: "#22C55E",
  definition: "#9BA4AE",
  mechanic: "#3B82F6",
  implication: "#22C55E",
  context: "#6B7280",
};

function rgb(hex: string): string {
  return (hex.slice(1).match(/../g) || []).map(x => parseInt(x, 16)).join(",");
}

export function KnowledgeCard({ data, onSendMessage }: KnowledgeCardProps) {
  if (!data?.sections?.length) return null;

  const useSectionedLayout = data.sections.some(s =>
    ["summary", "detail", "outlook"].includes(s.type)
  );

  return (
    <div
      className="w-full max-w-lg rounded-xl overflow-hidden"
      style={{ background: '#111520', border: '1px solid #1B2030' }}
      data-testid="knowledge-card"
    >
      <div className="space-y-0">
        {data.sections.map((section, i) => {
          const Icon = SECTION_ICONS[section.type] || BookOpen;
          const label = SECTION_LABELS[section.type] || section.type;
          const accent = SECTION_ACCENTS[section.type] || '#3B82F6';

          if (useSectionedLayout) {
            return (
              <div
                key={i}
                style={{
                  padding: "11px 14px",
                  borderBottom: i < data.sections.length - 1 ? '1px solid #1B2030' : 'none',
                  borderLeft: `3px solid rgba(${rgb(accent)},0.3)`,
                  background: "rgba(255,255,255,0.018)",
                }}
                data-testid={`knowledge-section-${section.type}`}
              >
                <div style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.13em",
                  color: accent, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 5,
                  textTransform: "uppercase",
                }}>
                  {label}
                </div>
                <p className="text-sm font-medium leading-snug mb-1" style={{ color: '#E6EDF3' }}>
                  {section.headline}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#9BA4AE', lineHeight: 1.75 }}>
                  {section.body}
                </p>
              </div>
            );
          }

          return (
            <div
              key={i}
              className="px-4 py-3"
              style={{ borderBottom: i < data.sections.length - 1 ? '1px solid #1B2030' : 'none' }}
              data-testid={`knowledge-section-${section.type}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#9BA4AE' }}>
                  {label}
                </span>
              </div>
              <p className="text-sm font-medium leading-snug mb-1" style={{ color: '#E6EDF3' }}>
                {section.headline}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#9BA4AE' }}>
                {section.body}
              </p>
            </div>
          );
        })}
      </div>

      {data.tradeRationale && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid #1B2030', background: 'rgba(59, 130, 246, 0.04)' }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" style={{ color: '#9BA4AE' }} />
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#9BA4AE' }}>
              Trade Angle
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#E6EDF3' }}>
            {data.tradeRationale}
          </p>
        </div>
      )}

      {data.sources && data.sources.length > 0 && (
        <div className="px-4 py-2.5 flex flex-wrap gap-2" style={{ borderTop: '1px solid #1B2030' }}>
          {data.sources.map((src, i) => {
            const colors = ["#818CF8", "#F472B6", "#22C55E", "#9BA4AE", "#3B82F6"];
            const c = colors[i % colors.length];
            return (
              <a
                key={i}
                href={`https://${src.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#6B7280',
                  textDecoration: 'none',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
                data-testid={`knowledge-source-${i}`}
              >
                <span style={{
                  width: 14, height: 14, borderRadius: 3, background: c,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 800, color: "#000",
                }}>
                  {i + 1}
                </span>
                {src.name || src.domain}
              </a>
            );
          })}
        </div>
      )}

      {data.followups && data.followups.length > 0 && (
        <div className="px-4 py-3 space-y-1.5" style={{ borderTop: '1px solid #1B2030' }}>
          <div style={{
            fontSize: 9, color: "#6B7280", fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6,
          }}>
            Keep exploring
          </div>
          {data.followups.map((q, i) => (
            <button
              key={i}
              onClick={() => onSendMessage?.(q)}
              className="flex items-center gap-2 w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
              style={{
                background: 'rgba(255,255,255,0.02)',
                color: '#6B7280',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
              data-testid={`knowledge-followup-${i}`}
            >
              <span style={{ color: "#3B82F6", fontSize: 10, flexShrink: 0 }}>-&gt;</span>
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
