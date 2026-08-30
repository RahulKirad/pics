import type { DailyMetric } from '@photo-platform/shared-types';
import { formatShortDate } from '@/lib/format';

interface DailyBarChartProps {
  title: string;
  data: DailyMetric[];
  emptyLabel?: string;
}

export function DailyBarChart({ title, data, emptyLabel = 'No activity yet' }: DailyBarChartProps) {
  const max = Math.max(...data.map((point) => point.count), 1);
  const total = data.reduce((sum, point) => sum + point.count, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">{total} total</span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{emptyLabel}</p>
      ) : (
        <div className="flex items-end gap-1 h-28">
          {data.map((point) => {
            const height = Math.max((point.count / max) * 100, point.count > 0 ? 8 : 0);
            return (
              <div key={point.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div className="w-full flex items-end justify-center h-20">
                  <div
                    className="w-full max-w-5 rounded-sm bg-primary/80 transition-all"
                    style={{ height: `${height}%` }}
                    title={`${formatShortDate(point.date)}: ${point.count}`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {formatShortDate(point.date)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
