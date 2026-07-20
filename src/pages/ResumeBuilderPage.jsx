import { FileText, Sparkles, Star, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import ToolPageLayout from '../components/ToolPageLayout'
import { useAppContext } from '../context/useAppContext'
import { API_BASE as apiBase } from '../config/api'

export default function ResumeBuilderPage() {
  const { addFavorite } = useAppContext()
  const [section, setSection] = useState('full')
  const [experience, setExperience] = useState('')
  const [skills, setSkills] = useState('')
  const [education, setEducation] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, experience, skills, education, targetRole }),
        credentials: 'include'
      })
      if (!res.ok) { const err = await res.text().catch(() => 'Request failed'); throw new Error(err || `HTTP ${res.status}`); }
      const data = await res.json()
      setResponse(data.response || 'Resume generation failed.')
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
    <ToolPageLayout icon={FileText} eyebrow="Resume" title="Build ATS-friendly resume sections with AI.">
      <BackgroundEffects />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="p-5">
          <p className="text-sm font-medium text-slate-400">Details</p>
          <select value={section} onChange={(e) => setSection(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none">
            <option value="full">Full resume</option>
            <option value="summary">Professional summary</option>
            <option value="experience">Experience</option>
            <option value="skills">Skills</option>
            <option value="education">Education</option>
          </select>
          <textarea value={experience} onChange={(e) => setExperience(e.target.value)} className="mt-3 min-h-[120px] w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white outline-none" placeholder="Experience (roles, achievements, metrics)..." />
          <textarea value={skills} onChange={(e) => setSkills(e.target.value)} className="mt-3 min-h-[100px] w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white outline-none" placeholder="Skills (technical, soft, tools)..." />
          <textarea value={education} onChange={(e) => setEducation(e.target.value)} className="mt-3 min-h-[100px] w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white outline-none" placeholder="Education (degrees, institutions, years)..." />
          <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none" placeholder="Target role (optional)" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110 disabled:opacity-50"><Sparkles className="h-4 w-4" /> Generate</button>
            <button onClick={() => addFavorite({ id: 'resume', label: 'Resume Builder', path: '/resume' })} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Star className="h-4 w-4" /> Save</button>
          </div>
        </GlassPanel>
        <GlassPanel className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Output</p>
            {response && <button onClick={copy} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">{copied ? <><Check className="h-3.5 w-3.5 text-emerald-300" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}</button>}
          </div>
          <div className="mt-4 flex-1 whitespace-pre-line rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">{response || <span className="text-slate-500">Your resume content will appear here.</span>}</div>
        </GlassPanel>
      </div>
    </ToolPageLayout>
  )
}
