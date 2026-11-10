import type { ReactNode } from 'react';
import { MarketingCta } from '@/components/marketing/MarketingCta';
import '@/styles/landing.css';

type MarketingContentLayoutProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  showCta?: boolean;
  wide?: boolean;
};

export function MarketingContentLayout({
  eyebrow,
  title,
  description,
  children,
  showCta = true,
  wide = false,
}: MarketingContentLayoutProps) {
  return (
    <div className="landing-page -mt-px bg-white">
      <header className="landing-hero-bg border-b border-[#e6eaf3] pb-12 pt-10 md:pb-16 md:pt-14">
        <div className={`mx-auto px-6 text-center ${wide ? 'max-w-[1180px]' : 'max-w-[800px]'}`}>
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-widest text-[#1d4ed8]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#09286f] md:text-4xl">{title}</h1>
          {description ? <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#64748b]">{description}</p> : null}
        </div>
      </header>
      <div className={`mx-auto px-6 py-12 md:py-16 ${wide ? 'max-w-[1180px]' : 'max-w-[800px]'}`}>{children}</div>
      {showCta ? <MarketingCta /> : null}
    </div>
  );
}
