import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, X } from 'lucide-react'
import { useAppContext } from '../context/useAppContext'

export default function NotificationsCenter() {
  const { ui, setNotificationsOpen, notifications } = useAppContext()
  if (!ui.notificationsOpen) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[65] bg-slate-950/70 backdrop-blur-sm">
        <motion.div initial={{ x: 16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 16, opacity: 0 }} className="glass absolute right-4 top-4 w-full max-w-md rounded-[1.6rem] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white"><BellRing className="h-4 w-4 text-indigo-300" /> <h3 className="text-lg font-semibold">Notifications</h3></div>
            <button onClick={() => setNotificationsOpen(false)} className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{item.title}</p>
                  {item.unread ? <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300">New</span> : null}
                </div>
                <p className="mt-2 text-sm text-slate-400">{item.message}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
