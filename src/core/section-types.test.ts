import { describe, it, expect } from 'vitest'
import {
	SectionTypeEnum,
	SECTION_TYPES,
	parseSectionList,
	validateHidePinOverlap,
} from './section-types.js'

describe('SectionTypeEnum', () => {
	it('accepts all valid section types', () => {
		for (const type of SECTION_TYPES) {
			expect(SectionTypeEnum.safeParse(type).success).toBe(true)
		}
	})

	it('rejects unknown section types', () => {
		const result = SectionTypeEnum.safeParse('invalid')
		expect(result.success).toBe(false)
	})
})

describe('parseSectionList', () => {
	it('accepts valid section types', () => {
		const result = parseSectionList(
			['work', 'skills', 'education'],
			'sections.hide',
		)
		expect(result).toEqual({
			ok: true,
			sections: ['work', 'skills', 'education'],
		})
	})

	it('accepts all valid section types in any order', () => {
		const result = parseSectionList(['skills', 'work'], 'sections.pin')
		expect(result).toEqual({ ok: true, sections: ['skills', 'work'] })
	})

	it('suggests canonical type when user writes common synonym', () => {
		const result = parseSectionList(['experience'], 'sections.pin')
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain(
				"Unknown section 'experience' in sections.pin",
			)
			expect(result.error).toContain("Did you mean 'work'?")
		}
	})

	it('suggests basics when user writes summary', () => {
		const result = parseSectionList(['summary'], 'sections.hide')
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain("Did you mean 'basics'?")
		}
	})

	it('suggests certificates when user writes certifications', () => {
		const result = parseSectionList(['certifications'], 'sections.hide')
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain("Did you mean 'certificates'?")
		}
	})

	it('rejects completely unknown value with valid sections list', () => {
		const result = parseSectionList(['xyzzy'], 'sections.hide')
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain("Unknown section 'xyzzy' in sections.hide")
			expect(result.error).toContain('Valid sections:')
		}
	})

	it('includes field name in error message', () => {
		const result = parseSectionList(['xyzzy'], 'sections.pin')
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('in sections.pin')
		}
	})

	it('reports first invalid section when multiple are invalid', () => {
		const result = parseSectionList(
			['work', 'fakesection', 'alsofake'],
			'sections.hide',
		)
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('fakesection')
		}
	})

	it('accepts empty array', () => {
		const result = parseSectionList([], 'sections.hide')
		expect(result).toEqual({ ok: true, sections: [] })
	})
})

describe('validateHidePinOverlap', () => {
	it('returns null when no overlap', () => {
		expect(
			validateHidePinOverlap(['publications'], ['skills', 'work']),
		).toBeNull()
	})

	it('returns error when overlap exists', () => {
		const error = validateHidePinOverlap(
			['skills', 'publications'],
			['skills', 'work'],
		)
		expect(error).toBe(
			"Section 'skills' appears in both 'sections.hide' and 'sections.pin'.",
		)
	})

	it('returns null when hide is empty', () => {
		expect(validateHidePinOverlap([], ['skills'])).toBeNull()
	})

	it('returns null when pin is empty', () => {
		expect(validateHidePinOverlap(['publications'], [])).toBeNull()
	})

	it('returns null when both are empty', () => {
		expect(validateHidePinOverlap([], [])).toBeNull()
	})
})
