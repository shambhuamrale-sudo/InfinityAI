import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { ImagePlus, X, PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen, Star, Folder } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import useImageStudio, { cacheImage } from '../hooks/useImageStudio'
import { ASPECT_RATIOS, RESOLUTIONS, PRESET_STYLES, EDIT_OPERATIONS, downloadImage } from '../components/imageStudio'
import { useAppContext } from '../context/useAppContext'
import PromptPanel from '../components/image-studio/PromptPanel'
import WorkspacePanel from '../components/image-studio/WorkspacePanel'
import GalleryPanel from '../components/image-studio/GalleryPanel'

export default function AIImagePage() {
  const {
    images,
    imageStudio,
    preferences,
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
  const [elapsed, setElapsed] = useState(0)

  // Gallery controls
  const [editTarget, setEditTarget] = useState(null)

  // Panel visibility
  const [showPromptPanel, setShowPromptPanel] = useState(true)
  const [showGalleryPanel, setShowGalleryPanel] = useState(true)

  // Track elapsed time during generation
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)

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

  useEffect(() => {
    if (studio.generating) {
      startTimeRef.current = Date.now()
      timerRef.current = window.setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000)
      }, 100)
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current)
      setElapsed(0)
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [studio.generating])

  const persistSettings = useCallback(() => {
    saveImageSettings({ provider, model, aspectRatio, steps, guidanceScale, seed, batchSize, style, negativePrompt })
  }, [provider, model, aspectRatio, steps, guidanceScale, seed, batchSize, style, negativePrompt, saveImageSettings])

  const buildPrompt = useCallback(() => {
    const suffix = (PRESET_STYLES.find((s) => s.id === style) || {}).suffix || ''
    return `${prompt.trim()}${suffix}`
  }, [prompt, style])

  const runGenerate = useCallback(async (overridePrompt) => {
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
      aiMode: preferences?.defaultAIMode || 'cloud',
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
  }, [buildPrompt, negativePrompt, provider, model, dimensions, steps, guidanceScale, batchSize, preferences, seed, studio, addImageEntry, addToast, persistSettings, prompt, aspectRatio, resolution, style])

  const runEdit = useCallback(async (operation, entry) => {
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
      guidanceScale: Number(guidanceScale),
      aiMode: preferences?.defaultAIMode || 'cloud'
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
  }, [provider, model, dimensions, steps, guidanceScale, preferences, studio, addImageEntry, addToast])

  const duplicateSettings = useCallback((entry) => {
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
  }, [addToast])

  const handleCardAction = useCallback(async (action, data) => {
    const entry = data.entry || data
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
      if (preview && entry.images?.[0]?.url === preview) setPreview(null)
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
      setImageTags(entry.id, data)
    } else if (action === 'collection') {
      setEditTarget({ mode: 'collection', entry })
    }
  }, [duplicateSettings, deleteImageEntry, preview, addToast, runGenerate, toggleImageFavorite, setImageTags])

  const collections = imageStudio?.collections || []
  const promptHistory = imageStudio?.promptHistory || []

  const handleRandomPrompt = useCallback(async () => {
    const rp = await studio.randomPrompt()
    if (rp) setPrompt(rp)
  }, [studio, setPrompt])

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
      <div className="relative z-10 mx-auto max-w-[100rem] px-2 py-3 sm:px-4 lg:px-6 h-screen flex flex-col">
        {/* Top Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex items-center justify-between rounded-[1.5rem] p-4 shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.05] text-fuchsia-300 ring-1 ring-white/10 shadow-[0_0_16px_rgba(168,85,247,0.15)]">
              <ImagePlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">AI Image Studio</p>
              <h1 className="text-lg font-semibold tracking-tight text-white">Professional Image Generation</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {studio.generating ? (
              <button onClick={studio.cancel} className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 hover:scale-105 active:scale-95">
                <X className="h-4 w-4" /> Cancel
              </button>
            ) : null}
            <button
              onClick={() => setShowPromptPanel((v) => !v)}
              className={`hidden lg:grid h-9 w-9 place-items-center rounded-full border transition-all duration-200 hover:scale-110 ${showPromptPanel ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'}`}
              aria-label="Toggle prompt panel"
            >
              {showPromptPanel ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowGalleryPanel((v) => !v)}
              className={`hidden xl:grid h-9 w-9 place-items-center rounded-full border transition-all duration-200 hover:scale-110 ${showGalleryPanel ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'}`}
              aria-label="Toggle gallery panel"
            >
              {showGalleryPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </button>
            <button onClick={() => addFavorite({ id: 'image', label: 'AI Image', path: '/image' })} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10 hover:scale-110 active:scale-95" aria-label="Save">
              <Star className="h-4 w-4" />
            </button>
          </div>
        </motion.header>

        {/* Main 3-Panel Layout */}
        <div className="flex-1 mt-3 grid gap-3 overflow-hidden min-h-0" style={{ gridTemplateColumns: `1fr` }}>
          {/* Mobile table toggle */}
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowPromptPanel(true)}
              className={`flex-1 rounded-full border py-2 text-xs font-medium transition ${showPromptPanel ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200' : 'border-white/10 bg-white/[0.04] text-slate-300'}`}
            >
              Prompt
            </button>
            <button
              onClick={() => setShowGalleryPanel(true)}
              className={`flex-1 rounded-full border py-2 text-xs font-medium transition ${showGalleryPanel ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200' : 'border-white/10 bg-white/[0.04] text-slate-300'}`}
            >
              Gallery
            </button>
          </div>

          {/* Desktop 3-panel */}
          <div className="hidden lg:grid h-full" style={{ gridTemplateColumns: `${showPromptPanel ? 'minmax(320px, 340px)' : '0px'} 1fr ${showGalleryPanel ? 'minmax(340px, 380px)' : '0px'}` }}>
            <div className={`overflow-hidden transition-all duration-300 ${showPromptPanel ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <PromptPanel
                prompt={prompt}
                setPrompt={setPrompt}
                negativePrompt={negativePrompt}
                setNegativePrompt={setNegativePrompt}
                provider={provider}
                setProvider={setProvider}
                model={model}
                setModel={setModel}
                modelOptions={modelOptions}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                resolution={resolution}
                setResolution={setResolution}
                steps={steps}
                setSteps={setSteps}
                guidanceScale={guidanceScale}
                setGuidanceScale={setGuidanceScale}
                seed={seed}
                setSeed={setSeed}
                batchSize={batchSize}
                setBatchSize={setBatchSize}
                style={style}
                setStyle={setStyle}
                generating={studio.generating}
                onGenerate={() => runGenerate()}
                onCancel={studio.cancel}
                providers={studio.providers}
                promptHistory={promptHistory}
                onClearPromptHistory={clearImagePromptHistory}
                onSelectPrompt={setPrompt}
                onRandomPrompt={handleRandomPrompt}
                dimensions={dimensions}
                isOpen={showPromptPanel}
              />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${showPromptPanel ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <WorkspacePanel
                preview={preview}
                statusText={statusText}
                generating={studio.generating}
                progress={studio.progress}
                provider={activeProvider?.name}
                model={modelOptions.find(m => m.id === model)?.name}
                elapsed={elapsed}
                onCancel={studio.cancel}
                onEdit={runEdit}
                images={images}
                prompt={prompt}
                setPrompt={setPrompt}
                onGenerate={runGenerate}
              />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${showGalleryPanel ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <GalleryPanel
                images={images}
                onAction={handleCardAction}
                promptHistory={promptHistory}
                collections={collections}
                isOpen={showGalleryPanel}
              />
            </div>
          </div>

          {/* Mobile stacked layout */}
          <div className="lg:hidden flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {showPromptPanel && (
              <PromptPanel
                prompt={prompt}
                setPrompt={setPrompt}
                negativePrompt={negativePrompt}
                setNegativePrompt={setNegativePrompt}
                provider={provider}
                setProvider={setProvider}
                model={model}
                setModel={setModel}
                modelOptions={modelOptions}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                resolution={resolution}
                setResolution={setResolution}
                steps={steps}
                setSteps={setSteps}
                guidanceScale={guidanceScale}
                setGuidanceScale={setGuidanceScale}
                seed={seed}
                setSeed={setSeed}
                batchSize={batchSize}
                setBatchSize={setBatchSize}
                style={style}
                setStyle={setStyle}
                generating={studio.generating}
                onGenerate={() => runGenerate()}
                onCancel={studio.cancel}
                providers={studio.providers}
                promptHistory={promptHistory}
                onClearPromptHistory={clearImagePromptHistory}
                onSelectPrompt={setPrompt}
                onRandomPrompt={handleRandomPrompt}
                dimensions={dimensions}
                isOpen={true}
              />
            )}
            {showGalleryPanel && (
              <GalleryPanel
                images={images}
                onAction={handleCardAction}
                promptHistory={promptHistory}
                collections={collections}
                isOpen={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Collection picker modal */}
      <AnimatePresence>
        {editTarget?.mode === 'collection' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4"
            onClick={() => setEditTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="glass w-full max-w-sm rounded-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-white">Add to collection</h4>
                <button onClick={() => setEditTarget(null)} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:bg-white/10 hover:scale-110 active:scale-90">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {collections.length ? collections.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { assignImageCollection(editTarget.entry.id, c.id); setEditTarget(null); addToast({ kind: 'success', title: 'Added', message: `Added to ${c.name}.` }) }}
                    className="flex w-full items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/[0.07] hover:border-white/15 hover:shadow-lg hover:shadow-black/10 active:scale-[0.98]"
                  >
                    <Folder className="h-4 w-4 text-indigo-300" /> {c.name}
                  </button>
                )) : <p className="text-sm text-slate-400">No collections yet.</p>}
                <button onClick={handleNewCollection} className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.04] hover:border-white/30 active:scale-[0.98]">
                  <Folder className="h-4 w-4" /> Create new collection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
