import { describe, it, expect } from 'vitest'
import {
	extractTagViews,
	resolveForFlag,
	validateTagComposition,
} from './resolve-for.js'
import { resolveView } from './resolve.js'
import type { ViewLayer } from './types.js'

describe('extractTagViews', () => {
	it('returns empty object for undefined tags', () => {
		expect(extractTagViews(undefined)).toEqual({})
	})

	it('creates view with selects for shorthand tag', () => {
		const views = extractTagViews({
			fullstack: ['frontend', 'backend'],
		})
		expect(views.fullstack).toEqual({
			selects: ['fullstack', 'frontend', 'backend'],
		})
	})

	it('creates view with selects and config for expanded tag', () => {
		const views = extractTagViews({
			frontend: {
				extends: ['backend'],
				sections: { hide: ['publications'] },
				pages: 1,
			},
		})
		expect(views.frontend).toEqual({
			selects: ['frontend', 'backend'],
			sections: { hide: ['publications'] },
			pages: 1,
		})
	})

	it('creates view with just selects for expanded tag without extends', () => {
		const views = extractTagViews({
			frontend: { pages: 1 },
		})
		expect(views.frontend).toEqual({
			selects: ['frontend'],
			pages: 1,
		})
	})

	it('handles mixed shorthand and expanded', () => {
		const views = extractTagViews({
			fullstack: ['frontend', 'backend'],
			frontend: {
				sections: { pin: ['skills'] },
				pages: 1,
			},
		})

		expect(views.fullstack).toEqual({
			selects: ['fullstack', 'frontend', 'backend'],
		})
		expect(views.frontend).toEqual({
			selects: ['frontend'],
			sections: { pin: ['skills'] },
			pages: 1,
		})
	})

	it('includes all expanded config fields', () => {
		const views = extractTagViews({
			frontend: {
				extends: ['backend'],
				sections: { hide: ['publications'], pin: ['skills'] },
				pages: 1,
				'bullet-order': 'tag',
				vars: { tagline: 'Frontend' },
				style: { 'accent-color': '#2563eb' },
				format: 'html',
				output: './dist/frontend',
				css: ['custom.css'],
			},
		})

		expect(views.frontend).toEqual({
			selects: ['frontend', 'backend'],
			sections: { hide: ['publications'], pin: ['skills'] },
			pages: 1,
			bulletOrder: 'tag',
			vars: { tagline: 'Frontend' },
			style: { 'accent-color': '#2563eb' },
			format: 'html',
			output: './dist/frontend',
			css: ['custom.css'],
		})
	})
})

describe('resolveForFlag', () => {
	it('resolves to tag view when name matches', () => {
		const tagViews = {
			frontend: { selects: ['frontend'], pages: 1 },
		}
		const result = resolveForFlag('frontend', tagViews, ['frontend'])
		expect(result).toEqual({ selects: ['frontend'], pages: 1 })
	})

	it('creates implicit view for content-only tag', () => {
		const result = resolveForFlag('backend', {}, ['backend', 'frontend'])
		expect(result).toEqual({ selects: ['backend'] })
	})

	it('prefers tag view over implicit view', () => {
		const tagViews = {
			frontend: { selects: ['frontend'], pages: 1 },
		}
		const result = resolveForFlag('frontend', tagViews, ['frontend'])
		expect(result.pages).toBe(1)
	})

	it('throws for unknown tag with Levenshtein suggestion', () => {
		const tagViews = {
			frontend: { selects: ['frontend'] },
		}
		expect(() => resolveForFlag('fronted', tagViews, ['backend'])).toThrow(
			"Unknown tag 'fronted'. Did you mean 'frontend'?",
		)
	})

	it('throws for completely unknown tag with available list', () => {
		const tagViews = {
			frontend: { selects: ['frontend'] },
		}
		expect(() => resolveForFlag('zzzzz', tagViews, ['backend'])).toThrow(
			'Available tags: frontend, backend',
		)
	})

	it('throws when no tags exist at all', () => {
		expect(() => resolveForFlag('anything', {}, [])).toThrow(
			'No tags found in content or frontmatter',
		)
	})

	it('resolves shorthand-derived tag view', () => {
		const tagViews = {
			fullstack: { selects: ['fullstack', 'frontend', 'backend'] },
		}
		const result = resolveForFlag('fullstack', tagViews, [
			'frontend',
			'backend',
		])
		expect(result.selects).toEqual(['fullstack', 'frontend', 'backend'])
	})
})

describe('validateTagComposition', () => {
	it('passes when all constituents exist as content tags', () => {
		expect(() =>
			validateTagComposition({ fullstack: ['frontend', 'backend'] }, [
				'frontend',
				'backend',
			]),
		).not.toThrow()
	})

	it('passes when constituent is another composed tag', () => {
		expect(() =>
			validateTagComposition(
				{
					fullstack: ['frontend', 'backend'],
					'startup-cto': ['fullstack', 'leadership'],
				},
				['frontend', 'backend', 'leadership'],
			),
		).not.toThrow()
	})

	it('throws for unknown constituent with Levenshtein suggestion', () => {
		expect(() =>
			validateTagComposition({ fullstack: ['fronted', 'backend'] }, [
				'frontend',
				'backend',
			]),
		).toThrow(
			"Tag 'fronted' in composition 'fullstack' does not exist. Did you mean 'frontend'?",
		)
	})

	it('throws for completely unknown constituent', () => {
		expect(() =>
			validateTagComposition({ fullstack: ['zzzzz', 'backend'] }, [
				'frontend',
				'backend',
			]),
		).toThrow(
			"Tag 'zzzzz' in composition 'fullstack' does not exist in the document or as a composed tag.",
		)
	})

	it('passes for empty composition', () => {
		expect(() =>
			validateTagComposition({ frontend: [] }, ['frontend']),
		).not.toThrow()
	})
})

