import { motion } from 'framer-motion'
import BackgroundEffects from '../components/BackgroundEffects'
import Footer from '../components/Footer'

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-6 backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your data stays protected and private.</h1>
        </motion.header>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[1.6rem] border border-white/10 bg-[#0B1120]/80 p-6 text-sm leading-8 text-slate-400 backdrop-blur-2xl">
          <p>Aditya AI respects your privacy and uses your information only to provide the service, maintain security, and improve the experience. We do not sell personal data to third parties.</p>
          <p className="mt-4">We collect the minimum set of information needed for account access, usage analytics, preferences, and service delivery. Sensitive data is stored securely and never shared without your explicit consent.</p>
          <p className="mt-4">You may update or delete your saved preferences and activity history through the app at any time. If you have questions about privacy, contact our team directly.</p>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
