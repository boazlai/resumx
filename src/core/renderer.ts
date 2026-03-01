import { execFileSync } from 'node:child_process'
import {
	readFileSync,
	writeFileSync,
	unlinkSync,
	existsSync,
	mkdirSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { browserPool } from '../lib/browser-pool/index.js'

export type OutputFormat = 'pdf' | 'html' | 'docx' | 'png'

export interface RenderResult {
	success: boolean
	outputPath: string
	error?: string
}

function createTempFile(content: string, extension: string): string {
	const tempDir = tmpdir()
	const tempPath = join(tempDir, `resumx-${Date.now()}${extension}`)
	writeFileSync(tempPath, content)
	return tempPath
}

function cleanupTempFile(path: string): void {
	if (existsSync(path)) {
		try {
			unlinkSync(path)
		} catch {
			// Ignore cleanup errors
		}
	}
}

async function renderPdf(html: string, outputPath: string): Promise<void> {
	const browser = await browserPool.acquire()
	try {
		const page = await browser.newPage()
		try {
			await page.setContent(html, { waitUntil: 'domcontentloaded' })
			await page.pdf({
				path: outputPath,
				printBackground: true,
				preferCSSPageSize: true,
			})
		} finally {
			await page.close()
		}
	} finally {
		browserPool.release(browser)
	}
}

async function renderPng(html: string, outputPath: string): Promise<void> {
	const browser = await browserPool.acquire()
	try {
		const context = await browser.newContext({
			viewport: { width: 794, height: 1123 },
			deviceScaleFactor: 2,
		})
		try {
			const page = await context.newPage()
			try {
				await page.setContent(html, { waitUntil: 'domcontentloaded' })
				await page.screenshot({ path: outputPath, fullPage: true })
			} finally {
				await page.close()
			}
		} finally {
			await context.close()
		}
	} finally {
		browserPool.release(browser)
	}
}

function renderDocxFromPdf(pdfPath: string, outputPath: string): void {
	try {
		execFileSync('pdf2docx', ['convert', pdfPath, outputPath], {
			stdio: ['pipe', 'pipe', 'pipe'],
			encoding: 'utf-8',
		})
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown error during conversion'
		throw new Error(`pdf2docx failed: ${message}`)
	}
}

/**
 * Write rendered HTML to disk in the specified format.
 * Pure output concern: takes final HTML and produces a file.
 */
export async function writeOutput(
	html: string,
	format: OutputFormat,
	outputPath: string,
): Promise<RenderResult> {
	try {
		const outputDir = dirname(outputPath)
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true })
		}

		switch (format) {
			case 'html':
				writeFileSync(outputPath, html)
				break
			case 'pdf':
				await renderPdf(html, outputPath)
				break
			case 'png':
				await renderPng(html, outputPath)
				break
			case 'docx': {
				const tempPdfPath = createTempFile('', '.pdf')
				try {
					await renderPdf(html, tempPdfPath)
					renderDocxFromPdf(tempPdfPath, outputPath)
				} finally {
					cleanupTempFile(tempPdfPath)
				}
				break
			}
		}

		return { success: true, outputPath }
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown error during render'
		return { success: false, outputPath, error: message }
	}
}

// ── Path utilities ──────────────────────────────────────────────────────────

const DOC_EXTENSIONS = ['.pdf', '.html', '.htm', '.docx', '.doc', '.png']

export function stripDocExtension(name: string): string {
	for (const ext of DOC_EXTENSIONS) {
		if (name.endsWith(ext)) return name.slice(0, -ext.length)
	}
	return name
}

export function cleanupPath(path: string): string {
	return path
		.split('/')
		.map(s =>
			s
				.replace(/-{2,}/g, '-')
				.replace(/_{2,}/g, '_')
				.replace(/^[-_]+|[-_]+$/g, ''),
		)
		.filter(Boolean)
		.join('/')
}

export function extractNameFromContent(content: string): string | undefined {
	const match = content.match(/^#\s+(.+)$/m)
	if (!match?.[1]) return undefined
	return match[1].trim().split(/\s+/).join('_')
}

export function extractNameFromMarkdown(mdPath: string): string | undefined {
	try {
		const content = readFileSync(mdPath, 'utf-8')
		const match = content.match(/^#\s+(.+)$/m)
		if (!match?.[1]) return undefined
		return match[1]
			.trim()
			.split(/\s+/)
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join('')
	} catch {
		return undefined
	}
}

export function getOutputName(inputPath: string): string {
	return basename(inputPath, '.md')
}
