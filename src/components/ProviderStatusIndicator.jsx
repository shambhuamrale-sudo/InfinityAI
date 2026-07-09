import { motion } from 'framer-motion'
import { CircleDashed, CircleDot } from 'lucide-react'
import TooltipBubble from './TooltipBubble'

export default function ProviderStatusIndicator({ provider = 'ollama', status = 'healthy', className = '' }) {
  const isHealthy = status === 'healthy'
  return (
    <TooltipBubble label={`${provider} • ${status}`}>
      <motion.div whileHover={{ y: -2, scale: 1.01 }} className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 backdrop-blur-xl ${className}`}>
        {isHealthy ? <CircleDot className="h-4 w-4 text-emerald-300" /> : <CircleDashed className="h-4 w-4 text-amber-300" />}
        <span className="hidden sm:inline">{provider}</span>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{status}</span>
      </motion.div>
    </TooltipBubble>
  )
}
