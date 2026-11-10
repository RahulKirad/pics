import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import type { PhotoSummary } from '@photo-platform/shared-types';
import { eventsService } from '@/services/events';
import { photosService } from '@/services/photos';
import { AuthenticatedImage } from '@/components/photos/AuthenticatedImage';

interface EventPhotoPickerProps {
  onClose: () => void;
  onSelect: (photo: PhotoSummary) => void;
}

export function EventPhotoPicker({ onClose, onSelect }: EventPhotoPickerProps) {
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', 'chatbot-picker'],
    queryFn: () => eventsService.list({ limit: 20 }),
  });

  const [eventId, setEventId] = useState<string | null>(null);
  const activeEventId = eventId ?? events?.items[0]?.id ?? null;

  const { data: photos, isLoading: photosLoading } = useQuery({
    queryKey: ['event-photos', activeEventId, 'chatbot-picker'],
    queryFn: () => photosService.listByEvent(activeEventId!),
    enabled: !!activeEventId,
  });

  return (
    <div className="picshare-assistant-picker" role="dialog" aria-label="Choose event photo">
      <div className="picshare-assistant-picker-sheet">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#0f172a]">Choose an event photo</h3>
          <button type="button" className="picshare-assistant-icon-btn" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {eventsLoading ? (
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading events…
          </div>
        ) : !events?.items.length ? (
          <p className="text-sm text-[#64748b]">Create an event and upload photos first, then come back here.</p>
        ) : (
          <>
            <label className="block text-xs text-[#64748b] mb-2">
              Event
              <select
                className="mt-1 w-full rounded-lg border border-[#e6eaf3] px-2 py-1.5 text-sm text-[#0f172a]"
                value={activeEventId ?? ''}
                onChange={(e) => setEventId(e.target.value)}
              >
                {events.items.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </label>
            {photosLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#64748b]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading photos…
              </div>
            ) : !photos?.items.length ? (
              <p className="text-sm text-[#64748b]">No photos in this event yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.items.slice(0, 12).map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="overflow-hidden rounded-lg border border-[#e6eaf3] hover:ring-2 hover:ring-[#3b82f6]"
                    onClick={() => onSelect(photo)}
                  >
                    <AuthenticatedImage
                      src={photo.thumbnailUrl ?? photo.previewUrl}
                      alt={photo.originalName}
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
