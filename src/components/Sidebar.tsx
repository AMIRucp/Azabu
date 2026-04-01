import { useState } from 'react';
import { Plus, Pencil, Trash2, AlignLeft, ChevronsLeft, ArrowRightLeft, Landmark } from 'lucide-react';
import {
  getConversationList,
  deleteConversation,
  renameConversation,
  type ConversationMeta,
} from '../services/conversationStorage';

interface SidebarProps {
  wallet: string;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  refreshKey: number;
  onOpenSwap?: () => void;
  onOpenLend?: () => void;
}

export function Sidebar({ wallet, activeId, onSelect, onNew, isOpen, onClose, collapsed, onToggleCollapse, refreshKey, onOpenSwap, onOpenLend }: SidebarProps) {
  const conversations = getConversationList(wallet);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [, forceUpdate] = useState(0);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const groups = {
    today: conversations.filter(c => c.updatedAt >= today.getTime()),
    yesterday: conversations.filter(c => c.updatedAt >= yesterday.getTime() && c.updatedAt < today.getTime()),
    older: conversations.filter(c => c.updatedAt < yesterday.getTime()),
  };

  function handleRename(id: string) {
    if (editTitle.trim()) {
      renameConversation(wallet, id, editTitle.trim());
    }
    setEditingId(null);
    forceUpdate(n => n + 1);
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteConversation(wallet, id);
    if (activeId === id) onNew();
    forceUpdate(n => n + 1);
  }

  function renderGroup(label: string, items: ConversationMeta[]) {
    if (items.length === 0) return null;
    return (
      <div key={label}>
        <div
          className="text-[11px] uppercase tracking-wider px-3 pt-4 pb-1"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {label}
        </div>
        {items.map(c => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => { onSelect(c.id); onClose(); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { onSelect(c.id); onClose(); } }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm group flex items-center gap-2 transition-colors min-h-[44px] cursor-pointer"
            style={{
              background: c.id === activeId ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: c.id === activeId ? '#E6EDF3' : 'rgba(255,255,255,0.5)',
            }}
            onMouseEnter={e => { if (c.id !== activeId) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (c.id !== activeId) e.currentTarget.style.background = 'transparent'; }}
            data-testid={`button-conversation-${c.id}`}
          >
            <AlignLeft className="w-3.5 h-3.5 shrink-0 opacity-40" />
            {editingId === c.id ? (
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => handleRename(c.id)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(c.id); if (e.key === 'Escape') setEditingId(null); }}
                onClick={e => e.stopPropagation()}
                className="bg-transparent outline-none text-sm w-full min-w-0"
                style={{ color: '#E6EDF3', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
                autoFocus
                data-testid={`input-rename-${c.id}`}
              />
            ) : (
              <>
                <span className="truncate flex-1 min-w-0">{c.title}</span>
                <div className="hidden group-hover:flex items-center shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setEditTitle(c.title); }}
                    className="p-2 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                    data-testid={`button-rename-${c.id}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(c.id, e)}
                    className="p-2 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                    data-testid={`button-delete-${c.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  const truncatedWallet = wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : '';

  const showMobileOverlay = isOpen;
  const desktopHidden = collapsed;

  return (
    <>
      {showMobileOverlay && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      <aside
        className={`z-40 h-full flex flex-col shrink-0 transition-all duration-300 ease-out overflow-hidden
          fixed md:relative
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          width: desktopHidden ? '0px' : '260px',
          minWidth: desktopHidden ? '0px' : '260px',
          background: '#0B0F14',
          borderRight: desktopHidden ? 'none' : '1px solid #1B2030',
        }}
        data-testid="sidebar"
      >
        <div
          className="flex flex-col h-full"
          style={{
            width: '260px',
            minWidth: '260px',
            opacity: desktopHidden ? 0 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          <div className="p-3 flex items-center gap-2">
            <button
              onClick={() => { onNew(); onClose(); }}
              className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px]"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              data-testid="button-new-chat"
            >
              <Plus className="w-4 h-4" />
              New chat
            </button>
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex items-center justify-center shrink-0 transition-all duration-200"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                color: 'rgba(255,255,255,0.25)',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.background = 'transparent';
              }}
              title="Collapse sidebar"
              data-testid="button-collapse-sidebar"
            >
              <ChevronsLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          <div className="px-3 pb-1 space-y-1">
            <button
              onClick={() => { onOpenSwap?.(); onClose(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full min-h-[40px]"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#E6EDF3'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              data-testid="button-open-swap"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Swap
            </button>
            <button
              onClick={() => { onOpenLend?.(); onClose(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full min-h-[40px]"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#E6EDF3'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              data-testid="button-open-lend"
            >
              <Landmark className="w-3.5 h-3.5" />
              Lend / Borrow
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
            {conversations.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
                No conversations yet
              </div>
            ) : (
              <>
                {renderGroup('Today', groups.today)}
                {renderGroup('Yesterday', groups.yesterday)}
                {renderGroup('Previous', groups.older)}
              </>
            )}
          </div>

          <div className="p-3" style={{ borderTop: '1px solid #1B2030' }}>
            <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {truncatedWallet}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
