// Centralized in-memory rate limiter.
// For persistent rate limiting across serverless cold starts, replace with
// Upstash Redis: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview/
//
// Usage:
//   rateLimit(`preview:${userId}`, { limit: 1, windowMs: 2_000 })
//   rateLimit(`forgot-password:${ip}`, { limit: 5, windowMs: 60 * 60_000 })

interface Window {
	count: number
	resetAt: number
}

const store = new Map<string, Window>()

export function rateLimit(
	key: string,
	{ limit, windowMs }: { limit: number; windowMs: number },
): { limited: boolean } {
	const now = Date.now()
	const window = store.get(key)

	if (!window || now >= window.resetAt) {
		store.set(key, { count: 1, resetAt: now + windowMs })
		return { limited: false }
	}

	if (window.count >= limit) {
		return { limited: true }
	}

	window.count++
	return { limited: false }
}
