"use client";

interface FavoriteStarProps {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
  activeColor?: string;
  inactiveColor?: string;
  testId?: string;
}

export default function FavoriteStar({
  active,
  onClick,
  size = "md",
  activeColor = "#f59e0b",
  inactiveColor = "#44445a",
  testId,
}: FavoriteStarProps) {
  const px = size === "sm" ? 13 : 14;
  const w = size === "sm" ? 16 : 18;

  return (
    <button
      data-testid={testId}
      onClick={onClick}
      style={{
        background: "none", border: "none", cursor: "pointer", padding: 0,
        color: active ? activeColor : inactiveColor,
        fontSize: px, lineHeight: 1,
        flexShrink: 0, width: w, display: "flex", alignItems: "center",
      }}
    >
      {active ? "\u2605" : "\u2606"}
    </button>
  );
}
