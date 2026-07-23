import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const QUICK_ACTIONS = [
  { title: 'AI Chat', description: 'Conversational intelligence with streaming.', icon: '💬', route: '/chat', color: 'from-fuchsia-500/30 to-indigo-500/20' },
  { title: 'AI Image', description: 'Cinematic visuals and concept art.', icon: '🎨', route: '/image', color: 'from-cyan-500/30 to-violet-500/20' },
  { title: 'AI Writer', description: 'Polished copy, emails, and docs.', icon: '✍️', route: '/writer', color: 'from-amber-500/30 to-rose-500/20' },
  { title: 'AI Code', description: 'Generate, debug, and optimize code.', icon: '🧑‍💻', route: '/code', color: 'from-emerald-500/30 to-cyan-500/20' },
  { title: 'PDF AI', description: 'Summaries, Q&A, and extraction.', icon: '📄', route: '/pdf', color: 'from-indigo-500/30 to-slate-500/20' },
  { title: 'Translator', description: 'Localize across every market.', icon: '🌐', route: '/translate', color: 'from-violet-500/30 to-fuchsia-500/20' },
  { title: 'Vision', description: 'Analyze images with multimodal models.', icon: '👁️', route: '/vision', color: 'from-sky-500/30 to-indigo-500/20' },
  { title: 'OCR', description: 'Extract text from images and scans.', icon: '🔍', route: '/ocr', color: 'from-rose-500/30 to-orange-500/20' },
  { title: 'Grammar', description: 'Polish tone, clarity, and style.', icon: '📝', route: '/grammar', color: 'from-teal-500/30 to-emerald-500/20' },
  { title: 'SQL Generator', description: 'Natural language to SQL queries.', icon: '🗃️', route: '/sql', color: 'from-blue-500/30 to-indigo-500/20' },
  { title: 'JSON Formatter', description: 'Beautify, validate, and diff JSON.', icon: '🧩', route: '/json', color: 'from-yellow-500/30 to-amber-500/20' },
  { title: 'Email Writer', description: 'Draft outreach and responses fast.', icon: '📧', route: '/email', color: 'from-pink-500/30 to-rose-500/20' },
  { title: 'Resume Builder', description: 'ATS-ready resumes and cover letters.', icon: '📋', route: '/resume', color: 'from-indigo-500/30 to-purple-500/20' },
  { title: 'Regex Generator', description: 'Build and test regex patterns.', icon: '🔎', route: '/regex', color: 'from-fuchsia-500/30 to-pink-500/20' },
  { title: 'Local AI', description: 'Run fully offline on your machine.', icon: '🖥️', route: '/local-ai', color: 'from-emerald-500/30 to-teal-500/20' },
]

export default function DashboardToolLauncher() {
  const navigate = useNavigate()
  const soft = 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06]'
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {QUICK_ACTIONS.map((tool, i) => (
        <motion.button
          key={tool.title}
          onClick={() => navigate(tool.route)}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
          whileHover={{ y: -6 }}
          className={`group relative overflow-hidden rounded-3xl border p-6 text-left transition ${soft}`}
        >
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-xl shadow-inner">
              {tool.icon}
            </div>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              Launch
            </span>
          </div>
          <h3 className="relative mt-5 text-lg font-semibold text-white">{tool.title}</h3>
          <p className="relative mt-2 text-sm leading-6 text-white/70">{tool.description}</p>
          <div className="relative mt-5 flex items-center gap-1.5 text-sm font-medium text-indigo-200 transition group-hover:gap-2.5">
            Open <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
