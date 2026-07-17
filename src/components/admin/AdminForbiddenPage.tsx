'use client';

import Link from 'next/link';

import { LockKeyhole, LogOut } from 'lucide-react';

import { useAdminAccount } from '@/components/admin/AdminShell';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { NavLinkSpinner } from '@/components/ui/NavLinkIcon';

import { getFirstAllowedAdminPath } from '@/lib/adminPermissions';
import { TEAM_MEMBER_ROLE_LABELS } from '@/lib/teamMemberRoles';

export function AdminForbiddenPage() {
  const { teamMember } = useAdminAccount();
  const confirm = useConfirmation();
  const allowedPath = getFirstAllowedAdminPath(teamMember);

  const signOut = async () => {
    const confirmed = await confirm({
      confirmLabel: 'Sign Out',
      description: 'This will end your admin session on this browser.',
      title: 'Sign out?',
    });

    if (!confirmed) return;

    await fetch('/api/admin/session', { method: 'DELETE' });
    window.location.href = '/admin/login';
  };

  return (
    <main className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-gold/18 bg-offwhite p-7 text-center shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/14 text-gold-deep">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-gold-deep">
          Access Restricted
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-emerald-deep">
          This page is not available for your role
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-relaxed text-ink/72">
          You are signed in as {teamMember.fullName} with the{' '}
          <span className="font-bold text-emerald-deep">
            {TEAM_MEMBER_ROLE_LABELS[teamMember.role]}
          </span>{' '}
          role. Your sidebar only shows the admin areas available to this account.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-deepest px-5 text-sm font-bold text-cream-soft transition hover:bg-emerald-deep"
            href={allowedPath}
          >
            Go To My Admin Area
            <NavLinkSpinner className="h-4 w-4" />
          </Link>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald/10 bg-white px-5 text-sm font-bold text-emerald-deep transition hover:border-gold/45"
            onClick={signOut}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </section>
    </main>
  );
}
