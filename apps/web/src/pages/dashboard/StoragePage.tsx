import { useQuery } from '@tanstack/react-query';
import { HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';
import type { ApiResponse } from '@photo-platform/shared-types';

interface StorageUsage {
  originalBytes: number;
  previewBytes: number;
  thumbnailBytes: number;
  totalBytes: number;
  storageDriver: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function StoragePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['storage-usage'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<StorageUsage>>('/storage/usage');
      if (!res.success) throw new Error(res.error.message);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Storage</h1>
        <p className="text-muted-foreground">Monitor your storage usage</p>
      </div>

      {isLoading && <Skeleton className="h-48 w-full max-w-lg" />}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(data.totalBytes)}</div>
              {data.storageDriver && (
                <p className="text-xs text-muted-foreground mt-1">Driver: {data.storageDriver.toUpperCase()}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Originals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(data.originalBytes)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Previews & Thumbnails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(data.previewBytes + data.thumbnailBytes)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
