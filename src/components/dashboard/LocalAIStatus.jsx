import { useEffect, useState } from 'react'
import { Cpu, Wifi, WifiOff } from 'lucide-react'
import { API_BASE } from '../../config/api'

export default function LocalAIStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/local-ai/providers/status`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setStatus(data.providers || [])
        }
      } catch {}
      if (!cancelled) setLoading(false)
    }
    load()
    const timer = setInterval(load, 12000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])

  const providers = status || []
  const running = providers.filter(p => p.running).map(p => p.name)
  const installed = providers.filter(p => p.installed).map(p => p.name)

  return (
    <div className="glass rounded-3xl border p-6 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-emerald-300" />
          <h3 className="text-lg font-semibold text-white">Local AI</h3>
        </div>
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        ) : running.length > 0 ? (
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Running</span>
        ) : (
          <span className="rounded-full border border-slate-400/25 bg-slate-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Offline</span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
          <span className="text-sm text-slate-300">Installed providers</span>
          <span className="text-sm font-semibold text-white">{installed.length > 0 ? installed.join(', ') : 'Unavailable'}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
          <span className="text-sm text-slate-300">Active services</span>
          <span className="text-sm font-semibold text-white">{running.length > 0 ? running.join(', ') : 'Unavailable'}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
          <span className="text-sm text-slate-300">Health</span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
            {running.length > 0 ? <Wifi className="h-3.5 w-3.5 text-emerald-400" /> : <WifiOff className="h-3.5 w-3.5 text-slate-400" />}
            {running.length > 0 ? 'Healthy' : 'Unavailable'}
          </span>
        </div>
      </div>
    </div>
  )
}
