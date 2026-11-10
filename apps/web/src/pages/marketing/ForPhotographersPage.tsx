import { Link } from 'react-router-dom';
import { MarketingContentLayout } from '@/components/marketing/MarketingContentLayout';

const SECTIONS = [
  {
    title: 'Weddings & celebrations',
    text: 'Give every guest their own highlight reel while you finish edits. QR at the mandap or reception means photos land before the party ends.',
  },
  {
    title: 'Corporate & conferences',
    text: 'Badge-friendly QR codes and consent flows fit enterprise events. Track downloads to show ROI to clients.',
  },
  {
    title: 'Schools & sports',
    text: 'Parents scan once and pull every shot of their child across games and ceremonies — no more scrolling group albums.',
  },
  {
    title: 'Freelancers & studios',
    text: 'Multi-event dashboards, storage quotas, and Razorpay billing scale from solo shooters to teams with second shooters.',
  },
] as const;

const BENEFITS = [
  'Deliver during the event, not weeks later',
  'Fewer “send me my photos” DMs and emails',
  'Branded guest pages that promote your studio',
  'Analytics to prove engagement to clients',
  'Privacy-first selfie flow guests actually trust',
] as const;

export function ForPhotographersPage() {
  return (
    <MarketingContentLayout
      eyebrow="Resources"
      title="Built for photographers"
      description="PicShareNow is designed around real event workflows — upload, QR, AI match, download — so you look professional and stay in control."
      wide
    >
      <p className="text-[15px] leading-relaxed text-[#64748b]">
        Whether you shoot ten weddings a season or run a studio with associates, the same platform handles upload throughput,
        guest privacy, and client-delight moments without custom dev work.
      </p>
      <ul className="mt-6 space-y-2">
        {BENEFITS.map((b) => (
          <li key={b} className="landing-check flex gap-2 text-sm text-[#0f172a]">
            {b}
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-xl font-semibold text-[#09286f]">Popular use cases</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-[14px] border border-[#e6eaf3] bg-[#f7f9fd] p-5">
            <h3 className="font-semibold text-[#0f172a]">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{s.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-[#64748b]">
        <Link to="/features" className="font-semibold text-[#1d4ed8] hover:underline">
          Explore all features
        </Link>{' '}
        or{' '}
        <Link to="/register" className="font-semibold text-[#1d4ed8] hover:underline">
          start your free trial
        </Link>
        .
      </p>
    </MarketingContentLayout>
  );
}
