import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Settings, CreditCard, LogOut, User, Bell, History, Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const { user, logout, preferences, updatePreferences } = useAppContext()
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false)
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const isDark = preferences?.darkMode !== false
  const initials = (user?.avatar || user?.name || 'I').slice(0, 2).toUpperCase()

  return (
    <div className="fixed right-4 top-4 z-[60]" ref={menuRef}>
      <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pl-1.5 pr-3 text-left shadow-[0_14px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08]">
        <div className="grid h-9 w-9 place-items-center rounded-full brand-gradient text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-tight text-white">{user?.name || 'User'}</p>
          <p className="text-xs leading-tight text-slate-400">{user?.email || ''}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.15 }} className="glass absolute right-0 mt-3 w-64 origin-top-right rounded-[1.4rem] p-2">
            <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
              <div className="grid h-10 w-10 place-items-center rounded-full brand-gradient text-sm font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.name || 'User'}</p>
                <p className="truncate text-xs text-slate-400">{user?.email || ''}</p>
              </div>
            </div>
            <div className="mt-1 space-y-0.5">
              <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"><User className="h-4 w-4" /> My Profile</Link>
              <Link to="/notifications" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"><Bell className="h-4 w-4" /> Notifications</Link>
              <Link to="/chat-history" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"><History className="h-4 w-4" /> Activity / History</Link>
              <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"><Settings className="h-4 w-4" /> Settings</Link>
              <Link to="/subscription" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"><CreditCard className="h-4 w-4" /> Subscription</Link>
              <button onClick={() => { updatePreferences({ darkMode: !isDark }); setOpen(false) }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {isDark ? 'Light Mode' : 'Dark Mode'}</button>
            </div>
            <div className="mt-1 border-t border-white/8 pt-1">
              <button onClick={async () => { setOpen(false); await logout() }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
