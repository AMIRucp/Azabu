'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (user: TelegramAuthData) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write';
  showUserPic?: boolean;
}

export function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 20,
  requestAccess = 'write',
  showUserPic = false,
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onAuth);
  callbackRef.current = onAuth;

  const handleAuth = useCallback((user: TelegramAuthData) => {
    callbackRef.current(user);
  }, []);

  useEffect(() => {
    (window as any).__telegram_login_callback = handleAuth;

    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', String(cornerRadius));
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-userpic', String(showUserPic));
    script.setAttribute('data-onauth', '__telegram_login_callback(user)');

    container.appendChild(script);

    return () => {
      delete (window as any).__telegram_login_callback;
    };
  }, [botName, buttonSize, cornerRadius, requestAccess, showUserPic, handleAuth]);

  return <div ref={containerRef} data-testid="telegram-login-widget" />;
}
