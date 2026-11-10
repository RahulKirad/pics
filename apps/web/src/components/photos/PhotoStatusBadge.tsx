import { PhotoStatus } from '@/types/domain';
import { cn } from '@/lib/utils';

const statusConfig: Record<PhotoStatus, { label: string; className: string }> = {
  [PhotoStatus.UPLOADING]: { label: 'Uploading', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  [PhotoStatus.PROCESSING]: { label: 'Processing', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  [PhotoStatus.READY]: { label: 'Ready', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  [PhotoStatus.FAILED]: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

interface PhotoStatusBadgeProps {
  status: PhotoStatus;
  className?: string;
}

export function PhotoStatusBadge({ status, className }: PhotoStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
