import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

export default function BugReportPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-6 backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Bug Report</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Help us squash issues quickly.</h1>
        </motion.header>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[1.6rem] border border-white/10 bg-[#0B1120]/80 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-amber-300"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <p className="font-semibold text-white">Report a problem</p>
              <p className="text-sm text-slate-400">Please include steps to reproduce and the device/browser you used.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <input className="rounded-[1rem] border border-white/10 bg-[#050816]/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Issue title" />
            <textarea className="min-h-36 rounded-[1rem] border border-white/10 bg-[#050816]/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Describe the issue and expected behavior..." />
            <button className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white">
              Submit report <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
