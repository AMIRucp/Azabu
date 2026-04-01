"use client";
import { useState, useEffect, useRef } from 'react';

interface AnimatedPriceProps {
  value: number;
  decimals?: number;
  style?: React.CSSProperties;
  prefix?: string;
}

export default function AnimatedPrice({ value, decimals = 2, style = {}, prefix = '' }: AnimatedPriceProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setFlash(value > prevRef.current ? 'up' : 'down');
      prevRef.current = value;
      const timeout = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return (
    <span
      data-testid="animated-price"
      style={{
        ...style,
        color: flash === 'up' ? '#0ECB81'
          : flash === 'down' ? '#F6465D'
          : (style.color || '#EAECEF'),
        transition: 'color 0.3s ease',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {prefix}{typeof value === 'number'
        ? value.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : value}
    </span>
  );
}
