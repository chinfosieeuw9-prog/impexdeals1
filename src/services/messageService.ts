import { Message, ConversationSummary, MessageAttachment } from '../types/message';
import { getCurrentUser } from './authService';

const LS_KEY = 'impex_messages_v1';
let messages: Message[] = [];
type Listener = () => void;
const listeners: Listener[] = [];
type TypingListener = () => void;
const typingListeners: TypingListener[] = [];
interface TypingState { fromUserId: number; toUserId: number; productId?: string; expiresAt: number; }
let typingStates: TypingState[] = [];

function load() {
  if (messages.length) return;
  try { const raw = localStorage.getItem(LS_KEY); if (raw) messages = JSON.parse(raw); } catch {}
}

function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(messages)); } catch {}
  // notify listeners
  listeners.forEach(l => { try { l(); } catch {} });
  try { window.dispatchEvent(new CustomEvent('impex:messages-updated')); } catch {}
}

function pruneTyping() {
  const now = Date.now();
  const before = typingStates.length;
  typingStates = typingStates.filter(t => t.expiresAt > now);
  if (before !== typingStates.length) typingListeners.forEach(l=>{ try { l(); } catch {} });
}

// Call this while user types. Duration extends a short window.
export function setTyping(toUserId: number, productId?: string) {
  const me = getCurrentUser(); if (!me) return;
  pruneTyping();
  const existing = typingStates.find(t => t.fromUserId===me.id && t.toUserId===toUserId && t.productId===productId);
  const exp = Date.now() + 2500; // 2.5s window
  if (existing) existing.expiresAt = exp; else typingStates.push({ fromUserId: me.id, toUserId, productId, expiresAt: exp });
  typingListeners.forEach(l=>{ try { l(); } catch {} });
}

export function getTypingForConversation(otherUserId: number, productId?: string): boolean {
  const me = getCurrentUser(); if (!me) return false;
  pruneTyping();
  return typingStates.some(t => t.toUserId===me.id && t.fromUserId===otherUserId && (productId? t.productId===productId : true));
}

export function subscribeTyping(cb: TypingListener) {
  typingListeners.push(cb);
  return () => { const i = typingListeners.indexOf(cb); if (i>=0) typingListeners.splice(i,1); };
}

export function sendMessage(toUserId: number, toUsername: string, body: string, productId?: string, attachments?: MessageAttachment[], quotedId?: string): Message | null {
  const me = getCurrentUser();
  if (!me) return null;
  load();
  // Voeg onderwerp + referentie toe aan eerste bericht van een conversatie (optioneel product-context)
  const convExists = messages.some(m => (m.fromUserId===me.id && m.toUserId===toUserId) || (m.toUserId===me.id && m.fromUserId===toUserId));
  if (!convExists) {
    const ref = 'REF-' + Date.now().toString(36).toUpperCase();
    const prefix = `[Catalogus bericht ${ref}]` + (productId? ` [Product:${productId}]`:'');
    if (!body.startsWith('[')) body = prefix + ' ' + body; // alleen prependeren als niet al prefix
  }
  const msg: Message = {
    id: crypto.randomUUID(),
    fromUserId: me.id,
    toUserId,
    fromUsername: me.username,
    toUsername,
    body,
    productId,
  createdAt: Date.now(),
  attachments: attachments && attachments.length ? attachments : undefined,
  quotedId
  };
  messages.push(msg);
  persist();
  return msg;
}

export function getConversation(otherUserId: number, productId?: string): Message[] {
  const me = getCurrentUser();
  if (!me) return [];
  load();
  return messages
    .filter(m => (
      (m.fromUserId === me.id && m.toUserId === otherUserId) ||
      (m.toUserId === me.id && m.fromUserId === otherUserId)
    ) && (productId ? m.productId === productId : true))
    .sort((a,b) => a.createdAt - b.createdAt);
}

export function getInbox(): ConversationSummary[] {
  const me = getCurrentUser();
  if (!me) return [];
  load();
  const map = new Map<string, ConversationSummary>();
  for (const m of messages) {
    if (m.fromUserId !== me.id && m.toUserId !== me.id) continue;
    const otherId = m.fromUserId === me.id ? m.toUserId : m.fromUserId;
    const otherName = m.fromUserId === me.id ? m.toUsername : m.fromUsername;
    const key = otherId + (m.productId ? ':' + m.productId : '');
    const entry = map.get(key) || { userId: otherId, username: otherName, lastMessage: '', lastAt: 0, unread: 0, productId: m.productId };
    if (m.createdAt > entry.lastAt) {
      entry.lastAt = m.createdAt;
      entry.lastMessage = (m.fromUserId === me.id ? 'Ik: ' : '') + m.body.slice(0, 80);
    }
    if (m.toUserId === me.id && !m.readAt) entry.unread += 1;
    map.set(key, entry);
  }
  return Array.from(map.values()).sort((a,b) => b.lastAt - a.lastAt);
}

export function markConversationRead(otherUserId: number, productId?: string) {
  const me = getCurrentUser();
  if (!me) return;
  load();
  let changed = false;
  for (const m of messages) {
    if (!m.readAt && m.toUserId === me.id && m.fromUserId === otherUserId && (!productId || m.productId === productId)) {
      m.readAt = Date.now();
      changed = true;
    }
  }
  if (changed) persist();
}

export function subscribeMessages(cb: Listener) {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx,1);
  };
}

export function deleteMessage(id: string) {
  load();
  const before = messages.length;
  messages = messages.filter(m => m.id !== id);
  if (messages.length !== before) persist();
}

export function restoreMessage(msg: Message) {
  load();
  // Avoid duplicates
  if (messages.find(m => m.id === msg.id)) return;
  messages.push(msg);
  persist();
}
