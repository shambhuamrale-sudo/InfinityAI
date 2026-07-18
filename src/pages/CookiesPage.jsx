import ContentPage from '../components/ContentPage'

export default function CookiesPage() {
  return (
    <ContentPage eyebrow="Cookie Policy" title="We use cookies thoughtfully to improve the experience.">
      <div className="glass rounded-[1.6rem] p-6 text-sm leading-8 text-slate-400">
        <p>Cookies help us remember your preferences, keep the interface responsive, and ensure your product settings remain consistent across sessions.</p>
        <p className="mt-4">We use cookies for core functionality, performance, and basic analytics. You can manage or disable them in your browser settings, although some features may be impacted.</p>
      </div>
    </ContentPage>
  )
}
