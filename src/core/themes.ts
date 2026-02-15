import { existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve, isAbsolute, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Bundled themes directory (relative to compiled dist)
const BUNDLED_THEMES_DIR = resolve(__dirname, '../../themes')

// Default theme name (single source of truth)
export const DEFAULT_THEME = 'zurich'

// =============================================================================
// CSS Variable Utilities (re-exported from css-engine)
// =============================================================================

export type {
	ThemeVariables,
	CssVariable,
} from '../lib/css-engine/css-variables.js'
export {
	mergeVariables,
	generateVariablesCSS,
	parseCssVariables,
} from '../lib/css-engine/css-variables.js'

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
