import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { userPreferences } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const DEFAULTS = {
	defaultFont: null,
	autoSave: true,
	autoSaveInterval: 10,
	autoCompile: true,
	linkedinUrl: null,
	githubUrl: null,
}

export async function GET() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const [row] = await db
		.select()
		.from(userPreferences)
		.where(eq(userPreferences.userId, user.id))
		.limit(1)

	return NextResponse.json(row ?? { ...DEFAULTS, userId: user.id })
}

export async function PATCH(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const body = await request.json()

	// Whitelist allowed fields
	const update: Partial<{
		defaultFont: string | null
		autoSave: boolean
		autoSaveInterval: number
		autoCompile: boolean
		linkedinUrl: string | null
		githubUrl: string | null
	}> = {}
	if ('defaultFont' in body) update.defaultFont = body.defaultFont ?? null
	if ('autoSave' in body) update.autoSave = Boolean(body.autoSave)
	if ('autoSaveInterval' in body)
		update.autoSaveInterval = Number(body.autoSaveInterval)
	if ('autoCompile' in body) update.autoCompile = Boolean(body.autoCompile)
	if ('linkedinUrl' in body)
		update.linkedinUrl =
			typeof body.linkedinUrl === 'string' ?
				body.linkedinUrl.slice(0, 500)
			:	null
	if ('githubUrl' in body)
		update.githubUrl =
			typeof body.githubUrl === 'string' ? body.githubUrl.slice(0, 500) : null

	await db
		.insert(userPreferences)
		.values({ userId: user.id, ...update })
		.onConflictDoUpdate({
			target: userPreferences.userId,
			set: { ...update, updatedAt: new Date() },
		})

	return NextResponse.json({ success: true })
}