describe('end-to-end: 3-layer cascade (default → tag view → ephemeral)', () => {
	it('--for frontend with shorthand tag filters to frontend + constituents', () => {
		const tags = { fullstack: ['frontend', 'backend'] }
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('fullstack', tagViews, [
			'frontend',
			'backend',
		])

		const defaultView: ViewLayer = {
			pages: 2,
			vars: { tagline: 'Full-stack engineer' },
		}
		const ephemeral: ViewLayer = {}

		const resolved = resolveView([defaultView, tagLayer, ephemeral])

		expect(resolved.selects).toEqual(['fullstack', 'frontend', 'backend'])
		expect(resolved.pages).toBe(2)
		expect(resolved.vars).toEqual({ tagline: 'Full-stack engineer' })
	})

	it('--for frontend with expanded tag uses tag view sections, pages, etc.', () => {
		const tags = {
			frontend: {
				sections: {
					hide: ['publications'] as string[],
					pin: ['skills', 'projects'] as string[],
				},
				pages: 1,
			},
		}
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('frontend', tagViews, ['frontend'])

		const defaultView: ViewLayer = {
			pages: 2,
			sections: { hide: [], pin: [] },
		}
		const ephemeral: ViewLayer = {}

		const resolved = resolveView([defaultView, tagLayer, ephemeral])

		expect(resolved.selects).toEqual(['frontend'])
		expect(resolved.pages).toBe(1)
		expect(resolved.sections.hide).toEqual(['publications'])
		expect(resolved.sections.pin).toEqual(['skills', 'projects'])
	})

	it('--for frontend -v tagline="..." ephemeral overrides tag view vars', () => {
		const tags = {
			frontend: {
				vars: { tagline: 'Frontend expert', keywords: 'React, TypeScript' },
				pages: 1,
			},
		}
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('frontend', tagViews, ['frontend'])

		const defaultView: ViewLayer = {
			vars: { tagline: 'Default tagline' },
		}
		const ephemeral: ViewLayer = {
			vars: { tagline: 'CLI override tagline' },
		}

		const resolved = resolveView([defaultView, tagLayer, ephemeral])

		expect(resolved.vars.tagline).toBe('CLI override tagline')
		expect(resolved.vars.keywords).toBe('React, TypeScript')
	})

	it('no --for produces base view with selects: null (no tag filtering)', () => {
		const defaultView: ViewLayer = {
			pages: 1,
			vars: { tagline: 'Full-stack engineer' },
		}
		const ephemeral: ViewLayer = {}

		const resolved = resolveView([defaultView, ephemeral])

		expect(resolved.selects).toBeNull()
		expect(resolved.pages).toBe(1)
		expect(resolved.vars).toEqual({ tagline: 'Full-stack engineer' })
	})

	it('--for content-only tag produces implicit view with selects: [name]', () => {
		const tagViews = extractTagViews(undefined)
		const tagLayer = resolveForFlag('backend', tagViews, [
			'backend',
			'frontend',
		])

		const defaultView: ViewLayer = { pages: 2 }
		const resolved = resolveView([defaultView, tagLayer])

		expect(resolved.selects).toEqual(['backend'])
		expect(resolved.pages).toBe(2)
	})

	it('expanded tag view with all fields propagates through cascade', () => {
		const tags = {
			frontend: {
				extends: ['backend'],
				sections: {
					hide: ['publications'] as string[],
					pin: ['skills'] as string[],
				},
				pages: 1,
				'bullet-order': 'tag' as const,
				vars: { tagline: 'Frontend expert' },
				style: { 'accent-color': '#2563eb' },
				format: 'html' as const,
				output: './dist/frontend',
				css: ['custom.css'],
			},
		}
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('frontend', tagViews, [
			'frontend',
			'backend',
		])

		const defaultView: ViewLayer = {
			pages: 2,
			style: { 'font-family': 'Arial' },
		}

		const resolved = resolveView([defaultView, tagLayer])

		expect(resolved.selects).toEqual(['frontend', 'backend'])
		expect(resolved.pages).toBe(1)
		expect(resolved.bulletOrder).toBe('tag')
		expect(resolved.vars).toEqual({ tagline: 'Frontend expert' })
		expect(resolved.style).toEqual({
			'font-family': 'Arial',
			'accent-color': '#2563eb',
		})
		expect(resolved.format).toBe('html')
		expect(resolved.output).toBe('./dist/frontend')
		expect(resolved.css).toEqual(['custom.css'])
		expect(resolved.sections.hide).toEqual(['publications'])
		expect(resolved.sections.pin).toEqual(['skills'])
	})

	it('ephemeral pages overrides tag view pages in 3-layer stack', () => {
		const tags = { frontend: { pages: 1 } }
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('frontend', tagViews, ['frontend'])

		const defaultView: ViewLayer = { pages: 3 }
		const ephemeral: ViewLayer = { pages: 2 }

		const resolved = resolveView([defaultView, tagLayer, ephemeral])

		expect(resolved.pages).toBe(2)
	})

	it('ephemeral style merges with tag view style (not replaces)', () => {
		const tags = {
			frontend: {
				style: { 'accent-color': '#2563eb', 'font-size': '10pt' },
			},
		}
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('frontend', tagViews, ['frontend'])

		const defaultView: ViewLayer = { style: { 'font-family': 'Arial' } }
		const ephemeral: ViewLayer = {
			style: { 'accent-color': '#ef4444' },
		}

		const resolved = resolveView([defaultView, tagLayer, ephemeral])

		expect(resolved.style).toEqual({
			'font-family': 'Arial',
			'accent-color': '#ef4444',
			'font-size': '10pt',
		})
	})
})
