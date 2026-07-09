import { motion } from 'framer-motion'
import { Bot, MessageSquareText, Send, Clock3, ShieldCheck, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import PremiumButton from '../components/PremiumButton'
import ToastBanner from '../components/ToastBanner'
import { useAppContext } from '../context/AppContext'

const suggestions = ['Summarize this sprint update', 'Draft a launch announcement', 'Explain this product strategy']

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

export default function AIChatPage() {
  const { chats, addChatEntry, canUseTool, adminConfig, subscription, addFavorite } = useAppContext()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [reply, setReply] = useState('')

  const limitStatus = useMemo(() => {
    const plan = subscription.plan || 'free-trial'
    const limits = adminConfig?.planLimits?.[plan] || adminConfig?.planLimits?.['free-trial'] || {}
    return `${(limits.maxChatsPerDay || 20) - (subscription.plan === 'free-trial' ? 0 : 0)} daily chats available`
  }, [adminConfig, subscription])

  const handleSend = async () => {
    if (!prompt.trim()) return
    const allowed = canUseTool('chat')
    if (!allowed.allowed) {
      setReply(allowed.reason === 'trial-expired' ? 'Your trial has expired.' : 'Your daily chat limit has been reached. Upgrade to continue.')
      return
    }
    setLoading(true)
    setReply('')
    try {
      const response = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        credentials: 'include'
      })
      const result = await response.json()
      const answer = result.text || result.response || 'No response generated.'
      setReply(answer)
      const saved = addChatEntry(prompt, answer)
      if (!saved) {
        setReply(allowed.reason === 'trial-expired' ? 'Your trial has expired.' : 'Daily chat limit reached. Upgrade to continue.')
      }
    } catch {
      setReply('The chat service is temporarily unavailable. Please try again shortly.')
    } finally {
      setLoading(false)
      setPrompt('')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-5 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">AI Chat</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Ask anything. Get a premium response.</h1>
            </div>
            <PremiumButton variant="secondary">New conversation</PremiumButton>
            <PremiumButton variant="secondary" onClick={() => addFavorite({ id: 'chat', label: 'AI Chat', path: '/chat' })}><Star className="h-4 w-4" /> Save</PremiumButton>
          </div>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <GlassPanel className="p-5">
              <ToastBanner title="Live session" message="Your workspace is ready for conversational AI with rich context and polished responses." />
              <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-[#07101f]/80 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-indigo-300"><ShieldCheck className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-white">Secure and local-ready</p>
                    <p className="text-sm text-slate-400">Connected to the backend with usage-aware limits and persisted history.</p>
                  </div>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Conversation history</p>
                  <h3 className="text-lg font-semibold text-white">Recent threads</h3>
                </div>
                <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">Manage</button>
              </div>
              <div className="mt-5 space-y-3">
                {chats.length ? chats.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <MessageSquareText className="h-4 w-4 text-indigo-300" />
                  </div>
                )) : <p className="text-sm text-slate-400">No chat history yet. Start a conversation to save it.</p>}
              </div>
            </GlassPanel>
          </div>

          <GlassPanel className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Live session</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Craft something extraordinary</h2>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">Online</div>
            </div>

            <div className="mt-6 space-y-3 rounded-[1.25rem] border border-white/10 bg-[#07101f]/80 p-4">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300"><Bot className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-white">Assistant</p>
                  <p className="mt-1 text-sm leading-7 text-slate-400">{reply || 'I can help you refine your message, summarize your notes, or generate a polished proposal in seconds.'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300"><Bot className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-white">You</p>
                  <p className="mt-1 text-sm leading-7 text-slate-400">{prompt || 'Help me turn this product brief into a premium launch narrative.'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button key={item} onClick={() => setPrompt(item)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10">{item}</button>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3">
              <input value={prompt} onChange={(event) => setPrompt(event.target.value)} className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Ask Aditya AI anything" />
              <button onClick={handleSend} disabled={loading} className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 p-2 text-white disabled:opacity-60"><Send className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm text-slate-400"><Clock3 className="h-4 w-4" /> {loading ? 'Generating response...' : limitStatus}</div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
