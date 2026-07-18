import { motion } from 'framer-motion'
import { ArrowRight, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

export default function NotFoundPage() {
  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass w-full rounded-[1.8rem] p-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Compass className="h-7 w-7" /></div>
          </div>
          <p className="eyebrow">404</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Page not found</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-slate-400">The page you requested could not be found, but the rest of the experience is ready to explore.</p>
          <Link to="/dashboard" className="mt-8 inline-flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_44px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110">
            Return home <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
