import { SpellCheck, Sparkles, Star, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import ToolPageLayout from '../components/ToolPageLayout'
import { useAppContext } from '../context/useAppContext'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

export default function GrammarPage() {
  const { addFavorite } = useAppContext()
  const [text, setText] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCheck = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/grammar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        credentials: 'include'
      })
      if (!res.ok) { const err = await res.text().catch(() => 'Request failed'); throw new Error(err || `HTTP ${res.status}`); }
      const data = await res.json()
      setResponse(data.response || 'No issues found.')
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
    <ToolPageLayout icon={SpellCheck} eyebrow="Grammar" title="Polish your writing with AI grammar checking.">
      <BackgroundEffects />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="p-5">
          <p className="text-sm font-medium text-slate-400">Your text</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="mt-3 min-h-[240px] w-full resize-none rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white outline-none transition focus:border-indigo-400/40" placeholder="Paste the text you want to check..." />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={handleCheck} disabled={loading || !text.trim()} className="flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110 disabled:opacity-50"><Sparkles className="h-4 w-4" /> Check grammar</button>
            <button onClick={() => addFavorite({ id: 'grammar', label: 'Grammar', path: '/grammar' })} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Star className="h-4 w-4" /> Save</button>
          </div>
        </GlassPanel>
        <GlassPanel className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Results</p>
            {response && <button onClick={copy} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">{copied ? <><Check className="h-3.5 w-3.5 text-emerald-300" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}</button>}
          </div>
          <div className="mt-4 flex-1 whitespace-pre-line rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">{response || <span className="text-slate-500">Your grammar check results will appear here.</span>}</div>
        </GlassPanel>
      </div>
    </ToolPageLayout>
  )
}
