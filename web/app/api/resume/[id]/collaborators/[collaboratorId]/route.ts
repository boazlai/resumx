import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumeCollaborators } from '@/lib/db/schema'
import { getResumeAccess } from '@/lib/resume-access'

const VALID_ROLES = new Set(['viewer', 'commenter', 'editor'])

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string; collaboratorId: string }> },
) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const { id, collaboratorId } = await params
	const access = await getResumeAccess(id, {
		id: user.id,
		email: user.email,
		name: user.user_metadata?.full_name ?? '',
		avatarUrl: user.user_metadata?.avatar_url ?? '',
	})
	if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
	if (!access.canManageCollaborators)
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

	const body = await req.json().catch(() => ({}))
	const role = typeof body.role === 'string' ? body.role : null
	if (!role || !VALID_ROLES.has(role)) {
		return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
	}

	const [updated] = await db
		.update(resumeCollaborators)
		.set({ role, updatedAt: new Date() })
		.where(
			and(
				eq(resumeCollaborators.id, collaboratorId),
				eq(resumeCollaborators.resumeId, id),
			),
		)
		.returning()

	if (!updated)
		return NextResponse.json({ error: 'Not found' }, { status: 404 })

	return NextResponse.json(updated)
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string; collaboratorId: string }> },
) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const { id, collaboratorId } = await params
	const access = await getResumeAccess(id, {
		id: user.id,
		email: user.email,
		name: user.user_metadata?.full_name ?? '',
		avatarUrl: user.user_metadata?.avatar_url ?? '',
	})
	if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
	if (!access.canManageCollaborators)
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

	const deleted = await db
		.delete(resumeCollaborators)
		.where(
			and(
				eq(resumeCollaborators.id, collaboratorId),
				eq(resumeCollaborators.resumeId, id),
			),
		)
		.returning({ id: resumeCollaborators.id })

	if (!deleted.length)
		return NextResponse.json({ error: 'Not found' }, { status: 404 })

	return new NextResponse(null, { status: 204 })
}
