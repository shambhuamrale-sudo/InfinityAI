import { motion } from 'framer-motion'
import { Search, Download, Sparkles, MessageSquareText } from 'lucide-react'
import { useRef, useEffect } from 'react'
import ModelSelector from './ModelSelector'
import ProviderSelector from './ProviderSelector'

export default function ChatHeader({
  activeConversation,
  onNewChat,
  onToggleSearch,
  showSearch,
  onExport,
  showExportMenu,
  setShowExportMenu,
  onToggleSidebar,
  onToggleFavorite,
  isFavorite
}) {
  const exportRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setShowExportMenu])

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass mb-6 flex items-center justify-between gap-4 rounded-[1.75rem] px-5 py-4"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.05] text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <MessageSquareText className="h-5 w-5" />
        </button>
        <div className="hidden sm:grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">AI Chat</p>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            {activeConversation?.title || 'Ask anything. Get a premium response.'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <ProviderSelector />
        </div>
        <ModelSelector className="hidden sm:block w-44" />
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewChat}
          className="flex items-center gap-2 rounded-full brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </motion.button>

        <button
          onClick={onToggleSearch}
          className={`grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10 ${showSearch ? 'border-indigo-400/30 text-indigo-300' : ''}`}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10"
            aria-label="Export"
          >
            <Download className="h-4 w-4" />
          </button>
          {showExportMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute right-0 top-12 z-50 w-40 rounded-xl border border-white/10 bg-[#0a0c14]/95 p-1 shadow-2xl backdrop-blur-xl"
            >
              <button onClick={() => { onExport('md'); setShowExportMenu(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
                Markdown
              </button>
              <button onClick={() => { onExport('html'); setShowExportMenu(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
                HTML
              </button>
              <button onClick={() => { onExport('pdf'); setShowExportMenu(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
                PDF
              </button>
            </motion.div>
          )}
        </div>

        <button
          onClick={onToggleFavorite}
          className={`grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] transition hover:bg-white/10 ${isFavorite ? 'border-amber-400/30 text-amber-300' : 'text-slate-300'}`}
          aria-label="Favorite"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </motion.header>
  )
}
