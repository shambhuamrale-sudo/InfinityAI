import { motion } from 'framer-motion'

export default function BackgroundEffects() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ x: ['-6%', '8%', '-4%'], y: ['-8%', '6%', '-6%'] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-[-8%] top-[-10%] h-[24rem] w-[24rem] rounded-full bg-indigo-500/20 blur-[120px]"
      />
      <motion.div
        animate={{ x: ['8%', '-5%', '6%'], y: ['6%', '-8%', '4%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-12%] right-[-8%] h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-[140px]"
      />
      <motion.div
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(129,140,248,0.10),transparent_40%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.10),transparent_42%)]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
    </div>
  )
}
