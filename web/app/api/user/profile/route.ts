import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	return NextResponse.json({
		name: user.user_metadata?.full_name ?? '',
		email: user.email ?? '',
		identities: (user.identities ?? []).map(i => ({
			provider: i.provider,
			id: i.id,
			identityId: i.identity_id,
		})),
	})
}

export async function PATCH(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	const body = await request.json()
	const name = body?.name

	if (typeof name !== 'string' || name.length > 100) {
		return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
	}

	const { error } = await supabase.auth.updateUser({
		data: { full_name: name.trim() },
	})

	if (error) return NextResponse.json({ error: error.message }, { status: 400 })
	return NextResponse.json({ success: true })
}
