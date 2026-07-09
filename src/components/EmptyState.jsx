import { Sparkles } from 'lucide-react'

export default function EmptyState({ title, description, actionLabel, onAction, icon: Icon = Sparkles }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 p-8 text-center shadow-[0_20px_80px_rgba(2,6,23,0.2)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-400">{description}</p>
      {actionLabel && onAction ? (
        <button onClick={onAction} className="mt-5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white">{actionLabel}</button>
      ) : null}
    </div>
  )
}
