import type { OutputFormat } from '../../core/renderer.js'

export type ErrorClass =
	| 'cli_argument'
	| 'frontmatter_parse'
	| 'validation'
	| 'tag_composition'
	| 'template_variable'
	| 'browser_launch'
	| 'pdf_render'
	| 'docx_convert'
	| 'file_io'
	| 'dependency_missing'
	| 'unknown'

export interface RenderSuccessProperties {
	formats: OutputFormat[]
	duration_ms: number
	view_count: number
	version: string
	os: string
	node_version: string
}

export interface RenderFailureProperties {
	error_class: ErrorClass
	version: string
	os: string
	node_version: string
}

export type TelemetryEvent =
	| { event: 'cli_render_success'; properties: RenderSuccessProperties }
	| { event: 'cli_render_failure'; properties: RenderFailureProperties }

export function classifyError(error: unknown): ErrorClass {
	const msg =
		error instanceof Error ?
			error.message.toLowerCase()
		:	String(error).toLowerCase()

	if (
		msg.includes('invalid --')
		|| msg.includes('must be a positive integer')
		|| msg.includes('cannot be used with')
		|| msg.includes('expected key=value')
	)
		return 'cli_argument'
	if (msg.includes('frontmatter') || msg.includes('yaml'))
		return 'frontmatter_parse'
	if (msg.includes('validation failed')) return 'validation'
	if (msg.includes('tag') && msg.includes('composition'))
		return 'tag_composition'
	if (msg.includes('template') || msg.includes('variable'))
		return 'template_variable'
	if (
		msg.includes('browser')
		|| msg.includes('chromium')
		|| msg.includes('playwright')
	)
		return 'browser_launch'
	if (msg.includes('pdf2docx') || msg.includes('docx')) return 'docx_convert'
	if (msg.includes('pdf')) return 'pdf_render'
	if (
		msg.includes('enoent')
		|| msg.includes('not found')
		|| msg.includes('no such file')
	)
		return 'file_io'
	if (msg.includes('dependency') || msg.includes('not installed'))
		return 'dependency_missing'

	return 'unknown'
}
