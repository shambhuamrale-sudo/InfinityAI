import { motion } from 'framer-motion'
import { Bot, Cpu, Cloud } from 'lucide-react'

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((d) => (
        <motion.span
          key={d}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: d * 0.18, ease: 'easeInOut' }}
          className="h-2 w-2 rounded-full bg-indigo-300 shadow-[0_0_10px_rgba(129,140,248,0.5)]"
        />
      ))}
    </div>
  )
}

export default function TypingIndicator({ provider, model, isLocal, localStatus, aiMode }) {
  const providerLabel = provider?.name || 'Cloud AI'
  const modelLabel = model?.name || 'Loading...'
  const showBadges = provider || model || aiMode

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex gap-3.5"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-indigo-300 ring-1 ring-white/10 shadow-[0_4px_16px_-6px_rgba(129,140,248,0.2)]">
        <Bot className="h-5 w-5" />
      </div>
      <div className="flex max-w-[78%] flex-col gap-2.5 rounded-3xl border border-white/8 bg-white/[0.05] px-5 py-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)]">
        <ThinkingDots />
        {showBadges && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2"
          >
            {isLocal ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-emerald-300 ring-1 ring-emerald-400/20">
                  <Cpu className="h-3 w-3" />
                  {providerLabel}
                </span>
                <span className="text-[0.65rem] text-slate-400">{modelLabel}</span>
                {localStatus && (
                  <span className="flex items-center gap-1 text-[0.65rem] text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {localStatus}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-400/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-indigo-300 ring-1 ring-indigo-400/20">
                  <Cloud className="h-3 w-3" />
                  {providerLabel}
                </span>
                <span className="text-[0.65rem] text-slate-400">{modelLabel}</span>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
