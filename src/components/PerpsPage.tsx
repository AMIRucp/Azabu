"use client";
import dynamic from 'next/dynamic';

const PerpsTerminal = dynamic(() => import('@/components/perps/PerpsTerminal'), { ssr: false });

export default function PerpsPage() {
  return (
    <div
      data-testid="perps-page"
      style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <PerpsTerminal />
    </div>
  );
}
