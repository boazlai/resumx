import type {
	DocNode,
	SectionNode,
	EntryNode,
	BulletNode,
	TextNode,
} from '@/components/editor/ast'

// Extremely small, heuristic markdown -> AST and AST -> markdown serializer.
// Supports:
//  - Sections: lines starting with "## "
//  - Entries: lines starting with "### "
//  - Bullets: lines starting with "-", "*" or numbered lists
// This is intentionally conservative; extend as needed.

export function parseMarkdownToAST(md: string): DocNode {
	const lines = md.replace(/\r\n/g, '\n').split('\n')
	const doc: DocNode = { type: 'doc', children: [] }
	let currentSection: SectionNode | null = null
	let currentEntry: EntryNode | null = null

	const flushEntry = () => {
		if (currentEntry) {
			if (currentSection) currentSection.children.push(currentEntry)
			else doc.children.push(currentEntry)
			currentEntry = null
		}
	}

	const flushSection = () => {
		flushEntry()
		if (currentSection) {
			doc.children.push(currentSection)
			currentSection = null
		}
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		if (!line) continue

		const sectionMatch = line.match(/^##\s+(.+)$/)
		if (sectionMatch) {
			flushSection()
			currentSection = {
				type: 'section',
				name: sectionMatch[1].trim().toLowerCase(),
				children: [],
			}
			continue
		}

		const entryMatch = line.match(/^###\s+(.+)$/)
		if (entryMatch) {
			flushEntry()
			// Try to parse "Role — Company (Dates)" or "Company — Role (Dates)"
			const header = entryMatch[1].trim()
			let company = '',
				role = '',
				dates = ''
			const datesMatch = header.match(/\(([^)]+)\)\s*$/)
			if (datesMatch) {
				dates = datesMatch[1]
			}
			const headerNoDates = header.replace(/\s*\([^)]+\)\s*$/, '')
			const parts = headerNoDates.split('—').map(p => p.trim())
			if (parts.length === 2) {
				// heuristics: assume "Role — Company"
				role = parts[0]
				company = parts[1]
			} else {
				role = headerNoDates
			}

			currentEntry = {
				type: 'entry',
				company: company || undefined,
				role: role || undefined,
				dates: dates || undefined,
				children: [],
			}
			continue
		}

		const bulletMatch = line.match(/^([-*])\s+(.+)$/)
		if (bulletMatch) {
			const bullet: BulletNode = { type: 'bullet', text: bulletMatch[2].trim() }
			if (currentEntry) currentEntry.children.push(bullet)
			else if (currentSection) currentSection.children.push(bullet)
			else doc.children.push(bullet)
			continue
		}

		const numberedMatch = line.match(/^\d+\.\s+(.+)$/)
		if (numberedMatch) {
			const bullet: BulletNode = {
				type: 'bullet',
				text: numberedMatch[1].trim(),
			}
			if (currentEntry) currentEntry.children.push(bullet)
			else if (currentSection) currentSection.children.push(bullet)
			else doc.children.push(bullet)
			continue
		}

		// fallback: plain text node
		const text: TextNode = { type: 'text', text: line }
		if (currentEntry) currentEntry.children.push(text)
		else if (currentSection) currentSection.children.push(text)
		else doc.children.push(text)
	}

	flushEntry()
	flushSection()
	return doc
}

export function serializeASTToMarkdown(doc: DocNode): string {
	const parts: string[] = []
	for (const child of doc.children) {
		if (child.type === 'section') {
			const s = child as SectionNode
			parts.push(`## ${s.name}`)
			for (const c of s.children) {
				if (c.type === 'entry') {
					const e = c as EntryNode
					const headerParts = []
					if (e.role) headerParts.push(e.role)
					if (e.company) headerParts.push(`— ${e.company}`)
					let header = headerParts.join(' ')
					if (e.dates) header = `${header} (${e.dates})`
					parts.push(`### ${header}`)
					for (const sub of e.children) {
						if (sub.type === 'bullet')
							parts.push(`- ${(sub as BulletNode).text}`)
						else if (sub.type === 'text') parts.push((sub as TextNode).text)
					}
				} else if (c.type === 'bullet') {
					parts.push(`- ${(c as BulletNode).text}`)
				} else if (c.type === 'text') {
					parts.push((c as TextNode).text)
				}
			}
		} else if (child.type === 'entry') {
			const e = child as EntryNode
			const headerParts = []
			if (e.role) headerParts.push(e.role)
			if (e.company) headerParts.push(`— ${e.company}`)
			let header = headerParts.join(' ')
			if (e.dates) header = `${header} (${e.dates})`
			parts.push(`### ${header}`)
			for (const sub of e.children) {
				if (sub.type === 'bullet') parts.push(`- ${(sub as BulletNode).text}`)
				else if (sub.type === 'text') parts.push((sub as TextNode).text)
			}
		} else if (child.type === 'bullet') {
			parts.push(`- ${(child as BulletNode).text}`)
		} else if (child.type === 'text') {
			parts.push((child as TextNode).text)
		}
	}
	return parts.join('\n') + '\n'
}
