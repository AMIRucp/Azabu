"use client";

import { ChevronRight } from "lucide-react";
import { dashboardTokens } from "../tokens";

const { font, color, gradient } = dashboardTokens;

type TradeButtonProps = {
  onClick: () => void;
  iconSize?: number;
};

export function TradeButton({ onClick, iconSize = 12 }: TradeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 80,
        height: 30,
        padding: 0,
        borderRadius: 32,
        border: `1px solid ${color.cardBorder}`,
        background: gradient.tradeBtn,
        color: color.white,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: font.sans,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        boxSizing: "border-box",
        boxShadow: "0px 4px 12px rgba(0,0,0,0.35)",
        flexShrink: 0,
      }}
    >
      Trade <ChevronRight size={iconSize} />
    </button>
  );
}
