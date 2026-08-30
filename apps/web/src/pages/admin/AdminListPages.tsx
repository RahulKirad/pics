import { useQuery } from '@tanstack/react-query';
import { Building2, Calendar, CreditCard, HardDrive, Image, Receipt, ScrollText, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { adminService } from '@/services/admin';
import { formatBytes } from '@/lib/format';
import { formatCurrency } from '@/lib/razorpay';
import type {
  AdminBusinessRow,
  AdminEventRow,
  AdminPaymentRow,
  AdminPhotoRow,
  AdminStorageUsageRow,
  AdminSubscriptionRow,
  AdminUserRow,
  AdminAuditLogEntry,
} from '@photo-platform/shared-types';

function LoadingTable() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </CardContent>
    </Card>
  );
}

export function AdminBusinessesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-businesses'], queryFn: adminService.listBusinesses });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Businesses" description="All photographer businesses and tenants" icon={Building2} />
      {isLoading ? <LoadingTable /> : (
        <Card><CardContent className="pt-6">
          <AdminTable<AdminBusinessRow>
            getRowKey={(row) => row.id}
            rows={data ?? []}
            columns={[
              { key: 'name', header: 'Business', cell: (row) => <span className="font-medium">{row.name}</span> },
              { key: 'slug', header: 'Slug', cell: (row) => <span className="font-mono text-xs">{row.slug}</span> },
              { key: 'members', header: 'Members', cell: (row) => row.memberCount },
              { key: 'events', header: 'Events', cell: (row) => row.eventCount },
              { key: 'status', header: 'Status', cell: (row) => (
                <Badge variant={row.isActive ? 'success' : 'outline'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
              )},
              { key: 'created', header: 'Created', cell: (row) => new Date(row.createdAt).toLocaleDateString() },
            ]}
          />
        </CardContent></Card>
      )}
    </div>
  );
}

export function AdminUsersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: adminService.listUsers });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Users" description="All platform users across businesses" icon={Users} />
      {isLoading ? <LoadingTable /> : (
        <Card><CardContent className="pt-6">
          <AdminTable<AdminUserRow>
            getRowKey={(row) => row.id}
            rows={data ?? []}
            columns={[
              { key: 'name', header: 'Name', cell: (row) => `${row.firstName} ${row.lastName}` },
              { key: 'email', header: 'Email', cell: (row) => row.email },
              { key: 'role', header: 'Role', cell: (row) => <Badge variant="outline">{row.role}</Badge> },
              { key: 'businesses', header: 'Businesses', cell: (row) => row.businessCount },
              { key: 'verified', header: 'Verified', cell: (row) => row.emailVerified ? 'Yes' : 'No' },
              { key: 'lastLogin', header: 'Last login', cell: (row) => row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : '—' },
            ]}
          />
        </CardContent></Card>
      )}
    </div>
  );
}

export function AdminEventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => adminService.listEvents({ limit: 50 }),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Events" description="All events across the platform" icon={Calendar} />
      {isLoading ? <LoadingTable /> : (
        <Card><CardContent className="pt-6">
          <AdminTable<AdminEventRow>
            getRowKey={(row) => row.id}
            rows={data?.items ?? []}
            columns={[
              { key: 'name', header: 'Event', cell: (row) => <span className="font-medium">{row.name}</span> },
              { key: 'business', header: 'Business', cell: (row) => row.businessName },
              { key: 'status', header: 'Status', cell: (row) => <Badge variant="outline">{row.status}</Badge> },
              { key: 'photos', header: 'Photos', cell: (row) => row.photoCount },
              { key: 'searches', header: 'Searches', cell: (row) => row.guestSearchCount },
              { key: 'created', header: 'Created', cell: (row) => new Date(row.createdAt).toLocaleDateString() },
            ]}
          />
        </CardContent></Card>
      )}
    </div>
  );
}

export function AdminPhotosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-photos'],
    queryFn: () => adminService.listPhotos({ limit: 50 }),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Photos" description="Platform-wide photo processing status" icon={Image} />
      {isLoading ? <LoadingTable /> : (
        <Card><CardContent className="pt-6">
          <AdminTable<AdminPhotoRow>
            getRowKey={(row) => row.id}
            rows={data?.items ?? []}
            columns={[
              { key: 'name', header: 'File', cell: (row) => <span className="font-medium truncate max-w-[200px] block">{row.originalName}</span> },
              { key: 'event', header: 'Event', cell: (row) => row.eventName },
              { key: 'business', header: 'Business', cell: (row) => row.businessName },
              { key: 'status', header: 'Status', cell: (row) => <Badge variant="outline">{row.status}</Badge> },
              { key: 'size', header: 'Size', cell: (row) => formatBytes(row.fileSize) },
              { key: 'created', header: 'Uploaded', cell: (row) => new Date(row.createdAt).toLocaleDateString() },
            ]}
          />
        </CardContent></Card>
      )}
    </div>
  );
}

