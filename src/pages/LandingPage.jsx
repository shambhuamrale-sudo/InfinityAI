import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight, Bot, Wand2, Code2, FileText, Languages, Sparkles, Zap, PlayCircle, BrainCircuit, ShieldCheck } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import PremiumButton from '../components/PremiumButton'
import SectionShell from '../components/SectionShell'
import InfinityLogo from '../components/InfinityLogo'
import Footer from '../components/Footer'

const tools = [
  { icon: Bot, title: 'AI Chat', description: 'Delightful conversations with streaming responses and context-rich memory.', badge: 'Live' },
  { icon: Wand2, title: 'AI Image', description: 'Generate visual concepts with cinematic control and style variations.', badge: 'New' },
  { icon: Code2, title: 'AI Code', description: 'Prototype, refactor, and launch faster with intelligent coding helpers.', badge: 'Beta' },
  { icon: FileText, title: 'PDF AI', description: 'Extract insights from docs, briefs, proposals, and legal content.', badge: 'Smart' },
  { icon: Languages, title: 'Translator', description: 'Localize experiences with tone-aware multilingual support.', badge: 'Global' },
  { icon: Sparkles, title: 'AI Writer', description: 'Create polished career assets and tailored storytelling.', badge: 'Launch' }
]

const features = [
  { icon: BrainCircuit, title: 'Adaptive intelligence', description: 'Context-aware agents that understand your workflow and accelerate every task.' },
  { icon: ShieldCheck, title: 'Secure by design', description: 'Local-ready, privacy-conscious, and built with open-source tooling.' },
  { icon: Zap, title: 'Effortless velocity', description: 'Premium motion and a calm interface keep you in flow from idea to ship.' }
]

const faqs = [
  { question: 'Do you rely on paid APIs?', answer: 'No. InfinityAI is built to work with free and open-source technologies such as Ollama and ComfyUI.' },
  { question: 'Is the UI production-ready?', answer: 'Yes. The experience is designed as a polished SaaS MVP with modular components and premium motion.' },
  { question: 'Can payments be added later?', answer: 'Absolutely. The subscription structure is ready for future gateway integration.' }
]

const stats = [
  { value: '1284', label: 'Active builders' },
  { value: '812', label: 'Teams onboarded' },
  { value: '8.4%', label: 'Conversion rate' },
  { value: '24/7', label: 'Local inference' }
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
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl brand-gradient shadow-[0_10px_30px_rgba(168,85,247,0.35)]">
            <InfinityLogo size={24} className="text-white" mono />
          </div>
          <span className="text-lg font-semibold tracking-tight">InfinityAI</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#tools" className="transition hover:text-white">Tools</a>
          <a href="#pricing" className="transition hover:text-white">Pricing</a>
          <a href="#faq" className="transition hover:text-white">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 sm:inline-block">Login</Link>
          <PremiumButton onClick={() => navigate('/signup')} className="px-4 py-2.5">Get started</PremiumButton>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-28 lg:pt-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
              <Zap className="h-4 w-4 text-indigo-300" /> 100% free and open-source ready
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              The premium AI workspace for <span className="text-gradient">endless possibilities.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Chat, create, and ship from one cinematic command center — built with the polish of a billion-dollar product and the transparency of open source.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-8 flex flex-wrap gap-3">
              <PremiumButton onClick={() => navigate('/signup')}>Start free <ArrowRight className="h-4 w-4" /></PremiumButton>
              <PremiumButton variant="secondary">Watch preview <PlayCircle className="h-4 w-4" /></PremiumButton>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 flex flex-wrap gap-3 text-sm text-slate-400">
              {['Ollama', 'ComfyUI', 'MongoDB Atlas', 'Framer Motion'].map((item) => (
                <span key={item} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 backdrop-blur-xl">{item}</span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative" onMouseMove={handleMove}>
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-fuchsia-500/20 blur-3xl" />
            <GlassPanel className="relative overflow-hidden p-5 sm:p-6">
              <motion.div style={{ x: smoothX, y: smoothY }} animate={{ x: [0, 6, 0], y: [0, -6, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute left-6 top-6 h-24 w-24 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="relative rounded-[1.5rem] border border-white/10 bg-[#07101f]/80 p-5">
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
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><Bot className="h-4 w-4" /></div>
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

        <section className="border-y border-white/8 bg-white/[0.02]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 sm:px-8 lg:grid-cols-4 lg:px-10">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className="text-center">
                <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{s.value}</p>
                <p className="mt-2 text-sm text-slate-400">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <SectionShell id="features" eyebrow="Why it feels premium" title="Every interaction is designed to feel effortless" description="Micro-interactions, layered depth, and polished motion create an experience that feels more like a product launch than a template.">
          <div className="grid gap-6 lg:grid-cols-3">{features.map((feature, index) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }}>
              <GlassPanel hover className="p-6">
                <div className="mb-4 inline-flex rounded-2xl bg-white/[0.05] p-3 text-indigo-300 ring-1 ring-white/10"><feature.icon className="h-6 w-6" /></div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
              </GlassPanel>
            </motion.div>
          ))}</div>
        </SectionShell>

        <SectionShell id="tools" eyebrow="AI tools" title="A curated command center for every AI workflow" description="From conversation to creation, each tool is styled and animated to feel premium and purposeful.">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{tools.map((tool, index) => (
            <motion.div key={tool.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.06 }}>
              <GlassPanel hover className="group p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-indigo-300 ring-1 ring-white/10"><tool.icon className="h-6 w-6" /></div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">{tool.badge}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{tool.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{tool.description}</p>
              </GlassPanel>
            </motion.div>
          ))}</div>
        </SectionShell>

        <SectionShell id="pricing" eyebrow="Pricing" title="Flexible plans crafted for momentum" description="Every tier is designed to feel polished and launch-ready, with room for future monetization.">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/8 bg-white/[0.03] p-8 text-center">
            <p className="text-sm leading-7 text-slate-300">Start free with a generous trial, then choose a plan that matches your pace. Explore the full breakdown on the <Link to="/pricing" className="font-semibold text-indigo-300 underline-offset-4 hover:underline">pricing page</Link>.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><PremiumButton onClick={() => navigate('/signup')}>Start free <ArrowRight className="h-4 w-4" /></PremiumButton></div>
          </div>
        </SectionShell>

        <SectionShell id="faq" eyebrow="FAQ" title="Answers to the questions that matter" description="Everything is structured to feel clear, calm, and thoughtfully designed.">
          <div className="mx-auto max-w-3xl space-y-4">{faqs.map((item, index) => (
            <motion.div key={item.question} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.06 }}>
              <GlassPanel className="p-6">
                <p className="text-lg font-semibold text-white">{item.question}</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.answer}</p>
              </GlassPanel>
            </motion.div>
          ))}</div>
        </SectionShell>

        <SectionShell eyebrow="Get started" title="Ready to shape your next AI product?" description="Let’s build something that feels as polished as it is powerful." center>
          <div className="flex flex-wrap justify-center gap-3">
            <PremiumButton onClick={() => navigate('/signup')}>Create your workspace</PremiumButton>
            <PremiumButton variant="secondary" onClick={() => navigate('/contact')}>Email the team</PremiumButton>
          </div>
        </SectionShell>
      </main>

      <Footer />
    </div>
  )
}
