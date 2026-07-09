import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, Bot, Sparkles, Wand2, Code2, FileText, Languages, Briefcase, ShieldCheck, ChevronRight, Zap, PlayCircle, BrainCircuit, PanelTop, CheckCircle2, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import PremiumButton from '../components/PremiumButton'
import SectionShell from '../components/SectionShell'

const stats = [
  { value: '1.2M+', label: 'AI actions generated' },
  { value: '99.98%', label: 'workflow uptime' },
  { value: '24/7', label: 'creative automation' }
]

const logos = ['Notion', 'Linear', 'Vercel', 'Cohere', 'Supabase', 'OpenRouter']

const features = [
  { icon: BrainCircuit, title: 'Adaptive intelligence', description: 'Context-aware agents that understand your workflow and accelerate every task.' },
  { icon: PanelTop, title: 'Premium workspace', description: 'A polished environment for product design, development, and growth.' },
  { icon: ShieldCheck, title: 'Secure by design', description: 'Local-ready, privacy-conscious, and built with open-source tooling.' }
]

const tools = [
  { icon: Bot, title: 'AI Chat', description: 'Delightful conversations with streaming responses and context-rich memory.', badge: 'Live' },
  { icon: Wand2, title: 'AI Image', description: 'Generate visual concepts with cinematic control and style variations.', badge: 'New' },
  { icon: Code2, title: 'AI Code', description: 'Prototype, refactor, and launch faster with intelligent coding helpers.', badge: 'Beta' },
  { icon: FileText, title: 'PDF AI', description: 'Extract insights from docs, briefs, proposals, and legal content.', badge: 'Smart' },
  { icon: Languages, title: 'Translator', description: 'Localize experiences with tone-aware multilingual support.', badge: 'Global' },
  { icon: Briefcase, title: 'Resume Builder', description: 'Create polished career assets and tailored storytelling.', badge: 'Launch' }
]

const pricing = [
  { name: 'Free Trial', price: '$0', description: 'For founders exploring the platform early.', features: ['2 days access', '20 chats/day', '5 images/day', 'Core templates'], featured: false },
  { name: 'Starter', price: '$19', description: 'For builders creating daily with AI.', features: ['Configurable limits', 'Priority support', 'Advanced templates', 'Usage analytics'], featured: true },
  { name: 'Business', price: '$99', description: 'For teams that need premium velocity.', features: ['Highest limits', 'Admin controls', 'Dedicated success', 'Expanded integrations'], featured: false }
]

const faqs = [
  { question: 'Do you rely on paid APIs?', answer: 'No. Aditya AI is built to work with free and open-source technologies such as Ollama and ComfyUI.' },
  { question: 'Is the UI production-ready?', answer: 'Yes. The experience is designed as a polished SaaS MVP with modular components and premium motion.' },
  { question: 'Can payments be added later?', answer: 'Absolutely. The subscription structure is ready for future gateway integration.' }
]

