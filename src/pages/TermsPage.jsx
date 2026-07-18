import ContentPage from '../components/ContentPage'

export default function TermsPage() {
  return (
    <ContentPage eyebrow="Terms & Conditions" title="Use the platform with confidence and clarity.">
      <div className="glass rounded-[1.6rem] p-6 text-sm leading-8 text-slate-400">
        <p>By accessing InfinityAI, you agree to use the service responsibly, respect licensing and usage limits, and avoid abusive or unlawful behavior.</p>
        <p className="mt-4">The platform is provided as-is, with the intent of giving users a reliable AI workspace. We reserve the right to adjust features, pricing, and availability as the product evolves.</p>
        <p className="mt-4">Users remain responsible for the content they create, submit, or share while using the product. Please comply with local laws and platform rules at all times.</p>
      </div>
    </ContentPage>
  )
}
