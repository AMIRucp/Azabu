"use client";

const sans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentTabsProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  testIdPrefix?: string;
  fullWidth?: boolean;
}

/** Dashboard-style segmented control — dark track, #262626 active pill, white label. */
export default function SegmentTabs<T extends string>({
  options,
  value,
  onChange,
  testIdPrefix,
  fullWidth = true,
}: SegmentTabsProps<T>) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: 4,
        padding: 4,
        borderRadius: 12,
        border: "1px solid #1A1A1A",
        background: "#000000",
        width: fullWidth ? "100%" : undefined,
        boxSizing: "border-box",
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={testIdPrefix ? `${testIdPrefix}-${opt.value}` : undefined}
            onClick={() => onChange(opt.value)}
            style={{
              flex: fullWidth ? 1 : undefined,
              padding: fullWidth ? "10px 16px" : "10px 18px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              fontFamily: sans,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              textTransform: "capitalize",
              background: active ? "#262626" : "transparent",
              color: active ? "#FFFFFF" : "#888888",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
