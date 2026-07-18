import { motion } from 'framer-motion'
import BackgroundEffects from './BackgroundEffects'
import Footer from './Footer'

export default function ContentPage({ eyebrow, title, description, children, max = 'max-w-5xl' }) {
  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className={`relative z-10 mx-auto flex flex-col px-4 py-6 sm:px-6 lg:px-8 ${max}`}>
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.75rem] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {description ? <p className="mt-4 max-w-3xl text-base leading-8 text-slate-400">{description}</p> : null}
        </motion.header>
        <div className="mt-6">{children}</div>
      </div>
      <Footer />
    </div>
  )
}
