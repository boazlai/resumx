import { existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve, isAbsolute, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Bundled themes directory (relative to compiled dist)
const BUNDLED_THEMES_DIR = resolve(__dirname, '../../themes')

// Default theme name (single source of truth)
export const DEFAULT_THEME = 'zurich'

// =============================================================================
// CSS Variable Utilities
// =============================================================================

export type ThemeVariables = Record<string, string>

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

// =============================================================================
// Theme Resolution
// =============================================================================
/**
 * Discover bundled theme names from top-level .css files in the themes directory
 */
function discoverBundledThemes(): string[] {
	if (!existsSync(BUNDLED_THEMES_DIR)) return []
	return readdirSync(BUNDLED_THEMES_DIR)
		.filter(f => f.endsWith('.css'))
		.map(f => basename(f, '.css'))
		.sort()
}

/** Lazily-cached list of bundled theme names */
let _bundledThemesCache: string[] | null = null

export function getBundledThemes(): string[] {
	if (!_bundledThemesCache) {
		_bundledThemesCache = discoverBundledThemes()
	}
	return _bundledThemesCache
}

export interface ThemeInfo {
	name: string
	path: string
}

export interface CssVariable {
	name: string
	value: string
}

/**
 * Get path to bundled themes directory
 */
export function getBundledThemesDir(): string {
	return BUNDLED_THEMES_DIR
}

/**
 * Get path to a bundled theme
 */
export function getBundledThemePath(name: string): string | undefined {
	const themePath = join(BUNDLED_THEMES_DIR, `${name}.css`)
	return existsSync(themePath) ? themePath : undefined
}

/**
 * List all available bundled themes
 */
export function listThemes(): ThemeInfo[] {
	return getBundledThemes().map(name => ({
		name,
		path: join(BUNDLED_THEMES_DIR, `${name}.css`),
	}))
}

/**
 * Resolve a theme name or path to an absolute CSS file path
 *
 * Resolution:
 * - Path-like input (contains / or \ or ends with .css): resolve as file path
 * - Name: resolve to bundled theme
 *
 * Callers are responsible for providing a theme name (handling defaults).
 */
export function resolveTheme(
	theme: string,
	cwd: string = process.cwd(),
): string {
	// Path-like input (contains / or \ or ends with .css)
	if (theme.includes('/') || theme.includes('\\') || theme.endsWith('.css')) {
		const absolutePath = isAbsolute(theme) ? theme : resolve(cwd, theme)

		if (!existsSync(absolutePath)) {
			throw new Error(`Theme file not found: ${absolutePath}`)
		}
		return absolutePath
	}

	// Name-based resolution: bundled themes only
	const bundledPath = getBundledThemePath(theme)
	if (bundledPath) return bundledPath

	throw new Error(
		`Theme '${theme}' not found. Available themes: ${getBundledThemes().join(', ')}`,
	)
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
