import { describe, it, expect } from 'vitest'
import { injectVariableOverrides } from './pdf.js'

describe('injectVariableOverrides', () => {
	it('injects CSS variable overrides before </head>', () => {
		const html = `<!DOCTYPE html>
<html><head><style>body{}</style></head><body>hello</body></html>`

		const result = injectVariableOverrides(html, {
			'section-gap': '6px',
			'font-size': '10pt',
		})

		expect(result).toContain('--section-gap: 6px')
		expect(result).toContain('--font-size: 10pt')
		expect(result).toContain('</head>')
		const overrideIndex = result.indexOf('--section-gap')
		const headCloseIndex = result.indexOf('</head>')
		expect(overrideIndex).toBeLessThan(headCloseIndex)
	})

	it('returns original HTML when no overrides', () => {
		const html = `<html><head></head><body></body></html>`
		expect(injectVariableOverrides(html, {})).toBe(html)
	})
})
