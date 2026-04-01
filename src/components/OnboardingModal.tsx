'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PFP_VARIANTS, ERA_LABELS, type PfpVariant } from '@/config/pfpVariants';
import AnimatedAvatar from '@/components/AnimatedAvatar';

export type OnboardingResult = {
  avatarId: string;
  username: string;
  email?: string;
};

interface OnboardingModalProps {
  onComplete: (result: OnboardingResult) => void;
  onSkip: () => void;
}

function TypewriterHeading({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [text]);
  return (
    <span>
      {displayed}
      <span style={{
        opacity: displayed.length < text.length ? 1 : 0,
        animation: 'afx-blink 0.8s step-end infinite',
      }}>_</span>
    </span>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.05, duration: 0.2 }}
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i === current ? '#E4E4E7' : '#1B2030',
            transition: 'background 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

function AvatarCell({ variant, selected, onSelect, index }: {
  variant: PfpVariant; selected: boolean; onSelect: () => void; index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.02, duration: 0.2 }}
      onClick={onSelect}
      data-testid={`avatar-${variant.id}`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
        background: selected ? '#D4A57410' : 'rgba(255,255,255,0.02)',
        border: `2px solid ${selected ? '#D4A574' : '#1B2030'}`,
        transition: 'all 0.2s ease',
        opacity: selected ? 1 : 0.8,
      }}
    >
      <motion.div
        animate={selected ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.25, type: 'spring' }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          overflow: 'hidden',
          border: `1px solid ${selected ? '#D4A57440' : '#1B2030'}`,
        }}>
          <AnimatedAvatar avatarId={variant.id} size={48} />
        </div>
      </motion.div>
      <span style={{
        fontSize: 8, fontWeight: 600,
        color: selected ? '#E4E4E7' : '#6B7280',
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: '0.04em',
        lineHeight: 1.2,
      }}>
        {variant.name}
      </span>
      <span style={{
        fontSize: 7, color: '#6B7280',
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        {variant.era}
      </span>
    </motion.button>
  );
}

