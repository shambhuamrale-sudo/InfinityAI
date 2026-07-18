import { motion } from 'framer-motion'

export default function PremiumButton({ children, variant = 'primary', className = '', ...props }) {
  const base = 'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-50'
  const variants = {
    primary: 'brand-gradient text-white shadow-[0_14px_44px_-12px_rgba(129,140,248,0.6)] hover:shadow-[0_20px_60px_-12px_rgba(168,85,247,0.7)] hover:brightness-110',
    secondary: 'hairline bg-white/[0.04] text-slate-100 backdrop-blur-xl hover:bg-white/[0.08]',
    ghost: 'bg-transparent text-slate-300 hover:text-white'
  }

  return (
    <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} className={`${base} ${variants[variant]} ${className}`} {...props}>
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_45%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
