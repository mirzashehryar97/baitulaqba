import { cn } from '@/lib/utils';

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-emerald-deep/10', className)} />;
}
