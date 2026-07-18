import { motion } from 'framer-motion'
import { ArrowRight, MessageSquareHeart } from 'lucide-react'
import ContentPage from '../components/ContentPage'

export default function FeedbackPage() {
  return (
    <ContentPage eyebrow="Feedback" title="Tell us what should come next.">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.6rem] p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><MessageSquareHeart className="h-5 w-5" /></div>
          <div>
            <p className="font-semibold text-white">Share product feedback</p>
            <p className="text-sm text-slate-400">We use every note to shape the next release.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          <textarea className="min-h-36 w-full rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400/40" placeholder="Describe your experience, idea, or request..." />
          <button className="inline-flex w-fit items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_44px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110">
            Submit feedback <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </ContentPage>
  )
}
