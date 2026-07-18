import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import ContentPage from '../components/ContentPage'

export default function BugReportPage() {
  return (
    <ContentPage eyebrow="Bug Report" title="Help us squash issues quickly.">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.6rem] p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/20"><AlertTriangle className="h-5 w-5" /></div>
          <div>
            <p className="font-semibold text-white">Report a problem</p>
            <p className="text-sm text-slate-400">Please include steps to reproduce and the device/browser you used.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          <input className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400/40" placeholder="Issue title" />
          <textarea className="min-h-[140px] w-full rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400" placeholder="Describe the issue" />
          <button className="inline-flex w-fit items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_44px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110">
            Submit report <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </ContentPage>
  )
}
