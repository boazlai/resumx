import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { userIcons } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/icons/[id]
export async function DELETE(_req: Request, { params }: Params) {
	const { id } = await params
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const [row] = await db
		.select()
		.from(userIcons)
		.where(and(eq(userIcons.id, id), eq(userIcons.userId, user.id)))
		.limit(1)

	if (!row) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}

	// Delete from Supabase Storage
	const storagePath = `${user.id}/${row.name}.${row.format}`
	await supabase.storage.from('user-icons').remove([storagePath])

	// Delete from DB
	await db
		.delete(userIcons)
		.where(and(eq(userIcons.id, id), eq(userIcons.userId, user.id)))

	return new NextResponse(null, { status: 204 })
}
