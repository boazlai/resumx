import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createConfigStore } from './config.js'
import { mergeVariables, generateVariablesCSS } from './styles.js'

describe('config', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resum8-config-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	describe('mergeVariables', () => {
		it('returns empty object when no variables', () => {
			expect(mergeVariables(undefined, undefined)).toEqual({})
		})

		it('returns config vars when no CLI vars', () => {
			const configVars = { a: '1', b: '2' }
			expect(mergeVariables(configVars, undefined)).toEqual(configVars)
		})

		it('returns CLI vars when no config vars', () => {
			const cli = { a: '1', b: '2' }
			expect(mergeVariables(undefined, cli)).toEqual(cli)
		})

		it('CLI vars override config vars', () => {
			const configVars = { a: 'config', b: 'config' }
			const cli = { a: 'cli' }
			expect(mergeVariables(configVars, cli)).toEqual({
				a: 'cli',
				b: 'config',
			})
		})
	})

	describe('generateVariablesCSS', () => {
		it('returns empty string for empty variables', () => {
			expect(generateVariablesCSS({})).toBe('')
		})

		it('generates CSS variables block', () => {
			const css = generateVariablesCSS({
				'font-family': 'Arial',
				'base-font-size': '11pt',
			})

			expect(css).toContain(':root {')
			expect(css).toContain('--font-family: Arial;')
			expect(css).toContain('--base-font-size: 11pt;')
			expect(css).toContain('}')
		})
	})

	describe('ConfigStore', () => {
		let configDir: string

		beforeEach(() => {
			configDir = join(tempDir, '.config', 'resum8')
			mkdirSync(configDir, { recursive: true })
		})

		describe('getStyleVariables', () => {
			it('returns empty object when no config exists', () => {
				const store = createConfigStore(configDir)
				expect(store.getStyleVariables('classic')).toEqual({})
			})

			it('returns empty object when style has no variables', () => {
				const store = createConfigStore(configDir)
				store.defaultStyle = 'formal'
				expect(store.getStyleVariables('classic')).toEqual({})
			})

			it('returns variables for a style', () => {
				const store = createConfigStore(configDir)
				store.setStyleVariables('classic', {
					'font-family': 'Arial',
					'text-color': '#000',
				})

				expect(store.getStyleVariables('classic')).toEqual({
					'font-family': 'Arial',
					'text-color': '#000',
				})
			})

			it('returns empty object for different style', () => {
				const store = createConfigStore(configDir)
				store.setStyleVariables('classic', { 'font-family': 'Arial' })

				expect(store.getStyleVariables('formal')).toEqual({})
			})
		})

		describe('setStyleVariables', () => {
			it('creates config and sets variables for new style', () => {
				const store = createConfigStore(configDir)
				store.setStyleVariables('classic', { 'font-family': 'Arial' })

				expect(store.store.styleVariables?.classic).toEqual({
					'font-family': 'Arial',
				})
			})

			it('merges with existing style variables', () => {
				const store = createConfigStore(configDir)
				store.setStyleVariables('classic', { 'font-family': 'Arial' })
				store.setStyleVariables('classic', { 'text-color': '#000' })

				expect(store.store.styleVariables?.classic).toEqual({
					'font-family': 'Arial',
					'text-color': '#000',
				})
			})

			it('overwrites existing variable value', () => {
				const store = createConfigStore(configDir)
				store.setStyleVariables('classic', { 'font-family': 'Arial' })
				store.setStyleVariables('classic', { 'font-family': 'Helvetica' })

				expect(store.store.styleVariables?.classic?.['font-family']).toBe(
					'Helvetica',
				)
			})

			it('preserves other styles when setting variables', () => {
				const store = createConfigStore(configDir)
				store.setStyleVariables('classic', { 'font-family': 'Arial' })
				store.setStyleVariables('formal', { 'section-header-color': '#0066cc' })

				expect(store.store.styleVariables?.classic).toEqual({
					'font-family': 'Arial',
				})
				expect(store.store.styleVariables?.formal).toEqual({
					'section-header-color': '#0066cc',
				})
			})

			it('preserves other config settings', () => {
				const store = createConfigStore(configDir)
				store.defaultStyle = 'formal'
				store.setStyleVariables('classic', { 'font-family': 'Arial' })

				expect(store.defaultStyle).toBe('formal')
				expect(store.store.styleVariables?.classic).toEqual({
					'font-family': 'Arial',
				})
			})
		})

		describe('resetStyleVariables', () => {
			it('removes variables for a style', () => {
				const store = createConfigStore(configDir)
				store.setStyleVariables('classic', {
					'font-family': 'Arial',
					'text-color': '#000',
				})
				store.resetStyleVariables('classic')

				expect(store.store.styleVariables?.classic).toBeUndefined()
			})

			it('preserves other styles when resetting', () => {
				const store = createConfigStore(configDir)
				store.setStyleVariables('classic', { 'font-family': 'Arial' })
				store.setStyleVariables('formal', { 'section-header-color': '#0066cc' })

				store.resetStyleVariables('classic')

				expect(store.store.styleVariables?.classic).toBeUndefined()
				expect(store.store.styleVariables?.formal).toEqual({
					'section-header-color': '#0066cc',
				})
			})

			it('preserves other config settings when resetting', () => {
				const store = createConfigStore(configDir)
				store.defaultStyle = 'formal'
				store.setStyleVariables('classic', { 'font-family': 'Arial' })

				store.resetStyleVariables('classic')

				expect(store.defaultStyle).toBe('formal')
				expect(store.store.styleVariables?.classic).toBeUndefined()
			})

			it('does nothing if style has no variables', () => {
				const store = createConfigStore(configDir)
				store.defaultStyle = 'formal'

				// Should not throw
				store.resetStyleVariables('classic')

				expect(store.defaultStyle).toBe('formal')
			})

			it('does nothing if config does not exist', () => {
				const store = createConfigStore(configDir)

				// Should not throw
				store.resetStyleVariables('classic')

				expect(store.getStyleVariables('classic')).toEqual({})
			})
		})

		describe('defaultStyle', () => {
			it('returns default when not set', () => {
				const store = createConfigStore(configDir)
				expect(store.defaultStyle).toBe('classic')
			})

			it('can be set and retrieved', () => {
				const store = createConfigStore(configDir)
				store.defaultStyle = 'modern'
				expect(store.defaultStyle).toBe('modern')
			})

			it('can be reset with resetDefaultStyle()', () => {
				const store = createConfigStore(configDir)
				store.defaultStyle = 'modern'
				store.resetDefaultStyle()
				expect(store.defaultStyle).toBe('classic')
			})
		})

		describe('path', () => {
			it('returns config file path', () => {
				const store = createConfigStore(configDir)
				expect(store.path).toContain('config.json')
				expect(store.path).toContain(configDir)
			})
		})

		describe('clear', () => {
			it('clears all config', () => {
				const store = createConfigStore(configDir)
				store.defaultStyle = 'modern'
				store.setStyleVariables('classic', { color: 'red' })

				store.clear()

				// clear() wipes file; conf returns defaults for missing keys
				expect(store.defaultStyle).toBe('classic')
				expect(store.getStyleVariables('classic')).toEqual({})
			})
		})
	})
})
