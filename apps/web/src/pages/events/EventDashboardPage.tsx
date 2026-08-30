import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Image,
  Users,
  Download,
  Settings,
  QrCode,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { eventsService } from '@/services/events';
import { FolderSection } from '@/components/events/FolderSection';
import { UploadDrawer } from '@/components/uploads/UploadDrawer';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { QrCodeModal } from '@/components/events/QrCodeModal';
import { EventAnalyticsSection } from '@/components/analytics/EventAnalyticsSection';

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EventDashboardPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsService.getById(eventId!),
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Event not found</p>
        <Link to="/dashboard/events">
          <Button variant="outline">Back to events</Button>
        </Link>
      </div>
    );
  }

  const guestUrl = `${window.location.origin}/e/${event.eventToken}`;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/dashboard/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          All events
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{event.name}</h1>
              <EventStatusBadge status={event.status} />
            </div>
            {event.eventType && (
              <p className="text-muted-foreground">{event.eventType}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
            <Link to={`/dashboard/events/${event.id}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Photos', value: event.photoCount, icon: Image },
          { label: 'Faces detected', value: event.faceCount, icon: Users },
          { label: 'Guest searches', value: event.guestSearchCount, icon: Users },
          { label: 'Downloads', value: event.downloadCount, icon: Download },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground">Event date</p>
                <p className="font-medium">{formatDate(event.eventDate)}</p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Privacy</p>
              <p className="font-medium">{event.privacyMode.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gallery expires</p>
              <p className="font-medium">{formatDate(event.expiryDate)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Guest Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Share this link or QR code with event guests
            </p>
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono break-all">
              {guestUrl}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigator.clipboard.writeText(guestUrl)}
            >
              Copy link
            </Button>
          </CardContent>
        </Card>
      </div>

      <EventAnalyticsSection eventId={event.id} />

      <FolderSection eventId={event.id} />

      <PhotoGrid eventId={event.id} />

      <UploadDrawer
        eventId={event.id}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['event', eventId] });
          queryClient.invalidateQueries({ queryKey: ['event-photos', eventId] });
        }}
      />

      <QrCodeModal
        eventId={event.id}
        eventName={event.name}
        open={qrOpen}
        onClose={() => setQrOpen(false)}
      />
    </div>
  );
}
