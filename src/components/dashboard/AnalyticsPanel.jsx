import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RadioTower, Layers3, Cpu, Gauge, ShieldCheck, Activity } from 'lucide-react'
import StatusBadge from './StatusBadge'

const chartData = [
  { name: 'Mon', usage: 40 }, { name: 'Tue', usage: 58 }, { name: 'Wed', usage: 47 },
  { name: 'Thu', usage: 72 }, { name: 'Fri', usage: 84 }, { name: 'Sat', usage: 69 }, { name: 'Sun', usage: 91 }
]

export default function AnalyticsPanel({ adminConfig, isDark }) {
  const soft = isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white/70'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'
  const providerStatuses = adminConfig?.providerStatuses || {}
  const providerConfig = adminConfig?.providerConfig || {}
  const tick = isDark ? '#94a3b8' : '#64748b'

  const statusItems = [
    { name: 'Ollama Status', value: providerStatuses.ollama || 'healthy', detail: providerConfig.chatProvider || 'ollama', icon: RadioTower },
    { name: 'ComfyUI Status', value: providerStatuses.comfyui || 'healthy', detail: providerConfig.imageProvider || 'comfyui', icon: Layers3 },
    { name: 'Current Model', value: providerConfig.chatProvider === 'ollama' ? 'Llama 3.2' : 'Hybrid', detail: 'Streaming responses', icon: Cpu },
    { name: 'Response Time', value: '118ms', detail: 'Low-latency', icon: Gauge },
    { name: 'GPU Status', value: providerStatuses.ollama === 'healthy' ? 'Ready' : 'Pending', detail: 'Inference available', icon: ShieldCheck },
    { name: 'Queue Status', value: 'Stable', detail: 'No backlog', icon: Activity }
  ]

  return (
    <div className={`rounded-3xl border p-6 ${soft} backdrop-blur-xl`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className={`text-sm ${muted}`}>Live analytics</p>
          <h3 className="text-lg font-semibold text-white">Performance snapshot</h3>
        </div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">+14% WoW</span>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.85} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: tick, fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: tick, fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: isDark ? 'rgba(11,17,32,0.92)' : 'rgba(255,255,255,0.95)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 16, color: isDark ? '#e2e8f0' : '#0f172a', fontSize: 12
              }}
            />
            <Area type="monotone" dataKey="usage" stroke="#818cf8" strokeWidth={3} fill="url(#usageGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {statusItems.map((item) => {
          const Icon = item.icon
          const tone = ['healthy', 'Ready', 'Stable'].includes(item.value) ? 'healthy' : item.value === 'warning' ? 'warning' : 'critical'
          return (
            <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/10 text-slate-300">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </div>
              </div>
              <StatusBadge tone={tone} label={item.value} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
