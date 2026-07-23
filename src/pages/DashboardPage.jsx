import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquareText, ImagePlus, FileText, DatabaseZap, Zap, Briefcase,
  ArrowRight, Sparkles, Crown, Clock3, Menu, X
} from 'lucide-react'
import { useAppContext } from '../context/useAppContext'
import BackgroundEffects from '../components/BackgroundEffects'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DashboardTopbar from '../components/dashboard/DashboardTopbar'
import StatTile from '../components/dashboard/StatTile'
import DashboardToolLauncher from '../components/dashboard/DashboardToolLauncher'
import UsageMeter from '../components/dashboard/UsageMeter'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import FavoritesRail from '../components/dashboard/FavoritesRail'
import AnalyticsPanel from '../components/dashboard/AnalyticsPanel'
import LocalAIStatus from '../components/dashboard/LocalAIStatus'
import CloudAIStatus from '../components/dashboard/CloudAIStatus'
import SystemStatus from '../components/dashboard/SystemStatus'

const STAT_ACCENTS = [
  'from-fuchsia-500 via-indigo-500 to-cyan-500',
  'from-cyan-500 via-indigo-500 to-violet-500',
  'from-emerald-500 via-cyan-500 to-blue-500',
  'from-fuchsia-500 via-purple-500 to-indigo-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-violet-500 via-indigo-500 to-cyan-500'
]

