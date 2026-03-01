import { closest, distance } from 'fastest-levenshtein'
import type { FrontmatterConfig } from '../frontmatter.js'
import type { OutputFormat } from '../renderer.js'
import type { ViewLayer } from './types.js'

/**
 * Convert parsed frontmatter tags into a map of tag view layers.
 *
 * Every tag produces a view layer:
 * - Shorthand (`fullstack: [frontend, backend]`):
 *   ViewLayer with selects = [tagName, ...constituents]
 * - Expanded (`frontend: { extends: [backend], pages: 1 }`):
 *   ViewLayer with selects = [tagName, ...extends] plus view config fields
 */
export function extractTagViews(
	tags: FrontmatterConfig['tags'],
): Record<string, ViewLayer> {
	if (!tags) return {}
	const views: Record<string, ViewLayer> = {}

	for (const [name, entry] of Object.entries(tags)) {
		if (Array.isArray(entry)) {
			views[name] = { selects: [name, ...entry] }
			continue
		}

		const view: ViewLayer = {
			selects: [name, ...(entry.extends ?? [])],
		}
		if (entry.sections) view.sections = entry.sections
		if (entry.pages !== undefined) view.pages = entry.pages
		if (entry['bullet-order']) view.bulletOrder = entry['bullet-order']
		if (entry.vars) view.vars = entry.vars
		if (entry.style) view.style = entry.style as Record<string, string>
		if (entry.format) view.format = entry.format as OutputFormat
		if (entry.output) view.output = entry.output
		if (entry.css) view.css = entry.css
		views[name] = view
	}

	return views
}

/**
 * Resolve a `--for` flag value to a tag view layer.
 *
 * Resolution order:
 * 1. Exact match in tag views (from frontmatter)
 * 2. Known content tag without explicit view → implicit view with selects: [name]
 * 3. Error with Levenshtein suggestion
 */
export function resolveForFlag(
	name: string,
	tagViews: Record<string, ViewLayer>,
	contentTags: string[],
): ViewLayer {
	if (tagViews[name]) return tagViews[name]

	if (contentTags.includes(name)) return { selects: [name] }

	const allKnown = [...new Set([...Object.keys(tagViews), ...contentTags])]

	if (allKnown.length === 0) {
		throw new Error(
			`Unknown tag '${name}'. No tags found in content or frontmatter.`,
		)
	}

	const best = closest(name, allKnown)
	if (distance(name, best) <= 2) {
		throw new Error(`Unknown tag '${name}'. Did you mean '${best}'?`)
	}

	throw new Error(
		`Unknown tag '${name}'. Available tags: ${allKnown.join(', ')}`,
	)
}

/**
 * Validate that every tag name in a composition exists as a content tag
 * or as another composed/defined tag.
 */
export function validateTagComposition(
	tagMap: Record<string, string[]>,
	contentTags: string[],
): void {
	const definedTags = new Set(Object.keys(tagMap))

	for (const [composedName, constituents] of Object.entries(tagMap)) {
		for (const constituent of constituents) {
			if (contentTags.includes(constituent) || definedTags.has(constituent))
				continue

			const allKnown = [...new Set([...contentTags, ...definedTags])]
			const best = closest(constituent, allKnown)
			if (distance(constituent, best) <= 2) {
				throw new Error(
					`Tag '${constituent}' in composition '${composedName}' does not exist. Did you mean '${best}'?`,
				)
			}
			throw new Error(
				`Tag '${constituent}' in composition '${composedName}' does not exist in the document or as a composed tag.`,
			)
		}
	}
}
