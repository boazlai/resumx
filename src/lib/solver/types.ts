/**
 * Solver types
 */

/** A single adjustable variable with its allowed range. */
export interface VariableRange {
	key: string
	original: number
	minimum: number
	/**
	 * Shrink curve exponent. Controls how fast this variable responds to the knob.
	 *   power < 1 → shrinks early (spacing: 0.5)
	 *   power = 1 → linear (margins: 1.0)
	 *   power > 1 → resists change (typography: 2.0)
	 * Defaults to 1.0 if omitted.
	 */
	power?: number
	unit?: 'px' | 'pt' | 'in'
}
