import { motion, AnimatePresence } from 'framer-motion'
import { X, Cpu, Palette, Clock } from 'lucide-react'

export default function GenerationStatus({ generating, progress, provider, model, statusText, onCancel, elapsed }) {
  return (
    <AnimatePresence>
      {generating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-soft rounded-[1.25rem] border border-white/10 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="h-8 w-8 rounded-full border-2 border-indigo-400/30 border-t-indigo-300"
              />
              <div>
                <p className="text-sm font-semibold text-white">Generating image</p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                  {provider && (
                    <span className="flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-indigo-300" /> {provider}
                    </span>
                  )}
                  {model && (
                    <span className="flex items-center gap-1">
                      <Palette className="h-3 w-3 text-fuchsia-300" /> {model}
                    </span>
                  )}
                  {elapsed > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-emerald-300" /> {elapsed.toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full brand-gradient"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          </div>
          {statusText && (
            <p className="mt-2 text-xs text-slate-400">{statusText}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
