import { motion } from 'framer-motion'
import BackgroundEffects from '../components/BackgroundEffects'
import PlanCard from '../components/PlanCard'

const plans = [
  { name: 'Free Trial', price: '$0', description: 'Explore the platform with premium visuals and a generous starter pass.', features: ['2 days access', '20 chats/day', '5 images/day', 'Core templates'], featured: false, cta: 'Start Free' },
  { name: 'Starter', price: '$19', description: 'For builders creating daily with AI.', features: ['Configurable limits', 'Priority support', 'Advanced templates', 'Usage analytics'], featured: true, cta: 'Choose Starter' },
  { name: 'Pro', price: '$49', description: 'For product teams needing more automation and control.', features: ['Higher limits', 'Team collaboration', 'Advanced automations', 'Priority workflows'], featured: false, cta: 'Choose Pro' },
  { name: 'Business', price: '$99', description: 'For organizations that need premium scale and governance.', features: ['Highest limits', 'Admin controls', 'Dedicated success', 'Expanded integrations'], featured: false, cta: 'Contact Sales' }
]

export default function PricingPage() {
  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Pricing</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Flexible plans crafted for momentum</h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">The architecture is ready for future payments, while the experience stays polished, modular, and launch-ready today.</p>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, index) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.06 }}>
              <PlanCard {...plan} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
