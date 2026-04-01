'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Token3D } from './Token3D';
import { WalletSelectModal } from './WalletSelectModal';
import { TelegramLoginButton, type TelegramAuthData } from './TelegramLoginButton';

const SLIDES: { image: string; action: string; tag?: string }[] = [
  { image: '/assets/perps-coin.png', action: 'SEARCH CRYPTO' },
  { image: '/assets/coca-bitcoin-coin.png', action: 'SWAP TOKENS' },
  { image: '/assets/tesla-coin.webp', action: 'BUY STOCKS' },
  { image: '/assets/perps-coin.png', action: 'PLACE PREDICTIONS' },
  { image: '/assets/perps-coin.png', action: 'TRADE FUTURES', tag: '300x LEVERAGED' },
  { image: '/assets/trump-memecoin.png', action: 'TRADE LEVERAGED MEMECOINS', tag: 'UP TO 75x' },
  { image: '/assets/trx-glass-coin.png', action: 'TRADE TRX', tag: '20x LEVERAGE' },
  { image: '/assets/oil-commodity.png', action: 'TRADE COMMODITIES' },
  { image: '/assets/rwa-100x-coin.png', action: 'TRADE LEVERAGED REAL WORLD ASSETS', tag: 'UP TO 300x' },
  { image: '/assets/usdt-coin.png', action: 'TRADE STABLECOINS' },
  { image: '/assets/pumpfun-coin.png', action: 'LAUNCH TOKENS' },
  { image: '/assets/avax-usdc-lend.png', action: 'EARN YIELD' },
  { image: '/assets/send-crypto-coin.png', action: 'SWAP TOKENS' },
  { image: '/assets/send-crypto-coin.png', action: 'SEND CRYPTO' },
];

const MATRIX_CHARS = ['$', '%', '#', '&', '<', '>', '0', '1', '+', '-', '*', '=', '{', '}', '(', ')', '@', '^', '~', '?', '/', '\\', '|'];

function MatrixBackground() {
  const chars = useMemo(
    () => Array.from({ length: 1500 }).map(() => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]),
    []
  );
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden"
      style={{ opacity: 0.08 }}
      aria-hidden="true"
    >
      <div className="flex flex-wrap content-start break-all" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, lineHeight: 1, color: '#6B7280' }}>
        {chars.map((c, i) => (
          <span key={i} style={{ margin: 2 }}>{c}</span>
        ))}
      </div>
    </div>
  );
}

interface LandingPageProps {
  onBypass?: () => void;
  onTelegramAuth?: (user: TelegramAuthData) => void;
}

