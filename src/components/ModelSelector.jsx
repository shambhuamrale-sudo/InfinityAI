import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Cloud, Cpu, Gauge, Sparkles, Star } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppContext } from '../context/useAppContext'
import { API_BASE as apiBase } from '../config/api'

const speedLabels = {
  'very-fast': 'Very fast',
  fast: 'Fast',
  medium: 'Medium',
  slow: 'Slow'
}

const qualityLabels = {
  excellent: 'Excellent',
  good: 'Good',
  basic: 'Basic'
}

function Badge({ local }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] ${
        local ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20' : 'bg-indigo-400/10 text-indigo-300 ring-1 ring-indigo-400/20'
      }`}
    >
      {local ? <Cpu className="h-3 w-3" /> : <Cloud className="h-3 w-3" />}
      {local ? 'Local' : 'Cloud'}
    </span>
  )
}

/**
 * ModelSelector
 * -------------
 * Chat model picker. Fetches the provider/model catalog from the backend and
 * lets the user choose a provider + model. The choice is persisted to user
 * preferences via the app context.
 */
export default function ModelSelector({ className = '' }) {
  const { preferences, setChatModelSelection } = useAppContext()
  const [providers, setProviders] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)

  const selectedProvider = preferences?.chatProvider || 'openrouter'
  const selectedModel = preferences?.chatModel || ''

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/providers/models`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setProviders(Array.isArray(data.providers) ? data.providers : [])
        }
      } catch {
        /* keep empty; selector degrades gracefully */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const { activeProvider, activeModel } = useMemo(() => {
    const provider = providers.find((p) => p.id === selectedProvider) || providers[0]
    const models = provider?.models || []
    const model = models.find((m) => m.id === selectedModel) || models[0]
    return { activeProvider: provider, activeModel: model }
  }, [providers, selectedProvider, selectedModel])

  // Ensure a valid default selection once catalogs are loaded.
  useEffect(() => {
    if (loading || !activeProvider) return
    const providerChanged = activeProvider.id !== selectedProvider
    const modelChanged = activeModel && activeModel.id !== selectedModel
    if (providerChanged || modelChanged) {
      setChatModelSelection({ provider: activeProvider.id, model: activeModel?.id || '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, activeProvider?.id, activeModel?.id])

  const handleSelect = (providerId, modelId) => {
    setChatModelSelection({ provider: providerId, model: modelId })
    setOpen(false)
  }

  const label = activeModel?.name || activeProvider?.name || 'Select model'

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-white transition hover:bg-white/[0.07]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-indigo-300" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">{label}</span>
        {activeProvider && <Badge local={activeProvider.local} />}
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute z-50 mt-2 max-h-[22rem] w-[22rem] max-w-[85vw] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0c14]/95 p-2 shadow-2xl backdrop-blur-xl"
            role="listbox"
          >
            {loading && <p className="px-3 py-2 text-sm text-slate-400">Loading models…</p>}
            {!loading && providers.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-400">No providers available.</p>
            )}
            {!loading &&
              providers.map((provider) => (
                <div key={provider.id} className="mb-1.5 last:mb-0">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{provider.name}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge local={provider.local} />
                      {!provider.implemented && (
                        <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-amber-300 ring-1 ring-amber-400/20">
                          Soon
                        </span>
                      )}
                    </div>
                  </div>
                  {(provider.models || []).map((model) => {
                    const isActive = provider.id === selectedProvider && model.id === selectedModel
                    return (
                      <button
                        key={`${provider.id}:${model.id}`}
                        type="button"
                        onClick={() => handleSelect(provider.id, model.id)}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                          isActive ? 'bg-white/[0.08] text-white' : 'text-slate-300 hover:bg-white/[0.05]'
                        }`}
                        role="option"
                        aria-selected={isActive}
                      >
                        <span className="min-w-0 flex-1 truncate font-medium">{model.name}</span>
                        <span className="flex items-center gap-1 text-[0.7rem] text-slate-400">
                          <Gauge className="h-3 w-3" /> {speedLabels[model.speed] || model.speed || '—'}
                        </span>
                        <span className="flex items-center gap-1 text-[0.7rem] text-slate-400">
                          <Star className="h-3 w-3" /> {qualityLabels[model.quality] || model.quality || '—'}
                        </span>
                        {isActive && <Check className="h-4 w-4 shrink-0 text-emerald-300" />}
                      </button>
                    )
                  })}
                  {(!provider.models || provider.models.length === 0) && (
                    <p className="px-3 py-1.5 text-xs text-slate-500">No models listed.</p>
                  )}
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
