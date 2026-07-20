import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutGrid, MessageSquareText, ImagePlus, Sparkles, Code2, FileText, Languages,
  History, GalleryHorizontalEnd, Bookmark, Crown, Bell, Settings, ShieldCheck, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { useAppContext } from '../../context/useAppContext'
import InfinityLogo from '../InfinityLogo'

const NAV = [
  { label: 'Dashboard', icon: LayoutGrid, route: '/dashboard' },
  { label: 'AI Chat', icon: MessageSquareText, route: '/chat' },
  { label: 'AI Image', icon: ImagePlus, route: '/image' },
  { label: 'AI Writer', icon: Sparkles, route: '/writer' },
  { label: 'AI Code', icon: Code2, route: '/code' },
  { label: 'PDF AI', icon: FileText, route: '/pdf' },
  { label: 'Translator', icon: Languages, route: '/translate' },
  { label: 'Chat History', icon: History, route: '/chat-history' },
  { label: 'Image History', icon: GalleryHorizontalEnd, route: '/image-history' },
  { label: 'Favorites', icon: Bookmark, route: '/favorites' },
  { label: 'Subscription', icon: Crown, route: '/subscription' },
  { label: 'Notifications', icon: Bell, route: '/notifications' },
  { label: 'Settings', icon: Settings, route: '/settings' }
]

export default function DashboardSidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppContext()
  const isAdmin = String(user?.role || '').toLowerCase().includes('admin')
  const items = isAdmin ? [...NAV, { label: 'Admin', icon: ShieldCheck, route: '/admin' }] : NAV
  const path = location.pathname

  const surface = 'border-white/8 bg-[#0a0c14]/80'
  const muted = 'text-slate-400'

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 88 : 284 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={`relative z-30 hidden h-screen shrink-0 flex-col border-r ${surface} backdrop-blur-2xl lg:flex`}
    >
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-[0_10px_30px_rgba(168,85,247,0.35)]">
          <InfinityLogo size={26} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="whitespace-nowrap text-[15px] font-semibold tracking-tight text-white">InfinityAI</p>
            <p className={`whitespace-nowrap text-xs ${muted}`}>Command Center</p>
          </div>
        )}
      </div>

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.map((item) => {
          const Icon = item.icon
          const active = path === item.route
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              title={collapsed ? item.label : undefined}
              className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-gradient-to-r from-indigo-500/25 to-fuchsia-500/15 text-white shadow-[0_0_30px_rgba(99,102,241,0.18)]'
                  : `${muted} hover:-translate-y-0.5 hover:bg-white/5 hover:text-white`
              }`}
            >
              {active && (
                <motion.span layoutId="nav-active" className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-fuchsia-400" />
              )}
              <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-indigo-300' : ''}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-xl border border-white/10 bg-[#0B1120] px-3 py-1.5 text-xs text-white shadow-xl group-hover:block">
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t px-3 py-4">
        <button
          onClick={onToggle}
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium ${muted} transition hover:bg-white/5 hover:text-white`}
        >
          {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  )
}
