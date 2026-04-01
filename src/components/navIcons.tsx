const ACCENT_LIGHT = "#E8C4A0";
const INACTIVE = "rgba(255,255,255,0.30)";

function c(active: boolean) { return active ? ACCENT_LIGHT : INACTIVE; }

export function HomeIcon({ active, size = 22 }: { active: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c(active)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3L21 10.5" />
      <path d="M5 9.5V19.5A1 1 0 006 20.5H9.5V15A1 1 0 0110.5 14H13.5A1 1 0 0114.5 15V20.5H18A1 1 0 0019 19.5V9.5" />
    </svg>
  );
}

export function MarketsIcon({ active, size = 22 }: { active: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c(active)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="14" width="4" height="7" rx="0.5" />
      <rect x="10" y="9" width="4" height="12" rx="0.5" />
      <rect x="17" y="4" width="4" height="17" rx="0.5" />
    </svg>
  );
}

export function TradeIcon({ active, size = 22 }: { active: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "rgba(255,255,255,0.55)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18L10 8" />
      <path d="M7.5 8L10 8L10 10.5" />
      <path d="M14 6L21 16" />
      <path d="M18.5 16L21 16L21 13.5" />
    </svg>
  );
}

export function SwapIcon({ active, size = 22 }: { active: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c(active)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9C7 5.5 17 5.5 20.5 9" />
      <path d="M17.5 7L20.5 9L18.5 11.5" />
      <path d="M20 15.5C17 19 7 19 3.5 15.5" />
      <path d="M6.5 17.5L3.5 15.5L5.5 13" />
    </svg>
  );
}

export function PortfolioIcon({ active, size = 22 }: { active: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c(active)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3V12L17.5 17.5" />
    </svg>
  );
}

export function LeaderboardIcon({ active, size = 22 }: { active: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c(active)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="13" width="5" height="8" rx="0.5" />
      <rect x="9.5" y="4" width="5" height="17" rx="0.5" />
      <rect x="16" y="9" width="5" height="12" rx="0.5" />
      <path d="M12 2L13 3.5H11L12 2Z" fill={c(active)} stroke="none" />
    </svg>
  );
}

export function SettingsIcon({ active, size = 22 }: { active: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c(active)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L14.3 9.7L22 12L14.3 14.3L12 22L9.7 14.3L2 12L9.7 9.7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
