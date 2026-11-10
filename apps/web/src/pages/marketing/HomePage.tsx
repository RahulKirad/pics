import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  ChartLine,
  CirclePlay,
  Globe,
  Heart,
  HeartHandshake,
  Images,
  LockKeyhole,
  Sparkles,
  Timer,
} from 'lucide-react';
import { LandingFeatureStrip } from '@/components/marketing/LandingFeatureStrip';
import { LandingGalleryCarousel } from '@/components/marketing/LandingGalleryCarousel';
import { LandingTestimonials } from '@/components/marketing/LandingTestimonials';
import '@/styles/landing.css';

const STEPS = [
  {
    image: '/how-it-works/upload.jpg',
    title: 'Upload Photos',
    text: 'Photographer uploads event photos to the cloud securely.',
  },
  {
    image: '/how-it-works/qr-scan.jpg',
    title: 'Scan & Share QR',
    text: 'Guests scan the event QR at the venue or from your digital invite.',
  },
  {
    image: '/how-it-works/selfie.jpg',
    title: 'Selfie & Find',
    text: 'Guests take a quick selfie; AI finds every photo they appear in.',
  },
  {
    image: '/how-it-works/download.jpg',
    title: 'Get Photos',
    text: 'Guests instantly view and download their photos in full quality.',
  },
] as const;

const WHY_ITEMS = [
  { icon: Timer, title: 'Save Time', text: 'Automate photo delivery and reduce manual work.' },
  { icon: HeartHandshake, title: 'Happy Clients', text: 'Instant access makes your clients love you.' },
  { icon: BadgeCheck, title: 'Grow Your Brand', text: 'Add your logo and create a branded experience.' },
  { icon: ChartLine, title: 'Analytics Insights', text: 'Track views, downloads, and guest engagement.' },
  { icon: Globe, title: 'Works Everywhere', text: 'Works on any device, anywhere in the world.' },
  { icon: LockKeyhole, title: 'Enterprise Security', text: 'Your photos are safe with enterprise-grade security.' },
] as const;

const RESOURCES = [
  {
    tag: 'Tips & Tricks',
    title: '5 Ways to Delight Your Wedding Clients with Instant Photos',
    date: 'May 12, 2024 · 5 min read',
    img: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=700&h=400&fit=crop',
  },
  {
    tag: 'Product',
    title: 'How AI Face Recognition Makes Photo Sharing Smarter',
    date: 'May 5, 2024 · 4 min read',
    img: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=700&h=400&fit=crop',
  },
  {
    tag: 'Business',
    title: 'Grow Your Photography Business with Better Client Experience',
    date: 'April 28, 2024 · 6 min read',
    img: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=700&h=400&fit=crop',
  },
] as const;

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, delay }}
    >
      {children}
    </motion.div>
  );
}

