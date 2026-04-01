import { getIconWithJupiter } from '@/config/tokenIcons';
import { useJupiterLogos } from '@/hooks/useJupiterLogos';

interface TokenLogoProps {
  mint?: string | null;
  src?: string | null;
  symbol: string;
  size?: number;
}

export function TokenLogo({ src, symbol, size = 32 }: TokenLogoProps) {
  const jupiterLogos = useJupiterLogos();
  const icon = getIconWithJupiter(symbol, jupiterLogos);
  const hue = [...symbol].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;

  if (src && !src.startsWith('emoji:')) {
    return (
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        className="rounded-full shrink-0"
        style={{ objectFit: "cover" }}
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          const div = document.createElement('div');
          const label = symbol.slice(0, 5).toUpperCase();
          const fs = label.length > 3 ? size * 0.28 : label.length > 2 ? size * 0.32 : size * 0.38;
          div.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:hsl(${hue},30%,20%);display:flex;align-items:center;justify-content:center;font-size:${fs}px;font-weight:700;color:hsl(${hue},50%,65%);font-family:monospace`;
          div.textContent = label;
          el.replaceWith(div);
        }}
      />
    );
  }

  if (icon.type === 'img') {
    return (
      <img
        src={icon.value}
        alt={symbol}
        width={size}
        height={size}
        className="rounded-full shrink-0"
        style={{ objectFit: "cover" }}
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          const div = document.createElement('div');
          const label = symbol.slice(0, 5).toUpperCase();
          const fs = label.length > 3 ? size * 0.28 : label.length > 2 ? size * 0.32 : size * 0.38;
          div.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:hsl(${hue},30%,20%);display:flex;align-items:center;justify-content:center;font-size:${fs}px;font-weight:700;color:hsl(${hue},50%,65%);font-family:monospace`;
          div.textContent = label;
          el.replaceWith(div);
        }}
      />
    );
  }

  if (icon.type === 'emoji') {
    return (
      <div
        className="rounded-full flex items-center justify-center shrink-0"
        style={{
          width: size,
          height: size,
          background: '#1E2329',
          fontSize: size * 0.55,
          lineHeight: 1,
        }}
      >
        {icon.value}
      </div>
    );
  }

  const label = icon.type === "letter" ? icon.value : symbol.slice(0, 5).toUpperCase();
  const fs = label.length > 3 ? size * 0.28 : label.length > 2 ? size * 0.32 : size * 0.38;
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue}, 30%, 20%)`,
        fontSize: fs,
        fontWeight: 700,
        color: `hsl(${hue}, 50%, 65%)`,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {label}
    </div>
  );
}

interface TokenPairProps {
  fromMint?: string | null;
  toMint?: string | null;
  fromSrc?: string | null;
  toSrc?: string | null;
  fromSymbol: string;
  toSymbol: string;
  size?: number;
}

export function TokenPair({
  fromMint, toMint, fromSrc, toSrc,
  fromSymbol, toSymbol, size = 32,
}: TokenPairProps) {
  return (
    <div className="flex items-center" style={{ width: size * 1.6, height: size }} data-testid="token-pair-logos">
      <TokenLogo mint={fromMint} src={fromSrc} symbol={fromSymbol} size={size} />
      <div style={{ marginLeft: -size * 0.3, zIndex: 1 }}>
        <TokenLogo mint={toMint} src={toSrc} symbol={toSymbol} size={size} />
      </div>
    </div>
  );
}
