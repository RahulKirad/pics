import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

interface AuthenticatedImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

export function AuthenticatedImage({ src, alt, className }: AuthenticatedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) {
      setObjectUrl(null);
      return;
    }

    let active = true;
    let blobUrl: string | null = null;

    api
      .get(src.replace('/api/v1', ''), { responseType: 'blob' })
      .then((response) => {
        if (!active) return;
        blobUrl = URL.createObjectURL(response.data);
        setObjectUrl(blobUrl);
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (!src || failed) {
    return (
      <div className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)}>
        <span className="text-xs">No preview</span>
      </div>
    );
  }

  if (!objectUrl) {
    return <div className={cn('animate-pulse bg-muted', className)} />;
  }

  return <img src={objectUrl} alt={alt} className={className} loading="lazy" />;
}
