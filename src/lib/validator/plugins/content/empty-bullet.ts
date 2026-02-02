/**
 * Empty Bullet Plugin
 *
 * Validates that list items have meaningful content.
 * Catches common authoring mistakes like empty or incomplete bullet points
 * that would render poorly or indicate unfinished work.
 *
 * ## Checks
 *
 * | Code         | Severity | Description                   |
 * |--------------|----------|-------------------------------|
 * | empty-bullet | critical | List item has no text content |
 *
 * ## Examples
 *
 * ```markdown
 * ## Experience
 * -                          <- empty-bullet (critical)
 * - Built scalable systems   <- OK
 * -                          <- empty-bullet (critical)
 * ```
 *
 * @module validator/plugins/content/empty-bullet
 */

import type Token from 'markdown-it/lib/token.mjs'
import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../../types.js'
import { rangeFromToken } from '../../utils.js'

/**
 * Extract text content from an inline token's children
 */
function extractTextFromInline(token: Token): string {
	if (!token.children) return token.content || ''
	return token.children
		.filter(t => t.type === 'text' || t.type === 'code_inline')
		.map(t => t.content)
		.join('')
		.trim()
}

/**
 * Empty Bullet plugin - validates content quality
 *
 * Checks:
 * - empty-bullet (critical): List item with no text content
 */
export const emptyBulletPlugin: ValidatorPlugin = {
	name: 'empty-bullet',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { tokens, lines } = ctx
		const issues: ValidationIssue[] = []

		// Scan for list items
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]
			if (!token) continue

			if (token.type === 'list_item_open') {
				// Collect all text content within this list item
				let content = ''
				let j = i + 1
				let depth = 1

				while (j < tokens.length && depth > 0) {
					const innerToken = tokens[j]
					if (!innerToken) break

					if (innerToken.type === 'list_item_open') {
						depth++
					} else if (innerToken.type === 'list_item_close') {
						depth--
					} else if (innerToken.type === 'inline' && depth === 1) {
						// Only count content at the immediate level
						content += extractTextFromInline(innerToken)
					}

					j++
				}

				// Check if the list item has no meaningful content
				if (content.trim() === '') {
					issues.push({
						severity: 'critical',
						code: 'empty-bullet',
						message: 'List item has no text content',
						range: rangeFromToken(token, lines),
					})
				}
			}
		}

		return issues
	},
}
