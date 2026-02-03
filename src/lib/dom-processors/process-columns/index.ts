/**
 * Process Columns Processor
 *
 * Handles <hr> as a column divider:
 * - If CSS has .two-column-layout: splits content into primary/secondary columns
 * - If CSS doesn't support two-column: strips <hr> and concatenates content
 * - Preserves any existing <header> element from extractHeader processor
 */

import { parseHTML } from 'linkedom'
import type { PipelineContext } from '../types.js'

/**
 * Serialize an array of elements to HTML string
 */
function serializeElements(elements: Element[]): string {
	return elements.map(el => el.outerHTML).join('')
}

/**
 * Check if CSS supports two-column layout
 */
function supportsTwoColumn(css: string): boolean {
	return /\.two-column-layout\s*\{/.test(css)
}

/**
 * Process column layout based on <hr> elements
 *
 * @param html - Input HTML string (may contain <header> from extractHeader)
 * @param ctx - Pipeline context (uses ctx.env.css for two-column detection)
 * @returns HTML with columns processed
 */
export function processColumns(html: string, ctx: PipelineContext): string {
	const { css } = ctx.env
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!

	const firstHr = root.querySelector('hr')

	// No hr: return unchanged
	if (!firstHr) {
		return html
	}

	// Collect all elements, separating header, before-hr, and after-hr
	const header = root.querySelector('header')
	const allElements = Array.from(root.children)

	// Find hr index
	const hrIndex = allElements.indexOf(firstHr)

	// Elements before hr (excluding header)
	const beforeHr = allElements
		.slice(0, hrIndex)
		.filter(el => el.tagName !== 'HEADER' && el.tagName !== 'HR')

	// Elements after hr (excluding any hr elements)
	const afterHr = allElements.slice(hrIndex).filter(el => el.tagName !== 'HR')

	// Check if style supports two-column layout
	if (!supportsTwoColumn(css)) {
		// No two-column support: strip hr, return header + concatenated content
		const allContent = [...beforeHr, ...afterHr]
		if (header) {
			return `${header.outerHTML}\n${serializeElements(allContent)}`
		}
		return serializeElements(allContent)
	}

	// Two-column mode: wrap in layout
	const headerHtml = header ? `${header.outerHTML}\n` : ''

	return `<div class="two-column-layout">
${headerHtml}<div class="primary">${serializeElements(beforeHr)}</div>
<div class="secondary">${serializeElements(afterHr)}</div>
</div>`
}
