'use client';

import { useLinkStatus } from 'next/link';

import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

export function NavigationSpinner({ className }: { className?: string }) {
  return (
    <LoaderCircle
      aria-label="Loading page"
      className={cn('shrink-0 animate-spin', className)}
      role="status"
    />
  );
}

export function NavLinkIcon({
  className,
  icon: Icon,
}: {
  className?: string;
  icon: React.ElementType<{ className?: string }>;
}) {
  const { pending } = useLinkStatus();

  return pending ? <NavigationSpinner className={className} /> : <Icon className={className} />;
}

export function NavLinkSpinner({ className }: { className?: string }) {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return <NavigationSpinner className={cn('inline-block', className)} />;
}
