import { Link } from 'react-router-dom';

export function MarketingCta() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pb-16 md:pb-20">
      <div className="landing-cta-band flex flex-wrap items-center justify-between gap-6 rounded-[22px] px-8 py-10 text-white md:px-12">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Ready to share event photos the smart way?</h2>
          <p className="mt-2 max-w-md text-sm opacity-90">Start your free trial — no credit card required.</p>
        </div>
        <Link to="/register" className="inline-flex rounded-[10px] bg-white px-6 py-3 font-semibold text-[#0b2a8f] transition hover:scale-105">
          Start Free Trial
        </Link>
      </div>
    </section>
  );
}
