"use client";
import { ReactNode } from 'react';

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div style={{ animation: 'pageEnter 0.25s ease both' }}>
      {children}
    </div>
  );
}

export function FadeIn({ children, delay = 0, duration = 0.25 }: { children: ReactNode; delay?: number; duration?: number }) {
  return (
    <div style={{ animation: `fadeIn ${duration}s ease ${delay}s both` }}>
      {children}
    </div>
  );
}

export function SlideIn({ children, from = 'bottom', delay = 0 }: { children: ReactNode; from?: 'bottom' | 'top' | 'left' | 'right'; delay?: number }) {
  const transforms: Record<string, string> = {
    bottom: 'translateY(8px)',
    top: 'translateY(-8px)',
    left: 'translateX(-8px)',
    right: 'translateX(8px)',
  };
  return (
    <div style={{
      animation: `slideInFrom 0.25s ease ${delay}s both`,
      ['--slide-from' as any]: transforms[from],
    }}>
      {children}
    </div>
  );
}

export function StaggerChildren({ children, stagger = 0.05 }: { children: ReactNode[]; stagger?: number }) {
  return (
    <>
      {children.map((child, i) => (
        <div key={i} style={{ animation: `fadeIn 0.2s ease ${i * stagger}s both` }}>
          {child}
        </div>
      ))}
    </>
  );
}
