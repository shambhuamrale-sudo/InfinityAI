import { useState, useMemo, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquareText, ImagePlus, FileText, DatabaseZap, Zap, Briefcase,
  ArrowRight, Sparkles, Crown, Clock3
} from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'
import BackgroundEffects from '../components/BackgroundEffects'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DashboardTopbar from '../components/dashboard/DashboardTopbar'
import StatTile from '../components/dashboard/StatTile'
import ToolLauncher from '../components/dashboard/DashboardToolLauncher'
import UsageMeter from '../components/dashboard/UsageMeter'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import FavoritesRail from '../components/dashboard/FavoritesRail'
import AnalyticsPanel from '../components/dashboard/AnalyticsPanel'

const IntroExperience = lazy(() => import('../components/IntroExperience'))

const STAT_ACCENTS = [
  'from-fuchsia-500 via-indigo-500 to-cyan-500',
  'from-cyan-500 via-indigo-500 to-violet-500',
  'from-emerald-500 via-cyan-500 to-blue-500',
  'from-fuchsia-500 via-purple-500 to-indigo-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-violet-500 via-indigo-500 to-cyan-500'
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, subscription, usage, adminConfig, preferences, chats, images, favorites, activity } = useAppContext()
  const [collapsed, setCollapsed] = useState(false)
  const reduced = usePrefersReducedMotion()
  const [introDone, setIntroDone] = useState(() => {
    if (typeof window === 'undefined') return reduced
    try { return window.sessionStorage.getItem('infinityai_intro') === '1' || reduced } catch { return reduced }
  })

  const handleIntroDone = () => {
    try { window.sessionStorage.setItem('infinityai_intro', '1') } catch {}
    setIntroDone(true)
  }

  const isDark = preferences?.darkMode !== false
  const planLabel = subscription?.plan || 'free-trial'
  const planName = planLabel.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const remainingTrialDays = Math.max(0, Math.ceil(((subscription?.expiresAt || Date.now()) - Date.now()) / 86400000))
  const planLimits = adminConfig?.planLimits?.[planLabel] || adminConfig?.planLimits?.['free-trial'] || {}

  const stats = useMemo(() => [
    { title: 'AI Chats Today', value: usage?.dayChats || 0, suffix: '', note: `${planLimits.maxChatsPerDay || 20} daily cap`, icon: MessageSquareText },
    { title: 'Images Generated', value: usage?.dayImages || 0, suffix: '', note: 'Instant concepts ready', icon: ImagePlus },
    { title: 'Documents Processed', value: Math.max(3, (activity?.length || 0) + 8), suffix: '', note: 'Saved into your workspace', icon: FileText },
    { title: 'Storage Used', value: usage?.storageUsed || 24, suffix: ' GB', note: `${Math.max(1, (adminConfig?.storageLimit || 100) - (usage?.storageUsed || 24))} GB free`, icon: DatabaseZap },
    { title: 'Tokens Used', value: 12840 + (usage?.monthChats || 0) * 120, suffix: 'k', note: 'High efficiency', icon: Zap },
    { title: 'Total Projects', value: 24 + (images?.length || 0), suffix: '', note: 'Growing momentum', icon: Briefcase }
  ], [activity?.length, images?.length, planLimits.maxChatsPerDay, usage?.dayChats, usage?.dayImages, usage?.monthChats, usage?.storageUsed, adminConfig?.storageLimit])

  const recentChats = (chats || []).slice(0, 4)
  const recentImages = (images || []).slice(0, 4)
  const ready = introDone

  const shell = isDark ? 'bg-[#050816] text-white' : 'bg-slate-50 text-slate-900'
  const panel = isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white/70'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className={`relative flex min-h-screen ${shell} overflow-hidden`}>
      <BackgroundEffects />
      {!introDone && (
        <Suspense fallback={null}>
          <IntroExperience onComplete={handleIntroDone} reduced={reduced} />
        </Suspense>
      )}

      <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} isDark={isDark} />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 flex-1"
      >
        <DashboardTopbar title="Dashboard" subtitle="AI Command Center" isDark={isDark} />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-7 lg:py-8">
          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`relative overflow-hidden rounded-[2rem] border p-7 backdrop-blur-2xl sm:p-9 ${isDark ? 'border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-cyan-500/10' : 'border-indigo-200 bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-cyan-50'}`}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-slate-200">
                  <Sparkles className="h-4 w-4 text-indigo-200" /> Premium workspace live
                </span>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Welcome back, {user?.name?.split(' ')[0] || 'there'}.
                </h2>
                <p className={`mt-3 max-w-xl text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Your AI operations feel like a billion-dollar product — chat, create, and ship from one cinematic command center.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={() => navigate('/chat')} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_44px_rgba(129,140,248,0.35)] transition hover:-translate-y-0.5">
                    Start a new AI flow <ArrowRight className="h-4 w-4" />
                  </button>
                  <button onClick={() => navigate('/subscription')} className={`rounded-full border px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${isDark ? 'border-white/15 bg-white/10 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
                    View subscription
                  </button>
                </div>
              </div>
              <div className={`w-full max-w-xs rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-[#0B1120]/70' : 'border-slate-200 bg-white/80'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${muted}`}>Current plan</p>
                    <p className="text-xl font-semibold text-white">{planName}</p>
                  </div>
                  <Crown className="h-5 w-5 text-amber-300" />
                </div>
                <div className="mt-4 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className={muted}>Remaining trial</span>
                    <span className="font-semibold text-white">{remainingTrialDays} days</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className={muted}>Today's usage</span>
                    <span className="font-semibold text-white">{usage?.dayChats || 0} chats</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Stats */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((s, i) => (
              <StatTile key={s.title} {...s} index={i} isDark={isDark} accent={STAT_ACCENTS[i % STAT_ACCENTS.length]} />
            ))}
          </section>

          {/* Tools */}
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className={`text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300`}>Quick launch</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Choose your next move</h3>
              </div>
            </div>
            <ToolLauncher isDark={isDark} />
          </section>

          {/* Analytics + side */}
          <section className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <AnalyticsPanel adminConfig={adminConfig} isDark={isDark} />
            </div>
            <div className="space-y-6">
              <UsageMeter usage={usage} planLimits={planLimits} storageLimit={adminConfig?.storageLimit || 100} isDark={isDark} />
              <FavoritesRail favorites={favorites} isDark={isDark} />
            </div>
          </section>

          {/* Recent work + activity */}
          <section className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <div className={`rounded-3xl border p-6 ${panel} backdrop-blur-xl`}>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Recent work</h3>
                  <button onClick={() => navigate('/chat-history')} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${muted} transition hover:text-white`}>View all</button>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className={`mb-3 text-sm font-medium ${muted}`}>Conversations</p>
                    <div className="space-y-2.5">
                      {(recentChats.length ? recentChats : [{ title: 'Launch briefing', response: 'Ready to review' }, { title: 'Product strategy', response: 'Refined' }]).map((c, i) => (
                        <button key={c.id || i} onClick={() => navigate('/chat-history')} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10">
                          <MessageSquareText className="h-4 w-4 text-indigo-300" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{c.title || c.prompt || 'Chat session'}</p>
                            <p className="truncate text-xs text-slate-500">{c.response || c.prompt || ''}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={`mb-3 text-sm font-medium ${muted}`}>Creations</p>
                    <div className="space-y-2.5">
                      {(recentImages.length ? recentImages : [{ prompt: 'Neon campaign mockup' }, { prompt: 'Visual concept set' }]).map((img, i) => (
                        <button key={img.id || i} onClick={() => navigate('/image-history')} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10">
                          <ImagePlus className="h-4 w-4 text-fuchsia-300" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{img.prompt || 'Generated image'}</p>
                            <p className="truncate text-xs text-slate-500">{img.result || 'Concept ready'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <ActivityFeed activity={activity} isDark={isDark} />
            </div>
          </section>

          <footer className={`flex items-center gap-2 pt-2 text-xs ${muted}`}>
            <Clock3 className="h-3.5 w-3.5" /> Workspace synced · Aditya AI — Endless AI Possibilities
          </footer>
        </div>
      </motion.main>
    </div>
  )
}
