import { motion } from 'framer-motion'

export default function PremiumButton({ children, variant = 'primary', className = '', ...props }) {
  const base = 'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300'
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_0_40px_rgba(99,102,241,0.25)] hover:shadow-[0_0_60px_rgba(99,102,241,0.35)]',
    secondary: 'border border-white/10 bg-white/5 text-slate-100 backdrop-blur-xl hover:bg-white/10',
    ghost: 'bg-transparent text-slate-300 hover:text-white'
  }

  return (
    <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} className={`${base} ${variants[variant]} ${className}`} {...props}>
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_40%)] opacity-0 transition-opacity duration-300 hover:opacity-100" />
      <span className="relative">{children}</span>
    </motion.button>
  )
}
