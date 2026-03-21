import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumeShares, resumes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

type ExpiresIn = '1' | '7' | '30' | '90' | 'never'

function computeExpiresAt(expiresIn: ExpiresIn | undefined): Date | null {
	if (!expiresIn || expiresIn === 'never') return null
	const days = parseInt(expiresIn, 10)
	if (isNaN(days)) return null
	const d = new Date()
	d.setDate(d.getDate() + days)
	return d
}

// GET — return existing share (token, expiresAt) or 404
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

	const share = await db.query.resumeShares.findFirst({
		where: and(eq(resumeShares.resumeId, id), eq(resumeShares.userId, user.id)),
	})
	if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 })

	return NextResponse.json(share)
}

// POST — create or regenerate a share link
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
	const expiresAt = computeExpiresAt(
		(body as { expiresIn?: ExpiresIn }).expiresIn,
	)

	// Delete any existing share first (regenerate)
	await db
		.delete(resumeShares)
		.where(and(eq(resumeShares.resumeId, id), eq(resumeShares.userId, user.id)))

	const token = crypto.randomUUID()
	const [share] = await db
		.insert(resumeShares)
		.values({ resumeId: id, userId: user.id, token, expiresAt })
		.returning()

	return NextResponse.json(share, { status: 201 })
}

// DELETE — revoke the share link
export async function DELETE(
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

	await db
		.delete(resumeShares)
		.where(and(eq(resumeShares.resumeId, id), eq(resumeShares.userId, user.id)))

	return new NextResponse(null, { status: 204 })
}
