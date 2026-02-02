/**
 * No Entries Plugin
 *
 * Validates that the resume has H3 headings representing entries (jobs, education, etc.).
 *
 * ## Checks
 *
 * | Code       | Severity | Description                                     |
 * |------------|----------|-------------------------------------------------|
 * | no-entries | warning  | No H3 headings found (no job/education entries) |
 *
 * ## Expected Structure
 *
 * ```markdown
 * # John Doe
 * > email@example.com
 *
 * ## Experience
 * ### Company Name             <- H3 (recommended)
 * - Built things
 * ```
 *
 * @module validator/plugins/structure/no-entries
 */

import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../../types.js'
import { rangeAtStart } from '../../utils.js'

/**
 * No Entries plugin - validates that resume has H3 entries
 *
 * Checks:
 * - no-entries (warning): No H3 headings found
 */
export const noEntriesPlugin: ValidatorPlugin = {
	name: 'no-entries',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { tokens } = ctx
		const issues: ValidationIssue[] = []

		let hasH3 = false

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]
			if (!token) continue

			if (token.type === 'heading_open' && token.tag === 'h3') {
				hasH3 = true
				break
			}
		}

		if (!hasH3) {
			issues.push({
				severity: 'warning',
				code: 'no-entries',
				message: 'Resume has no entries (H3 headings)',
				range: rangeAtStart(),
			})
		}

		return issues
	},
}
