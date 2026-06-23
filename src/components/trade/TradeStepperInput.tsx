"use client";

const MONO = "'JetBrains Mono', 'SF Mono', monospace";

function InlineStepper({ onStep }: { onStep: (direction: 1 | -1) => void }) {
  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      onClick={() => onStep(dir)}
      style={{
        width: 12,
        height: 9,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        color: "#6B7280",
      }}
    >
      <svg width="7" height="4" viewBox="0 0 10 6" fill="none" style={{ transform: dir === -1 ? "rotate(180deg)" : undefined }}>
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
      {arrow(1)}
      {arrow(-1)}
    </div>
  );
}

export interface TradeStepperInputProps {
  label: string;
  labelColor: string;
  value: string;
  onChange: (value: string) => void;
  unit: string;
  placeholder?: string;
  onStep?: (direction: 1 | -1) => void;
  testId?: string;
}

export default function TradeStepperInput({
  label,
  labelColor,
  value,
  onChange,
  unit,
  placeholder = "0",
  onStep,
  testId,
}: TradeStepperInputProps) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 9,
          color: labelColor,
          fontFamily: MONO,
          marginBottom: 4,
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 8px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid #1E1E1E",
          minWidth: 0,
        }}
      >
        <input
          data-testid={testId}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            width: 0,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 11,
            fontFamily: MONO,
            fontWeight: 500,
            color: value ? "#E5E7EB" : "#4B5563",
          }}
        />
        {onStep && <InlineStepper onStep={onStep} />}
        <span
          style={{
            fontSize: 9,
            color: "#6B7280",
            fontFamily: MONO,
            flexShrink: 0,
            minWidth: unit === "%" ? 10 : 28,
            textAlign: "right",
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}
