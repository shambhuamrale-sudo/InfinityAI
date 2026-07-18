import { motion, AnimatePresence } from 'framer-motion'
import { ImagePlus, Wand2, Sparkles, Dice5, X, Sliders, GalleryHorizontalEnd, Search, Star, Folder, History, Layers, Square } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import EmptyState from '../components/EmptyState'
import ImageCard from '../components/ImageCard'
import { useAppContext } from '../context/useAppContext'
import useImageStudio, { cacheImage } from '../hooks/useImageStudio'
import { ASPECT_RATIOS, RESOLUTIONS, PRESET_STYLES, EDIT_OPERATIONS, downloadImage } from '../components/imageStudio'

const PAGE_SIZE = 12

export default function AIImagePage() {
  const {
    images,
    imageStudio,
    addImageEntry,
    deleteImageEntry,
    toggleImageFavorite,
    setImageTags,
    addImageCollection,
    assignImageCollection,
    saveImageSettings,
    clearImagePromptHistory,
    addFavorite,
    addToast
  } = useAppContext()

  const studio = useImageStudio()
  const saved = imageStudio?.settings || {}

  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState(saved.negativePrompt || '')
  const [provider, setProvider] = useState(saved.provider || 'local')
  const [model, setModel] = useState(saved.model || '')
  const [aspectRatio, setAspectRatio] = useState(saved.aspectRatio || '1:1')
  const [resolution, setResolution] = useState('hd')
  const [steps, setSteps] = useState(saved.steps || 30)
  const [guidanceScale, setGuidanceScale] = useState(saved.guidanceScale || 7)
  const [seed, setSeed] = useState(saved.seed || '')
  const [batchSize, setBatchSize] = useState(saved.batchSize || 1)
  const [style, setStyle] = useState(saved.style || 'none')
  const [preview, setPreview] = useState(null)
  const [statusText, setStatusText] = useState('')

  // Gallery controls
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all') // all | favorites | collection id
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [editTarget, setEditTarget] = useState(null)
  const sentinelRef = useRef(null)

  const activeProvider = useMemo(
    () => studio.providers.find((p) => p.id === provider) || studio.providers[0],
    [studio.providers, provider]
  )
  const modelOptions = activeProvider?.models || []

  // Keep a valid model selected for the active provider.
  useEffect(() => {
    if (!activeProvider) return
    const ids = (activeProvider.models || []).map((m) => m.id)
    if (!ids.includes(model)) setModel(ids[0] || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProvider?.id])

  const dimensions = useMemo(() => {
    const ratio = ASPECT_RATIOS.find((r) => r.id === aspectRatio) || ASPECT_RATIOS[0]
    const scale = (RESOLUTIONS.find((r) => r.id === resolution) || RESOLUTIONS[1]).scale
    const long = Math.max(ratio.width, ratio.height)
    const factor = scale / long
    const round8 = (n) => Math.max(128, Math.round((n * factor) / 8) * 8)
    return { width: round8(ratio.width), height: round8(ratio.height) }
  }, [aspectRatio, resolution])

  const persistSettings = () => {
    saveImageSettings({ provider, model, aspectRatio, steps, guidanceScale, seed, batchSize, style, negativePrompt })
  }

  const buildPrompt = () => {
    const suffix = (PRESET_STYLES.find((s) => s.id === style) || {}).suffix || ''
    return `${prompt.trim()}${suffix}`
  }

  const runGenerate = async (overridePrompt) => {
    const finalPrompt = overridePrompt !== undefined ? overridePrompt : buildPrompt()
    if (!finalPrompt.trim()) {
      addToast({ kind: 'error', title: 'Prompt required', message: 'Describe the image you want to generate.' })
      return
    }
    setStatusText('Generating…')
    persistSettings()
    const params = {
      prompt: finalPrompt,
      negativePrompt,
      provider,
      model,
      width: dimensions.width,
      height: dimensions.height,
      steps: Number(steps),
      guidanceScale: Number(guidanceScale),
      batchSize: Number(batchSize),
      ...(seed !== '' && seed !== null ? { seed: Number(seed) } : {})
    }
    const data = await studio.generate(params)
    if (data?.cancelled) {
      setStatusText('Generation cancelled')
      return
    }
    if (data?.error) {
      setStatusText('Generation failed')
      addToast({ kind: 'error', title: 'Generation failed', message: 'The image service is temporarily unavailable.' })
      return
    }
    const generated = Array.isArray(data.images) ? data.images : []
    generated.forEach((img, i) => cacheImage(`${Date.now()}_${i}`, img.url))
    setPreview(generated[0]?.url || null)
    setStatusText(data.text || 'Done')
    const entry = addImageEntry(prompt.trim() || finalPrompt, data.text || 'Image generated.', {
      images: generated,
      negativePrompt,
      provider: data.provider || provider,
      model: data.model || model,
      settings: { aspectRatio, resolution, steps, guidanceScale, seed, batchSize, style, width: dimensions.width, height: dimensions.height }
    })
    if (!entry) setStatusText('Daily limit reached. Upgrade to continue generating images.')
  }

  const runEdit = async (operation, entry) => {
    const source = entry.images?.[0]
    setStatusText(`Applying ${operation}…`)
    const data = await studio.edit({
      operation,
      provider: entry.provider || provider,
      model: entry.model || model,
      prompt: entry.prompt,
      negativePrompt: entry.negativePrompt || '',
      image: source?.url,
      width: source?.width || dimensions.width,
      height: source?.height || dimensions.height,
      steps: Number(steps),
      guidanceScale: Number(guidanceScale)
    })
    if (data?.cancelled || data?.error) {
      setStatusText(data?.error ? 'Edit failed' : 'Edit cancelled')
      if (data?.error) addToast({ kind: 'error', title: 'Edit failed', message: 'The editing service is temporarily unavailable.' })
      return
    }
    const edited = Array.isArray(data.images) ? data.images : []
    setPreview(edited[0]?.url || null)
    setStatusText(data.text || 'Edit complete')
    const label = (EDIT_OPERATIONS.find((o) => o.id === operation) || {}).label || operation
    addImageEntry(`${label}: ${entry.prompt}`, data.text || 'Edited image.', {
      images: edited,
      negativePrompt: entry.negativePrompt || '',
      provider: data.provider || entry.provider,
      model: data.model || entry.model,
      tags: [...(entry.tags || []), operation],
      settings: entry.settings || {}
    })
    setEditTarget(null)
  }

  const duplicateSettings = (entry) => {
    const s = entry.settings || {}
    if (s.aspectRatio) setAspectRatio(s.aspectRatio)
    if (s.resolution) setResolution(s.resolution)
    if (s.steps) setSteps(s.steps)
    if (s.guidanceScale) setGuidanceScale(s.guidanceScale)
    if (s.seed !== undefined) setSeed(s.seed)
    if (s.batchSize) setBatchSize(s.batchSize)
    if (s.style) setStyle(s.style)
    if (entry.provider) setProvider(entry.provider)
    if (entry.model) setModel(entry.model)
    setNegativePrompt(entry.negativePrompt || '')
    setPrompt(entry.prompt || '')
    addToast({ kind: 'success', title: 'Settings applied', message: 'Generation settings copied from this image.' })
  }

  const handleCardAction = async (action, entry, extra) => {
    if (action === 'download') {
      const url = entry.images?.[0]?.url
      if (url) {
        const ok = await downloadImage(url, entry.prompt || 'infinityai')
        addToast(ok ? { kind: 'success', title: 'Downloaded', message: 'Image saved to your device.' } : { kind: 'error', title: 'Download failed', message: 'Could not download the image.' })
      }
    } else if (action === 'copy-prompt') {
      await navigator.clipboard.writeText(entry.prompt || '').catch(() => {})
      addToast({ kind: 'success', title: 'Prompt copied', message: 'The prompt is on your clipboard.' })
    } else if (action === 'duplicate') {
      duplicateSettings(entry)
    } else if (action === 'delete') {
      deleteImageEntry(entry.id)
      addToast({ kind: 'info', title: 'Image deleted', message: 'Removed from your gallery.' })
    } else if (action === 'share') {
      const url = entry.images?.[0]?.url || ''
      if (navigator.share) {
        navigator.share({ title: 'InfinityAI image', text: entry.prompt, url: url.startsWith('http') ? url : undefined }).catch(() => {})
      } else {
        await navigator.clipboard.writeText(entry.prompt || '').catch(() => {})
        addToast({ kind: 'success', title: 'Share ready', message: 'Prompt copied — sharing dialog unavailable in this browser.' })
      }
    } else if (action === 'regenerate') {
      duplicateSettings(entry)
      await runGenerate(entry.prompt)
    } else if (action === 'favorite') {
      toggleImageFavorite(entry.id)
    } else if (action === 'tags') {
      setImageTags(entry.id, extra)
    } else if (action === 'collection') {
      setEditTarget({ mode: 'collection', entry })
    }
  }

  // Filter + search + infinite scroll
  const filtered = useMemo(() => {
    let list = images || []
    if (filter === 'favorites') list = list.filter((i) => i.favorite)
    else if (filter !== 'all') list = list.filter((i) => i.collectionId === filter)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((i) =>
        (i.prompt || '').toLowerCase().includes(q) ||
        (i.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [images, filter, query])

  const visible = filtered.slice(0, visibleCount)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter, query])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < filtered.length) {
        setVisibleCount((c) => c + PAGE_SIZE)
      }
    }, { rootMargin: '300px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [visibleCount, filtered.length])

  const collections = imageStudio?.collections || []
  const promptHistory = imageStudio?.promptHistory || []

  const handleRandomPrompt = async () => {
    const rp = await studio.randomPrompt()
    if (rp) setPrompt(rp)
  }

  const handleNewCollection = () => {
    const name = window.prompt('Collection name')
    if (name && name.trim()) {
      const col = addImageCollection(name.trim())
      if (editTarget?.mode === 'collection' && editTarget.entry) {
        assignImageCollection(editTarget.entry.id, col.id)
        setEditTarget(null)
      }
    }
  }

  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-[100rem] px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass flex flex-col gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-fuchsia-300 ring-1 ring-white/10"><ImagePlus className="h-5 w-5" /></div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">AI Image Studio</p>
              <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Design premium visuals with full control.</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {studio.generating ? (
              <button onClick={studio.cancel} className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20">
                <X className="h-4 w-4" /> Cancel
              </button>
            ) : null}
            <button onClick={() => addFavorite({ id: 'image', label: 'AI Image', path: '/image' })} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10" aria-label="Save"><Star className="h-4 w-4" /></button>
          </div>
        </motion.header>

        {studio.generating || studio.progress > 0 ? (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full brand-gradient" animate={{ width: `${studio.progress}%` }} transition={{ ease: 'easeOut', duration: 0.2 }} />
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* ── Left: workspace + settings ─────────────────────────── */}
          <div className="space-y-6">
            <GlassPanel className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-indigo-300" /> Prompt</div>
                <button onClick={handleRandomPrompt} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"><Dice5 className="h-3.5 w-3.5" /> Random</button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runGenerate() }}
                rows={4}
                placeholder="Describe the image you want to create… (Ctrl+Enter to generate)"
                className="mt-3 w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm text-white outline-none transition focus:border-indigo-400/40 placeholder:text-slate-500"
              />
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-slate-400">Negative prompt</label>
              <input
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to avoid (e.g. blurry, low quality, extra fingers)"
                className="mt-1.5 w-full rounded-2xl border border-white/8 bg-white/[0.03] p-2.5 text-sm text-white outline-none transition focus:border-indigo-400/40 placeholder:text-slate-500"
              />

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Preset styles</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRESET_STYLES.map((s) => (
                    <button key={s.id} onClick={() => setStyle(s.id)} className={`rounded-full border px-3 py-1.5 text-xs transition ${style === s.id ? 'border-indigo-400/50 bg-indigo-500/20 text-white' : 'border-white/8 bg-white/[0.04] text-slate-300 hover:bg-white/10'}`}>{s.label}</button>
                  ))}
                </div>
              </div>

              {promptHistory.length ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400"><History className="h-3.5 w-3.5" /> Prompt history</p>
                    <button onClick={clearImagePromptHistory} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {promptHistory.slice(0, 8).map((p, i) => (
                      <button key={`${p}_${i}`} onClick={() => setPrompt(p)} className="max-w-[16rem] truncate rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10" title={p}>{p}</button>
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                onClick={() => runGenerate()}
                disabled={studio.generating}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110 disabled:opacity-60"
              >
                <Wand2 className="h-4 w-4" /> {studio.generating ? 'Generating…' : `Generate${batchSize > 1 ? ` ${batchSize}` : ''}`}
              </button>
            </GlassPanel>

            <GlassPanel className="p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Sliders className="h-4 w-4 text-indigo-300" /> Generation settings</div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Provider">
                  <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full rounded-xl border border-white/8 bg-[#0a0c14] px-3 py-2 text-sm text-white outline-none">
                    {studio.providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{!p.implemented ? ' (placeholder)' : ''}</option>
                    ))}
                    {!studio.providers.length && <option value="local">InfinityAI Local Renderer</option>}
                  </select>
                </Field>
                <Field label="Model">
                  <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full rounded-xl border border-white/8 bg-[#0a0c14] px-3 py-2 text-sm text-white outline-none">
                    {modelOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    {!modelOptions.length && <option value="">Default</option>}
                  </select>
                </Field>
              </div>

              <Field label="Aspect ratio" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {ASPECT_RATIOS.map((r) => (
                    <button key={r.id} onClick={() => setAspectRatio(r.id)} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${aspectRatio === r.id ? 'border-indigo-400/50 bg-indigo-500/20 text-white' : 'border-white/8 bg-white/[0.04] text-slate-300 hover:bg-white/10'}`}>
                      <Square className="h-3 w-3" /> {r.id}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Resolution" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {RESOLUTIONS.map((r) => (
                    <button key={r.id} onClick={() => setResolution(r.id)} className={`rounded-lg border px-3 py-1.5 text-xs transition ${resolution === r.id ? 'border-indigo-400/50 bg-indigo-500/20 text-white' : 'border-white/8 bg-white/[0.04] text-slate-300 hover:bg-white/10'}`}>{r.label}</button>
                  ))}
                  <span className="self-center text-xs text-slate-500">{dimensions.width}×{dimensions.height}</span>
                </div>
              </Field>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label={`Steps · ${steps}`}>
                  <input type="range" min="1" max="150" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full accent-indigo-500" />
                </Field>
                <Field label={`Guidance · ${guidanceScale}`}>
                  <input type="range" min="0" max="30" step="0.5" value={guidanceScale} onChange={(e) => setGuidanceScale(Number(e.target.value))} className="w-full accent-indigo-500" />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Seed">
                  <div className="flex gap-2">
                    <input value={seed} onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Random" className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none" />
                    <button onClick={() => setSeed(String(Math.floor(Math.random() * 1_000_000)))} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[0.04] text-slate-300 transition hover:bg-white/10" aria-label="Random seed"><Dice5 className="h-4 w-4" /></button>
                  </div>
                </Field>
                <Field label={`Batch size · ${batchSize}`}>
                  <input type="range" min="1" max="8" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} className="w-full accent-indigo-500" />
                </Field>
              </div>
            </GlassPanel>
          </div>

          {/* ── Right: preview + editing ───────────────────────────── */}
          <div className="space-y-6">
            <GlassPanel className="flex flex-col p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Studio preview</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Latest render</h2>
                </div>
                <div className={`rounded-full border px-3 py-1 text-sm ${studio.generating ? 'border-indigo-400/20 bg-indigo-400/10 text-indigo-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'}`}>{studio.generating ? 'Working…' : 'Ready'}</div>
              </div>

              <div className="mt-5 flex-1 rounded-[1.5rem] border border-white/8 bg-gradient-to-br from-indigo-500/10 via-slate-900/40 to-fuchsia-500/10 p-4">
                <div className="flex min-h-[20rem] items-center justify-center rounded-[1rem] border border-white/10 bg-[#07101f]/70 p-3">
                  {preview ? (
                    <img src={preview} alt="Latest render" className="max-h-[26rem] w-auto rounded-xl object-contain" />
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><ImagePlus className="h-8 w-8" /></div>
                      <p className="mt-4 text-base font-semibold text-white">{studio.generating ? 'Generating concept…' : 'Preview will appear here'}</p>
                      <p className="mt-2 text-sm text-slate-400">{statusText || 'Create a concept to launch your next visual direction.'}</p>
                    </div>
                  )}
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Layers className="h-4 w-4 text-indigo-300" /> AI editing</div>
              <p className="text-xs text-slate-400">Applies to your most recent image{images[0] ? '' : ' (generate one first)'}.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {EDIT_OPERATIONS.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => images[0] && runEdit(op.id, images[0])}
                    disabled={!images[0] || studio.generating}
                    className="flex flex-col items-start rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-sm font-medium text-white">{op.label}</span>
                    <span className="mt-0.5 text-xs text-slate-400">{op.description}</span>
                  </button>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>

        {/* ── Gallery ──────────────────────────────────────────────── */}
        <GlassPanel className="mt-6 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <GalleryHorizontalEnd className="h-5 w-5 text-indigo-300" />
              <h3 className="text-lg font-semibold text-white">Gallery</h3>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition focus-within:border-indigo-400/40">
                <Search className="h-4 w-4 shrink-0" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts or tags" className="w-40 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 sm:w-52" />
              </div>
              <button onClick={handleNewCollection} className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"><Folder className="h-3.5 w-3.5" /> New collection</button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
            <FilterChip active={filter === 'favorites'} onClick={() => setFilter('favorites')}><Star className="h-3.5 w-3.5" /> Favorites</FilterChip>
            {collections.map((c) => (
              <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}><Folder className="h-3.5 w-3.5" /> {c.name}</FilterChip>
            ))}
          </div>

          <div className="mt-5">
            {visible.length ? (
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
                {visible.map((entry) => (
                  <ImageCard key={entry.id} entry={entry} onAction={handleCardAction} searchQuery={query} />
                ))}
              </div>
            ) : images.length ? (
              <EmptyState icon={Search} title="No matches found" description="Try a different keyword, tag, or filter." />
            ) : (
              <EmptyState icon={ImagePlus} title="No images yet" description="Generate your first concept above and it will appear here." />
            )}
            <div ref={sentinelRef} className="h-8" />
            {visibleCount < filtered.length && <p className="py-4 text-center text-sm text-slate-500">Loading more…</p>}
          </div>
        </GlassPanel>
      </div>

      {/* ── Collection picker modal ───────────────────────────────── */}
      <AnimatePresence>
        {editTarget?.mode === 'collection' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4" onClick={() => setEditTarget(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="glass w-full max-w-sm rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-white">Add to collection</h4>
                <button onClick={() => setEditTarget(null)} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-slate-300 hover:bg-white/10"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 space-y-2">
                {collections.length ? collections.map((c) => (
                  <button key={c.id} onClick={() => { assignImageCollection(editTarget.entry.id, c.id); setEditTarget(null); addToast({ kind: 'success', title: 'Added', message: `Added to ${c.name}.` }) }} className="flex w-full items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/[0.07]">
                    <Folder className="h-4 w-4 text-indigo-300" /> {c.name}
                  </button>
                )) : <p className="text-sm text-slate-400">No collections yet.</p>}
                <button onClick={handleNewCollection} className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.04]"><Folder className="h-4 w-4" /> Create new collection</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function FilterChip({ children, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${active ? 'border-indigo-400/50 bg-indigo-500/20 text-white' : 'border-white/8 bg-white/[0.04] text-slate-300 hover:bg-white/10'}`}>{children}</button>
  )
}