export function LandingPage({ onBypass, onTelegramAuth }: LandingPageProps = {}) {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    let loaded = 0;
    const total = SLIDES.length;
    SLIDES.forEach(slide => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded >= total) setImagesReady(true);
      };
      img.src = slide.image;
    });
    const timeout = setTimeout(() => setImagesReady(true), 3000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!imagesReady) return;
    const interval = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [imagesReady]);

  const currentSlide = SLIDES[slideIndex];

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#0B0F14', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
      data-testid="landing-page"
    >
      <MatrixBackground />

      <nav
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-5 md:px-8 py-4"
        style={{ zIndex: 20 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center gap-2"
          data-testid="text-wordmark"
        >
          <img src="/azabu-logo.png" alt="Azabu" style={{ width: 32, height: 32 }} />
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onClick={() => setWalletModalOpen(true)}
          className="px-5 py-2 text-sm font-medium rounded-full backdrop-blur-sm transition-all duration-300"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.1em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
          data-testid="button-connect-wallet-nav"
        >
          LAUNCH APP
        </motion.button>
      </nav>

      <div style={{ height: 64, flexShrink: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="z-10 text-center px-4 mb-4"
      >
        <h1
          className="text-5xl md:text-7xl"
          style={{
            fontWeight: 200,
            letterSpacing: '-0.02em',
            color: '#E6EDF3',
            lineHeight: 1.1,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          One search bar.<br />
          <span style={{ color: '#9BA4AE' }}>Every market.</span>
        </h1>
      </motion.div>

      <div className="w-full z-10 relative flex items-center justify-center" style={{ height: '40vh' }}>
        <Token3D currentAsset={currentSlide.image} />
        <AnimatePresence>
          {currentSlide.action === 'EARN YIELD' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 8 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
              style={{
                position: 'absolute',
                bottom: '8%',
                right: 'calc(50% - 170px)',
                background: 'rgba(9,9,11,0.88)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
                zIndex: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    src="https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png"
                    alt="AVAX"
                    style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid #1B2030', filter: 'grayscale(100%)' }}
                  />
                  <img
                    src="https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png"
                    alt="USDC"
                    style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid #1B2030', marginLeft: -6, filter: 'grayscale(100%)' }}
                  />
                </div>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#71717A',
                  letterSpacing: '0.02em',
                }}>
                  AVAX / USDC
                </span>
              </div>
              <div style={{ width: 1, height: 16, background: '#1B2030' }} />
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                color: '#D4D4D8',
                letterSpacing: '0.01em',
              }}>
                52.13% APY
              </span>
            </motion.div>
          )}
          {currentSlide.action === 'TRADE STABLECOINS' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 8 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
              style={{
                position: 'absolute',
                bottom: '8%',
                left: 'calc(50% - 170px)',
                background: 'rgba(9,9,11,0.88)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
                zIndex: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    src="/assets/usdt-coin.png"
                    alt="USDT"
                    style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid #1B2030', filter: 'grayscale(100%)' }}
                  />
                  <img
                    src="/assets/usd1-coin.png"
                    alt="USD1"
                    style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid #1B2030', marginLeft: -6, filter: 'grayscale(100%)' }}
                  />
                </div>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#71717A',
                  letterSpacing: '0.02em',
                }}>
                  USDT / USD1
                </span>
              </div>
              <div style={{ width: 1, height: 16, background: '#1B2030' }} />
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                color: '#D4D4D8',
                letterSpacing: '0.01em',
              }}>
                $1.00
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="z-10 mt-6 flex flex-col items-center gap-6 text-center px-4 pb-12">
        <div className="relative w-full flex flex-col justify-center items-center" style={{ minHeight: 52 }}>
          <div className="flex justify-center items-center">
            <span
              style={{
                color: '#6B7280',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 14,
                letterSpacing: '0.1em',
                marginRight: 8,
              }}
            >
              {'>'}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={slideIndex}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  color: '#E4E4E7',
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: '0.1em',
                  fontSize: 14,
                }}
              >
                {currentSlide.action}
              </motion.span>
            </AnimatePresence>
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.53, repeat: Infinity, repeatType: 'reverse' }}
              style={{
                color: '#71717A',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 14,
                marginLeft: 4,
              }}
            >
              _
            </motion.span>
          </div>
          <AnimatePresence mode="wait">
            {currentSlide.tag && (
              <motion.div
                key={`tag-${slideIndex}`}
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.9 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
                style={{ marginTop: 8 }}
              >
                <motion.span
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    display: 'inline-block',
                    padding: '4px 14px',
                    borderRadius: 20,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#9BA4AE',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                  }}
                >
                  {currentSlide.tag}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="flex items-center gap-3 md:gap-5 mb-2"
          data-testid="stats-strip"
        >
          {[
            { value: '89+', label: 'FUTURES MARKETS' },
            { value: '5', label: 'PROTOCOLS' },
            { value: '300x', label: 'MAX LEVERAGE' },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-3 md:gap-5">
              {i > 0 && <div style={{ width: 1, height: 28, background: '#1B2030' }} />}
              <div className="flex flex-col items-center">
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#E4E4E7',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}>
                  {stat.value}
                </span>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  fontWeight: 500,
                  color: '#6B7280',
                  letterSpacing: '0.12em',
                  marginTop: 2,
                }}>
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.button
            onClick={() => setWalletModalOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative px-8 py-3 rounded-full overflow-hidden group cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
              letterSpacing: '0.15em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            data-testid="button-connect-wallet"
          >
            <span className="relative z-10 font-medium" style={{ color: '#E4E4E7' }}>CONNECT WALLET</span>
          </motion.button>

          {onTelegramAuth && (
            <div className="flex flex-col items-center gap-3" data-testid="telegram-login-section">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', maxWidth: 220,
              }}>
                <div style={{ flex: 1, height: 1, background: '#1B2030' }} />
                <span style={{
                  color: '#6B7280',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.1em',
                }}>OR</span>
                <div style={{ flex: 1, height: 1, background: '#1B2030' }} />
              </div>
              {telegramLoading ? (
                <div style={{
                  color: '#6B7280',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.05em',
                }}>
                  Signing in...
                </div>
              ) : (
                <TelegramLoginButton
                  botName="AFX_Bot"
                  onAuth={async (user) => {
                    setTelegramLoading(true);
                    try {
                      const res = await fetch('/api/auth/telegram', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(user),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        onTelegramAuth(user);
                      } else {
                        setTelegramLoading(false);
                      }
                    } catch {
                      setTelegramLoading(false);
                    }
                  }}
                  buttonSize="large"
                  cornerRadius={20}
                />
              )}
            </div>
          )}

          {onBypass && (
            <motion.button
              onClick={onBypass}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative px-8 py-3 rounded-full overflow-hidden cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                letterSpacing: '0.12em',
                color: '#71717A',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.color = '#9BA4AE';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = '#71717A';
              }}
              data-testid="button-bypass-wallet"
            >
              ENTER WITHOUT WALLET
            </motion.button>
          )}
        </motion.div>
      </div>

      <WalletSelectModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </div>
  );
}

export default LandingPage;
