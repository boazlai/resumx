import type { ShikiTransformer } from 'shiki'

export function transformerResumxSyntax(): ShikiTransformer {
	return {
		name: 'resumx-syntax',
		preprocess(code, options) {
			if (options.lang !== 'markdown' && options.lang !== 'md') return
			options.decorations ||= []

			const matched = new Set<string>()

			// 1) [text]{.attrs} — dim [ ] { } brackets, italic inner attr text
			for (const m of code.matchAll(/(\[)([^\]]*)(\])\{([^}]*)\}/g)) {
				let pos = m.index
				// [
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// inner text — keep default
				pos += m[2].length
				// ]
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// {
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// attr text
				options.decorations.push({
					start: pos,
					end: pos + m[4].length,
					properties: { class: 'resumx-attr' },
				})
				pos += m[4].length
				// }
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				// Track full range so standalone {} doesn't double-match
				for (let i = m.index; i < m.index + m[0].length; i++)
					matched.add(String(i))
			}

			// 2) Standalone {.attrs} — dim { }, italic inner text
			for (const m of code.matchAll(/(?<!\])\{(\.[\w:.@\-\s]+)\}/g)) {
				if (!matched.has(String(m.index))) {
					let pos = m.index
					// {
					options.decorations.push({
						start: pos,
						end: pos + 1,
						properties: { class: 'resumx-delim' },
					})
					pos += 1
					// attr text
					options.decorations.push({
						start: pos,
						end: pos + m[1].length,
						properties: { class: 'resumx-attr' },
					})
					pos += m[1].length
					// }
					options.decorations.push({
						start: pos,
						end: pos + 1,
						properties: { class: 'resumx-delim' },
					})
				}
			}

			// 3) ::icon:: — dim delimiters, color the name
			for (const m of code.matchAll(/::[^\s]+?::/g)) {
				const name = m[0].slice(2, -2)
				options.decorations.push({
					start: m.index,
					end: m.index + 2,
					properties: { class: 'resumx-delim' },
				})
				options.decorations.push({
					start: m.index + 2,
					end: m.index + 2 + name.length,
					properties: { class: 'resumx-icon' },
				})
				options.decorations.push({
					start: m.index + 2 + name.length,
					end: m.index + m[0].length,
					properties: { class: 'resumx-delim' },
				})
			}

			// 4) [text](url) — dim brackets and URL, reset display text to default
			for (const m of code.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g)) {
				if (matched.has(String(m.index))) continue

				let pos = m.index
				// [
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// inner text — reset to default foreground
				options.decorations.push({
					start: pos,
					end: pos + m[1].length,
					properties: { class: 'resumx-link-text' },
				})
				pos += m[1].length
				// ]
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// (url)
				options.decorations.push({
					start: pos,
					end: pos + m[2].length + 2,
					properties: { class: 'resumx-delim' },
				})
			}

			// 5) | delimiters between markdown links — dim
			for (const m of code.matchAll(/(?<=\)) \| (?=\[)/g)) {
				options.decorations.push({
					start: m.index,
					end: m.index + m[0].length,
					properties: { class: 'resumx-delim' },
				})
			}
		},
	}
}
