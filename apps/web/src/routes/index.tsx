import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MarketingLayout } from '@/layouts/MarketingLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginPage, RegisterPage } from '@/pages/auth/AuthPages';
import { ProtectedRoute, AdminRoute, GuestRoute } from '@/routes/guards';
import { DashboardHomePage } from '@/pages/dashboard/DashboardPages';
import { SubscriptionPage } from '@/pages/dashboard/SubscriptionPage';
import { StoragePage } from '@/pages/dashboard/StoragePage';
import { EventsPage } from '@/pages/events/EventsPage';
import { CreateEventPage } from '@/pages/events/CreateEventPage';
import { EventDashboardPage } from '@/pages/events/EventDashboardPage';
import { EventSettingsPage } from '@/pages/events/EventSettingsPage';
import { ProfilePage } from '@/pages/dashboard/ProfilePage';
import {
  AdminDashboardPage,
  AdminBusinessesPage,
  AdminUsersPage,
  AdminEventsPage,
  AdminPhotosPage,
  AdminStoragePage,
  AdminSubscriptionsPage,
  AdminPaymentsPage,
  AdminAuditLogsPage,
  AdminSettingsPage,
  AdminPrivacyPage,
} from '@/pages/admin/AdminPages';
import { AdminAiProcessingPage } from '@/pages/admin/AdminAiProcessingPage';
import { GuestEventPage } from '@/pages/guest/GuestEventPage';
import { GuestConsentPage } from '@/pages/guest/GuestConsentPage';
import { GuestSelfiePage } from '@/pages/guest/GuestSelfiePage';
import { GuestProcessingPage } from '@/pages/guest/GuestPages';
import { GuestGalleryPage } from '@/pages/guest/GuestGalleryPage';
import { GuestConsentGuard, GuestSessionGuard } from '@/routes/guest-guards';

const HomePage = lazy(() => import('@/pages/marketing/HomePage').then((m) => ({ default: m.HomePage })));
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

export const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { path: '/', element: <LazyPage><HomePage /></LazyPage> },
      { path: '/features', element: <LazyPage><MarketingPage title="Features" description="Everything you need to deliver personalized photo galleries at scale." /></LazyPage> },
      { path: '/how-it-works', element: <LazyPage><MarketingPage title="How It Works" description="From upload to personalized gallery in four simple steps." /></LazyPage> },
      { path: '/for-photographers', element: <LazyPage><MarketingPage title="For Photographers" description="Built for professional photographers and event studios." /></LazyPage> },
      { path: '/pricing', element: <LazyPage><MarketingPage title="Pricing" description="Plans for every studio size, from solo photographers to large event teams." /></LazyPage> },
      { path: '/faq', element: <LazyPage><MarketingPage title="FAQ" description="Common questions about PhotoFlow." /></LazyPage> },
      { path: '/contact', element: <LazyPage><MarketingPage title="Contact" description="Get in touch with our team." /></LazyPage> },
    ],
  },
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
          { path: 'storage', element: <StoragePage /> },
          { path: 'subscription', element: <SubscriptionPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'businesses', element: <AdminBusinessesPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'events', element: <AdminEventsPage /> },
          { path: 'photos', element: <AdminPhotosPage /> },
          { path: 'storage', element: <AdminStoragePage /> },
          { path: 'ai-processing', element: <AdminAiProcessingPage /> },
          { path: 'subscriptions', element: <AdminSubscriptionsPage /> },
          { path: 'payments', element: <AdminPaymentsPage /> },
          { path: 'audit-logs', element: <AdminAuditLogsPage /> },
          { path: 'privacy', element: <AdminPrivacyPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
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
]);
