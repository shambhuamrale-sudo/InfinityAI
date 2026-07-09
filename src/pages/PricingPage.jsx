import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import PremiumButton from '../components/PremiumButton'

const plans = [
  { name: 'Free Trial', price: '$0', description: 'Explore the platform with premium visuals and a generous starter pass.', features: ['2 days access', '20 chats/day', '5 images/day', 'Core templates'], featured: false },
  { name: 'Starter', price: '$19', description: 'For builders creating daily with AI.', features: ['Configurable limits', 'Priority support', 'Advanced templates', 'Usage analytics'], featured: true },
  { name: 'Pro', price: '$49', description: 'For product teams needing more automation and control.', features: ['Higher limits', 'Team collaboration', 'Advanced automations', 'Priority workflows'], featured: false },
  { name: 'Business', price: '$99', description: 'For organizations that need premium scale and governance.', features: ['Highest limits', 'Admin controls', 'Dedicated success', 'Expanded integrations'], featured: false }
]

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Pricing</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Flexible plans crafted for momentum</h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">The architecture is ready for future payments, while the experience stays polished, modular, and launch-ready today.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, index) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.06 }}>
              <GlassPanel hover className={`p-8 ${plan.featured ? 'border-indigo-400/40 bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/10' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                  {plan.featured ? <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-indigo-300">Popular</span> : null}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-400">{plan.description}</p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-semibold text-white">{plan.price}</span>
                  <span className="pb-2 text-slate-400">/month</span>
                </div>
                <ul className="mt-8 space-y-3 text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> {feature}</li>
                  ))}
                </ul>
                <PremiumButton className="mt-8 w-full" variant={plan.featured ? 'primary' : 'secondary'}>{plan.featured ? 'Choose Starter' : plan.name === 'Free Trial' ? 'Start Free' : 'Contact Sales'}</PremiumButton>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
