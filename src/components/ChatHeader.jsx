import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Sparkles, MessageSquareText, Cloud, Cpu } from 'lucide-react'
import { useRef, useEffect, useState, useCallback } from 'react'
import ModelSelector from './ModelSelector'
import ProviderSelector from './ProviderSelector'
import { useAppContext } from '../context/useAppContext'

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
  const { aiMode, setAIMode, fetchAIModeStatus } = useAppContext()
  const [localMenuOpen, setLocalMenuOpen] = useState(false)
  const localMenuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setShowExportMenu])

  useEffect(() => {
    const handler = (e) => { if (localMenuRef.current && !localMenuRef.current.contains(e.target)) setLocalMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleModeChange = useCallback(async (mode) => {
    await setAIMode(mode)
    setLocalMenuOpen(false)
    setTimeout(fetchAIModeStatus, 500)
  }, [setAIMode, fetchAIModeStatus])

  const isLocal = aiMode?.mode === 'local'
  const localAvailable = aiMode?.localAvailable
  const localStatus = aiMode?.localStatus

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex items-center justify-between gap-4 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] px-5 py-4 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_70px_-30px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.04] text-slate-300 ring-1 ring-white/10 transition-all duration-200 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 lg:hidden"
          aria-label="Toggle sidebar"
          tabIndex={0}
        >
          <MessageSquareText className="h-5 w-5" />
        </button>
        <div className="hidden sm:grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04] text-indigo-300 ring-1 ring-white/10">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-300 font-semibold">AI Chat</p>
          <h1 className="text-lg font-semibold tracking-tight text-white truncate max-w-[200px] sm:max-w-none">
            {activeConversation?.title || 'Ask anything. Get a premium response.'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
        <div className="relative" ref={localMenuRef}>
          <button
            type="button"
            onClick={() => setLocalMenuOpen((v) => !v)}
            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-all duration-200 ${
              isLocal ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-white/8 bg-white/[0.04] text-white hover:bg-white/[0.07]'
            }`}
            aria-haspopup="listbox"
            aria-expanded={localMenuOpen}
            tabIndex={0}
          >
            {isLocal ? <Cpu className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
            <span className="min-w-0 flex-1 truncate text-left font-medium">{isLocal ? 'Local AI' : 'Cloud AI'}</span>
            {isLocal && localAvailable && <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
            {isLocal && !localAvailable && <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />}
          </button>
          <AnimatePresence>
            {localMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="absolute z-50 mt-2 w-56 max-w-[85vw] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0c14]/95 p-2 shadow-2xl backdrop-blur-xl"
                role="listbox"
              >
                <button
                  type="button"
                  onClick={() => handleModeChange('cloud')}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                    !isLocal ? 'bg-white/[0.08] text-white' : 'text-slate-300 hover:bg-white/[0.05]'
                  }`}
                  role="option"
                  aria-selected={!isLocal}
                >
                  <Cloud className="h-4 w-4 text-indigo-300" />
                  <span className="flex-1 truncate font-medium">Cloud AI</span>
                  {!isLocal && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('local')}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                    isLocal ? 'bg-white/[0.08] text-white' : 'text-slate-300 hover:bg-white/[0.05]'
                  }`}
                  role="option"
                  aria-selected={isLocal}
                >
                  <Cpu className="h-4 w-4 text-emerald-300" />
                  <span className="flex-1 truncate font-medium">Local AI</span>
                  {isLocal && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                </button>
                {isLocal && (
                  <div className="mt-1 rounded-xl border border-white/8 bg-white/[0.03] p-2.5 text-xs text-slate-400">
                    <p className="font-semibold text-white">Local AI Status</p>
                    <p className="mt-1">{localAvailable ? `Running via ${localStatus || 'local provider'}` : 'Local AI is unavailable. Continue with Cloud or open Local AI Manager.'}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => { setLocalMenuOpen(false); window.location.href = '/local-ai' }} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 transition hover:bg-white/10">Local AI Manager</button>
                      <button onClick={() => handleModeChange('cloud')} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 transition hover:bg-white/10">Use Cloud</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="hidden md:block">
          <ProviderSelector />
        </div>
        <ModelSelector className="hidden sm:block w-44" />
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewChat}
          className="flex items-center gap-2 rounded-full brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_16px_48px_-12px_rgba(129,140,248,0.7)] active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </motion.button>

        <button
          onClick={onToggleSearch}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all duration-200 hover:bg-white/10 hover:scale-105 active:scale-95 ${showSearch ? 'border-indigo-400/30 text-indigo-300' : ''}`}
          aria-label="Search"
          tabIndex={0}
        >
          <Search className="h-4 w-4" />
        </button>

        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all duration-200 hover:bg-white/10 hover:scale-105 active:scale-95"
            aria-label="Export"
            tabIndex={0}
          >
            <Download className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 z-50 w-40 rounded-xl border border-white/10 bg-[#0a0c14]/95 p-1 shadow-2xl backdrop-blur-xl"
              >
                <button onClick={() => { onExport('md'); setShowExportMenu(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white" role="menuitem">
                  Markdown
                </button>
                <button onClick={() => { onExport('html'); setShowExportMenu(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white" role="menuitem">
                  HTML
                </button>
                <button onClick={() => { onExport('pdf'); setShowExportMenu(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white" role="menuitem">
                  PDF
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={onToggleFavorite}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-200 hover:bg-white/10 hover:scale-105 active:scale-95 ${isFavorite ? 'border-amber-400/30 text-amber-300' : 'text-slate-300'}`}
          aria-label="Favorite"
          tabIndex={0}
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </motion.header>
  )
}
