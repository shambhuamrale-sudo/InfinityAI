import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function EmptyState({ title, description, actionLabel, onAction, icon: Icon = Sparkles }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center"
    >
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.04] text-indigo-300 ring-1 ring-white/10">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-slate-400">{description}</p>
      {actionLabel && onAction ? (
        <button onClick={onAction} className="mt-6 rounded-full brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110">
          {actionLabel}
        </button>
      ) : null}
    </motion.div>
  )
}
