interface TurnstileResponse {
	success: boolean
	'error-codes'?: string[]
	challenge_ts?: string
	hostname?: string
}

export async function verifyTurnstile(token: string): Promise<boolean> {
	const secret = process.env['TURNSTILE_SECRET_KEY']
	if (!secret) {
		if (process.env['VERCEL_ENV'] === 'production') {
			console.error('TURNSTILE_SECRET_KEY not set in production')
			return false
		}
		console.warn('TURNSTILE_SECRET_KEY not set, skipping verification')
		return true
	}

	const res = await fetch(
		'https://challenges.cloudflare.com/turnstile/v0/siteverify',
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ secret, response: token }),
		},
	)

	if (!res.ok) {
		console.error(`Turnstile API error: ${res.status}`)
		return false
	}

	const data = (await res.json()) as TurnstileResponse
	if (!data.success) {
		console.warn('Turnstile rejected:', data['error-codes'])
	}
	return data.success
}
