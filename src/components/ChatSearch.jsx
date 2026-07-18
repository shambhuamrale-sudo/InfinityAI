import { useMemo, useState } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'

export default function ChatSearch({ messages, onClose }) {
  const [query, setQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState(-1)

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return messages.filter((m) => (m.content || '').toLowerCase().includes(q)).map((m) => ({ ...m, index: messages.indexOf(m) }))
  }, [messages, query])

  const goToPrev = () => {
    if (matches.length === 0) return
    setCurrentIndex((prev) => (prev <= 0 ? matches.length - 1 : prev - 1))
  }

  const goToNext = () => {
    if (matches.length === 0) return
    setCurrentIndex((prev) => (prev >= matches.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
      <Search className="h-4 w-4 shrink-0 text-slate-400" />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setCurrentIndex(-1) }}
        placeholder="Search conversation..."
        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        autoFocus
      />
      {matches.length > 0 && (
        <span className="text-xs text-slate-400">
          {currentIndex + 1}/{matches.length}
        </span>
      )}
      {matches.length > 0 && (
        <div className="flex items-center gap-0.5">
          <button onClick={goToPrev} className="rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Previous match">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button onClick={goToNext} className="rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Next match">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
      <button onClick={onClose} className="rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close search">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
