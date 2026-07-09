import { motion } from 'framer-motion'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

export default function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-6 backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Terms & Conditions</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Use the platform with confidence and clarity.</h1>
        </motion.header>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[1.6rem] border border-white/10 bg-[#0B1120]/80 p-6 text-sm leading-8 text-slate-400 backdrop-blur-2xl">
          <p>By accessing Aditya AI, you agree to use the service responsibly, respect licensing and usage limits, and avoid abusive or unlawful behavior.</p>
          <p className="mt-4">The platform is provided as-is, with the intent of giving users a reliable AI workspace. We reserve the right to adjust features, pricing, and availability as the product evolves.</p>
          <p className="mt-4">Users remain responsible for the content they create, submit, or share while using the product. Please comply with local laws and platform rules at all times.</p>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
