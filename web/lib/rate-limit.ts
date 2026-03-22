import { Redis } from '@upstash/redis'

interface Window {
	count: number
	resetAt: number
}

type RateLimitOptions = {
	limit: number
	windowMs: number
}

export type RateLimitResult = {
	limited: boolean
	remaining: number
	resetAt: number
	retryAfter: number
}

const PREFIX = 'rate-limit'
const memoryStore = new Map<string, Window>()

let redisClient: Redis | null | undefined
let warnedMissingRedis = false
let warnedRedisError = false

function warnOnce(kind: 'missing' | 'error', message: string) {
	if (kind === 'missing') {
		if (warnedMissingRedis) return
		warnedMissingRedis = true
	} else {
		if (warnedRedisError) return
		warnedRedisError = true
	}
	console.warn(message)
}

function getRedisClient() {
	if (redisClient !== undefined) return redisClient

	const url = process.env.UPSTASH_REDIS_REST_URL
	const token = process.env.UPSTASH_REDIS_REST_TOKEN

	if (!url || !token) {
		warnOnce(
			'missing',
			'[rate-limit] Upstash Redis env vars are not configured. Falling back to in-memory rate limiting.',
		)
		redisClient = null
		return redisClient
	}

	redisClient = new Redis({ url, token })
	return redisClient
}

function memoryRateLimit(
	key: string,
	{ limit, windowMs }: RateLimitOptions,
): RateLimitResult {
	const now = Date.now()
	const window = memoryStore.get(key)

	if (!window || now >= window.resetAt) {
		const resetAt = now + windowMs
		memoryStore.set(key, { count: 1, resetAt })
		return {
			limited: false,
			remaining: Math.max(0, limit - 1),
			resetAt,
			retryAfter: Math.ceil(windowMs / 1000),
		}
	}

	if (window.count >= limit) {
		const ttlMs = Math.max(0, window.resetAt - now)
		return {
			limited: true,
			remaining: 0,
			resetAt: window.resetAt,
			retryAfter: Math.ceil(ttlMs / 1000),
		}
	}

	window.count++
	const ttlMs = Math.max(0, window.resetAt - now)
	return {
		limited: false,
		remaining: Math.max(0, limit - window.count),
		resetAt: window.resetAt,
		retryAfter: Math.ceil(ttlMs / 1000),
	}
}

async function redisRateLimit(
	key: string,
	{ limit, windowMs }: RateLimitOptions,
): Promise<RateLimitResult> {
	const redis = getRedisClient()
	if (!redis) return memoryRateLimit(key, { limit, windowMs })

	const namespacedKey = `${PREFIX}:${key}`
	const now = Date.now()

	try {
		const count = await redis.incr(namespacedKey)
		if (count === 1) {
			await redis.pexpire(namespacedKey, windowMs)
		}

		let ttlMs = await redis.pttl(namespacedKey)
		if (ttlMs < 0) {
			await redis.pexpire(namespacedKey, windowMs)
			ttlMs = windowMs
		}

		return {
			limited: count > limit,
			remaining: Math.max(0, limit - count),
			resetAt: now + ttlMs,
			retryAfter: Math.ceil(ttlMs / 1000),
		}
	} catch (error) {
		warnOnce(
			'error',
			`[rate-limit] Redis rate limiting failed. Falling back to in-memory storage. ${error instanceof Error ? error.message : ''}`,
		)
		return memoryRateLimit(key, { limit, windowMs })
	}
}

export async function rateLimit(
	key: string,
	options: RateLimitOptions,
): Promise<RateLimitResult> {
	return redisRateLimit(key, options)
}
