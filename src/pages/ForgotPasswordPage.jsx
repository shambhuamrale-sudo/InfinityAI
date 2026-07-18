import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Lock, Eye, EyeOff, ShieldCheck, Bot, Wand2, Sparkles } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import PremiumButton from '../components/PremiumButton'
import InfinityLogo from '../components/InfinityLogo'
import OtpInput from '../components/OtpInput'
import { useAppContext } from '../context/useAppContext'
import { useNavigate } from 'react-router-dom'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [resending, setResending] = useState(false)
  const { forgotPassword, verifyResetOtp, resetPassword } = useAppContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (step === 'otp' && countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [step, countdown])

  const handleEmailSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const result = await forgotPassword(email)
    setSubmitting(false)
    if (result.success) {
      setStep('otp')
      setCountdown(60)
    } else {
      setError(result.error || 'Failed to send OTP')
    }
  }

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) return
    setSubmitting(true)
    setError('')
    const result = await verifyResetOtp(email, otp)
    setSubmitting(false)
    if (result.success) {
      setStep('reset')
    } else {
      setError(result.error || 'Invalid OTP')
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    const result = await forgotPassword(email)
    setResending(false)
    if (result.success) {
      setCountdown(60)
      setOtp('')
    } else {
      setError(result.error || 'Failed to resend OTP')
    }
  }

  const handleResetSubmit = async (event) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    setError('')
    const result = await resetPassword(email, otp, password)
    setSubmitting(false)
    if (result.success) {
      navigate('/login')
    } else {
      setError(result.error || 'Failed to reset password')
    }
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
              <div className="relative flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl brand-gradient shadow-[0_10px_30px_rgba(168,85,247,0.35)]">
                  <InfinityLogo size={24} className="text-white" mono />
                </div>
                <span className="text-lg font-semibold tracking-tight">InfinityAI</span>
              </div>
              <div className="relative mt-12">
                <div className="inline-flex rounded-2xl bg-white/[0.05] p-3 text-indigo-300 ring-1 ring-white/10"><Sparkles className="h-6 w-6" /></div>
                <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Reset your password</h1>
                <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">Enter your email and we will send you a one-time code to reset your password.</p>
              </div>
              <div className="relative mt-10 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
                <div className="flex items-center gap-2 text-indigo-300"><ShieldCheck className="h-4 w-4" /> Secure password recovery</div>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-center gap-2"><Bot className="h-4 w-4 text-indigo-300" /> Premium chat and automation flows</li>
                  <li className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-fuchsia-300" /> Open-source image and creative tools</li>
                </ul>
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Password recovery</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {step === 'email' && 'Enter your email'}
                  {step === 'otp' && 'Enter verification code'}
                  {step === 'reset' && 'Create new password'}
                </h2>
              </div>

              {step === 'email' && (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 transition focus-within:border-indigo-400/40">
                    <Mail className="h-5 w-5 text-indigo-300" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" placeholder="Email address" required />
                  </label>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <PremiumButton className="mt-8 w-full" type="submit" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send OTP'} <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                </form>
              )}

              {step === 'otp' && (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <OtpInput value={otp} onChange={setOtp} disabled={submitting} />
                  </div>
                  {error && <p className="text-center text-sm text-red-400">{error}</p>}
                  <PremiumButton className="w-full" onClick={handleOtpSubmit} disabled={submitting || otp.length !== 6}>
                    {submitting ? 'Verifying...' : 'Verify OTP'} <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                  <div className="text-center text-sm text-slate-400">
                    {countdown > 0 ? (
                      <span>Resend OTP in {countdown}s</span>
                    ) : (
                      <button type="button" onClick={handleResend} disabled={resending} className="font-semibold text-indigo-300 hover:text-indigo-200 disabled:opacity-50">
                        {resending ? 'Sending...' : 'Resend OTP'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {step === 'reset' && (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 transition focus-within:border-indigo-400/40">
                    <Lock className="h-5 w-5 text-indigo-300" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" placeholder="New password" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 transition focus-within:border-indigo-400/40">
                    <Lock className="h-5 w-5 text-indigo-300" />
                    <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" placeholder="Confirm password" required minLength={6} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400 hover:text-white" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </label>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <PremiumButton className="mt-8 w-full" type="submit" disabled={submitting}>
                    {submitting ? 'Resetting...' : 'Reset password'} <ArrowRight className="h-4 w-4" />
                  </PremiumButton>
                </form>
              )}
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  )
}
