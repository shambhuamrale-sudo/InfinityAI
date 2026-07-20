import { FileText, Sparkles, Star, Copy, Check, Upload } from 'lucide-react'
import { useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import ToolPageLayout from '../components/ToolPageLayout'
import { useAppContext } from '../context/useAppContext'
import { API_BASE as apiBase } from '../config/api'

export default function OCRPage() {
  const { addFavorite } = useAppContext()
  const [image, setImage] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleExtract = async () => {
    if (!image.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
        credentials: 'include'
      })
      if (!res.ok) { const err = await res.text().catch(() => 'Request failed'); throw new Error(err || `HTTP ${res.status}`); }
      const data = await res.json()
      setResponse(data.response || 'No text detected.')
    } catch {
      setResponse('Service unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result)
    reader.readAsDataURL(file)
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 1400) } catch { /* noop */ }
  }

  return (
    <ToolPageLayout icon={FileText} eyebrow="OCR" title="Extract text from images instantly.">
      <BackgroundEffects />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel className="p-5">
          <p className="text-sm font-medium text-slate-400">Image input</p>
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-slate-300 transition hover:border-indigo-400/40 hover:text-white">
            <Upload className="h-5 w-5" />
            <span>{image ? 'Image loaded — click to replace' : 'Click to upload an image'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          {image && <img src={image} alt="Preview" className="mt-3 max-h-48 rounded-xl object-contain" />}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={handleExtract} disabled={loading || !image} className="flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110 disabled:opacity-50"><Sparkles className="h-4 w-4" /> Extract text</button>
            <button onClick={() => addFavorite({ id: 'ocr', label: 'OCR', path: '/ocr' })} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Star className="h-4 w-4" /> Save</button>
          </div>
        </GlassPanel>
        <GlassPanel className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Extracted text</p>
            {response && <button onClick={copy} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">{copied ? <><Check className="h-3.5 w-3.5 text-emerald-300" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}</button>}
          </div>
          <div className="mt-4 flex-1 whitespace-pre-line rounded-[1.1rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">{response || <span className="text-slate-500">Upload an image to extract text.</span>}</div>
        </GlassPanel>
      </div>
    </ToolPageLayout>
  )
}
