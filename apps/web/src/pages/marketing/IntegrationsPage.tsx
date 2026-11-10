import { MarketingContentLayout } from '@/components/marketing/MarketingContentLayout';

const INTEGRATIONS = [
  {
    name: 'Razorpay billing',
    category: 'Payments',
    description:
      'Subscribe to PicShareNow plans and manage renewals through Razorpay — built for Indian studios with transparent invoicing.',
  },
  {
    name: 'Cloud object storage',
    category: 'Storage',
    description:
      'Event originals and derivatives live in secure object storage with CDN-friendly delivery for fast guest downloads.',
  },
  {
    name: 'AI face pipeline',
    category: 'AI',
    description:
      'Dedicated AI workers process embeddings and face matches asynchronously so uploads never block your dashboard.',
  },
  {
    name: 'Vector search',
    category: 'AI',
    description:
      'Face embeddings are indexed for sub-second gallery matching, even when events contain thousands of photos.',
  },
  {
    name: 'Background job queues',
    category: 'Automation',
    description:
      'Upload, thumbnail, face-detection, and notification jobs run on managed queues with retries and admin observability.',
  },
  {
    name: 'REST API',
    category: 'Developers',
    description:
      'Authenticated APIs power the web dashboard, guest flows, and admin tools — same surface you use in production today.',
  },
  {
    name: 'QR & deep links',
    category: 'Guest access',
    description:
      'Every event gets tokenized URLs and printable QR codes that open the branded guest experience on any device.',
  },
  {
    name: 'Webhooks (roadmap)',
    category: 'Coming soon',
    description:
      'Notify your CRM or studio management tool when uploads finish, galleries go live, or quotas need attention.',
  },
] as const;

export function IntegrationsPage() {
  return (
    <MarketingContentLayout
      eyebrow="Product"
      title="Integrations & platform"
      description="PicShareNow is a full stack for photo delivery — storage, AI, billing, and guest experiences work together out of the box."
      wide
    >
      <div className="mkt-card-grid">
        {INTEGRATIONS.map((item) => (
          <div
            key={item.name}
            className="rounded-[16px] border border-[#e6eaf3] bg-white p-6 shadow-[var(--landing-shadow)]"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-[#1d4ed8]">{item.category}</span>
            <h3 className="mt-2 text-lg font-semibold text-[#0f172a]">{item.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{item.description}</p>
          </div>
        ))}
      </div>
      <p className="mkt-prose-muted mt-10 text-center text-sm text-[#64748b]">
        Need a custom integration?{' '}
        <a href="mailto:hello@picsharenow.com" className="font-semibold text-[#1d4ed8] hover:underline">
          Contact our team
        </a>
        .
      </p>
    </MarketingContentLayout>
  );
}
