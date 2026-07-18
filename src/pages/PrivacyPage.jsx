import ContentPage from '../components/ContentPage'

export default function PrivacyPage() {
  return (
    <ContentPage eyebrow="Privacy Policy" title="Your data stays protected and private.">
      <div className="glass rounded-[1.6rem] p-6 text-sm leading-8 text-slate-400">
        <p>InfinityAI respects your privacy and uses your information only to provide the service, maintain security, and improve the experience. We do not sell personal data to third parties.</p>
        <p className="mt-4">We collect the minimum set of information needed for account access, usage analytics, preferences, and service delivery. Sensitive data is stored securely and never shared without your explicit consent.</p>
        <p className="mt-4">You may update or delete your saved preferences and activity history through the app at any time. If you have questions about privacy, contact our team directly.</p>
      </div>
    </ContentPage>
  )
}
