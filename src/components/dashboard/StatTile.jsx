import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(typeof value === 'number' ? 0 : value)
  const fromRef = useRef(0)
  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplay(value)
      return
    }
    let frame = 0
    const start = performance.now()
    const duration = 750
    const from = fromRef.current
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (p < 1) frame = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <span>{typeof display === 'number' ? display.toLocaleString() : display}{suffix}</span>
}

export default function StatTile({ title, value, suffix = '', note, accent, icon: Icon, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -6 }}
      className="glass group relative overflow-hidden rounded-3xl p-5"
    >
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40`} />
      <div className="flex items-center justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`h-1.5 w-10 rounded-full bg-gradient-to-r ${accent}`} />
      </div>
      <p className="mt-4 text-sm text-slate-400">{title}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-white">
        <AnimatedNumber value={value} suffix={suffix} />
      </p>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </motion.div>
  )
}
