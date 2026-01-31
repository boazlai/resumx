import Conf from 'conf'
import type { Schema } from 'conf'
import { homedir } from 'node:os'
import { join } from 'node:path'

// =============================================================================
// Types
// =============================================================================

export interface GlobalConfig {
	defaultStyle?: string
	styleVariables?: Record<string, Record<string, string>>
}

type StyleVariables = Record<string, string>

const schema: Schema<GlobalConfig> = {
	defaultStyle: {
		type: 'string',
	},
	styleVariables: {
		type: 'object',
		additionalProperties: {
			type: 'object',
			additionalProperties: { type: 'string' },
		},
	},
}

const defaults: GlobalConfig = {
	defaultStyle: 'classic',
	styleVariables: {},
}

export interface ConfigStore {
	/** Full path to config file */
	readonly path: string

	/** Raw config object */
	readonly store: GlobalConfig

	/** Default style name (use resetDefaultStyle to restore to 'classic') */
	defaultStyle: string

	/** Set default style back to 'classic' (explicit set; conf does not restore defaults on delete). */
	resetDefaultStyle(): void

	/** Get style variable overrides */
	getStyleVariables(style: string): StyleVariables

	/** Set style variables (merges with existing) */
	setStyleVariables(style: string, vars: StyleVariables): void

	/** Clear all variables for a style */
	resetStyleVariables(style: string): void

	/** Clear entire config */
	clear(): void
}

/**
 * Create a config store.
 * @param cwd - Config directory. Defaults to ~/.config/resum8 (pass custom path for testing).
 */
export function createConfigStore(
	cwd = join(homedir(), '.config', 'resum8'),
): ConfigStore {
	const conf = new Conf<GlobalConfig>({
		cwd,
		configName: 'config',
		schema,
		defaults,
	})

	return {
		get path() {
			return conf.path
		},

		get store() {
			return conf.store
		},

		get defaultStyle() {
			return conf.get('defaultStyle') as string
		},

		set defaultStyle(value: string) {
			conf.set('defaultStyle', value)
		},

		resetDefaultStyle(): void {
			conf.set('defaultStyle', 'classic')
		},

		getStyleVariables(style: string): StyleVariables {
			return (conf.get(`styleVariables.${style}`) as StyleVariables) ?? {}
		},

		setStyleVariables(style: string, vars: StyleVariables): void {
			const existing = this.getStyleVariables(style)
			conf.set(`styleVariables.${style}`, { ...existing, ...vars })
		},

		resetStyleVariables(style: string): void {
			const all = conf.get('styleVariables') ?? {}
			delete all[style]
			conf.set('styleVariables', all)
		},

		clear(): void {
			conf.clear()
		},
	}
}

/** Default config store singleton */
export const config = createConfigStore()
