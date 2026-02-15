import { describe, it, expect } from 'vitest'
import { solve, interpolate } from './solve.js'

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Analytical t for a single variable with threshold constraint.
 * value(t) = original − t × (original − minimum) ≤ threshold
 * ⇒ t ≥ (original − threshold) / (original − minimum)
 */
function exactT(original: number, minimum: number, threshold: number): number {
	return (original - threshold) / (original - minimum)
}

// 20 binary search iterations → precision ≈ 2^−20 ≈ 9.5×10^−7
// toBeCloseTo(x, 5) checks |diff| < 5×10^−6, comfortably within range
const SOLVER_PRECISION = 5

// ── solve ──────────────────────────────────────────────────────────────────

describe('solve', () => {
	it('returns t≈0 when original values already fit', () => {
		const result = solve({
			variables: [
				{ key: 'a', original: 10, minimum: 0 },
				{ key: 'b', original: 20, minimum: 5 },
			],
			fits: () => true,
		})
		expect(result.t).toBeCloseTo(0, SOLVER_PRECISION)
	})

	it('returns t≈1 when only minimums fit', () => {
		const result = solve({
			variables: [{ key: 'a', original: 10, minimum: 2 }],
			fits: v => (v['a'] ?? 0) <= 2,
		})
		expect(result.t).toBeCloseTo(1, SOLVER_PRECISION)
	})

	it('converges to the analytical t for a single-variable threshold', () => {
		// a: 100 → 0, fits when a ≤ 37  ⇒  t = (100−37)/100 = 0.63
		const expected = exactT(100, 0, 37)
		const result = solve({
			variables: [{ key: 'a', original: 100, minimum: 0 }],
			fits: v => (v['a'] ?? 0) <= 37,
		})
		expect(result.t).toBeCloseTo(expected, SOLVER_PRECISION)
		expect(result.values['a']).toBeCloseTo(37, 4)
	})

	it('converges to the analytical t for a sum constraint on two variables', () => {
		// a: 10→0, b: 10→0, fits when a+b ≤ 15
		// value(t) = 10(1−t), sum = 20(1−t) ≤ 15  ⇒  t = 0.25
		const result = solve({
			variables: [
				{ key: 'a', original: 10, minimum: 0 },
				{ key: 'b', original: 10, minimum: 0 },
			],
			fits: v => (v['a'] ?? 0) + (v['b'] ?? 0) <= 15,
		})
		expect(result.t).toBeCloseTo(0.25, SOLVER_PRECISION)
		expect(result.values['a']).toBeCloseTo(7.5, 4)
		expect(result.values['b']).toBeCloseTo(7.5, 4)
	})

	it('converges with asymmetric ranges', () => {
		// a: 100→20, b: 50→10
		// a(t) = 100−80t, b(t) = 50−40t
		// fits when a+b ≤ 90  ⇒  150−120t ≤ 90  ⇒  t = 0.5
		const result = solve({
			variables: [
				{ key: 'a', original: 100, minimum: 20 },
				{ key: 'b', original: 50, minimum: 10 },
			],
			fits: v => (v['a'] ?? 0) + (v['b'] ?? 0) <= 90,
		})
		expect(result.t).toBeCloseTo(0.5, SOLVER_PRECISION)
		expect(result.values['a']).toBeCloseTo(60, 4)
		expect(result.values['b']).toBeCloseTo(30, 4)
	})

	it('converges for a non-trivial fractional t', () => {
		// a: 1000→0, fits when a ≤ 1  ⇒  t = 999/1000 = 0.999
		// Value precision = range × t_precision: 1000 × ~1e−6 ≈ 1e−3
		const expected = exactT(1000, 0, 1)
		const result = solve({
			variables: [{ key: 'a', original: 1000, minimum: 0 }],
			fits: v => (v['a'] ?? 0) <= 1,
		})
		expect(result.t).toBeCloseTo(expected, SOLVER_PRECISION)
		expect(result.values['a']).toBeCloseTo(1, 2)
	})

	it('converges for a tiny reduction', () => {
		// a: 100→0, fits when a ≤ 99.5  ⇒  t = 0.005
		const expected = exactT(100, 0, 99.5)
		const result = solve({
			variables: [{ key: 'a', original: 100, minimum: 0 }],
			fits: v => (v['a'] ?? 0) <= 99.5,
		})
		expect(result.t).toBeCloseTo(expected, SOLVER_PRECISION)
	})

	it('handles many variables scaling together', () => {
		// 8 vars each 10→0, fits when sum ≤ 40  ⇒  80(1−t) ≤ 40  ⇒  t = 0.5
		const variables = Array.from({ length: 8 }, (_, i) => ({
			key: `v${i}`,
			original: 10,
			minimum: 0,
		}))
		const result = solve({
			variables,
			fits: v => Object.values(v).reduce((s, x) => s + x, 0) <= 40,
		})
		expect(result.t).toBeCloseTo(0.5, SOLVER_PRECISION)
		for (const key of variables.map(v => v.key)) {
			expect(result.values[key]).toBeCloseTo(5, 4)
		}
	})

	it('solved values always satisfy the constraint', () => {
		const result = solve({
			variables: [
				{ key: 'a', original: 50, minimum: 5 },
				{ key: 'b', original: 30, minimum: 3 },
			],
			fits: v => (v['a'] ?? 0) * (v['b'] ?? 0) <= 200,
		})
		expect(
			(result.values['a'] ?? 0) * (result.values['b'] ?? 0),
		).toBeLessThanOrEqual(200 + 1e-4)
	})
})

// ── interpolate ────────────────────────────────────────────────────────────

describe('interpolate', () => {
	it('returns original values at t=0', () => {
		const result = interpolate(
			[
				{ key: 'x', original: 10, minimum: 2 },
				{ key: 'y', original: 5, minimum: 1 },
			],
			0,
		)
		expect(result['x']).toBe(10)
		expect(result['y']).toBe(5)
	})

	it('returns minimum values at t=1', () => {
		const result = interpolate(
			[
				{ key: 'x', original: 10, minimum: 2 },
				{ key: 'y', original: 5, minimum: 1 },
			],
			1,
		)
		expect(result['x']).toBe(2)
		expect(result['y']).toBe(1)
	})

	it('interpolates linearly at t=0.5', () => {
		const result = interpolate([{ key: 'x', original: 10, minimum: 0 }], 0.5)
		expect(result['x']).toBe(5)
	})

	it('returns empty record for empty variables', () => {
		expect(interpolate([], 0.5)).toEqual({})
	})

	it('handles original equal to minimum (zero range)', () => {
		const result = interpolate([{ key: 'x', original: 7, minimum: 7 }], 0.5)
		expect(result['x']).toBe(7)
	})
})
