import { motion } from 'framer-motion'
import { BookOpen, CircleHelp, LifeBuoy, MessageCircleQuestion } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

const helpSections = [
  { icon: BookOpen, title: 'Getting started', description: 'Learn how to navigate the dashboard, choose a workspace, and launch your first AI action.' },
  { icon: LifeBuoy, title: 'Support', description: 'Need urgent assistance? Contact the team for help with billing, setup, or platform questions.' },
  { icon: MessageCircleQuestion, title: 'Common questions', description: 'Browse the most frequently asked questions about plans, usage, and AI tool availability.' },
  { icon: CircleHelp, title: 'Troubleshooting', description: 'Use our recommended steps to resolve common issues quickly and continue working.' }
]

export default function HelpPage() {
  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.75rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Help Center</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Support that keeps your workflow moving.</h1>
        </motion.header>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {helpSections.map((section, index) => {
            const Icon = section.icon
            return (
              <motion.div key={section.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="glass rounded-[1.6rem] p-6">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Icon className="h-5 w-5" /></div>
                <h2 className="mt-4 text-xl font-semibold text-white">{section.title}</h2>
                <p className="mt-3 text-sm leading-8 text-slate-400">{section.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
      <Footer />
    </div>
  )
}
