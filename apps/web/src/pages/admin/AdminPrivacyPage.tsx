import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { adminService } from '@/services/admin';

export function AdminPrivacyPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-privacy-settings'],
    queryFn: adminService.getPrivacySettings,
  });

  const { data: securityAudit, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-security-audit'],
    queryFn: adminService.getSecurityAudit,
  });

  const saveMutation = useMutation({
    mutationFn: adminService.updatePrivacySettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-privacy-settings'] }),
  });

  const cleanupMutation = useMutation({
    mutationFn: adminService.runCleanup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-overview'] }),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Privacy & Security"
        description="Retention policies, cleanup jobs, and security posture"
        icon={Shield}
      />

      {isLoading ? (
        <Skeleton className="h-48 max-w-2xl" />
      ) : settings && (
        <Card className="max-w-2xl">
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-base font-semibold">Retention policies</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Guest session retention (days)</span>
                <input
                  type="number"
                  className="w-full rounded-md border bg-background px-3 py-2"
                  defaultValue={settings.guestSessionRetentionDays}
                  id="guestSessionRetentionDays"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Guest selfie retention (days)</span>
                <input
                  type="number"
                  className="w-full rounded-md border bg-background px-3 py-2"
                  defaultValue={settings.guestSelfieRetentionDays}
                  id="guestSelfieRetentionDays"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked={settings.autoExpireEvents} id="autoExpireEvents" />
              Automatically mark events as expired when past expiry date
            </label>
            <Button
              onClick={() => {
                const guestSessionRetentionDays = Number(
                  (document.getElementById('guestSessionRetentionDays') as HTMLInputElement).value,
                );
                const guestSelfieRetentionDays = Number(
                  (document.getElementById('guestSelfieRetentionDays') as HTMLInputElement).value,
                );
                const autoExpireEvents = (document.getElementById('autoExpireEvents') as HTMLInputElement).checked;
                saveMutation.mutate({ guestSessionRetentionDays, guestSelfieRetentionDays, autoExpireEvents });
              }}
              disabled={saveMutation.isPending}
            >
              Save retention settings
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="max-w-2xl">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Data cleanup</h2>
              <p className="text-sm text-muted-foreground">
                Purge expired guest sessions, old selfies, and expired events
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Run now
            </Button>
          </div>
          {cleanupMutation.data && (
            <p className="text-sm text-muted-foreground">
              Last run: {cleanupMutation.data.expiredEvents} events expired, {cleanupMutation.data.deletedSessions} sessions removed, {cleanupMutation.data.deletedSelfies} selfies deleted.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Security audit</h2>
            {securityAudit && (
              <Badge variant={securityAudit.overallStatus === 'pass' ? 'success' : 'outline'}>
                {securityAudit.overallStatus}
              </Badge>
            )}
          </div>
          {auditLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="space-y-2">
              {securityAudit?.findings.map((finding) => (
                <div key={finding.id} className="flex items-start justify-between gap-3 border-b py-2 last:border-0 text-sm">
                  <span className={finding.passed ? 'text-foreground' : 'text-destructive'}>{finding.message}</span>
                  <Badge variant="outline">{finding.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
