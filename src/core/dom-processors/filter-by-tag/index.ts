/**
 * Filter By Tag Processor
 *
 * Factory that returns an HtmlTransform filtering content by tag.
 * Elements with .@X where X does not match the active tag are removed.
 * Elements without any .@* class are kept (common content).
 */

import { filterBySelector } from '../../../lib/dom-kit/content-filter.js'
import { resolveTagSet } from '../../target-composition.js'

export function filterByTag(
	selects: string[] | null,
	tagMap?: Record<string, string[]>,
): (html: string) => string {
	return html => {
		if (!selects?.length) return html

		const activeTag = selects[0]!
		const tagSet = resolveTagSet(activeTag, tagMap ?? {})
		const notClauses = [...tagSet]
			.map(tag => `:not([class*="@${tag}"])`)
			.join('')

		return filterBySelector(html, `[class*="@"]${notClauses}`)
	}
}
