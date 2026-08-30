import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar, HardDrive, Upload, Search, Download, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { EventCard } from '@/components/events/EventCard';
import { DailyBarChart } from '@/components/analytics/DailyBarChart';
import { eventsService } from '@/services/events';
import { analyticsService } from '@/services/analytics';
import { formatBytes, formatNumber } from '@/lib/format';

export function DashboardHomePage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsService.getOverview(),
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', { limit: 5 }],
    queryFn: () => eventsService.list({ limit: 5 }),
  });

  const recentEvents = eventsData?.items ?? [];
  const activeCount = stats?.activeEvents ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your photography business</p>
        </div>
        <Link to="/dashboard/events/new">
          <Button>
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Events', value: statsLoading ? '—' : formatNumber(stats?.totalEvents ?? 0), icon: Calendar },
          { label: 'Active Events', value: statsLoading ? '—' : formatNumber(activeCount), icon: Calendar },
          { label: 'Total Photos', value: statsLoading ? '—' : formatNumber(stats?.totalPhotos ?? 0), icon: Upload },
          { label: 'Storage Used', value: statsLoading ? '—' : formatBytes(stats?.storageBytes ?? 0), icon: HardDrive },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Guest Searches', value: statsLoading ? '—' : formatNumber(stats?.totalGuestSearches ?? 0), icon: Search },
          { label: 'Downloads', value: statsLoading ? '—' : formatNumber(stats?.totalDownloads ?? 0), icon: Download },
          { label: 'Guest Sessions', value: statsLoading ? '—' : formatNumber(stats?.totalGuestSessions ?? 0), icon: Calendar },
          { label: 'Favorites', value: statsLoading ? '—' : formatNumber(stats?.totalFavorites ?? 0), icon: Heart },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {statsLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : stats && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <DailyBarChart title="Guest searches (14 days)" data={stats.guestSearchesByDay} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <DailyBarChart title="Downloads (14 days)" data={stats.downloadsByDay} />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Events</CardTitle>
          <Link to="/dashboard/events" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {eventsLoading && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-32" />)}
            </div>
          )}
          {!eventsLoading && recentEvents.length === 0 && (
            <EmptyState
              title="No events yet"
              description="No events have been created yet."
              action={
                <Link to="/dashboard/events/new">
                  <Button>Create Event</Button>
                </Link>
              }
            />
          )}
          {recentEvents.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {recentEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
