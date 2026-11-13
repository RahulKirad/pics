import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Camera, ImageIcon, MapPin, ScanFace } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { GuestEventCarousel } from '@/components/guest/GuestEventCarousel';
import { Skeleton } from '@/components/ui/skeleton';
import { guestService } from '@/services/guest';
import { getErrorMessage } from '@/services/api';
import { useGuestStore } from '@/stores/guest-store';
import '@/styles/guest-event-landing.css';

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
      <div className="guest-landing-page px-6 py-12">
        <Skeleton className="mx-auto mb-6 h-[84px] w-[84px] rounded-full" />
        <Skeleton className="mx-auto mb-3 h-4 w-32" />
        <Skeleton className="mx-auto mb-8 h-8 w-3/4 max-w-md" />
        <Skeleton className="mb-3 h-40 w-full max-w-sm mx-auto rounded-xl" />
        <Skeleton className="h-12 w-full max-w-md mx-auto rounded-md" />
      </div>
    );
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <div className="guest-landing-page flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
        <div className="guest-landing-camera mb-6">
          <Camera className="h-9 w-9 text-[#111]" strokeWidth={1.75} />
        </div>
        <h1 className="guest-landing-title">Event unavailable</h1>
        <p className="guest-landing-helper max-w-sm">
          {getErrorMessage(eventQuery.error) || 'This event link is invalid or no longer active.'}
        </p>
      </div>
    );
  }

  const event = eventQuery.data;
  const eventDate = formatEventDate(event.eventDate);
  const photoLabel =
    event.photoCount === 0
      ? 'Photos are being prepared'
      : `${event.photoCount.toLocaleString()} photo${event.photoCount === 1 ? '' : 's'} in gallery`;

  return (
    <div className="guest-landing-page flex min-h-dvh flex-col">
      <header className="guest-landing-header safe-top">
        <div className="guest-landing-logo">
          <BrandLogo linkToHome size="xs" />
        </div>
        <div className="guest-landing-camera" aria-hidden>
          <Camera className="h-[42px] w-[42px] text-[#111]" strokeWidth={1.75} />
        </div>
        <p className="guest-landing-studio">{event.businessName}</p>
        <motion.h1
          className="guest-landing-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {event.name}
        </motion.h1>
        <p className="guest-landing-count">
          <ImageIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          {photoLabel}
        </p>
        {(eventDate || event.location || event.description) && (
          <div className="guest-landing-meta">
            {event.description ? <p className="max-w-md mx-auto leading-snug">{event.description}</p> : null}
            {eventDate && (
              <p className="inline-flex items-center justify-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {eventDate}
              </p>
            )}
            {event.location && (
              <p className="inline-flex items-center justify-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </p>
            )}
          </div>
        )}
      </header>

      <GuestEventCarousel />

      <section className="guest-landing-bottom safe-bottom">
        <p className="guest-landing-helper">
          Find your photos instantly with a quick selfie. No account required — your face data is
          used only to match photos from this event.
        </p>
        <button
          type="button"
          className="guest-landing-primary"
          onClick={handleContinue}
          disabled={createSessionMutation.isPending}
        >
          <ScanFace className="h-5 w-5" strokeWidth={1.8} />
          {createSessionMutation.isPending ? 'Starting…' : 'Find My Photos'}
        </button>
        {actionError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {actionError}
          </p>
        )}
        <p className="guest-landing-privacy">
          By continuing, you will be asked to review and accept our privacy notice.
        </p>
      </section>
    </div>
  );
}
