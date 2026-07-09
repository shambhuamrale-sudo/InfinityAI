import { motion } from 'framer-motion'
import { ArrowRight, Compass } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

const roadmapItems = [
  { phase: 'Q3', title: 'Expanded AI orchestration', description: 'Multi-agent workflows, better context memory, and deeper automation.' },
  { phase: 'Q4', title: 'Team collaboration', description: 'Shared workspaces, comments, approvals, and multi-seat operations.' },
  { phase: '2027', title: 'Enterprise readiness', description: 'Role-based access, audit trails, and stronger deployment controls.' }
]

export default function RoadmapPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-6 backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Roadmap</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A focused path to a more powerful product.</h1>
        </motion.header>
        <div className="mt-6 space-y-4">
          {roadmapItems.map((item, index) => (
            <motion.div key={item.phase} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-[1.6rem] border border-white/10 bg-[#0B1120]/80 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-indigo-300"><Compass className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">{item.phase}</p>
                  <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-8 text-slate-400">{item.description}</p>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/10 to-cyan-500/10 p-6 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Stay tuned</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">More AI power is on the way.</h2>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white">
              Explore roadmap <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
