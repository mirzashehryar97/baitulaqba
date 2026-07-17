'use client';

import { Heart } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useSponsorOrphanForm } from '@/components/ui/SponsorOrphanModal';

type SponsorOrphanButtonProps = {
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onOpen?: () => void;
};

export function SponsorOrphanButton({
  children = 'Sponsor an Orphan',
  className,
  size = 'md',
  onOpen,
}: SponsorOrphanButtonProps) {
  const { openSponsorForm } = useSponsorOrphanForm();

  return (
    <Button
      className={className}
      onClick={() => {
        onOpen?.();
        openSponsorForm();
      }}
      size={size}
    >
      <Heart className="h-4 w-4" />
      {children}
    </Button>
  );
}
