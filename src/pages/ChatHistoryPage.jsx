import { motion } from 'framer-motion'
import { MessageSquareText, Search, Sparkles } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import { useAppContext } from '../context/AppContext'

export default function ChatHistoryPage() {
  const { chats } = useAppContext()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-5 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Chat History</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Every conversation, preserved.</h1>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400"><Search className="h-4 w-4" /> Search conversations</div>
          </div>
        </motion.header>

        <div className="mt-6 grid gap-6">
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300"><Sparkles className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold text-white">Saved history</p>
                <p className="text-sm text-slate-400">Your chats are stored locally in the app state so they persist across sessions.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {chats.length ? chats.map((chat) => (
                <div key={chat.id} className="rounded-[1.15rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3"><MessageSquareText className="h-4 w-4 text-indigo-300" /><p className="font-semibold text-white">{chat.title}</p></div>
                  <p className="mt-2 text-sm text-slate-400">{chat.response}</p>
                </div>
              )) : <div className="rounded-[1.15rem] border border-dashed border-white/10 p-4 text-sm text-slate-400">No chat history yet.</div>}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
