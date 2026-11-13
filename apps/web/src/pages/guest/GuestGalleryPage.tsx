import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Camera, ImageIcon, Share2, Trash2 } from 'lucide-react';
import { GuestMasonryGrid, GuestMasonrySkeleton } from '@/components/guest/GuestMasonryGrid';
import { GuestPhotoViewer } from '@/components/guest/GuestPhotoViewer';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { downloadGuestPhoto, shareGuestGallery } from '@/lib/guest-engagement';
import { guestService } from '@/services/guest';
import { getErrorMessage } from '@/services/api';
import { useGuestStore } from '@/stores/guest-store';

type GalleryFilter = 'all' | 'saved';

export function GuestGalleryPage() {
  const { eventToken } = useParams<{ eventToken: string }>();
  const sessionToken = useGuestStore((s) => s.sessionToken);
  const activeSearchId = useGuestStore((s) => s.activeSearchId);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const searchQuery = useQuery({
    queryKey: ['guest-search', sessionToken, activeSearchId],
    queryFn: () => guestService.getSearchResult(sessionToken!, activeSearchId!),
    enabled: Boolean(sessionToken && activeSearchId),
    staleTime: 60_000,
  });

  const favoriteMutation = useMutation({
    mutationFn: (photoId: string) => guestService.toggleFavorite(sessionToken!, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-search', sessionToken, activeSearchId] });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (photoId: string) => {
      const photo = searchQuery.data?.matches.find((item) => item.photoId === photoId);
      if (!photo) throw new Error('Photo not found');
      return downloadGuestPhoto(sessionToken!, photo);
    },
  });

  const deleteDataMutation = useMutation({
    mutationFn: () => guestService.deleteMyData(sessionToken!),
    onSuccess: () => {
      useGuestStore.getState().clear();
      window.location.href = `/e/${eventToken}`;
    },
  });

  const displayedPhotos = useMemo(() => {
    const matches = searchQuery.data?.matches ?? [];
    if (filter === 'saved') {
      return matches.filter((photo) => photo.isFavorite);
    }
    return matches;
  }, [filter, searchQuery.data?.matches]);

  const handleShare = async () => {
    const result = searchQuery.data;
    if (!result) return;
    try {
      const mode = await shareGuestGallery(result.eventName, result.shareUrl, `Find your photos from ${result.eventName}`);
      setShareMessage(mode === 'shared' ? 'Shared successfully' : 'Link copied to clipboard');
      window.setTimeout(() => setShareMessage(null), 2500);
    } catch {
      setShareMessage('Could not share right now');
      window.setTimeout(() => setShareMessage(null), 2500);
    }
  };

  if (!activeSearchId || !sessionToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-muted-foreground mb-4">No gallery session found.</p>
        <Link
          to={`/e/${eventToken}/selfie`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Take a selfie to find your photos
        </Link>
      </div>
    );
  }

  const result = searchQuery.data;
  const matches = result?.matches ?? [];
  const isLoading = searchQuery.isLoading || result?.status === 'pending';
  const savedCount = matches.filter((photo) => photo.isFavorite).length;

  return (
    <div className="min-h-dvh bg-background">
      <header className="z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-x">
        <div className="page-x py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? 'Loading your personalized gallery…'
                : matches.length > 0
                  ? `${matches.length} photo${matches.length === 1 ? '' : 's'} matched to you`
                  : 'No matching photos yet'}
            </p>
            {shareMessage && <p className="mt-1 text-xs text-primary">{shareMessage}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => void handleShare()}
              className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'h-10 w-10')}
              aria-label="Share gallery"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <Link
              to={`/e/${eventToken}/selfie`}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-10 gap-1.5 px-3')}
            >
              <Camera className="h-4 w-4 shrink-0" />
              <span className="hidden min-[400px]:inline">New selfie</span>
              <span className="min-[400px]:hidden">Selfie</span>
            </Link>
          </div>
        </div>

        {matches.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'rounded-full px-3 py-1 text-sm transition-colors',
                filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              All ({matches.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('saved')}
              className={cn(
                'rounded-full px-3 py-1 text-sm transition-colors',
                filter === 'saved' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              Saved ({savedCount})
            </button>
          </div>
        )}
        </div>
      </header>

      {isLoading ? (
        <GuestMasonrySkeleton />
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground max-w-sm mb-6">
            We couldn&apos;t find photos matching your selfie. Try again with better lighting or a
            clearer front-facing photo.
          </p>
          <Link to={`/e/${eventToken}/selfie`} className={buttonVariants()}>
            Take another selfie
          </Link>
        </div>
      ) : displayedPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <p className="text-muted-foreground mb-4">No saved photos yet.</p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            View all photos
          </button>
        </div>
      ) : (
        <GuestMasonryGrid
          photos={displayedPhotos}
          onPhotoClick={(index) => {
            const photo = displayedPhotos[index];
            const fullIndex = matches.findIndex((item) => item.photoId === photo?.photoId);
            setViewerIndex(fullIndex >= 0 ? fullIndex : index);
          }}
        />
      )}

      {(favoriteMutation.isError || downloadMutation.isError) && (
        <p className="px-4 pb-4 text-sm text-destructive">
          {getErrorMessage(favoriteMutation.error ?? downloadMutation.error)}
        </p>
      )}

      <AnimatePresence>
        {viewerIndex !== null && matches[viewerIndex] && (
          <GuestPhotoViewer
            photos={matches}
            initialIndex={viewerIndex}
            downloadEnabled={result?.downloadEnabled ?? false}
            onClose={() => setViewerIndex(null)}
            onToggleFavorite={(photoId) => favoriteMutation.mutate(photoId)}
            onDownload={(photo) => downloadMutation.mutate(photo.photoId)}
            onShare={() => void handleShare()}
            isFavoritePending={favoriteMutation.isPending}
            isDownloadPending={downloadMutation.isPending}
          />
        )}
      </AnimatePresence>

      <footer className="page-x py-8 pb-12 text-center safe-bottom">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          disabled={deleteDataMutation.isPending}
          onClick={() => {
            if (window.confirm('Delete your selfie and session data from this event?')) {
              deleteDataMutation.mutate();
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete my data
        </button>
      </footer>
    </div>
  );
}
