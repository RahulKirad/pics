import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { guestService } from '@/services/guest';
import { useGuestStore } from '@/stores/guest-store';

export function GuestProcessingPage() {
  const { eventToken } = useParams<{ eventToken: string }>();
  const navigate = useNavigate();
  const sessionToken = useGuestStore((s) => s.sessionToken);
  const activeSearchId = useGuestStore((s) => s.activeSearchId);

  const searchQuery = useQuery({
    queryKey: ['guest-search', sessionToken, activeSearchId],
    queryFn: () => guestService.getSearchResult(sessionToken!, activeSearchId!),
    enabled: Boolean(sessionToken && activeSearchId),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2000 : false),
  });

  useEffect(() => {
    if (searchQuery.data?.status === 'completed') {
      navigate(`/e/${eventToken}/gallery`, { replace: true });
    }
  }, [searchQuery.data?.status, eventToken, navigate]);

  const statusMessage =
    searchQuery.data?.status === 'pending'
      ? 'Matching your selfie with the event gallery'
      : searchQuery.data?.status === 'failed'
        ? searchQuery.data.errorMessage ?? 'Something went wrong while matching your photos'
        : 'Preparing your search';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {searchQuery.data?.status === 'failed' ? (
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive text-xl">
          !
        </div>
      ) : (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent mb-6"
        />
      )}
      <h2 className="text-xl font-semibold mb-2">Finding your photos</h2>
      <p className="text-muted-foreground text-center max-w-xs mb-4">{statusMessage}</p>
      {searchQuery.data?.status === 'failed' && (
        <Link
          to={`/e/${eventToken}/selfie`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Try another selfie
        </Link>
      )}
      {!activeSearchId && (
        <Link
          to={`/e/${eventToken}/selfie`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Take a selfie first
        </Link>
      )}
    </div>
  );
}
