import { describe, it, expect } from 'vitest'
import { predictHeight } from './predict.js'
import type { TextMetricsSnapshot, TextBlockMetric } from './types.js'

function makeMetrics(
	overrides?: Partial<TextMetricsSnapshot>,
): TextMetricsSnapshot {
	return {
		blocks: [],
		fixedHeight: 0,
		baseFontSizePx: 14.67, // 11pt * 96/72
		baseLineHeight: 1.35,
		baseMarginXIn: 0.5,
		pageWidthPx: 794,
		...overrides,
	}
}

function makeBlock(overrides?: Partial<TextBlockMetric>): TextBlockMetric {
	return {
		textWidth: 600,
		containerWidth: 700,
		lines: 1,
		heightPerLine: 20,
		fontScale: 1,
		...overrides,
	}
}

describe('predictHeight', () => {
	it('returns fixed height when there are no text blocks', () => {
		const metrics = makeMetrics({ fixedHeight: 42 })
		expect(predictHeight(metrics, 14.67, 1.35)).toBe(42)
	})

	it('returns correct height for a single unwrapped line', () => {
		const block = makeBlock({ textWidth: 400, containerWidth: 700 })
		const metrics = makeMetrics({ blocks: [block] })
		expect(predictHeight(metrics, 14.67, 1.35)).toBeCloseTo(20, 1)
	})

	it('predicts line wrapping when font-size increases', () => {
		const block = makeBlock({
			textWidth: 600,
			containerWidth: 700,
			heightPerLine: 20,
		})
		const metrics = makeMetrics({ blocks: [block] })

		const fontRatio = 22 / 14.67
		expect(predictHeight(metrics, 22, 1.35)).toBeCloseTo(
			Math.ceil((600 * fontRatio) / 700) * (20 * fontRatio),
			0,
		)
	})

	it('predicts fewer lines when font-size decreases', () => {
		const block = makeBlock({
			textWidth: 700,
			containerWidth: 400,
			lines: 2,
			heightPerLine: 20,
		})
		const metrics = makeMetrics({ blocks: [block] })

		const fontRatio = 7.33 / 14.67
		expect(predictHeight(metrics, 7.33, 1.35)).toBeCloseTo(
			Math.ceil((700 * fontRatio) / 400) * (20 * fontRatio),
			0,
		)
	})

	it('accounts for line-height changes', () => {
		const block = makeBlock({ textWidth: 300, containerWidth: 700 })
		const metrics = makeMetrics({ blocks: [block] })

		const normal = predictHeight(metrics, 14.67, 1.35)
		const doubled = predictHeight(metrics, 14.67, 2.7)
		expect(doubled).toBeCloseTo(normal * 2, 1)
	})

	it('accounts for margin-x changes widening containers', () => {
		const block = makeBlock({
			textWidth: 700,
			containerWidth: 400,
			lines: 2,
			heightPerLine: 20,
		})
		const metrics = makeMetrics({ blocks: [block], baseMarginXIn: 0.5 })

		expect(predictHeight(metrics, 14.67, 1.35, 0.3)).toBeLessThanOrEqual(
			predictHeight(metrics, 14.67, 1.35, 0.5),
		)
	})

	it('sums heights across multiple blocks', () => {
		const block1 = makeBlock({
			textWidth: 300,
			containerWidth: 700,
			heightPerLine: 20,
		})
		const block2 = makeBlock({
			textWidth: 500,
			containerWidth: 700,
			heightPerLine: 15,
		})
		const metrics = makeMetrics({
			blocks: [block1, block2],
			fixedHeight: 10,
		})
		expect(predictHeight(metrics, 14.67, 1.35)).toBeCloseTo(45, 1)
	})
})
