import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Loader2, Users, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AuthenticatedImage } from '@/components/photos/AuthenticatedImage';
import type { FaceClusterSummary } from '@/lib/face/face-clusters';
import { facesService } from '@/services/faces';
import type { PhotoSummary } from '@/types/domain';
import { EventPhotoSlideshow, photosToSlideshow } from '@/components/photos/EventPhotoSlideshow';

interface FacesExplorerModalProps {
  eventId: string;
  faceCount: number;
  open: boolean;
  onClose: () => void;
}

export function FacesExplorerModal({ eventId, faceCount, open, onClose }: FacesExplorerModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'people' | 'photos'>('people');
  const [selected, setSelected] = useState<FaceClusterSummary | null>(null);
  const [clusterPhotos, setClusterPhotos] = useState<PhotoSummary[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ done: 0, total: 0 });
  const [slideshowIndex, setSlideshowIndex] = useState<number | null>(null);

  const { data: clusters = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['event-face-clusters', eventId],
    queryFn: () => facesService.getClusters(eventId),
    enabled: open,
  });

  const runRebuild = useCallback(async () => {
    setScanning(true);
    try {
      await facesService.rebuildEventIndex(eventId, (done, total) => {
        setScanProgress({ done, total });
      });
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    } finally {
      setScanning(false);
      setScanProgress({ done: 0, total: 0 });
    }
  }, [eventId, queryClient, refetch]);

  useEffect(() => {
    if (!open) return;
    setStep('people');
    setSelected(null);
    setClusterPhotos([]);
    setSlideshowIndex(null);
    if (faceCount > 0 && clusters.length === 0 && !isLoading && !isFetching && !scanning) {
      void runRebuild();
    }
  }, [open, faceCount, clusters.length, isLoading, isFetching, scanning, runRebuild]);

  const openCluster = async (cluster: FaceClusterSummary) => {
    setSelected(cluster);
    setStep('photos');
    setLoadingPhotos(true);
    try {
      const photos = await facesService.getPhotosForCluster(
        eventId,
        cluster.clusterId,
        cluster.photoIds,
      );
      setClusterPhotos(photos);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const uniquePeople = clusters.length;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-xl border bg-background shadow-xl sm:max-h-[min(90dvh,720px)] sm:rounded-xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div layout className="flex items-start justify-between gap-2 border-b px-4 py-3">
              <div className="min-w-0 pr-8">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  {step === 'people' ? (
                    <>
                      <Users className="h-5 w-5 shrink-0" />
                      People in this event
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="mr-1 rounded-md p-1 hover:bg-muted"
                        onClick={() => setStep('people')}
                        aria-label="Back to all people"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      {selected?.label ?? 'Photos'}
                    </>
                  )}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step === 'people'
                    ? `${faceCount} face detections · ${uniquePeople} unique ${uniquePeople === 1 ? 'person' : 'people'}`
                    : `${loadingPhotos ? selected?.photoIds.length ?? 0 : clusterPhotos.length} photos with this person`}
                </p>
              </div>
              <button
                type="button"
                className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>

            <div className="flex-1 overflow-y-auto p-4">
              {(isLoading || scanning) && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  {scanning && scanProgress.total > 0
                    ? `Scanning photos… ${scanProgress.done}/${scanProgress.total}`
                    : 'Loading faces…'}
                </div>
              )}

              {!isLoading && !scanning && step === 'people' && (
                <>
                  {clusters.length === 0 ? (
                    <div className="space-y-3 py-8 text-center text-sm">
                      <p className="text-muted-foreground">No face crops yet.</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => void runRebuild()}>
                        Scan photos for faces
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                      {clusters.map((cluster) => (
                        <button
                          key={cluster.clusterId}
                          type="button"
                          className="group flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted/60"
                          onClick={() => void openCluster(cluster)}
                        >
                          <span className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-border ring-2 ring-transparent transition group-hover:ring-primary/30 sm:h-20 sm:w-20">
                            <img
                              src={cluster.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </span>
                          <span className="text-xs font-medium">{cluster.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {cluster.photoIds.length} photo{cluster.photoIds.length === 1 ? '' : 's'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {!isLoading && !scanning && step === 'photos' && (
                <>
                  {loadingPhotos ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : clusterPhotos.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No photos found for this person.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {clusterPhotos.map((photo, index) => (
                        <button
                          key={photo.id}
                          type="button"
                          className="overflow-hidden rounded-lg border text-left transition hover:border-primary hover:shadow-sm"
                          onClick={() => setSlideshowIndex(index)}
                        >
                          <div className="aspect-square cursor-zoom-in">
                            <AuthenticatedImage
                              src={photo.thumbnailUrl ?? photo.previewUrl}
                              alt={photo.originalName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="truncate p-1.5 text-[10px] font-medium" title={photo.originalName}>
                            {photo.originalName}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          <EventPhotoSlideshow
            photos={photosToSlideshow(clusterPhotos)}
            initialIndex={slideshowIndex ?? 0}
            open={slideshowIndex !== null && step === 'photos'}
            onClose={() => setSlideshowIndex(null)}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
