/**
 * CSS Variable Utilities
 *
 * Generic functions for generating and parsing CSS custom properties.
 */

export type ThemeVariables = Record<string, string>

export interface CssVariable {
	name: string
	value: string
}

/**
 * Merge variable objects (later wins)
 */
export function mergeVariables(
	...sources: (ThemeVariables | undefined)[]
): ThemeVariables {
	return Object.assign({}, ...sources.filter(Boolean))
}

/**
 * Generate CSS :root block from variables
 */
export function generateVariablesCSS(variables: ThemeVariables): string {
	const entries = Object.entries(variables)
	if (entries.length === 0) return ''

	const declarations = entries
		.map(([key, value]) => `  --${key}: ${value};`)
		.join('\n')

	return `:root {\n${declarations}\n}\n`
}

/**
 * Parse CSS custom properties (variables) from a CSS string
 *
 * Extracts variables defined in :root { ... } blocks
 */
export function parseCssVariables(css: string): CssVariable[] {
	// Match :root { ... } block
	const rootMatch = css.match(/:root\s*\{([^}]+)\}/)
	if (!rootMatch) {
		return []
	}

	const rootContent = rootMatch[1]
	if (!rootContent) {
		return []
	}

	const variables: CssVariable[] = []

	// Match CSS custom properties: --name: value;
	// Handle multiline values by matching until the next semicolon
	const varRegex = /(--[\w-]+)\s*:\s*([^;]+);/g
	let match: RegExpExecArray | null

	while ((match = varRegex.exec(rootContent)) !== null) {
		const name = match[1]
		const rawValue = match[2]
		if (!name || !rawValue) {
			continue
		}
		// Normalize whitespace in value (collapse newlines and multiple spaces)
		const value = rawValue.replace(/\s+/g, ' ').trim()
		variables.push({ name, value })
	}

	return variables
}
