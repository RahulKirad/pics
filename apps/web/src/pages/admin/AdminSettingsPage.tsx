import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings } from 'lucide-react';
import { storageSettingsSchema, type StorageSettingsInput } from '@photo-platform/validation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { adminService } from '@/services/admin';

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-storage-settings'],
    queryFn: adminService.getStorageSettings,
  });

  const form = useForm<StorageSettingsInput>({
    resolver: zodResolver(storageSettingsSchema),
    values: data,
  });

  const mutation = useMutation({
    mutationFn: adminService.updateStorageSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-storage-settings'] });
    },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System Settings"
        description="Storage provider configuration and platform limits"
        icon={Settings}
      />

      {isLoading ? (
        <Skeleton className="h-96 max-w-2xl" />
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Storage provider</span>
                  <select className="w-full rounded-md border bg-background px-3 py-2" {...form.register('provider')}>
                    <option value="vps">VPS filesystem</option>
                    <option value="s3">S3-compatible</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Max file size (MB)</span>
                  <input type="number" className="w-full rounded-md border bg-background px-3 py-2" {...form.register('maxFileSizeMb', { valueAsNumber: true })} />
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">VPS root path</span>
                  <input className="w-full rounded-md border bg-background px-3 py-2" {...form.register('vpsRootPath')} />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">S3 bucket</span>
                  <input className="w-full rounded-md border bg-background px-3 py-2" {...form.register('bucket')} />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">S3 region</span>
                  <input className="w-full rounded-md border bg-background px-3 py-2" {...form.register('region')} />
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">S3 endpoint</span>
                  <input className="w-full rounded-md border bg-background px-3 py-2" {...form.register('endpoint')} />
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">CDN URL</span>
                  <input className="w-full rounded-md border bg-background px-3 py-2" {...form.register('cdnUrl')} />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Storage quota (GB)</span>
                  <input type="number" className="w-full rounded-md border bg-background px-3 py-2" {...form.register('storageQuotaGb', { valueAsNumber: true })} />
                </label>
              </div>

              {mutation.isError && (
                <p className="text-sm text-destructive">
                  {mutation.error instanceof Error ? mutation.error.message : 'Failed to save settings'}
                </p>
              )}
              {mutation.isSuccess && (
                <p className="text-sm text-green-600">Settings saved.</p>
              )}

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save settings'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
