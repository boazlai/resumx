import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
	resolveStyle,
	listStyles,
	getBundledStylePath,
	getBundledStyles,
	getLocalStylePath,
	parseCssVariables,
	DEFAULT_STYLE,
} from './styles.js'

describe('styles', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resum8-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	describe('getBundledStylePath', () => {
		it('returns path for bundled styles', () => {
			for (const style of getBundledStyles()) {
				const path = getBundledStylePath(style)
				expect(path).toBeDefined()
				expect(existsSync(path!)).toBe(true)
			}
		})

		it('returns undefined for non-existent style', () => {
			expect(getBundledStylePath('nonexistent')).toBeUndefined()
		})
	})

	describe('getLocalStylePath', () => {
		it('returns undefined when no local styles exist', () => {
			expect(getLocalStylePath('nonexistent', tempDir)).toBeUndefined()
		})

		it('returns path when local style exists', () => {
			const stylesDir = join(tempDir, 'styles')
			mkdirSync(stylesDir)
			writeFileSync(join(stylesDir, 'custom.css'), '/* custom */')

			const path = getLocalStylePath('custom', tempDir)
			expect(path).toBeDefined()
			expect(existsSync(path!)).toBe(true)
		})
	})

	describe('resolveStyle', () => {
		it('resolves bundled default style by name', () => {
			// Callers are responsible for providing defaults; this verifies the fallback works
			const path = resolveStyle(DEFAULT_STYLE, tempDir)
			expect(path).toContain(DEFAULT_STYLE)
			expect(existsSync(path)).toBe(true)
		})

		it('prefers local style over bundled', () => {
			const bundled = getBundledStyles()[0]!
			const stylesDir = join(tempDir, 'styles')
			mkdirSync(stylesDir)
			writeFileSync(join(stylesDir, `${bundled}.css`), `/* local ${bundled} */`)

			const path = resolveStyle(bundled, tempDir)
			expect(path).toContain(tempDir)
		})

		it('resolves bundled style by name', () => {
			const bundled = getBundledStyles()
			expect(bundled.length).toBeGreaterThanOrEqual(1)
			for (const style of bundled) {
				const path = resolveStyle(style, tempDir)
				expect(path).toContain(`${style}.css`)
				expect(existsSync(path)).toBe(true)
			}
		})

		it('resolves absolute path', () => {
			const cssPath = join(tempDir, 'my.css')
			writeFileSync(cssPath, '/* my css */')

			const path = resolveStyle(cssPath, tempDir)
			expect(path).toBe(cssPath)
		})

		it('resolves relative path', () => {
			const cssPath = join(tempDir, 'custom.css')
			writeFileSync(cssPath, '/* custom */')

			const path = resolveStyle('./custom.css', tempDir)
			expect(path).toBe(cssPath)
		})

		it('throws for non-existent style name', () => {
			expect(() => resolveStyle('nonexistent', tempDir)).toThrow(
				"Style 'nonexistent' not found",
			)
		})

		it('throws for non-existent path', () => {
			expect(() => resolveStyle('./missing.css', tempDir)).toThrow(
				'Style file not found',
			)
		})
	})

	describe('listStyles', () => {
		it('lists bundled styles when no local', () => {
			const styles = listStyles(tempDir)
			expect(styles.length).toBe(getBundledStyles().length)
			expect(styles.every(s => s.isBundled)).toBe(true)
			expect(styles.every(s => !s.isLocal)).toBe(true)
		})

		it('includes local styles', () => {
			const stylesDir = join(tempDir, 'styles')
			mkdirSync(stylesDir)
			writeFileSync(join(stylesDir, 'custom.css'), '/* custom */')

			const styles = listStyles(tempDir)
			const custom = styles.find(s => s.name === 'custom')
			expect(custom).toBeDefined()
			expect(custom!.isLocal).toBe(true)
			expect(custom!.isBundled).toBe(false)
		})

		it('marks shadowed bundled styles as local', () => {
			const bundled = getBundledStyles()[0]!
			const stylesDir = join(tempDir, 'styles')
			mkdirSync(stylesDir)
			writeFileSync(join(stylesDir, `${bundled}.css`), `/* local ${bundled} */`)

			const styles = listStyles(tempDir)
			const shadowed = styles.find(s => s.name === bundled)
			expect(shadowed).toBeDefined()
			expect(shadowed!.isLocal).toBe(true)
			expect(shadowed!.isBundled).toBe(true) // Still marked as bundled (shadowed)

			// Should not have duplicate
			const count = styles.filter(s => s.name === bundled).length
			expect(count).toBe(1)
		})
	})

	describe('parseCssVariables', () => {
		it('parses CSS variables from :root block', () => {
			const css = `
:root {
	--font-family: 'Georgia', serif;
	--base-font-size: 10pt;
	--text-color: #222;
}
body { color: var(--text-color); }
`
			const vars = parseCssVariables(css)
			expect(vars).toEqual([
				{ name: '--font-family', value: "'Georgia', serif" },
				{ name: '--base-font-size', value: '10pt' },
				{ name: '--text-color', value: '#222' },
			])
		})

		it('returns empty array when no :root block', () => {
			const css = `body { color: red; }`
			const vars = parseCssVariables(css)
			expect(vars).toEqual([])
		})

		it('returns empty array when :root has no variables', () => {
			const css = `:root { font-size: 16px; }`
			const vars = parseCssVariables(css)
			expect(vars).toEqual([])
		})

		it('handles multiline variable values', () => {
			const css = `
:root {
	--font-family:
		'Palatino Linotype', 'Palatino', 'Georgia', serif;
	--base-font-size: 10pt;
}
`
			const vars = parseCssVariables(css)
			expect(vars).toEqual([
				{
					name: '--font-family',
					value: "'Palatino Linotype', 'Palatino', 'Georgia', serif",
				},
				{ name: '--base-font-size', value: '10pt' },
			])
		})

		it.each(getBundledStyles())(
			'parses bundled %s style without crashing',
			style => {
				const stylePath = getBundledStylePath(style)
				expect(stylePath).toBeDefined()
				const css = require('node:fs').readFileSync(stylePath!, 'utf-8')
				const vars = parseCssVariables(css)

				// Structural: every returned variable has a valid shape
				for (const v of vars) {
					expect(v.name).toMatch(/^--[\w-]+$/)
					expect(v.value.trim().length).toBeGreaterThan(0)
				}
			},
		)
	})
})
