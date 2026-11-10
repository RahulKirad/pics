import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { PicShareAssistant } from '@/components/chatbot/PicShareAssistant';
import { MarketingLayout } from '@/layouts/MarketingLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginPage, RegisterPage } from '@/pages/auth/AuthPages';
import { ProtectedRoute, GuestRoute } from '@/routes/guards';
import { DashboardHomePage } from '@/pages/dashboard/DashboardPages';
import { EventsPage } from '@/pages/events/EventsPage';
import { CreateEventPage } from '@/pages/events/CreateEventPage';
import { EventDashboardPage } from '@/pages/events/EventDashboardPage';
import { EventSettingsPage } from '@/pages/events/EventSettingsPage';
import { ProfilePage } from '@/pages/dashboard/ProfilePage';
import { GuestEventPage } from '@/pages/guest/GuestEventPage';
import { GuestConsentPage } from '@/pages/guest/GuestConsentPage';
import { GuestSelfiePage } from '@/pages/guest/GuestSelfiePage';
import { GuestProcessingPage } from '@/pages/guest/GuestPages';
import { GuestGalleryPage } from '@/pages/guest/GuestGalleryPage';
import { GuestConsentGuard, GuestSessionGuard } from '@/routes/guest-guards';
import { DebugPage } from '@/pages/debug/DebugPage';

const HomePage = lazy(() => import('@/pages/marketing/HomePage').then((m) => ({ default: m.HomePage })));
const FeaturesPage = lazy(() => import('@/pages/marketing/FeaturesPage').then((m) => ({ default: m.FeaturesPage })));
const HowItWorksMarketingPage = lazy(() =>
  import('@/pages/marketing/HowItWorksMarketingPage').then((m) => ({ default: m.HowItWorksMarketingPage })),
);
const IntegrationsPage = lazy(() => import('@/pages/marketing/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage })));
const FaqPage = lazy(() => import('@/pages/marketing/FaqPage').then((m) => ({ default: m.FaqPage })));
const ForPhotographersPage = lazy(() =>
  import('@/pages/marketing/ForPhotographersPage').then((m) => ({ default: m.ForPhotographersPage })),
);
const ContactPage = lazy(() => import('@/pages/marketing/ContactPage').then((m) => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import('@/pages/marketing/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('@/pages/marketing/TermsPage').then((m) => ({ default: m.TermsPage })));
const MarketingPage = lazy(() => import('@/pages/marketing/MarketingPage').then((m) => ({ default: m.MarketingPage })));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Skeleton className="h-8 w-48" />
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function AppShell() {
  return (
    <>
      <Outlet />
      <PicShareAssistant />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        element: <MarketingLayout />,
        children: [
          { path: '/', element: <LazyPage><HomePage /></LazyPage> },
          { path: '/features', element: <LazyPage><FeaturesPage /></LazyPage> },
          { path: '/how-it-works', element: <LazyPage><HowItWorksMarketingPage /></LazyPage> },
          { path: '/integrations', element: <LazyPage><IntegrationsPage /></LazyPage> },
          { path: '/for-photographers', element: <LazyPage><ForPhotographersPage /></LazyPage> },
          { path: '/pricing', element: <LazyPage><MarketingPage title="Pricing" description="Plans for every studio size, from solo photographers to large event teams." /></LazyPage> },
          { path: '/faq', element: <LazyPage><FaqPage /></LazyPage> },
          { path: '/contact', element: <LazyPage><ContactPage /></LazyPage> },
          { path: '/privacy', element: <LazyPage><PrivacyPage /></LazyPage> },
          { path: '/terms', element: <LazyPage><TermsPage /></LazyPage> },
        ],
      },
      { path: '/debug', element: <DebugPage /> },
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        path: '/dashboard',
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardHomePage /> },
              { path: 'events', element: <EventsPage /> },
              { path: 'events/new', element: <CreateEventPage /> },
              { path: 'events/:eventId', element: <EventDashboardPage /> },
              { path: 'events/:eventId/settings', element: <EventSettingsPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
      {
        path: '/e/:eventToken',
        element: <GuestLayout />,
        children: [
          { index: true, element: <GuestEventPage /> },
          {
            element: <GuestSessionGuard />,
            children: [{ path: 'consent', element: <GuestConsentPage /> }],
          },
          {
            element: <GuestConsentGuard />,
            children: [
              { path: 'selfie', element: <GuestSelfiePage /> },
              { path: 'processing', element: <GuestProcessingPage /> },
              { path: 'gallery', element: <GuestGalleryPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
