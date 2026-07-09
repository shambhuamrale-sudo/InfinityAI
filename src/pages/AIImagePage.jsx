import { motion } from 'framer-motion'
import { ImagePlus, Wand2, Palette, GalleryHorizontalEnd, Star } from 'lucide-react'
import { useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import PremiumButton from '../components/PremiumButton'
import ToastBanner from '../components/ToastBanner'
import { useAppContext } from '../context/AppContext'

const presets = ['Cinematic product mockup', 'Futuristic interface hero', 'Editorial AI portrait']

export default function AIImagePage() {
  const { images, addImageEntry, addFavorite } = useAppContext()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await response.json()
      const text = data.text || data.response || 'Image generation completed.'
      setResult(text)
      const saved = addImageEntry(prompt, text)
      if (!saved) {
        setResult('Daily limit reached. Upgrade to continue generating images.')
      }
    } catch {
      const text = 'Image generation is temporarily unavailable.'
      setResult(text)
    } finally {
      setLoading(false)
      setPrompt('')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-5 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">AI Image Generator</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Create cinematic visuals in seconds.</h1>
            </div>
            <PremiumButton onClick={handleGenerate}>Generate new image</PremiumButton>
            <PremiumButton variant="secondary" onClick={() => addFavorite({ id: 'image', label: 'AI Image', path: '/image' })}><Star className="h-4 w-4" /> Save</PremiumButton>
          </div>
        </motion.header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <GlassPanel className="p-5">
              <ToastBanner title="Image studio ready" message="Generate polished concepts with premium prompts and smooth visual workflows." />
              <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-[#07101f]/80 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-3 text-fuchsia-300"><Palette className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-white">Prompt-driven composition</p>
                    <p className="text-sm text-slate-400">Shape your image with cinematic lighting, polished style, and refined direction.</p>
                  </div>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Prompt presets</p>
                  <h3 className="text-lg font-semibold text-white">Popular directions</h3>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button key={preset} onClick={() => setPrompt(preset)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10">{preset}</button>
                ))}
              </div>
            </GlassPanel>
          </div>

          <GlassPanel className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Studio preview</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Visual concept generator</h2>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">Ready</div>
            </div>

            <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
              <div className="aspect-[4/3] rounded-[1.1rem] border border-white/10 bg-gradient-to-br from-indigo-500/20 via-slate-900 to-fuchsia-500/20 p-4">
                <div className="flex h-full items-center justify-center rounded-[1rem] border border-white/10 bg-[#07101f]/80">
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300"><ImagePlus className="h-8 w-8" /></div>
                    <p className="mt-4 text-lg font-semibold text-white">{loading ? 'Generating concept...' : result || 'Preview will appear here'}</p>
                    <p className="mt-2 text-sm text-slate-400">Create a concept to launch your next visual direction.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3">
              <input value={prompt} onChange={(event) => setPrompt(event.target.value)} className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Describe the image you want to generate" />
              <button onClick={handleGenerate} disabled={loading} className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 p-2 text-white disabled:opacity-60"><Wand2 className="h-4 w-4" /></button>
            </div>
          </GlassPanel>
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-5 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Generated gallery</p>
              <h3 className="text-lg font-semibold text-white">Recent concepts</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {images.length ? images.map((item) => (
              <div key={item.id} className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                <div className="flex h-24 items-center justify-center rounded-[1rem] border border-white/10 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 text-indigo-300"><GalleryHorizontalEnd className="h-8 w-8" /></div>
                <p className="mt-4 text-sm font-semibold text-white">{item.prompt}</p>
                <p className="mt-2 text-sm text-slate-400">{item.result}</p>
              </div>
            )) : <p className="text-sm text-slate-400">No generated images yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
