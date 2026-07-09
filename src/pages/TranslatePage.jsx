import { motion } from 'framer-motion'
import { Languages, Sparkles, Star } from 'lucide-react'
import { useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

export default function TranslatePage() {
  const [text, setText] = useState('')
  const [target, setTarget] = useState('Spanish')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTranslate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target }),
        credentials: 'include'
      })
      const data = await res.json()
      setResponse(data.response || 'Translation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-5 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300"><Languages className="h-5 w-5" /></div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Translate</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Localize content across markets instantly.</h1>
            </div>
          </div>
        </motion.header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassPanel className="p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Input</p>
            <textarea value={text} onChange={(event) => setText(event.target.value)} className="mt-4 min-h-[220px] w-full rounded-[1.2rem] border border-white/10 bg-[#050816] p-4 text-sm text-white outline-none" placeholder="Paste content to translate..." />
            <select value={target} onChange={(event) => setTarget(event.target.value)} className="mt-3 rounded-[1.2rem] border border-white/10 bg-[#050816] px-4 py-3 text-sm text-white outline-none">
              <option>Spanish</option>
              <option>Arabic</option>
              <option>Japanese</option>
            </select>
            <button onClick={handleTranslate} className="mt-4 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white">Translate</button>
            <button onClick={() => addFavorite({ id: 'translate', label: 'Translator', path: '/translate' })} className="mt-4 ml-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"><Star className="mr-1 inline h-4 w-4" /> Save</button>
            <div className="mt-4 flex items-center gap-3 text-sm text-slate-500"><Sparkles className="h-4 w-4 text-indigo-300" /> {loading ? 'Translating...' : 'Backend translation is ready for launch.'}</div>
          </GlassPanel>
          <GlassPanel className="p-5">
            <p className="font-semibold text-white">Translation output</p>
            <div className="mt-4 whitespace-pre-line rounded-[1.1rem] border border-white/10 bg-white/5 p-3 text-sm text-slate-400">{response || 'Your translation will appear here.'}</div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
