import { GUEST_CAROUSEL_SLIDES } from '@/constants/guest-demo-carousel';
import type { GuestEventPreviewPhoto } from '@/services/guest';

type Slide = { src: string; label: string; alt: string };

function buildSlides(eventPhotos: GuestEventPreviewPhoto[]): Slide[] {
  if (eventPhotos.length > 0) {
    return eventPhotos.map((p) => ({
      src: p.url,
      label: p.label,
      alt: p.label,
    }));
  }
  return GUEST_CAROUSEL_SLIDES.map((s) => ({ src: s.src, label: s.label, alt: s.alt }));
}

export function GuestEventCarousel({ eventPhotos = [] }: { eventPhotos?: GuestEventPreviewPhoto[] }) {
  const base = buildSlides(eventPhotos);
  const loop = base.length > 0 ? [...base, ...base] : [];

  if (loop.length === 0) return null;

  return (
    <section className="guest-landing-carousel" aria-label="Event photo preview slideshow">
      <div className="guest-landing-track">
        {loop.map((slide, index) => (
          <div
            key={`${slide.src}-${index}`}
            className="guest-landing-photo"
            aria-hidden={index >= base.length ? true : undefined}
          >
            <img src={slide.src} alt={index < base.length ? slide.alt : ''} loading="lazy" decoding="async" />
            <span>{slide.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
