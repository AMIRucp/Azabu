"use client";
import React, { useState } from "react";

/**
 * PillButton — the project-standard interactive pill/toggle button.
 *
 * STANDARD: hovering an idle button previews its *selected* look (`hoverAsSelection`,
 * on by default). So an unselected button, on hover, renders exactly as if it were
 * selected. Any new toggle/filter/segment button should use this component (or follow
 * the same rule) so hover === selection stays consistent across the app.
 *
 * `children` may be a render function receiving `selected` so contents (e.g. icon
 * opacity, label color) can react to the hover/active state too.
 */

const sans = "'Inter', -apple-system, sans-serif";

export const PILL_ACCENT_BG =
  "radial-gradient(ellipse 73% 108% at 48% 167%, rgba(255,110,0,0.80) 0%, rgba(255,110,0,0.80) 39%, rgba(26,26,26,0.80) 100%)";
export const PILL_NEUTRAL_BG =
  "radial-gradient(ellipse 71% 49% at 87% 100%, rgba(224,217,217,0.10) 0%, rgba(169,164,164,0.10) 36%, rgba(26,26,26,0.10) 100%)";

export type PillVariant = "accent" | "neutral";

const THEME: Record<PillVariant, {
  selBg: string; selColor: string; selBorder: string;
  idleBg: string; idleColor: string; idleBorder: string;
}> = {
  // primary selection (orange) — used for category/segment selectors
  accent: {
    selBg: PILL_ACCENT_BG, selColor: "#fff", selBorder: "#3E3E3E",
    idleBg: PILL_NEUTRAL_BG, idleColor: "#9CA3AF", idleBorder: "#262626",
  },
  // subtle selection — used for small icon/segment toggles
  neutral: {
    selBg: PILL_NEUTRAL_BG, selColor: "#fff", selBorder: "#262626",
    idleBg: "transparent", idleColor: "rgba(255,255,255,0.45)", idleBorder: "transparent",
  },
};

interface PillButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  active?: boolean;
  variant?: PillVariant;
  /** When true (default), hovering an idle button previews the selected look. */
  hoverAsSelection?: boolean;
  children?: React.ReactNode | ((selected: boolean) => React.ReactNode);
}

export default function PillButton({
  active = false,
  variant = "accent",
  hoverAsSelection = true,
  style,
  children,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: PillButtonProps) {
  const [hover, setHover] = useState(false);
  const selected = active || (hoverAsSelection && hover);
  const t = THEME[variant];

  return (
    <button
      {...rest}
      onMouseEnter={(e) => { setHover(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHover(false); onMouseLeave?.(e); }}
      style={{
        flexShrink: 0, height: 36, padding: "0 18px", borderRadius: 28,
        cursor: "pointer", whiteSpace: "nowrap",
        fontSize: 12.5, fontWeight: 500, fontFamily: sans,
        boxShadow: "0px 3px 4px rgba(0,0,0,0.25)",
        background: selected ? t.selBg : t.idleBg,
        color: selected ? t.selColor : t.idleColor,
        border: `1px solid ${selected ? t.selBorder : t.idleBorder}`,
        transition: "color 0.12s, background 0.12s, border-color 0.12s, filter 0.12s",
        ...style,
      }}
    >
      {typeof children === "function" ? children(selected) : children}
    </button>
  );
}
