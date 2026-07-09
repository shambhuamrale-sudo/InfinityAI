import { motion } from 'framer-motion'
import { BellRing } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import { useAppContext } from '../context/AppContext'

export default function NotificationsPage() {
  const { notifications } = useAppContext()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-5 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Notifications</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Stay updated with your workspace.</h1>
            </div>
          </div>
        </motion.header>

        <div className="mt-6 grid gap-6">
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300"><BellRing className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold text-white">Your inbox</p>
                <p className="text-sm text-slate-400">Notifications are stored live in the app context and can be expanded later.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="rounded-[1.15rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{item.title}</p>
                    {item.unread ? <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300">Unread</span> : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.message}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
