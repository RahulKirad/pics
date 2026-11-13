import { GUEST_CAROUSEL_SLIDES } from '@/constants/guest-demo-carousel';

export function GuestEventCarousel() {
  const loop = [...GUEST_CAROUSEL_SLIDES, ...GUEST_CAROUSEL_SLIDES];

  return (
    <section className="guest-landing-carousel" aria-label="Event photo preview slideshow">
      <div className="guest-landing-track">
        {loop.map((slide, index) => (
          <div
            key={`${slide.src}-${index}`}
            className="guest-landing-photo"
            aria-hidden={index >= GUEST_CAROUSEL_SLIDES.length ? true : undefined}
          >
            <img src={slide.src} alt={index < GUEST_CAROUSEL_SLIDES.length ? slide.alt : ''} loading="lazy" />
            <span>{slide.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
