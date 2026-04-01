"use client";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({ width = '100%', height = 14, borderRadius = 3 }: SkeletonProps) {
  return (
    <div
      data-testid="skeleton"
      style={{
        width, height, borderRadius,
        background: 'linear-gradient(90deg, #1E2329 25%, #252a35 50%, #1E2329 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

export function MarketHeaderSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 12px', alignItems: 'center' }} data-testid="skeleton-market-header">
      <Skeleton width={60} height={18} />
      <Skeleton width={40} height={14} />
      <Skeleton width={80} height={18} />
      <Skeleton width={50} height={14} />
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
        <Skeleton width={60} height={12} />
        <Skeleton width={60} height={12} />
        <Skeleton width={60} height={12} />
      </div>
    </div>
  );
}

export function OrderBookSkeleton() {
  return (
    <div style={{ padding: '8px' }} data-testid="skeleton-orderbook">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
          <Skeleton width={50} height={11} />
          <Skeleton width={60} height={11} />
          <Skeleton width={70} height={11} />
        </div>
      ))}
    </div>
  );
}

export function PositionRowSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 12px', alignItems: 'center' }} data-testid="skeleton-position-row">
      <Skeleton width={16} height={16} borderRadius={8} />
      <Skeleton width={40} height={12} />
      <Skeleton width={30} height={12} />
      <Skeleton width={50} height={12} />
      <Skeleton width={60} height={14} />
    </div>
  );
}

export function TradePanelSkeleton() {
  return (
    <div style={{ padding: '12px' }} data-testid="skeleton-trade-panel">
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <Skeleton width="50%" height={36} borderRadius={6} />
        <Skeleton width="50%" height={36} borderRadius={6} />
      </div>
      <Skeleton width="100%" height={40} borderRadius={6} />
      <div style={{ marginTop: 12 }}>
        <Skeleton width={80} height={10} />
        <div style={{ marginTop: 6 }}>
          <Skeleton width="100%" height={4} borderRadius={2} />
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <Skeleton width="100%" height={44} borderRadius={6} />
      </div>
    </div>
  );
}
