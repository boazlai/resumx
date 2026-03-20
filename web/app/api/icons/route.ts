import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { userIcons } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
const MAX_ICONS_PER_USER = 50
const NAME_RE = /^[a-z0-9][a-z0-9_-]{1,29}$/
const ALLOWED_TYPES: Record<string, string> = {
	'image/svg+xml': 'svg',
	'image/png': 'png',
	'image/jpeg': 'jpg',
}

function sanitizeSvg(raw: string): string {
	// Strip <script> tags, on* attributes, javascript: URIs, and data: URIs
	let s = raw
	s = s.replace(/<script[\s\S]*?<\/script>/gi, '')
	s = s.replace(/<script[^>]*\/>/gi, '')
	s = s.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
	s = s.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
	s = s.replace(/javascript\s*:/gi, '')
	s = s.replace(/data\s*:[^,]*base64/gi, '')
	return s
}

// GET /api/icons — list all icons for the current user
export async function GET() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const rows = await db
		.select({
			id: userIcons.id,
			name: userIcons.name,
			url: userIcons.url,
			format: userIcons.format,
		})
		.from(userIcons)
		.where(eq(userIcons.userId, user.id))
		.orderBy(userIcons.createdAt)

	return NextResponse.json(rows)
}

// POST /api/icons — upload a new icon (multipart or JSON with URL)
export async function POST(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	// Check icon count limit
	const existing = await db
		.select({ id: userIcons.id })
		.from(userIcons)
		.where(eq(userIcons.userId, user.id))

	if (existing.length >= MAX_ICONS_PER_USER) {
		return NextResponse.json(
			{ error: `Maximum ${MAX_ICONS_PER_USER} icons allowed` },
			{ status: 400 },
		)
	}

	const contentType = request.headers.get('content-type') ?? ''

	let name: string
	let fileBuffer: Buffer
	let format: string

	if (contentType.includes('multipart/form-data')) {
		// File upload path
		const formData = await request.formData()
		const file = formData.get('file') as File | null
		const rawName = formData.get('name') as string | null

		if (!file || !rawName) {
			return NextResponse.json(
				{ error: 'File and name are required' },
				{ status: 400 },
			)
		}

		name = rawName.toLowerCase().trim()
		if (!NAME_RE.test(name)) {
			return NextResponse.json(
				{
					error:
						'Name must be 2-30 chars, lowercase letters, numbers, hyphens, underscores',
				},
				{ status: 400 },
			)
		}

		const detectedFormat = ALLOWED_TYPES[file.type]
		if (!detectedFormat) {
			return NextResponse.json(
				{ error: 'Only SVG, PNG, and JPG files are allowed' },
				{ status: 400 },
			)
		}

		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: 'File must be under 2 MB' },
				{ status: 400 },
			)
		}

		format = detectedFormat
		const arrayBuffer = await file.arrayBuffer()
		fileBuffer = Buffer.from(arrayBuffer)

		// Sanitize SVG
		if (format === 'svg') {
			const text = fileBuffer.toString('utf-8')
			fileBuffer = Buffer.from(sanitizeSvg(text), 'utf-8')
		}
	} else {
		// JSON URL paste path
		const body = await request.json().catch(() => null)
		if (
			!body
			|| typeof body.url !== 'string'
			|| typeof body.name !== 'string'
		) {
			return NextResponse.json(
				{ error: 'URL and name are required' },
				{ status: 400 },
			)
		}

		name = body.name.toLowerCase().trim()
		if (!NAME_RE.test(name)) {
			return NextResponse.json(
				{
					error:
						'Name must be 2-30 chars, lowercase letters, numbers, hyphens, underscores',
				},
				{ status: 400 },
			)
		}

		// Validate and fetch the URL
		let url: URL
		try {
			url = new URL(body.url)
			if (!['http:', 'https:'].includes(url.protocol)) {
				throw new Error('Invalid protocol')
			}
		} catch {
			return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
		}

		let res: Response
		try {
			res = await fetch(url.href, {
				headers: { Accept: 'image/*' },
				signal: AbortSignal.timeout(10_000),
			})
		} catch {
			return NextResponse.json(
				{ error: 'Could not fetch URL' },
				{ status: 400 },
			)
		}

		if (!res.ok) {
			return NextResponse.json(
				{ error: 'URL returned an error' },
				{ status: 400 },
			)
		}

		const remoteCt = res.headers.get('content-type') ?? ''
		const detectedFormat = Object.entries(ALLOWED_TYPES).find(([mime]) =>
			remoteCt.includes(mime),
		)?.[1]

		if (!detectedFormat) {
			return NextResponse.json(
				{ error: 'URL must point to an SVG, PNG, or JPG image' },
				{ status: 400 },
			)
		}

		const arrayBuffer = await res.arrayBuffer()
		if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: 'Remote image must be under 2 MB' },
				{ status: 400 },
			)
		}

		format = detectedFormat
		fileBuffer = Buffer.from(arrayBuffer)

		if (format === 'svg') {
			const text = fileBuffer.toString('utf-8')
			fileBuffer = Buffer.from(sanitizeSvg(text), 'utf-8')
		}
	}

	// Upload to Supabase Storage
	const storagePath = `${user.id}/${name}.${format}`
	const mimeType =
		format === 'svg' ? 'image/svg+xml'
		: format === 'png' ? 'image/png'
		: 'image/jpeg'

	const { error: storageError } = await supabase.storage
		.from('user-icons')
		.upload(storagePath, fileBuffer, {
			contentType: mimeType,
			upsert: true,
		})

	if (storageError) {
		console.error('[icons] Supabase storage upload error:', storageError)
		return NextResponse.json(
			{ error: 'Failed to upload file', detail: storageError.message },
			{ status: 500 },
		)
	}

	const {
		data: { publicUrl },
	} = supabase.storage.from('user-icons').getPublicUrl(storagePath)

	// Insert into DB
	try {
		const [row] = await db
			.insert(userIcons)
			.values({
				userId: user.id,
				name,
				url: publicUrl,
				format,
				fileSize: fileBuffer.length,
			})
			.returning({
				id: userIcons.id,
				name: userIcons.name,
				url: userIcons.url,
				format: userIcons.format,
			})

		return NextResponse.json(row, { status: 201 })
	} catch (err: unknown) {
		// Unique constraint violation
		if (err instanceof Error && err.message.includes('unique')) {
			return NextResponse.json(
				{ error: `Icon "${name}" already exists` },
				{ status: 409 },
			)
		}
		throw err
	}
}
