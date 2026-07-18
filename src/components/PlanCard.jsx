export default function PlanCard({ name, price, description, features, featured, cta, onSelect }) {
  return (
    <div className={`relative flex flex-col rounded-3xl border p-8 backdrop-blur-xl ${featured ? 'border-indigo-400/40 bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/10 shadow-[0_30px_90px_-40px_rgba(129,140,248,0.6)]' : 'border-white/8 bg-white/[0.03]'}`}>
      {featured ? (
        <span className="absolute -top-3 left-8 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-xs uppercase tracking-[0.22em] text-indigo-200">Popular</span>
      ) : null}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold tracking-tight text-white">{name}</h3>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-6 flex items-end gap-2">
        <span className="text-4xl font-semibold tracking-tight text-white">{price}</span>
        <span className="pb-2 text-slate-400">/month</span>
      </div>
      <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-300">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-3">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-400/15 text-indigo-300">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      <button onClick={onSelect} className={`mt-8 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${featured ? 'brand-gradient text-white shadow-[0_14px_44px_-12px_rgba(129,140,248,0.6)] hover:brightness-110' : 'border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'}`}>
        {cta}
      </button>
    </div>
  )
}
