import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AuthenticatedImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

export function AuthenticatedImage({ src, alt, className }: AuthenticatedImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)}>
        <span className="text-xs">No preview</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
