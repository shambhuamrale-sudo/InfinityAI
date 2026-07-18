import { useId, useState } from 'react'

export default function TooltipBubble({ label, children }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <div
      className="group relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#0a0c14]/95 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300 opacity-0 shadow-lg transition-opacity duration-200 ${open ? 'opacity-100' : ''}`}
      >
        {label}
      </span>
    </div>
  )
}
