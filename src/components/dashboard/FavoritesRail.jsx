import { motion } from 'framer-motion'
import { Bookmark, Star, Sparkles, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function FavoritesRail({ favorites }) {
  const navigate = useNavigate()
  const soft = 'glass'
  const items = (favorites && favorites.length)
    ? favorites.slice(0, 4)
    : [
        { label: 'AI Chat', path: '/chat' },
        { label: 'AI Image', path: '/image' },
        { label: 'AI Code', path: '/code' }
      ]

  return (
    <div className={`rounded-3xl border p-6 ${soft} backdrop-blur-xl`}>
      <div className="mb-5 flex items-center gap-2">
        <Bookmark className="h-4 w-4 text-indigo-300" />
        <h3 className="text-lg font-semibold text-white">Favorite tools</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <motion.button
            key={item.id || item.path || item.label}
            onClick={() => item.path && navigate(item.path)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-indigo-400/40 hover:bg-white/10"
          >
            <span className="flex items-center gap-2.5 text-sm font-medium text-white">
              <Star className="h-4 w-4 text-amber-300" />
              {item.label}
            </span>
            <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-white" />
          </motion.button>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Sparkles className="h-3.5 w-3.5 text-indigo-300" /> Pin tools from any workspace to keep them close.
      </p>
    </div>
  )
}
