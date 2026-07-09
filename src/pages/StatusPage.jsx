import { motion } from 'framer-motion'
import { Activity, ShieldCheck } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

const systems = [
  { name: 'API', state: 'Operational', detail: 'All core endpoints are healthy.' },
  { name: 'AI Chat', state: 'Operational', detail: 'Responses are flowing normally.' },
  { name: 'Image Generation', state: 'Operational', detail: 'Queue is stable and responsive.' },
  { name: 'Authentication', state: 'Operational', detail: 'Sessions remain secure and stable.' }
]

export default function StatusPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-6 backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Status Page</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">The platform is healthy and ready for action.</h1>
        </motion.header>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[1.6rem] border border-white/10 bg-[#0B1120]/80 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-300"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <p className="font-semibold text-white">All systems operating normally</p>
              <p className="text-sm text-slate-400">Last updated just now.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {systems.map((system, _index) => (
              <div key={system.name} className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300"><Activity className="h-4 w-4" /></div>
                    <p className="font-semibold text-white">{system.name}</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">{system.state}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">{system.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
