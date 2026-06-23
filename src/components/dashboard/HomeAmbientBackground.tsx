"use client";

import { dashboardTokens } from "./tokens";

const { gradient } = dashboardTokens;

export function HomeAmbientBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          bottom: 1,
          right: 12,
          width: 600,
          height: 90,
          borderRadius: 9999,
          background: gradient.ambientGlow,
          opacity: 0.45,
          filter: "blur(48px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: -280,
          top: 280,
          width: 400,
          height: 300,
          borderRadius: 9999,
          transform: "rotate(-22deg)",
          background: gradient.ambientGlowSoft,
          filter: "blur(72px)",
        }}
      />
    </div>
  );
}
