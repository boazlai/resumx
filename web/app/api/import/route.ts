import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = await request.json().catch(() => ({}))
	const { file, filename } = body

	if (
		!file
		|| !filename
		|| typeof file !== 'string'
		|| typeof filename !== 'string'
	) {
		return NextResponse.json(
			{ error: 'Missing file or filename' },
			{ status: 400 },
		)
	}

	// 5MB max
	if (file.length > 7 * 1024 * 1024) {
		return NextResponse.json(
			{ error: 'File too large (5MB max)' },
			{ status: 413 },
		)
	}

	// Validate filename extension (magic byte validation is done by api/convert.ts)
	const ext = filename.split('.').pop()?.toLowerCase()
	const allowed = ['pdf', 'docx', 'tex', 'json', 'yaml', 'yml']
	if (!ext || !allowed.includes(ext)) {
		return NextResponse.json(
			{
				error:
					'Unsupported file type. Accepted: PDF, DOCX, LaTeX, JSON Resume, YAML',
			},
			{ status: 400 },
		)
	}

	// Forward to resumx convert function
	const baseUrl =
		process.env.VERCEL_URL ?
			`https://${process.env.VERCEL_URL}`
		:	'http://localhost:3000'

	const response = await fetch(`${baseUrl}/api/convert`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ file, filename }),
		// No turnstileToken needed — we use our own auth
	})

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ error: 'Conversion failed' }))
		return NextResponse.json(error, { status: response.status })
	}

	const data = await response.json()
	return NextResponse.json(data)
}
