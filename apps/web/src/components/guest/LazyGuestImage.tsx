import { useState } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLazyVisible } from '@/hooks/use-lazy-visible';

interface LazyGuestImageProps {
  src: string | null;
  alt?: string;
  className?: string;
  onLoad?: () => void;
}

export function LazyGuestImage({ src, alt = '', className, onLoad }: LazyGuestImageProps) {
  const { ref, visible } = useLazyVisible();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  return (
    <div ref={ref} className={cn('relative overflow-hidden bg-muted', className)}>
      {!src || failed ? (
        <div className="flex h-full min-h-[120px] w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="h-8 w-8" />
        </div>
      ) : (
        <>
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {visible && (
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              onLoad={handleLoad}
              onError={() => setFailed(true)}
              className={cn(
                'h-full w-full object-cover transition-opacity duration-300',
                loaded ? 'opacity-100' : 'opacity-0',
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
