import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

const pillars = [
  { title: 'Open-source foundation', description: 'Built with free tools, transparent architecture, and no reliance on paid APIs.' },
  { title: 'Premium experience', description: 'A refined interface that feels cinematic, polished, and purpose-built for modern teams.' },
  { title: 'Launch-ready product', description: 'Every core AI workflow is wired for real use, persistent state, and production deployment.' }
]

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-6 backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">About</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A premium, open-source AI workspace built for ambitious teams.</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-400">Aditya AI combines elegant product design with practical AI workflows so you can move from idea to execution without friction.</p>
        </motion.header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.6rem] border border-white/10 bg-[#0B1120]/80 p-6 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-indigo-300"><Sparkles className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold text-white">What we believe</p>
                <p className="text-sm text-slate-400">Design, speed, and clarity should work together.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-8 text-slate-400">
              <p>We created Aditya AI to bring the polish of a premium SaaS product to a fully open-source stack. The result is a fast, thoughtful experience that feels high-end without compromising transparency.</p>
              <p>From chat and image generation to documents, translation, settings, and admin tools, every surface is built to feel intentional and productive.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/10 to-cyan-500/10 p-6 backdrop-blur-2xl">
            <h2 className="text-xl font-semibold text-white">Why teams choose it</h2>
            <div className="mt-5 space-y-4">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="rounded-[1.1rem] border border-white/10 bg-[#050816]/70 p-4">
                  <p className="font-semibold text-white">{pillar.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{pillar.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[1.6rem] border border-white/10 bg-[#0B1120]/80 p-6 backdrop-blur-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Get started</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Take the next step and launch your first AI workflow.</h2>
            </div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_60px_rgba(129,140,248,0.25)]">
              Open dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
