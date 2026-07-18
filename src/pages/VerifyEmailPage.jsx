import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Bot, Wand2, Sparkles } from 'lucide-react'
import BackgroundEffects from '../components/BackgroundEffects'
import GlassPanel from '../components/GlassPanel'
import PremiumButton from '../components/PremiumButton'
import InfinityLogo from '../components/InfinityLogo'
import OtpInput from '../components/OtpInput'
import { useAppContext } from '../context/useAppContext'
import { useNavigate, Navigate, useLocation } from 'react-router-dom'

export default function VerifyEmailPage() {
  const [otp, setOtp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [resending, setResending] = useState(false)
  const { verifyEmail, resendOtp, auth } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  useEffect(() => {
    if (!email) navigate('/signup')
  }, [email, navigate])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleVerify = async () => {
    if (otp.length !== 6) return
    setSubmitting(true)
    setError('')
    const result = await verifyEmail(email, otp)
    setSubmitting(false)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Verification failed')
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    const result = await resendOtp(email)
    setResending(false)
    if (result.success) {
      setCountdown(60)
      setOtp('')
    } else {
      setError(result.error || 'Failed to resend OTP')
    }
  }

  const isVerified = useMemo(() => auth.isAuthenticated && auth.user?.isVerified, [auth])

  if (isVerified) {
    return <Navigate to="/dashboard" replace />
  }

  if (!email) {
    return <Navigate to="/signup" replace />
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
                <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Verify your email</h1>
                <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">We sent a 6-digit code to <span className="text-indigo-300">{email}</span>. Enter it below to activate your account.</p>
              </div>
              <div className="relative mt-10 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
                <div className="flex items-center gap-2 text-indigo-300"><ShieldCheck className="h-4 w-4" /> Secure verification</div>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-center gap-2"><Bot className="h-4 w-4 text-indigo-300" /> Premium chat and automation flows</li>
                  <li className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-fuchsia-300" /> Open-source image and creative tools</li>
                </ul>
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Verify</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Enter verification code</h2>
              </div>

              <div className="space-y-6">
                <div className="flex justify-center">
                  <OtpInput value={otp} onChange={setOtp} disabled={submitting} />
                </div>

                {error && <p className="text-center text-sm text-red-400">{error}</p>}

                <PremiumButton className="w-full" onClick={handleVerify} disabled={submitting || otp.length !== 6}>
                  {submitting ? 'Verifying...' : 'Verify email'} <ArrowRight className="h-4 w-4" />
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
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  )
}
