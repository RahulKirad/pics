import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  ChartLine,
  HeartHandshake,
  LockKeyhole,
  Palette,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { LandingFeatureStrip } from '@/components/marketing/LandingFeatureStrip';
import { MarketingContentLayout } from '@/components/marketing/MarketingContentLayout';

const SHOWCASE = [
  {
    title: 'Upload unlimited photos',
    headline: 'From camera to cloud in minutes',
    text: 'Drag entire wedding folders into PicShareNow. Thumbnails, face processing, and indexing run in the background while you pack up gear.',
    image: '/how-it-works/upload.jpg',
    imageAlt: 'Upload photos to the cloud',
    reverse: false,
  },
  {
    title: 'Share QR codes',
    headline: 'One scan opens the whole experience',
    text: 'Every event gets a printable QR and shareable link. Guests never install an app — they scan, consent, and start finding photos instantly.',
    image: '/how-it-works/qr-scan.jpg',
    imageAlt: 'Scan and upload QR card',
    reverse: true,
  },
  {
    title: 'Selfie to find',
    headline: 'AI that knows who to look for',
    text: 'A quick selfie on the guest phone is all it takes. We match faces across the event library and build a personal gallery in seconds.',
    image: '/how-it-works/selfie.jpg',
    imageAlt: 'Guest taking a selfie on their phone',
    reverse: false,
  },
  {
    title: 'Instant downloads',
    headline: 'Polaroid-quality delivery, digital speed',
    text: 'Guests browse a masonry gallery, tap to download full resolution, and share favorites before they leave the venue.',
    image: '/how-it-works/download.jpg',
    imageAlt: 'Download and share event photos',
    reverse: true,
  },
] as const;

const HIGHLIGHTS = [
  {
    image: '/features/highlight-1.jpg',
    alt: 'Bride at a wedding ceremony',
    caption: 'Weddings — deliver portraits while guests are still celebrating.',
  },
  {
    image: '/features/highlight-2.jpg',
    alt: 'Professional photographer at an outdoor shoot',
    caption: 'Studios — one workflow for every client deliverable.',
  },
  {
    image: '/features/highlight-3.jpg',
    alt: 'Guests toasting at an evening reception',
    caption: 'Receptions & dinners — every table gets their candid moments.',
  },
] as const;

const PLATFORM_FEATURES = [
  {
    icon: Palette,
    title: 'Custom branding',
    text: 'Your logo and colors on guest pages so delivery feels premium and on-brand.',
  },
  {
    icon: ChartLine,
    title: 'Analytics',
    text: 'Track gallery opens, downloads, and selfie conversions after every event.',
  },
  {
    icon: Timer,
    title: 'Save hours per event',
    text: 'Automate matching and delivery instead of sorting folders manually.',
  },
  {
    icon: HeartHandshake,
    title: 'Happier clients',
    text: 'Instant access turns photo delivery into part of the experience.',
  },
  {
    icon: LockKeyhole,
    title: 'Enterprise security',
    text: 'Tenant isolation, encrypted storage, and consent-first guest flows.',
  },
  {
    icon: BadgeCheck,
    title: 'Flexible plans',
    text: 'Scale from one-off shoots to studios running dozens of events a month.',
  },
] as const;

export function FeaturesPage() {
  return (
    <MarketingContentLayout
      eyebrow="Product"
      title="Features built for real event workflows"
      description="Upload, QR sharing, AI face match, and guest galleries — everything on one platform, with the polish your clients expect."
      wide
      showCta
    >
      <LandingFeatureStrip />

      <section className="features-showcase mt-14 md:mt-16">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#1d4ed8]">Core platform</p>
        <h2 className="mt-3 text-center text-2xl font-bold text-[#09286f] md:text-3xl">How PicShareNow delivers photos</h2>
        <div className="mt-12 space-y-16 md:space-y-20">
          {SHOWCASE.map((block) => (
            <article
              key={block.title}
              className={`features-showcase-row ${block.reverse ? 'features-showcase-row--reverse' : ''}`}
            >
              <figure className="features-showcase-media">
                <div className="features-showcase-frame">
                  <img src={block.image} alt={block.imageAlt} className="features-showcase-img" loading="lazy" decoding="async" />
                </div>
              </figure>
              <div className="features-showcase-copy">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1d4ed8]">{block.title}</p>
                <h3 className="mt-2 text-xl font-bold text-[#0f172a] md:text-2xl">{block.headline}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#64748b]">{block.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-[22px] border border-[#e6eaf3] bg-[#f7f9fd] p-6 md:mt-20 md:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
          <figure>
            <div className="relative mx-auto max-w-sm">
              <div className="landing-hero-qr mx-auto scale-125">
                <img src="/hero-qr.png" alt="Sample event QR code" className="landing-hero-qr-img" width={120} height={120} />
              </div>
              <p className="mt-6 text-center text-sm font-medium text-[#64748b]">Crisp event QR codes — print-ready for your venue</p>
            </div>
          </figure>
          <div>
            <h2 className="text-2xl font-bold text-[#09286f]">Guest flow on every phone</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#64748b]">
              The same QR-first journey you see on our home page: scan, optional selfie, AI match, download. No passwords, no waiting
              for email links.
            </p>
            <Link to="/how-it-works" className="landing-btn-primary mt-6 inline-flex text-sm">
              See step-by-step guide
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16 md:mt-20">
        <h2 className="text-center text-2xl font-bold text-[#09286f] md:text-3xl">Photos your clients will love</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-[#64748b]">
          Real event imagery from the PicShareNow experience — personal, fast, and shareable.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <figure key={item.image} className="features-highlight-card group">
              <div className="features-highlight-img-wrap">
                <img src={item.image} alt={item.alt} className="features-highlight-img" loading="lazy" decoding="async" />
              </div>
              <figcaption className="mt-3 text-center text-xs leading-relaxed text-[#64748b]">{item.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-16 md:mt-20">
        <h2 className="text-center text-2xl font-bold text-[#09286f]">And everything else you need</h2>
        <div className="mkt-card-grid mt-10">
          {PLATFORM_FEATURES.map((item) => (
            <PlatformFeatureCard key={item.title} icon={item.icon} title={item.title} text={item.text} />
          ))}
        </div>
      </section>

      <p className="mt-12 text-center text-sm text-[#64748b]">
        <Link to="/for-photographers" className="font-semibold text-[#1d4ed8] hover:underline">
          See why photographers choose PicShareNow
        </Link>
        {' · '}
        <Link to="/integrations" className="font-semibold text-[#1d4ed8] hover:underline">
          View integrations
        </Link>
      </p>
    </MarketingContentLayout>
  );
}

function PlatformFeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[16px] border border-[#e6eaf3] bg-white p-6 shadow-[var(--landing-shadow)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3ff] text-[#1d4ed8]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 text-[17px] font-semibold text-[#0f172a]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{text}</p>
    </div>
  );
}
