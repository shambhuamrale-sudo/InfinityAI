import { Zap, Sparkles, Star, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import ToolPageLayout from '../components/ToolPageLayout'
import { useAppContext } from '../context/useAppContext'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

export default function CodeOptimizerPage() {
  const { addFavorite } = useAppContext()
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [goals, setGoals] = useState('performance, readability, maintainability')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleOptimize = async () => {
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, goals }),
        credentials: 'include'
      })
      if (!res.ok) { const err = await res.text().catch(() => 'Request failed'); throw new Error(err || `HTTP ${res.status}`); }
      const data = await res.json()
      setResponse(data.response || 'Optimization failed.')
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
    <ToolPageLayout icon={Zap} eyebrow="Optimize" title="Optimize code for performance and readability.">
      <BackgroundEffects />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="p-5">
          <p className="text-sm font-medium text-slate-400">Code</p>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} className="mt-3 min-h-[240px] w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-4 font-mono text-sm text-white outline-none" placeholder="Paste code to optimize..." />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
              <option value="go">Go</option>
            </select>
            <input value={goals} onChange={(e) => setGoals(e.target.value)} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none" placeholder="Goals (performance, readability...)" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={handleOptimize} disabled={loading || !code.trim()} className="flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110 disabled:opacity-50"><Sparkles className="h-4 w-4" /> Optimize</button>
            <button onClick={() => addFavorite({ id: 'optimize', label: 'Code Optimizer', path: '/optimize' })} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Star className="h-4 w-4" /> Save</button>
          </div>
        </GlassPanel>
        <GlassPanel className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Optimized output</p>
            {response && <button onClick={copy} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">{copied ? <><Check className="h-3.5 w-3.5 text-emerald-300" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}</button>}
          </div>
          <div className="mt-4 flex-1 whitespace-pre-line rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">{response || <span className="text-slate-500">Paste code to get optimization suggestions.</span>}</div>
        </GlassPanel>
      </div>
    </ToolPageLayout>
  )
}
