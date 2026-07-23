import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Pin, Star, Clock, MoreVertical, Pencil, Archive, Trash2, CopyPlus, FileText, FileType, X, Settings, MessageSquareText, Sparkles, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext'

const MENU_ANIMATION = {
  initial: { opacity: 0, scale: 0.95, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -4 },
  transition: { duration: 0.15, ease: 'easeOut' }
}

function ConversationItem({ conversation, isActive, onSelect, onRename, onPin, onArchive, onDelete, onDuplicate, onExport, onRestore }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-white/[0.08] border border-white/10 shadow-[0_0_20px_-8px_rgba(129,140,248,0.3)]'
          : 'border border-transparent hover:bg-white/[0.05] hover:border-white/8'
      }`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
        isActive ? 'bg-white/10 text-indigo-300 scale-105' : 'bg-white/5 text-slate-400 group-hover:bg-white/[0.07] group-hover:text-slate-300'
      }`}>
        <MessageSquareText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-200'}`}>
          {conversation.title || 'Untitled'}
        </p>
        <p className="truncate text-xs text-slate-500">
          {new Date(conversation.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
        {conversation.pinned && <Pin className="h-3.5 w-3.5 text-indigo-300" />}
        {conversation.favorite && <Star className="h-3.5 w-3.5 text-amber-300" />}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Conversation options"
            tabIndex={0}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                {...MENU_ANIMATION}
                className="absolute right-0 top-8 z-50 w-48 rounded-xl border border-white/10 bg-[#0a0c14]/95 p-1 shadow-2xl backdrop-blur-xl"
                role="menu"
              >
                <button onClick={() => { onRename(conversation); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white" role="menuitem">
                  <Pencil className="h-4 w-4" /> Rename
                </button>
                <button onClick={() => { onPin(conversation.id); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white" role="menuitem">
                  <Pin className="h-4 w-4" /> {conversation.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => { onArchive(conversation.id); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white" role="menuitem">
                  <Archive className="h-4 w-4" /> {conversation.archived ? 'Unarchive' : 'Archive'}
                </button>
                <button onClick={() => { onDuplicate(conversation.id); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white" role="menuitem">
                  <CopyPlus className="h-4 w-4" /> Duplicate
                </button>
                <button onClick={() => { onExport('md'); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white" role="menuitem">
                  <FileText className="h-4 w-4" /> Export Markdown
                </button>
                <button onClick={() => { onExport('html'); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white" role="menuitem">
                  <FileType className="h-4 w-4" /> Export HTML
                </button>
                {conversation.archived && onRestore && (
                  <>
                    <div className="my-1 h-px bg-white/10" />
                    <button onClick={() => { onRestore(conversation.id); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-emerald-300 transition hover:bg-white/10 hover:text-emerald-200" role="menuitem">
                      <ChevronRight className="h-4 w-4 rotate-180" /> Restore
                    </button>
                  </>
                )}
                <div className="my-1 h-px bg-white/10" />
                <button onClick={() => { onDelete(conversation.id); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-white/10 hover:text-red-300" role="menuitem">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default function PremiumSidebar({
  conversations,
  conversationId,
  onSelectConversation,
  onNewChat,
  onRename,
  onPin,
  onArchive,
  onDelete,
  onDuplicate,
  onExport,
  onClose,
  onRestore
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const { user } = useAppContext()

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value)
  }, [])

  const filteredConversations = useMemo(() => {
    if (!conversations || conversations.length === 0) return []
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(c => (c.title || '').toLowerCase().includes(q))
  }, [conversations, searchQuery])

  const pinned = useMemo(() => filteredConversations.filter(c => c.pinned), [filteredConversations])
  const favorites_ = useMemo(() => filteredConversations.filter(c => c.favorite && !c.pinned), [filteredConversations])
  const recent = useMemo(() => filteredConversations.filter(c => !c.pinned && !c.favorite && !c.archived), [filteredConversations])
  const archived = useMemo(() => filteredConversations.filter(c => c.archived), [filteredConversations])

  

  const hasSearch = searchQuery.trim().length > 0

  const renderSection = (title, items, icon, emptyMsg) => (
    <div className="mb-5">
      {items.length > 0 && (
        <div className="mb-2 flex items-center gap-2 px-1">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</span>
        </div>
      )}
      <div className="space-y-1">
        {items.length === 0 && !hasSearch && (
          <p className="px-3 py-2 text-xs text-slate-600">{emptyMsg}</p>
        )}
        <AnimatePresence mode="popLayout">
          {items.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === conversationId}
              onSelect={onSelectConversation}
              onRename={onRename}
              onPin={onPin}
              onArchive={onArchive}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onExport={onExport}
              onRestore={onRestore}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex h-full flex-col"
    >
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl brand-gradient text-white shadow-[0_8px_30px_-8px_rgba(129,140,248,0.5)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">InfinityAI</h2>
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">AI Chat</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-2xl brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_16px_48px_-12px_rgba(129,140,248,0.7)] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </motion.button>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2.5 transition-all duration-200 focus-within:border-indigo-400/40 focus-within:bg-white/[0.05]">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            aria-label="Search conversations"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Clear search">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {renderSection('Pinned', pinned, <Pin className="h-3.5 w-3.5 text-indigo-300" />, 'No pinned conversations')}
        {renderSection('Favorites', favorites_, <Star className="h-3.5 w-3.5 text-amber-300" />, 'No favorite conversations')}
        {renderSection('Recent', recent, <Clock className="h-3.5 w-3.5 text-slate-400" />, 'No recent conversations')}
      </div>

      {archived.length > 0 && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-xs text-slate-400 transition hover:text-white"
            aria-expanded={showArchived}
          >
            <Archive className="h-3.5 w-3.5" />
            {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
          </button>
        </div>
      )}

      <div className="border-t border-white/8 px-4 pt-4 pb-2">
        <Link to="/settings" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 hover:bg-white/5 group" tabIndex={0}>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white transition group-hover:scale-105">
            {(user?.avatar || user?.name || 'I').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name || 'User'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
          </div>
          <Settings className="h-4 w-4 text-slate-500 transition group-hover:text-slate-300" />
        </Link>
      </div>
    </motion.div>
  )
}
