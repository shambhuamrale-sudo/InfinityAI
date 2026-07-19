import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { ArrowRight, Mail, Lock, UserRound, Eye, EyeOff, ShieldCheck, Bot, Wand2, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import PremiumButton from '../components/PremiumButton'
import InfinityLogo from '../components/InfinityLogo'
import { useAppContext } from '../context/useAppContext'
import { useNavigate, Link } from 'react-router-dom'

function PasswordStrengthMeter({ password }) {
  const checks = useMemo(() => {
    if (!password) return []
    return [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'One lowercase letter', met: /[a-z]/.test(password) },
      { label: 'One number', met: /[0-9]/.test(password) },
      { label: 'One special character', met: /[!@#$%^&*()_+=\-\[\]{};':"\\|,.<>/?]/.test(password) },
      { label: 'No spaces', met: !/\s/.test(password) },
    ]
  }, [password])

  const strength = useMemo(() => {
    const met = checks.filter((c) => c.met).length
    if (met <= 2) return 'Weak'
    if (met <= 4) return 'Medium'
    return 'Strong'
  }, [checks])

  const gradient = useMemo(() => {
    if (strength === 'Weak') return 'from-red-500 to-rose-600'
    if (strength === 'Medium') return 'from-amber-500 to-orange-500'
    return 'from-emerald-500 to-green-600'
  }, [strength])

  const width = useMemo(() => {
    if (strength === 'Weak') return '33%'
    if (strength === 'Medium') return '66%'
    return '100%'
  }, [strength])

  return (
    <div className="mt-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">Password strength</span>
        <span className={`text-xs font-semibold ${strength === 'Weak' ? 'text-red-400' : strength === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>{strength}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} animate={{ width }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <motion.span
              animate={{ scale: check.met ? 1 : 0.85, opacity: check.met ? 1 : 0.35 }}
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${check.met ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-500'}`}
            >
              {check.met ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            </motion.span>
            {check.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AuthPage({ type = 'login' }) {
  const isLogin = type === 'login'
  const { login, signup } = useAppContext()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    if (isLogin) {
      const result = await login(form.email, form.password)
      if (result.success) {
        navigate('/dashboard')
      } else if (result.resendOtp) {
        navigate('/verify-email', { state: { email: form.email } })
      }
    } else {
      const result = await signup(form.name, form.email, form.password)
      if (result.success) {
        navigate('/verify-email', { state: { email: form.email } })
      }
    }
    setSubmitting(false)
  }

  return (
    <div className="app-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-white">
      <BackgroundEffects />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-6xl">
        <GlassPanel className="overflow-hidden">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-fuchsia-500/15 p-8 sm:p-10">
              <motion.div animate={{ x: [0, 14, 0], y: [0, -10, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} className="absolute left-[-8%] top-[-5%] h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
              <motion.div animate={{ x: [0, -10, 0], y: [0, 16, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-[-10%] right-[-8%] h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
              <Link to="/" className="relative flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl brand-gradient shadow-[0_10px_30px_rgba(168,85,247,0.35)]">
                  <InfinityLogo size={24} className="text-white" mono />
                </div>
                <span className="text-lg font-semibold tracking-tight">InfinityAI</span>
              </Link>
              <div className="relative mt-12">
                <div className="inline-flex rounded-2xl bg-white/[0.05] p-3 text-indigo-300 ring-1 ring-white/10"><Sparkles className="h-6 w-6" /></div>
                <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{isLogin ? 'Welcome back to InfinityAI' : 'Create your AI command center'}</h1>
                <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">Access a premium AI workspace for chat, image generation, writing, and more — all powered by free and open-source tools.</p>
              </div>
              <div className="relative mt-10 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
                <div className="flex items-center gap-2 text-indigo-300"><ShieldCheck className="h-4 w-4" /> Secure and elegant by default</div>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-center gap-2"><Bot className="h-4 w-4 text-indigo-300" /> Premium chat and automation flows</li>
                  <li className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-fuchsia-300" /> Open-source image and creative tools</li>
                </ul>
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">{isLogin ? 'Login' : 'Sign up'}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{isLogin ? 'Sign in to continue' : 'Build your account'}</h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin ? (
                  <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 transition focus-within:border-indigo-400/40">
                    <UserRound className="h-5 w-5 text-indigo-300" />
                    <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full bg-transparent text-sm text-white outline-none" placeholder="Full name" required minLength={2} />
                  </label>
                ) : null}
                <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 transition focus-within:border-indigo-400/40">
                  <Mail className="h-5 w-5 text-indigo-300" />
                  <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full bg-transparent text-sm text-white outline-none" placeholder="Email address" required />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 transition focus-within:border-indigo-400/40">
                  <Lock className="h-5 w-5 text-indigo-300" />
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full bg-transparent text-sm text-white outline-none" placeholder="Password" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </label>
                {!isLogin && <PasswordStrengthMeter password={form.password} />}
                {isLogin && (
                  <div className="text-right">
                    <Link to="/forgot-password" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">Forgot password?</Link>
                  </div>
                )}
                <PremiumButton className="mt-8 w-full" type="submit" disabled={submitting}>{submitting ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign in' : 'Create account')} <ArrowRight className="h-4 w-4" /></PremiumButton>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <Link to={isLogin ? '/signup' : '/login'} className="font-semibold text-indigo-300">{isLogin ? 'Create one' : 'Sign in'}</Link>
              </p>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  )
}
