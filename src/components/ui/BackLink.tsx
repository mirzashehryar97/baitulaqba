import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import { NavLinkIcon } from '@/components/ui/NavLinkIcon';

type BackLinkProps = {
  href: string;
  label: string;
};

export default function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b7280] transition hover:text-[#006b4f]"
      href={href}
    >
      <NavLinkIcon className="h-4 w-4" icon={ArrowLeft} />
      {label}
    </Link>
  );
}
