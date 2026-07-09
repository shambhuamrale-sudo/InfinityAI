import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import { useAppContext } from '../context/AppContext'

export default function FavoritesPage() {
  const { favorites } = useAppContext()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-5 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Favorites</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Your pinned launch tools.</h1>
            </div>
          </div>
        </motion.header>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((favorite) => (
            <GlassPanel key={favorite.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{favorite.label}</p>
                <Star className="h-4 w-4 text-indigo-300" />
              </div>
              <p className="mt-3 text-sm text-slate-400">Quick access to your most-used experience.</p>
            </GlassPanel>
          ))}
        </div>
      </div>
    </div>
  )
}