function WelcomeHero({ user, aiMode, isDark, onNavigate }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const formatted = time.toLocaleString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const providerName = aiMode?.mode === 'local' && aiMode?.localChatProvider
    ? aiMode.localChatProvider
    : 'Cloud'

  const modeLabel = aiMode?.mode === 'local' ? 'Local AI' : 'Cloud AI'

  return (
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
            <Sparkles className="h-4 w-4 text-indigo-200" /> {modeLabel} workspace live
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}.
          </h2>
          <p className={`mt-3 max-w-xl text-base leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Your AI command center is ready. Chat, create, and ship from one cinematic workspace.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
            <span>Mode: <span className="text-white font-medium">{modeLabel}</span></span>
            <span>Provider: <span className="text-white font-medium capitalize">{providerName}</span></span>
            <span>{formatted}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => onNavigate('/chat')} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_44px_rgba(129,140,248,0.35)] transition hover:-translate-y-0.5">
              Start a new flow <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => onNavigate('/image')} className={`rounded-full border px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${isDark ? 'border-white/15 bg-white/10 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
              Generate image
            </button>
          </div>
        </div>
        <div className={`w-full max-w-xs rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-[#0B1120]/70' : 'border-slate-200 bg-white/80'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current plan</p>
              <p className="text-xl font-semibold text-white capitalize">{user?.plan?.replace(/-/g, ' ') || 'Free trial'}</p>
            </div>
            <Crown className="h-5 w-5 text-amber-300" />
          </div>
          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>AI Mode</span>
              <span className="font-semibold text-white">{modeLabel}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Provider</span>
              <span className="font-semibold text-white capitalize">{providerName}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, subscription, usage, adminConfig, chats, images, favorites, activity, aiMode } = useAppContext()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isDark = true
  const planLabel = subscription?.plan || 'free-trial'

  const planLimits = useMemo(() => adminConfig?.planLimits?.[planLabel] || adminConfig?.planLimits?.['free-trial'] || {}, [adminConfig?.planLimits, planLabel])

  const stats = useMemo(() => [
    { title: 'AI Chats Today', value: usage?.dayChats || 0, suffix: '', note: `${planLimits.maxChatsPerDay || 20} daily cap`, icon: MessageSquareText },
    { title: 'Images Generated', value: usage?.dayImages || 0, suffix: '', note: 'Instant concepts ready', icon: ImagePlus },
    { title: 'Documents Processed', value: activity?.length || 0, suffix: '', note: 'Saved into your workspace', icon: FileText },
    { title: 'Storage Used', value: usage?.storageUsed || 0, suffix: ' GB', note: `${Math.max(1, (adminConfig?.storageLimit || 100) - (usage?.storageUsed || 0))} GB free`, icon: DatabaseZap },
    { title: 'Tokens Used', value: 'Unavailable', suffix: '', note: 'Real token counts require provider telemetry', icon: Zap },
    { title: 'Total Projects', value: images?.length || 0, suffix: '', note: 'Growing momentum', icon: Briefcase }
  ], [usage?.dayChats, usage?.dayImages, usage?.storageUsed, adminConfig?.storageLimit, planLimits.maxChatsPerDay, activity?.length, images?.length])

  const recentChats = (chats || []).slice(0, 4)
  const recentImages = (images || []).slice(0, 4)

  const shell = 'app-canvas text-white'
  const panel = 'glass'
  const muted = 'text-slate-400'

  return (
    <div className={`relative flex min-h-screen ${shell} overflow-hidden`}>
      <BackgroundEffects />

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-80 lg:hidden"
            >
              <div className="flex h-full flex-col border-r border-white/8 bg-[#0a0c14]/95 backdrop-blur-2xl">
                <div className="flex items-center justify-between px-5 py-5">
                  <span className="text-lg font-semibold text-white">Menu</span>
                  <button onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:bg-white/10">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-4">
                  <DashboardSidebar collapsed={false} onToggle={() => setMobileOpen(false)} isDark={isDark} />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="hidden lg:block">
        <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} isDark={isDark} />
      </div>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 flex-1"
      >
        <DashboardTopbar title="Dashboard" subtitle="AI Command Center" isDark={isDark} />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-7 lg:py-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setMobileOpen(true)} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10">
              <Menu className="h-4 w-4" /> Menu
            </button>
          </div>

          <WelcomeHero user={user} aiMode={aiMode} isDark={isDark} onNavigate={(r) => navigate(r)} />

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((s, i) => (
              <StatTile key={s.title} {...s} index={i} isDark={isDark} accent={STAT_ACCENTS[i % STAT_ACCENTS.length]} />
            ))}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="eyebrow">Quick launch</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Choose your next move</h3>
              </div>
            </div>
            <DashboardToolLauncher />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <LocalAIStatus />
            <CloudAIStatus />
            <SystemStatus />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <AnalyticsPanel adminConfig={adminConfig} isDark={isDark} />
            </div>
            <div className="space-y-6">
              <UsageMeter usage={usage} planLimits={planLimits} storageLimit={adminConfig?.storageLimit || 100} isDark={isDark} />
              <FavoritesRail favorites={favorites} isDark={isDark} />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <div className={`rounded-3xl border p-6 ${panel} backdrop-blur-xl`}>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Recent work</h3>
                  <button onClick={() => navigate('/chat-history')} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${muted} transition hover:text-white`}>View all</button>
                </div>
                {recentChats.length === 0 && recentImages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                    <p className="text-sm text-slate-400">No recent work yet. Start a chat or generate an image to see it here.</p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <button onClick={() => navigate('/chat')} className="rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white">New chat</button>
                      <button onClick={() => navigate('/image')} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">New image</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className={`mb-3 text-sm font-medium ${muted}`}>Conversations</p>
                      <div className="space-y-2.5">
                        {recentChats.length ? recentChats.map((c, i) => (
                          <button key={c.id || i} onClick={() => navigate('/chat-history')} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10">
                            <MessageSquareText className="h-4 w-4 text-indigo-300" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{c.title || c.prompt || 'Chat session'}</p>
                              <p className="truncate text-xs text-slate-500">{c.response || c.prompt || ''}</p>
                            </div>
                          </button>
                        )) : (
                          <p className="text-xs text-slate-500">No recent conversations.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className={`mb-3 text-sm font-medium ${muted}`}>Creations</p>
                      <div className="space-y-2.5">
                        {recentImages.length ? recentImages.map((img, i) => (
                          <button key={img.id || i} onClick={() => navigate('/image-history')} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10">
                            <ImagePlus className="h-4 w-4 text-fuchsia-300" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{img.prompt || 'Generated image'}</p>
                              <p className="truncate text-xs text-slate-500">{img.result || 'Concept ready'}</p>
                            </div>
                          </button>
                        )) : (
                          <p className="text-xs text-slate-500">No recent images.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <ActivityFeed activity={activity || []} isDark={isDark} />
            </div>
          </section>

          <footer className={`flex items-center gap-2 pt-2 text-xs ${muted}`}>
            <Clock3 className="h-3.5 w-3.5" /> Workspace synced · InfinityAI — Endless AI Possibilities
          </footer>
        </div>
      </motion.main>
    </div>
  )
}
