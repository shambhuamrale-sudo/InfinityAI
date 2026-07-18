import { Code2, Sparkles, Star, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import ToolPageLayout from '../components/ToolPageLayout'
import { useAppContext } from '../context/useAppContext'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

export default function CodePage() {
  const { addFavorite } = useAppContext()
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        credentials: 'include'
      })
      const data = await res.json()
      setResponse(data.response || 'Code generation failed.')
    } finally {
      setLoading(false)
      setPrompt('')
    }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 1400) } catch { /* noop */ }
  }

  return (
    <ToolPageLayout icon={Code2} eyebrow="Code" title="Accelerate implementation with AI-assisted coding.">
      <BackgroundEffects />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="p-5">
          <p className="text-sm font-medium text-slate-400">Prompt</p>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="mt-3 min-h-[240px] w-full resize-none rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4 font-mono text-sm text-white outline-none transition focus:border-indigo-400/40" placeholder="Ask for a React, Node, or SQL implementation..." />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={handleGenerate} className="flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110"><Sparkles className="h-4 w-4" /> Generate code</button>
            <button onClick={() => addFavorite({ id: 'code', label: 'AI Code', path: '/code' })} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Star className="h-4 w-4" /> Save</button>
            <span className="flex items-center gap-1.5 text-sm text-slate-500"><Sparkles className="h-4 w-4 text-indigo-300" /> {loading ? 'Generating…' : 'Designed for engineering workflows and rapid prototyping.'}</span>
          </div>
        </GlassPanel>
        <GlassPanel className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Generated output</p>
            {response && <button onClick={copy} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">{copied ? <><Check className="h-3.5 w-3.5 text-emerald-300" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}</button>}
          </div>
          <div className="mt-4 flex-1 whitespace-pre-line rounded-[1.1rem] border border-white/8 bg-[#07101f]/70 p-4 font-mono text-sm leading-7 text-slate-300">{response || <span className="text-slate-500">Your generated code will appear here.</span>}</div>
        </GlassPanel>
      </div>
    </ToolPageLayout>
  )
}
