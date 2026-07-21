import { AnimatePresence, motion } from 'framer-motion'
import { Cloud, Cpu, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/useAppContext'
import { API_BASE as apiBase } from '../config/api'

const providerLabels = {
  openrouter: 'OpenRouter',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  ollama: 'Ollama Local',
  groq: 'Groq',
  together: 'Together AI',
  mistral: 'Mistral',
  cohere: 'Cohere',
  perplexity: 'Perplexity'
}

export default function ProviderSelector() {
  const { preferences, setChatModelSelection } = useAppContext()
  const [providers, setProviders] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)

  const selectedProvider = preferences?.chatProvider || 'openrouter'

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
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const activeProvider = providers.find((p) => p.id === selectedProvider) || providers[0]

  const handleSelect = (providerId) => {
    setChatModelSelection({ provider: providerId })
    setOpen(false)
  }

  const label = activeProvider?.name || providerLabels[selectedProvider] || 'Select provider'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-white transition hover:bg-white/[0.07]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate text-left font-medium">{label}</span>
        <span className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`}>
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute z-50 mt-2 max-h-[22rem] w-56 max-w-[85vw] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0c14]/95 p-2 shadow-2xl backdrop-blur-xl"
            role="listbox"
          >
            {loading && <p className="px-3 py-2 text-sm text-slate-400">Loading providers…</p>}
            {!loading && providers.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-400">No providers available.</p>
            )}
            {!loading &&
              providers.map((provider) => {
                const isActive = provider.id === selectedProvider
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleSelect(provider.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                      isActive ? 'bg-white/[0.08] text-white' : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                      provider.local ? 'bg-emerald-400/10 text-emerald-300' : 'bg-indigo-400/10 text-indigo-300'
                    }`}>
                      {provider.local ? <Cpu className="h-3.5 w-3.5" /> : <Cloud className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{provider.name}</span>
                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    )}
                  </button>
                )
              })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
