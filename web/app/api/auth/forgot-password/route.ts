import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
	// IP-based rate limit: 5 requests per IP per hour to prevent email bombing
	const ip =
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
		?? request.headers.get('x-real-ip')
		?? 'unknown'

	const { limited } = await rateLimit(`forgot-password:${ip}`, {
		limit: 5,
		windowMs: 60 * 60_000,
	})

	if (limited) {
		// Return 200 so the client sees "Check your inbox" — don't reveal rate limiting
		// to prevent timing-based enumeration or user confusion.
		return NextResponse.json({ ok: true })
	}

	const body = await request.json().catch(() => ({}))
	const email = typeof body?.email === 'string' ? body.email.trim() : ''

	if (!email) {
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
	}

	const origin = new URL(request.url).origin
	const supabase = await createClient()

	await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${origin}/auth/reset-password`,
	})

	// Always 200 — don't reveal whether this email address exists in the system
	return NextResponse.json({ ok: true })
}
