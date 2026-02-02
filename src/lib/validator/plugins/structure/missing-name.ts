/**
 * Missing Name Plugin
 *
 * Validates that the resume has an H1 heading which represents the applicant's name.
 *
 * ## Checks
 *
 * | Code         | Severity | Description                                   |
 * |--------------|----------|-----------------------------------------------|
 * | missing-name | critical | No H1 heading found (resume must have a name) |
 *
 * ## Expected Structure
 *
 * ```markdown
 * # John Doe                    <- H1 (required)
 * > email@example.com
 * ```
 *
 * @module validator/plugins/structure/missing-name
 */

import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../../types.js'
import { rangeAtStart } from '../../utils.js'

/**
 * Missing Name plugin - validates that resume has an H1 heading
 *
 * Checks:
 * - missing-name (critical): No H1 heading found
 */
export const missingNamePlugin: ValidatorPlugin = {
	name: 'missing-name',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { tokens } = ctx
		const issues: ValidationIssue[] = []

		let hasH1 = false

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]
			if (!token) continue

			if (token.type === 'heading_open' && token.tag === 'h1') {
				hasH1 = true
				break
			}
		}

		if (!hasH1) {
			issues.push({
				severity: 'critical',
				code: 'missing-name',
				message: 'Resume must have a name (H1 heading)',
				range: rangeAtStart(),
			})
		}

		return issues
	},
}
