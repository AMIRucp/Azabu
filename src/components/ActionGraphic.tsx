import { useState, useEffect, useRef } from 'react';

const GRAPHICS: Record<string, string> = {
  swap: '/graphics/swap-arrows.svg',
  send: '/graphics/send-dispatch.svg',
  receive: '/graphics/receive-land.svg',
  launch: '/graphics/success-check.svg',
  price: '/graphics/price-pulse.svg',
  safety: '/graphics/shield-scan.svg',
  holdings: '/graphics/holdings-stack.svg',
  success: '/graphics/success-check.svg',
  error: '/graphics/error-alert.svg',
  loading: '/graphics/processing-orbit.svg',
  connect: '/graphics/connect-handshake.svg',
};

export type ActionType = keyof typeof GRAPHICS;

export function ActionGraphic({ action }: { action: ActionType }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const src = GRAPHICS[action];

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    if (!src) return;
    fetch(src, { method: 'HEAD' })
      .then(res => {
        if (res.ok) setLoaded(true);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, [src]);

  if (!src || failed || !loaded) return null;

  return (
    <div
      ref={ref}
      className="action-graphic"
      data-testid={`graphic-${action}`}
    >
      <object
        type="image/svg+xml"
        data={src}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        aria-label={`${action} illustration`}
      />
    </div>
  );
}
