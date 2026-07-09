import { motion } from 'framer-motion'
import { BellRing, BrushCleaning, KeyRound, ShieldCheck, Sparkles, ToggleRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import { useAppContext } from '../context/AppContext'

const settings = [
  { icon: BellRing, key: 'notificationsEnabled', title: 'Notifications', description: 'Stay in the loop with the latest updates and reminders.' },
  { icon: BrushCleaning, key: 'motionEnabled', title: 'Animations', description: 'Turn the premium motion system on or off.' },
  { icon: KeyRound, key: 'autoSave', title: 'Auto save', description: 'Persist changes automatically across sessions.' },
  { icon: ShieldCheck, key: 'darkMode', title: 'Dark mode', description: 'Keep the premium night theme active.' }
]

export default function SettingsPage() {
  const { preferences, updatePreferences } = useAppContext()
  const [localPrefs, setLocalPrefs] = useState(preferences)
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    setLocalPrefs((prev) => ({ ...prev, reducedMotion: prev.reducedMotion ?? prefersReducedMotion }))
  }, [prefersReducedMotion])

  const toggle = (key) => {
    const next = { ...localPrefs, [key]: !localPrefs[key] }
    setLocalPrefs(next)
    updatePreferences(next)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-5 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Settings</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Your experience, tuned for comfort.</h1>
            </div>
          </div>
        </motion.header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-6">
            {settings.map((item, index) => {
              const Icon = item.icon
              const active = Boolean(localPrefs[item.key])
              return (
                <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <GlassPanel className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300"><Icon className="h-4 w-4" /></div>
                        <div>
                          <p className="font-semibold text-white">{item.title}</p>
                          <p className="text-sm text-slate-400">{item.description}</p>
                        </div>
                      </div>
                      <button onClick={() => toggle(item.key)} className={`rounded-full border p-2 ${active ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-300' : 'border-white/10 bg-white/5 text-slate-300'}`}><ToggleRight className="h-5 w-5" /></button>
                    </div>
                  </GlassPanel>
                </motion.div>
              )
            })}
          </div>

          <GlassPanel className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-indigo-300"><Sparkles className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold text-white">Premium defaults</p>
                <p className="text-sm text-slate-400">Preferences are saved automatically to the backend.</p>
              </div>
            </div>
            <div className="mt-6 rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Workspace profile</p>
              <p className="mt-2 leading-7 text-slate-400">Your settings are now persisted and available across refreshes and future sessions.</p>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
