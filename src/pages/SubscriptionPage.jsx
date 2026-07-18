import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import { useAppContext } from '../context/useAppContext'

const options = [
  { name: 'Starter', price: '$19', description: 'For solo builders launching their first AI workflows.', features: ['120 daily chats', '40 daily images', 'Priority support'] },
  { name: 'Pro', price: '$49', description: 'For high-volume teams shipping regularly.', features: ['500 daily chats', '200 daily images', 'Advanced analytics'] },
  { name: 'Business', price: '$199', description: 'For scaling organizations with custom governance.', features: ['Unlimited team seats', 'Dedicated onboarding', 'Custom security'] }
]

export default function SubscriptionPage() {
  const { subscription, updateSubscription } = useAppContext()
  const current = (subscription?.plan || 'free-trial')

  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.75rem] p-6 sm:p-7">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Subscription</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Choose the plan that matches your production pace.</h1>
        </motion.header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassPanel className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Sparkles className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold text-white">Current plan</p>
                <p className="text-sm text-slate-400">Active status: <span className="text-white">{subscription?.status || 'active'}</span></p>
              </div>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {options.map((option) => {
                const active = current === option.name.toLowerCase()
                return (
                  <div key={option.name} className={`flex flex-col rounded-[1.4rem] border p-5 ${active ? 'border-indigo-400/40 bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/10' : 'border-white/8 bg-white/[0.03]'}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-white">{option.name}</p>
                      {active ? <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.2em] text-indigo-200">Current</span> : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{option.description}</p>
                    <div className="mt-4 text-3xl font-semibold tracking-tight text-white">{option.price}<span className="text-base font-normal text-slate-400">/mo</span></div>
                    <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-400">
                      {option.features.map((feature) => <li key={feature} className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-300" /> {feature}</li>)}
                    </ul>
                    <button onClick={() => updateSubscription(option.name.toLowerCase())} className={`mt-5 rounded-full px-4 py-2.5 text-sm font-semibold transition ${active ? 'border border-white/10 bg-white/[0.05] text-slate-300' : 'brand-gradient text-white shadow-[0_12px_40px_-12px_rgba(129,140,248,0.6)] hover:brightness-110'}`}>
                      {active ? 'Selected' : `Select ${option.name}`}
                    </button>
                  </div>
                )
              })}
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Included with your plan</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">Everything you need to launch confidently.</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-400">
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" /> Premium tool access across chat, image, writer, and code workflows.</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" /> Usage analytics and real-time subscription limits.</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" /> Fast onboarding, migration support, and polished admin controls.</li>
            </ul>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
