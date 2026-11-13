import { Outlet, useLocation, useParams } from 'react-router-dom';
import { GuestTopBar } from '@/components/guest/GuestTopBar';

export function GuestLayout() {
  const { pathname } = useLocation();
  const { eventToken } = useParams<{ eventToken: string }>();

  const isSelfie = pathname.endsWith('/selfie');
  const isGallery = pathname.endsWith('/gallery');
  const isConsent = pathname.endsWith('/consent');
  const isProcessing = pathname.endsWith('/processing');
  const isEventHome = eventToken && pathname === `/e/${eventToken}`;

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-background">
      {!isSelfie && !isEventHome && (
        <GuestTopBar
          backTo={
            isConsent
              ? `/e/${eventToken}`
              : isProcessing || isGallery
                ? `/e/${eventToken}/selfie`
                : undefined
          }
          backLabel={isGallery || isProcessing ? 'Selfie' : 'Back'}
          title={
            isGallery
              ? 'Your photos'
              : isConsent
                ? 'Privacy'
                : isProcessing
                  ? 'Matching'
                  : isEventHome
                    ? 'Event'
                    : undefined
          }
        />
      )}

      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
