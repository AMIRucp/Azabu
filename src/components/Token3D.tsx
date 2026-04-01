'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Token3DProps {
  currentAsset: string;
}

function GlitchCoinFace({ src, style }: { src: string; style?: React.CSSProperties }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [glitching, setGlitching] = useState(false);
  const [glitchFrame, setGlitchFrame] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prevSrc = useRef(src);
  const rafRef = useRef<number>();
  const frameRef = useRef(0);

  const runGlitch = useCallback((oldSrc: string, newSrc: string) => {
    setGlitching(true);
    frameRef.current = 0;

    const totalFrames = 12;
    const frameDuration = 50;
    let frame = 0;

    const tick = () => {
      frame++;
      frameRef.current = frame;
      setGlitchFrame(frame);

      if (frame === 4 || frame === 7) {
        setCurrentSrc(newSrc);
      } else if (frame === 5 || frame === 8) {
        setCurrentSrc(oldSrc);
      } else if (frame >= 9) {
        setCurrentSrc(newSrc);
      }

      if (frame < totalFrames) {
        rafRef.current = window.setTimeout(tick, frameDuration);
      } else {
        setGlitching(false);
        setGlitchFrame(0);
        setCurrentSrc(newSrc);
      }
    };

    rafRef.current = window.setTimeout(tick, frameDuration);
  }, []);

  useEffect(() => {
    if (src !== prevSrc.current) {
      const oldSrc = prevSrc.current;
      prevSrc.current = src;
      setImgLoaded(false);
      runGlitch(oldSrc, src);
    }
    return () => { if (rafRef.current) clearTimeout(rafRef.current); };
  }, [src, runGlitch]);

  const glitchIntensity = glitching ? Math.sin(glitchFrame * 1.8) : 0;
  const flickerOpacity = glitching
    ? (glitchFrame === 3 || glitchFrame === 6 || glitchFrame === 10) ? 0.3 : 1
    : 1;

  const rgbShiftX = glitching ? Math.round(glitchIntensity * 6) : 0;
  const scanlineOffset = glitching ? (glitchFrame * 17) % 100 : 0;
  const skewX = glitching
    ? (glitchFrame === 2 || glitchFrame === 5 || glitchFrame === 9) ? (Math.random() > 0.5 ? 8 : -8) : 0
    : 0;
  const sliceY = glitching && (glitchFrame === 4 || glitchFrame === 7)
    ? 20 + Math.random() * 40
    : 0;

  return (
    <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
      <img
        src={currentSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-contain"
        style={{
          ...style,
          opacity: imgLoaded ? flickerOpacity : 0,
          transform: `skewX(${skewX}deg)`,
          transition: glitching ? 'none' : 'opacity 0.3s ease',
          willChange: 'opacity, transform',
          filter: `${style?.filter || ''} grayscale(100%) brightness(1.1)`.trim(),
        }}
        draggable={false}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgLoaded(false)}
      />

      {glitching && (
        <>
          <img
            src={currentSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              ...style,
              opacity: 0.6,
              transform: `translateX(${rgbShiftX}px) skewX(${skewX}deg)`,
              mixBlendMode: 'screen',
              filter: 'grayscale(100%) brightness(1.5)',
            }}
            draggable={false}
          />
          <img
            src={currentSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              ...style,
              opacity: 0.5,
              transform: `translateX(${-rgbShiftX}px) skewX(${skewX}deg)`,
              mixBlendMode: 'screen',
              filter: 'grayscale(100%) brightness(1.3)',
            }}
            draggable={false}
          />

          {sliceY > 0 && (
            <div
              className="absolute left-0 right-0"
              style={{
                top: `${sliceY}%`,
                height: '12%',
                overflow: 'hidden',
              }}
            >
              <img
                src={currentSrc}
                alt=""
                className="absolute w-full h-full object-contain"
                style={{
                  ...style,
                  top: `-${sliceY}%`,
                  transform: `translateX(${(Math.random() - 0.5) * 20}px)`,
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  filter: 'grayscale(100%)',
                }}
                draggable={false}
              />
            </div>
          )}

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.02) 2px,
                rgba(255,255,255,0.02) 4px
              )`,
              transform: `translateY(${scanlineOffset}px)`,
              mixBlendMode: 'overlay',
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `rgba(255,255,255,${0.03 + Math.abs(glitchIntensity) * 0.06})`,
              mixBlendMode: 'overlay',
            }}
          />
        </>
      )}
    </div>
  );
}

export function Token3D({ currentAsset }: Token3DProps) {
  return (
    <div className="relative w-64 h-64" style={{ perspective: 1000 }}>
      <motion.div
        className="w-full h-full relative"
        animate={{
          rotateY: [0, 360],
          rotateX: [15, -15, 15],
          rotateZ: [-10, 10, -10],
        }}
        transition={{
          rotateY: { duration: 15, repeat: Infinity, ease: 'linear' },
          rotateX: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
          rotateZ: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              transform: `translateZ(${-20 + i}px)`,
              border: '12px solid #6B7280',
              opacity: i === 0 || i === 39 ? 0.9 : 0.15,
              boxShadow: i === 20 ? '0 0 50px rgba(255,255,255,0.15)' : 'none',
            }}
          />
        ))}

        <div
          className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            transform: 'translateZ(-21px) rotateY(180deg)',
            backfaceVisibility: 'hidden',
            background: 'radial-gradient(ellipse at center, #111520 0%, #111115 60%, #0B0F14 100%)',
            border: '2px solid #6B7280',
          }}
        >
          <div className="relative w-3/5 h-3/5">
            <GlitchCoinFace
              src={currentAsset}
              style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.08))', opacity: 0.8 }}
            />
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            transform: 'translateZ(20px)',
            backfaceVisibility: 'hidden',
            background: 'radial-gradient(ellipse at center, #111520 0%, #111115 60%, #0B0F14 100%)',
            border: '2px solid #6B7280',
          }}
        >
          <div
            className="absolute inset-0 z-10 pointer-events-none rounded-full"
            style={{ background: 'linear-gradient(to bottom right, transparent, rgba(255,255,255,0.06), transparent)' }}
          />
          <div className="relative w-3/5 h-3/5">
            <GlitchCoinFace
              src={currentAsset}
              style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))' }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Token3D;
