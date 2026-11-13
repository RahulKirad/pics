import type { GuestMatchedPhoto } from '@/types/domain';
import { Heart } from 'lucide-react';
import { LazyGuestImage } from './LazyGuestImage';

interface GuestMasonryGridProps {
  photos: GuestMatchedPhoto[];
  onPhotoClick: (index: number) => void;
}

function getAspectRatio(photo: GuestMatchedPhoto): number {
  if (photo.width && photo.height && photo.height > 0) {
    return photo.width / photo.height;
  }
  return 1;
}

export function GuestMasonryGrid({ photos, onPhotoClick }: GuestMasonryGridProps) {
  return (
    <div className="columns-2 gap-2 p-2 pb-6 sm:columns-3 sm:pb-8 md:columns-4">
      {photos.map((photo, index) => {
        const aspectRatio = getAspectRatio(photo);
        return (
          <button
            key={photo.photoId}
            type="button"
            onClick={() => onPhotoClick(index)}
            className="mb-2 block w-full break-inside-avoid overflow-hidden rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ aspectRatio: `${aspectRatio}` }}
          >
            <div className="relative h-full w-full">
              <LazyGuestImage
                src={photo.thumbnailUrl ?? photo.previewUrl}
                className="h-full w-full"
              />
              <span className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                {Math.round((photo.similarity ?? photo.matchScore) * 100)}%
              </span>
              {photo.isFavorite && (
                <span className="absolute top-2 right-2 rounded-full bg-black/65 p-1.5 text-red-500 backdrop-blur-sm">
                  <Heart className="h-3.5 w-3.5 fill-current" />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function GuestMasonrySkeleton() {
  const heights = [1, 1.3, 0.8, 1.1, 1.4, 0.9, 1.2, 1];

  return (
    <div className="columns-2 gap-2 p-2 sm:columns-3 md:columns-4">
      {heights.map((ratio, i) => (
        <div
          key={i}
          className="mb-2 break-inside-avoid animate-pulse rounded-lg bg-muted"
          style={{ aspectRatio: ratio }}
        />
      ))}
    </div>
  );
}
