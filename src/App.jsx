import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import PricingPage from './pages/PricingPage'
import AdminPage from './pages/AdminPage'
import AIChatPage from './pages/AIChatPage'
import AIImagePage from './pages/AIImagePage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import ChatHistoryPage from './pages/ChatHistoryPage'
import ImageHistoryPage from './pages/ImageHistoryPage'
import FavoritesPage from './pages/FavoritesPage'
import NotificationsPage from './pages/NotificationsPage'
import SubscriptionPage from './pages/SubscriptionPage'
import WriterPage from './pages/WriterPage'
import CodePage from './pages/CodePage'
import PDFPage from './pages/PDFPage'
import TranslatePage from './pages/TranslatePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import CookiesPage from './pages/CookiesPage'
import HelpPage from './pages/HelpPage'
import FeedbackPage from './pages/FeedbackPage'
import BugReportPage from './pages/BugReportPage'
import ReleaseNotesPage from './pages/ReleaseNotesPage'
import RoadmapPage from './pages/RoadmapPage'
import StatusPage from './pages/StatusPage'
import NotFoundPage from './pages/NotFoundPage'
import CommandPalette from './components/CommandPalette'
import LocalAIPage from './pages/LocalAIPage'
import NotificationsCenter from './components/NotificationsCenter'
import UpgradeModal from './components/UpgradeModal'
import UserMenu from './components/UserMenu'
import ToastViewport from './components/ToastViewport'
import PageLoader from './components/PageLoader'
import VisionPage from './pages/VisionPage'
import OCRPage from './pages/OCRPage'
import GrammarPage from './pages/GrammarPage'
import EmailWriterPage from './pages/EmailWriterPage'
import ResumeBuilderPage from './pages/ResumeBuilderPage'
import SQLGeneratorPage from './pages/SQLGeneratorPage'
import RegexGeneratorPage from './pages/RegexGeneratorPage'
import JSONFormatterPage from './pages/JSONFormatterPage'
import CodeDebuggerPage from './pages/CodeDebuggerPage'
import CodeExplainerPage from './pages/CodeExplainerPage'
import CodeOptimizerPage from './pages/CodeOptimizerPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import { useAppContext } from './context/useAppContext'

function AppShell() {
  const location = useLocation()
  const { setCommandPaletteOpen, setNotificationsOpen, auth, aiMode } = useAppContext()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const timer = window.setTimeout(() => setLoading(false), 220)
    return () => window.clearTimeout(timer)
  }, [location.pathname])

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandPaletteOpen(true)
      }
      if (event.key === 'Escape') {
        setCommandPaletteOpen(false)
        setNotificationsOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandPaletteOpen, setNotificationsOpen])

  const isProtectedRoute = useMemo(() => ['/dashboard', '/chat', '/image', '/local-ai', '/writer', '/code', '/pdf', '/translate', '/profile', '/settings', '/chat-history', '/image-history', '/favorites', '/notifications', '/subscription', '/admin'].includes(location.pathname), [location.pathname])

  const renderProtected = (element) => {
    if (auth.loading) return <PageLoader />
    if (!auth.isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />
    }
    return element
  }

  return (
    <>
      <UserMenu />
      <CommandPalette />
      <NotificationsCenter />
      <UpgradeModal />
      <ToastViewport />
      {isProtectedRoute && auth.isAuthenticated ? (
        <div className="fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0c14]/80 px-3 py-2 text-sm text-slate-300 backdrop-blur-xl">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] ${
              aiMode.cloudStatus === 'connected' ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20' : 'bg-red-400/10 text-red-300 ring-1 ring-red-400/20'
            }`}>
              Cloud · {aiMode.cloudStatus === 'connected' ? 'Connected' : aiMode.cloudStatus === 'unavailable' ? 'Unavailable' : 'Unknown'}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] ${
              aiMode.localStatus === 'running' ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20' : aiMode.localStatus === 'stopped' ? 'bg-slate-400/10 text-slate-400 ring-1 ring-slate-400/20' : 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20'
            }`}>
              Local · {aiMode.localStatus === 'running' ? 'Running' : aiMode.localStatus === 'stopped' ? 'Stopped' : 'Not Installed'}
            </span>
          </div>
          <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setCommandPaletteOpen(true)} className="rounded-full brand-gradient p-4 text-white shadow-[0_16px_60px_-16px_rgba(129,140,248,0.7)]">
            <span className="text-lg font-semibold">＋</span>
          </motion.button>
        </div>
      ) : null}
      <AnimatePresence mode="wait">
        {loading ? <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><PageLoader /></motion.div> : <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={auth.isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage type="login" />} />
        <Route path="/signup" element={auth.isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage type="signup" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={renderProtected(<DashboardPage />)} />
        <Route path="/chat" element={renderProtected(<AIChatPage />)} />
        <Route path="/image" element={renderProtected(<AIImagePage />)} />
        <Route path="/local-ai" element={renderProtected(<LocalAIPage />)} />
        <Route path="/writer" element={renderProtected(<WriterPage />)} />
        <Route path="/code" element={renderProtected(<CodePage />)} />
        <Route path="/pdf" element={renderProtected(<PDFPage />)} />
        <Route path="/translate" element={renderProtected(<TranslatePage />)} />
        <Route path="/vision" element={renderProtected(<VisionPage />)} />
        <Route path="/ocr" element={renderProtected(<OCRPage />)} />
        <Route path="/grammar" element={renderProtected(<GrammarPage />)} />
        <Route path="/email" element={renderProtected(<EmailWriterPage />)} />
        <Route path="/resume" element={renderProtected(<ResumeBuilderPage />)} />
        <Route path="/sql" element={renderProtected(<SQLGeneratorPage />)} />
        <Route path="/regex" element={renderProtected(<RegexGeneratorPage />)} />
        <Route path="/json" element={renderProtected(<JSONFormatterPage />)} />
        <Route path="/debug" element={renderProtected(<CodeDebuggerPage />)} />
        <Route path="/explain" element={renderProtected(<CodeExplainerPage />)} />
        <Route path="/optimize" element={renderProtected(<CodeOptimizerPage />)} />
        <Route path="/profile" element={renderProtected(<ProfilePage />)} />
        <Route path="/settings" element={renderProtected(<SettingsPage />)} />
        <Route path="/chat-history" element={renderProtected(<ChatHistoryPage />)} />
        <Route path="/image-history" element={renderProtected(<ImageHistoryPage />)} />
        <Route path="/favorites" element={renderProtected(<FavoritesPage />)} />
        <Route path="/notifications" element={renderProtected(<NotificationsPage />)} />
        <Route path="/subscription" element={renderProtected(<SubscriptionPage />)} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/bug-report" element={<BugReportPage />} />
        <Route path="/release-notes" element={<ReleaseNotesPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/admin" element={renderProtected(<AdminPage />)} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes></motion.div>}
      </AnimatePresence>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
