import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import {
  canAssignTeamMemberRole,
  canChangeTeamMemberRole,
  canChangeTeamMemberStatus,
  canManageAdminAccounts,
  canManageTeamMembers,
} from '@/lib/adminPermissions';
import { clearMemberPermissionOverrides } from '@/lib/permissions';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/teamMemberRoles';
import { getTeamMemberById, updateTeamMember, validateTeamMemberInput } from '@/lib/teamMembers';

import type { TeamMemberUpdate } from '@/types/accounts';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canManageTeamMembers(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view team members.');
    }

    const teamMember = await getTeamMemberById(id);

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: teamMember });
  } catch (error) {
    return handleTeamMemberApiError(error, 'Could not load team member.');
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as TeamMemberUpdate | null;

  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  let currentTeamMember: Awaited<ReturnType<typeof requireTeamMember>>;

  try {
    currentTeamMember = await requireTeamMember();

    if (!canManageTeamMembers(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to update team members.');
    }
  } catch (error) {
    return handleTeamMemberApiError(error, 'Could not update team member.');
  }

  const currentMember = await getTeamMemberById(id);

  if (!currentMember) {
    return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
  }

  if (body.role === 'custom') {
    return NextResponse.json(
      { error: 'The custom role is applied automatically when editing member permissions.' },
      { status: 400 },
    );
  }

  const roleChanging = body.role !== undefined && body.role !== currentMember.role;
  const activeChanging = body.active !== undefined && body.active !== currentMember.active;

  if (currentTeamMember.id === currentMember.id && (roleChanging || activeChanging)) {
    return NextResponse.json(
      { error: 'You cannot change your own role or account status.' },
      { status: 403 },
    );
  }

  if (roleChanging && !canChangeTeamMemberRole(currentTeamMember, currentMember)) {
    return NextResponse.json(
      { error: 'You do not have permission to change this team member role.' },
      { status: 403 },
    );
  }

  if (activeChanging && !canChangeTeamMemberStatus(currentTeamMember, currentMember)) {
    return NextResponse.json(
      { error: 'You do not have permission to change this team member account status.' },
      { status: 403 },
    );
  }

  if (
    roleChanging &&
    body.role !== undefined &&
    !canAssignTeamMemberRole(currentTeamMember, currentMember, body.role)
  ) {
    if (!canManageAdminAccounts(currentTeamMember) && isAdminRole(body.role)) {
      return NextResponse.json(
        { error: 'Only a super admin can assign admin roles.' },
        { status: 403 },
      );
    }

    if (!canManageAdminAccounts(currentTeamMember) && isAdminRole(currentMember.role)) {
      return NextResponse.json(
        { error: 'Only a super admin can change admin roles or admin account status.' },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: 'You do not have permission to assign this role.' },
      { status: 403 },
    );
  }

  const merged = {
    active: body.active ?? currentMember.active,
    email: body.email ?? currentMember.email,
    fullName: body.fullName ?? currentMember.fullName,
    notes: body.notes ?? currentMember.notes ?? '',
    phone: body.phone ?? currentMember.phone ?? '',
    role: body.role ?? currentMember.role,
  };
  const errors = validateTeamMemberInput(merged);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const teamMember = await updateTeamMember(id, body);

    // Reassigning a member to a standard role drops any individual permission overrides so they
    // follow that role's matrix again.
    if (roleChanging && body.role !== undefined && currentMember.role === 'custom') {
      await clearMemberPermissionOverrides(id);
    }

    return NextResponse.json({ data: teamMember });
  } catch (error) {
    return handleTeamMemberApiError(error, 'Could not update team member.');
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
