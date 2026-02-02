/**
 * Single Bullet Section Plugin
 *
 * Detects H2 sections that contain only one bullet point, which may indicate
 * incomplete content or a section that could be merged with another.
 *
 * ## Checks
 *
 * | Code                  | Severity | Description                              |
 * |-----------------------|----------|------------------------------------------|
 * | single-bullet-section | bonus    | H2 section contains only one bullet      |
 *
 * ## Rationale
 *
 * A section with only one bullet might indicate incomplete content or could
 * be merged with another section. This is just a bonus tip—some sections (like
 * a brief Summary) are fine with one item.
 *
 * ## Examples
 *
 * ```markdown
 * ## Awards
 * ### Honor Society
 * - Member                     <- single-bullet-section (bonus)
 * ```
 *
 * @module validator/plugins/single-bullet-section
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
}

/**
 * Represents a section in the resume (H2 heading and its content)
 */
interface Section {
	name: string
	token: Token
	bulletCount: number
}

/**
 * Analyze the document structure to find sections and their bullet counts
 */
function analyzeSections(tokens: Token[]): Section[] {
	const sections: Section[] = []
	let currentSection: Section | null = null

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i]
		if (!token) continue

		if (token.type === 'heading_open' && token.tag === 'h2') {
			// Save previous section if exists
			if (currentSection) {
				sections.push(currentSection)
			}

			// Start new section
			const nameToken = tokens[i + 1]
			const name =
				nameToken?.type === 'inline' ?
					extractTextFromInline(nameToken)
				:	'Unknown'

			currentSection = {
				name,
				token,
				bulletCount: 0,
			}
		} else if (
			token.type === 'list_item_open'
			&& currentSection
			&& token.level !== undefined
		) {
			// Count only top-level bullets (not nested)
			// Check if this is a direct child of a bullet_list at h2 level
			// We'll count all list items for simplicity
			currentSection.bulletCount++
		}
	}

	// Add last section
	if (currentSection) {
		sections.push(currentSection)
	}

	return sections
}

/**
 * Single Bullet Section plugin - detects sections with only one bullet
 *
 * Checks:
 * - single-bullet-section (bonus): H2 section has only 1 bullet point
 */
export const singleBulletSectionPlugin: ValidatorPlugin = {
	name: 'single-bullet-section',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { tokens, lines } = ctx
		const issues: ValidationIssue[] = []

		const sections = analyzeSections(tokens)
		for (const section of sections) {
			if (section.bulletCount === 1) {
				issues.push({
					severity: 'bonus',
					code: 'single-bullet-section',
					message: `Section "${section.name}" has only 1 bullet`,
					range: rangeFromToken(section.token, lines),
				})
			}
		}

		return issues
	},
}
