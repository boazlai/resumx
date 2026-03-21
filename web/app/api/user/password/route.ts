import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

	// Password change is only available if the user has an email/password identity
	const hasEmailProvider = user.identities?.some(i => i.provider === 'email')
	if (!hasEmailProvider) {
		return NextResponse.json(
			{ error: 'No password set — sign in with OAuth' },
			{ status: 400 },
		)
	}

	const body = await request.json()
	const { currentPassword, newPassword } = body ?? {}

	if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
		return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
	}
	if (newPassword.length < 8) {
		return NextResponse.json(
			{ error: 'New password must be at least 8 characters' },
			{ status: 400 },
		)
	}

	// Verify current password using a stateless anon client (no cookie jar)
	const verifyClient = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{ cookies: { getAll: () => [], setAll: () => {} } },
	)
	const { error: verifyError } = await verifyClient.auth.signInWithPassword({
		email: user.email!,
		password: currentPassword,
	})
	if (verifyError) {
		return NextResponse.json(
			{ error: 'Current password is incorrect' },
			{ status: 400 },
		)
	}

	const { error } = await supabase.auth.updateUser({ password: newPassword })
	if (error) return NextResponse.json({ error: error.message }, { status: 400 })

	return NextResponse.json({ success: true })
}
