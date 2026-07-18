import { motion } from 'framer-motion'
import { MessageSquareText, Search, Pin, Archive, Trash2, Pencil, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import EmptyState from '../components/EmptyState'
import { useAppContext } from '../context/useAppContext'

export default function ChatHistoryPage() {
  const { conversations: ctxConversations, updateConversation, deleteConversation } = useAppContext()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const allConversations = useMemo(() => {
    return (ctxConversations || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [ctxConversations])

  const filtered = useMemo(() => {
    let list = allConversations
    if (filter === 'pinned') list = list.filter((c) => c.pinned)
    else if (filter === 'archived') list = list.filter((c) => c.archived)
    else if (filter === 'active') list = list.filter((c) => !c.archived)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((c) => {
        const msgText = (c.messages || []).map((m) => m.content).join(' ').toLowerCase()
        return (c.title || '').toLowerCase().includes(q) || msgText.includes(q)
      })
    }
    return list
  }, [allConversations, query, filter])

  const handleRename = async (conv) => {
    const newTitle = prompt('Enter new title:', conv.title)
    if (newTitle && newTitle.trim()) {
      await updateConversation(conv.id, { title: newTitle.trim() })
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(id)
    }
  }

  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass flex flex-col gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Chat History</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Every conversation, preserved.</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-full border border-white/8 bg-white/[0.04] p-1">
              {['all', 'active', 'pinned', 'archived'].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? 'brand-gradient text-white' : 'text-slate-300 hover:text-white'}`}>{f}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition focus-within:border-indigo-400/40">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search conversations"
                placeholder="Search conversations"
                className="w-44 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 sm:w-56"
              />
              {query && <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>}
            </div>
          </div>
        </motion.header>

        <GlassPanel className="mt-6 p-5">
          {filtered.length ? (
            <div className="space-y-3">
              {filtered.map((chat, i) => (
                <motion.div key={chat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {chat.pinned && <Pin className="h-4 w-4 shrink-0 text-indigo-300" />}
                        {chat.archived && <Archive className="h-4 w-4 shrink-0 text-amber-300" />}
                        <p className="font-semibold text-white">{chat.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-400 line-clamp-2">{(chat.messages || []).length > 0 ? (chat.messages[chat.messages.length - 1].content || 'Empty conversation') : 'Empty conversation'}</p>
                      <p className="mt-1.5 text-xs text-slate-500">{new Date(chat.updatedAt).toLocaleString()} {(chat.messages || []).length} messages</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleRename(chat)} className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Rename"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(chat.id)} className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-red-400" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : allConversations.length ? (
            <EmptyState icon={Search} title="No matches found" description="Try a different keyword or filter to find the conversation you're looking for." />
          ) : (
            <EmptyState icon={MessageSquareText} title="No chat history yet" description="Start a conversation in AI Chat and your threads will be saved here for easy review." />
          )}
        </GlassPanel>
      </div>
    </div>
  )
}