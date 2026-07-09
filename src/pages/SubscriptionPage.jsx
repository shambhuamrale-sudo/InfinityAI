import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import { useAppContext } from '../context/AppContext'

const options = [
  { name: 'Starter', price: '$19', description: 'For solo builders launching their first AI workflows.', features: ['120 daily chats', '40 daily images', 'Priority support'] },
  { name: 'Pro', price: '$49', description: 'For high-volume teams shipping regularly.', features: ['500 daily chats', '200 daily images', 'Advanced analytics'] },
  { name: 'Business', price: '$199', description: 'For scaling organizations with custom governance.', features: ['Unlimited team seats', 'Dedicated onboarding', 'Custom security'] }
]

export default function SubscriptionPage() {
  const { subscription, updateSubscription } = useAppContext()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-5 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Subscription</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Choose the plan that matches your production pace.</h1>
            </div>
          </div>
        </motion.header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300"><Sparkles className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold text-white">Current plan</p>
                <p className="text-sm text-slate-400">Active status: {subscription.status}</p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {options.map((option) => (
                <div key={option.name} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-lg font-semibold text-white">{option.name}</p>
                  <p className="mt-2 text-sm text-slate-400">{option.description}</p>
                  <div className="mt-4 text-3xl font-semibold text-white">{option.price}<span className="text-base text-slate-400">/mo</span></div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-400">
                    {option.features.map((feature) => <li key={feature} className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-300" /> {feature}</li>)}
                  </ul>
                  <button onClick={() => updateSubscription(option.name.toLowerCase())} className="mt-5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white">Select {option.name}</button>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Included with your plan</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Everything you need to launch confidently.</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-400">
              <li>• Premium tool access across chat, image, writer, and code workflows.</li>
              <li>• Usage analytics and real-time subscription limits.</li>
              <li>• Fast onboarding, migration support, and polished admin controls.</li>
            </ul>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
