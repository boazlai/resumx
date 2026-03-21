// This route was removed. Thumbnail generation now uses
// POST /api/resume/[id]/thumbnail (server-side screenshot via Playwright).
export {}

// GET /api/resume/[id]/pdf — render resume to PDF (used for card thumbnails)
export async function GET(_req: Request, { params }: Params) {
	const { id } = await params
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const [row] = await db
		.select({ markdown: resumes.markdown })
		.from(resumes)
		.where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
		.limit(1)

	if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

	const resumxBaseUrl = (
		process.env.RESUMX_API_URL ?? 'https://resumx.dev'
	).replace(/\/$/, '')

	const response = await fetch(`${resumxBaseUrl}/api/preview`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ markdown: row.markdown }),
	})

	if (!response.ok) {
		return NextResponse.json({ error: 'Render failed' }, { status: 502 })
	}

	const pdfBuffer = await response.arrayBuffer()

	return new Response(pdfBuffer, {
		status: 200,
		headers: {
			'Content-Type': 'application/pdf',
			// Cache for 5 minutes; invalidated naturally when the user saves and refreshes
			'Cache-Control': 'private, max-age=300',
		},
	})
}
