import { motion } from 'framer-motion'
import { BellRing } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import EmptyState from '../components/EmptyState'
import { useAppContext } from '../context/useAppContext'

export default function NotificationsPage() {
  const { notifications } = useAppContext()

  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.75rem] p-5">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Notifications</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Stay updated with your workspace.</h1>
        </motion.header>

        <GlassPanel className="mt-6 p-5">
          {notifications.length ? (
            <div className="space-y-3">
              {notifications.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{item.title}</p>
                    {item.unread ? <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300">Unread</span> : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.message}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={BellRing} title="You're all caught up" description="New notifications about your workspace and activity will appear here." />
          )}
        </GlassPanel>
      </div>
    </div>
  )
}
