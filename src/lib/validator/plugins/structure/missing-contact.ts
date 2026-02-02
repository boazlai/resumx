/**
 * Missing Contact Plugin
 *
 * Validates that the resume has contact information (email or phone) after the H1 heading.
 *
 * ## Checks
 *
 * | Code            | Severity | Description                                   |
 * |-----------------|----------|-----------------------------------------------|
 * | missing-contact | critical | No email or phone number after the H1 heading |
 *
 * ## Expected Structure
 *
 * ```markdown
 * # John Doe
 * > email@example.com       <- Contact info (required)
 * ```
 *
 * @module validator/plugins/structure/missing-contact
 */

import type Token from 'markdown-it/lib/token.mjs'
import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../../types.js'
import { rangeFromToken, rangeAtStart } from '../../utils.js'

/** Email regex pattern */
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/

/** Phone regex pattern - matches various formats with at least 7 digits */
const PHONE_PATTERN = /[\d\s\-().+]{7,}/

/**
 * Extract text content from an inline token's children
 */
function extractTextFromInline(token: Token): string {
	if (!token.children) return token.content || ''
	return token.children
		.filter(t => t.type === 'text' || t.type === 'code_inline')
		.map(t => t.content)
		.join('')
}

/**
 * Check if content contains contact info (email or phone)
 */
function hasContactInfo(content: string): boolean {
	return EMAIL_PATTERN.test(content) || PHONE_PATTERN.test(content)
}

/**
 * Get content from blockquote or paragraph after H1
 */
function getContentAfterH1(
	tokens: Token[],
	h1Index: number,
): { content: string; token: Token } | null {
	// Skip heading_close
	let i = h1Index + 1
	while (i < tokens.length) {
		const currentToken = tokens[i]
		if (currentToken?.type === 'heading_close') break
		i++
	}
	i++ // Move past heading_close

	// Look for blockquote or paragraph
	while (i < tokens.length) {
		const token = tokens[i]
		if (!token) break

		if (token.type === 'blockquote_open') {
			// Collect all content in blockquote
			let content = ''
			i++
			while (i < tokens.length) {
				const innerToken = tokens[i]
				if (!innerToken || innerToken.type === 'blockquote_close') break
				if (innerToken.type === 'inline') {
					content += extractTextFromInline(innerToken) + ' '
				}
				i++
			}
			return { content: content.trim(), token }
		}

		if (token.type === 'paragraph_open') {
			const inlineToken = tokens[i + 1]
			if (inlineToken?.type === 'inline') {
				return { content: extractTextFromInline(inlineToken), token }
			}
		}

		// Stop if we hit another heading
		if (token.type === 'heading_open') {
			break
		}

		i++
	}

	return null
}

/**
 * Missing Contact plugin - validates that resume has contact info after H1
 *
 * Checks:
 * - missing-contact (critical): No email or phone after H1
 */
export const missingContactPlugin: ValidatorPlugin = {
	name: 'missing-contact',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { tokens, lines } = ctx
		const issues: ValidationIssue[] = []

		let h1Index = -1
		let h1Token: Token | null = null

		// Find H1
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]
			if (!token) continue

			if (token.type === 'heading_open' && token.tag === 'h1') {
				h1Index = i
				h1Token = token
				break
			}
		}

		// Only check contact if H1 exists
		if (h1Index >= 0) {
			const contentAfterH1 = getContentAfterH1(tokens, h1Index)
			if (!contentAfterH1 || !hasContactInfo(contentAfterH1.content)) {
				issues.push({
					severity: 'critical',
					code: 'missing-contact',
					message: 'Resume must have contact info (email or phone) after name',
					range: h1Token ? rangeFromToken(h1Token, lines) : rangeAtStart(),
				})
			}
		}

		return issues
	},
}
