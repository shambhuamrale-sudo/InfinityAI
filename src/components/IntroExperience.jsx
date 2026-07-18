import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InfinityLogo from './InfinityLogo'

const COLORS = ['#818cf8', '#a855f7', '#e879f9', '#22d3ee']

// Timeline (ms)
const T = {
  emerge: 1700,
  assemble: 3400,
  core: 4500,
  morph: 5600,
  glow: 6500,
  reveal: 7300
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a, b, t) => a + (b - a) * t

export default function IntroExperience({ onComplete, reduced = false }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const startRef = useRef(0)
  const onDoneRef = useRef(onComplete)
  onDoneRef.current = onComplete

  const [logoVisible, setLogoVisible] = useState(false)
  const [wordVisible, setWordVisible] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [finished, setFinished] = useState(false)

  // Reduced motion: show a calm brand flash, then reveal.
  useEffect(() => {
    if (!reduced) return
    setLogoVisible(true)
    setWordVisible(true)
    const t = setTimeout(() => {
      setRevealing(true)
      setTimeout(() => onDoneRef.current?.(), 800)
    }, 900)
    return () => clearTimeout(t)
  }, [reduced])

  useEffect(() => {
    if (reduced) return
    let canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w = 0
    let h = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cx = () => w / 2
    const cy = () => h / 2

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      w = rect.width
      h = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const baseN = Math.max(70, Math.min(150, Math.floor((w * h) / 9000)))
    const rings = [0.16, 0.27, 0.38]
    const particles = Array.from({ length: baseN }, (_, i) => {
      const ring = i % rings.length
      const angle = (i / baseN) * Math.PI * 2 * 3 + ring * 1.7
      const color = COLORS[i % COLORS.length]
      const startR = 6 + Math.random() * 26
      const startA = Math.random() * Math.PI * 2
      return {
        ring,
        baseAngle: angle,
        jitter: (Math.random() - 0.5) * 14,
        color,
        size: 1.1 + Math.random() * 1.8,
        // emergence start near center
        sx: Math.cos(startA) * startR,
        sy: Math.sin(startA) * startR,
        // drift velocity for emergence
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        phase: Math.random() * Math.PI * 2,
        x: 0,
        y: 0
      }
    })

    const LINK = Math.max(90, Math.min(150, Math.min(w, h) * 0.13))
    const LINK2 = LINK * LINK

    const draw = (now) => {
      if (!startRef.current) startRef.current = now
      const t = now - startRef.current
      const scale = Math.min(w, h)

      // progress values
      const pAssemble = easeInOut(clamp01((t - T.emerge) / (T.assemble - T.emerge)))
      const corePulse = 0.5 + 0.5 * Math.sin(now * 0.004)
      const morphFade = clamp01(1 - (t - T.morph) / (T.glow - T.morph))
      const rot = (t - T.emerge) * 0.00018

      // trail fade
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(5,8,22,0.30)'
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'lighter'

      const ringR = rings.map((r) => r * scale)
      // compute positions
      for (const p of particles) {
        const targetAngle = p.baseAngle + rot * (1 + p.ring * 0.6)
        const tr = ringR[p.ring] + p.jitter
        const tx = Math.cos(targetAngle) * tr
        const ty = Math.sin(targetAngle) * tr
        if (t < T.emerge) {
          p.x = p.sx + p.vx * t * 0.6
          p.y = p.sy + p.vy * t * 0.6
        } else {
          p.x = lerp(p.x || p.sx, tx, 0.08 + pAssemble * 0.12)
          p.y = lerp(p.y || p.sy, ty, 0.08 + pAssemble * 0.12)
        }
      }

      const fade = t < T.morph ? 1 : 1 - morphFade

      // connections (energy network)
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 > LINK2) continue
          const d = Math.sqrt(d2)
          const energy = (1 - d / LINK) * (0.18 + 0.22 * corePulse) * fade
          const grad = ctx.createLinearGradient(cx() + a.x, cy() + a.y, cx() + b.x, cy() + b.y)
          grad.addColorStop(0, a.color)
          grad.addColorStop(1, b.color)
          ctx.strokeStyle = grad
          ctx.globalAlpha = energy
          ctx.lineWidth = 0.7
          ctx.beginPath()
          ctx.moveTo(cx() + a.x, cy() + a.y)
          ctx.lineTo(cx() + b.x, cy() + b.y)
          ctx.stroke()

          // traveling energy pulse
          if ((i + j) % 3 === 0) {
            const tp = ((now * 0.0004) + (i * 0.137 + j * 0.071)) % 1
            const px = a.x + (b.x - a.x) * tp
            const py = a.y + (b.y - a.y) * tp
            ctx.globalAlpha = energy * 1.6
            ctx.fillStyle = '#e9d5ff'
            ctx.beginPath()
            ctx.arc(cx() + px, cy() + py, 1.3, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      ctx.globalAlpha = 1

      // particles (glow dots)
      for (const p of particles) {
        const x = cx() + p.x
        const y = cy() + p.y
        ctx.globalAlpha = fade
        ctx.fillStyle = p.color
        ctx.globalAlpha = fade * 0.25
        ctx.beginPath()
        ctx.arc(x, y, p.size * 2.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = fade
        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // central AI core orb
      const orbR = (scale * 0.05) * (0.85 + corePulse * 0.25) * fade
      const og = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), orbR)
      og.addColorStop(0, 'rgba(233,213,255,0.95)')
      og.addColorStop(0.4, 'rgba(168,85,247,0.55)')
      og.addColorStop(1, 'rgba(99,102,241,0)')
      ctx.fillStyle = og
      ctx.beginPath()
      ctx.arc(cx(), cy(), orbR, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalCompositeOperation = 'source-over'

      if (t < T.reveal) {
        rafRef.current = requestAnimationFrame(draw)
      }
    }
    rafRef.current = requestAnimationFrame(draw)

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current)
      } else {
        startRef.current = 0
        rafRef.current = requestAnimationFrame(draw)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [reduced])

  // Schedule phase transitions for the HTML/SVG layers (no per-frame renders).
  useEffect(() => {
    if (reduced) return
    const timers = [
      setTimeout(() => setLogoVisible(true), T.morph - 200),
      setTimeout(() => setWordVisible(true), T.morph + 400),
      setTimeout(() => setRevealing(true), T.reveal - 700)
    ]
    return () => timers.forEach(clearTimeout)
  }, [reduced])

  if (finished) return null

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: revealing ? 0 : 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      onAnimationComplete={() => { if (revealing) { setFinished(true); onDoneRef.current?.() } }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050816]"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none relative flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: logoVisible ? 1 : 0, scale: logoVisible ? 1 : 0.8 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="drop-shadow-[0_0_40px_rgba(168,85,247,0.55)]"
        >
          <InfinityLogo size={120} glow />
        </motion.div>

        <AnimatePresence>
          {wordVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="mt-6 text-center"
            >
              <p className="text-2xl font-semibold tracking-[0.18em] text-white sm:text-3xl">InfinityAI</p>
              <p className="mt-2 text-xs uppercase tracking-[0.4em] text-indigo-300/80">Endless AI Possibilities</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={() => onDoneRef.current?.()}
        className="absolute right-5 top-5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
      >
        Skip intro
      </button>
    </motion.div>
  )
}
