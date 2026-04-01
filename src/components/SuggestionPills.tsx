import { motion } from "framer-motion";

interface SuggestionPillsProps {
  suggestions: string[];
  onTap: (text: string) => void;
}

export function SuggestionPills({ suggestions, onTap }: SuggestionPillsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap gap-1.5 mt-1"
      data-testid="suggestion-pills"
    >
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onTap(s)}
          className="text-xs px-3 py-1.5 rounded-full transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
          data-testid={`button-suggestion-${s.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`}
        >
          {s}
        </button>
      ))}
    </motion.div>
  );
}
