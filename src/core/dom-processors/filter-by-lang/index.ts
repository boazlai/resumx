/**
 * Filter By Lang Processor
 *
 * Factory that returns an HtmlTransform filtering content by language.
 * Elements with lang=X where X does not match are removed.
 * Elements without any lang attribute are kept (common content).
 */

import { filterBySelector } from '../../../lib/dom-kit/content-filter.js'

export function filterByLang(lang: string | null): (html: string) => string {
	return html => {
		if (!lang) return html
		return filterBySelector(html, `[lang]:not([lang="${lang}"])`)
	}
}
