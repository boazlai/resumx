import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request })

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll()
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					)
					supabaseResponse = NextResponse.next({ request })
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					)
				},
			},
		},
	)

	// IMPORTANT: Avoid writing any logic between createServerClient and
	// supabase.auth.getUser() — a simple mistake will make your session unreliable.
	const {
		data: { user },
	} = await supabase.auth.getUser()

	const { pathname } = request.nextUrl

	// Protect dashboard and editor routes
	if (
		!user
		&& (pathname.startsWith('/dashboard') || pathname.startsWith('/resume'))
	) {
		const url = request.nextUrl.clone()
		url.pathname = '/sign-in'
		return NextResponse.redirect(url)
	}

	// Redirect authenticated users away from auth pages
	if (user && (pathname === '/sign-in' || pathname === '/sign-up')) {
		const url = request.nextUrl.clone()
		url.pathname = '/dashboard'
		return NextResponse.redirect(url)
	}

	return supabaseResponse
}
