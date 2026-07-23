import { useMemo, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'

export default function ChatSearch({ messages, onClose }) {
  const [query, setQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState(-1)

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return messages.filter((m) => (m.content || '').toLowerCase().includes(q)).map((m) => ({ ...m, index: messages.indexOf(m) }))
  }, [messages, query])

  const goToPrev = useCallback(() => {
    if (matches.length === 0) return
    setCurrentIndex((prev) => (prev <= 0 ? matches.length - 1 : prev - 1))
  }, [matches.length])

  const goToNext = useCallback(() => {
    if (matches.length === 0) return
    setCurrentIndex((prev) => (prev >= matches.length - 1 ? 0 : prev + 1))
  }, [matches.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && !e.shiftKey) {
        if (e.metaKey || e.ctrlKey) {
          if (currentIndex > 0) goToPrev()
          else goToNext()
        } else {
          goToNext()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, currentIndex, goToPrev, goToNext])

  useEffect(() => {
    setCurrentIndex(matches.length > 0 ? 0 : -1)
  }, [query, matches.length])

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl"
    >
      <Search className="h-4 w-4 shrink-0 text-slate-400" />
      <div className="flex-1 relative">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setCurrentIndex(-1) }}
          placeholder="Search conversation..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          autoFocus
        />
      </div>
      {matches.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 tabular-nums">
            {currentIndex + 1}/{matches.length}
          </span>
          <div className="flex items-center gap-0.5">
            <button onClick={goToPrev} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Previous match">
              <ChevronUp className="h-4 w-4" />
            </button>
            <button onClick={goToNext} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Next match">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {matches.length > 0 && (
        <span className="text-[0.65rem] px-2 py-1 rounded-full bg-indigo-400/10 text-indigo-300 font-medium">
          {matches.length} found
        </span>
      )}
      <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close search">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
