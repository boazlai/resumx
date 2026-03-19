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
					bullets.push({ type: 'bullet', text: li.textContent?.trim() ?? '' })
				})
				// if ul is directly inside a section/entry, callers will attach each bullet individually;
				// return as an array marker (we return first bullet wrapper; caller handles arrays)
				return bullets
			}

			if (el.tagName.toLowerCase() === 'p') {
				const text = el.textContent?.trim() ?? ''
				const t: TextNode = { type: 'text', text }
				return t
			}

			// fallback: treat element's text as paragraph
			const txt = el.textContent?.trim() ?? ''
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
