export interface Contact {
  name: string;
  address: string;
  createdAt: number;
  lastUsed: number | null;
}

function storageKey(walletPubkey: string): string {
  return `afx_contacts_${walletPubkey}`;
}

export function getContacts(walletPubkey: string): Contact[] {
  try {
    const raw = localStorage.getItem(storageKey(walletPubkey));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addContact(walletPubkey: string, name: string, address: string): Contact {
  const contacts = getContacts(walletPubkey);

  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    throw new Error('Invalid Solana address');
  }

  const normalized = name.trim().toLowerCase();
  const existing = contacts.find(c => c.name.toLowerCase() === normalized);
  if (existing) {
    existing.address = address;
    localStorage.setItem(storageKey(walletPubkey), JSON.stringify(contacts));
    return existing;
  }

  const contact: Contact = {
    name: name.trim(),
    address,
    createdAt: Date.now(),
    lastUsed: null,
  };
  contacts.push(contact);
  localStorage.setItem(storageKey(walletPubkey), JSON.stringify(contacts));
  return contact;
}

export function removeContact(walletPubkey: string, name: string): boolean {
  const contacts = getContacts(walletPubkey);
  const normalized = name.trim().toLowerCase();
  const idx = contacts.findIndex(c => c.name.toLowerCase() === normalized);
  if (idx === -1) return false;
  contacts.splice(idx, 1);
  localStorage.setItem(storageKey(walletPubkey), JSON.stringify(contacts));
  return true;
}

export function renameContact(walletPubkey: string, oldName: string, newName: string): boolean {
  const contacts = getContacts(walletPubkey);
  const c = contacts.find(x => x.name.toLowerCase() === oldName.trim().toLowerCase());
  if (!c) return false;
  c.name = newName.trim();
  localStorage.setItem(storageKey(walletPubkey), JSON.stringify(contacts));
  return true;
}

export function resolveContact(walletPubkey: string, nameOrAddress: string): Contact | null {
  const contacts = getContacts(walletPubkey);
  const input = nameOrAddress.trim().toLowerCase();

  let match = contacts.find(c => c.name.toLowerCase() === input);
  if (match) return match;

  match = contacts.find(c => c.name.toLowerCase().startsWith(input));
  if (match) return match;

  match = contacts.find(c => c.address === nameOrAddress.trim());
  if (match) return match;

  return null;
}

export function markUsed(walletPubkey: string, name: string): void {
  const contacts = getContacts(walletPubkey);
  const c = contacts.find(x => x.name.toLowerCase() === name.trim().toLowerCase());
  if (c) {
    c.lastUsed = Date.now();
    localStorage.setItem(storageKey(walletPubkey), JSON.stringify(contacts));
  }
}
