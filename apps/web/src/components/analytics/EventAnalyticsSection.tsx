import { useQuery } from '@tanstack/react-query';
import { Heart, Search, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyBarChart } from '@/components/analytics/DailyBarChart';
import { analyticsService } from '@/services/analytics';
import { formatNumber } from '@/lib/format';

interface EventAnalyticsSectionProps {
  eventId: string;
}

function formatSearchTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: 'pending' | 'complete' | 'failed') {
  if (status === 'complete') return 'Complete';
  if (status === 'failed') return 'Failed';
  return 'Pending';
}

export function EventAnalyticsSection({ eventId }: EventAnalyticsSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['event-analytics', eventId],
    queryFn: () => analyticsService.getEventAnalytics(eventId),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Guest engagement</h2>
        <p className="text-sm text-muted-foreground">Activity over the last 14 days</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Guest sessions', value: data.guestSessionCount, icon: Users },
          { label: 'Avg matches / search', value: data.averageMatchCount, icon: Search },
          { label: 'Favorites', value: data.favoriteCount, icon: Heart },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
                </div>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <DailyBarChart title="Guest searches" data={data.guestSearchesByDay} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <DailyBarChart title="Downloads" data={data.downloadsByDay} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent guest searches</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentSearches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No guest searches yet.</p>
          ) : (
            <div className="divide-y">
              {data.recentSearches.map((search) => (
                <div
                  key={search.id}
                  className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{formatSearchTime(search.createdAt)}</p>
                    <p className="text-muted-foreground">
                      {search.matchCount} matches
                      {search.processingMs !== null ? ` · ${search.processingMs}ms` : ''}
                    </p>
                  </div>
                  <span
                    className={
                      search.status === 'complete'
                        ? 'text-green-600'
                        : search.status === 'failed'
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                    }
                  >
                    {statusLabel(search.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
