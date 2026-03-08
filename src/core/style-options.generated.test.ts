import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	generate,
	extractStyleOptions,
} from '../../scripts/generate-style-options.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')

describe('generate-style-options', () => {
	describe('extractStyleOptions', () => {
		it('extracts variables from a :root block', () => {
			const css = `
@layer base {
	:root {
		--font-size: 11pt; /* any font-size */
		--header-align: center; /* left | center | right */
	}
}`
			const options = extractStyleOptions(css)

			expect(options).toEqual([
				{ name: 'font-size', numeric: false, values: null },
				{
					name: 'header-align',
					numeric: false,
					values: ['left', 'center', 'right'],
				},
			])
		})

		it('skips @internal variables', () => {
			const css = `
@layer base {
	:root {
		--font-size: 11pt; /* any font-size */
		--icon-size: 0.8em; /* @internal any length */
	}
}`
			const options = extractStyleOptions(css)

			expect(options).toHaveLength(1)
			expect(options[0]!.name).toBe('font-size')
		})

		it('handles multi-line values', () => {
			const css = `
@layer base {
	:root {
		--font-family:
			'Georgia', serif;
		--font-size: 11pt; /* any font-size */
	}
}`
			const options = extractStyleOptions(css)
			const names = options.map(o => o.name)

			expect(names).toContain('font-family')
			expect(names).toContain('font-size')
		})

		it('treats "any" prefix comments as freeform', () => {
			const css = `
@layer base {
	:root {
		--text-color: #333; /* any color */
	}
}`
			const options = extractStyleOptions(css)

			expect(options[0]).toEqual({
				name: 'text-color',
				numeric: false,
				values: null,
			})
		})

		it('parses mixed string/number enums', () => {
			const css = `
@layer base {
	:root {
		--name-weight: normal; /* normal | bold | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 */
	}
}`
			const options = extractStyleOptions(css)

			expect(options[0]).toEqual({
				name: 'name-weight',
				numeric: false,
				values: ['normal', 'bold', 100, 200, 300, 400, 500, 600, 700, 800, 900],
			})
		})

		it('marks @number variables as numeric', () => {
			const css = `
@layer base {
	:root {
		--line-height: 1.4; /* @number, any unitless ratio */
		--font-size: 11pt; /* any font-size */
	}
}`
			const options = extractStyleOptions(css)

			expect(options[0]).toEqual({
				name: 'line-height',
				numeric: true,
				values: null,
			})
			expect(options[1]).toEqual({
				name: 'font-size',
				numeric: false,
				values: null,
			})
		})

		it('treats pipe-separated comments as enum', () => {
			const css = `
@layer base {
	:root {
		--bullet-style: disc; /* disc | circle | square | none */
	}
}`
			const options = extractStyleOptions(css)

			expect(options[0]).toEqual({
				name: 'bullet-style',
				numeric: false,
				values: ['disc', 'circle', 'square', 'none'],
			})
		})
	})

	describe('freshness guard', () => {
		it('generated TS file matches what codegen would produce', () => {
			const { ts } = generate()
			const committed = readFileSync(
				resolve(ROOT, 'src/core/style-options.generated.ts'),
				'utf-8',
			)

			expect(committed).toBe(ts)
		})

		it('generated JSON Schema matches what codegen would produce', () => {
			const { json } = generate()
			const committed = readFileSync(
				resolve(ROOT, 'schemas/style-options.schema.json'),
				'utf-8',
			)

			expect(committed).toBe(json)
		})
	})
})
