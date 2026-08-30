import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Brain, RefreshCw, ServerCrash } from 'lucide-react';
import type { QueueJobSummary, QueueStats } from '@photo-platform/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { queuesService } from '@/services/queues';
import { getErrorMessage } from '@/services/api';
import { cn } from '@/lib/utils';

function QueueStatsRow({ queue }: { queue: QueueStats }) {
  const hasBacklog = queue.waiting > 0 || queue.active > 0 || queue.failed > 0;

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{queue.name}</p>
          {queue.implemented ? (
            <Badge variant="success" className="text-[10px]">Live</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">Stub</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{queue.description}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={cn('rounded px-2 py-1 bg-muted', queue.waiting > 0 && 'bg-amber-100 text-amber-800 dark:bg-amber-900/30')}>
          Waiting: {queue.waiting}
        </span>
        <span className={cn('rounded px-2 py-1 bg-muted', queue.active > 0 && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30')}>
          Active: {queue.active}
        </span>
        <span className="rounded px-2 py-1 bg-muted">Done: {queue.completed}</span>
        <span className={cn('rounded px-2 py-1 bg-muted', queue.failed > 0 && 'bg-red-100 text-red-800 dark:bg-red-900/30')}>
          Failed: {queue.failed}
        </span>
        {hasBacklog && queue.delayed > 0 && (
          <span className="rounded px-2 py-1 bg-muted">Delayed: {queue.delayed}</span>
        )}
      </div>
    </div>
  );
}

function FailedJobRow({ job, onRetried }: { job: QueueJobSummary; onRetried: () => void }) {
  const retryMutation = useMutation({
    mutationFn: () => queuesService.retryJob(job.queue, job.id),
    onSuccess: onRetried,
  });

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">{job.name}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">{job.id}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Queue: {job.queue} · Attempts: {job.attemptsMade}/{job.maxAttempts}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={retryMutation.isPending}
          onClick={() => retryMutation.mutate()}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', retryMutation.isPending && 'animate-spin')} />
          Retry
        </Button>
      </div>
      {job.failedReason && (
        <p className="text-xs text-destructive bg-destructive/5 rounded p-2">{job.failedReason}</p>
      )}
      {retryMutation.isError && (
        <p className="text-xs text-destructive">{getErrorMessage(retryMutation.error)}</p>
      )}
      {typeof job.data.photoId === 'string' && (
        <p className="text-xs text-muted-foreground">Photo: {job.data.photoId}</p>
      )}
    </div>
  );
}

export function AdminAiProcessingPage() {
  const queryClient = useQueryClient();

  const { data: overview, isLoading, error } = useQuery({
    queryKey: ['admin-queues'],
    queryFn: () => queuesService.getOverview(),
    refetchInterval: 10_000,
  });

  const { data: failedJobs, isLoading: failedLoading } = useQuery({
    queryKey: ['admin-queues-failed', 'image-processing'],
    queryFn: () => queuesService.listJobs('image-processing', 'failed', 0, 19),
    enabled: !!overview?.redisConnected,
    refetchInterval: 10_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-queues'] });
    queryClient.invalidateQueries({ queryKey: ['admin-queues-failed'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="text-center py-16">
        <ServerCrash className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Failed to load queue status</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Job Queues</h1>
            <p className="text-muted-foreground">
              BullMQ queue status, retries, and processing observability
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Redis', value: overview.redisConnected ? 'Connected' : 'Disconnected' },
          { label: 'Waiting', value: overview.totals.waiting },
          { label: 'Active', value: overview.totals.active },
          { label: 'Completed', value: overview.totals.completed },
          { label: 'Failed', value: overview.totals.failed },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Queues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {overview.queues.map((queue) => (
            <QueueStatsRow key={queue.name} queue={queue} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Failed Jobs — image-processing</CardTitle>
        </CardHeader>
        <CardContent>
          {!overview.redisConnected ? (
            <p className="text-sm text-muted-foreground">Redis is not connected. Start Redis to view jobs.</p>
          ) : failedLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (failedJobs?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No failed jobs in the image-processing queue.</p>
          ) : (
            <div className="space-y-3">
              {failedJobs?.map((job) => (
                <FailedJobRow key={job.id} job={job} onRetried={refresh} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
