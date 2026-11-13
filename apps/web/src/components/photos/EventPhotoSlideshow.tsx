import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SlideshowPhoto = {
  id: string;
  src: string | null;
  title: string;
};

interface EventPhotoSlideshowProps {
  photos: SlideshowPhoto[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export function EventPhotoSlideshow({ photos, initialIndex, open, onClose }: EventPhotoSlideshowProps) {
  const [index, setIndex] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const goPrev = useCallback(() => {
    setIndex((current) => (current > 0 ? current - 1 : photos.length - 1));
  }, [photos.length]);

  const goNext = useCallback(() => {
    setIndex((current) => (current < photos.length - 1 ? current + 1 : 0));
  }, [photos.length]);

  const photo = photos[index];

  useEffect(() => {
    setLoaded(false);
  }, [index, photo?.src]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, goNext, goPrev, onClose]);

  return (
    <AnimatePresence>
      {open && photo ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex flex-col bg-black/95 safe-top safe-x"
          role="dialog"
          aria-modal="true"
          aria-label="Photo slideshow"
        >
          <header className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm text-white/80">
                {index + 1} / {photos.length}
              </p>
              <p className="truncate text-xs text-white/60" title={photo.title}>
                {photo.title}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-white hover:bg-white/10 hover:text-white"
              onClick={onClose}
              aria-label="Close slideshow"
            >
              <X className="h-5 w-5" />
            </Button>
          </header>

          <div className="relative flex flex-1 items-center justify-center px-2 pb-2 sm:px-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-1 z-10 text-white hover:bg-white/10 hover:text-white sm:left-3"
              onClick={goPrev}
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-9 w-9 sm:h-10 sm:w-10" />
            </Button>

            <motion.div
              key={photo.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex max-h-[calc(100vh-7rem)] w-full max-w-5xl items-center justify-center touch-pan-y"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.x > 60) goPrev();
                else if (info.offset.x < -60) goNext();
              }}
            >
              {photo.src ? (
                <img
                  src={photo.src}
                  alt={photo.title}
                  onLoad={() => setLoaded(true)}
                  className={`max-h-[calc(100vh-7rem)] max-w-full select-none object-contain transition-opacity duration-300 ${
                    loaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ) : (
                <p className="text-white/70">Preview unavailable</p>
              )}
            </motion.div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 z-10 text-white hover:bg-white/10 hover:text-white sm:right-3"
              onClick={goNext}
              aria-label="Next photo"
            >
              <ChevronRight className="h-9 w-9 sm:h-10 sm:w-10" />
            </Button>
          </div>

          <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-4 pt-1">
            {photos.map((thumb, i) => (
              <button
                key={thumb.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition ${
                  i === index ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                aria-label={`Go to photo ${i + 1}`}
              >
                {thumb.src ? (
                  <img src={thumb.src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-white/10 text-[8px] text-white">
                    —
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function photosToSlideshow(items: { id: string; originalName: string; previewUrl?: string | null; thumbnailUrl?: string | null }[]): SlideshowPhoto[] {
  return items.map((p) => ({
    id: p.id,
    title: p.originalName,
    src: p.previewUrl ?? p.thumbnailUrl ?? null,
  }));
}
