export default function SectionShell({ eyebrow, title, description, children, center = false }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
      <div className={`${center ? 'mx-auto max-w-3xl text-center' : ''} mb-12`}>
        {eyebrow ? <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-indigo-300">{eyebrow}</p> : null}
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 text-lg leading-8 text-slate-400">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
