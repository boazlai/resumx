import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_LINKEDIN_BYTES = 10 * 1024 * 1024 // 10 MB decoded

interface GitHubProfile {
	name: string | null
	email: string | null
	bio: string | null
	location: string | null
	blog: string | null
	login: string
}

interface GitHubRepo {
	name: string
	description: string | null
	language: string | null
	topics: string[]
	homepage: string | null
	html_url: string
	stargazers_count: number
	languages: Record<string, number>
}

export async function POST(request: Request) {
	// 1. Auth check
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	// 2. Get GitHub provider token from session (never trust client-supplied tokens)
	const {
		data: { session },
	} = await supabase.auth.getSession()
	const githubToken = session?.provider_token ?? undefined

	// 3. Parse body (LinkedIn only — no tokens)
	let body: Record<string, unknown>
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
	}

	const linkedinFile =
		typeof body.linkedinFile === 'string' ? body.linkedinFile : undefined
	const linkedinFilename =
		typeof body.linkedinFilename === 'string' ?
			body.linkedinFilename
		:	undefined

	// 4. Validate: at least one source
	if (!githubToken && !linkedinFile) {
		return NextResponse.json(
			{ error: 'At least one source (GitHub or LinkedIn) is required' },
			{ status: 400 },
		)
	}

	// 5. Validate LinkedIn file
	if (linkedinFile) {
		if (!linkedinFilename?.toLowerCase().endsWith('.pdf')) {
			return NextResponse.json(
				{ error: 'LinkedIn file must be a PDF' },
				{ status: 400 },
			)
		}
		// base64 is ~4/3 the decoded size — check approximate decoded size
		const approxBytes = Math.ceil((linkedinFile.length * 3) / 4)
		if (approxBytes > MAX_LINKEDIN_BYTES) {
			return NextResponse.json(
				{ error: 'LinkedIn PDF must be under 10 MB' },
				{ status: 400 },
			)
		}
	}

	// 6. Fetch GitHub data if token provided
	let github: { profile: GitHubProfile; repos: GitHubRepo[] } | undefined

	if (githubToken) {
		try {
			const headers = {
				Authorization: `Bearer ${githubToken}`,
				Accept: 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28',
				'User-Agent': 'Resumx',
			}

			const [profileRes, reposRes] = await Promise.all([
				fetch('https://api.github.com/user', { headers }),
				fetch(
					'https://api.github.com/user/repos?sort=updated&per_page=20&type=owner',
					{ headers },
				),
			])

			if (!profileRes.ok || !reposRes.ok) {
				return NextResponse.json(
					{
						error:
							'Failed to fetch GitHub data. Please reconnect and try again.',
					},
					{ status: 400 },
				)
			}

			const profileData = (await profileRes.json()) as Record<string, unknown>
			const reposData = (await reposRes.json()) as Record<string, unknown>[]

			// Filter forks, sort by stars descending, take top 8
			const filtered = reposData
				.filter(r => !r.fork)
				.sort(
					(a, b) =>
						((b.stargazers_count as number) ?? 0)
						- ((a.stargazers_count as number) ?? 0),
				)
				.slice(0, 8)

			// Fetch languages for each repo in parallel
			const repos = await Promise.all(
				filtered.map(async repo => {
					const langRes = await fetch(repo.languages_url as string, { headers })
					const languages: Record<string, number> =
						langRes.ok ? ((await langRes.json()) as Record<string, number>) : {}
					return {
						name: repo.name as string,
						description: (repo.description as string | null) ?? null,
						language: (repo.language as string | null) ?? null,
						topics: (repo.topics as string[]) ?? [],
						homepage: (repo.homepage as string | null) ?? null,
						html_url: repo.html_url as string,
						stargazers_count: (repo.stargazers_count as number) ?? 0,
						languages,
					} satisfies GitHubRepo
				}),
			)

			github = {
				profile: {
					name: (profileData.name as string | null) ?? null,
					email: (profileData.email as string | null) ?? null,
					bio: (profileData.bio as string | null) ?? null,
					location: (profileData.location as string | null) ?? null,
					blog: (profileData.blog as string | null) ?? null,
					login: profileData.login as string,
				},
				repos,
			}
		} catch {
			return NextResponse.json(
				{ error: 'Failed to fetch GitHub data' },
				{ status: 502 },
			)
		}
	}

	// 7. Check n8n config
	const webhookUrl = process.env.N8N_PROFILE_IMPORT_WEBHOOK_URL?.trim()
	const webhookSecret = process.env.N8N_WEBHOOK_SECRET?.trim()
	if (!webhookUrl || !webhookSecret) {
		console.error(
			'n8n config missing — webhookUrl:',
			!!webhookUrl,
			'webhookSecret:',
			!!webhookSecret,
		)
		return NextResponse.json(
			{ error: 'Import service is not configured' },
			{ status: 503 },
		)
	}
	console.log(
		'n8n call — url:',
		webhookUrl,
		'secret length:',
		webhookSecret.length,
		'secret prefix:',
		webhookSecret.slice(0, 4) + '...',
	)

	// 8. Assemble n8n payload
	const payload: {
		github?: { profile: GitHubProfile; repos: GitHubRepo[] }
		linkedin?: { file: string; filename: string }
	} = {}
	if (github) payload.github = github
	if (linkedinFile && linkedinFilename) {
		payload.linkedin = { file: linkedinFile, filename: linkedinFilename }
	}

	// 9. Call n8n webhook
	try {
		const n8nRes = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Webhook-Secret': webhookSecret,
			},
			body: JSON.stringify(payload),
		})

		if (!n8nRes.ok) {
			const body = await n8nRes.text().catch(() => '')
			console.error('n8n webhook returned', n8nRes.status, body)
			return NextResponse.json(
				{ error: 'Import failed. Please try again.' },
				{ status: 502 },
			)
		}

		const result = (await n8nRes.json()) as Record<string, unknown>
		if (typeof result.markdown !== 'string') {
			return NextResponse.json(
				{ error: 'Unexpected response from import service' },
				{ status: 502 },
			)
		}

		return NextResponse.json({ markdown: result.markdown })
	} catch {
		return NextResponse.json(
			{ error: 'Could not reach import service' },
			{ status: 502 },
		)
	}
}
