import { motion } from 'framer-motion'
import { ArrowRight, Mail, MessageSquareText, Phone } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-6 backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Contact</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Reach the team anytime.</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400">Questions, feedback, or product ideas? We welcome them all.</p>
        </motion.header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.6rem] border border-white/10 bg-[#0B1120]/80 p-6 backdrop-blur-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
                <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300"><Mail className="h-4 w-4" /></div>
                <div>
                  <p className="font-semibold text-white">Email us</p>
                  <p className="text-sm text-slate-400">hello@aditya.ai</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
                <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300"><Phone className="h-4 w-4" /></div>
                <div>
                  <p className="font-semibold text-white">Call us</p>
                  <p className="text-sm text-slate-400">+1 (555) 010-2048</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
                <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300"><MessageSquareText className="h-4 w-4" /></div>
                <div>
                  <p className="font-semibold text-white">Live support</p>
                  <p className="text-sm text-slate-400">Available during business hours.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/10 to-cyan-500/10 p-6 backdrop-blur-2xl">
            <h2 className="text-xl font-semibold text-white">Send a note</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input className="rounded-[1rem] border border-white/10 bg-[#050816]/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Name" />
              <input className="rounded-[1rem] border border-white/10 bg-[#050816]/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Email" />
              <textarea className="sm:col-span-2 min-h-32 rounded-[1rem] border border-white/10 bg-[#050816]/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="How can we help?" />
            </div>
            <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white">
              Send message <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
