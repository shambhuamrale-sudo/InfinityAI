import { motion } from 'framer-motion'

export default function ToolPageLayout({ icon: Icon, eyebrow, title, children }) {
  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass flex flex-col gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Icon className="h-5 w-5" /></div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">{eyebrow}</p>
              <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>
            </div>
          </div>
        </motion.header>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
