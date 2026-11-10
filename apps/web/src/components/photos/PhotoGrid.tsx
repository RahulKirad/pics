import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import type { PhotoSummary } from '@/types/domain';
import { PhotoStatus } from '@/types/domain';
import { photosService } from '@/services/photos';
import { AuthenticatedImage } from './AuthenticatedImage';
import { PhotoStatusBadge } from './PhotoStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/services/api';

interface PhotoGridProps {
  eventId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PhotoCard({ photo, eventId }: { photo: PhotoSummary; eventId: string }) {
  const queryClient = useQueryClient();

  const retryMutation = useMutation({
    mutationFn: () => photosService.retryProcessing(photo.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-photos', eventId] });
    },
  });

  const isProcessing = photo.status === PhotoStatus.PROCESSING || photo.status === PhotoStatus.UPLOADING;

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <div className="aspect-square relative">
        <AuthenticatedImage
          src={photo.thumbnailUrl ?? photo.previewUrl}
          alt={photo.originalName}
          className="h-full w-full object-cover"
        />
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <PhotoStatusBadge status={photo.status} />
        </div>
      </div>
      <div className="p-2 space-y-1">
        <p className="text-xs font-medium truncate" title={photo.originalName}>
          {photo.originalName}
        </p>
        <p className="text-xs text-muted-foreground">
          {photo.width && photo.height ? `${photo.width}×${photo.height}` : '—'} · {formatFileSize(photo.fileSize)}
        </p>
        {photo.status === PhotoStatus.FAILED && (
          <div className="space-y-1">
            {photo.processingError && (
              <p className="text-xs text-destructive line-clamp-2">{photo.processingError}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
              disabled={retryMutation.isPending}
              onClick={() => retryMutation.mutate()}
            >
              <RefreshCw className={retryMutation.isPending ? 'animate-spin' : ''} />
              Retry processing
            </Button>
            {retryMutation.isError && (
              <p className="text-xs text-destructive">{getErrorMessage(retryMutation.error)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PhotoGrid({ eventId }: PhotoGridProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['event-photos', eventId],
    queryFn: () => photosService.listByEvent(eventId),
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const hasProcessing = items.some(
        (p) => p.status === PhotoStatus.PROCESSING || p.status === PhotoStatus.UPLOADING,
      );
      return hasProcessing ? 3000 : false;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Failed to load photos
        </CardContent>
      </Card>
    );
  }

  const photos = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Photos ({photos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No photos yet. Upload photos to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} eventId={eventId} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
