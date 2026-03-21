import { createClient } from '@/lib/supabase/server'
import { OpenRouter } from '@openrouter/sdk'
import { NextResponse } from 'next/server'

export const maxDuration = 30

const NOT_A_RESUME_PREFIX = 'NOT_A_RESUME'
const NOT_A_RESUME_MESSAGE =
	'This document is not a resume. Please upload a resume.'

const SYSTEM_PROMPT = `You convert resumes into Resumx Markdown. Output ONLY the Markdown, no explanations or code fences.

## When to refuse

If the document is clearly NOT a resume (e.g. recipe, article, blog post, cover letter, form letter, invoice, contract), do not convert it. Output exactly on the first line:
${NOT_A_RESUME_PREFIX}
Do not add any explanation or reason after it.

## Your job

Translate the FORMAT, not reorganize the CONTENT. Preserve the user's structure exactly:
- Keep their section order (if Work comes before Education, keep it that way)
- Keep their date format (don't normalize "January 2020" to "Jan 2020")
- Keep their entry ordering (if job title comes before company, preserve that)
- Keep their contact info style and delimiter
- Keep their bullet wording verbatim
- Keep their section names (don't rename "Professional Experience" to "Work Experience")

The only thing you change is the markup syntax.

## Resumx Markdown Syntax Reference

Frontmatter:
\`\`\`
---
pages: 1 or 2
---
\`\`\`

Set \`pages: 2\` when the resume has 5+ work entries, or 20+ bullet points, or clearly dense content that would overflow a single page. Otherwise use \`pages: 1\`.

Name (always H1):
\`# Full Name\`

Contact line (pipe-separated, links where appropriate):
\`[email](mailto:email) | [linkedin.com/in/user](https://linkedin.com/in/user) | Location\`

Section headings (H2):
\`## Section Name\`

Entries (H3 with \`||\` for right-aligned content like dates):
\`### Company Name || Jan 2020 - Present\`

Subtitles (italic with \`||\` for right-aligned content like location):
\`_Job Title_ || San Francisco, CA\`

Bullets:
\`- Achievement text\`

Skills as definition lists:
\`\`\`
Languages
: JavaScript, TypeScript, Python
\`\`\`

## Key syntax rules

- \`||\` splits a line into left/right columns. Use for dates, locations, or any right-aligned text.
- \`_text_\` for italic (roles, degrees). Use underscores, not asterisks.
- Links: \`[display](url)\`, email: \`[x@y.com](mailto:x@y.com)\`, phone: \`[num](tel:num)\`
- Always include \`pages\` in frontmatter. Choose 1 or 2 based on content density (see above).
`

async function convertWithAI(
	filename: string,
	buffer: Buffer,
): Promise<string> {
	const ext = filename.split('.').pop()?.toLowerCase()
	const webhookSecret = process.env['N8N_WEBHOOK_SECRET']
	let raw: string

	if (ext === 'pdf') {
		const webhookUrl = process.env['N8N_RESUME_PDF_IMPORT_WEBHOOK_URL']
		if (!webhookUrl)
			throw new Error('N8N_RESUME_PDF_IMPORT_WEBHOOK_URL not configured')

		const formData = new FormData()
		formData.append(
			'data',
			new Blob([new Uint8Array(buffer)], { type: 'application/pdf' }),
			filename,
		)

		const res = await fetch(webhookUrl, {
			method: 'POST',
			headers: webhookSecret ? { 'X-Webhook-Secret': webhookSecret } : {},
			body: formData,
		})
		if (!res.ok) throw new Error(`PDF import webhook failed: ${res.status}`)
		const data = await res.json()
		raw = data.markdown as string
	} else if (ext === 'docx') {
		const webhookUrl = process.env['N8N_RESUME_DOCX_IMPORT_WEBHOOK_URL']
		if (!webhookUrl)
			throw new Error('N8N_RESUME_DOCX_IMPORT_WEBHOOK_URL not configured')

		const mammoth = await import('mammoth')
		const result = await mammoth.convertToHtml({ buffer })

		const res = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(webhookSecret ? { 'X-Webhook-Secret': webhookSecret } : {}),
			},
			body: JSON.stringify({ html: result.value, filename }),
		})
		if (!res.ok) throw new Error(`DOCX import webhook failed: ${res.status}`)
		const data = await res.json()
		raw = data.markdown as string
	} else {
		const apiKey = process.env['OPENROUTER_API_KEY']
		if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')
		const model =
			process.env['OPENROUTER_CHAT_MODEL'] ?? 'google/gemini-2.0-flash-001'

		const client = new OpenRouter({ apiKey })
		const response = await client.chat.send({
			model,
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{
					role: 'user',
					content: `Convert this resume to Resumx Markdown:\n\n${buffer.toString('utf-8')}`,
				},
			],
			temperature: 0.1,
			maxTokens: 4096,
		})

		const rawResponse = response.choices?.[0]?.message?.content
		if (!rawResponse) throw new Error('AI returned empty response')
		raw =
			typeof rawResponse === 'string' ? rawResponse : (
				rawResponse
					.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
					.map(p => p.text)
					.join('')
			)
	}

	const trimmed = raw
		.replace(/^```\w*\n/, '')
		.replace(/\n```$/, '')
		.trim()

	if (trimmed.toUpperCase().startsWith(NOT_A_RESUME_PREFIX)) {
		throw Object.assign(new Error(NOT_A_RESUME_MESSAGE), {
			isNotResume: true,
		})
	}

	return trimmed
}

export async function POST(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = await request.json().catch(() => ({}))
	const { file, filename } = body

	if (
		!file
		|| !filename
		|| typeof file !== 'string'
		|| typeof filename !== 'string'
	) {
		return NextResponse.json(
			{ error: 'Missing file or filename' },
			{ status: 400 },
		)
	}

	// 5MB max
	if (file.length > 7 * 1024 * 1024) {
		return NextResponse.json(
			{ error: 'File too large (5MB max)' },
			{ status: 413 },
		)
	}

	const ext = filename.split('.').pop()?.toLowerCase()
	const allowed = ['pdf', 'docx', 'tex', 'json', 'yaml', 'yml']
	if (!ext || !allowed.includes(ext)) {
		return NextResponse.json(
			{
				error:
					'Unsupported file type. Accepted: PDF, DOCX, LaTeX, JSON Resume, YAML',
			},
			{ status: 400 },
		)
	}

	try {
		const buffer = Buffer.from(file, 'base64')
		const markdown = await convertWithAI(filename, buffer)
		return NextResponse.json({ markdown })
	} catch (err) {
		const e = err as { isNotResume?: boolean; message?: string }
		if (e.isNotResume) {
			return NextResponse.json(
				{ error: e.message ?? NOT_A_RESUME_MESSAGE },
				{ status: 400 },
			)
		}
		return NextResponse.json(
			{ error: e.message ?? 'Conversion failed' },
			{ status: 500 },
		)
	}
}
