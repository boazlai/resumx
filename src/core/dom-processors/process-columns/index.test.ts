import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { processColumns } from './index.js'
import type { PipelineContext } from '../types.js'

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Parse HTML string into a DOM for structural assertions
 */
function parseHtml(html: string) {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!
	return {
		body: root,
		querySelector: (selector: string) => root.querySelector(selector),
		querySelectorAll: (selector: string) => root.querySelectorAll(selector),
	}
}

/**
 * Create a pipeline context with CSS
 */
function createContext(css: string): PipelineContext {
	return {
		config: {},
		env: { css },
	}
}

// =============================================================================
// Test Fixtures
// =============================================================================

const CSS_WITH_TWO_COLUMN = `
.two-column-layout {
	display: grid;
	grid-template-columns: 2fr 1fr;
}
`

const CSS_WITHOUT_TWO_COLUMN = `
body {
	font-family: Arial;
}
`

// =============================================================================
// Tests: processColumns
// =============================================================================

describe('processColumns', () => {
	describe('when no hr exists', () => {
		it('returns unchanged when no hr element present', () => {
			const html =
				'<header><h1>Name</h1></header><h2>Section</h2><p>Content</p>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))

			expect(result).toBe(html)
		})

		it('returns unchanged for empty input', () => {
			const result = processColumns('', createContext(CSS_WITH_TWO_COLUMN))
			expect(result).toBe('')
		})
	})

	describe('two-column layout creation', () => {
		it('creates two-column layout when hr exists and CSS supports it', () => {
			const html =
				'<header><h1>Name</h1></header><h2>Exp</h2><hr><h2>Skills</h2>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const layout = doc.querySelector('.two-column-layout')
			expect(layout).toBeTruthy()
		})

		it('creates primary and secondary columns', () => {
			const html = '<h2>Experience</h2><hr><h2>Skills</h2>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const primary = doc.querySelector('.primary')
			const secondary = doc.querySelector('.secondary')

			expect(primary).toBeTruthy()
			expect(secondary).toBeTruthy()
		})

		it('places content before hr in primary column', () => {
			const html = '<h2>Experience</h2><p>Job details</p><hr><h2>Skills</h2>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const primary = doc.querySelector('.primary')
			expect(primary?.querySelector('h2')?.textContent).toBe('Experience')
			expect(primary?.querySelector('p')?.textContent).toBe('Job details')
		})

		it('places content after hr in secondary column', () => {
			const html = '<h2>Experience</h2><hr><h2>Skills</h2><p>Skill list</p>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const secondary = doc.querySelector('.secondary')
			expect(secondary?.querySelector('h2')?.textContent).toBe('Skills')
			expect(secondary?.querySelector('p')?.textContent).toBe('Skill list')
		})
	})

	describe('header handling in two-column mode', () => {
		it('places header inside two-column-layout', () => {
			const html =
				'<header><h1>Name</h1></header><h2>Exp</h2><hr><h2>Skills</h2>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const layout = doc.querySelector('.two-column-layout')
			const header = doc.querySelector('header')

			expect(header?.parentElement).toBe(layout)
		})

		it('header comes before primary column', () => {
			const html =
				'<header><h1>Name</h1></header><h2>Exp</h2><hr><h2>Skills</h2>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const layout = doc.querySelector('.two-column-layout')
			const children = Array.from(layout?.children || [])
			const headerIndex = children.findIndex(el => el.tagName === 'HEADER')
			const primaryIndex = children.findIndex(el =>
				el.classList.contains('primary'),
			)

			expect(headerIndex).toBeLessThan(primaryIndex)
		})

		it('header is not placed in primary or secondary columns', () => {
			const html =
				'<header><h1>Name</h1></header><h2>Exp</h2><hr><h2>Skills</h2>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const primary = doc.querySelector('.primary')
			const secondary = doc.querySelector('.secondary')

			expect(primary?.querySelector('header')).toBeNull()
			expect(secondary?.querySelector('header')).toBeNull()
		})
	})

	describe('hr element handling', () => {
		it('removes all hr elements from output', () => {
			const html = '<h2>Exp</h2><hr><h2>Skills</h2><hr><h2>Other</h2>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			expect(doc.querySelector('hr')).toBeNull()
		})

		it('uses only first hr as column divider', () => {
			const html = '<h2>A</h2><h2>B</h2><hr><h2>C</h2><hr><h2>D</h2>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const primary = doc.querySelector('.primary')
			const secondary = doc.querySelector('.secondary')

			// A and B should be in primary
			expect(primary?.querySelectorAll('h2').length).toBe(2)
			// C and D should be in secondary
			expect(secondary?.querySelectorAll('h2').length).toBe(2)
		})
	})

	describe('CSS without two-column support', () => {
		it('does not create two-column layout', () => {
			const html =
				'<header><h1>Name</h1></header><h2>Exp</h2><hr><h2>Skills</h2>'
			const result = processColumns(html, createContext(CSS_WITHOUT_TWO_COLUMN))
			const doc = parseHtml(result)

			expect(doc.querySelector('.two-column-layout')).toBeNull()
		})

		it('removes hr element from output', () => {
			const html = '<h2>Exp</h2><hr><h2>Skills</h2>'
			const result = processColumns(html, createContext(CSS_WITHOUT_TWO_COLUMN))
			const doc = parseHtml(result)

			expect(doc.querySelector('hr')).toBeNull()
		})

		it('preserves all content in linear order', () => {
			const html =
				'<h2>Experience</h2><p>Job</p><hr><h2>Skills</h2><p>Skill</p>'
			const result = processColumns(html, createContext(CSS_WITHOUT_TWO_COLUMN))
			const doc = parseHtml(result)

			const h2s = doc.querySelectorAll('h2')
			expect(h2s.length).toBe(2)
			expect(h2s[0].textContent).toBe('Experience')
			expect(h2s[1].textContent).toBe('Skills')
		})

		it('preserves header in output', () => {
			const html =
				'<header><h1>Name</h1></header><h2>Exp</h2><hr><h2>Skills</h2>'
			const result = processColumns(html, createContext(CSS_WITHOUT_TWO_COLUMN))
			const doc = parseHtml(result)

			const header = doc.querySelector('header')
			expect(header).toBeTruthy()
			expect(header?.querySelector('h1')?.textContent).toBe('Name')
		})
	})

	describe('CSS detection patterns', () => {
		it.each([
			['.two-column-layout { display: grid; }', true],
			['.two-column-layout{ display: grid; }', true],
			['.two-column-layout  {display: grid}', true],
			['.two-column-layout\n{\n  display: grid;\n}', true],
			['.other-class { display: grid; }', false],
			['two-column-layout { display: grid; }', false],
			['', false],
		])('CSS "%s" supports two-column: %s', (css, expected) => {
			const html = '<h2>Exp</h2><hr><h2>Skills</h2>'
			const result = processColumns(html, createContext(css))
			const doc = parseHtml(result)

			if (expected) {
				expect(doc.querySelector('.two-column-layout')).toBeTruthy()
			} else {
				expect(doc.querySelector('.two-column-layout')).toBeNull()
			}
		})
	})

	describe('complex content scenarios', () => {
		it('handles multiple paragraphs in each column', () => {
			const html = `
				<h2>Experience</h2>
				<p>Job 1</p>
				<p>Job 2</p>
				<hr>
				<h2>Skills</h2>
				<p>Skill 1</p>
				<p>Skill 2</p>
			`
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const primary = doc.querySelector('.primary')
			const secondary = doc.querySelector('.secondary')

			expect(primary?.querySelectorAll('p').length).toBe(2)
			expect(secondary?.querySelectorAll('p').length).toBe(2)
		})

		it('handles nested elements in content', () => {
			const html = `
				<h2>Experience</h2>
				<div><p>Nested content</p></div>
				<hr>
				<h2>Skills</h2>
				<ul><li>Item 1</li><li>Item 2</li></ul>
			`
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const primary = doc.querySelector('.primary')
			const secondary = doc.querySelector('.secondary')

			expect(primary?.querySelector('div p')).toBeTruthy()
			expect(secondary?.querySelectorAll('li').length).toBe(2)
		})

		it('handles content with only hr (empty columns)', () => {
			const html = '<hr>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const layout = doc.querySelector('.two-column-layout')
			expect(layout).toBeTruthy()

			const primary = doc.querySelector('.primary')
			const secondary = doc.querySelector('.secondary')
			expect(primary?.children.length).toBe(0)
			expect(secondary?.children.length).toBe(0)
		})

		it('handles hr at start (empty primary)', () => {
			const html = '<hr><h2>Skills</h2>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const primary = doc.querySelector('.primary')
			const secondary = doc.querySelector('.secondary')

			expect(primary?.children.length).toBe(0)
			expect(secondary?.querySelector('h2')).toBeTruthy()
		})

		it('handles hr at end (empty secondary)', () => {
			const html = '<h2>Experience</h2><hr>'
			const result = processColumns(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const primary = doc.querySelector('.primary')
			const secondary = doc.querySelector('.secondary')

			expect(primary?.querySelector('h2')).toBeTruthy()
			expect(secondary?.children.length).toBe(0)
		})
	})
})
