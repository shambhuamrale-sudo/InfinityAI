import { motion } from 'framer-motion'
import { Star, Sparkles, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BackgroundEffects from '../components/BackgroundEffects'
import EmptyState from '../components/EmptyState'
import { useAppContext } from '../context/useAppContext'

export default function FavoritesPage() {
  const { favorites } = useAppContext()
  const navigate = useNavigate()

  return (
    <div className="app-canvas relative min-h-screen overflow-hidden text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[1.75rem] p-5">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Favorites</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Your pinned launch tools.</h1>
        </motion.header>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favorites.length ? favorites.map((favorite, i) => (
            <motion.button key={favorite.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} onClick={() => favorite.path && navigate(favorite.path)} whileHover={{ y: -4 }} className="group flex items-center justify-between rounded-3xl border border-white/8 bg-white/[0.03] p-6 text-left transition hover:bg-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-amber-300 ring-1 ring-white/10"><Star className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold text-white">{favorite.label}</p>
                  <p className="text-sm text-slate-400">Quick access to your most-used experience.</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-white" />
            </motion.button>
          )) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState icon={Sparkles} title="No favorites yet" description="Pin tools from any workspace using the star icon to keep them one tap away." />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
