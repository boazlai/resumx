import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resumeShares, resumes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 20

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ token: string }> },
) {
	const { token } = await params

	const limit = await rateLimit(`share:${token}`, {
		limit: 5,
		windowMs: 10_000,
	})

	if (limit.limited) {
		return NextResponse.json(
			{ error: 'Too many requests. Please wait a moment.' },
			{
				status: 429,
				headers: { 'Retry-After': String(limit.retryAfter) },
			},
		)
	}

	const share = await db.query.resumeShares.findFirst({
		where: eq(resumeShares.token, token),
	})
	if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 })

	if (share.expiresAt && share.expiresAt < new Date()) {
		return NextResponse.json({ error: 'Link expired' }, { status: 410 })
	}

	const resume = await db.query.resumes.findFirst({
		where: eq(resumes.id, share.resumeId),
		columns: { markdown: true },
	})
	if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })

	const resumxBaseUrl = (
		process.env.RESUMX_API_URL ?? 'https://resumx.dev'
	).replace(/\/$/, '')

	const response = await fetch(`${resumxBaseUrl}/api/preview`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ markdown: resume.markdown }),
	})

	if (!response.ok) {
		return NextResponse.json({ error: 'Render failed' }, { status: 502 })
	}

	const pdfBuffer = await response.arrayBuffer()
	return new Response(pdfBuffer, {
		status: 200,
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'inline; filename="resume.pdf"',
			'Cache-Control': 'private, max-age=60',
		},
	})
}
