/**
 * Page Fit Module
 *
 * Adjusts CSS variables to fit resume content into a target page count.
 *
 * Strategy:
 * 1. Measure: page count (1 PDF render) + DOM layout snapshot (no render).
 * 2. Solve: declare variable ranges + constraint, find the smallest
 *    proportional reduction where predicted height fits.
 * 3. Verify: apply adjustments and confirm with 1 PDF render.
 * 4. Fill: if content is short for a single page, expand gaps.
 */

import type { Page } from 'playwright'
import type { FitResult, VariableRange, CSSVariableValues } from './types.js'
import { MINIMUMS, A4_WIDTH_PX } from './types.js'
import { browserPool } from '../browser-pool.js'
import { solve } from './solve.js'
import { predictTotalHeight, pageCapacity } from './predict.js'
import { measurePage } from './measure.js'
import { fillSinglePage } from './fill.js'
import {
	getPdfPageCount,
	applyVariables,
	injectVariableOverrides,
	formatVar,
	buildAdjustments,
} from './pdf.js'

// ── Public API ─────────────────────────────────────────────────────────────

export type { FitResult }
export { injectVariableOverrides, predictTotalHeight }
export { predictHeight } from './predict.js'
export { solve, interpolate } from './solve.js'
export type {
	TextMetricsSnapshot,
	TextBlockMetric,
	ElementCounts,
} from './types.js'
export { MINIMUMS } from './types.js'

export async function fitToPages(
	html: string,
	targetPages: number,
): Promise<FitResult> {
	const browser = await browserPool.acquire()
	try {
		const page = await browser.newPage()
		try {
			await page.setViewportSize({ width: A4_WIDTH_PX, height: 1123 })
			await page.setContent(html, { waitUntil: 'networkidle' })

			// ── 1. Measure ──
			const originalPages = await getPdfPageCount(page)

			if (originalPages <= targetPages) {
				return await handleFit(page, html, originalPages, targetPages)
			}

			// ── 2. Solve ──
			const snapshot = await measurePage(page)

			const variables: VariableRange[] = [
				{
					key: 'font-size',
					original: snapshot.current['font-size'],
					minimum: MINIMUMS['font-size'],
				},
				{
					key: 'line-height',
					original: snapshot.current['line-height'],
					minimum: MINIMUMS['line-height'],
				},
				{
					key: 'page-margin-x',
					original: snapshot.current['page-margin-x'],
					minimum: MINIMUMS['page-margin-x'],
				},
				{
					key: 'page-margin-y',
					original: snapshot.current['page-margin-y'],
					minimum: MINIMUMS['page-margin-y'],
				},
				{
					key: 'section-gap',
					original: snapshot.current['section-gap'],
					minimum: MINIMUMS['section-gap'],
				},
				{
					key: 'entry-gap',
					original: snapshot.current['entry-gap'],
					minimum: MINIMUMS['entry-gap'],
				},
				{
					key: 'bullet-gap',
					original: snapshot.current['bullet-gap'],
					minimum: MINIMUMS['bullet-gap'],
				},
				{
					key: 'data-row-gap',
					original: snapshot.current['data-row-gap'],
					minimum: MINIMUMS['data-row-gap'],
				},
			]

			const { t, values } = solve({
				variables,
				fits: v => {
					const cv = v as CSSVariableValues
					return (
						predictTotalHeight(snapshot, cv)
						<= pageCapacity(cv['page-margin-y'], targetPages)
					)
				},
			})

			// ── 3. Verify ──
			let currentPages = originalPages
			const allAdjustments =
				t > 0 ? buildAdjustments(values, snapshot.current) : {}

			if (t > 0) {
				await applyVariables(page, allAdjustments)
				currentPages = await getPdfPageCount(page)
			}

			// Fallback: if prediction was off, push everything to minimums
			if (currentPages > targetPages) {
				for (const v of variables) {
					allAdjustments[v.key] = formatVar(v.key, v.minimum)
				}
				await applyVariables(page, allAdjustments)
				currentPages = await getPdfPageCount(page)
			}

			// ── 4. Fill ──
			if (targetPages === 1 && currentPages === 1) {
				const adjustedHtml = injectVariableOverrides(html, allAdjustments)
				await page.setContent(adjustedHtml, { waitUntil: 'networkidle' })
				const fillResult = await fillSinglePage(
					page,
					adjustedHtml,
					snapshot.current,
				)
				if (fillResult) {
					return { ...fillResult, originalPages }
				}
			}

			// ── Done ──
			return {
				html: injectVariableOverrides(html, allAdjustments),
				adjustments: allAdjustments,
				originalPages,
				finalPages: currentPages,
			}
		} finally {
			await page.close()
		}
	} finally {
		browserPool.release(browser)
	}
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function handleFit(
	page: Page,
	html: string,
	originalPages: number,
	targetPages: number,
): Promise<FitResult> {
	if (targetPages === 1 && originalPages === 1) {
		const fillResult = await fillSinglePage(page, html)
		if (fillResult) return fillResult
	}
	return {
		html,
		adjustments: {},
		originalPages,
		finalPages: originalPages,
	}
}
