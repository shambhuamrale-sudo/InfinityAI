import { motion } from 'framer-motion'
import { Clock3, Sparkles } from 'lucide-react'

export default function ActivityFeed({ activity }) {
  const soft = 'glass'
  const muted = 'text-slate-400'
  const items = (activity && activity.length)
    ? activity.slice(0, 6)
    : [
        { title: 'Launch briefing', description: 'Ready to review', time: 'Just now' },
        { title: 'Product strategy', description: 'Refined yesterday', time: 'Yesterday' },
        { title: 'Support response', description: 'Saved to history', time: '2d ago' }
      ]

  return (
    <div className={`rounded-3xl border p-6 ${soft} backdrop-blur-xl`}>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Activity timeline</h3>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Synced</span>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <motion.div
            key={item.id || `${item.title}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="flex items-start gap-3 rounded-2xl px-2 py-3 transition hover:bg-white/5"
          >
            <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{item.title}</p>
              <p className="truncate text-xs text-slate-400">{item.description}</p>
            </div>
            <span className={`flex shrink-0 items-center gap-1 text-xs ${muted}`}><Clock3 className="h-3.5 w-3.5" />{item.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
