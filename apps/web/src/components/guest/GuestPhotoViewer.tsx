import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Heart, Share2, X } from 'lucide-react';
import type { GuestMatchedPhoto } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GuestPhotoViewerProps {
  photos: GuestMatchedPhoto[];
  initialIndex: number;
  downloadEnabled: boolean;
  onClose: () => void;
  onToggleFavorite: (photoId: string) => void;
  onDownload: (photo: GuestMatchedPhoto) => void;
  onShare: () => void;
  isFavoritePending?: boolean;
  isDownloadPending?: boolean;
}

export function GuestPhotoViewer({
  photos,
  initialIndex,
  downloadEnabled,
  onClose,
  onToggleFavorite,
  onDownload,
  onShare,
  isFavoritePending,
  isDownloadPending,
}: GuestPhotoViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);
  const photo = photos[index];

  const goPrev = useCallback(() => {
    setIndex((current) => (current > 0 ? current - 1 : photos.length - 1));
  }, [photos.length]);

  const goNext = useCallback(() => {
    setIndex((current) => (current < photos.length - 1 ? current + 1 : 0));
  }, [photos.length]);

  useEffect(() => {
    setLoaded(false);
  }, [index]);

  useEffect(() => {
    const adjacent = [photos[index - 1], photos[index + 1]].filter(Boolean);
    for (const item of adjacent) {
      if (!item?.viewerUrl) continue;
      const img = new Image();
      img.src = item.viewerUrl;
    }
  }, [index, photos]);

  useEffect(() => {
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
  }, [goNext, goPrev, onClose]);

  if (!photo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 safe-top safe-x sm:px-4">
        <p className="text-sm text-white/80">
          {index + 1} / {photos.length}
        </p>
        <div className="flex max-w-full flex-wrap items-center justify-end gap-1 sm:gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
            {Math.round((photo.similarity ?? photo.matchScore) * 100)}% match
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => onToggleFavorite(photo.photoId)}
            disabled={isFavoritePending}
            aria-label={photo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={cn('h-5 w-5', photo.isFavorite ? 'fill-red-500 text-red-500' : '')}
            />
          </Button>
          {downloadEnabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => onDownload(photo)}
              disabled={isDownloadPending}
              aria-label="Download photo"
            >
              <Download className="h-5 w-5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={onShare}
            aria-label="Share gallery"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={onClose}
            aria-label="Close viewer"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-2 z-10 hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
          onClick={goPrev}
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>

        <AnimatePresence mode="wait">
          <motion.div
            key={photo.photoId}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex max-h-full max-w-full items-center justify-center"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80) goPrev();
              else if (info.offset.x < -80) goNext();
            }}
          >
            {photo.viewerUrl ? (
              <img
                src={photo.viewerUrl}
                alt=""
                onLoad={() => setLoaded(true)}
                className={`max-h-[calc(100vh-8rem)] max-w-full object-contain transition-opacity duration-300 ${
                  loaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : (
              <p className="text-white/70">Image unavailable</p>
            )}
          </motion.div>
        </AnimatePresence>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 z-10 hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
          onClick={goNext}
          aria-label="Next photo"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4 px-4 pb-6 safe-bottom sm:hidden">
        <Button type="button" variant="secondary" size="sm" onClick={goPrev} aria-label="Previous photo">
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={goNext} aria-label="Next photo">
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
