import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
	resolveTheme,
	listThemes,
	getBundledThemePath,
	getBundledThemes,
	parseCssVariables,
	DEFAULT_THEME,
} from './themes.js'

describe('themes', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resumx-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	describe('getBundledThemePath', () => {
		it('returns path for bundled themes', () => {
			for (const theme of getBundledThemes()) {
				const path = getBundledThemePath(theme)
				expect(path).toBeDefined()
				expect(existsSync(path!)).toBe(true)
			}
		})

		it('returns undefined for non-existent theme', () => {
			expect(getBundledThemePath('nonexistent')).toBeUndefined()
		})
	})

	describe('resolveTheme', () => {
		it('resolves bundled default theme by name', () => {
			// Callers are responsible for providing defaults; this verifies the fallback works
			const path = resolveTheme(DEFAULT_THEME, tempDir)
			expect(path).toContain(DEFAULT_THEME)
			expect(existsSync(path)).toBe(true)
		})

		it('resolves bundled theme by name', () => {
			const bundled = getBundledThemes()
			expect(bundled.length).toBeGreaterThanOrEqual(1)
			for (const theme of bundled) {
				const path = resolveTheme(theme, tempDir)
				expect(path).toContain(`${theme}.css`)
				expect(existsSync(path)).toBe(true)
			}
		})

		it('resolves absolute path', () => {
			const cssPath = join(tempDir, 'my.css')
			writeFileSync(cssPath, '/* my css */')

			const path = resolveTheme(cssPath, tempDir)
			expect(path).toBe(cssPath)
		})

		it('resolves relative path', () => {
			const cssPath = join(tempDir, 'custom.css')
			writeFileSync(cssPath, '/* custom */')

			const path = resolveTheme('./custom.css', tempDir)
			expect(path).toBe(cssPath)
		})

		it('throws for non-existent theme name', () => {
			expect(() => resolveTheme('nonexistent', tempDir)).toThrow(
				"Theme 'nonexistent' not found",
			)
		})

		it('throws for non-existent path', () => {
			expect(() => resolveTheme('./missing.css', tempDir)).toThrow(
				'Theme file not found',
			)
		})
	})

	describe('listThemes', () => {
		it('lists all bundled themes', () => {
			const themes = listThemes()
			expect(themes.length).toBe(getBundledThemes().length)
			for (const theme of themes) {
				expect(theme.name).toBeTruthy()
				expect(existsSync(theme.path)).toBe(true)
			}
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

		it.each(getBundledThemes())(
			'parses bundled %s theme without crashing',
			theme => {
				const themePath = getBundledThemePath(theme)
				expect(themePath).toBeDefined()
				const css = require('node:fs').readFileSync(themePath!, 'utf-8')
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
