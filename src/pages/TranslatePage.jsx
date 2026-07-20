import { Languages, Sparkles, Star, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import ToolPageLayout from '../components/ToolPageLayout'
import { useAppContext } from '../context/useAppContext'
import { API_BASE as apiBase } from '../config/api'

export default function TranslatePage() {
  const [text, setText] = useState('')
  const [target, setTarget] = useState('Spanish')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { addFavorite } = useAppContext()

  const handleTranslate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target }),
        credentials: 'include'
      })
      if (!res.ok) { const err = await res.text().catch(() => 'Request failed'); throw new Error(err || `HTTP ${res.status}`); }
      const data = await res.json()
      setResponse(data.response || 'Translation failed.')
    } catch {
      setResponse('Service unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 1400) } catch { /* noop */ }
  }

  return (
    <ToolPageLayout icon={Languages} eyebrow="Translate" title="Localize content across markets instantly.">
      <BackgroundEffects />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="p-5">
          <p className="text-sm font-medium text-slate-400">Input</p>
          <textarea value={text} onChange={(event) => setText(event.target.value)} className="mt-3 min-h-[200px] w-full resize-none rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white outline-none transition focus:border-indigo-400/40" placeholder="Paste content to translate..." />
          <select value={target} onChange={(event) => setTarget(event.target.value)} className="mt-3 w-full rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400/40">
            <option>Spanish</option>
            <option>Arabic</option>
            <option>Japanese</option>
          </select>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={handleTranslate} className="flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110"><Languages className="h-4 w-4" /> Translate</button>
            <button onClick={() => addFavorite({ id: 'translate', label: 'Translator', path: '/translate' })} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Star className="h-4 w-4" /> Save</button>
            <span className="flex items-center gap-1.5 text-sm text-slate-500"><Sparkles className="h-4 w-4 text-indigo-300" /> {loading ? 'Translating…' : 'Backend translation is ready for launch.'}</span>
          </div>
        </GlassPanel>
        <GlassPanel className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Translation output</p>
            {response && <button onClick={copy} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">{copied ? <><Check className="h-3.5 w-3.5 text-emerald-300" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}</button>}
          </div>
          <div className="mt-4 flex-1 whitespace-pre-line rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">{response || <span className="text-slate-500">Your translation will appear here.</span>}</div>
        </GlassPanel>
      </div>
    </ToolPageLayout>
  )
}
