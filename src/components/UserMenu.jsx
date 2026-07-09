import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LayoutGrid, Settings, CreditCard, ShieldCheck, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAppContext()

  return (
    <div className="fixed right-4 top-4 z-[60]">
      <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-3 rounded-full border border-white/10 bg-[#0B1120]/85 px-3 py-2 text-left shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-semibold text-white">{(user?.avatar || user?.name || 'A').slice(0, 2).toUpperCase()}</div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
          <p className="text-xs text-slate-400">{user?.email || ''}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-3 w-56 rounded-[1.4rem] border border-white/10 bg-[#0B1120]/95 p-3 shadow-[0_30px_120px_rgba(2,6,23,0.6)] backdrop-blur-xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
              <p className="mt-1 text-xs text-slate-400">{user?.email || ''}</p>
            </div>
            <div className="mt-3 space-y-1">
              <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"><LayoutGrid className="h-4 w-4" /> Dashboard</Link>
              <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"><Settings className="h-4 w-4" /> Settings</Link>
              <Link to="/subscription" onClick={() => { setOpen(false) }} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"><CreditCard className="h-4 w-4" /> Subscription</Link>
            </div>
            <button onClick={async () => { setOpen(false); await logout() }} className="mt-3 flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

