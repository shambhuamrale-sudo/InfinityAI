import { motion } from 'framer-motion'

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ x: ['-10%', '10%', '-10%'], y: ['0%', '8%', '0%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-[-8%] top-[-10%] h-60 w-60 rounded-full bg-fuchsia-500/30 blur-3xl"
      />
      <motion.div
        animate={{ x: ['8%', '-5%', '8%'], y: ['10%', '-8%', '10%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-10%] right-[-5%] h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl"
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_25%),radial-gradient(circle_at_80%_30%,rgba(96,165,250,0.18),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(192,132,252,0.18),transparent_25%)]"
      />
    </div>
  )
}
