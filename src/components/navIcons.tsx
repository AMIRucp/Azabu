const ACCENT_LIGHT = "#E8C4A0";
const INACTIVE = "#9CA3AF";

function c(active: boolean) { return active ? ACCENT_LIGHT : INACTIVE; }

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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c(active)} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2m0 16v2M4.22 4.22l1.41 1.41m10.74 10.74l1.41 1.41M1 12h2m16 0h2M4.22 19.78l1.41-1.41m10.74-10.74l1.41-1.41" />
    </svg>
  );
}

export function PredictionsIcon({ active, size = 22, disabled }: { active: boolean; size?: number; disabled?: boolean }) {
  const stroke = disabled ? "rgba(156,163,175,0.45)" : c(active);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20C17.5228 20 22 16.4183 22 12C22 7.58172 17.5228 4 12 4C6.47715 4 2 7.58172 2 12C2 13.933 2.59787 15.723 3.6 17.2L2 22L6.8 20.4C8.277 21.402 10.067 22 12 22Z" />
      <path d="M8 12H16" />
    </svg>
  );
}

export function LanguageIcon({ active, size = 22 }: { active: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c(active)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12H21" />
      <path d="M12 3C14.5 6.5 15.8 9.2 16 12C15.8 14.8 14.5 17.5 12 21C9.5 17.5 8.2 14.8 8 12C8.2 9.2 9.5 6.5 12 3Z" />
    </svg>
  );
}

export function DocsIcon({ active, size = 22 }: { active: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c(active)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4H17L20 7V20H7V4Z" />
      <path d="M17 4V7H20" />
      <path d="M10 11H16M10 15H16" />
    </svg>
  );
}
