export default function ToastBanner({ title, message, tone = 'info' }) {
  const tones = {
    info: 'border-indigo-400/25 bg-indigo-400/10 text-indigo-100',
    success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100',
    warning: 'border-amber-400/25 bg-amber-400/10 text-amber-100'
  }
  return (
    <div className={`rounded-2xl border p-4 text-sm shadow-lg ${tones[tone] || tones.info}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 opacity-80">{message}</p>
    </div>
  )
}
