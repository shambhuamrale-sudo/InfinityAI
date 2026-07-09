import { motion } from 'framer-motion'
import { ShieldCheck, Crown, Mail, MapPin, Clock3 } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import PremiumButton from '../components/PremiumButton'
import { useAppContext } from '../context/AppContext'

export default function ProfilePage() {
  const { user } = useAppContext()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-[#0B1120]/85 p-5 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">User Profile</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">A polished identity for your workspace.</h1>
            </div>
            <PremiumButton variant="secondary">Edit profile</PremiumButton>
          </div>
        </motion.header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <GlassPanel className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl font-semibold text-white">{(user?.avatar || user?.name || 'A').slice(0, 2).toUpperCase()}</div>
              <div>
                <p className="text-xl font-semibold text-white">{user?.name || 'User'}</p>
                <p className="mt-1 text-sm text-slate-400">{user?.company || 'Aditya AI'} • {user?.location || ''}</p>
              </div>
            </div>
            <div className="mt-6 rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <div className="flex items-center gap-2"><Crown className="h-4 w-4 text-amber-300" /> {user?.plan ? user.plan.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : 'Free Trial'} plan</div>
              <div className="mt-3 flex items-center gap-2"><Mail className="h-4 w-4 text-indigo-300" /> {user?.email || ''}</div>
              <div className="mt-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-300" /> {user?.location || 'Not set'}</div>
              <div className="mt-3 flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-300" /> Active now</div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Profile highlights</p>
                <h3 className="text-lg font-semibold text-white">Your identity, refined</h3>
              </div>
              <div className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-300">{user?.role === 'admin' ? 'Admin' : 'Verified'}</div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                { title: 'Design focus', value: 'Premium UI systems' },
                { title: 'Launch speed', value: 'Fast iterations' },
                { title: 'Automation', value: 'Smart workflows' },
                { title: 'Security', value: 'Open-source ready' }
              ].map((item) => (
                <div key={item.title} className="rounded-[1.15rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">{item.title}</p>
                  <p className="mt-2 font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 p-4 text-sm text-slate-300">
              <ShieldCheck className="h-5 w-5 text-emerald-300" /> Your account is protected with secure, modern access controls.
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}

