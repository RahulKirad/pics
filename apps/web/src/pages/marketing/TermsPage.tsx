import { MarketingContentLayout } from '@/components/marketing/MarketingContentLayout';

const SECTIONS = [
  {
    heading: 'Agreement',
    body: `These Terms of Service (“Terms”) govern your use of PicShareNow. By creating an account or using the service, you agree to these Terms and our Privacy Policy.`,
  },
  {
    heading: 'Accounts',
    body: `You must provide accurate registration information and keep credentials secure. You are responsible for activity under your account and for ensuring associates comply with these Terms.`,
  },
  {
    heading: 'Photographer responsibilities',
    body: `You represent that you have the right to upload and share photos you publish through PicShareNow, including model/releases where required. You must obtain guest consent before collecting selfies for face matching and honor applicable privacy laws.`,
  },
  {
    heading: 'Acceptable use',
    body: `You may not upload unlawful content, malware, or material that infringes intellectual property. You may not attempt to bypass security, scrape other tenants’ data, or reverse engineer the service except as permitted by law.`,
  },
  {
    heading: 'Plans & payment',
    body: `Paid plans renew according to the billing cycle you select via Razorpay unless cancelled. Fees are non-refundable except where required by law. We may change pricing with notice before your next renewal.`,
  },
  {
    heading: 'Intellectual property',
    body: `You retain ownership of photos you upload. You grant PicShareNow a limited license to host, process, and deliver those photos solely to operate the service. Our software, branding, and documentation remain our property.`,
  },
  {
    heading: 'Availability',
    body: `We strive for high availability but do not guarantee uninterrupted service. Maintenance, third-party outages, or force majeure may cause temporary disruption.`,
  },
  {
    heading: 'Limitation of liability',
    body: `To the maximum extent permitted by law, PicShareNow is not liable for indirect, incidental, or consequential damages, or for loss of profits or data. Our aggregate liability is limited to fees you paid in the twelve months before the claim.`,
  },
  {
    heading: 'Termination',
    body: `You may close your account at any time. We may suspend or terminate accounts that violate these Terms or pose risk to the platform. Upon termination, your right to use the service ends; export obligations are described in the dashboard.`,
  },
  {
    heading: 'Governing law',
    body: `These Terms are governed by the laws of India, without regard to conflict-of-law rules. Disputes shall be subject to the courts of Bangalore, Karnataka, unless otherwise required by consumer protection law.`,
  },
] as const;

export function TermsPage() {
  return (
    <MarketingContentLayout
      eyebrow="Company"
      title="Terms of service"
      description={`Effective ${new Date().getFullYear()}-01-01 — please read before using PicShareNow.`}
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
          Questions:{' '}
          <a href="mailto:legal@picsharenow.com" className="font-medium text-[#1d4ed8] hover:underline">
            legal@picsharenow.com
          </a>
        </p>
      </div>
    </MarketingContentLayout>
  );
}
