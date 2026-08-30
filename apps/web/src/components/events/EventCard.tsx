import { Link } from 'react-router-dom';
import { Calendar, MapPin, Image, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EventStatusBadge } from './EventStatusBadge';
import type { EventSummary } from '@photo-platform/shared-types';

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Link to={`/dashboard/events/${event.id}`}>
      <Card className="transition-colors hover:bg-accent/50 h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold leading-tight line-clamp-2">{event.name}</h3>
            <EventStatusBadge status={event.status} />
          </div>

          {event.eventType && (
            <p className="text-sm text-muted-foreground mb-3">{event.eventType}</p>
          )}

          <div className="space-y-1.5 text-sm text-muted-foreground">
            {event.eventDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDate(event.eventDate)}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              <span>{event.photoCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{event.guestSearchCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
