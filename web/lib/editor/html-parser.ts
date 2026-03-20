import type {
	DocNode,
	SectionNode,
	EntryNode,
	BulletNode,
	TextNode,
} from '@/components/editor/ast'

// Parse minimal HTML produced by astToHtml / TipTap back into the AST.
// Expects structure:
//  - <section data-section name="...">...</section>
//  - <div data-entry data-company="..." data-role="..." data-dates="...">...</div>
//  - <ul><li>...</li></ul> and <p>...</p>
export function htmlToAST(html: string): DocNode {
	const parser = new DOMParser()
	const doc = parser.parseFromString(html, 'text/html')
	const rootChildren: any[] = Array.from(doc.body.childNodes)
	const out: DocNode = { type: 'doc', children: [] }

	const parseNode = (node: ChildNode): any => {
		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as HTMLElement
			if (el.matches('section[data-section]')) {
				const name = (el.getAttribute('name') || '').trim().toLowerCase()
				const section: SectionNode = { type: 'section', name, children: [] }
				el.childNodes.forEach(c => {
					const child = parseNode(c)
					if (child) section.children.push(child)
				})
				return section
			}

			if (el.matches('div[data-entry]')) {
				const company = el.getAttribute('data-company') || undefined
				const role = el.getAttribute('data-role') || undefined
				const dates = el.getAttribute('data-dates') || undefined
				const entry: EntryNode = {
					type: 'entry',
					company,
					role,
					dates,
					children: [],
				}
				el.childNodes.forEach(c => {
					const child = parseNode(c)
					if (child) entry.children.push(child)
				})
				return entry
			}

			if (el.tagName.toLowerCase() === 'ul') {
				const bullets: BulletNode[] = []
				el.querySelectorAll('li').forEach(li => {
					bullets.push({ type: 'bullet', text: innerHtmlToMarkdown(li) })
				})
				return bullets
			}

			if (el.tagName.toLowerCase() === 'p') {
				const text = innerHtmlToMarkdown(el)
				const t: TextNode = { type: 'text', text }
				return t
			}

			// fallback: treat element's text as paragraph
			const txt = innerHtmlToMarkdown(el)
			if (txt) return { type: 'text', text: txt } as TextNode
			return null
		} else if (node.nodeType === Node.TEXT_NODE) {
			const t = node.textContent?.trim()
			if (!t) return null
			return { type: 'text', text: t } as TextNode
		}
		return null
	}

	for (const child of rootChildren) {
		const parsed = parseNode(child)
		if (!parsed) continue
		// htmlToAST may return an array for <ul> (list of bullets)
		if (Array.isArray(parsed)) {
			for (const b of parsed) out.children.push(b)
			continue
		}
		out.children.push(parsed)
	}

	return out
}

/** Serialize an element's inner content to Markdown, preserving inline formatting. */
function innerHtmlToMarkdown(el: HTMLElement): string {
	return Array.from(el.childNodes)
		.map(child => nodeToMarkdown(child))
		.join('')
		.trim()
}

function nodeToMarkdown(node: ChildNode): string {
	if (node.nodeType === Node.TEXT_NODE) {
		return node.textContent || ''
	}
	if (node.nodeType === Node.ELEMENT_NODE) {
		const el = node as HTMLElement
		const tag = el.tagName.toLowerCase()
		const inner = Array.from(el.childNodes).map(nodeToMarkdown).join('')
		if (tag === 'strong' || tag === 'b') return `**${inner}**`
		if (tag === 'em' || tag === 'i') return `*${inner}*`
		if (tag === 's' || tag === 'del' || tag === 'strike') return `~~${inner}~~`
		if (tag === 'u') return `<u>${inner}</u>`
		if (tag === 'code') return `\`${inner}\``
		// span, mark, etc. — pass through content
		return inner
	}
	return ''
}
