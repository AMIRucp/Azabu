"use client";
import { useState, useEffect, useRef } from 'react';

interface TradeConfirmationProps {
  params: {
    side: string;
    symbol: string;
    leverage: number;
    sizeUsd: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

const MONO = "'IBM Plex Mono', monospace";

export default function TradeConfirmation({ params, onConfirm, onCancel }: TradeConfirmationProps) {
  const [countdown, setCountdown] = useState(3);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(c => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0 && !confirmedRef.current) {
      confirmedRef.current = true;
      onConfirm();
    }
  }, [countdown, onConfirm]);

  const isLong = params.side.toUpperCase() === 'LONG';

  return (
    <div
      data-testid="trade-confirmation-countdown"
      style={{
        padding: '8px 12px', borderRadius: 6,
        background: isLong ? 'rgba(14,203,129,0.06)' : 'rgba(246,70,93,0.06)',
        border: `1px solid ${isLong ? 'rgba(14,203,129,0.2)' : 'rgba(246,70,93,0.2)'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        animation: 'fadeIn 0.2s ease',
        marginBottom: 10,
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#EAECEF', fontFamily: MONO }}>
          {params.side.toUpperCase()} {params.symbol} {params.leverage}x — ${params.sizeUsd.toFixed(0)}
        </div>
        <div style={{ fontSize: 9, color: '#5E6673', fontFamily: MONO }}>
          {countdown > 0 ? `Submitting in ${countdown}s...` : 'Submitting...'}
        </div>
      </div>
      <button
        onClick={onCancel}
        data-testid="button-cancel-trade"
        style={{
          padding: '4px 10px', fontSize: 9, fontWeight: 700,
          background: 'transparent', border: '1px solid rgba(246,70,93,0.2)',
          color: '#F6465D', borderRadius: 4, cursor: 'pointer',
          fontFamily: MONO,
        }}
      >CANCEL</button>
    </div>
  );
}
