import { Cloud } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({ className, size = 'md' }: BrandLogoProps) {
  const iconBox =
    size === 'sm' ? 'h-7 w-7 rounded-md' : size === 'lg' ? 'h-9 w-9 rounded-lg' : 'h-8 w-8 rounded-lg';
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-5 w-5' : 'h-4.5 w-4.5';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <span className={cn('inline-flex items-center gap-2.5 whitespace-nowrap shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center bg-blue-600 text-white shadow-xs',
          iconBox,
        )}
      >
        <Cloud className={iconSize} />
      </span>
      <span className={cn('font-display font-bold tracking-tight text-slate-900', textSize)}>
        CloudBox
      </span>
    </span>
  );
}
