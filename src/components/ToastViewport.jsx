import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useAppContext } from '../context/useAppContext'

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
}

export default function ToastViewport() {
  const { toasts, dismissToast } = useAppContext()

  return (
    <div className="fixed right-4 top-4 z-[95] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.kind] || Info
          return (
            <motion.div key={toast.id} initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} className="glass rounded-[1.2rem] p-4">
              <div className="flex items-start gap-3">
                <div className={`rounded-2xl border p-2 ${toast.kind === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : toast.kind === 'error' ? 'border-rose-400/20 bg-rose-400/10 text-rose-300' : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{toast.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{toast.message}</p>
                </div>
                <button onClick={() => dismissToast(toast.id)} className="text-sm text-slate-500 transition hover:text-white">×</button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
