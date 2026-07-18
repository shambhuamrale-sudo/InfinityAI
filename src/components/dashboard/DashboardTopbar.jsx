import { motion } from 'framer-motion'
import { Search, RadioTower, MoonStar, SunMedium, Bell, Sparkles } from 'lucide-react'
import { useAppContext } from '../../context/useAppContext'

export default function DashboardTopbar({ title, subtitle, isDark }) {
  const { adminConfig, preferences, updatePreferences, setCommandPaletteOpen, setNotificationsOpen, notifications } = useAppContext()
  const provider = adminConfig?.providerConfig?.chatProvider || 'ollama'
  const unread = (notifications || []).filter((n) => n.unread).length
  const muted = 'text-slate-400'
  const soft = 'bg-white/[0.04] border-white/10'
  const inputCls = 'bg-white/[0.04] text-white placeholder:text-slate-500'

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 backdrop-blur-2xl sm:px-7"
      style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)' }}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">{subtitle || 'Workspace'}</p>
        <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{title}</h1>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <label className={`hidden items-center gap-2 rounded-full border px-4 py-2.5 text-sm md:flex ${soft}`}>
          <Search className={`h-4 w-4 ${muted}`} />
          <input className={`w-28 bg-transparent outline-none sm:w-44 ${inputCls}`} placeholder="Search workspace" />
          <kbd className={`ml-1 hidden rounded-md border px-1.5 py-0.5 text-[10px] ${muted} sm:inline`}>⌘K</kbd>
        </label>

        <div className={`hidden items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-medium lg:flex ${soft} ${muted}`}>
          <RadioTower className="h-4 w-4 text-indigo-300" />
          <span className="capitalize">{provider}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
        </div>

        <button
          onClick={() => updatePreferences({ darkMode: !preferences?.darkMode })}
          aria-label="Toggle theme"
          className={`grid h-11 w-11 place-items-center rounded-full border transition hover:scale-105 ${soft} ${muted}`}
        >
          {isDark ? <MoonStar className="h-[18px] w-[18px]" /> : <SunMedium className="h-[18px] w-[18px]" />}
        </button>

        <button
          onClick={() => setNotificationsOpen(true)}
          aria-label="Notifications"
          className={`relative grid h-11 w-11 place-items-center rounded-full border transition hover:scale-105 ${soft} ${muted}`}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </button>

        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(129,140,248,0.35)] transition hover:-translate-y-0.5"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>
    </motion.header>
  )
}
