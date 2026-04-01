'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';

export default function VideoAdBanner() {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('afx-ad-dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('afx-ad-dismissed', '1');
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  };

  const handleClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  if (!visible) return null;

  return (
    <div
      data-testid="video-ad-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        animation: 'adFadeIn 0.3s ease both',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 720,
          margin: '0 16px',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
          animation: 'adSlideUp 0.35s ease both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src="/afx-ad.mp4"
          autoPlay
          loop
          muted={muted}
          playsInline
          onClick={handleClick}
          data-testid="video-ad-player"
          style={{
            width: '100%',
            display: 'block',
            cursor: 'pointer',
          }}
        />

        <button
          data-testid="button-close-ad"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#9BA4AE',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9BA4AE';
            e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
          }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>

        <button
          data-testid="button-toggle-volume"
          onClick={toggleMute}
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: muted ? '#9BA4AE' : '#D4A574',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
          }}
        >
          {muted
            ? <VolumeX style={{ width: 16, height: 16 }} />
            : <Volume2 style={{ width: 16, height: 16 }} />
          }
        </button>
      </div>

      <style>{`
        @keyframes adFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes adSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
