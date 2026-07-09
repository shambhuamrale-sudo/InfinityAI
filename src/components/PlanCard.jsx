export default function PlanCard({ name, price, description, features, featured, cta }) {
  return (
    <div className={`rounded-3xl border p-8 backdrop-blur-xl ${featured ? 'border-cyan-400/50 bg-gradient-to-br from-cyan-500/15 to-fuchsia-500/10 shadow-2xl shadow-cyan-500/10' : 'border-white/10 bg-slate-900/70'}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-white">{name}</h3>
        {featured ? <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-300">Popular</span> : null}
      </div>
      <p className="mt-4 text-sm text-slate-400">{description}</p>
      <div className="mt-6 flex items-end gap-2">
        <span className="text-4xl font-semibold text-white">{price}</span>
        <span className="pb-2 text-slate-400">/month</span>
      </div>
      <ul className="mt-8 space-y-3 text-sm text-slate-300">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-3">
            <span className="text-cyan-300">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      <button className={`mt-8 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${featured ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-slate-950 hover:opacity-90' : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'}`}>
        {cta}
      </button>
    </div>
  )
}
