import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

export default function UpgradeModal() {
  const { ui, setUpgradeModalOpen, updateSubscription } = useAppContext()
  if (!ui.upgradeModalOpen) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-xl">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0B1120]/95 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.64)]">
          <div className="flex items-center gap-3 text-indigo-300"><Sparkles className="h-5 w-5" /><p className="text-sm uppercase tracking-[0.3em]">Upgrade required</p></div>
          <h3 className="mt-4 text-2xl font-semibold text-white">Your free trial has reached its limit.</h3>
          <p className="mt-3 text-sm leading-7 text-slate-400">Upgrade to continue using premium actions and unlock more generous daily limits without losing your saved history.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => updateSubscription('starter')} className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white">Upgrade to Starter</button>
            <button onClick={() => setUpgradeModalOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300">Keep browsing</button>
          </div>
          <p className="mt-5 text-sm text-slate-500">Your existing chats and images remain intact.</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
