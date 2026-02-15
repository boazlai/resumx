import type Token from 'markdown-it/lib/token.mjs'

/** Position in the document (0-based, LSP-compatible) */
export interface Position {
	line: number // 0-based line number
	column: number // 0-based column (character offset)
}

/** Range in the document */
export interface Range {
	start: Position
	end: Position
}

/** Severity levels for resume validation */
export type Severity = 'critical' | 'warning' | 'note' | 'bonus'

/** Single validation issue (LSP-compatible) */
export interface ValidationIssue {
	severity: Severity
	code: string // e.g., 'missing-name', 'empty-bullet'
	message: string
	range: Range // Full range for LSP compatibility
}

/** Context passed to each plugin */
export interface ValidationContext {
	content: string // Raw markdown content
	tokens: Token[] // Parsed markdown-it tokens
	lines: string[] // Content split by line (for line-level checks)
}

/** Plugin interface - each plugin implements this */
export interface ValidatorPlugin {
	name: string
	validate(
		ctx: ValidationContext,
	): ValidationIssue[] | Promise<ValidationIssue[]>
}

/** Final validation result */
export interface ValidationResult {
	valid: boolean // true if no critical issues
	issues: ValidationIssue[] // All issues, sorted by severity then line
	counts: {
		critical: number
		warning: number
		note: number
		bonus: number
	}
}

/** Rule configuration: severity or 'off' to disable */
export type RuleConfig = Severity | 'off'

/** Per-rule overrides from frontmatter */
export type RuleOverrides = Record<string, RuleConfig>

/** Available preset names */
export type PresetName = 'recommended' | 'minimal' | 'strict' | 'none'

/** Options for the validator */
export interface ValidatorOptions {
	extends?: PresetName // Base preset (default: 'recommended', use 'none' for no base)
	plugins?: ValidatorPlugin[] // Additional plugins (always added to base)
	rules?: RuleOverrides // Per-rule severity overrides
}
