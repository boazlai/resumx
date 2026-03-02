import { resolveTagSet } from '../target-composition.js'
import type { NamedView } from './plan.js'

/**
 * Given a set of changed tag names, determine which named views are
 * affected and need re-rendering.
 *
 * For each view, expands its selects through the tag composition map
 * and checks if any expanded tag overlaps with the changed set.
 * This handles transitive dependencies: if `startup-cto` selects
 * `fullstack` which composes `frontend`, changing `frontend`
 * affects all three.
 */
export function computeAffectedViews(
	changedTags: string[],
	tagMap: Record<string, string[]>,
	namedViews: NamedView[],
): Set<string> {
	const changedSet = new Set(changedTags)
	const affected = new Set<string>()

	for (const { name, view } of namedViews) {
		if (!name || !view.selects) continue

		for (const select of view.selects) {
			const expanded = resolveTagSet(select, tagMap)
			for (const tag of expanded) {
				if (changedSet.has(tag)) {
					affected.add(name)
					break
				}
			}
			if (affected.has(name)) break
		}
	}

	return affected
}

export type RenderScope =
	| { type: 'full' }
	| { type: 'views'; names: Set<string> }
	| { type: 'changedTags'; names: string[] }
	| { type: 'skip' }
