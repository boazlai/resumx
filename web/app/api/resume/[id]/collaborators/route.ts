import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumeCollaborators } from '@/lib/db/schema'
import { getResumeAccess, normalizeEmail } from '@/lib/resume-access'

const VALID_ROLES = new Set(['viewer', 'commenter', 'editor'])

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const { id } = await params
	const access = await getResumeAccess(id, {
		id: user.id,
		email: user.email,
		name: user.user_metadata?.full_name ?? '',
		avatarUrl: user.user_metadata?.avatar_url ?? '',
	})
	if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })

	const collaborators = await db.query.resumeCollaborators.findMany({
		where: eq(resumeCollaborators.resumeId, id),
		orderBy: [asc(resumeCollaborators.createdAt)],
	})

	return NextResponse.json({
		role: access.role,
		collaborators,
	})
}

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const { id } = await params
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
	const email = normalizeEmail(body.email)
	const role = typeof body.role === 'string' ? body.role : 'viewer'

	if (!email.includes('@')) {
		return NextResponse.json(
			{ error: 'Valid email is required' },
			{ status: 400 },
		)
	}
	if (!VALID_ROLES.has(role)) {
		return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
	}
	if (email === normalizeEmail(user.email)) {
		return NextResponse.json(
			{ error: 'You already own this resume' },
			{ status: 400 },
		)
	}

	const existing = await db.query.resumeCollaborators.findFirst({
		where: and(
			eq(resumeCollaborators.resumeId, id),
			eq(resumeCollaborators.email, email),
		),
	})

	const collaborator =
		existing ?
			(
				await db
					.update(resumeCollaborators)
					.set({ role, updatedAt: new Date() })
					.where(eq(resumeCollaborators.id, existing.id))
					.returning()
			)[0]
		:	(
				await db
					.insert(resumeCollaborators)
					.values({
						resumeId: id,
						ownerUserId: access.resume.userId,
						email,
						role,
					})
					.returning()
			)[0]

	return NextResponse.json(collaborator, { status: existing ? 200 : 201 })
}