function TrustCounter() {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const target = 1000;
    let n = 0;
    const id = setInterval(() => {
      n += 25;
      setCount(Math.min(n, target));
      if (n >= target) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <span ref={ref}>
      <b>&nbsp;{count.toLocaleString()}+&nbsp;</b>
    </span>
  );
}

function HeroVisual() {
  const [findLabel, setFindLabel] = useState('Find My Photos');
  const containerRef = useRef<HTMLDivElement>(null);

  const onFindClick = () => {
    setFindLabel('Scanning face…');
    window.setTimeout(() => setFindLabel('24 photos found!'), 1400);
    window.setTimeout(() => setFindLabel('Find My Photos'), 4000);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.querySelectorAll<HTMLElement>('[data-parallax]').forEach((p, i) => {
      p.style.translate = `${x * (i + 1) * 18}px ${y * (i + 1) * 18}px`;
    });
  };

  const onMouseLeave = () => {
    containerRef.current?.querySelectorAll<HTMLElement>('[data-parallax]').forEach((p) => {
      p.style.translate = '0 0';
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative mx-auto h-[420px] w-full max-w-[460px] md:h-[540px] md:max-w-none"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className="landing-phone absolute left-[8%] top-0 w-[250px] rounded-[40px] bg-[#0f172a] p-2.5 shadow-2xl">
        <div className="relative flex h-full min-h-[500px] flex-col items-center gap-2.5 overflow-hidden rounded-[32px] bg-white px-5 pb-4 pt-9 text-center">
          <div className="absolute left-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-full bg-[#0f172a]" />
          <h4 className="text-[15px] font-semibold">Scan QR Code</h4>
          <small className="text-[11px] text-[#64748b]">from your photographer</small>
          <div className="landing-hero-qr relative mt-1" aria-hidden>
            <img src="/hero-qr.png" alt="" className="landing-hero-qr-img" width={120} height={120} decoding="async" />
            <motion.div
              className="landing-qr-scan absolute inset-x-1 z-10 h-0.5 bg-[#ec1c79] shadow-[0_0_10px_#ec1c79]"
            />
          </div>
          <span className="text-[11px] text-[#64748b]">— OR —</span>
          <h4 className="text-[15px] font-semibold">Take a Selfie</h4>
          <small className="text-[11px] text-[#64748b]">to find your photos</small>
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop"
            alt="Guest selfie preview"
            className="landing-selfie-ring h-24 w-24 rounded-full border-[3px] border-white object-cover"
          />
          <button
            type="button"
            onClick={onFindClick}
            className="mt-auto w-full rounded-[10px] bg-[#1d4ed8] py-2.5 text-sm font-semibold text-white"
          >
            {findLabel}
          </button>
        </div>
      </div>

      {[
        {
          layer: 'landing-hero-photo landing-hero-photo--couple',
          src: '/hero/photo-2.jpg',
          alt: 'Wedding couple smiling at their reception',
        },
        {
          layer: 'landing-hero-photo landing-hero-photo--group',
          src: '/hero/photo-3.jpg',
          alt: 'Guests celebrating together at a wedding',
        },
        {
          layer: 'landing-hero-photo landing-hero-photo--groom',
          src: '/hero/photo-1.jpg',
          alt: 'Groom portrait at an evening celebration',
        },
      ].map((photo) => (
        <div key={photo.src} data-parallax className={photo.layer}>
          <div className="landing-hero-photo-inner landing-photo-float">
            <img src={photo.src} alt={photo.alt} loading="lazy" />
          </div>
        </div>
      ))}

      <Sparkles className="pointer-events-none absolute left-[78%] top-[18%] h-5 w-5 text-sky-500" />
      <Sparkles className="pointer-events-none absolute left-[82%] top-[32%] h-5 w-5 text-sky-500 opacity-80" />
    </div>
  );
}

export function HomePage() {
  return (
    <div className="landing-page -mt-px bg-white">
      <header className="landing-hero-bg pb-10 pt-8 md:pb-12 md:pt-14">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1d4ed8]">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI-Powered Photo Sharing
                </span>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0b2a8f] sm:text-5xl lg:text-6xl">
                  Your Event Photos.
                  <br />
                  <span className="text-gradient">Instantly.</span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-4 max-w-md text-lg text-slate-600">
                  Upload your photos, share with QR, and let AI find every guest in every moment.
                </p>
              </Reveal>
              <Reveal delay={0.15} className="mt-5 flex flex-wrap gap-5 text-sm font-medium">
                {['AI Face Recognition', 'Instant Delivery', 'Secure & Private'].map((item) => (
                  <span key={item} className="landing-check">
                    {item}
                  </span>
                ))}
              </Reveal>
              <Reveal delay={0.15} className="mt-7 flex flex-wrap gap-3.5">
                <Link to="/register" className="landing-btn-primary">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how" className="landing-btn-outline">
                  <CirclePlay className="h-4 w-4" /> See How It Works
                </a>
              </Reveal>
              <Reveal delay={0.2} className="mt-7 flex items-center gap-3 text-sm text-[#64748b]">
                <div className="flex -space-x-2.5">
                  {[12, 32, 15, 47].map((n) => (
                    <img
                      key={n}
                      src={`https://i.pravatar.cc/80?img=${n}`}
                      alt=""
                      className="h-9 w-9 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                Trusted by
                <TrustCounter />
                Photographers Worldwide
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <HeroVisual />
            </Reveal>
          </div>

          <Reveal className="mt-8 block">
            <LandingFeatureStrip />
          </Reveal>
        </div>
      </header>

      <div id="features" className="scroll-mt-24" />
      <LandingGalleryCarousel />

      <section id="how" className="scroll-mt-24 py-16 md:py-20">
        <div className="mx-auto max-w-[1180px] px-6">
          <Reveal>
            <p className="text-center text-xs font-bold uppercase tracking-widest text-[#1d4ed8]">Four simple steps</p>
            <h2 className="mt-3 text-center text-3xl font-bold tracking-tight md:text-4xl">How It Works</h2>
            <p className="mx-auto mt-2 max-w-lg text-center text-sm text-[#68728c]">
              From upload to personalized gallery — built for photographers and effortless for guests.
            </p>
          </Reveal>
          <div className="landing-steps mt-11 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08}>
                <div className="landing-step-card relative rounded-[18px] border border-[#e6eaf3] bg-white px-5 pb-6 pt-5 text-center shadow-[var(--landing-shadow)] transition hover:-translate-y-2 hover:shadow-xl">
                  <span className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#0b2a8f] text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="landing-step-art mx-auto mb-3 mt-6">
                    <img src={step.image} alt="" className="landing-step-img" loading="lazy" decoding="async" />
                  </div>
                  <h4 className="text-[17px] font-semibold text-[#0f172a]">{step.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#64748b]">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fd] py-16 md:py-20">
        <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-6 lg:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1d4ed8]">
              <Heart className="h-3.5 w-3.5" />
              Why photographers love us
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0b2a8f] md:text-4xl">
              Built for Photographers.
              <br />
              Loved by Clients.
            </h2>
            <p className="mt-4 max-w-md text-slate-600">
              PicShareNow helps photographers deliver amazing experiences while saving time and growing their business.
            </p>
            <Link to="/features" className="landing-btn-primary mt-6 inline-flex">
              Explore All Features
            </Link>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {WHY_ITEMS.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <div className="flex gap-3.5 rounded-[14px] p-4 transition hover:bg-white hover:shadow-[var(--landing-shadow)]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e6eaf3] bg-white text-[#1d4ed8]">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <h5 className="text-[15px] font-semibold">{item.title}</h5>
                    <p className="text-[13px] text-[#64748b]">{item.text}</p>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <LandingTestimonials />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-[1180px] px-6 py-8"
      >
        <div className="landing-cta-band relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[22px] px-8 py-10 text-white md:px-12">
          <div className="absolute -left-20 -top-28 h-[300px] w-[300px] rounded-full bg-white/10" />
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15">
            <Images className="h-12 w-12" />
          </div>
          <div className="min-w-[240px] flex-1">
            <h3 className="text-2xl font-bold md:text-3xl">Ready to Delight Your Clients?</h3>
            <p className="mt-2 opacity-90">
              Join photographers who trust PicShareNow for instant, AI-powered photo delivery.
            </p>
          </div>
          <div className="text-center">
            <Link to="/register" className="inline-flex rounded-[10px] bg-white px-6 py-3 font-semibold text-[#0b2a8f] transition hover:scale-105">
              Start Your Free Trial
            </Link>
            <small className="mt-2 block opacity-85">No credit card required</small>
          </div>
        </div>
      </motion.div>

      <section id="resources" className="scroll-mt-24 py-16 md:py-20">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-bold md:text-3xl">Latest Resources</h2>
            <Link to="/faq" className="font-semibold text-[#1d4ed8]">
              View FAQ <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid gap-6 md:grid-cols-3">
            {RESOURCES.map((post, i) => (
              <Reveal key={post.title} delay={i * 0.08}>
                <article className="overflow-hidden rounded-2xl border border-[#e6eaf3] bg-white transition hover:-translate-y-1 hover:shadow-[var(--landing-shadow)]">
                  <div className="h-[190px] overflow-hidden">
                    <img
                      src={post.img}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <span className="rounded-md bg-[#eef2ff] px-2.5 py-0.5 text-xs font-bold text-[#1d4ed8]">
                      {post.tag}
                    </span>
                    <h4 className="mt-2.5 text-[17px] font-semibold leading-snug">{post.title}</h4>
                    <small className="text-[#64748b]">{post.date}</small>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
