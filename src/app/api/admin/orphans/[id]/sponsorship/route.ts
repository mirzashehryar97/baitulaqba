import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canViewOrphans } from '@/lib/adminPermissions';
import { handleFinanceApiError } from '@/lib/financeApiErrors';
import { getOrphanSponsorshipOverview } from '@/lib/orphanSponsorships';
import { getOrphanProfileById } from '@/lib/orphans';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const teamMember = await requireTeamMember();

    if (!canViewOrphans(teamMember)) {
      throw new ForbiddenError('You do not have permission to view orphan profiles.');
    }

    const orphan = await getOrphanProfileById(id);

    if (!orphan) {
      return NextResponse.json({ error: 'Orphan profile not found.' }, { status: 404 });
    }

    return NextResponse.json({
      data: await getOrphanSponsorshipOverview(teamMember, id),
    });
  } catch (error) {
    return handleFinanceApiError(error, 'Could not load sponsorship and payment details.');
  }
}
