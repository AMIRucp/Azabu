"use client";
import { useState } from "react";
import { getIconWithJupiter } from "@/config/tokenIcons";
import { useJupiterLogos } from "@/hooks/useJupiterLogos";

const mono = "'IBM Plex Mono', 'JetBrains Mono', 'SF Mono', monospace";

interface TokenIconProps {
  symbol: string;
  size?: number;
}

export default function TokenIcon({ symbol, size = 32 }: TokenIconProps) {
  const jupiterLogos = useJupiterLogos();
  const icon = getIconWithJupiter(symbol, jupiterLogos);
  const hue = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const [imgFailed, setImgFailed] = useState(false);

  if (icon.type === "img" && !imgFailed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        overflow: "hidden", background: `hsl(${hue},30%,20%)`,
      }}>
        <img
          src={icon.value} alt="" width={size} height={size}
          style={{ borderRadius: "50%", objectFit: "cover", display: "block" }}
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  if (icon.type === "emoji") {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "#1E2329",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.53), lineHeight: 1, flexShrink: 0,
      }}>
        {icon.value}
      </div>
    );
  }

  const label = (icon.type === "letter" && !imgFailed) ? icon.value : symbol.slice(0, 5).toUpperCase();
  const fs = label.length > 3 ? size * 0.28 : label.length > 2 ? size * 0.32 : size * 0.375;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue}, 30%, 20%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(fs), fontFamily: mono, fontWeight: 700,
      color: `hsl(${hue}, 50%, 65%)`, flexShrink: 0, overflow: "hidden",
    }}>
      {label}
    </div>
  );
}
