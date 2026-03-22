import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 30 // seconds — exports can take longer than previews

const SUPPORTED_FORMATS = ['pdf', 'html', 'docx'] as const
type ExportFormat = (typeof SUPPORTED_FORMATS)[number]

const CONTENT_TYPES: Record<ExportFormat, string> = {
	pdf: 'application/pdf',
	html: 'text/html; charset=utf-8',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export async function POST(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const limit = await rateLimit(`export:${user.id}`, {
		limit: 2,
		windowMs: 20_000,
	})

	if (limit.limited) {
		return NextResponse.json(
			{ error: 'Too many requests. Please wait a few seconds.' },
			{
				status: 429,
				headers: { 'Retry-After': String(limit.retryAfter) },
			},
		)
	}

	const body = await request.json().catch(() => ({}))
	const { markdown, format } = body

	if (!markdown || typeof markdown !== 'string') {
		return NextResponse.json(
			{ error: 'Missing markdown field' },
			{ status: 400 },
		)
	}
	if (!SUPPORTED_FORMATS.includes(format)) {
		return NextResponse.json(
			{
				error: `Unsupported format. Use one of: ${SUPPORTED_FORMATS.join(', ')}`,
			},
			{ status: 400 },
		)
	}
	if (markdown.length > 50_000) {
		return NextResponse.json(
			{ error: 'Content too large (50KB max)' },
			{ status: 413 },
		)
	}

	// HTML and DOCX require a full resumx deployment with pandoc.
	if (format !== 'pdf') {
		return NextResponse.json(
			{
				error: `${format.toUpperCase()} export is not yet supported. PDF export is available.`,
			},
			{ status: 501 },
		)
	}

	// Forward to the resumx render service for PDF.
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

	const fileBuffer = await response.arrayBuffer()
	const warnings = response.headers.get('X-Resumx-Warnings')
	const pageFit = response.headers.get('X-Resumx-Page-Fit')
	const ext =
		format === 'html' ? 'html'
		: format === 'docx' ? 'docx'
		: 'pdf'

	const headers = new Headers({
		'Content-Type': CONTENT_TYPES[format as ExportFormat],
		'Content-Disposition': `attachment; filename="resume.${ext}"`,
	})
	if (warnings) headers.set('X-Resumx-Warnings', warnings)
	if (pageFit) headers.set('X-Resumx-Page-Fit', pageFit)

	return new Response(fileBuffer, { status: 200, headers })
}
