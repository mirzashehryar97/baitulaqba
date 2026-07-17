import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { workSurface } from '@/components/ui/work-surface';

import { cn } from '@/lib/utils';

export default function SponsorshipRequestDetailLoading() {
  return (
    <div className={workSurface.page}>
      <SkeletonBlock className="h-5 w-52" />
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <SkeletonBlock className="h-9 w-80" />
          <SkeletonBlock className="mt-3 h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-32" />
          <SkeletonBlock className="h-10 w-28" />
          <SkeletonBlock className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {['request-age', 'last-contact', 'next-follow-up', 'assigned-to'].map((key) => (
          <SkeletonBlock className="h-28 rounded-lg" key={key} />
        ))}
      </div>
      <SkeletonBlock className="h-40 rounded-lg" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(20rem,0.85fr)]">
        <div className="space-y-5">
          <SkeletonBlock className={cn(workSurface.card, 'h-72')} />
          <SkeletonBlock className={cn(workSurface.card, 'h-36')} />
          <SkeletonBlock className={cn(workSurface.card, 'h-80')} />
        </div>
        <div className="space-y-5">
          <SkeletonBlock className={cn(workSurface.card, 'h-96')} />
          <SkeletonBlock className={cn(workSurface.card, 'h-96')} />
        </div>
      </div>
    </div>
  );
}
