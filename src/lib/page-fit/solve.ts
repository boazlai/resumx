/**
 * Generic proportional solver.
 *
 * Think of t as a single "shrink knob" from 0 to 1:
 *   t = 0  →  everything at full size (no shrinking)
 *   t = 1  →  everything at its smallest allowed size
 *
 * All variables shrink together in lockstep. The solver binary-searches
 * for the smallest turn of the knob where the content still fits.
 */

import type { VariableRange } from './types.js'

// ── Problem definition ─────────────────────────────────────────────────────

export interface FitProblem {
	/** Variables with their allowed ranges. */
	variables: VariableRange[]
	/** Returns true when the candidate values satisfy the constraint. */
	fits: (values: Record<string, number>) => boolean
}

export interface FitSolution {
	/** How far the knob was turned (0 = no shrinking, 1 = maximum shrinking). */
	t: number
	/** The resulting value for each variable at the optimal t. */
	values: Record<string, number>
}

// ── Solver ─────────────────────────────────────────────────────────────────

/** Number of binary search iterations (~6 decimal places of precision). */
const ITERATIONS = 20

/**
 * Find the least amount of shrinking needed to satisfy the constraint.
 *
 * Binary-searches t ∈ [0, 1] and returns the smallest t where `fits`
 * returns true. Every variable scales proportionally between its
 * original and minimum value at the same rate.
 */
export function solve(problem: FitProblem): FitSolution {
	const { variables, fits } = problem

	let lo = 0
	let hi = 1
	for (let i = 0; i < ITERATIONS; i++) {
		const mid = (lo + hi) / 2
		if (fits(interpolate(variables, mid))) hi = mid
		else lo = mid
	}

	return { t: hi, values: interpolate(variables, hi) }
}

/**
 * Compute each variable's value at a given knob position t.
 *
 * Linearly interpolates between original (t=0) and minimum (t=1):
 *   value = original − t × (original − minimum)
 */
export function interpolate(
	variables: VariableRange[],
	t: number,
): Record<string, number> {
	const result: Record<string, number> = {}
	for (const v of variables) {
		result[v.key] = v.original - t * (v.original - v.minimum)
	}
	return result
}
