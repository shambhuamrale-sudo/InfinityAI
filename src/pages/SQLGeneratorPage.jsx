import { Database, Sparkles, Star, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import ToolPageLayout from '../components/ToolPageLayout'
import { useAppContext } from '../context/useAppContext'
import { API_BASE as apiBase } from '../config/api'

export default function SQLGeneratorPage() {
  const { addFavorite } = useAppContext()
  const [schema, setSchema] = useState('')
  const [query, setQuery] = useState('')
  const [dbType, setDbType] = useState('generic SQL')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema, query, dbType }),
        credentials: 'include'
      })
      if (!res.ok) { const err = await res.text().catch(() => 'Request failed'); throw new Error(err || `HTTP ${res.status}`); }
      const data = await res.json()
      setResponse(data.response || 'SQL generation failed.')
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
    <ToolPageLayout icon={Database} eyebrow="SQL" title="Generate optimized SQL from natural language.">
      <BackgroundEffects />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="p-5">
          <p className="text-sm font-medium text-slate-400">Schema</p>
          <textarea value={schema} onChange={(e) => setSchema(e.target.value)} className="mt-3 min-h-[160px] w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-4 font-mono text-sm text-white outline-none" placeholder="CREATE TABLE users (id INT, name VARCHAR(255), email VARCHAR(255));" />
          <p className="mt-3 text-sm font-medium text-slate-400">Request</p>
          <textarea value={query} onChange={(e) => setQuery(e.target.value)} className="mt-3 min-h-[100px] w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white outline-none" placeholder="Find all users who signed up in the last 30 days..." />
          <select value={dbType} onChange={(e) => setDbType(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none">
            <option value="generic SQL">Generic SQL</option>
            <option value="PostgreSQL">PostgreSQL</option>
            <option value="MySQL">MySQL</option>
            <option value="SQLite">SQLite</option>
          </select>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110 disabled:opacity-50"><Sparkles className="h-4 w-4" /> Generate SQL</button>
            <button onClick={() => addFavorite({ id: 'sql', label: 'SQL Generator', path: '/sql' })} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Star className="h-4 w-4" /> Save</button>
          </div>
        </GlassPanel>
        <GlassPanel className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Generated query</p>
            {response && <button onClick={copy} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">{copied ? <><Check className="h-3.5 w-3.5 text-emerald-300" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}</button>}
          </div>
          <div className="mt-4 flex-1 whitespace-pre-line rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4 font-mono text-sm leading-7 text-slate-300">{response || <span className="text-slate-500">Your SQL query will appear here.</span>}</div>
        </GlassPanel>
      </div>
    </ToolPageLayout>
  )
}
