import { motion } from "framer-motion";
import { BookUser, Send, Copy, Check, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Contact } from "@/services/contactsService";

interface ContactsCardProps {
  contacts: Contact[];
  onSendMessage?: (msg: string) => void;
}

export function ContactsCard({ contacts, onSendMessage }: ContactsCardProps) {
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const sorted = [...contacts].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm rounded-xl overflow-hidden"
      style={{ background: '#111520', border: '1px solid #1B2030' }}
      data-testid="card-contacts"
    >
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1B2030' }}>
        <div className="flex items-center gap-2">
          <BookUser className="h-4 w-4" style={{ color: '#E6EDF3' }} />
          <span className="text-title3">Contacts</span>
        </div>
        <span className="text-footnote" style={{ color: '#6B7280' }}>{contacts.length}</span>
      </div>

      <div className="px-5 py-3 space-y-1">
        {sorted.map(c => (
          <div
            key={c.address}
            className="flex items-center justify-between py-2.5 border-b last:border-b-0"
            style={{ borderColor: '#1B2030' }}
            data-testid={`contact-row-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-body-emphasis truncate" style={{ color: '#E6EDF3' }}>{c.name}</p>
              <p className="text-footnote" style={{ color: '#6B7280' }}>
                {c.address.slice(0, 6)}...{c.address.slice(-4)}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-3 shrink-0">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('afx-prefill-chat', { detail: `send SOL to ${c.name}` }));
                }}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: '#9BA4AE' }}
                data-testid={`button-send-to-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                title={`Send to ${c.name}`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => copyAddress(c.address)}
                className="p-1.5 rounded-md transition-colors"
                data-testid={`button-copy-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                title="Copy address"
              >
                {copiedAddr === c.address
                  ? <Check className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
                  : <Copy className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                }
              </button>
              <button
                onClick={() => onSendMessage?.(`delete contact ${c.name}`)}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: '#6B7280' }}
                data-testid={`button-delete-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                title={`Remove ${c.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
