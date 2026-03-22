import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 20 // seconds — allow for Playwright startup

export async function POST(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const limit = await rateLimit(`preview:${user.id}`, {
		limit: 1,
		windowMs: 2_000,
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

	const body = await request.json().catch(() => ({}))
	const markdown = body?.markdown

	if (!markdown || typeof markdown !== 'string') {
		return NextResponse.json(
			{ error: 'Missing markdown field' },
			{ status: 400 },
		)
	}

	if (markdown.length > 50_000) {
		return NextResponse.json(
			{ error: 'Content too large (50KB max)' },
			{ status: 413 },
		)
	}

	// Forward to the resumx render service.
	// Configure RESUMX_API_URL to point to your own resumx deployment.
	// Defaults to the live resumx.dev service (server-to-server, no CORS issues).
	const resumxBaseUrl = (
		process.env.RESUMX_API_URL ?? 'https://resumx.dev'
	).replace(/\/$/, '')

	const response = await fetch(`${resumxBaseUrl}/api/preview`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ markdown }),
	})

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ error: 'Render failed' }))
		return NextResponse.json(error, { status: response.status })
	}

	// Stream the PDF back to the client
	const pdfBuffer = await response.arrayBuffer()
	const warnings = response.headers.get('X-Resumx-Warnings')
	const pageFit = response.headers.get('X-Resumx-Page-Fit')

	const headers = new Headers({
		'Content-Type': 'application/pdf',
		'Content-Disposition': 'inline; filename="resume.pdf"',
	})
	if (warnings) headers.set('X-Resumx-Warnings', warnings)
	if (pageFit) headers.set('X-Resumx-Page-Fit', pageFit)

	return new Response(pdfBuffer, { status: 200, headers })
}
