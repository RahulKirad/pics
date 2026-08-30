import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Building2,
  Calendar,
  HardDrive,
  Image,
  Users,
  Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/services/admin';
import { formatBytes, formatNumber } from '@/lib/format';
import { formatCurrency } from '@/lib/razorpay';

function AdminStatCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && <p className="text-xs text-muted-foreground mt-1">{change}</p>}
      </CardContent>
    </Card>
  );
}

function serviceLabel(key: string) {
  const labels: Record<string, string> = {
    database: 'MySQL',
    redis: 'Redis',
    qdrant: 'Qdrant',
    aiService: 'AI Service',
    storage: 'Storage',
  };
  return labels[key] ?? key;
}

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: adminService.getOverview,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-muted-foreground">Failed to load platform overview.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Platform Overview</h1>
          <Badge variant={data.systemStatus === 'healthy' ? 'success' : 'outline'}>
            {data.systemStatus}
          </Badge>
        </div>
        <p className="text-muted-foreground">System-wide metrics and platform health monitoring</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Total Businesses" value={formatNumber(data.totalBusinesses)} icon={Building2} />
        <AdminStatCard title="Total Users" value={formatNumber(data.totalUsers)} icon={Users} />
        <AdminStatCard title="Active Events" value={formatNumber(data.activeEvents)} icon={Calendar} />
        <AdminStatCard title="Total Photos" value={formatNumber(data.totalPhotos)} icon={Image} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Storage Used" value={formatBytes(data.totalStorageBytes)} change="All tenants" icon={HardDrive} />
        <AdminStatCard title="Guest Searches (24h)" value={formatNumber(data.guestSearches24h)} icon={Activity} />
        <AdminStatCard title="Active Subscriptions" value={formatNumber(data.activeSubscriptions)} icon={Users} />
        <AdminStatCard title="Revenue" value={formatCurrency(data.totalRevenue)} icon={Brain} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit activity yet.</p>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{entry.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.user?.email ?? 'System'}
                        {entry.business ? ` · ${entry.business.name}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.services).map(([key, service]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{serviceLabel(key)}</span>
                  <Badge variant={service.status === 'healthy' ? 'success' : 'outline'}>
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
