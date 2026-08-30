import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Camera, ImageIcon, MapPin, ScanFace } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { guestService } from '@/services/guest';
import { getErrorMessage } from '@/services/api';
import { useGuestStore } from '@/stores/guest-store';

function formatEventDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function GuestEventPage() {
  const { eventToken } = useParams<{ eventToken: string }>();
  const navigate = useNavigate();
  const setSession = useGuestStore((s) => s.setSession);
  const isSessionValid = useGuestStore((s) => s.isSessionValid);
  const hasConsent = useGuestStore((s) => s.hasConsent);
  const [actionError, setActionError] = useState<string | null>(null);

  const eventQuery = useQuery({
    queryKey: ['guest-event', eventToken],
    queryFn: () => guestService.getEvent(eventToken!),
    enabled: Boolean(eventToken),
    retry: false,
  });

  const createSessionMutation = useMutation({
    mutationFn: () => guestService.createSession(eventToken!),
    onSuccess: (session) => {
      setSession(session);
      navigate(`/e/${eventToken}/consent`);
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const handleContinue = () => {
    setActionError(null);
    if (!eventToken) return;

    if (isSessionValid(eventToken)) {
      navigate(hasConsent ? `/e/${eventToken}/selfie` : `/e/${eventToken}/consent`);
      return;
    }

    createSessionMutation.mutate();
  };

  if (eventQuery.isLoading) {
    return (
      <div className="flex min-h-screen flex-col px-4 py-10">
        <div className="mx-auto w-full max-w-md space-y-4">
          <Skeleton className="mx-auto h-20 w-20 rounded-full" />
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6 mx-auto" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Camera className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Event unavailable</h1>
        <p className="text-muted-foreground max-w-sm">
          {getErrorMessage(eventQuery.error) || 'This event link is invalid or no longer active.'}
        </p>
      </div>
    );
  }

  const event = eventQuery.data;
  const eventDate = formatEventDate(event.eventDate);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative overflow-hidden bg-gradient-to-b from-muted/80 to-background px-4 pb-8 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-md text-center"
        >
          <div className="mb-6 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
            <Camera className="h-10 w-10 text-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-2">{event.businessName}</p>
          <h1 className="text-3xl font-bold tracking-tight mb-3">{event.name}</h1>
          {event.description && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">{event.description}</p>
          )}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {eventDate && (
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{eventDate}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <ImageIcon className="h-4 w-4 shrink-0" />
              <span>
                {event.photoCount === 0
                  ? 'Photos are being prepared'
                  : `${event.photoCount.toLocaleString()} photos in gallery`}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col justify-end px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto w-full max-w-md"
        >
          <p className="text-center text-muted-foreground mb-6 text-sm leading-relaxed">
            Find your photos instantly with a quick selfie. No account required — your face data is
            used only to match photos from this event.
          </p>
          <Button
            className="w-full h-12 text-base"
            onClick={handleContinue}
            disabled={createSessionMutation.isPending}
          >
            <ScanFace className="h-5 w-5" />
            {createSessionMutation.isPending ? 'Starting…' : 'Find My Photos'}
          </Button>
          {actionError && <p className="mt-3 text-center text-sm text-destructive">{actionError}</p>}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you will be asked to review and accept our privacy notice.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
