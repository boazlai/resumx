/**
 * PDF rendering and CSS variable helpers.
 *
 * Thin wrappers around Playwright for page measurement and
 * CSS variable manipulation.
 */

import type { Page } from 'playwright'
import { countPdfPages } from '../../lib/pdf-kit/index.js'

// ── PDF page counting ──────────────────────────────────────────────────────

/** Render to PDF and count pages. */
export async function getPdfPageCount(page: Page): Promise<number> {
	const buffer = await page.pdf({
		preferCSSPageSize: true,
		printBackground: true,
	})
	return countPdfPages(buffer)
}

// ── CSS variable manipulation ──────────────────────────────────────────────

/** Apply CSS variable overrides on a live page (for measurement). */
export async function applyVariables(
	page: Page,
	vars: Record<string, string>,
): Promise<void> {
	await page.evaluate(v => {
		const root = document.documentElement
		for (const [key, value] of Object.entries(v)) {
			root.style.setProperty(`--${key}`, value)
		}
	}, vars)
}

export { injectVariableOverrides } from '../../lib/dom-kit/inject-style.js'

// ── Format helpers ─────────────────────────────────────────────────────────

/** Format a numeric value with the correct CSS unit for its variable key. */
export function formatVar(key: string, value: number): string {
	const rounded = Math.round(value * 100) / 100
	if (key === 'line-height') return String(rounded)
	if (key === 'font-size') return `${rounded}pt`
	if (key.startsWith('page-margin')) return `${rounded}in`
	return `${rounded}px`
}

/**
 * Build a CSS adjustment record from solver output.
 * Only includes variables that actually changed from their original values.
 */
export function buildAdjustments(
	values: Record<string, number>,
	original: Record<string, number>,
): Record<string, string> {
	const adjustments: Record<string, string> = {}
	for (const [key, value] of Object.entries(values)) {
		if (value < (original[key] ?? Infinity)) {
			adjustments[key] = formatVar(key, value)
		}
	}
	return adjustments
}
