"use client";

export const CHAIN_LOGOS: Record<string, (size?: number) => JSX.Element> = {
  solana: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 128 128" fill="none">
      <defs><linearGradient id="sw-sg" x1="0" y1="128" x2="128" y2="0"><stop stopColor="#9945FF"/><stop offset="0.5" stopColor="#8752F3"/><stop offset="1" stopColor="#14F195"/></linearGradient></defs>
      <path d="M25.5 98.2c.8-.8 1.9-1.3 3.1-1.3h90.8c2 0 2.9 2.4 1.5 3.7l-17.4 17.4c-.8.8-1.9 1.3-3.1 1.3H9.6c-2 0-2.9-2.4-1.5-3.7L25.5 98.2z" fill="url(#sw-sg)"/>
      <path d="M25.5 8.7c.8-.8 2-1.3 3.1-1.3h90.8c2 0 2.9 2.4 1.5 3.7l-17.4 17.4c-.8.8-1.9 1.3-3.1 1.3H9.6c-2 0-2.9-2.4-1.5-3.7L25.5 8.7z" fill="url(#sw-sg)"/>
      <path d="M102.5 53.2c-.8-.8-1.9-1.3-3.1-1.3H8.6c-2 0-2.9 2.4-1.5 3.7l17.4 17.4c.8.8 1.9 1.3 3.1 1.3h90.8c2 0 2.9-2.4 1.5-3.7L102.5 53.2z" fill="url(#sw-sg)"/>
    </svg>
  ),
};
