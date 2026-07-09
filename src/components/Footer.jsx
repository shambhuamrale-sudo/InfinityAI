import { ArrowRight, Mail, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const footerLinks = [
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Privacy', path: '/privacy' },
  { label: 'Terms', path: '/terms' },
  { label: 'Cookies', path: '/cookies' },
  { label: 'Help', path: '/help' },
  { label: 'Feedback', path: '/feedback' },
  { label: 'Status', path: '/status' }
]

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#050816]/90 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-2 text-indigo-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Aditya AI</p>
              <p className="text-sm text-slate-400">Premium AI operations for modern teams.</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Build faster with a polished, open-source AI workspace designed for launch-ready creative and technical workflows.
          </p>
        </div>

        <div className="grid flex-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Explore</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              {footerLinks.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Connect</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li><a href="mailto:hello@aditya.ai" className="transition hover:text-white">hello@aditya.ai</a></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="transition hover:text-white">GitHub</a></li>
              <li><a href="https://x.com" target="_blank" rel="noreferrer" className="transition hover:text-white">X / Twitter</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Stay in sync</p>
            <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
              <label className="text-sm text-slate-400" htmlFor="newsletter-email">Newsletter</label>
              <div className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-[#050816] px-3 py-2">
                <Mail className="h-4 w-4 text-indigo-300" />
                <input id="newsletter-email" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Email" />
                <button className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 p-2 text-white">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Aditya AI. Built with open-source tools and premium design.</p>
        <div className="flex items-center gap-4">
          <span>Version 1.0.0</span>
          <span>•</span>
          <span>Launch ready</span>
        </div>
      </div>
    </footer>
  )
}
