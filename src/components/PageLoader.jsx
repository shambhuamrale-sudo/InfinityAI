import { motion } from 'framer-motion'

export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050816] px-4 text-white">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#0B1120]/80 p-6 shadow-[0_30px_140px_rgba(2,6,23,0.5)] backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-indigo-400" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-5/6 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-[1.2rem] border border-white/10 bg-white/5" />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
