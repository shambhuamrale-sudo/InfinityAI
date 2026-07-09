import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bot, Wand2, PenTool, Code2, FileText, Languages, ArrowUpRight } from 'lucide-react'

const TOOLS = [
  { title: 'AI Chat', description: 'Context-rich conversations with streaming responses.', icon: Bot, route: '/chat', badge: 'Live', gradient: 'from-fuchsia-500/30 via-indigo-500/20 to-cyan-500/20', ring: 'group-hover:shadow-[0_24px_70px_rgba(217,70,239,0.25)]' },
  { title: 'AI Image', description: 'Cinematic concepts with style and direction.', icon: Wand2, route: '/image', badge: 'New', gradient: 'from-cyan-500/30 via-indigo-500/20 to-violet-500/20', ring: 'group-hover:shadow-[0_24px_70px_rgba(34,211,238,0.22)]' },
  { title: 'AI Writer', description: 'Turn briefs into polished, launch-ready copy.', icon: PenTool, route: '/writer', badge: 'Smart', gradient: 'from-amber-500/30 via-rose-500/20 to-fuchsia-500/20', ring: 'group-hover:shadow-[0_24px_70px_rgba(245,158,11,0.22)]' },
  { title: 'AI Code', description: 'Prototype and ship faster with smart helpers.', icon: Code2, route: '/code', badge: 'Beta', gradient: 'from-emerald-500/30 via-cyan-500/20 to-indigo-500/20', ring: 'group-hover:shadow-[0_24px_70px_rgba(16,185,129,0.22)]' },
  { title: 'PDF AI', description: 'Summarize, extract, and act on your documents.', icon: FileText, route: '/pdf', badge: 'Docs', gradient: 'from-indigo-500/30 via-slate-500/20 to-cyan-500/20', ring: 'group-hover:shadow-[0_24px_70px_rgba(99,102,241,0.22)]' },
  { title: 'Translator', description: 'Localize experiences across every market.', icon: Languages, route: '/translate', badge: 'Global', gradient: 'from-violet-500/30 via-fuchsia-500/20 to-rose-500/20', ring: 'group-hover:shadow-[0_24px_70px_rgba(139,92,246,0.22)]' }
]

export default function ToolLauncher({ isDark }) {
  const navigate = useNavigate()
  const soft = isDark ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07]' : 'border-slate-200 bg-white/70 hover:bg-white'

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {TOOLS.map((tool, i) => {
        const Icon = tool.icon
        return (
          <motion.button
            key={tool.title}
            onClick={() => navigate(tool.route)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
            whileHover={{ y: -6 }}
            className={`group relative overflow-hidden rounded-3xl border p-6 text-left transition ${soft} ${tool.ring}`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            <div className="relative flex items-start justify-between gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-inner">
                <Icon className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                {tool.badge}
              </span>
            </div>
            <h3 className="relative mt-5 text-lg font-semibold text-white">{tool.title}</h3>
            <p className="relative mt-2 text-sm leading-6 text-white/70">{tool.description}</p>
            <div className="relative mt-5 flex items-center gap-1.5 text-sm font-medium text-indigo-200 transition group-hover:gap-2.5">
              Launch <ArrowUpRight className="h-4 w-4" />
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
