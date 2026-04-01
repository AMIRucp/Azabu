import { useRef, useEffect, useCallback } from 'react';

const PERM = new Uint8Array(512);
const GRAD = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
(function initPerm() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
})();

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number) { return a + t * (b - a); }
function dot2(g: number[], x: number, y: number) { return g[0] * x + g[1] * y; }

function perlin2D(x: number, y: number): number {
  const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const u = fade(xf), v = fade(yf);
  const aa = PERM[PERM[xi] + yi] & 7, ab = PERM[PERM[xi] + yi + 1] & 7;
  const ba = PERM[PERM[xi + 1] + yi] & 7, bb = PERM[PERM[xi + 1] + yi + 1] & 7;
  return lerp(
    lerp(dot2(GRAD[aa], xf, yf), dot2(GRAD[ba], xf - 1, yf), u),
    lerp(dot2(GRAD[ab], xf, yf - 1), dot2(GRAD[bb], xf - 1, yf - 1), u),
    v
  );
}

function fbm(x: number, z: number): number {
  let value = 0, amplitude = 1.0, frequency = 1.0;
  for (let i = 0; i < 3; i++) {
    value += amplitude * perlin2D(x * frequency, z * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

function project(px: number, py: number, pz: number, w: number, h: number, out: Float64Array, idx: number) {
  const cameraY = 8, cameraZ = -4;
  const focalLength = h / (2 * Math.tan((60 * Math.PI) / 360));
  const dx = px;
  const dy = py - cameraY;
  const dz = pz - cameraZ;
  const pitch = -1.13;
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
  const ry = dy * cosP - dz * sinP;
  const rz = dy * sinP + dz * cosP;
  if (rz <= 0.1) { out[idx] = -9999; out[idx + 1] = -9999; out[idx + 2] = 0; return; }
  out[idx] = (dx * focalLength) / rz + w / 2;
  out[idx + 1] = (ry * focalLength) / rz + h * 0.5;
  out[idx + 2] = rz;
}

const FRAME_INTERVAL = 1000 / 30;

function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, screenPool: Float64Array, heightPool: Float64Array) {
  ctx.fillStyle = '#030305';
  ctx.fillRect(0, 0, w, h);

  const cols = w > 768 ? 200 : (w > 480 ? 120 : 80);
  const rows = w > 768 ? 80 : (w > 480 ? 50 : 30);
  const gridSpacing = 0.15;
  const scrollOffset = time * 0.0003;
  const heightScale = 2.5;
  const noiseScale = 0.8;

  for (let row = 0; row < rows; row++) {
    const z = row * gridSpacing + scrollOffset;

    for (let col = 0; col < cols; col++) {
      const x = (col - cols / 2) * gridSpacing;
      const noiseVal = fbm(x * noiseScale, z * noiseScale);
      heightPool[col] = noiseVal;
      project(x, noiseVal * heightScale, row * gridSpacing, w, h, screenPool, col * 3);
    }

    const rowDepthRatio = row / rows;
    const baseAlpha = 0.08 + (1 - rowDepthRatio) * 0.52;
    const lineWidth = 0.5 + (1 - rowDepthRatio) * 1.0;

    let maxH = 0;
    for (let col = 0; col < cols; col++) {
      if (heightPool[col] > maxH) maxH = heightPool[col];
    }
    const peakBoost = maxH > 0.3 ? (maxH - 0.3) * 0.8 : 0;
    const alpha = Math.min(1, baseAlpha + peakBoost);

    ctx.beginPath();
    let started = false;
    for (let col = 0; col < cols; col++) {
      const sx = screenPool[col * 3];
      const sy = screenPool[col * 3 + 1];
      if (sx < -200 || sx > w + 200) { started = false; continue; }
      if (!started) { ctx.moveTo(sx, sy); started = true; }
      else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.5).toFixed(3)})`;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  const fogAlpha = 0.02 + Math.sin(time * 0.0004) * 0.02;
  const fogGrad = ctx.createRadialGradient(w / 2, h * 0.5, 0, w / 2, h * 0.5, w * 0.6);
  fogGrad.addColorStop(0, `rgba(255, 255, 255, ${(fogAlpha * 0.4).toFixed(4)})`);
  fogGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = fogGrad;
  ctx.fillRect(0, h * 0.3, w, h * 0.4);
}

export default function TerrainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const screenPoolRef = useRef<Float64Array>(new Float64Array(200 * 3));
  const heightPoolRef = useRef<Float64Array>(new Float64Array(200));

  const animate = useCallback((timestamp: number) => {
    animRef.current = requestAnimationFrame(animate);
    if (document.hidden) return;
    if (timestamp - lastFrameRef.current < FRAME_INTERVAL) return;
    lastFrameRef.current = timestamp;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width / (Math.min(window.devicePixelRatio, 2) || 1);
    const h = canvas.height / (Math.min(window.devicePixelRatio, 2) || 1);
    drawFrame(ctx, w, h, timestamp, screenPoolRef.current, heightPoolRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);

      const cols = w > 768 ? 200 : (w > 480 ? 120 : 80);
      if (screenPoolRef.current.length < cols * 3) {
        screenPoolRef.current = new Float64Array(cols * 3);
        heightPoolRef.current = new Float64Array(cols);
      }
    };

    resize();
    let resizeTimer: ReturnType<typeof setTimeout>;
    const debouncedResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); };
    window.addEventListener('resize', debouncedResize);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      cancelAnimationFrame(animRef.current);
      clearTimeout(resizeTimer);
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}
      data-testid="terrain-background"
    />
  );
}