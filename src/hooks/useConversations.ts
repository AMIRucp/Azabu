import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getMessages,
  saveMessages,
  createConversation,
  getConversationList,
  migrateOldConversation,
} from '../services/conversationStorage';

export function useConversations(wallet: string | null) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (!wallet) return null;
    const migrated = migrateOldConversation(wallet);
    if (migrated) return migrated;
    const list = getConversationList(wallet);
    return list.length > 0 ? list[0].id : null;
  });
  const [messages, setMessages] = useState<any[]>(() => {
    if (!wallet || !activeId) return [];
    return getMessages(wallet, activeId);
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const prevWalletRef = useRef(wallet);

  useEffect(() => {
    if (wallet === prevWalletRef.current) return;
    prevWalletRef.current = wallet;

    if (wallet) {
      const migrated = migrateOldConversation(wallet);
      const list = getConversationList(wallet);
      const firstId = migrated || (list.length > 0 ? list[0].id : null);
      setActiveId(firstId);
      setMessages(firstId ? getMessages(wallet, firstId) : []);
    } else {
      setActiveId(null);
      setMessages([]);
    }
    setRefreshKey(k => k + 1);
  }, [wallet]);

  const selectConversation = useCallback((id: string) => {
    if (!wallet) return;
    if (activeId && messages.length > 0) {
      saveMessages(wallet, activeId, messages);
    }
    setActiveId(id);
    setMessages(getMessages(wallet, id));
    setRefreshKey(k => k + 1);
  }, [wallet, activeId, messages]);

  const startNewConversation = useCallback(() => {
    if (!wallet) return;
    if (activeId && messages.length > 0) {
      saveMessages(wallet, activeId, messages);
    }
    const newId = createConversation(wallet);
    setActiveId(newId);
    setMessages([]);
    setRefreshKey(k => k + 1);
  }, [wallet, activeId, messages]);

  const updateMessages = useCallback((updater: (prev: any[]) => any[]) => {
    setMessages(prev => {
      const updated = updater(prev);
      if (wallet && activeId) {
        saveMessages(wallet, activeId, updated);
      }
      return updated;
    });
    setRefreshKey(k => k + 1);
  }, [wallet, activeId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (wallet && activeId) {
      saveMessages(wallet, activeId, []);
    }
    setRefreshKey(k => k + 1);
  }, [wallet, activeId]);

  return {
    activeId,
    messages,
    setMessages: updateMessages,
    selectConversation,
    startNewConversation,
    clearMessages,
    sidebarOpen,
    setSidebarOpen,
    refreshKey,
  };
}
