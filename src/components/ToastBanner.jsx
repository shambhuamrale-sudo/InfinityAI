export default function ToastBanner({ title, message }) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/10">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-cyan-100/80">{message}</p>
    </div>
  )
}
