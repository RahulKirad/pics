import { MarketingContentLayout } from '@/components/marketing/MarketingContentLayout';

const SECTIONS = [
  {
    heading: 'Overview',
    body: `PicShareNow (“we”, “us”) provides event photo sharing for photographers and their guests. This policy explains what we collect, why we collect it, and the choices you have. By using our service you agree to this policy.`,
  },
  {
    heading: 'Information we collect',
    body: `Photographers: account details (name, email, business), billing information processed via Razorpay, uploaded photos, and event metadata. Guests: optional selfies for face matching, consent records, gallery activity (views/downloads), and technical logs (browser, IP) for security.`,
  },
  {
    heading: 'How we use data',
    body: `We use data to operate the platform — store and deliver photos, run AI matching, prevent abuse, improve reliability, and communicate about your account. We do not sell guest selfies or photos to third parties for advertising.`,
  },
  {
    heading: 'AI & biometrics',
    body: `Guest selfies are used solely to match faces in photos for the relevant event. Embeddings may be stored for the event retention period configured by the photographer. Guests must provide explicit consent before processing.`,
  },
  {
    heading: 'Sharing & processors',
    body: `We use infrastructure and payment providers (hosting, storage, Razorpay) under contracts that require appropriate security. We may disclose information when required by law or to protect rights and safety.`,
  },
  {
    heading: 'Retention',
    body: `Photos and guest data are retained according to your plan and event settings. When an event or account is deleted, we remove associated files and embeddings within a reasonable period, subject to backup cycles.`,
  },
  {
    heading: 'Your rights',
    body: `Depending on your location, you may request access, correction, or deletion of personal data. Guests can withdraw consent by contacting the event photographer or us at privacy@picsharenow.com.`,
  },
  {
    heading: 'Security',
    body: `We use encryption in transit, tenant isolation, access controls, and audit logging. No system is perfectly secure; report concerns to security@picsharenow.com.`,
  },
  {
    heading: 'Children',
    body: `Our service is not directed at children under 13. Photographers are responsible for obtaining appropriate consent when minors appear in event photos.`,
  },
  {
    heading: 'Changes',
    body: `We may update this policy. Material changes will be posted on this page with an updated effective date. Continued use after changes constitutes acceptance.`,
  },
] as const;

export function PrivacyPage() {
  return (
    <MarketingContentLayout
      eyebrow="Company"
      title="Privacy policy"
      description={`Effective ${new Date().getFullYear()}-01-01 — how PicShareNow handles photographer and guest data.`}
      showCta={false}
    >
      <div className="mkt-prose space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold text-[#09286f]">{s.heading}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">{s.body}</p>
          </section>
        ))}
        <p className="text-sm text-[#64748b]">
          Contact:{' '}
          <a href="mailto:privacy@picsharenow.com" className="font-medium text-[#1d4ed8] hover:underline">
            privacy@picsharenow.com
          </a>
        </p>
      </div>
    </MarketingContentLayout>
  );
}
