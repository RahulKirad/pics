import { Link } from 'react-router-dom';
import { MarketingContentLayout } from '@/components/marketing/MarketingContentLayout';

const FAQ_GROUPS = [
  {
    title: 'Getting started',
    items: [
      {
        q: 'How do I create my first event?',
        a: 'Register for a free trial, open your dashboard, and click Create Event. Upload photos, then share the generated QR code with guests.',
      },
      {
        q: 'Do guests need an app?',
        a: 'No. Guests use their phone browser — scan the QR, accept consent, take a selfie, and view their gallery. No install required.',
      },
      {
        q: 'Which photo formats are supported?',
        a: 'JPEG and common RAW exports work best. Upload in batches from desktop; large files are processed in the background.',
      },
    ],
  },
  {
    title: 'AI & privacy',
    items: [
      {
        q: 'How accurate is face matching?',
        a: 'Accuracy depends on lighting and face visibility. We tune thresholds for events and show only confident matches to guests.',
      },
      {
        q: 'Do guests consent before selfies?',
        a: 'Yes. Every guest sees a consent screen explaining how selfies are used. You can configure retention from event settings.',
      },
      {
        q: 'Who can see uploaded photos?',
        a: 'Only you and matched guests see personal galleries. Event-wide browsing is off by default so privacy stays first.',
      },
    ],
  },
  {
    title: 'Billing & plans',
    items: [
      {
        q: 'Is there a free trial?',
        a: 'Yes. Start without a credit card, run a real event, and upgrade when you are ready for higher photo quotas and retention.',
      },
      {
        q: 'What happens when I hit my storage quota?',
        a: 'You will see a clear warning in the dashboard. Uploads pause until you free space or move to a higher plan.',
      },
      {
        q: 'How do payments work?',
        a: 'Plans are billed through Razorpay. Invoices and subscription status are available under Dashboard → Subscription.',
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        q: 'How do I contact support?',
        a: 'Email hello@picsharenow.com or use the contact form. Pro and Business plans include priority response.',
      },
      {
        q: 'Can I white-label the guest experience?',
        a: 'Custom branding — logo and colors on guest pages — is included on eligible plans. See Features for details.',
      },
    ],
  },
] as const;

export function FaqPage() {
  return (
    <MarketingContentLayout
      eyebrow="Resources"
      title="Help & FAQ"
      description="Quick answers about uploads, guest privacy, AI matching, and billing."
      wide
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-x-12">
        {FAQ_GROUPS.map((group) => (
          <section key={group.title} className="min-w-0">
            <h2 className="text-lg font-semibold text-[#09286f]">{group.title}</h2>
            <ul className="mt-4 space-y-3">
              {group.items.map((item) => (
                <li key={item.q} className="mkt-faq-item">
                  <details className="group rounded-[14px] border border-[#e6eaf3] bg-white px-5 py-4 shadow-[var(--landing-shadow)]">
                    <summary className="cursor-pointer list-none font-medium text-[#0f172a] marker:content-none [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center justify-between gap-4">
                        {item.q}
                        <span className="text-[#1d4ed8] transition group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-[#64748b]">{item.a}</p>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-[#64748b]">
        Still stuck?{' '}
        <Link to="/contact" className="font-semibold text-[#1d4ed8] hover:underline">
          Contact us
        </Link>
        .
      </p>
    </MarketingContentLayout>
  );
}
