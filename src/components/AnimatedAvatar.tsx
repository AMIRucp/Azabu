'use client';

import { useState } from 'react';
import { getPfpVariant } from '@/config/pfpVariants';

interface AnimatedAvatarProps {
  avatarId: string;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function AnimatedAvatar({
  avatarId,
  size = 28,
  style,
  className,
}: AnimatedAvatarProps) {
  const variant = getPfpVariant(avatarId);
  const [loadError, setLoadError] = useState(false);

  if (!variant) {
    const hue = [...(avatarId || 'A')].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
    return (
      <div
        className={className}
        style={{
          width: size, height: size, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `hsl(${hue}, 30%, 20%)`,
          fontSize: size * 0.35, fontWeight: 700,
          color: `hsl(${hue}, 50%, 65%)`,
          fontFamily: "'IBM Plex Mono', monospace",
          flexShrink: 0, overflow: 'hidden',
          ...style,
        }}
        data-testid={`avatar-unknown-${avatarId}`}
      >
        {(avatarId || 'A').slice(0, 2).toUpperCase()}
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    ...style,
  };

  if (loadError) {
    const hue = [...variant.id].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          background: `hsl(${hue}, 30%, 20%)`,
          fontSize: size * 0.35,
          fontWeight: 700,
          color: `hsl(${hue}, 50%, 65%)`,
          fontFamily: "'IBM Plex Mono', monospace",
        }}
        data-testid={`avatar-fallback-${avatarId}`}
      >
        {variant.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={containerStyle}
      data-testid={`avatar-${avatarId}`}
    >
      <img
        src={`/pfp/${variant.id}.png`}
        alt={variant.name}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          borderRadius: '50%',
          imageRendering: 'auto',
        }}
        onError={() => setLoadError(true)}
        draggable={false}
      />
    </div>
  );
}
