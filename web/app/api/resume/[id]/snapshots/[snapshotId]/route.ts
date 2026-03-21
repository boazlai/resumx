import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumeSnapshots, resumes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string; snapshotId: string }> },
) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const { id, snapshotId } = await params

	const deleted = await db
		.delete(resumeSnapshots)
		.where(
			and(
				eq(resumeSnapshots.id, snapshotId),
				eq(resumeSnapshots.resumeId, id),
				eq(resumeSnapshots.userId, user.id),
			),
		)
		.returning({ id: resumeSnapshots.id })

	if (!deleted.length)
		return NextResponse.json({ error: 'Not found' }, { status: 404 })

	return new NextResponse(null, { status: 204 })
}

// POST /restore — overwrites the resume's markdown with the snapshot content
export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ id: string; snapshotId: string }> },
) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const { id, snapshotId } = await params

	const snapshot = await db.query.resumeSnapshots.findFirst({
		where: and(
			eq(resumeSnapshots.id, snapshotId),
			eq(resumeSnapshots.resumeId, id),
			eq(resumeSnapshots.userId, user.id),
		),
	})
	if (!snapshot)
		return NextResponse.json({ error: 'Not found' }, { status: 404 })

	const [updated] = await db
		.update(resumes)
		.set({ markdown: snapshot.markdown, updatedAt: new Date() })
		.where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
		.returning({ markdown: resumes.markdown })

	if (!updated)
		return NextResponse.json({ error: 'Not found' }, { status: 404 })

	return NextResponse.json({ markdown: snapshot.markdown })
}
