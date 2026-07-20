import { Bug, Sparkles, Star, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import ToolPageLayout from '../components/ToolPageLayout'
import { useAppContext } from '../context/useAppContext'
import { API_BASE as apiBase } from '../config/api'

export default function CodeDebuggerPage() {
  const { addFavorite } = useAppContext()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDebug = async () => {
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/debug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, error, language }),
        credentials: 'include'
      })
      if (!res.ok) { const err = await res.text().catch(() => 'Request failed'); throw new Error(err || `HTTP ${res.status}`); }
      const data = await res.json()
      setResponse(data.response || 'Debug analysis failed.')
    } catch (error) {
      setResponse(error.message || 'Service unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 1400) } catch { /* noop */ }
  }

  return (
    <ToolPageLayout icon={Bug} eyebrow="Debug" title="Get AI-powered debugging help for your code.">
      <BackgroundEffects />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="p-5">
          <p className="text-sm font-medium text-slate-400">Code</p>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} className="mt-3 min-h-[180px] w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-4 font-mono text-sm text-white outline-none" placeholder="Paste the code that is failing..." />
          <input value={error} onChange={(e) => setError(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white outline-none" placeholder="Error message (optional)" />
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none">
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
            <option value="go">Go</option>
          </select>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={handleDebug} disabled={loading || !code.trim()} className="flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110 disabled:opacity-50"><Sparkles className="h-4 w-4" /> Debug</button>
            <button onClick={() => addFavorite({ id: 'debug', label: 'Code Debugger', path: '/debug' })} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Star className="h-4 w-4" /> Save</button>
          </div>
        </GlassPanel>
        <GlassPanel className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Analysis</p>
            {response && <button onClick={copy} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">{copied ? <><Check className="h-3.5 w-3.5 text-emerald-300" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}</button>}
          </div>
          <div className="mt-4 flex-1 whitespace-pre-line rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">{response || <span className="text-slate-500">Paste code and an error to get debugging help.</span>}</div>
        </GlassPanel>
      </div>
    </ToolPageLayout>
  )
}
