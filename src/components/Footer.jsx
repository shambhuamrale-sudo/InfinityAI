import { Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import InfinityLogo from './InfinityLogo'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'AI Chat', path: '/chat' },
      { label: 'Image Studio', path: '/image' },
      { label: 'Writer', path: '/writer' },
      { label: 'Pricing', path: '/pricing' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About', path: '/about' },
      { label: 'Contact', path: '/contact' },
      { label: 'Status', path: '/status' },
      { label: 'Help', path: '/help' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', path: '/privacy' },
      { label: 'Terms', path: '/terms' },
      { label: 'Cookies', path: '/cookies' }
    ]
  }
]

export default function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-white/8 bg-[#05060a]/80 px-6 py-14 backdrop-blur-xl sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl brand-gradient shadow-[0_10px_30px_rgba(168,85,247,0.35)]">
              <InfinityLogo size={24} className="text-white" mono />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">InfinityAI</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            A premium AI workspace for chat, creation, and code — built for momentum and designed to feel effortless.
          </p>
          <a href="mailto:hello@infinityai.com" className="mt-5 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <Mail className="h-4 w-4 text-indigo-300" /> hello@infinityai.com
          </a>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">{col.title}</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              {col.links.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="transition hover:text-white">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-white/8 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 InfinityAI. Crafted with premium motion & open-source technology.</p>
        <div className="flex items-center gap-4">
          <span>Version 1.0.0</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>Endless AI Possibilities</span>
        </div>
      </div>
    </footer>
  )
}
