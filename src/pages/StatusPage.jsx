import { motion } from 'framer-motion'
import { Activity, ShieldCheck } from 'lucide-react'
import ContentPage from '../components/ContentPage'

const systems = [
  { name: 'API', state: 'Operational', detail: 'All core endpoints are healthy.' },
  { name: 'AI Chat', state: 'Operational', detail: 'Responses are flowing normally.' },
  { name: 'Image Generation', state: 'Operational', detail: 'Queue is stable and responsive.' },
  { name: 'Authentication', state: 'Operational', detail: 'Sessions remain secure and stable.' }
]

export default function StatusPage() {
  return (
    <ContentPage eyebrow="Status Page" title="The platform is healthy and ready for action.">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.6rem] p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <p className="font-semibold text-white">All systems operating normally</p>
            <p className="text-sm text-slate-400">Last updated just now.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {systems.map((system) => (
            <div key={system.name} className="rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Activity className="h-4 w-4" /></div>
                  <p className="font-semibold text-white">{system.name}</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">{system.state}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-400">{system.detail}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </ContentPage>
  )
}
