import type { QuotaMetric } from '@photo-platform/shared-types';
import { quotaPercent } from '@/lib/razorpay';

interface QuotaBarProps {
  label: string;
  metric: QuotaMetric;
  formatValue?: (value: number) => string;
}

function defaultFormat(value: number) {
  return String(value);
}

export function QuotaBar({ label, metric, formatValue = defaultFormat }: QuotaBarProps) {
  const percent = quotaPercent(metric);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {formatValue(metric.used)} / {formatValue(metric.limit)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percent >= 90 ? 'bg-destructive' : percent >= 70 ? 'bg-amber-500' : 'bg-primary'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
