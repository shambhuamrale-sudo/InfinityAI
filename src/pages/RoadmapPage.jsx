import { motion } from 'framer-motion'
import { ArrowRight, Compass } from 'lucide-react'
import ContentPage from '../components/ContentPage'

const roadmapItems = [
  { phase: 'Q3', title: 'Expanded AI orchestration', description: 'Multi-agent workflows, better context memory, and deeper automation.' },
  { phase: 'Q4', title: 'Team collaboration', description: 'Shared workspaces, comments, approvals, and multi-seat operations.' },
  { phase: '2027', title: 'Enterprise readiness', description: 'Role-based access, audit trails, and stronger deployment controls.' }
]

export default function RoadmapPage() {
  return (
    <ContentPage eyebrow="Roadmap" title="A focused path to a more powerful product.">
      <div className="space-y-4">
        {roadmapItems.map((item, index) => (
          <motion.div key={item.phase} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="glass rounded-[1.6rem] p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Compass className="h-5 w-5" /></div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">{item.phase}</p>
                <h2 className="text-xl font-semibold text-white">{item.title}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-8 text-slate-400">{item.description}</p>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[1.6rem] border border-white/8 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-cyan-500/10 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Stay tuned</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">More AI power is on the way.</h2>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_44px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110">
            Explore roadmap <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </ContentPage>
  )
}
