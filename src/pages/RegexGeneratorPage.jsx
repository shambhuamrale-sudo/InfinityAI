import { Regex, Sparkles, Star, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import ToolPageLayout from '../components/ToolPageLayout'
import { useAppContext } from '../context/useAppContext'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

export default function RegexGeneratorPage() {
  const { addFavorite } = useAppContext()
  const [description, setDescription] = useState('')
  const [examples, setExamples] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!description.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/regex`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, examples, language }),
        credentials: 'include'
      })
      if (!res.ok) { const err = await res.text().catch(() => 'Request failed'); throw new Error(err || `HTTP ${res.status}`); }
      const data = await res.json()
      setResponse(data.response || 'Regex generation failed.')
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
    <ToolPageLayout icon={Regex} eyebrow="Regex" title="Generate regex patterns from plain English.">
      <BackgroundEffects />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="p-5">
          <p className="text-sm font-medium text-slate-400">Describe the pattern</p>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-3 min-h-[120px] w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white outline-none" placeholder="Match email addresses, phone numbers, URLs..." />
          <input value={examples} onChange={(e) => setExamples(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none" placeholder="Example matches (optional)" />
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none">
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
          </select>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={handleGenerate} disabled={loading || !description.trim()} className="flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110 disabled:opacity-50"><Sparkles className="h-4 w-4" /> Generate</button>
            <button onClick={() => addFavorite({ id: 'regex', label: 'Regex Generator', path: '/regex' })} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Star className="h-4 w-4" /> Save</button>
          </div>
        </GlassPanel>
        <GlassPanel className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Pattern & explanation</p>
            {response && <button onClick={copy} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">{copied ? <><Check className="h-3.5 w-3.5 text-emerald-300" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}</button>}
          </div>
          <div className="mt-4 flex-1 whitespace-pre-line rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">{response || <span className="text-slate-500">Describe a pattern to generate a regex.</span>}</div>
        </GlassPanel>
      </div>
    </ToolPageLayout>
  )
}
