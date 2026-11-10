import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      'PicShareNow has completely changed the way I deliver event photos. My clients love the instant access!',
    name: 'Rahul Sharma',
    role: 'Wedding Photographer',
    img: 'https://i.pravatar.cc/100?img=13',
  },
  {
    quote:
      'The face recognition is incredibly accurate. Guests find their photos in seconds. Amazing platform!',
    name: 'Neha Patel',
    role: 'Event Photographer',
    img: 'https://i.pravatar.cc/100?img=45',
  },
  {
    quote:
      "It's fast, secure, and super easy to use. PicShareNow is now an essential part of my workflow.",
    name: 'Vikram Mehta',
    role: 'Professional Photographer',
    img: 'https://i.pravatar.cc/100?img=59',
  },
  {
    quote: 'Our corporate clients were blown away. Branded galleries made us look super professional.',
    name: 'Ananya Iyer',
    role: 'Corporate Events',
    img: 'https://i.pravatar.cc/100?img=26',
  },
  {
    quote: 'I used to spend days sending photos. Now it happens while the party is still going on!',
    name: 'Arjun Kapoor',
    role: 'Party Photographer',
    img: 'https://i.pravatar.cc/100?img=68',
  },
] as const;

export function LandingTestimonials() {
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(3);

  useEffect(() => {
    const update = () => setPerView(window.innerWidth <= 980 ? 1 : 3);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const pageCount = Math.max(1, TESTIMONIALS.length - perView + 1);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % pageCount);
    }, 5000);
    return () => clearInterval(id);
  }, [pageCount]);

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
          What Photographers Say
        </h2>
        <div className="mt-10 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
          >
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="shrink-0 px-2"
                style={{ flexBasis: `${100 / perView}%` }}
              >
                <div className="h-full rounded-[18px] border border-[#e6eaf3] bg-white p-7 shadow-[var(--landing-shadow)]">
                  <div className="flex gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="my-4 text-[#334155]">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={t.img}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                      loading="lazy"
                    />
                    <div>
                      <b className="block text-[15px]">{t.name}</b>
                      <span className="text-sm text-[#64748b]">{t.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Testimonial page ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? 'w-7 bg-[#1d4ed8]' : 'w-2.5 bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
