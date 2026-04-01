'use client';

import { useState, useEffect } from 'react';

function TypewriterText({ text, show, style }: { text: string; show: boolean; style?: React.CSSProperties }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!show) { setDisplayed(''); return; }
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(interval);
    }, 35);
    return () => clearInterval(interval);
  }, [show, text]);

  return (
    <span style={style}>
      {displayed}
      <span style={{
        opacity: displayed.length < text.length ? 1 : 0,
        animation: 'afx-blink 0.8s step-end infinite',
      }}>_</span>
    </span>
  );
}

export default function AppLaunchAnimation({ onComplete, fast }: { onComplete: () => void; fast?: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (fast) {
      const timers = [
        setTimeout(() => setPhase(1), 50),
        setTimeout(() => setPhase(2), 150),
        setTimeout(() => { setPhase(5); onComplete(); }, 500),
      ];
      return () => timers.forEach(clearTimeout);
    }

    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1800),
      setTimeout(() => { setPhase(5); onComplete(); }, 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete, fast]);

  return (
    <>
      <style>{`
        @keyframes afx-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes afx-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
      <div
        data-testid="app-launch-animation"
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: '#000', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          transition: fast ? 'opacity 0.2s ease' : 'opacity 0.4s ease',
          opacity: phase >= 5 ? 0 : 1,
          pointerEvents: phase >= 5 ? 'none' : 'all',
        }}
      >
        <div style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: `scale(${phase >= 1 ? 1 : 0.75}) translateY(${phase >= 4 ? -30 : 0}px)`,
          transition: fast ? 'all 0.2s ease' : 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <img src="/azabu-logo.png" alt="Azabu" style={{ width: 64, height: 64 }} />
        </div>

        {!fast && (
          <TypewriterText
            text="One search bar. Every market."
            show={phase >= 3}
            style={{
              marginTop: 20,
              fontSize: 14,
              fontFamily: "'IBM Plex Mono', monospace",
              color: '#6B7280',
              letterSpacing: '0.04em',
              opacity: phase >= 4 ? 0.3 : 1,
              transform: `translateY(${phase >= 4 ? -30 : 0}px)`,
              transition: 'all 0.4s ease',
            }}
          />
        )}
      </div>
    </>
  );
}
