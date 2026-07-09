import { motion } from 'framer-motion'

export default function BackgroundEffects() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ x: ['-10%', '12%', '-8%'], y: ['-12%', '10%', '-10%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-[-8%] top-[-10%] h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl"
      />
      <motion.div
        animate={{ x: ['10%', '-6%', '8%'], y: ['8%', '-12%', '6%'] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-12%] right-[-8%] h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl"
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(139,92,246,0.14),transparent_24%)]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
    </div>
  )
}
