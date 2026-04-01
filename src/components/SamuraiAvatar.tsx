'use client';

import { generateSamuraiTraits, MASK_COLOR_FILTERS, rankToTier, TIER_BORDER_COLORS, TIER_GLOW_COLORS, type TierName } from '@/services/avatarGenerator';

interface SamuraiAvatarProps {
  walletAddress: string;
  size?: number;
  rank?: string;
  className?: string;
  style?: React.CSSProperties;
}

const L = '/avatar/layers';

export default function SamuraiAvatar({
  walletAddress,
  size = 64,
  rank = 'novice',
  className,
  style,
}: SamuraiAvatarProps) {
  if (!walletAddress) return <PlaceholderAvatar size={size} style={style} className={className} />;

  const t = generateSamuraiTraits(walletAddress);
  const tier: TierName = rankToTier(rank);

  const showEyeGlow  = tier !== 'novice';
  const showMarkings = !['novice', 'challenger'].includes(tier);
  const showAccessory = !['novice', 'challenger'].includes(tier);
  const showHorns    = !['novice', 'challenger', 'trader'].includes(tier);
  const showAura     = !['novice', 'challenger', 'trader'].includes(tier);
  const showGoldAccent = ['elite', 'legend'].includes(tier);
  const showAnimation  = tier === 'legend';

  const borderColor = TIER_BORDER_COLORS[tier];
  const glowColor   = TIER_GLOW_COLORS[tier];

  const borderStyle = showAnimation
    ? { borderWidth: 2, borderStyle: 'solid' as const, borderColor: 'transparent', background: `linear-gradient(#0A0C10, #0A0C10) padding-box, linear-gradient(135deg, #FFD700, #D4A574, #FF2244, #FFD700) border-box`, animation: 'samurai-border-spin 3s linear infinite' }
    : tier === 'elite'
    ? { borderWidth: 2, borderStyle: 'solid' as const, borderColor, boxShadow: `0 0 ${size * 0.3}px ${glowColor}` }
    : tier === 'pro'
    ? { borderWidth: 2, borderStyle: 'solid' as const, borderColor, boxShadow: `0 0 ${size * 0.25}px ${glowColor}` }
    : { borderWidth: 1.5, borderStyle: 'solid' as const, borderColor };

  const imgStyle: React.CSSProperties = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
  };

  const eyeGlowFilter = showEyeGlow
    ? (tier === 'legend' || tier === 'elite' ? 'brightness(1.3) drop-shadow(0 0 4px currentColor)' : 'brightness(1.1)')
    : undefined;

  const goldFilter = showGoldAccent
    ? 'sepia(40%) saturate(120%) hue-rotate(5deg) brightness(1.1)'
    : undefined;

  return (
    <div
        className={className}
        data-testid={`samurai-avatar-${walletAddress.slice(0, 8)}`}
        style={{
          position: 'relative', width: size, height: size,
          borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          ...borderStyle,
          ...style,
        }}
      >
        {/* Layer 1: Background */}
        <img src={`${L}/background/bg-${t.background}.svg`} alt="" style={imgStyle} loading="lazy" />

        {/* Layer 9 (behind mask): Aura */}
        {showAura && (
          <img
            src={`${L}/aura/aura-${t.aura}.svg`} alt=""
            style={{ ...imgStyle, animation: showAnimation ? 'samurai-pulse 2.5s ease-in-out infinite' : undefined }}
            loading="lazy"
          />
        )}

        {/* Layer 2+3: Mask shape + color */}
        <img
          src={`${L}/mask/mask-${t.maskShape}.svg`} alt=""
          style={{ ...imgStyle, filter: [MASK_COLOR_FILTERS[t.maskColor], goldFilter].filter(Boolean).join(' ') || undefined }}
          loading="lazy"
        />

        {/* Layer 5: Horns (drawn before eyes so eyes appear on top) */}
        {showHorns && (
          <img src={`${L}/horns/horns-${t.horns}.svg`} alt="" style={imgStyle} loading="lazy" />
        )}

        {/* Layer 4: Eyes */}
        <img
          src={`${L}/eyes/eyes-${t.eyes}.svg`} alt=""
          style={{ ...imgStyle, filter: eyeGlowFilter }}
          loading="lazy"
        />

        {/* Layer 6: Mouth */}
        <img src={`${L}/mouth/mouth-${t.mouth}.svg`} alt="" style={imgStyle} loading="lazy" />

        {/* Layer 7: Markings */}
        {showMarkings && (
          <img src={`${L}/markings/mark-${t.markings}.svg`} alt="" style={imgStyle} loading="lazy" />
        )}

        {/* Layer 8: Accessory */}
        {showAccessory && (
          <img src={`${L}/accessory/acc-${t.accessory}.svg`} alt="" style={imgStyle} loading="lazy" />
        )}
      </div>
  );
}

function PlaceholderAvatar({ size, style, className }: { size: number; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        border: '1.5px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
