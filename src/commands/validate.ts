import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import chalk from 'chalk'
import matter from 'gray-matter'
import { validate } from '../lib/validator/index.js'
import type {
	Severity,
	PresetName,
	RuleOverrides,
	ValidationIssue,
} from '../lib/validator/types.js'

export interface ValidateCommandOptions {
	strict?: boolean // Exit with error if any issues exist
	minSeverity?: Severity // Minimum severity to display (default: 'bonus')
}

/** Severity order for filtering */
const severityOrder: Record<Severity, number> = {
	critical: 0,
	warning: 1,
	note: 2,
	bonus: 3,
}

/** Colors for each severity level */
const severityColors: Record<Severity, (text: string) => string> = {
	critical: chalk.red,
	warning: chalk.yellow,
	note: chalk.blue,
	bonus: chalk.gray,
}

/**
 * Extract validation config from frontmatter
 */
interface ValidateConfig {
	extends?: PresetName
	rules?: RuleOverrides
}

function extractValidateConfig(content: string): ValidateConfig {
	try {
		const result = matter(content)
		const data = result.data as Record<string, unknown>

		const validateField = data['validate']
		if (!validateField || typeof validateField !== 'object') {
			return {}
		}

		const validateData = validateField as Record<string, unknown>
		const config: ValidateConfig = {}

		// Extract extends
		const extendsField = validateData['extends']
		if (
			extendsField
			&& typeof extendsField === 'string'
			&& ['recommended', 'minimal', 'strict', 'none'].includes(extendsField)
		) {
			config.extends = extendsField as PresetName
		}

		// Extract rules
		const rulesField = validateData['rules']
		if (rulesField && typeof rulesField === 'object') {
			const rules: RuleOverrides = {}
			for (const [key, value] of Object.entries(
				rulesField as Record<string, unknown>,
			)) {
				if (
					typeof value === 'string'
					&& ['critical', 'warning', 'note', 'bonus', 'off'].includes(value)
				) {
					rules[key] = value as Severity | 'off'
				}
			}
			if (Object.keys(rules).length > 0) {
				config.rules = rules
			}
		}

		return config
	} catch {
		return {}
	}
}

/**
 * Format an issue for display
 */
function formatIssue(issue: ValidationIssue, filename: string): string {
	const { line, column } = issue.range.start
	const location = `${line + 1}:${column}`.padEnd(6)
	const severity = issue.severity.padEnd(7)
	const code = issue.code.padEnd(24)
	const colorFn = severityColors[issue.severity]

	return `  ${chalk.dim(location)} ${colorFn(severity)} ${chalk.cyan(code)} ${issue.message}`
}

/**
 * Format the summary line
 */
function formatSummary(counts: Record<Severity, number>): string {
	const parts: string[] = []

	if (counts.critical > 0) {
		parts.push(chalk.red(`${counts.critical} critical`))
	}
	if (counts.warning > 0) {
		parts.push(
			chalk.yellow(`${counts.warning} warning${counts.warning > 1 ? 's' : ''}`),
		)
	}
	if (counts.note > 0) {
		parts.push(chalk.blue(`${counts.note} note${counts.note > 1 ? 's' : ''}`))
	}
	if (counts.bonus > 0) {
		parts.push(chalk.gray(`${counts.bonus} bonus`))
	}

	if (parts.length === 0) {
		return chalk.green('No issues found')
	}

	return parts.join(', ')
}

/**
 * Validate command - validates resume markdown files
 */
export async function validateCommand(
	file: string,
	options: ValidateCommandOptions,
): Promise<void> {
	const cwd = process.cwd()
	const inputPath = resolve(cwd, file)

	// Check if file exists
	if (!existsSync(inputPath)) {
		console.error(chalk.red(`Error: File not found: ${file}`))
		process.exit(1)
	}

	// Read file content
	let content: string
	try {
		content = readFileSync(inputPath, 'utf-8')
	} catch (error) {
		console.error(
			chalk.red(`Error: Could not read file: ${(error as Error).message}`),
		)
		process.exit(1)
	}

	// Extract validation config from frontmatter
	const validateConfig = extractValidateConfig(content)

	// Run validation
	const result = await validate(content, {
		extends: validateConfig.extends,
		rules: validateConfig.rules,
	})

	// Filter issues by minimum severity
	const minSeverity = options.minSeverity ?? 'bonus'
	const minSeverityLevel = severityOrder[minSeverity]
	const filteredIssues = result.issues.filter(
		issue => severityOrder[issue.severity] <= minSeverityLevel,
	)

	// Display results
	if (filteredIssues.length > 0) {
		console.log(chalk.underline(file))
		for (const issue of filteredIssues) {
			console.log(formatIssue(issue, file))
		}
		console.log()
	}

	// Display summary
	const displayedCounts = {
		critical: filteredIssues.filter(i => i.severity === 'critical').length,
		warning: filteredIssues.filter(i => i.severity === 'warning').length,
		note: filteredIssues.filter(i => i.severity === 'note').length,
		bonus: filteredIssues.filter(i => i.severity === 'bonus').length,
	}
	console.log(formatSummary(displayedCounts))

	// Determine exit code
	if (options.strict) {
		// In strict mode, exit with error if any issues exist
		if (filteredIssues.length > 0) {
			process.exit(1)
		}
	} else {
		// Normal mode: exit with error only if there are critical issues
		if (result.counts.critical > 0) {
			process.exit(1)
		}
	}
}
