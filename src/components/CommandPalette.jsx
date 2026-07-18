import { AnimatePresence, motion } from 'framer-motion'
import { Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext'

const commands = [
  { label: 'Open Dashboard', path: '/dashboard' },
  { label: 'Open AI Chat', path: '/chat' },
  { label: 'Open AI Image', path: '/image' },
  { label: 'Open Profile', path: '/profile' },
  { label: 'Open Settings', path: '/settings' },
  { label: 'Open Pricing', path: '/pricing' },
  { label: 'Open Admin', path: '/admin' }
]

export default function CommandPalette() {
  const { ui, setCommandPaletteOpen } = useAppContext()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandPaletteOpen(true)
      }
      if (event.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandPaletteOpen])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    return commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()))
  }, [query])

  const handleSelect = (path) => {
    navigate(path)
    setCommandPaletteOpen(false)
    setQuery('')
  }

  if (!ui.commandPaletteOpen) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/80 px-4 pt-20 backdrop-blur-xl">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="glass w-full max-w-2xl rounded-[1.6rem] p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
            <Search className="h-4 w-4 text-indigo-300" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Search or jump to a page" />
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">Ctrl K</div>
          </div>
          <div className="mt-4 space-y-2">
            {filtered.map((command) => (
              <button key={command.path} onClick={() => handleSelect(command.path)} className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left text-sm text-slate-300 transition hover:border-indigo-400/35 hover:bg-white/[0.07]">
                <span>{command.label}</span>
                <span className="text-indigo-300">↵</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Sparkles className="h-4 w-4 text-indigo-300" /> Fast access to launch-critical surfaces</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
