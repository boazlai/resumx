import type { PipelineContext } from '../types.js'
import { withDOM } from '../../../lib/dom-kit/dom.js'

/**
 * Arrange sections based on hide and pin configuration.
 *
 * - hide: removes listed sections from output
 * - pin: moves listed sections to the top in specified order,
 *   remaining sections follow in source order
 * - Header always renders regardless of configuration.
 *
 * When both are empty/undefined, all sections pass in source order (no-op).
 */
export function arrangeSections(html: string, ctx: PipelineContext): string {
	const hide = ctx.config.sections?.hide
	const pin = ctx.config.sections?.pin

	if (!hide?.length && !pin?.length) return html

	return withDOM(html, root => {
		const sections = Array.from(root.querySelectorAll('section[data-section]'))

		const hideSet = new Set<string>(hide ?? [])
		const pinList = pin ?? []

		const toRemove: Element[] = []
		const sectionsByType = new Map<string, Element>()
		const unpinnedInOrder: Element[] = []
		const pinSet = new Set<string>(pinList)

		for (const section of sections) {
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

		if (pinList.length === 0) return

		for (const section of sections) {
			if (!hideSet.has(section.getAttribute('data-section')!)) {
				section.remove()
			}
		}

		const insertionPoint =
			root.querySelector('.primary')
			?? root.querySelector('.secondary')?.parentElement
			?? root

		for (const type of pinList) {
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
