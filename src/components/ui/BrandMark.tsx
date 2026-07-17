import Image from 'next/image';

import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  priority?: boolean;
};

export function BrandMark({ className, priority = false }: BrandMarkProps) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={cn('shrink-0 object-contain', className)}
      height={96}
      priority={priority}
      src="/images/official/bait-ul-aqba/baitul-aqba-mark.png"
      width={96}
    />
  );
}
