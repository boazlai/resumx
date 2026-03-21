import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_MESSAGE_LEN = 2000
const MAX_CONTEXT_LEN = 60_000

export async function POST(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = await request.json().catch(() => ({}))
	const { message, context, selection, mode, sessionId } = body

	if (!message || typeof message !== 'string') {
		return NextResponse.json({ error: 'Missing message' }, { status: 400 })
	}

	if (message.length > MAX_MESSAGE_LEN) {
		return NextResponse.json(
			{ error: 'Message too long (2000 chars max)' },
			{ status: 413 },
		)
	}

	if (
		context
		&& typeof context === 'string'
		&& context.length > MAX_CONTEXT_LEN
	) {
		return NextResponse.json(
			{ error: 'Context too large (60KB max)' },
			{ status: 413 },
		)
	}

	const webhookUrl = process.env.N8N_WEBHOOK_URL
	if (!webhookUrl) {
		return NextResponse.json(
			{ error: 'AI chat is not configured on this server' },
			{ status: 503 },
		)
	}

	const webhookSecret = process.env.N8N_WEBHOOK_SECRET

	try {
		const upstream = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'text/event-stream',
				...(webhookSecret ? { 'X-Webhook-Secret': webhookSecret } : {}),
			},
			body: JSON.stringify({
				message,
				context: context ?? '',
				selection: selection ?? null,
				mode: mode ?? 'edit',
				sessionId: typeof sessionId === 'string' ? sessionId : undefined,
			}),
		})

		if (!upstream.ok) {
			return NextResponse.json(
				{ error: `Upstream AI service error (${upstream.status})` },
				{ status: 502 },
			)
		}

		const upstreamBody = upstream.body
		if (!upstreamBody) {
			return NextResponse.json(
				{ error: 'Empty response from AI service' },
				{ status: 502 },
			)
		}

		const contentType = upstream.headers.get('content-type') ?? ''

		// n8n AI agent nodes stream NDJSON (application/json, chunked transfer),
		// where each line is a JSON object: { type: "begin"|"item"|"end", content?, metadata }
		// Transform that into SSE for the browser.
		if (!contentType.includes('text/event-stream')) {
			const { readable, writable } = new TransformStream<
				Uint8Array,
				Uint8Array
			>()
			const writer = writable.getWriter()
			const encoder = new TextEncoder()
			const decoder = new TextDecoder()

			;(async () => {
				const reader = upstreamBody.getReader()
				let buffer = ''
				try {
					while (true) {
						const { done, value } = await reader.read()
						if (done) break
						buffer += decoder.decode(value, { stream: true })
						const lines = buffer.split('\n')
						buffer = lines.pop() ?? ''
						for (const line of lines) {
							const trimmed = line.trim()
							if (!trimmed) continue
							try {
								const obj = JSON.parse(trimmed)
								if (obj.type === 'item' && obj.content) {
									await writer.write(
										encoder.encode(
											`data: ${JSON.stringify({ content: String(obj.content) })}\n\n`,
										),
									)
								}
							} catch {
								// not JSON — skip
							}
						}
					}
					// flush any remaining buffered text
					if (buffer.trim()) {
						try {
							const obj = JSON.parse(buffer.trim())
							if (obj.type === 'item' && obj.content) {
								await writer.write(
									encoder.encode(
										`data: ${JSON.stringify({ content: String(obj.content) })}\n\n`,
									),
								)
							}
						} catch {}
					}
				} finally {
					await writer.write(encoder.encode('data: [DONE]\n\n'))
					await writer.close()
				}
			})()

			return new Response(readable, {
				headers: {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache, no-store',
					Connection: 'keep-alive',
					'X-Accel-Buffering': 'no',
				},
			})
		}

		// n8n returned a native SSE stream — pipe it straight through.
		return new Response(upstreamBody, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache, no-store',
				Connection: 'keep-alive',
				// Disable Nginx/Vercel response buffering so chunks arrive immediately
				'X-Accel-Buffering': 'no',
			},
		})
	} catch {
		return NextResponse.json(
			{ error: 'Failed to reach AI service' },
			{ status: 503 },
		)
	}
}
