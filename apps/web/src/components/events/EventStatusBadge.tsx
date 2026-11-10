import { cn } from '@/lib/utils';
import type { EventStatus } from '@/types/domain';

const statusConfig: Record<EventStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  ACTIVE: { label: 'Active', variant: 'default' },
  PROCESSING: { label: 'Processing', variant: 'warning' },
  READY: { label: 'Ready', variant: 'success' },
  ARCHIVED: { label: 'Archived', variant: 'outline' },
  EXPIRED: { label: 'Expired', variant: 'destructive' },
  DELETED: { label: 'Deleted', variant: 'destructive' },
};

const variants = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border border-input text-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

export function EventStatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  const config = statusConfig[status] ?? statusConfig.DRAFT;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[config.variant], className)}>
      {config.label}
    </span>
  );
}
