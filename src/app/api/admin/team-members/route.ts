import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import { canCreateTeamMemberWithRole, canManageTeamMembers } from '@/lib/adminPermissions';
import { getPaginationOptions } from '@/lib/pagination';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';
import { createTeamMember, listTeamMembers, validateTeamMemberInput } from '@/lib/teamMembers';

import { TEAM_MEMBER_ROLES, type TeamMemberInput, type TeamMemberRole } from '@/types/accounts';

export async function GET(request: Request) {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canManageTeamMembers(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view team members.');
    }

    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const status = url.searchParams.get('status');
    const teamMembers = await listTeamMembers(
      {
        role:
          role && TEAM_MEMBER_ROLES.includes(role as TeamMemberRole)
            ? (role as TeamMemberRole)
            : undefined,
        search: url.searchParams.get('search') ?? undefined,
        status:
          status === 'active' || status === 'pending' || status === 'inactive' ? status : undefined,
      },
      getPaginationOptions(url),
    );
    return NextResponse.json({ data: teamMembers });
  } catch (error) {
    return handleTeamMemberApiError(error, 'Could not load team members.');
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as TeamMemberInput | null;
  const errors = validateTeamMemberInput(body);

  if (!body || Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canCreateTeamMemberWithRole(currentTeamMember, body.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to create a team member with this role.' },
        { status: 403 },
      );
    }

    const teamMember = await createTeamMember(body, currentTeamMember.id);
    return NextResponse.json({ data: teamMember }, { status: 201 });
  } catch (error) {
    return handleTeamMemberApiError(error, 'Could not create team member.');
  }
}

function handleTeamMemberApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof MissingSupabaseConfigError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  if (error instanceof MissingSupabaseAuthConfigError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  if (error instanceof Error && error.message.toLowerCase().includes('duplicate')) {
    return NextResponse.json(
      { error: 'A team member with this email already exists.' },
      { status: 409 },
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
