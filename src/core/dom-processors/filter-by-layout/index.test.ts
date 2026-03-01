import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { arrangeSections } from './index.js'
import type { SectionType } from '../../section-types.js'

function parseHtml(html: string) {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!
	return {
		root,
		sections: () =>
			Array.from(root.querySelectorAll('section')).map(
				s => s.getAttribute('data-section')!,
			),
		hasHeader: () => root.querySelector('header') !== null,
		html: () => root.innerHTML,
	}
}

function run(
	html: string,
	hide: SectionType[] = [],
	pin: SectionType[] = [],
): string {
	return arrangeSections({ hide, pin })(html)
}

const HTML_WITH_SECTIONS = [
	'<header><h1>Jane Doe</h1></header>',
	'<section data-section="work"><h2>Experience</h2><p>...</p></section>',
	'<section data-section="skills"><h2>Skills</h2><p>...</p></section>',
	'<section data-section="education"><h2>Education</h2><p>...</p></section>',
	'<section data-section="projects"><h2>Projects</h2><p>...</p></section>',
].join('')

describe('arrangeSections', () => {
	describe('when both hide and pin are empty (no-op)', () => {
		it('returns unchanged when both are empty', () => {
			const result = run(HTML_WITH_SECTIONS)
			expect(result).toBe(HTML_WITH_SECTIONS)
		})
	})

	describe('hide', () => {
		it('removes hidden sections', () => {
			const result = run(HTML_WITH_SECTIONS, ['publications', 'projects'])
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual(['work', 'skills', 'education'])
		})

		it('preserves source order for remaining sections', () => {
			const result = run(HTML_WITH_SECTIONS, ['skills'])
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual(['work', 'education', 'projects'])
		})

		it('header always renders regardless of hide', () => {
			const result = run(HTML_WITH_SECTIONS, [
				'work',
				'skills',
				'education',
				'projects',
			])
			const doc = parseHtml(result)

			expect(doc.hasHeader()).toBe(true)
			expect(doc.sections()).toEqual([])
		})

		it('ignores hide entries that match no section in the document', () => {
			const result = run(HTML_WITH_SECTIONS, ['awards', 'publications'])
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'work',
				'skills',
				'education',
				'projects',
			])
		})

		it('empty hide array is a no-op', () => {
			const result = run(HTML_WITH_SECTIONS, [])
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'work',
				'skills',
				'education',
				'projects',
			])
		})
	})

	describe('pin', () => {
		it('moves pinned sections to the top in specified order', () => {
			const result = run(HTML_WITH_SECTIONS, [], ['skills'])
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'skills',
				'work',
				'education',
				'projects',
			])
		})

		it('pins multiple sections in specified order, rest follow in source order', () => {
			const result = run(HTML_WITH_SECTIONS, [], ['skills', 'projects'])
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'skills',
				'projects',
				'work',
				'education',
			])
		})

		it('preserves source order for non-pinned sections', () => {
			const result = run(HTML_WITH_SECTIONS, [], ['education'])
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'education',
				'work',
				'skills',
				'projects',
			])
		})

		it('header always renders regardless of pin', () => {
			const result = run(HTML_WITH_SECTIONS, [], ['skills'])
			const doc = parseHtml(result)

			expect(doc.hasHeader()).toBe(true)
		})

		it('ignores pin entries that match no section in the document', () => {
			const result = run(HTML_WITH_SECTIONS, [], ['awards', 'skills'])
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'skills',
				'work',
				'education',
				'projects',
			])
		})

		it('empty pin array is a no-op', () => {
			const result = run(HTML_WITH_SECTIONS, [], [])
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'work',
				'skills',
				'education',
				'projects',
			])
		})
	})

	describe('hide + pin composed', () => {
		it('hides sections and pins remaining ones', () => {
			const result = run(HTML_WITH_SECTIONS, ['projects'], ['skills', 'work'])
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual(['skills', 'work', 'education'])
		})

		it('hidden sections do not appear even if document has them', () => {
			const result = run(
				HTML_WITH_SECTIONS,
				['education', 'projects'],
				['skills'],
			)
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual(['skills', 'work'])
		})
	})

	describe('edge cases', () => {
		it('handles empty HTML', () => {
			const result = run('', ['work'])
			expect(result).toBe('')
		})

		it('handles HTML with no sections', () => {
			const html = '<header><h1>Jane</h1></header><p>No sections</p>'
			const result = run(html, ['work'])
			const doc = parseHtml(result)

			expect(doc.hasHeader()).toBe(true)
			expect(doc.sections()).toEqual([])
		})
	})
})
