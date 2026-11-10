import { Link } from 'react-router-dom';
import { MarketingContentLayout } from '@/components/marketing/MarketingContentLayout';

const STEPS = [
  {
    image: '/how-it-works/upload.jpg',
    title: '1. Upload your event photos',
    text: 'After the shoot, upload RAW or JPEG batches from your computer. PicShareNow stores them securely and starts background processing.',
  },
  {
    image: '/how-it-works/qr-scan.jpg',
    title: '2. Share the event QR',
    text: 'Display the QR at the venue, add it to WhatsApp groups, or embed it on a thank-you card. Guests scan with any phone camera.',
  },
  {
    image: '/how-it-works/selfie.jpg',
    title: '3. Guest selfie & consent',
    text: 'Guests review a short privacy notice, then take a quick selfie. Our AI matches their face across the entire event library.',
  },
  {
    image: '/how-it-works/download.jpg',
    title: '4. Download & share',
    text: 'Matched photos appear instantly. Guests download full-resolution files or share favorites — while you track engagement in your dashboard.',
  },
] as const;

export function HowItWorksMarketingPage() {
  return (
    <MarketingContentLayout
      eyebrow="Product"
      title="How PicShareNow works"
      description="Four steps from camera to guest — built so photographers spend less time on delivery and more time shooting."
    >
      <ol className="space-y-10">
        {STEPS.map((step) => (
          <li key={step.title} className="flex flex-col gap-5 border-b border-[#e6eaf3] pb-10 last:border-0 sm:flex-row sm:items-start">
            <div className="landing-step-art shrink-0 sm:w-[180px]">
              <img src={step.image} alt="" className="landing-step-img max-h-[140px]" loading="lazy" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#09286f]">{step.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8 rounded-[16px] border border-[#e6eaf3] bg-[#f7f9fd] p-6 text-center">
        <p className="text-sm text-[#64748b]">
          See it on the home page with our interactive phone mockup, or{' '}
          <Link to="/register" className="font-semibold text-[#1d4ed8] hover:underline">
            start a free trial
          </Link>{' '}
          to run your first event.
        </p>
      </div>
    </MarketingContentLayout>
  );
}
