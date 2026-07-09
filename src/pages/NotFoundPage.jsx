import { motion } from 'framer-motion'
import { ArrowRight, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full rounded-[1.8rem] border border-white/10 bg-[#0B1120]/80 p-8 text-center backdrop-blur-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300"><Compass className="h-7 w-7" /></div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">Page not found</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-400">The page you requested could not be found, but the rest of the experience is ready to explore.</p>
          <Link to="/dashboard" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white">
            Return home <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
