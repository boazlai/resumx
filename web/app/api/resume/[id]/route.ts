import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

async function getAuthorizedResume(userId: string, id: string) {
	const [row] = await db
		.select()
		.from(resumes)
		.where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
		.limit(1)
	return row ?? null
}

// GET /api/resume/[id]
export async function GET(_req: Request, { params }: Params) {
	const { id } = await params
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const row = await getAuthorizedResume(user.id, id)
	if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

	return NextResponse.json(row)
}

// PATCH /api/resume/[id] — update title and/or markdown
export async function PATCH(request: Request, { params }: Params) {
	const { id } = await params
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const existing = await getAuthorizedResume(user.id, id)
	if (!existing)
		return NextResponse.json({ error: 'Not found' }, { status: 404 })

	const body = await request.json().catch(() => ({}))
	const updates: Partial<{ title: string; markdown: string; tags: string[] }> =
		{}

	if (typeof body.title === 'string') updates.title = body.title.slice(0, 200)
	if (typeof body.markdown === 'string') {
		if (body.markdown.length > 100_000) {
			return NextResponse.json(
				{ error: 'Markdown too large (100KB max)' },
				{ status: 413 },
			)
		}
		updates.markdown = body.markdown
	}
	if (Array.isArray(body.tags)) {
		updates.tags = body.tags
			.filter((t: unknown): t is string => typeof t === 'string')
			.slice(0, 10)
			.map((t: string) => t.slice(0, 50))
	}

	const [updated] = await db
		.update(resumes)
		.set(updates)
		.where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
		.returning()

	return NextResponse.json(updated)
}

// DELETE /api/resume/[id]
export async function DELETE(_req: Request, { params }: Params) {
	const { id } = await params
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const existing = await getAuthorizedResume(user.id, id)
	if (!existing)
		return NextResponse.json({ error: 'Not found' }, { status: 404 })

	await db
		.delete(resumes)
		.where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))

	return new NextResponse(null, { status: 204 })
}
