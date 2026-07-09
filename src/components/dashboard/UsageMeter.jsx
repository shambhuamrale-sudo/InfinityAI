import { motion } from 'framer-motion'
import { MessageSquareText, ImagePlus, DatabaseZap } from 'lucide-react'

function Meter({ icon: Icon, label, used, max, accent, index }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, max)) * 100))
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-300">
          <Icon className="h-4 w-4 text-indigo-300" /> {label}
        </span>
        <span className="font-medium text-white">{used}<span className="text-slate-500">/{max}</span></span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${accent}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, delay: 0.1 + index * 0.12, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export default function UsageMeter({ usage, planLimits, storageLimit = 100, isDark }) {
  const soft = isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white/70'
  const dayChats = usage?.dayChats || 0
  const dayImages = usage?.dayImages || 0
  const storageUsed = usage?.storageUsed || 0
  const maxChats = planLimits?.maxChatsPerDay || 20
  const maxImages = planLimits?.maxImagesPerDay || 5

  return (
    <div className={`rounded-3xl border p-6 ${soft} backdrop-blur-xl`}>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Usage health</h3>
        <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Balanced</span>
      </div>
      <div className="space-y-5">
        <Meter icon={MessageSquareText} label="Chats today" used={dayChats} max={maxChats} accent="from-indigo-500 to-fuchsia-500" index={0} />
        <Meter icon={ImagePlus} label="Images today" used={dayImages} max={maxImages} accent="from-cyan-500 to-indigo-500" index={1} />
        <Meter icon={DatabaseZap} label="Storage used" used={storageUsed} max={storageLimit} accent="from-fuchsia-500 to-violet-500" index={2} />
      </div>
    </div>
  )
}
