import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85',
    alt: 'Wedding celebration',
    label: 'WEDDING CELEBRATION',
  },
  {
    src: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=85',
    alt: 'Friends celebrating',
    label: 'CELEBRATION MOMENTS',
  },
  {
    src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=85',
    alt: 'Couple at wedding',
    label: 'THE WEDDING STORY',
  },
  {
    src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85',
    alt: 'Elegant event',
    label: 'GRAND GATHERINGS',
  },
  {
    src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=85',
    alt: 'Event details',
    label: 'THE LITTLE DETAILS',
  },
] as const;

const POS_STYLES: Record<
  number,
  { transform: string; opacity: number; zIndex: number; saturate: number; pointer: boolean }
> = {
  0: {
    transform: 'translate(-50%, -50%) translateX(0) rotateY(0deg) scale(1)',
    opacity: 1,
    zIndex: 5,
    saturate: 1,
    pointer: true,
  },
  1: {
    transform: 'translate(-50%, -50%) translateX(68%) rotateY(-10deg) scale(0.84)',
    opacity: 0.96,
    zIndex: 4,
    saturate: 0.88,
    pointer: false,
  },
  2: {
    transform: 'translate(-50%, -50%) translateX(137%) rotateY(-15deg) scale(0.68)',
    opacity: 0.88,
    zIndex: 3,
    saturate: 0.78,
    pointer: false,
  },
  3: {
    transform: 'translate(-50%, -50%) translateX(-68%) rotateY(10deg) scale(0.84)',
    opacity: 0.96,
    zIndex: 4,
    saturate: 0.88,
    pointer: false,
  },
  4: {
    transform: 'translate(-50%, -50%) translateX(-137%) rotateY(15deg) scale(0.68)',
    opacity: 0.88,
    zIndex: 3,
    saturate: 0.78,
    pointer: false,
  },
};

function slidePosition(index: number, active: number): number {
  return (index - active + SLIDES.length) % SLIDES.length;
}

export function LandingGalleryCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(0);

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 3200);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-[#fbfcff] to-[#f7f8fc] py-16 md:py-20"
      aria-label="Event photo gallery"
    >
      <div className="mx-auto max-w-[1180px] px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1d4ed8]">See the experience</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#09286f] md:text-4xl">
          Every guest. <span className="text-gradient">Every moment.</span>
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[#68728c]">
          Portrait-style galleries that feel personal, premium, and instant.
        </p>
      </div>

      <div
        className="landing-gallery-stage-drift relative mx-auto mt-10 flex h-[440px] max-w-[1180px] items-center justify-center px-4 md:h-[560px]"
        style={{ perspective: '1500px' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => {
          touchStart.current = e.changedTouches[0].screenX;
        }}
        onTouchEnd={(e) => {
          const delta = e.changedTouches[0].screenX - touchStart.current;
          if (Math.abs(delta) > 45) {
            if (delta < 0) next();
            else prev();
          }
        }}
      >
        <button
          type="button"
          aria-label="Previous"
          onClick={prev}
          className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5e9f2] bg-white shadow-md transition hover:border-[#123fae] hover:bg-[#123fae] hover:text-white md:left-6 md:h-14 md:w-14"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="relative h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
          {SLIDES.map((slide, index) => {
            const pos = slidePosition(index, active);
            const style = POS_STYLES[pos];
            const isCenter = pos === 0;

            return (
              <article
                key={slide.label}
                aria-hidden={!isCenter}
                className="landing-gallery-card absolute left-1/2 top-1/2 w-[66vw] max-w-[430px] overflow-hidden rounded-[28px] border border-white/80 bg-[#dfe5f2] shadow-xl md:w-[29vw]"
                style={{
                  height: 'min(560px, 70vh)',
                  opacity: style.opacity,
                  zIndex: style.zIndex,
                  transform: style.transform,
                  filter: `saturate(${style.saturate})`,
                  pointerEvents: style.pointer ? 'auto' : 'none',
                }}
              >
                <div className="landing-gallery-img-wrap">
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className={`landing-gallery-img delay-${index % 5}`}
                    loading="lazy"
                  />
                </div>
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 0%, rgba(8,13,30,.05) 22%, rgba(8,13,30,.78) 100%)',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 z-[2] flex flex-col items-center gap-3 px-4 pb-8 text-center text-xs font-extrabold tracking-[0.25em] text-white">
                  <span className="block h-px w-[76px] bg-white/80" />
                  {slide.label}
                </div>
              </article>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Next"
          onClick={next}
          className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5e9f2] bg-white shadow-md transition hover:border-[#123fae] hover:bg-[#123fae] hover:text-white md:right-6 md:h-14 md:w-14"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? 'w-6 bg-gradient-to-r from-[#123fae] to-[#e50078]' : 'w-2 bg-[#c8d0e3]'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
