import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumeSnapshots, resumes } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

const MAX_SNAPSHOTS = 50

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

	const resume = await db.query.resumes.findFirst({
		where: and(eq(resumes.id, id), eq(resumes.userId, user.id)),
		columns: { id: true },
	})
	if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })

	const snapshots = await db
		.select()
		.from(resumeSnapshots)
		.where(
			and(
				eq(resumeSnapshots.resumeId, id),
				eq(resumeSnapshots.userId, user.id),
			),
		)
		.orderBy(desc(resumeSnapshots.createdAt))
		.limit(MAX_SNAPSHOTS)

	return NextResponse.json(snapshots)
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

	const resume = await db.query.resumes.findFirst({
		where: and(eq(resumes.id, id), eq(resumes.userId, user.id)),
		columns: { id: true },
	})
	if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })

	const body = await req.json().catch(() => ({}))
	const { markdown, label } = body as { markdown?: string; label?: string }
	if (typeof markdown !== 'string' || !markdown.trim()) {
		return NextResponse.json({ error: 'markdown is required' }, { status: 400 })
	}

	// Enforce cap: prune oldest entries beyond the limit before inserting
	const existing = await db
		.select({ id: resumeSnapshots.id })
		.from(resumeSnapshots)
		.where(
			and(
				eq(resumeSnapshots.resumeId, id),
				eq(resumeSnapshots.userId, user.id),
			),
		)
		.orderBy(desc(resumeSnapshots.createdAt))
		.limit(MAX_SNAPSHOTS)

	if (existing.length >= MAX_SNAPSHOTS) {
		const oldestId = existing[existing.length - 1].id
		await db.delete(resumeSnapshots).where(eq(resumeSnapshots.id, oldestId))
	}

	const [snapshot] = await db
		.insert(resumeSnapshots)
		.values({
			resumeId: id,
			userId: user.id,
			markdown,
			label: label ?? null,
		})
		.returning()

	return NextResponse.json(snapshot, { status: 201 })
}
