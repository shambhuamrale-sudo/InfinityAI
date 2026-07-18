import { motion } from 'framer-motion'
import InfinityLogo from './InfinityLogo'

export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center app-canvas px-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass flex w-full max-w-xl flex-col items-center rounded-[2rem] px-8 py-12 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          className="mb-7"
        >
          <InfinityLogo size={52} />
        </motion.div>
        <h2 className="text-base font-semibold tracking-tight text-white">Loading InfinityAI</h2>
        <p className="mt-2 text-sm text-slate-400">Preparing your premium workspace…</p>
        <div className="mt-8 h-1 w-44 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full w-1/2 brand-gradient rounded-full"
            animate={{ x: ['-100%', '220%'] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  )
}
