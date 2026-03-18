import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Rate limit: track last render time per user (in-memory, resets on cold start)
// For production, use Upstash Redis or similar. This is sufficient for Vercel's
// serverless model where each instance handles limited concurrency.
const lastRender = new Map<string, number>()
const RATE_LIMIT_MS = 2000 // 2 seconds between renders per user

export const maxDuration = 20 // seconds — allow for Playwright startup

export async function POST(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	// Rate limiting
	const now = Date.now()
	const last = lastRender.get(user.id) ?? 0
	if (now - last < RATE_LIMIT_MS) {
		return NextResponse.json(
			{ error: 'Too many requests. Please wait a moment.' },
			{ status: 429 },
		)
	}
	lastRender.set(user.id, now)

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

	// Forward to the resumx preview serverless function
	// In Vercel, both functions are in the same deployment so this is an internal call.
	const baseUrl =
		process.env.VERCEL_URL ?
			`https://${process.env.VERCEL_URL}`
		:	'http://localhost:3000'

	const response = await fetch(`${baseUrl}/api/preview`, {
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
