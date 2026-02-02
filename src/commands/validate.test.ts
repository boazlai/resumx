import {
	describe,
	it,
	expect,
	vi,
	beforeEach,
	afterEach,
	MockInstance,
} from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

async function withTempDirAsync<T>(
	fn: (dir: string) => Promise<T>,
): Promise<T> {
	const dir = mkdtempSync(join(tmpdir(), 'validate-test-'))
	try {
		return await fn(dir)
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
}

// =============================================================================
// Test Fixtures
// =============================================================================

const VALID_RESUME = `# John Doe

> john@example.com | 555-123-4567

## Education

### University [2020 – 2024]{.right}

- GPA: 4.0
- Dean's List

## Work Experience

### Company [2024 – Present]{.right}

- Built scalable systems
- Led team of 5
`

const INVALID_RESUME = `## Education

### University

- Some content
`

const RESUME_WITH_VALIDATE_CONFIG = `---
validate:
  extends: minimal
  rules:
    no-entries: off
---
# John Doe

> john@example.com

## Skills

Languages
: TypeScript
`

// =============================================================================
// Tests
// =============================================================================

describe('validateCommand', () => {
	let validateCommand: typeof import('./validate.js').validateCommand
	let mockExit: MockInstance
	let mockConsoleLog: MockInstance
	let mockConsoleError: MockInstance
	const originalCwd = process.cwd()

	beforeEach(async () => {
		const module = await import('./validate.js')
		validateCommand = module.validateCommand

		// Mock process.exit
		mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
			throw new Error('process.exit called')
		})

		// Mock console
		mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
		mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
		process.chdir(originalCwd)
	})

	describe('file handling', () => {
		it('should exit with error for non-existent file', async () => {
			await withTempDirAsync(async dir => {
				process.chdir(dir)

				await expect(validateCommand('nonexistent.md', {})).rejects.toThrow(
					'process.exit called',
				)

				expect(mockConsoleError).toHaveBeenCalled()
				expect(mockExit).toHaveBeenCalledWith(1)
			})
		})

		it('should read file from current directory', async () => {
			await withTempDirAsync(async dir => {
				process.chdir(dir)
				writeFileSync(join(dir, 'resume.md'), VALID_RESUME)

				await validateCommand('resume.md', {})

				expect(mockExit).not.toHaveBeenCalled()
			})
		})
	})

	describe('validation results', () => {
		it('should exit with 0 for valid resume', async () => {
			await withTempDirAsync(async dir => {
				process.chdir(dir)
				writeFileSync(join(dir, 'resume.md'), VALID_RESUME)

				await validateCommand('resume.md', {})

				expect(mockExit).not.toHaveBeenCalled()
			})
		})

		it('should exit with 1 for invalid resume with errors', async () => {
			await withTempDirAsync(async dir => {
				process.chdir(dir)
				writeFileSync(join(dir, 'resume.md'), INVALID_RESUME)

				await expect(validateCommand('resume.md', {})).rejects.toThrow(
					'process.exit called',
				)
				expect(mockExit).toHaveBeenCalledWith(1)
			})
		})
	})

	describe('--strict option', () => {
		it('should exit with 1 for any issues in strict mode', async () => {
			await withTempDirAsync(async dir => {
				process.chdir(dir)
				// This resume has warnings (no-entries) but no errors
				const warningResume = `# John Doe

> john@example.com

## Skills

Languages
: TypeScript
`
				writeFileSync(join(dir, 'resume.md'), warningResume)

				await expect(
					validateCommand('resume.md', { strict: true }),
				).rejects.toThrow('process.exit called')
				expect(mockExit).toHaveBeenCalledWith(1)
			})
		})
	})

	describe('--min-severity option', () => {
		it('should filter issues by minimum severity', async () => {
			await withTempDirAsync(async dir => {
				process.chdir(dir)
				writeFileSync(join(dir, 'resume.md'), VALID_RESUME)

				await validateCommand('resume.md', { minSeverity: 'critical' })

				// Should not show warnings, notes, or bonus
				expect(mockExit).not.toHaveBeenCalled()
			})
		})
	})

	describe('frontmatter config', () => {
		it('should read validation config from frontmatter', async () => {
			await withTempDirAsync(async dir => {
				process.chdir(dir)
				writeFileSync(join(dir, 'resume.md'), RESUME_WITH_VALIDATE_CONFIG)

				await validateCommand('resume.md', {})

				// Should not exit with error (no-entries is disabled)
				expect(mockExit).not.toHaveBeenCalled()
			})
		})
	})
})
