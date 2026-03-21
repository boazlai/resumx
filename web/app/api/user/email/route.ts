import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const body = await request.json()
	const email = body?.email

	if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
		return NextResponse.json(
			{ error: 'Invalid email address' },
			{ status: 400 },
		)
	}

	const { error } = await supabase.auth.updateUser({
		email: email.trim().toLowerCase(),
	})

	if (error) return NextResponse.json({ error: error.message }, { status: 400 })
	return NextResponse.json({ success: true })
}
