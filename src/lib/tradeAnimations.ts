"use client";

export function fireTradeFlash(side: "long" | "short", intensity = 1) {
  const el = document.createElement("div");
  const color = side === "long" ? "14,203,129" : "246,70,93";
  const alpha = (0.15 * intensity).toFixed(2);
  el.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    pointer-events:none;
    background:radial-gradient(circle at 75% 50%,rgba(${color},${alpha}) 0%,rgba(${color},0) 60%);
    animation:tradeFlash 0.6s ease-out forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

export function fireConfetti(originX: number, originY: number) {
  const colors = ["#0ECB81", "#D4A574", "#3B82F6", "#F6465D", "#A855F7"];
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:10000;overflow:hidden;";

  for (let i = 0; i < 18; i++) {
    const p = document.createElement("div");
    const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.4;
    const dist = 80 + Math.random() * 120;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 60;
    const rot = Math.random() * 720 - 360;
    p.style.cssText = `
      position:absolute;
      left:${originX}px;top:${originY}px;
      width:4px;height:8px;border-radius:1px;
      background:${colors[i % colors.length]};
      animation:confettiPop 0.9s ease-out forwards;
      animation-delay:${i * 15}ms;
      --tx:${tx}px;--ty:${ty}px;--rot:${rot}deg;
    `;
    container.appendChild(p);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 1200);
}

export function showXpToast(amount: number, originEl: HTMLElement) {
  const rect = originEl.getBoundingClientRect();
  const el = document.createElement("div");
  el.textContent = `+${amount}xp`;
  el.style.cssText = `
    position:fixed;z-index:10000;
    left:${rect.right - 40}px;top:${rect.top - 10}px;
    font-family:'JetBrains Mono','IBM Plex Mono',monospace;
    font-size:10px;color:#D4A574;opacity:0.5;
    pointer-events:none;
    animation:xpFloat 1.5s ease-out forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

export function addRipple(e: React.MouseEvent, btn: HTMLElement) {
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.style.cssText = `
    position:absolute;border-radius:50%;
    width:0;height:0;
    left:${e.clientX - rect.left}px;
    top:${e.clientY - rect.top}px;
    background:rgba(255,255,255,0.15);
    transform:translate(-50%,-50%);
    animation:rippleOut 0.5s ease-out forwards;
  `;
  btn.style.position = "relative";
  btn.style.overflow = "hidden";
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

let audioCtx: AudioContext | null = null;
export function playTone(freq: number, duration: number, vol = 0.08) {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + duration,
    );
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {}
}

export const TRADE_SOUNDS = {
  confirmed: () => playTone(880, 0.08),
  closed: () => playTone(440, 0.15),
  liquidationWarning: () => playTone(220, 0.3),
  achievement: () => playTone(660, 0.05),
};

export function updateTabPnl(pnl: number) {
  document.title = `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)} | AFX`;
}

export function updateFavicon(isUp: boolean) {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = isUp ? "#0ECB81" : "#F6465D";
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    let link = document.querySelector(
      'link[rel~="icon"]',
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = c.toDataURL();
  } catch {}
}

const PNL_THRESHOLDS = [100, 500, 1000, 5000, 10000];
export function crossedThreshold(prev: number, next: number): boolean {
  if ((prev < 0 && next >= 0) || (prev >= 0 && next < 0)) return true;
  for (const t of PNL_THRESHOLDS) {
    if (
      (Math.abs(prev) < t && Math.abs(next) >= t) ||
      (Math.abs(prev) >= t && Math.abs(next) < t)
    ) {
      return true;
    }
  }
  return false;
}

export function getLiquidationProximity(
  currentPrice: number,
  liqPrice: number,
): { danger: boolean; pulseSpeed: string } {
  if (!liqPrice || liqPrice <= 0) return { danger: false, pulseSpeed: "2s" };
  const pct = Math.abs(currentPrice - liqPrice) / currentPrice;
  if (pct > 0.1) return { danger: false, pulseSpeed: "2s" };
  const speed = Math.max(0.4, pct * 20);
  return { danger: true, pulseSpeed: `${speed}s` };
}

export function getLeverageColor(leverage: number): string {
  if (leverage < 50) return "#D4A574";
  if (leverage < 100) return "#F97316";
  return "#F6465D";
}

export function onTradeConfirmed(opts: {
  side: "long" | "short";
  posValue: number;
  leverage: number;
  buttonEl?: HTMLElement | null;
  soundEnabled?: boolean;
  soundVolume?: number;
  showXp?: boolean;
  realiziedPnl?: number;
}) {
  const { side, posValue, leverage, buttonEl, soundEnabled, soundVolume, showXp } = opts;

  const isLoss = opts.realiziedPnl !== undefined && opts.realiziedPnl < 0;
  fireTradeFlash(side, isLoss ? 0.5 : 1);

  const isBigTrade = posValue > 10000 || leverage >= 50;
  if (isBigTrade && buttonEl) {
    const rect = buttonEl.getBoundingClientRect();
    fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  if (showXp && buttonEl) {
    const xp = isBigTrade ? 50 : 25;
    showXpToast(xp, buttonEl);
  }

  if (soundEnabled) {
    const vol = typeof soundVolume === "number" ? soundVolume / 100 * 0.15 : 0.08;
    playTone(880, 0.08, vol);
  }
}
