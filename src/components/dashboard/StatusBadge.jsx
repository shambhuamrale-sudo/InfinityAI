export default function StatusBadge({ tone = 'healthy', label }) {
  const tones = {
    healthy: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    warning: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
    critical: 'border-rose-400/25 bg-rose-400/10 text-rose-300'
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tones[tone] || tones.healthy}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
