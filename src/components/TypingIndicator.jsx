import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-indigo-300 ring-1 ring-white/10">
        <Bot className="h-5 w-5" />
      </div>
      <div className="flex items-center gap-2 rounded-3xl border border-white/8 bg-white/[0.04] px-5 py-4">
        {[0, 1, 2].map((d) => (
          <motion.span
            key={d}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2, ease: 'easeInOut' }}
            className="h-2.5 w-2.5 rounded-full bg-indigo-300 shadow-[0_0_8px_rgba(129,140,248,0.5)]"
          />
        ))}
      </div>
    </motion.div>
  )
}
