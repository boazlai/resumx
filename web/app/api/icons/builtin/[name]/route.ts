import { NextResponse } from 'next/server'
import * as fs from 'node:fs'
import * as path from 'node:path'

type Params = { params: Promise<{ name: string }> }

const ICONS_DIR = path.resolve(process.cwd(), '..', 'assets', 'icons')

// GET /api/icons/builtin/[name] — serve a built-in SVG icon
export async function GET(_req: Request, { params }: Params) {
	const { name } = await params

	// Sanitize: only allow safe filenames (a-z0-9, hyphens, underscores)
	if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) {
		return NextResponse.json({ error: 'Invalid icon name' }, { status: 400 })
	}

	const filePath = path.join(ICONS_DIR, `${name}.svg`)

	// Prevent traversal
	if (!filePath.startsWith(ICONS_DIR)) {
		return NextResponse.json({ error: 'Invalid icon name' }, { status: 400 })
	}

	try {
		const svg = fs.readFileSync(filePath, 'utf-8')
		return new NextResponse(svg, {
			status: 200,
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		})
	} catch {
		return NextResponse.json({ error: 'Icon not found' }, { status: 404 })
	}
}
