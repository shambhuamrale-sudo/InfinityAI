import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Cpu, HardDrive, Monitor, Zap, Activity, Download,
  Trash2, Play, Square, RefreshCw, Sparkles, Brain, Palette, Code2, MessageSquare,
  Wifi, WifiOff, Gpu, ShieldCheck, TrendingUp
} from 'lucide-react'
import { API_BASE } from '../config/api'
import GlassPanel from '../components/GlassPanel'
import BackgroundEffects from '../components/BackgroundEffects'

const SETTINGS_KEY = 'infinityai-local-ai-settings'

const POPULAR_DOWNLOADS = [
  { name: 'llama3.2:3b', size: '2.0 GB' },
  { name: 'llama3.2:1b', size: '1.0 GB' },
  { name: 'codellama:7b', size: '3.8 GB' },
  { name: 'mistral:7b', size: '4.1 GB' },
  { name: 'llama3.1:8b', size: '4.7 GB' },
  { name: 'llava:13b', size: '8.0 GB' },
  { name: 'phi3:mini', size: '1.5 GB' },
  { name: 'gemma2:2b', size: '1.6 GB' }
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function LocalAIPage() {
  const navigate = useNavigate()

  const [hardware, setHardware] = useState(null)
  const [hardwareLoading, setHardwareLoading] = useState(true)

  const [providers, setProviders] = useState([])
  const [providersLoading, setProvidersLoading] = useState(true)

  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(true)

  const [recs, setRecs] = useState([])
  const [recsLoading, setRecsLoading] = useState(true)

  const [activeDownloads, setActiveDownloads] = useState(new Map())
  const [performance, setPerformance] = useState(null)
  const [perfLoading, setPerfLoading] = useState(true)

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return { defaultProvider: 'ollama', defaultModel: 'llama3.2', autoDetect: true, autoUpdate: false, downloadFolder: '' }
  })

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    let cancelled = false

    const fetchHardware = async () => {
      try {
        const res = await fetch(`${API_BASE}/local-ai/hardware`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setHardware(data)
        }
      } catch {}
      if (!cancelled) setHardwareLoading(false)
    }

    const fetchProviders = async () => {
      try {
        const res = await fetch(`${API_BASE}/local-ai/providers/status`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setProviders(data.providers || [])
        }
      } catch {}
      if (!cancelled) setProvidersLoading(false)
    }

    const fetchModels = async () => {
      try {
        const res = await fetch(`${API_BASE}/local-ai/models`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setModels(data.models || [])
        }
      } catch {}
      if (!cancelled) setModelsLoading(false)
    }

    const fetchRecommendations = async () => {
      try {
        const res = await fetch(`${API_BASE}/local-ai/recommendations`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setRecs(data.recommendations || [])
        }
      } catch {}
      if (!cancelled) setRecsLoading(false)
    }

    const fetchPerformance = async () => {
      try {
        const res = await fetch(`${API_BASE}/local-ai/performance`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setPerformance(data)
        }
      } catch {}
      if (!cancelled) setPerfLoading(false)
    }

    fetchHardware()
    fetchProviders()
    fetchModels()
    fetchRecommendations()
    fetchPerformance()

    const providersTimer = setInterval(fetchProviders, 8000)
    const perfTimer = setInterval(fetchPerformance, 3000)

    return () => {
      cancelled = true
      clearInterval(providersTimer)
      clearInterval(perfTimer)
    }
  }, [])

  useEffect(() => {
    if (activeDownloads.size === 0) return
    const timer = setInterval(async () => {
      setActiveDownloads((prev) => {
        if (prev.size === 0) return prev
        const updates = new Map()
        async function check() {
          for (const [id, entry] of prev) {
            try {
              const res = await fetch(`${API_BASE}/local-ai/downloads/${id}`, { credentials: 'include' })
              if (!res.ok) continue
              const data = await res.json()
              updates.set(id, { ...entry, ...data })
            } catch {}
          }
        }
        check()
        if (updates.size > 0) {
          const next = new Map([...prev, ...updates])
          updates.forEach((val, key) => {
            if (val.status === 'completed' || val.status === 'cancelled' || val.status === 'error') {
              setTimeout(() => {
                setActiveDownloads((p) => { const n = new Map(p); n.delete(key); return n })
              }, 3000)
            }
          })
          return next
        }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [activeDownloads])

  const startDownload = useCallback(async (model) => {
    try {
      const res = await fetch(`${API_BASE}/local-ai/models/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ model, provider: settings.defaultProvider })
      })
      if (res.ok) {
        const data = await res.json()
        setActiveDownloads((prev) => new Map(prev.set(data.downloadId, { id: data.downloadId, model, provider: data.provider, status: 'starting', progress: 0, speed: 0, eta: 'Calculating...' })))
      }
    } catch {}
  }, [settings.defaultProvider])

  const cancelDownload = useCallback(async (downloadId) => {
    try {
      await fetch(`${API_BASE}/local-ai/downloads/${downloadId}`, { method: 'DELETE', credentials: 'include' })
      setActiveDownloads((prev) => {
        const next = new Map(prev)
        const entry = next.get(downloadId)
        if (entry) next.set(downloadId, { ...entry, status: 'cancelled' })
        return next
      })
    } catch {}
  }, [])

  const deleteModel = useCallback(async (modelName) => {
    try {
      const res = await fetch(`http://127.0.0.1:11434/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      })
      if (res.ok) {
        setModels((prev) => prev.filter((m) => m.name !== modelName))
      }
    } catch {
      try {
        await fetch(`${API_BASE}/local-ai/models/${encodeURIComponent(modelName)}`, { method: 'DELETE', credentials: 'include' })
        setModels((prev) => prev.filter((m) => m.name !== modelName))
      } catch {}
    }
  }, [])

  const runModel = useCallback((modelName) => {
    setSettings((prev) => ({ ...prev, defaultModel: modelName }))
    navigate('/chat')
  }, [navigate])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    const tasks = [
      fetch(`${API_BASE}/local-ai/hardware`, { credentials: 'include' }).then((r) => r.ok && r.json()).then((d) => { if (d) setHardware(d) }).catch(() => {}),
      fetch(`${API_BASE}/local-ai/providers/status`, { credentials: 'include' }).then((r) => r.ok && r.json()).then((d) => setProviders(d.providers || [])).catch(() => {}),
      fetch(`${API_BASE}/local-ai/models`, { credentials: 'include' }).then((r) => r.ok && r.json()).then((d) => setModels(d.models || [])).catch(() => {}),
      fetch(`${API_BASE}/local-ai/recommendations`, { credentials: 'include' }).then((r) => r.ok && r.json()).then((d) => setRecs(d.recommendations || [])).catch(() => {}),
      fetch(`${API_BASE}/local-ai/performance`, { credentials: 'include' }).then((r) => r.ok && r.json()).then((d) => setPerformance(d)).catch(() => {})
    ]
    await Promise.all(tasks)
    setRefreshing(false)
  }, [])

  const ramAvailable = hardware?.ram?.available || null
  const filteredRecs = useMemo(() => {
    if (!ramAvailable) return recs
    return recs.filter((rec) => parseFloat(rec.ram) <= ramAvailable + 2)
  }, [recs, ramAvailable])

  const StatCard = ({ icon: Icon, label, value, sub, accent = 'from-indigo-500 to-fuchsia-500' }) => (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-3">
        <div className={classNames('grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white', accent)}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-400">{label}</p>
          <p className="truncate text-lg font-semibold text-white">{value}</p>
          {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
        </div>
      </div>
    </GlassPanel>
  )

  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-5 py-6 sm:px-7 lg:py-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass flex flex-col gap-4 rounded-[1.75rem] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-[0_10px_30px_rgba(168,85,247,0.35)]">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Local AI Manager</p>
              <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Your local AI workspace</h1>
            </div>
          </div>
          <button onClick={refreshAll} disabled={refreshing} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-60">
            <RefreshCw className={classNames('h-4 w-4', refreshing && 'animate-spin')} /> Refresh
          </button>
        </motion.header>

        <div className="mt-6 space-y-6">
          {/* Section 1: Hardware */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">Hardware</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Detection</h2>
            </div>
            {hardwareLoading ? (
              <GlassPanel className="p-8 text-center text-slate-400">Detecting hardware...</GlassPanel>
            ) : hardware ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard icon={Cpu} label="CPU" value={hardware.cpu?.model || 'Unknown'} sub={`${hardware.cpu?.cores || '?'} cores · ${hardware.cpu?.speed || '?'}`} accent="from-indigo-500 to-blue-500" />
                <StatCard icon={HardDrive} label="RAM" value={`${hardware.ram?.total || '?'} GB`} sub={`${hardware.ram?.available || '?'} GB available`} accent="from-emerald-500 to-teal-500" />
                <StatCard icon={Monitor} label="OS" value={hardware.os?.platform || 'Unknown'} sub={hardware.os?.release || ''} accent="from-fuchsia-500 to-pink-500" />
                <StatCard icon={Gpu} label="GPU" value={hardware.gpu?.name || 'Not detected'} sub={hardware.gpu?.vendor || ''} accent="from-amber-500 to-orange-500" />
              </div>
            ) : (
              <GlassPanel className="p-8 text-center text-slate-400">Hardware information unavailable</GlassPanel>
            )}
            {hardware && (
              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard icon={Zap} label="CUDA" value={hardware.cudaSupport ? 'Supported' : 'Not supported'} accent={hardware.cudaSupport ? 'from-green-500 to-emerald-500' : 'from-slate-500 to-slate-600'} />
                <StatCard icon={Activity} label="ROCm" value={hardware.rocmSupport ? 'Supported' : 'Not supported'} accent={hardware.rocmSupport ? 'from-green-500 to-emerald-500' : 'from-slate-500 to-slate-600'} />
                <StatCard icon={ShieldCheck} label="Metal" value={hardware.metalSupport ? 'Supported' : 'Not supported'} accent={hardware.metalSupport ? 'from-green-500 to-emerald-500' : 'from-slate-500 to-slate-600'} />
                <StatCard icon={TrendingUp} label="Node" value={`v${hardware.nodeVersion?.replace('v', '') || '?'}`} sub="Runtime" accent="from-violet-500 to-indigo-500" />
              </div>
            )}
          </motion.section>

          {/* Section 2: Local AI Detection */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">Providers</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Local AI Detection</h2>
            </div>
            {providersLoading ? (
              <GlassPanel className="p-8 text-center text-slate-400">Scanning for local providers...</GlassPanel>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {providers.map((provider) => (
                  <GlassPanel key={provider.id} className="flex flex-col gap-3 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {provider.running ? <Wifi className="h-4 w-4 text-emerald-300" /> : <WifiOff className="h-4 w-4 text-slate-500" />}
                        <span className="font-semibold text-white">{provider.name}</span>
                      </div>
                      <span className={classNames('rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.15em]', provider.running ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20' : 'bg-slate-400/10 text-slate-400 ring-1 ring-slate-400/20')}>
                        {provider.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-400">
                      <div className="flex justify-between"><span>Health</span><span className="text-slate-200">{provider.health}</span></div>
                      <div className="flex justify-between"><span>Version</span><span className="text-slate-200">{provider.version || '—'}</span></div>
                      <div className="flex justify-between"><span>Port</span><span className="text-slate-200">{provider.port}</span></div>
                      <div className="flex justify-between"><span>Installed</span><span className="text-slate-200">{provider.installed ? 'Yes' : 'No'}</span></div>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            )}
          </motion.section>

          {/* Section 3: Installed Models */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">Library</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Installed Models</h2>
              </div>
              <button onClick={async () => { setModelsLoading(true); try { const res = await fetch(`${API_BASE}/local-ai/models`, { credentials: 'include' }); if (res.ok) { const data = await res.json(); setModels(data.models || []) } } catch {} finally { setModelsLoading(false) } }} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10">
                <RefreshCw className={classNames('h-3 w-3', modelsLoading && 'animate-spin')} /> Refresh
              </button>
            </div>
            {modelsLoading ? (
              <GlassPanel className="p-8 text-center text-slate-400">Loading models...</GlassPanel>
            ) : models.length === 0 ? (
              <GlassPanel className="p-8 text-center text-slate-400">No models installed. Download your first model below.</GlassPanel>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {models.map((model) => (
                  <GlassPanel key={model.id || model.name} className="flex flex-col gap-3 p-5">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-semibold text-white">{model.name}</span>
                      <span className="text-xs text-slate-400">{model.provider}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div><span className="text-slate-500">Size</span><p className="text-slate-200">{model.size}</p></div>
                      <div><span className="text-slate-500">Quant</span><p className="text-slate-200">{model.quantization}</p></div>
                      <div><span className="text-slate-500">Context</span><p className="text-slate-200">{model.contextLength}</p></div>
                      <div><span className="text-slate-500">Location</span><p className="text-slate-200">{model.location}</p></div>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <button onClick={() => runModel(model.name)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90">
                        <Play className="h-3 w-3" /> Run
                      </button>
                      <button onClick={async () => { setModelsLoading(true); try { const res = await fetch(`${API_BASE}/local-ai/models`, { credentials: 'include' }); if (res.ok) { const data = await res.json(); setModels(data.models || []) } } catch {} finally { setModelsLoading(false) } }} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10">Update</button>
                      <button onClick={() => deleteModel(model.name)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-red-300"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            )}
          </motion.section>

          {/* Section 4: Recommended Models */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">Suggestions</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Recommended Models</h2>
              {ramAvailable && <p className="mt-1 text-sm text-slate-400">Based on {ramAvailable} GB available RAM</p>}
            </div>
            {recsLoading ? (
              <GlassPanel className="p-8 text-center text-slate-400">Loading recommendations...</GlassPanel>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRecs.map((rec) => {
                  const Icon = rec.category.startsWith('Best Coding') ? Code2 : rec.category.startsWith('Best Chat') || rec.category.startsWith('Best Reasoning') ? MessageSquare : rec.category.startsWith('Best Creative') ? Palette : rec.category.startsWith('Best Image') ? Brain : Sparkles
                  return (
                    <GlassPanel key={rec.category} className="flex flex-col gap-3 p-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Icon className="h-5 w-5" /></div>
                        <div>
                          <p className="font-semibold text-white">{rec.category}</p>
                          <p className="text-xs text-slate-400">{rec.model}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">{rec.reason}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1">RAM: {rec.ram}</span>
                        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1">VRAM: {rec.vram}</span>
                        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1">{rec.size}</span>
                        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1">{rec.quantization}</span>
                      </div>
                      <button onClick={() => startDownload(rec.model)} className="flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                        <Download className="h-4 w-4" /> Download
                      </button>
                    </GlassPanel>
                  )
                })}
              </div>
            )}
          </motion.section>

          {/* Section 5: Model Downloader */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">Downloads</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Model Downloader</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <GlassPanel className="p-5">
                <h3 className="mb-3 font-semibold text-white">Available Models</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto chat-scroll">
                  {POPULAR_DOWNLOADS.map((model) => (
                    <div key={model.name} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{model.name}</p>
                        <p className="text-xs text-slate-400">{model.size}</p>
                      </div>
                      <button onClick={() => startDownload(model.name)} className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </GlassPanel>
              <GlassPanel className="p-5">
                <h3 className="mb-3 font-semibold text-white">Active Downloads</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto chat-scroll">
                  {Array.from(activeDownloads.values()).length === 0 && (
                    <p className="text-sm text-slate-500">No active downloads</p>
                  )}
                  {Array.from(activeDownloads.values()).map((dl) => (
                    <div key={dl.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">{dl.model}</p>
                        <span className={classNames('text-xs font-semibold uppercase', dl.status === 'downloading' ? 'text-indigo-300' : dl.status === 'completed' ? 'text-emerald-300' : dl.status === 'cancelled' ? 'text-slate-400' : 'text-red-300')}>{dl.status}</span>
                      </div>
                      {dl.status === 'downloading' && (
                        <>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                            <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" animate={{ width: `${Math.max(1, dl.progress)}%` }} transition={{ duration: 0.3 }} />
                          </div>
                          <div className="mt-2 flex justify-between text-xs text-slate-400">
                            <span>{dl.progress}%</span>
                            <span>{dl.speed > 0 ? `${formatSpeed(dl.speed)}/s` : 'Calculating...'}</span>
                            <span>ETA: {dl.eta}</span>
                          </div>
                        </>
                      )}
                      {dl.status === 'downloading' && (
                        <button onClick={() => cancelDownload(dl.id)} className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10">
                          <Square className="h-3 w-3" /> Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>
          </motion.section>

          {/* Section 6: Performance */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">Monitoring</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Performance</h2>
            </div>
            {perfLoading ? (
              <GlassPanel className="p-8 text-center text-slate-400">Loading performance metrics...</GlassPanel>
            ) : performance ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard icon={Cpu} label="CPU Usage" value={`${performance.cpu?.usage || 0}%`} sub={`${performance.cpu?.cores || '?'} cores`} accent="from-indigo-500 to-blue-500" />
                <StatCard icon={HardDrive} label="RAM Usage" value={`${performance.ram?.used || 0} GB`} sub={`of ${performance.ram?.total || '?'} GB · ${performance.ram?.percent || 0}%`} accent="from-emerald-500 to-teal-500" />
                <StatCard icon={Monitor} label="GPU Usage" value={`${performance.gpu?.usage || 0}%`} sub={`${performance.gpu?.vramUsed || 0} / ${performance.gpu?.vramTotal || 0} MB VRAM`} accent="from-fuchsia-500 to-pink-500" />
                <StatCard icon={Zap} label="Tokens/sec" value={performance.tokensPerSec || '—'} sub={performance.currentModel || 'No model'} accent="from-amber-500 to-orange-500" />
              </div>
            ) : (
              <GlassPanel className="p-8 text-center text-slate-400">Performance metrics unavailable</GlassPanel>
            )}
          </motion.section>

          {/* Section 7: Settings */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">Configure</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Settings</h2>
            </div>
            <GlassPanel className="p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Default Local Provider</label>
                    <select value={settings.defaultProvider} onChange={(e) => setSettings((prev) => ({ ...prev, defaultProvider: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/20">
                      <option value="ollama">Ollama</option>
                      <option value="lm-studio">LM Studio</option>
                      <option value="comfyui">ComfyUI</option>
                      <option value="automatic1111">Automatic1111</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Default Model</label>
                    <input type="text" value={settings.defaultModel} onChange={(e) => setSettings((prev) => ({ ...prev, defaultModel: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/20" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Download Folder</label>
                    <input type="text" value={settings.downloadFolder} onChange={(e) => setSettings((prev) => ({ ...prev, downloadFolder: e.target.value }))} placeholder="/models" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-400/20" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div>
                      <p className="font-medium text-white">Auto Detect</p>
                      <p className="text-sm text-slate-400">Automatically discover local providers</p>
                    </div>
                    <button onClick={() => setSettings((prev) => ({ ...prev, autoDetect: !prev.autoDetect }))} aria-label="Toggle auto detect" className={`relative h-7 w-12 rounded-full transition ${settings.autoDetect ? 'brand-gradient' : 'bg-white/10'}`}>
                      <motion.span layout className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-md" style={{ left: settings.autoDetect ? 26 : 4 }} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div>
                      <p className="font-medium text-white">Auto Update</p>
                      <p className="text-sm text-slate-400">Check for model updates</p>
                    </div>
                    <button onClick={() => setSettings((prev) => ({ ...prev, autoUpdate: !prev.autoUpdate }))} aria-label="Toggle auto update" className={`relative h-7 w-12 rounded-full transition ${settings.autoUpdate ? 'brand-gradient' : 'bg-white/10'}`}>
                      <motion.span layout className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-md" style={{ left: settings.autoUpdate ? 26 : 4 }} />
                    </button>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <p className="font-medium text-white">Storage</p>
                    <p className="mt-1 text-sm text-slate-400">Your local models are stored in the configured download folder.</p>
                     {hardware && <p className="mt-2 text-xs text-slate-500">Disk free space: {hardware.disk ? formatBytes(hardware.disk.free * 1024 * 1024 * 1024) : 'Not Detected'}</p>}
                  </div>
                </div>
              </div>
            </GlassPanel>
          </motion.section>
        </div>
      </div>
    </div>
  )
}

function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || !Number.isFinite(bytesPerSec)) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k))
  return `${parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1))} ${sizes[i]}/s`
}