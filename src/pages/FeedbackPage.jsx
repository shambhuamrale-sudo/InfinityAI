import { motion } from 'framer-motion'
import { ArrowRight, MessageSquareHeart } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

export default function FeedbackPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-6 backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Feedback</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Tell us what should come next.</h1>
        </motion.header>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[1.6rem] border border-white/10 bg-[#0B1120]/80 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-indigo-300"><MessageSquareHeart className="h-5 w-5" /></div>
            <div>
              <p className="font-semibold text-white">Share product feedback</p>
              <p className="text-sm text-slate-400">We use every note to shape the next release.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <textarea className="min-h-36 rounded-[1rem] border border-white/10 bg-[#050816]/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Describe your experience, idea, or request..." />
            <button className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white">
              Submit feedback <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
