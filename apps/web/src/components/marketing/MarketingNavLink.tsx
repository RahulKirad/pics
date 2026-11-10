import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { HomeSectionHash } from '@/constants/marketing-nav';

type MarketingNavLinkProps = {
  to: string;
  homeSection?: HomeSectionHash;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

export function MarketingNavLink({ to, homeSection, className, onClick, children }: MarketingNavLinkProps) {
  const { pathname } = useLocation();
  const onHome = pathname === '/';

  if (onHome && homeSection) {
    return (
      <a href={`#${homeSection}`} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export function FooterNavLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={cn('transition-colors hover:text-white', className)}>
      {children}
    </Link>
  );
}