export default function LandingPage() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const smoothX = useSpring(x, { stiffness: 140, damping: 18 })
  const smoothY = useSpring(y, { stiffness: 140, damping: 18 })
  const navigate = useNavigate()

  const handleMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    x.set(event.clientX - bounds.left - 120)
    y.set(event.clientY - bounds.top - 120)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <motion.div animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.96, 1.04, 0.96] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.2),transparent_36%)]" />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-2 text-indigo-300"><Sparkles className="h-5 w-5" /></div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Aditya AI</p>
            <p className="text-sm text-slate-400">One Platform. Endless AI Possibilities.</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
          <a href="#faq" className="transition hover:text-white">FAQ</a>
          <a href="/login" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10">Login</a>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-20 pt-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-28 lg:pt-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200">
              <Zap className="h-4 w-4" /> 100% free and open-source ready
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="max-w-3xl text-4xl font-semibold leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-7xl">
              The premium AI platform for builders who want <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">clarity, speed, and beauty.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Launch a futuristic creative workspace with chat, image tools, code, documents, translation, and more — all wrapped in a premium experience that feels effortless.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-8 flex flex-wrap gap-3">
              <PremiumButton onClick={() => navigate('/signup')}>Start free <ArrowRight className="h-4 w-4" /></PremiumButton>
              <PremiumButton variant="secondary">Watch preview <PlayCircle className="h-4 w-4" /></PremiumButton>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }} className="mt-10 flex flex-wrap gap-3 text-sm text-slate-400">
              {['Ollama', 'ComfyUI', 'MongoDB Atlas', 'Framer Motion'].map((item) => (<span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">{item}</span>))}
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative" onMouseMove={handleMove}>
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-fuchsia-500/20 blur-3xl" />
            <GlassPanel className="relative overflow-hidden border-white/10 p-5 sm:p-6">
              <motion.div style={{ x: smoothX, y: smoothY }} animate={{ x: [0, 6, 0], y: [0, -6, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute left-6 top-6 h-24 w-24 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="relative rounded-[1.5rem] border border-white/10 bg-[#07101f]/90 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">AI Command Center</p>
                    <h3 className="text-xl font-semibold text-white">Live workspace preview</h3>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">Online</div>
                </div>
                <div className="space-y-3">
                  {[['AI Chat', 'Summarize a launch brief instantly'], ['AI Image', 'Generate a cinematic mockup'], ['AI Code', 'Refactor a UI component']].map(([title, description]) => (
                    <motion.div key={title} whileHover={{ scale: 1.01, y: -2 }} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300"><Bot className="h-4 w-4" /></div>
                        <div>
                          <p className="text-sm font-semibold text-white">{title}</p>
                          <p className="text-sm text-slate-400">{description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-indigo-400/20 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 p-4 text-sm text-slate-300">“This feels like a product that was designed for momentum.”</div>
              </div>
            </GlassPanel>
          </motion.div>
        </section>

        <SectionShell eyebrow="Trusted by modern teams" title="Built for creators, operators, and fast-moving AI teams" description="A premium experience that blends thoughtful visuals, useful workflows, and elegant motion into one platform.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">{logos.map((logo, index) => (<motion.div key={logo} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.06 }} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center text-sm font-semibold text-slate-300 backdrop-blur-xl">{logo}</motion.div>))}</div>
        </SectionShell>

        <SectionShell eyebrow="Why it feels premium" title="Every interaction is designed to feel effortless" description="Micro-interactions, layered depth, and polished motion create an experience that feels more like a product launch than a template.">
          <div className="grid gap-6 lg:grid-cols-3">{features.map((feature, index) => (<motion.div key={feature.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }}><GlassPanel hover className="p-6"><div className="mb-4 inline-flex rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-indigo-300"><feature.icon className="h-6 w-6" /></div><h3 className="text-xl font-semibold text-white">{feature.title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p></GlassPanel></motion.div>))}</div>
        </SectionShell>

        <SectionShell eyebrow="AI tools" title="A curated command center for every AI workflow" description="From conversation to creation, each tool is styled and animated to feel premium and purposeful.">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{tools.map((tool, index) => (<motion.div key={tool.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.06 }}><GlassPanel hover className="group p-6"><div className="flex items-start justify-between gap-4"><div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-indigo-300"><tool.icon className="h-6 w-6" /></div><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-400">{tool.badge}</span></div><h3 className="mt-6 text-xl font-semibold text-white">{tool.title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{tool.description}</p><div className="mt-6 flex items-center gap-2 text-sm font-medium text-indigo-300 transition group-hover:translate-x-1">Explore <ChevronRight className="h-4 w-4" /></div></GlassPanel></motion.div>))}</div>
        </SectionShell>

        <SectionShell eyebrow="Pricing" title="Flexible plans crafted for momentum" description="Every tier is designed to feel polished and launch-ready, with room for future monetization.">
          <div className="grid gap-6 lg:grid-cols-3">{pricing.map((plan, index) => (<motion.div key={plan.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }}><GlassPanel hover className={`p-8 ${plan.featured ? 'border-indigo-400/40 bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/10' : ''}`}><div className="flex items-center justify-between gap-3"><h3 className="text-2xl font-semibold text-white">{plan.name}</h3>{plan.featured ? <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-indigo-300">Popular</span> : null}</div><p className="mt-4 text-sm leading-7 text-slate-400">{plan.description}</p><div className="mt-6 flex items-end gap-2"><span className="text-4xl font-semibold text-white">{plan.price}</span><span className="pb-2 text-slate-400">/month</span></div><ul className="mt-8 space-y-3 text-sm text-slate-300">{plan.features.map((feature) => (<li key={feature} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> {feature}</li>))}</ul><PremiumButton className="mt-8 w-full" variant={plan.featured ? 'primary' : 'secondary'}>{plan.featured ? 'Choose Starter' : plan.name === 'Free Trial' ? 'Start Free' : 'Contact Sales'}</PremiumButton></GlassPanel></motion.div>))}</div>
        </SectionShell>

        <SectionShell eyebrow="FAQ" title="Answers to the questions that matter" description="Everything is structured to feel clear, calm, and thoughtfully designed.">
          <div className="mx-auto max-w-3xl space-y-4">{faqs.map((item, index) => (<motion.div key={item.question} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.06 }}><GlassPanel className="p-6"><p className="text-lg font-semibold text-white">{item.question}</p><p className="mt-3 text-sm leading-7 text-slate-400">{item.answer}</p></GlassPanel></motion.div>))}</div>
        </SectionShell>

        <SectionShell eyebrow="Contact" title="Ready to shape your next AI product?" description="Let’s build something that feels as polished as it is powerful." center>
          <div className="flex flex-wrap justify-center gap-3"><PremiumButton>Book a demo</PremiumButton><PremiumButton variant="secondary">Email the team</PremiumButton></div>
        </SectionShell>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-6 py-8 text-center text-sm text-slate-500 sm:px-8 lg:px-10">© 2026 Aditya AI. Crafted with premium motion and open-source technology.</footer>
    </div>
  )
}