export default function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);

  const selectedVariant = PFP_VARIANTS.find(v => v.id === selectedAvatar);

  const goNext = useCallback(() => {
    setDirection(1);
    setSlide(s => s + 1);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setSlide(s => s - 1);
  }, []);

  const handleCreateAccount = async () => {
    if (!selectedAvatar || !username) return;
    setChecking(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          avatarId: selectedAvatar,
          email: email.trim() || undefined,
        }),
      });
      if (res.ok) {
        onComplete({ avatarId: selectedAvatar, username: username.toLowerCase().trim(), email: email.trim() || undefined });
      } else {
        const err = await res.json();
        setUsernameError(err.error || 'Something went wrong');
        if (err.error?.includes('username')) {
          setDirection(-1);
          setSlide(1);
        }
        setChecking(false);
      }
    } catch {
      setUsernameError('Network error');
      setChecking(false);
    }
  };

  const validateUsername = (val: string) => {
    if (val.length < 3) return 'At least 3 characters';
    if (val.length > 20) return 'Max 20 characters';
    if (!/^[a-z0-9_]+$/.test(val)) return 'a-z, 0-9, underscore only';
    return '';
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 30 : -30, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -30 : 30, opacity: 0 }),
  };

  return (
    <>
      <style>{`
        @keyframes afx-blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }
        @keyframes ring-pulse { 0%{box-shadow:0 0 0 0 var(--ring-color)} 70%{box-shadow:0 0 0 8px transparent} 100%{box-shadow:0 0 0 0 transparent} }
      `}</style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
        data-testid="onboarding-modal"
      >
        <motion.div
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            width: '100%', maxWidth: 560,
            maxHeight: '90vh',
            background: '#0B0F14',
            border: '1px solid #1B2030',
            borderRadius: 16,
            padding: '32px 28px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ProgressDots current={slide} total={3} />

          <AnimatePresence mode="wait" custom={direction}>
            {slide === 0 && (
              <motion.div
                key="slide-0"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2 }}
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <h2 style={{
                  fontSize: 18, fontWeight: 500, color: '#E6EDF3',
                  textAlign: 'center', marginBottom: 4,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  <TypewriterHeading text="Choose your avatar" />
                </h2>
                <div style={{ marginBottom: 16 }} />

                <div style={{
                  flex: 1, overflowY: 'auto', overflowX: 'hidden',
                  maxHeight: 'calc(90vh - 240px)',
                  paddingRight: 4,
                }}>
                  {ERA_LABELS.map((era, eraIdx) => (
                    <div key={era} style={{ marginBottom: 12 }}>
                      <div style={{
                        fontSize: 9, color: '#5E6673', marginBottom: 6,
                        letterSpacing: '0.12em', fontWeight: 700,
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}>
                        {era}
                      </div>
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: 6,
                      }}>
                        {PFP_VARIANTS.slice(eraIdx * 5, eraIdx * 5 + 5).map((v, i) => (
                          <AvatarCell
                            key={v.id}
                            variant={v}
                            selected={selectedAvatar === v.id}
                            onSelect={() => setSelectedAvatar(v.id)}
                            index={eraIdx * 5 + i}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <motion.button
                  onClick={goNext}
                  disabled={!selectedAvatar}
                  whileHover={selectedAvatar ? { scale: 1.01 } : {}}
                  whileTap={selectedAvatar ? { scale: 0.98 } : {}}
                  data-testid="button-onboarding-continue-1"
                  style={{
                    width: '100%', marginTop: 16, padding: '12px 0',
                    borderRadius: 10, border: 'none', cursor: selectedAvatar ? 'pointer' : 'not-allowed',
                    background: selectedAvatar ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    color: selectedAvatar ? '#E4E4E7' : '#6B7280',
                    fontSize: 13, fontWeight: 500,
                    fontFamily: "'IBM Plex Mono', monospace",
                    letterSpacing: '0.06em',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  Continue
                </motion.button>
              </motion.div>
            )}

            {slide === 1 && (
              <motion.div
                key="slide-1"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {selectedVariant && (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      style={{
                        width: 72, height: 72, borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#D4A57410',
                        border: '2px solid #D4A57430',
                        marginBottom: 8,
                        animation: 'ring-pulse 2s ease-in-out infinite',
                        ['--ring-color' as any]: '#D4A57425',
                      }}
                    >
                      <AnimatedAvatar avatarId={selectedVariant.id} size={72} />
                    </motion.div>
                  )}
                  {selectedVariant && (
                    <div style={{
                      fontSize: 10, color: '#71717A', marginBottom: 16,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      {selectedVariant.name} / {selectedVariant.era}
                    </div>
                  )}

                  <h2 style={{
                    fontSize: 18, fontWeight: 500, color: '#E6EDF3',
                    textAlign: 'center', marginBottom: 20,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    What should we call you?
                  </h2>

                  <div style={{ width: '100%', maxWidth: 280 }}>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        setUsername(v);
                        setUsernameError('');
                      }}
                      placeholder="username"
                      maxLength={20}
                      autoFocus
                      data-testid="input-username"
                      style={{
                        width: '100%', padding: '12px 16px',
                        background: '#0F0F12',
                        border: `1px solid ${usernameError ? '#EF4444' : '#1B2030'}`,
                        borderRadius: 10, color: '#E6EDF3',
                        fontSize: 15, fontFamily: "'IBM Plex Mono', monospace",
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => { if (!usernameError) e.currentTarget.style.borderColor = '#6B7280'; }}
                      onBlur={(e) => { if (!usernameError) e.currentTarget.style.borderColor = '#1B2030'; }}
                    />
                    <div style={{
                      fontSize: 11, marginTop: 6,
                      color: usernameError ? '#EF4444' : '#6B7280',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      {usernameError || 'a-z, 0-9, underscore'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 24 }}>
                    <button
                      onClick={goBack}
                      data-testid="button-onboarding-back-1"
                      style={{
                        flex: 1, padding: '12px 0',
                        borderRadius: 10, border: '1px solid #1B2030',
                        background: 'transparent', color: '#71717A',
                        fontSize: 13, fontFamily: "'IBM Plex Mono', monospace",
                        cursor: 'pointer', letterSpacing: '0.04em',
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        const err = validateUsername(username);
                        if (err) { setUsernameError(err); return; }
                        goNext();
                      }}
                      disabled={!username}
                      data-testid="button-onboarding-continue-2"
                      style={{
                        flex: 2, padding: '12px 0',
                        borderRadius: 10, border: 'none',
                        background: username.length >= 3 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                        color: username.length >= 3 ? '#E4E4E7' : '#6B7280',
                        fontSize: 13, fontWeight: 500,
                        fontFamily: "'IBM Plex Mono', monospace",
                        cursor: username.length >= 3 ? 'pointer' : 'not-allowed',
                        letterSpacing: '0.06em',
                        transition: 'all 0.2s',
                      }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {slide === 2 && (
              <motion.div
                key="slide-2"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {selectedVariant && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      marginBottom: 20,
                    }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#D4A57410',
                        border: '2px solid #D4A57425',
                        marginBottom: 8,
                      }}>
                        <AnimatedAvatar avatarId={selectedVariant.id} size={64} />
                      </div>
                      <span style={{
                        fontSize: 13, color: '#71717A',
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}>
                        @{username}
                      </span>
                    </div>
                  )}

                  <h2 style={{
                    fontSize: 18, fontWeight: 500, color: '#E6EDF3',
                    textAlign: 'center', marginBottom: 4,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    How do we reach you?
                  </h2>
                  <p style={{
                    fontSize: 12, color: '#6B7280', textAlign: 'center',
                    fontFamily: "'IBM Plex Mono', monospace", marginBottom: 20,
                  }}>
                    Optional -- for account recovery
                  </p>

                  <div style={{ width: '100%', maxWidth: 280 }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      data-testid="input-email"
                      style={{
                        width: '100%', padding: '12px 16px',
                        background: '#0F0F12',
                        border: '1px solid #1B2030',
                        borderRadius: 10, color: '#E6EDF3',
                        fontSize: 14, fontFamily: "'IBM Plex Mono', monospace",
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6B7280'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#1B2030'; }}
                    />
                  </div>

                  <button
                    onClick={handleCreateAccount}
                    disabled={checking}
                    data-testid="button-create-account"
                    style={{
                      width: '100%', maxWidth: 280, marginTop: 20, padding: '12px 0',
                      borderRadius: 10, border: 'none',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#E4E4E7',
                      fontSize: 13, fontWeight: 500,
                      fontFamily: "'IBM Plex Mono', monospace",
                      cursor: checking ? 'wait' : 'pointer',
                      letterSpacing: '0.06em',
                      transition: 'all 0.2s',
                    }}
                  >
                    {checking ? 'Creating...' : 'Create Account'}
                  </button>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', maxWidth: 280, margin: '16px 0',
                  }}>
                    <div style={{ flex: 1, height: 1, background: '#1B2030' }} />
                    <span style={{ color: '#1B2030', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>or</span>
                    <div style={{ flex: 1, height: 1, background: '#1B2030' }} />
                  </div>

                  <button
                    onClick={onSkip}
                    data-testid="button-skip-onboarding"
                    style={{
                      background: 'none', border: 'none',
                      color: '#1B2030', fontSize: 11,
                      fontFamily: "'IBM Plex Mono', monospace",
                      cursor: 'pointer', letterSpacing: '0.08em',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#6B7280'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#1B2030'; }}
                  >
                    Skip -- connect wallet instead
                  </button>

                  {usernameError && (
                    <div style={{
                      marginTop: 12, padding: '8px 12px',
                      background: 'rgba(239,68,97,0.08)',
                      border: '1px solid rgba(239,68,97,0.15)',
                      borderRadius: 8, fontSize: 12,
                      color: '#EF4444', fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      {usernameError}
                    </div>
                  )}

                  <button
                    onClick={goBack}
                    data-testid="button-onboarding-back-2"
                    style={{
                      marginTop: 8, background: 'none', border: 'none',
                      color: '#6B7280', fontSize: 11,
                      fontFamily: "'IBM Plex Mono', monospace",
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#71717A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; }}
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  );
}
