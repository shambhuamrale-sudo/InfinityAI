import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

export default function ContextMenu({ items = [] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={(event) => { event.stopPropagation(); setOpen((value) => !value) }} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-40 rounded-[1.1rem] border border-white/10 bg-[#0B1120]/95 p-2 shadow-2xl">
          {items.map((item) => (
            <button key={item.label} onClick={(event) => { event.stopPropagation(); item.onClick?.(); setOpen(false) }} className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
