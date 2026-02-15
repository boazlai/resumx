import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { extractHeader } from './index.js'
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
 * Create a minimal pipeline context for testing
 */
function createContext(): PipelineContext {
	return {
		config: {},
		env: { css: '' },
	}
}

// =============================================================================
// Tests: extractHeader
// =============================================================================

describe('extractHeader', () => {
	describe('basic extraction', () => {
		it('extracts content before first h2 into header element', () => {
			const html =
				'<h1>John Doe</h1><p>Contact info</p><h2>Experience</h2><p>Job</p>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			const header = doc.querySelector('header')
			expect(header).toBeTruthy()
			expect(header?.querySelector('h1')?.textContent).toBe('John Doe')
			expect(header?.querySelector('p')?.textContent).toBe('Contact info')
		})

		it('extracts multiple elements before h2 into header', () => {
			const html =
				'<h1>Name</h1><p>Email</p><p>Phone</p><blockquote>Links</blockquote><h2>Section</h2>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			const header = doc.querySelector('header')
			expect(header?.querySelectorAll('p').length).toBe(2)
			expect(header?.querySelector('blockquote')).toBeTruthy()
		})

		it('preserves h2 and content after header', () => {
			const html = '<h1>Name</h1><h2>Experience</h2><p>Job details</p>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			const h2 = doc.querySelector('h2')
			expect(h2?.textContent).toBe('Experience')
			expect(doc.querySelectorAll('p').length).toBe(1)
		})
	})

	describe('structural relationships', () => {
		it('header and h2 are siblings, not nested', () => {
			const html = '<h1>Name</h1><h2>Section</h2>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			const header = doc.querySelector('header')
			const h2 = doc.querySelector('h2')

			// h2 should not be inside header
			expect(header?.querySelector('h2')).toBeNull()

			// Both should be direct children of root
			expect(header?.parentElement).toBe(doc.body)
			expect(h2?.parentElement).toBe(doc.body)
		})

		it('header appears before h2 in DOM order', () => {
			const html = '<h1>Name</h1><p>Info</p><h2>Section</h2>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			const children = Array.from(doc.body.children)
			const header = doc.querySelector('header')
			const h2 = doc.querySelector('h2')

			const headerIndex = children.indexOf(header as Element)
			const h2Index = children.indexOf(h2 as Element)

			expect(headerIndex).toBeLessThan(h2Index)
		})

		it('preserves all content after h2 including multiple sections', () => {
			const html =
				'<h1>Name</h1><h2>Section1</h2><p>Content1</p><h2>Section2</h2><p>Content2</p>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			expect(doc.querySelectorAll('h2').length).toBe(2)
			expect(doc.querySelectorAll('p').length).toBe(2)
		})
	})

	describe('edge cases - no extraction', () => {
		it('returns unchanged when h2 is first element', () => {
			const html = '<h2>Experience</h2><p>Job</p>'
			const result = extractHeader(html, createContext())

			expect(result).toBe(html)
		})

		it('returns unchanged when no h2 exists', () => {
			const html = '<h1>Name</h1><p>Content without sections</p>'
			const result = extractHeader(html, createContext())

			expect(result).toBe(html)
		})

		it('returns unchanged for empty input', () => {
			const result = extractHeader('', createContext())
			expect(result).toBe('')
		})
	})

	describe('element attribute preservation', () => {
		it('preserves classes on header content elements', () => {
			const html = '<h1 class="text-3xl font-bold">Name</h1><h2>Section</h2>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			const h1 = doc.querySelector('header h1')
			expect(h1?.getAttribute('class')).toBe('text-3xl font-bold')
		})

		it('preserves IDs on header content elements', () => {
			const html = '<h1 id="name">Name</h1><h2>Section</h2>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			const h1 = doc.querySelector('header h1')
			expect(h1?.getAttribute('id')).toBe('name')
		})

		it('preserves nested structure within header elements', () => {
			const html =
				'<p><strong>Name:</strong> <a href="#">Link</a></p><h2>Section</h2>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			const header = doc.querySelector('header')
			expect(header?.querySelector('strong')?.textContent).toBe('Name:')
			expect(header?.querySelector('a')?.getAttribute('href')).toBe('#')
		})
	})

	describe('complex content scenarios', () => {
		it('handles header content with icons/images', () => {
			const html =
				'<h1>Name</h1><p><img src="icon.png" alt="icon">john@email.com</p><h2>Section</h2>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			const img = doc.querySelector('header img')
			expect(img?.getAttribute('src')).toBe('icon.png')
		})

		it('handles blockquote in header content', () => {
			const html =
				'<h1>Name</h1><blockquote>Contact info here</blockquote><h2>Section</h2>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			const blockquote = doc.querySelector('header blockquote')
			expect(blockquote).toBeTruthy()
			expect(blockquote?.textContent).toContain('Contact info')
		})

		it('handles list in header content', () => {
			const html =
				'<h1>Name</h1><ul><li>Email</li><li>Phone</li></ul><h2>Section</h2>'
			const result = extractHeader(html, createContext())
			const doc = parseHtml(result)

			const list = doc.querySelector('header ul')
			expect(list?.querySelectorAll('li').length).toBe(2)
		})
	})
})
