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
			intermediate.push(
				`<li>${renderInlineMarkdown((node as BulletNode).text)}</li>`,
			)
		} else if (node.type === 'text') {
			intermediate.push(
				`<p>${renderInlineMarkdown((node as TextNode).text)}</p>`,
			)
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
	}

	return out.join('\n')
}

/** Convert inline markdown syntax within a text string to HTML tags. */
function renderInlineMarkdown(text: string): string {
	let result = ''
	let i = 0
	while (i < text.length) {
		// Underline passthrough: <u>text</u>
		const underline = text.slice(i).match(/^<u>([\s\S]+?)<\/u>/)
		if (underline) {
			result += `<u>${renderInlineMarkdown(underline[1])}</u>`
			i += underline[0].length
			continue
		}
		// Bold-italic: ***text***
		const boldItalic = text.slice(i).match(/^\*\*\*(.+?)\*\*\*/)
		if (boldItalic) {
			result += `<strong><em>${renderInlineMarkdown(boldItalic[1])}</em></strong>`
			i += boldItalic[0].length
			continue
		}
		// Bold: **text**
		const bold = text.slice(i).match(/^\*\*(.+?)\*\*/)
		if (bold) {
			result += `<strong>${renderInlineMarkdown(bold[1])}</strong>`
			i += bold[0].length
			continue
		}
		// Strikethrough: ~~text~~
		const strike = text.slice(i).match(/^~~(.+?)~~/)
		if (strike) {
			result += `<s>${renderInlineMarkdown(strike[1])}</s>`
			i += strike[0].length
			continue
		}
		// Italic: *text*
		const italic = text.slice(i).match(/^\*(.+?)\*/)
		if (italic) {
			result += `<em>${renderInlineMarkdown(italic[1])}</em>`
			i += italic[0].length
			continue
		}
		// Italic: _text_
		const italicU = text.slice(i).match(/^_(.+?)_/)
		if (italicU) {
			result += `<em>${renderInlineMarkdown(italicU[1])}</em>`
			i += italicU[0].length
			continue
		}
		// Code: `text` — do NOT recurse; code content is literal
		const code = text.slice(i).match(/^`(.+?)`/)
		if (code) {
			result += `<code>${escapeHtml(code[1])}</code>`
			i += code[0].length
			continue
		}
		// Escape the current character and advance
		result += escapeHtml(text[i])
		i++
	}
	return result
}

function escapeHtml(s: string) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(s: string) {
	return escapeHtml(s).replace(/"/g, '&quot;')
}
