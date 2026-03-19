import type {
	DocNode,
	SectionNode,
	EntryNode,
	BulletNode,
	TextNode,
	ASTNode,
} from '@/components/editor/ast'

// Convert AST -> simple HTML that TipTap extensions (section/entry) can parse.
// Uses:
//  - section -> <section data-section name="...">...</section>
//  - entry   -> <div data-entry data-company="..." data-role="..." data-dates="...">...</div>
//  - bullet  -> <ul><li>...</li></ul> groups consecutive bullets
//  - text    -> <p>...</p>
export function astToHtml(doc: DocNode): string {
	const parts: string[] = []

	const renderNode = (node: ASTNode) => {
		if (node.type === 'section') {
			const s = node as SectionNode
			parts.push(`<section data-section name="${escapeAttr(s.name)}">`)
			s.children.forEach(renderNode)
			parts.push(`</section>`)
		} else if (node.type === 'entry') {
			const e = node as EntryNode
			const attrs: string[] = []
			if (e.company) attrs.push(`data-company="${escapeAttr(e.company)}"`)
			if (e.role) attrs.push(`data-role="${escapeAttr(e.role)}"`)
			if (e.dates) attrs.push(`data-dates="${escapeAttr(e.dates)}"`)
			parts.push(`<div data-entry ${attrs.join(' ')}>`)
			e.children.forEach(renderNode)
			parts.push(`</div>`)
		} else if (node.type === 'bullet') {
			// bullets will be rendered as <ul><li>...</li></ul> by wrapping logic below;
			parts.push(`<li>${escapeHtml((node as BulletNode).text)}</li>`)
		} else if (node.type === 'text') {
			parts.push(`<p>${escapeHtml((node as TextNode).text)}</p>`)
		}
	}

	// We need to group top-level consecutive <li> into <ul>
	// Render to an intermediate array then post-process to wrap consecutive <li>
	const intermediate: string[] = []
	const pushRender = (node: ASTNode) => {
		if (node.type === 'section') {
			const s = node as SectionNode
			intermediate.push(`<section data-section name="${escapeAttr(s.name)}">`)
			s.children.forEach(pushRender)
			intermediate.push(`</section>`)
		} else if (node.type === 'entry') {
			const e = node as EntryNode
			const attrs: string[] = []
			if (e.company) attrs.push(`data-company="${escapeAttr(e.company)}"`)
			if (e.role) attrs.push(`data-role="${escapeAttr(e.role)}"`)
			if (e.dates) attrs.push(`data-dates="${escapeAttr(e.dates)}"`)
			intermediate.push(`<div data-entry ${attrs.join(' ')}>`)
			e.children.forEach(pushRender)
			intermediate.push(`</div>`)
		} else if (node.type === 'bullet') {
			intermediate.push(`<li>${escapeHtml((node as BulletNode).text)}</li>`)
		} else if (node.type === 'text') {
			intermediate.push(`<p>${escapeHtml((node as TextNode).text)}</p>`)
		}
	}

	doc.children.forEach(pushRender)

	// Wrap consecutive <li> blocks into <ul>...</ul>
	const out: string[] = []
	let bufferingList: string[] | null = null
	for (const token of intermediate) {
		if (token.startsWith('<li>')) {
			if (!bufferingList) bufferingList = []
			bufferingList.push(token)
		} else {
			if (bufferingList) {
				out.push('<ul>')
				out.push(...bufferingList)
				out.push('</ul>')
				bufferingList = null
			}
			out.push(token)
		}
	}
	if (bufferingList) {
		out.push('<ul>')
		out.push(...bufferingList)
		out.push('</ul>')
		bufferingList = null
	}

	return out.join('\n')
}

function escapeHtml(s: string) {
	return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
}

function escapeAttr(s: string) {
	return escapeHtml(s).replace(/"/g, '"')
}
