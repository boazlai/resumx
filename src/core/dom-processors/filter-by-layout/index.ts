import { withDOM } from '../../../lib/dom-kit/dom.js'
import type { SectionsConfig } from '../../view/types.js'

/**
 * Factory that returns an HtmlTransform arranging sections.
 *
 * - hide: removes listed sections from output
 * - pin: moves listed sections to the top in specified order,
 *   remaining sections follow in source order
 * - Header always renders regardless of configuration.
 *
 * When both are empty, all sections pass in source order (no-op).
 */
export function arrangeSections(
	config: Required<SectionsConfig>,
): (html: string) => string {
	return html => {
		const { hide, pin } = config

		if (!hide.length && !pin.length) return html

		return withDOM(html, root => {
			const sectionEls = Array.from(
				root.querySelectorAll('section[data-section]'),
			)

			const hideSet = new Set<string>(hide)
			const pinSet = new Set<string>(pin)

			const toRemove: Element[] = []
			const sectionsByType = new Map<string, Element>()
			const unpinnedInOrder: Element[] = []

			for (const section of sectionEls) {
				const type = section.getAttribute('data-section')!
				sectionsByType.set(type, section)

				if (hideSet.has(type)) {
					toRemove.push(section)
				} else if (!pinSet.has(type)) {
					unpinnedInOrder.push(section)
				}
			}

			for (const section of toRemove) {
				section.remove()
			}

			if (pin.length === 0) return

			for (const section of sectionEls) {
				if (!hideSet.has(section.getAttribute('data-section')!)) {
					section.remove()
				}
			}

			const insertionPoint = root

			for (const type of pin) {
				const section = sectionsByType.get(type)
				if (section && !hideSet.has(type)) {
					insertionPoint.appendChild(section)
				}
			}

			for (const section of unpinnedInOrder) {
				insertionPoint.appendChild(section)
			}
		})
	}
}
