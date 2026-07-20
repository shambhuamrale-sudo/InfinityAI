import { motion } from 'framer-motion'
import { Users, CreditCard, Cpu, Ticket, BarChart3, FileText, Settings, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import { useAppContext } from '../context/useAppContext'

const modules = [
  { icon: Users, title: 'Users', description: 'Manage members, roles, and access' },
  { icon: CreditCard, title: 'Plans', description: 'Create and tune subscription tiers' },
  { icon: Cpu, title: 'Providers', description: 'Configure AI providers and connections' },
  { icon: Ticket, title: 'Coupons', description: 'Launch offers and incentive flows' },
  { icon: BarChart3, title: 'Analytics', description: 'Track adoption and performance' },
  { icon: FileText, title: 'Logs', description: 'Inspect platform activity and events' },
  { icon: Settings, title: 'Settings', description: 'Fine-tune the environment' }
]

export default function AdminPage() {
  const { adminConfig, setAdminConfig, user, auth } = useAppContext()
  const isAdmin = String(auth.user?.role || user?.role || '').toLowerCase().includes('admin')
  const [trialDays, setTrialDays] = useState(adminConfig.trialDays || 2)
  const [chatLimit, setChatLimit] = useState(adminConfig.planLimits?.['free-trial']?.maxChatsPerDay || 20)
  const [imageLimit, setImageLimit] = useState(adminConfig.planLimits?.['free-trial']?.maxImagesPerDay || 5)

  const saveConfig = () => {
    setAdminConfig({
      trialDays: Number(trialDays),
      planLimits: {
        ...adminConfig.planLimits,
        'free-trial': { ...adminConfig.planLimits['free-trial'], maxChatsPerDay: Number(chatLimit), maxImagesPerDay: Number(imageLimit) }
      }
    })
  }

  const providerStatus = useMemo(() => {
    return Object.entries(adminConfig.providerStatuses || {}).map(([name, status]) => `${name}: ${status}`).join(' • ')
  }, [adminConfig.providerStatuses])

  if (!auth.loading && (!auth.isAuthenticated || !isAdmin)) {
    return (
      <div className="app-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-white">
        <BackgroundEffects />
        <GlassPanel className="max-w-md p-10 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-amber-300" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">Admin access required</h1>
          <p className="mt-4 text-sm text-slate-400">You do not have permission to view this area. Contact the platform owner for admin access.</p>
        </GlassPanel>
      </div>
    )
  }

  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Admin Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Steer growth from a premium control center</h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">{auth.user ? `Signed in as ${auth.user.name} (${auth.user.email})` : 'The admin area now supports plan and limit adjustments directly from the UI.'}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module, index) => {
            const Icon = module.icon
            return (
              <motion.div key={module.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.06 }}>
                <GlassPanel hover className="p-6">
                  <div className="inline-flex rounded-2xl bg-white/[0.05] p-3 text-indigo-300 ring-1 ring-white/10"><Icon className="h-6 w-6" /></div>
                  <h2 className="mt-4 text-xl font-semibold text-white">{module.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{module.description}</p>
                </GlassPanel>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassPanel className="p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Plan controls</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-400">Trial days
                <input value={trialDays} onChange={(event) => setTrialDays(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-white outline-none focus-ring" />
              </label>
              <label className="text-sm text-slate-400">Daily chat limit
                <input value={chatLimit} onChange={(event) => setChatLimit(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-white outline-none focus-ring" />
              </label>
              <label className="text-sm text-slate-400">Daily image limit
                <input value={imageLimit} onChange={(event) => setImageLimit(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-white outline-none focus-ring" />
              </label>
              <button onClick={saveConfig} className="mt-2 self-end rounded-full brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] transition hover:brightness-110">Save admin controls</button>
            </div>
          </GlassPanel>
          <GlassPanel className="p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Platform health</p>
            <div className="mt-4 rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-400">{providerStatus}</div>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300"><ShieldCheck className="h-4 w-4" /> Operational</div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
