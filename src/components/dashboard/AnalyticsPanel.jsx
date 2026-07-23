import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RadioTower, Layers3, Cpu, Gauge, ShieldCheck, Activity } from 'lucide-react'
import StatusBadge from './StatusBadge'

const chartData = []

export default function AnalyticsPanel({ adminConfig, isDark }) {
  const soft = 'glass'
  const muted = 'text-slate-400'
  const providerConfig = adminConfig?.providerConfig || {}
  const tick = isDark ? '#94a3b8' : '#64748b'

  const statusItems = [
    { name: 'Provider Status', value: providerConfig.chatProvider ? 'Available' : 'Unavailable', detail: providerConfig.chatProvider || 'Not Detected', icon: RadioTower },
    { name: 'Image Provider', value: providerConfig.imageProvider ? 'Available' : 'Unavailable', detail: providerConfig.imageProvider || 'Not Detected', icon: Layers3 },
    { name: 'Current Model', value: 'Unavailable', detail: 'No active model telemetry', icon: Cpu },
    { name: 'Response Time', value: 'Unavailable', detail: 'No active model telemetry', icon: Gauge },
    { name: 'GPU Status', value: 'Unavailable', detail: 'No active model telemetry', icon: ShieldCheck },
    { name: 'Queue Status', value: 'Unavailable', detail: 'No active model telemetry', icon: Activity }
  ]

  return (
    <div className={`rounded-3xl border p-6 ${soft} backdrop-blur-xl`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className={`text-sm ${muted}`}>Live analytics</p>
          <h3 className="text-lg font-semibold text-white">Performance snapshot</h3>
        </div>
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
