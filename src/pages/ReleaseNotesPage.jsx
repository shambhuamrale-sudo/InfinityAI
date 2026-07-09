import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

const releases = [
  { version: '1.0.0', title: 'Launch edition', summary: 'Premium dashboard, persistent AI workspaces, polished tool pages, and deployment-ready architecture.' },
  { version: '0.9.0', title: 'Polished experience', summary: 'Improved motion, responsive layout, and better state handling across the product.' }
]

export default function ReleaseNotesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-6 backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Release Notes</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A clear view of the product journey.</h1>
        </motion.header>
        <div className="mt-6 space-y-4">
          {releases.map((release, index) => (
            <motion.div key={release.version} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-[1.6rem] border border-white/10 bg-[#0B1120]/80 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-indigo-300"><Sparkles className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">{release.version}</p>
                  <h2 className="text-xl font-semibold text-white">{release.title}</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-8 text-slate-400">{release.summary}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
