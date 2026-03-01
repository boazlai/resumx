import { z } from 'zod'
import { sectionClassifier } from './dom-processors/classify-sections/index.js'

export const SECTION_TYPES = [
	'basics',
	'work',
	'volunteer',
	'education',
	'awards',
	'certificates',
	'publications',
	'skills',
	'languages',
	'interests',
	'references',
	'projects',
] as const

export type SectionType = (typeof SECTION_TYPES)[number]

export const SectionTypeEnum = z.enum(SECTION_TYPES)

const MIN_CONFIDENCE = 0.3

type ParseSectionListResult =
	| { ok: true; sections: SectionType[] }
	| { ok: false; error: string }

/**
 * Validate an array of strings as SectionType values.
 * Uses the section classifier for synonym suggestions.
 */
export function parseSectionList(
	values: string[],
	fieldName: string,
): ParseSectionListResult {
	const sections: SectionType[] = []

	for (const value of values) {
		const parsed = SectionTypeEnum.safeParse(value)
		if (parsed.success) {
			sections.push(parsed.data)
			continue
		}

		const { type, score } = sectionClassifier.classifyWithScore(value)
		if (score >= MIN_CONFIDENCE) {
			return {
				ok: false,
				error: `Unknown section '${value}' in ${fieldName}. Did you mean '${type}'?`,
			}
		}

		return {
			ok: false,
			error: `Unknown section '${value}' in ${fieldName}. Valid sections: ${SECTION_TYPES.join(', ')}`,
		}
	}

	return { ok: true, sections }
}

/**
 * Validate that hide and pin don't overlap.
 * Returns an error message if they do, null otherwise.
 */
export function validateHidePinOverlap(
	hide: SectionType[],
	pin: SectionType[],
): string | null {
	if (hide.length === 0 || pin.length === 0) return null

	const hideSet = new Set(hide)
	for (const section of pin) {
		if (hideSet.has(section)) {
			return `Section '${section}' appears in both 'sections.hide' and 'sections.pin'.`
		}
	}

	return null
}
