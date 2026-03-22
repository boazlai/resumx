import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getResumeAccess } from '@/lib/resume-access'

type Params = { params: Promise<{ id: string }> }

export const maxDuration = 30

// POST /api/resume/[id]/thumbnail — generate a screenshot of the resume's first
// page and store it in Supabase Storage. Called fire-and-forget from the editor
// after each compile so the dashboard card always shows a current preview.
export async function POST(_req: Request, { params }: Params) {
	const { id } = await params
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	const access = await getResumeAccess(id, {
		id: user.id,
		email: user.email,
		name: user.user_metadata?.full_name ?? '',
		avatarUrl: user.user_metadata?.avatar_url ?? '',
	})
	if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
	if (!access.canGenerateThumbnail)
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

	const [row] = await db
		.select({ markdown: resumes.markdown })
		.from(resumes)
		.where(eq(resumes.id, id))
		.limit(1)

	if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

	const resumxBaseUrl = (
		process.env.RESUMX_API_URL ?? 'https://resumx.dev'
	).replace(/\/$/, '')

	const screenshotRes = await fetch(`${resumxBaseUrl}/api/screenshot`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ markdown: row.markdown }),
	})

	if (!screenshotRes.ok) {
		return NextResponse.json({ error: 'Screenshot failed' }, { status: 502 })
	}

	const imageBuffer = Buffer.from(await screenshotRes.arrayBuffer())
	const storagePath = `${access.resume.userId}/${id}.jpg`

	const { error: storageError } = await supabase.storage
		.from('thumbnails')
		.upload(storagePath, imageBuffer, {
			contentType: 'image/jpeg',
			upsert: true,
		})

	if (storageError) {
		return NextResponse.json(
			{ error: 'Storage upload failed', detail: storageError.message },
			{ status: 500 },
		)
	}

	const {
		data: { publicUrl },
	} = supabase.storage.from('thumbnails').getPublicUrl(storagePath)

	await db
		.update(resumes)
		.set({ thumbnailUrl: publicUrl })
		.where(eq(resumes.id, id))

	return NextResponse.json({ url: publicUrl })
}
