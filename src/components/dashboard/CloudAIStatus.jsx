import { useEffect, useState } from 'react'
import { Cloud, CloudOff } from 'lucide-react'
import { API_BASE } from '../../config/api'
import { useAppContext } from '../../context/useAppContext'

export default function CloudAIStatus() {
  const { aiMode } = useAppContext()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/providers`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setProviders(data.providers || [])
        }
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
  }, [])

  const cloudStatus = aiMode?.cloudStatus || 'unknown'
  const currentProvider = aiMode?.mode === 'local' && aiMode?.localChatProvider ? aiMode.localChatProvider : 'cloud'

  return (
    <div className="glass rounded-3xl border p-6 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-indigo-300" />
          <h3 className="text-lg font-semibold text-white">Cloud AI</h3>
        </div>
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        ) : cloudStatus === 'connected' ? (
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Connected</span>
        ) : cloudStatus === 'unavailable' ? (
          <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">Unavailable</span>
        ) : (
          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Unknown</span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
          <span className="text-sm text-slate-300">Available providers</span>
          <span className="text-sm font-semibold text-white">{providers.length > 0 ? providers.length : 'Unavailable'}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
          <span className="text-sm text-slate-300">Current provider</span>
          <span className="text-sm font-semibold text-white capitalize">{currentProvider || 'Unavailable'}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
          <span className="text-sm text-slate-300">Health</span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
            {cloudStatus === 'connected' ? <Cloud className="h-3.5 w-3.5 text-emerald-400" /> : <CloudOff className="h-3.5 w-3.5 text-slate-400" />}
            {cloudStatus === 'connected' ? 'Connected' : cloudStatus === 'unavailable' ? 'Unavailable' : 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  )
}