export function AdminStoragePage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-storage'], queryFn: adminService.listStorageUsage });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Storage Management" description="Storage usage per tenant" icon={HardDrive} />
      {isLoading ? <LoadingTable /> : (
        <Card><CardContent className="pt-6">
          <AdminTable<AdminStorageUsageRow>
            getRowKey={(row) => row.business.id}
            rows={data ?? []}
            emptyMessage="No storage usage records yet."
            columns={[
              { key: 'business', header: 'Business', cell: (row) => <span className="font-medium">{row.business.name}</span> },
              { key: 'total', header: 'Total', cell: (row) => formatBytes(row.totalBytes) },
              { key: 'originals', header: 'Originals', cell: (row) => formatBytes(row.originalBytes) },
              { key: 'previews', header: 'Previews', cell: (row) => formatBytes(row.previewBytes + row.thumbnailBytes) },
              { key: 'driver', header: 'Driver', cell: (row) => row.storageDriver?.toUpperCase() ?? '—' },
            ]}
          />
        </CardContent></Card>
      )}
    </div>
  );
}

export function AdminSubscriptionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => adminService.listSubscriptions({ limit: 50 }),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Subscriptions" description="Tenant subscription status and plans" icon={CreditCard} />
      {isLoading ? <LoadingTable /> : (
        <Card><CardContent className="pt-6">
          <AdminTable<AdminSubscriptionRow>
            getRowKey={(row) => row.id}
            rows={data?.items ?? []}
            columns={[
              { key: 'business', header: 'Business', cell: (row) => row.businessName },
              { key: 'plan', header: 'Plan', cell: (row) => `${row.planName} (${row.planTier})` },
              { key: 'status', header: 'Status', cell: (row) => <Badge variant="outline">{row.status}</Badge> },
              { key: 'period', header: 'Period end', cell: (row) => row.currentPeriodEnd ? new Date(row.currentPeriodEnd).toLocaleDateString() : '—' },
              { key: 'trial', header: 'Trial ends', cell: (row) => row.trialEndsAt ? new Date(row.trialEndsAt).toLocaleDateString() : '—' },
            ]}
          />
        </CardContent></Card>
      )}
    </div>
  );
}

export function AdminPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => adminService.listPayments({ limit: 50 }),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Payments" description="Razorpay transactions and payment records" icon={Receipt} />
      {isLoading ? <LoadingTable /> : (
        <Card><CardContent className="pt-6">
          <AdminTable<AdminPaymentRow>
            getRowKey={(row) => row.id}
            rows={data?.items ?? []}
            columns={[
              { key: 'business', header: 'Business', cell: (row) => row.businessName },
              { key: 'amount', header: 'Amount', cell: (row) => formatCurrency(row.amount, row.currency) },
              { key: 'status', header: 'Status', cell: (row) => <Badge variant="outline">{row.status}</Badge> },
              { key: 'method', header: 'Method', cell: (row) => row.method ?? '—' },
              { key: 'paymentId', header: 'Razorpay ID', cell: (row) => <span className="font-mono text-xs">{row.razorpayPayId ?? '—'}</span> },
              { key: 'created', header: 'Date', cell: (row) => new Date(row.createdAt).toLocaleString() },
            ]}
          />
        </CardContent></Card>
      )}
    </div>
  );
}

export function AdminAuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminService.listAuditLogs({ limit: 50 }),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Audit Logs" description="Sensitive operation audit trail" icon={ScrollText} />
      {isLoading ? <LoadingTable /> : (
        <Card><CardContent className="pt-6">
          <AdminTable<AdminAuditLogEntry>
            getRowKey={(row) => row.id}
            rows={data?.items ?? []}
            columns={[
              { key: 'action', header: 'Action', cell: (row) => <span className="font-medium">{row.action}</span> },
              { key: 'user', header: 'User', cell: (row) => row.user?.email ?? '—' },
              { key: 'business', header: 'Business', cell: (row) => row.business?.name ?? '—' },
              { key: 'entity', header: 'Entity', cell: (row) => row.entityType ? `${row.entityType}${row.entityId ? ` #${row.entityId.slice(0, 8)}` : ''}` : '—' },
              { key: 'ip', header: 'IP', cell: (row) => row.ipAddress ?? '—' },
              { key: 'time', header: 'Time', cell: (row) => new Date(row.createdAt).toLocaleString() },
            ]}
          />
        </CardContent></Card>
      )}
    </div>
  );
}
