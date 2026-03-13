import {
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
	vi,
	type MockInstance,
} from 'vitest'
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { classifyError } from './events.js'

const CONFIG_DIR_KEY = 'CONFIG_DIR'
const CONFIG_PATH_KEY = 'CONFIG_PATH'

let tempDir: string

beforeEach(() => {
	tempDir = join(tmpdir(), `resumx-telemetry-test-${Date.now()}`)
	mkdirSync(tempDir, { recursive: true })
})

afterEach(() => {
	rmSync(tempDir, { recursive: true, force: true })
	vi.restoreAllMocks()
	vi.resetModules()
})

async function loadModule(env: Record<string, string | undefined> = {}) {
	for (const [key, value] of Object.entries(env)) {
		if (value === undefined) {
			delete process.env[key]
		} else {
			process.env[key] = value
		}
	}

	vi.doMock('node:os', async () => {
		const actual = await vi.importActual<typeof import('node:os')>('node:os')
		return { ...actual, homedir: () => tempDir }
	})

	vi.doMock('posthog-node', () => {
		const captures: Array<{
			distinctId: string
			event: string
			properties: Record<string, unknown>
		}> = []
		return {
			PostHog: class {
				captures = captures
				capture(msg: {
					distinctId: string
					event: string
					properties: Record<string, unknown>
				}) {
					captures.push(msg)
				}
				async flush() {}
			},
			__captures: captures,
		}
	})

	const mod = await import('./index.js')
	const posthogMock = await import('posthog-node')
	return {
		...mod,
		captures: (
			posthogMock as unknown as {
				__captures: Array<{
					distinctId: string
					event: string
					properties: Record<string, unknown>
				}>
			}
		).__captures,
	}
}

describe('telemetry', () => {
	describe('showNoticeIfNeeded', () => {
		it('prints notice on first run', async () => {
			const stderrWrite = vi
				.spyOn(process.stderr, 'write')
				.mockReturnValue(true)
			const { showNoticeIfNeeded } = await loadModule({
				RESUMX_TELEMETRY: undefined,
				DO_NOT_TRACK: undefined,
			})

			showNoticeIfNeeded()

			expect(stderrWrite).toHaveBeenCalledOnce()
			const output = stderrWrite.mock.calls[0]![0] as string
			expect(output).toContain('anonymous usage data')
			expect(output).toContain('RESUMX_TELEMETRY=0')
		})

		it('does not print notice on second run', async () => {
			const stderrWrite = vi
				.spyOn(process.stderr, 'write')
				.mockReturnValue(true)
			const { showNoticeIfNeeded } = await loadModule({
				RESUMX_TELEMETRY: undefined,
				DO_NOT_TRACK: undefined,
			})

			showNoticeIfNeeded()
			stderrWrite.mockClear()
			vi.resetModules()

			vi.doMock('node:os', async () => {
				const actual =
					await vi.importActual<typeof import('node:os')>('node:os')
				return { ...actual, homedir: () => tempDir }
			})

			const mod2 = await import('./index.js')
			mod2.showNoticeIfNeeded()

			expect(stderrWrite).not.toHaveBeenCalled()
		})

		it('does not print notice when RESUMX_TELEMETRY=0', async () => {
			const stderrWrite = vi
				.spyOn(process.stderr, 'write')
				.mockReturnValue(true)
			const { showNoticeIfNeeded } = await loadModule({ RESUMX_TELEMETRY: '0' })

			showNoticeIfNeeded()

			expect(stderrWrite).not.toHaveBeenCalled()
		})

		it('does not print notice when DO_NOT_TRACK=1', async () => {
			const stderrWrite = vi
				.spyOn(process.stderr, 'write')
				.mockReturnValue(true)
			const { showNoticeIfNeeded } = await loadModule({
				DO_NOT_TRACK: '1',
				RESUMX_TELEMETRY: undefined,
			})

			showNoticeIfNeeded()

			expect(stderrWrite).not.toHaveBeenCalled()
		})
	})

	describe('capture', () => {
		it('sends event when telemetry is enabled', async () => {
			const { capture, captures } = await loadModule({
				RESUMX_TELEMETRY: undefined,
				DO_NOT_TRACK: undefined,
			})

			await capture({
				event: 'cli_render_success',
				properties: {
					formats: ['pdf'],
					duration_ms: 1234,
					view_count: 1,
					version: '0.1.0',
					os: 'darwin',
					node_version: 'v20.0.0',
				},
			})

			expect(captures).toHaveLength(1)
			expect(captures[0]!.event).toBe('cli_render_success')
			expect(captures[0]!.distinctId).toBeTruthy()
		})

		it('does not send event when RESUMX_TELEMETRY=0', async () => {
			const { capture, captures } = await loadModule({ RESUMX_TELEMETRY: '0' })

			await capture({
				event: 'cli_render_success',
				properties: {
					formats: ['pdf'],
					duration_ms: 1234,
					view_count: 1,
					version: '0.1.0',
					os: 'darwin',
					node_version: 'v20.0.0',
				},
			})

			expect(captures).toHaveLength(0)
		})

		it('does not send event when DO_NOT_TRACK=1', async () => {
			const { capture, captures } = await loadModule({
				DO_NOT_TRACK: '1',
				RESUMX_TELEMETRY: undefined,
			})

			await capture({
				event: 'cli_render_failure',
				properties: {
					error_class: 'unknown',
					version: '0.1.0',
					os: 'darwin',
					node_version: 'v20.0.0',
				},
			})

			expect(captures).toHaveLength(0)
		})

		it('uses stable anonymous id across captures', async () => {
			const { capture, captures } = await loadModule({
				RESUMX_TELEMETRY: undefined,
				DO_NOT_TRACK: undefined,
			})

			await capture({
				event: 'cli_render_success',
				properties: {
					formats: ['pdf'],
					duration_ms: 100,
					view_count: 1,
					version: '0.1.0',
					os: 'darwin',
					node_version: 'v20.0.0',
				},
			})

			await capture({
				event: 'cli_render_success',
				properties: {
					formats: ['html'],
					duration_ms: 200,
					view_count: 2,
					version: '0.1.0',
					os: 'darwin',
					node_version: 'v20.0.0',
				},
			})

			expect(captures).toHaveLength(2)
			expect(captures[0]!.distinctId).toBe(captures[1]!.distinctId)
		})
	})
})

describe('classifyError', () => {
	it.each([
		[new Error("Invalid --style format: 'bad'"), 'cli_argument'],
		[new Error("'--pages' must be a positive integer"), 'cli_argument'],
		[new Error('--check cannot be used with --watch'), 'cli_argument'],
		[new Error('Invalid YAML in frontmatter'), 'frontmatter_parse'],
		[new Error('Validation failed'), 'validation'],
		[new Error('Tag composition conflict'), 'tag_composition'],
		[new Error('Unknown template variable'), 'template_variable'],
		[new Error('Failed to launch chromium browser'), 'browser_launch'],
		[new Error('pdf rendering failed'), 'pdf_render'],
		[new Error('pdf2docx failed: conversion error'), 'docx_convert'],
		[new Error('ENOENT: no such file'), 'file_io'],
		[new Error('Dependency not installed'), 'dependency_missing'],
		[new Error('Something completely unexpected'), 'unknown'],
	])('classifies "%s" as %s', (error, expected) => {
		expect(classifyError(error)).toBe(expected)
	})

	it('handles non-Error values', () => {
		expect(classifyError('some string error')).toBe('unknown')
		expect(classifyError(42)).toBe('unknown')
	})
})
