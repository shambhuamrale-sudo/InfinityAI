import { motion } from 'framer-motion'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

export default function CookiesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-6 backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Cookie Policy</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">We use cookies thoughtfully to improve the experience.</h1>
        </motion.header>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[1.6rem] border border-white/10 bg-[#0B1120]/80 p-6 text-sm leading-8 text-slate-400 backdrop-blur-2xl">
          <p>Cookies help us remember your preferences, keep the interface responsive, and ensure your product settings remain consistent across sessions.</p>
          <p className="mt-4">We use cookies for core functionality, performance, and basic analytics. You can manage or disable them in your browser settings, although some features may be impacted.</p>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
