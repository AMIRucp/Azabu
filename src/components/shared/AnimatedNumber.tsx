"use client";
import { useState, useEffect, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function AnimatedNumber({
  value,
  duration = 600,
  prefix = "",
  suffix = "",
  decimals = 2,
  style,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number>(0);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = value;
    if (from === value) return;

    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span
      style={{ fontVariantNumeric: "tabular-nums", ...style }}
      className={className}
    >
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
