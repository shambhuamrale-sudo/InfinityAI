export default function TooltipBubble({ label, children }) {
  return (
    <div className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 rounded-full border border-white/10 bg-[#0B1120]/95 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300 opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </span>
    </div>
  )
}
