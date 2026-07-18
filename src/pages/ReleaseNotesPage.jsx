import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import ContentPage from '../components/ContentPage'

const releases = [
  { version: '1.0.0', title: 'Launch edition', summary: 'Premium dashboard, persistent AI workspaces, polished tool pages, and deployment-ready architecture.' },
  { version: '0.9.0', title: 'Polished experience', summary: 'Improved motion, responsive layout, and better state handling across the product.' }
]

export default function ReleaseNotesPage() {
  return (
    <ContentPage eyebrow="Release Notes" title="A clear view of the product journey.">
      <div className="space-y-4">
        {releases.map((release, index) => (
          <motion.div key={release.version} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="glass rounded-[1.6rem] p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Sparkles className="h-5 w-5" /></div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">{release.version}</p>
                <h2 className="text-xl font-semibold text-white">{release.title}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-8 text-slate-400">{release.summary}</p>
          </motion.div>
        ))}
      </div>
    </ContentPage>
  )
}
