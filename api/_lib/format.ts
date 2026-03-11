export type InputFormat =
	| 'json-resume'
	| 'rendercv'
	| 'reactive-resume'
	| 'yaml-resume'
	| 'pdf'
	| 'docx'
	| 'latex'

export function detectFormat(
	filename: string,
	content: string | Buffer,
): InputFormat | null {
	const ext = filename.split('.').pop()?.toLowerCase()

	if (ext === 'pdf') return 'pdf'
	if (ext === 'docx') return 'docx'
	if (ext === 'tex') return 'latex'

	if (ext === 'json') {
		try {
			const data: unknown = JSON.parse(
				typeof content === 'string' ? content : content.toString('utf-8'),
			)
			if (
				data
				&& typeof data === 'object'
				&& ('basics' in data || 'work' in data || 'education' in data)
			) {
				return 'json-resume'
			}
			if (
				data
				&& typeof data === 'object'
				&& 'sections' in data
				&& 'metadata' in data
			) {
				return 'reactive-resume'
			}
		} catch {
			return null
		}
	}

	if (ext === 'yaml' || ext === 'yml') {
		const text =
			typeof content === 'string' ? content : content.toString('utf-8')
		if (/^(cv|rendercv)\s*:/m.test(text)) {
			return 'rendercv'
		}
		if (/^resume\s*:/m.test(text)) {
			return 'yaml-resume'
		}
	}

	if (
		typeof content === 'string'
		|| (Buffer.isBuffer(content) && ext === 'tex')
	) {
		const text =
			typeof content === 'string' ? content : content.toString('utf-8')
		if (
			text.includes('\\documentclass')
			|| text.includes('\\begin{document}')
		) {
			return 'latex'
		}
	}

	return null
}
