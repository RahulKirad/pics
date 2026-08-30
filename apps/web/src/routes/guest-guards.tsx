import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useGuestStore } from '@/stores/guest-store';

export function GuestSessionGuard() {
  const { eventToken } = useParams<{ eventToken: string }>();
  const isSessionValid = useGuestStore((s) => s.isSessionValid);

  if (!eventToken || !isSessionValid(eventToken)) {
    return <Navigate to={`/e/${eventToken ?? ''}`} replace />;
  }

  return <Outlet />;
}

export function GuestConsentGuard() {
  const { eventToken } = useParams<{ eventToken: string }>();
  const hasConsent = useGuestStore((s) => s.hasConsent);
  const isSessionValid = useGuestStore((s) => s.isSessionValid);

  if (!eventToken || !isSessionValid(eventToken)) {
    return <Navigate to={`/e/${eventToken ?? ''}`} replace />;
  }

  if (!hasConsent) {
    return <Navigate to={`/e/${eventToken}/consent`} replace />;
  }

  return <Outlet />;
}
