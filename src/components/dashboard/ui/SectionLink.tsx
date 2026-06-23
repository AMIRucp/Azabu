"use client";

import { ChevronRight } from "lucide-react";
import { dashboardTokens } from "../tokens";

const { font, color } = dashboardTokens;

type SectionLinkProps = {
  label: string;
  onClick: () => void;
};

export function SectionLink({ label, onClick }: SectionLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 12,
        color: color.muted,
        fontFamily: font.sans,
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 0,
      }}
    >
      {label} <ChevronRight size={14} />
    </button>
  );
}
