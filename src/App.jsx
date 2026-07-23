import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, lazy, Suspense, useState } from 'react'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import NotFoundPage from './pages/NotFoundPage'
import CommandPalette from './components/CommandPalette'
import NotificationsCenter from './components/NotificationsCenter'
import UpgradeModal from './components/UpgradeModal'
import UserMenu from './components/UserMenu'
import ToastViewport from './components/ToastViewport'
import PageLoader from './components/PageLoader'
import { useAppContext } from './context/useAppContext'

const PricingPage = lazy(() => import('./pages/PricingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AIChatPage = lazy(() => import('./pages/AIChatPage'))
const AIImagePage = lazy(() => import('./pages/AIImagePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ChatHistoryPage = lazy(() => import('./pages/ChatHistoryPage'))
const ImageHistoryPage = lazy(() => import('./pages/ImageHistoryPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'))
const WriterPage = lazy(() => import('./pages/WriterPage'))
const CodePage = lazy(() => import('./pages/CodePage'))
const PDFPage = lazy(() => import('./pages/PDFPage'))
const TranslatePage = lazy(() => import('./pages/TranslatePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const CookiesPage = lazy(() => import('./pages/CookiesPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'))
const BugReportPage = lazy(() => import('./pages/BugReportPage'))
const ReleaseNotesPage = lazy(() => import('./pages/ReleaseNotesPage'))
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'))
const StatusPage = lazy(() => import('./pages/StatusPage'))
const LocalAIPage = lazy(() => import('./pages/LocalAIPage'))
const VisionPage = lazy(() => import('./pages/VisionPage'))
const OCRPage = lazy(() => import('./pages/OCRPage'))
const GrammarPage = lazy(() => import('./pages/GrammarPage'))
const EmailWriterPage = lazy(() => import('./pages/EmailWriterPage'))
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage'))
const SQLGeneratorPage = lazy(() => import('./pages/SQLGeneratorPage'))
const RegexGeneratorPage = lazy(() => import('./pages/RegexGeneratorPage'))
const JSONFormatterPage = lazy(() => import('./pages/JSONFormatterPage'))
const CodeDebuggerPage = lazy(() => import('./pages/CodeDebuggerPage'))
const CodeExplainerPage = lazy(() => import('./pages/CodeExplainerPage'))
const CodeOptimizerPage = lazy(() => import('./pages/CodeOptimizerPage'))

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
        <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}>{renderProtected(<DashboardPage />)}</Suspense>} />
        <Route path="/chat" element={<Suspense fallback={<PageLoader />}>{renderProtected(<AIChatPage />)}</Suspense>} />
        <Route path="/image" element={<Suspense fallback={<PageLoader />}>{renderProtected(<AIImagePage />)}</Suspense>} />
        <Route path="/local-ai" element={<Suspense fallback={<PageLoader />}>{renderProtected(<LocalAIPage />)}</Suspense>} />
        <Route path="/writer" element={<Suspense fallback={<PageLoader />}>{renderProtected(<WriterPage />)}</Suspense>} />
        <Route path="/code" element={<Suspense fallback={<PageLoader />}>{renderProtected(<CodePage />)}</Suspense>} />
        <Route path="/pdf" element={<Suspense fallback={<PageLoader />}>{renderProtected(<PDFPage />)}</Suspense>} />
        <Route path="/translate" element={<Suspense fallback={<PageLoader />}>{renderProtected(<TranslatePage />)}</Suspense>} />
        <Route path="/vision" element={<Suspense fallback={<PageLoader />}>{renderProtected(<VisionPage />)}</Suspense>} />
        <Route path="/ocr" element={<Suspense fallback={<PageLoader />}>{renderProtected(<OCRPage />)}</Suspense>} />
        <Route path="/grammar" element={<Suspense fallback={<PageLoader />}>{renderProtected(<GrammarPage />)}</Suspense>} />
        <Route path="/email" element={<Suspense fallback={<PageLoader />}>{renderProtected(<EmailWriterPage />)}</Suspense>} />
        <Route path="/resume" element={<Suspense fallback={<PageLoader />}>{renderProtected(<ResumeBuilderPage />)}</Suspense>} />
        <Route path="/sql" element={<Suspense fallback={<PageLoader />}>{renderProtected(<SQLGeneratorPage />)}</Suspense>} />
        <Route path="/regex" element={<Suspense fallback={<PageLoader />}>{renderProtected(<RegexGeneratorPage />)}</Suspense>} />
        <Route path="/json" element={<Suspense fallback={<PageLoader />}>{renderProtected(<JSONFormatterPage />)}</Suspense>} />
        <Route path="/debug" element={<Suspense fallback={<PageLoader />}>{renderProtected(<CodeDebuggerPage />)}</Suspense>} />
        <Route path="/explain" element={<Suspense fallback={<PageLoader />}>{renderProtected(<CodeExplainerPage />)}</Suspense>} />
        <Route path="/optimize" element={<Suspense fallback={<PageLoader />}>{renderProtected(<CodeOptimizerPage />)}</Suspense>} />
        <Route path="/profile" element={<Suspense fallback={<PageLoader />}>{renderProtected(<ProfilePage />)}</Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<PageLoader />}>{renderProtected(<SettingsPage />)}</Suspense>} />
        <Route path="/chat-history" element={<Suspense fallback={<PageLoader />}>{renderProtected(<ChatHistoryPage />)}</Suspense>} />
        <Route path="/image-history" element={<Suspense fallback={<PageLoader />}>{renderProtected(<ImageHistoryPage />)}</Suspense>} />
        <Route path="/favorites" element={<Suspense fallback={<PageLoader />}>{renderProtected(<FavoritesPage />)}</Suspense>} />
        <Route path="/notifications" element={<Suspense fallback={<PageLoader />}>{renderProtected(<NotificationsPage />)}</Suspense>} />
        <Route path="/subscription" element={<Suspense fallback={<PageLoader />}>{renderProtected(<SubscriptionPage />)}</Suspense>} />
        <Route path="/pricing" element={<Suspense fallback={<PageLoader />}><PricingPage /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<PageLoader />}><TermsPage /></Suspense>} />
        <Route path="/cookies" element={<Suspense fallback={<PageLoader />}><CookiesPage /></Suspense>} />
        <Route path="/help" element={<Suspense fallback={<PageLoader />}><HelpPage /></Suspense>} />
        <Route path="/feedback" element={<Suspense fallback={<PageLoader />}><FeedbackPage /></Suspense>} />
        <Route path="/bug-report" element={<Suspense fallback={<PageLoader />}><BugReportPage /></Suspense>} />
        <Route path="/release-notes" element={<Suspense fallback={<PageLoader />}><ReleaseNotesPage /></Suspense>} />
        <Route path="/roadmap" element={<Suspense fallback={<PageLoader />}><RoadmapPage /></Suspense>} />
        <Route path="/status" element={<Suspense fallback={<PageLoader />}><StatusPage /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<PageLoader />}>{renderProtected(<AdminPage />)}</Suspense>} />
        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
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