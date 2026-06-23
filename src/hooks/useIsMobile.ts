"use client";

import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  // Always start `false` so the first client render matches the server-rendered
  // HTML (where `window` is undefined). The real value is set in the effect
  // below right after mount — reading window here would cause a hydration
  // mismatch on mobile viewports.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}
