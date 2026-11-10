import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const BRAND_LOGO_SRC = '/picsharenow-logo.jpg';

const SIZE_CLASS = {
  sm: 'h-9 max-w-[168px]',
  md: 'h-10 max-w-[200px] md:h-11 md:max-w-[220px]',
  lg: 'h-12 max-w-[240px] md:h-14 md:max-w-[280px]',
} as const;

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  size?: keyof typeof SIZE_CLASS;
  linkToHome?: boolean;
};

export function BrandLogo({ className, imageClassName, size = 'md', linkToHome }: BrandLogoProps) {
  const img = (
    <img
      src={BRAND_LOGO_SRC}
      alt="PicShareNow"
      width={280}
      height={56}
      className={cn('w-auto object-contain object-left', SIZE_CLASS[size], imageClassName)}
      decoding="async"
    />
  );

  if (linkToHome) {
    return (
      <Link to="/" className={cn('inline-flex shrink-0 items-center', className)} aria-label="PicShareNow home">
        {img}
      </Link>
    );
  }

  return <div className={cn('inline-flex items-center', className)}>{img}</div>;
}
