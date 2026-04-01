import { nanoid } from 'nanoid';

export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  preview: string;
}

const MANIFEST_KEY = 'afx_conversations';
const MSG_PREFIX = 'afx_msgs_';

function walletManifestKey(wallet: string): string {
  return `${MANIFEST_KEY}_${wallet}`;
}

function msgKey(wallet: string, conversationId: string): string {
  return `${MSG_PREFIX}${wallet}_${conversationId}`;
}

export function getConversationList(wallet: string): ConversationMeta[] {
  try {
    const raw = localStorage.getItem(walletManifestKey(wallet));
    if (!raw) return [];
    return JSON.parse(raw).sort((a: ConversationMeta, b: ConversationMeta) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function getMessages(wallet: string, conversationId: string): any[] {
  try {
    const raw = localStorage.getItem(msgKey(wallet, conversationId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMessages(wallet: string, conversationId: string, messages: any[]) {
  try {
    localStorage.setItem(msgKey(wallet, conversationId), JSON.stringify(messages));
    const list = getConversationList(wallet);
    const idx = list.findIndex(c => c.id === conversationId);
    const lastMsg = messages[messages.length - 1];
    const existingTitle = list[idx]?.title;
    const needsAutoTitle = !existingTitle || existingTitle === 'New conversation';
    const meta: ConversationMeta = {
      id: conversationId,
      title: needsAutoTitle ? autoTitle(messages) : existingTitle,
      createdAt: list[idx]?.createdAt || Date.now(),
      updatedAt: Date.now(),
      messageCount: messages.length,
      preview: lastMsg ? (lastMsg.content || '').slice(0, 80) : '',
    };
    if (idx >= 0) list[idx] = meta; else list.unshift(meta);
    localStorage.setItem(walletManifestKey(wallet), JSON.stringify(list));
  } catch {}
}

export function createConversation(wallet: string): string {
  const id = nanoid();
  saveMessages(wallet, id, []);
  return id;
}

export function deleteConversation(wallet: string, id: string) {
  try {
    localStorage.removeItem(msgKey(wallet, id));
    const list = getConversationList(wallet).filter(c => c.id !== id);
    localStorage.setItem(walletManifestKey(wallet), JSON.stringify(list));
  } catch {}
}

export function renameConversation(wallet: string, id: string, title: string) {
  try {
    const list = getConversationList(wallet);
    const c = list.find(c => c.id === id);
    if (c) { c.title = title; }
    localStorage.setItem(walletManifestKey(wallet), JSON.stringify(list));
  } catch {}
}

function autoTitle(messages: any[]): string {
  const first = messages.find((m: any) => m.role === 'user');
  if (!first) return 'New conversation';
  let text = (first.content || '').trim();
  if (!text) return 'New conversation';
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return text.length > 40 ? text.slice(0, 40).trimEnd() + '...' : text;
}

export function migrateOldConversation(wallet: string): string | null {
  try {
    const oldKey = `afx_chat_${wallet}`;
    const raw = localStorage.getItem(oldKey);
    if (!raw) return null;
    const messages = JSON.parse(raw);
    if (!Array.isArray(messages) || messages.length === 0) return null;
    const id = nanoid();
    saveMessages(wallet, id, messages);
    localStorage.removeItem(oldKey);
    return id;
  } catch {
    return null;
  }
}
