import { motion } from 'framer-motion'
import { ArrowRight, Mail, MessageSquareText, Phone } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

const inputCls = 'rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400'

export default function ContactPage() {
  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.75rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Contact</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Reach the team anytime.</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400">Questions, feedback, or product ideas? We welcome them all.</p>
        </motion.header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.6rem] p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Mail className="h-4 w-4" /></div>
                <div>
                  <p className="font-semibold text-white">Email us</p>
                  <p className="text-sm text-slate-400">hello@infinityai.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Phone className="h-4 w-4" /></div>
                <div>
                  <p className="font-semibold text-white">Call us</p>
                  <p className="text-sm text-slate-400">+1 (555) 010-2048</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><MessageSquareText className="h-4 w-4" /></div>
                <div>
                  <p className="font-semibold text-white">Live support</p>
                  <p className="text-sm text-slate-400">Available during business hours.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.6rem] border border-white/8 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-cyan-500/10 p-6">
            <h2 className="text-xl font-semibold text-white">Send a note</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input className={inputCls} placeholder="Name" />
              <input className={inputCls} placeholder="Email" />
              <textarea className={`sm:col-span-2 min-h-32 ${inputCls}`} placeholder="How can we help?" />
            </div>
            <button className="mt-5 inline-flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_44px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110">
              Send message <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
