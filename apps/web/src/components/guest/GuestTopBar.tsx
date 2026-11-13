import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

type GuestTopBarProps = {
  backTo?: string;
  backLabel?: string;
  title?: string;
};

export function GuestTopBar({ backTo, backLabel = 'Back', title }: GuestTopBarProps) {
  return (
    <header className="sticky top-0 z-30 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-top">
      <div className="mx-auto grid h-14 max-w-lg grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:px-4">
        <div className="flex min-w-[4.5rem] justify-start">
          {backTo ? (
            <Link
              to={backTo}
              className="inline-flex max-w-[5.5rem] items-center gap-1 truncate text-xs font-medium text-muted-foreground hover:text-foreground sm:max-w-none sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Link>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col items-center justify-center">
          <BrandLogo linkToHome size="sm" className="max-w-[140px] sm:max-w-[168px]" />
          {title ? (
            <p className="mt-0.5 w-full truncate text-center text-[10px] font-medium text-muted-foreground sm:text-xs">
              {title}
            </p>
          ) : null}
        </div>

        <div className="min-w-[4.5rem]" aria-hidden />
      </div>
    </header>
  );
}
