import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
	existsSync,
	mkdirSync,
	writeFileSync,
	rmSync,
	readFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ejectCommand } from './eject.js'
import { getBundledStyles, DEFAULT_STYLE } from '../lib/styles.js'

// Mock console output
let consoleOutput: string[] = []
const originalLog = console.log
const originalError = console.error

describe('eject command', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resum8-eject-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
		consoleOutput = []
		console.log = (...args: unknown[]) => {
			consoleOutput.push(args.map(String).join(' '))
		}
		console.error = (...args: unknown[]) => {
			consoleOutput.push(args.map(String).join(' '))
		}
	})

	afterEach(() => {
		console.log = originalLog
		console.error = originalError
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	describe('when ejecting a bundled style', () => {
		it('should copy the default style to local styles directory by default', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand(undefined, {})

			process.cwd = originalCwd
			process.exit = originalExit

			const defaultStyle = DEFAULT_STYLE
			const localPath = join(tempDir, 'styles', `${defaultStyle}.css`)
			expect(existsSync(localPath)).toBe(true)
			expect(exitCode).toBeUndefined()

			const output = consoleOutput.join('\n')
			expect(output).toContain(`Ejected ${defaultStyle} style`)
			expect(output).toContain(`styles/${defaultStyle}.css`) // Relative path is shown
		})

		it('should copy the specified bundled style to local styles directory', async () => {
			const bundled = getBundledStyles()
			expect(bundled.length).toBeGreaterThanOrEqual(1)
			const styleName = bundled[bundled.length - 1]! // Use last bundled style

			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand(styleName, {})

			process.cwd = originalCwd
			process.exit = originalExit

			const localPath = join(tempDir, 'styles', `${styleName}.css`)
			expect(existsSync(localPath)).toBe(true)
			expect(exitCode).toBeUndefined()

			const output = consoleOutput.join('\n')
			expect(output).toContain(`Ejected ${styleName} style`)
		})

		it('should preserve @import statements in ejected file instead of inlining', async () => {
			const styleName = getBundledStyles()[0]!
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			await ejectCommand(styleName, {})

			process.cwd = originalCwd
			process.exit = originalExit

			const localPath = join(tempDir, 'styles', `${styleName}.css`)
			const content = readFileSync(localPath, 'utf-8')

			// @import statements should be preserved, not inlined
			expect(content).toContain("@import 'common/base.css';")
			expect(content).toContain("@import 'common/icons.css';")
			expect(content).toContain("@import 'common/utilities.css';")

			// The ejected file should NOT contain inlined content from common files
			// (base.css defines box-sizing, icons.css defines .icon classes, etc.)
			expect(content).not.toContain('box-sizing: border-box')
		})

		it('should create the styles directory if it does not exist', async () => {
			const styleName = getBundledStyles()[0]!
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			const stylesDir = join(tempDir, 'styles')
			expect(existsSync(stylesDir)).toBe(false)

			await ejectCommand(styleName, {})

			expect(existsSync(stylesDir)).toBe(true)

			process.cwd = originalCwd
			process.exit = originalExit
		})

		it('should show usage instructions after successful ejection', async () => {
			const styleName = getBundledStyles()[0]!
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			await ejectCommand(styleName, {})

			process.cwd = originalCwd
			process.exit = originalExit

			const output = consoleOutput.join('\n')
			expect(output).toContain('The local copy will now be used')
			expect(output).toContain(`m8 resume.md --style ${styleName}`)
			expect(output).toContain('Edit the CSS to customize')
		})
	})

	describe('when the style file already exists', () => {
		it('should fail without --force flag', async () => {
			const styleName = getBundledStyles()[0]!
			// Create a pre-existing local style in a fresh temp dir
			const stylesDir = join(tempDir, 'styles')
			mkdirSync(stylesDir, { recursive: true })
			const existingContent = '/* existing style */'
			writeFileSync(join(stylesDir, `${styleName}.css`), existingContent)

			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			// Make process.exit throw to stop execution
			process.exit = ((code: number) => {
				exitCode = code
				throw new Error(`process.exit: ${code}`)
			}) as typeof process.exit

			// Expect the function to throw due to process.exit
			await expect(ejectCommand(styleName, {})).rejects.toThrow(
				'process.exit: 1',
			)

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBe(1)

			const output = consoleOutput.join('\n')
			expect(output).toContain('already exists')
			expect(output).toContain('Use --force to overwrite')

			// Verify the file was not overwritten
			const content = readFileSync(
				join(tempDir, 'styles', `${styleName}.css`),
				'utf-8',
			)
			expect(content).toBe(existingContent)
		})

		it('should overwrite with --force flag', async () => {
			const styleName = getBundledStyles()[0]!
			// Create a pre-existing local style in a fresh temp dir
			const stylesDir = join(tempDir, 'styles')
			mkdirSync(stylesDir, { recursive: true })
			const existingContent = '/* existing style */'
			writeFileSync(join(stylesDir, `${styleName}.css`), existingContent)

			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand(styleName, { force: true })

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBeUndefined()

			const output = consoleOutput.join('\n')
			expect(output).toContain(`Ejected ${styleName} style`)

			// Verify the file was overwritten
			const content = readFileSync(
				join(tempDir, 'styles', `${styleName}.css`),
				'utf-8',
			)
			expect(content).not.toBe(existingContent)
			expect(content.length).toBeGreaterThan(0)
		})
	})

	describe('when the style name is invalid', () => {
		it('should fail and show available styles', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			// Make process.exit throw to stop execution
			process.exit = ((code: number) => {
				exitCode = code
				throw new Error(`process.exit: ${code}`)
			}) as typeof process.exit

			// Expect the function to throw due to process.exit
			await expect(ejectCommand('nonexistent', {})).rejects.toThrow(
				'process.exit: 1',
			)

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBe(1)

			const output = consoleOutput.join('\n')
			expect(output).toContain('nonexistent')
			expect(output).toContain('is not a bundled style')
			expect(output).toContain('Available styles')
			// Verify all bundled styles are listed
			for (const style of getBundledStyles()) {
				expect(output).toContain(style)
			}
		})
	})

	describe('when file system operations fail', () => {
		it('should handle errors when bundled style is missing', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			// Make process.exit throw to stop execution
			process.exit = ((code: number) => {
				exitCode = code
				throw new Error(`process.exit: ${code}`)
			}) as typeof process.exit

			// Try to eject a style that doesn't exist in bundled styles
			await expect(ejectCommand('thisIsNotABundledStyle', {})).rejects.toThrow(
				'process.exit: 1',
			)

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBe(1)

			const output = consoleOutput.join('\n')
			expect(output).toContain('is not a bundled style')
		})
	})

	describe('edge cases', () => {
		it('should handle all bundled styles', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			for (const style of getBundledStyles()) {
				consoleOutput = []
				await ejectCommand(style, {})

				const localPath = join(tempDir, 'styles', `${style}.css`)
				expect(existsSync(localPath)).toBe(true)

				const output = consoleOutput.join('\n')
				expect(output).toContain(`Ejected ${style} style`)
			}

			process.cwd = originalCwd
			process.exit = originalExit
		})

		it('should preserve directory structure when styles dir already exists with other files', async () => {
			const styleName = getBundledStyles()[0]!
			const originalCwd = process.cwd
			const originalExit = process.exit

			// Create styles directory with another file
			const stylesDir = join(tempDir, 'styles')
			mkdirSync(stylesDir, { recursive: true })
			writeFileSync(join(stylesDir, 'custom.css'), '/* custom style */')

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			await ejectCommand(styleName, {})

			process.cwd = originalCwd
			process.exit = originalExit

			// Both files should exist
			expect(existsSync(join(stylesDir, 'custom.css'))).toBe(true)
			expect(existsSync(join(stylesDir, `${styleName}.css`))).toBe(true)
		})
	})

	describe('when ejecting common styles', () => {
		it('should eject common/base to styles/common/base.css', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand('common/base', {})

			process.cwd = originalCwd
			process.exit = originalExit

			const localPath = join(tempDir, 'styles', 'common', 'base.css')
			expect(existsSync(localPath)).toBe(true)
			expect(exitCode).toBeUndefined()

			const content = readFileSync(localPath, 'utf-8')
			expect(content.length).toBeGreaterThan(0)

			const output = consoleOutput.join('\n')
			expect(output).toContain('Ejected common/base style')
		})

		it('should create nested common directory even when styles dir does not exist', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			const stylesDir = join(tempDir, 'styles')
			const commonDir = join(stylesDir, 'common')
			expect(existsSync(stylesDir)).toBe(false)

			await ejectCommand('common/icons', {})

			process.cwd = originalCwd
			process.exit = originalExit

			expect(existsSync(commonDir)).toBe(true)
			expect(existsSync(join(commonDir, 'icons.css'))).toBe(true)
		})

		it('should eject all common styles individually', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			const commonStyles = ['common/base', 'common/icons', 'common/utilities']

			for (const style of commonStyles) {
				consoleOutput = []
				await ejectCommand(style, {})

				const localPath = join(tempDir, 'styles', `${style}.css`)
				expect(existsSync(localPath)).toBe(true)

				const output = consoleOutput.join('\n')
				expect(output).toContain(`Ejected ${style} style`)
			}

			process.cwd = originalCwd
			process.exit = originalExit
		})

		it('should respect --force flag for common styles', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			// Pre-create the file
			const commonDir = join(tempDir, 'styles', 'common')
			mkdirSync(commonDir, { recursive: true })
			const existingContent = '/* custom base */'
			writeFileSync(join(commonDir, 'base.css'), existingContent)

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
				throw new Error(`process.exit: ${code}`)
			}) as typeof process.exit

			// Without --force should fail
			await expect(ejectCommand('common/base', {})).rejects.toThrow(
				'process.exit: 1',
			)

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBe(1)

			// File should not be overwritten
			const content = readFileSync(join(commonDir, 'base.css'), 'utf-8')
			expect(content).toBe(existingContent)

			// With --force should succeed
			exitCode = undefined
			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand('common/base', { force: true })

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBeUndefined()
			const overwritten = readFileSync(join(commonDir, 'base.css'), 'utf-8')
			expect(overwritten).not.toBe(existingContent)
		})
	})
})
