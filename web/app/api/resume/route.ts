import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

// GET /api/resume — list all resumes for the current user
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
			id: resumes.id,
			title: resumes.title,
			createdAt: resumes.createdAt,
			updatedAt: resumes.updatedAt,
		})
		.from(resumes)
		.where(eq(resumes.userId, user.id))
		.orderBy(resumes.updatedAt)

	return NextResponse.json(rows)
}

// POST /api/resume — create a new resume
export async function POST(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = await request.json().catch(() => ({}))
	const title =
		typeof body.title === 'string' ?
			body.title.slice(0, 200)
		:	'Untitled Resume'
	const markdown =
		typeof body.markdown === 'string' ? body.markdown : DEFAULT_TEMPLATE

	const [row] = await db
		.insert(resumes)
		.values({ userId: user.id, title, markdown })
		.returning()

	return NextResponse.json(row, { status: 201 })
}

const DEFAULT_TEMPLATE = `---
pages: 1
---

# Your Name

[email@example.com](mailto:email@example.com) | [linkedin.com/in/yourname](https://linkedin.com/in/yourname) | [github.com/yourname](https://github.com/yourname)

## Work Experience

### Company Name || Month Year – Present

*Job Title* || City, State

- Describe your impact here with a quantified achievement
- Another bullet point about what you built or improved

## Education

### University Name || Graduation Year

**Degree, Major** || City, State

- GPA, honors, relevant coursework

## Projects

### Project Name

- Built X using Y, resulting in Z
- [GitHub](https://github.com)

## Technical Skills

Languages
: TypeScript, Python, Go

Frameworks
: React, Node.js, Next.js

Tools
: Git, Docker, AWS
`
