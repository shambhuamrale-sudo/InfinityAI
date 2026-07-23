import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

function SuggestionItem({ label, emoji, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(label)}
      className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:text-white hover:border-white/15 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)]"
    >
      <span className="text-lg transition-transform duration-200 group-hover:scale-110">{emoji}</span>
      <span className="font-medium">{label}</span>
    </motion.button>
  )
}

export default function EmptyState({ title, description, _actionLabel, onAction, onSuggestion, icon: Icon = Sparkles, suggestions }) {
  const defaultSuggestions = [
    { label: 'Explain code', emoji: '💻' },
    { label: 'Write email', emoji: '✉️' },
    { label: 'Generate SQL', emoji: '🗄️' },
    { label: 'Summarize PDF', emoji: '📄' },
    { label: 'Translate text', emoji: '🌐' },
    { label: 'Create logo prompt', emoji: '🎨' },
  ]

  const items = suggestions || defaultSuggestions

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex h-full flex-col items-center justify-center text-center px-4"
    >
      <motion.div 
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-white/[0.06] text-indigo-300 ring-1 ring-white/10 shadow-[0_8px_32px_-8px_rgba(129,140,248,0.3)]"
      >
        <Icon className="h-7 w-7" />
      </motion.div>
      
      <motion.h2 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-2xl font-semibold text-white tracking-tight"
      >
        {title || 'How can I help you today?'}
      </motion.h2>
      
      <motion.p 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-3 max-w-md text-sm text-slate-400 leading-relaxed"
      >
        {description || 'Start a conversation, or pick a suggestion to explore what InfinityAI can do.'}
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-8 flex flex-wrap justify-center gap-2.5 max-w-2xl"
      >
        {items.map((item, i) => (
          <SuggestionItem
            key={i}
            label={typeof item === 'string' ? item : item.label}
            emoji={typeof item === 'string' ? '✨' : item.emoji}
            onClick={onSuggestion || onAction}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}
