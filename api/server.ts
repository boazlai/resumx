/**
 * Local development server for the resumx API.
 * Wraps the Vercel handler so you can run it without deploying.
 *
 * Usage:
 *   pnpm --filter @resumx/api dev
 *
 * Then set RESUMX_API_URL=http://localhost:3000 in web/.env.local
 */
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from 'node:http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './preview.js'

const port = parseInt(process.env.PORT ?? '3000', 10)

/** Patch a plain IncomingMessage into the shape VercelRequest expects. */
function asVercelRequest(req: IncomingMessage, body: unknown): VercelRequest {
	return Object.assign(req, {
		body,
		query: {},
		cookies: {},
	}) as VercelRequest
}

/** Patch a plain ServerResponse into the shape VercelResponse expects. */
function asVercelResponse(res: ServerResponse): VercelResponse {
	const vRes = res as unknown as VercelResponse
	vRes.status = (code: number) => {
		res.statusCode = code
		return vRes
	}
	vRes.json = (data: unknown) => {
		res.setHeader('Content-Type', 'application/json')
		res.end(JSON.stringify(data))
		return vRes
	}
	vRes.send = (body: unknown) => {
		res.end(body)
		return vRes
	}
	return vRes
}

createServer((req, res) => {
	// CORS preflight
	if (req.method === 'OPTIONS') {
		res.writeHead(204, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		})
		res.end()
		return
	}

	if (req.method === 'POST' && req.url?.startsWith('/api/preview')) {
		const chunks: Buffer[] = []
		req.on('data', (chunk: Buffer) => chunks.push(chunk))
		req.on('end', () => {
			try {
				const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
				handler(asVercelRequest(req, body), asVercelResponse(res))
			} catch {
				res.writeHead(400, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ error: 'Invalid JSON body' }))
			}
		})
		return
	}

	res.writeHead(404, { 'Content-Type': 'application/json' })
	res.end(JSON.stringify({ error: 'Not found' }))
}).listen(port, () => {
	console.log(
		`\x1b[32m✓\x1b[0m resumx API server listening at http://localhost:${port}`,
	)
})
