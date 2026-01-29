import chalk from 'chalk'
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import {
	listStyles,
	getDefaultStyle,
	parseCssVariables,
	type StyleInfo,
} from '../lib/styles.js'
import {
	writeGlobalConfig,
	readGlobalConfig,
	getConfigPath,
	parseVarFlags,
	setStyleVariables,
	resetStyleVariables,
	getStyleVariables,
} from '../lib/config.js'
import dedent from 'dedent'

export interface StyleCommandOptions {
	default?: string
	var?: string[]
	set?: string[] // CLI uses --set to avoid conflict with main program's --var
	reset?: string // Reset a specific style variable to default
	resetAll?: boolean // Reset all style variables to defaults
	_configDir?: string // For testing
}

/** Context passed to style subcommands (cwd + optional config dir for tests). */
interface StyleContext {
	cwd: string
	configDir?: string
}

/** Resolve style by name. Returns null when not found. */
function getStyle(styleName: string, cwd: string): StyleInfo | null {
	const styles = listStyles(cwd)
	const style = styles.find(s => s.name === styleName)
	return style ?? null
}

/**
 * Resolve style by name or exit with error.
 * Single place for "style not found" exit so the CLI layer owns process.exit.
 * Throws after process.exit(1) so when exit is mocked in tests we never return null.
 */
function requireStyle(styleName: string, ctx: StyleContext): StyleInfo {
	const style = getStyle(styleName, ctx.cwd)
	if (!style) {
		console.error(formatStyleNotFoundError(styleName, listStyles(ctx.cwd)))
		process.exit(1)
	}
	return style
}

/**
 * Style command - list styles or set default
 *
 * Usage:
 *   m8 style                                  # list styles
 *   m8 style --default classic                # set default style
 *   m8 style classic                          # show style info
 *   m8 style classic --set key=value          # set default variable override
 *   m8 style classic --reset font-family      # reset specific variable to default
 *   m8 style classic --reset-all              # reset all variables to defaults
 */
export async function styleCommand(
	styleName: string | undefined,
	options: StyleCommandOptions,
): Promise<void> {
	const ctx: StyleContext = {
		cwd: process.cwd(),
		configDir: options._configDir,
	}

	if (options.default) {
		await setDefaultStyle(options.default, ctx)
		return
	}

	if (options.resetAll) {
		if (!styleName) {
			console.error(
				formatStyleNameRequired('--reset-all', 'm8 style <name> --reset-all'),
			)
			process.exit(1)
		}
		await resetAllStyleVarOverrides(styleName, ctx)
		return
	}

	if (options.reset) {
		if (!styleName) {
			console.error(
				formatStyleNameRequired(
					'--reset',
					'm8 style <name> --reset <variable-name>',
				),
			)
			process.exit(1)
		}
		await resetSingleStyleVarOverride(styleName, options.reset, ctx)
		return
	}

	if (options.var && options.var.length > 0) {
		if (!styleName) {
			console.error(
				formatStyleNameRequired('--var', 'm8 style <name> --var key=value'),
			)
			process.exit(1)
		}
		await setStyleVarOverrides(styleName, options.var, ctx)
		return
	}

	if (styleName) {
		await showStyleInfo(styleName, ctx)
		return
	}

	await listAllStyles(ctx.cwd)
}

/** Reset all variable overrides for a style. */
async function resetAllStyleVarOverrides(
	styleName: string,
	ctx: StyleContext,
): Promise<void> {
	requireStyle(styleName, ctx)
	resetStyleVariables(styleName, ctx.configDir)
	console.log(dedent`
		All variable overrides cleared for ${chalk.cyan(styleName)}

		${chalk.dim('Style will now use original default values.')}
	`)
}

/** Reset a single variable override for a style. */
async function resetSingleStyleVarOverride(
	styleName: string,
	varName: string,
	ctx: StyleContext,
): Promise<void> {
	requireStyle(styleName, ctx)
	const currentOverrides = getStyleVariables(styleName, ctx.configDir)

	// Check if the variable has an override
	if (!currentOverrides[varName]) {
		const overrideKeys = Object.keys(currentOverrides)
		console.error(dedent.withOptions({ alignValues: true })`
			${chalk.red(`Error: No override found for variable '${varName}' in style '${styleName}'.`)}

			Current overrides:
			  ${overrideKeys.length > 0 ? overrideKeys.map(k => chalk.cyan(`--${k}`)).join('\n') : chalk.dim('(none)')}
		`)
		process.exit(1)
	}

	// Remove the specific variable
	const updatedOverrides = { ...currentOverrides }
	delete updatedOverrides[varName]

	if (Object.keys(updatedOverrides).length === 0) {
		resetStyleVariables(styleName, ctx.configDir)
	} else {
		const config = readGlobalConfig(ctx.configDir)
		const updatedStyleVariables = {
			...config.styleVariables,
			[styleName]: updatedOverrides,
		}
		writeGlobalConfig({ styleVariables: updatedStyleVariables }, ctx.configDir)
	}

	console.log(dedent`
		Variable override ${chalk.cyan(`--${varName}`)} cleared for ${chalk.cyan(styleName)}

		${chalk.dim('Variable will now use its original default value.')}
	`)
}

/** Set variable overrides for a style. */
async function setStyleVarOverrides(
	styleName: string,
	varFlags: string[],
	ctx: StyleContext,
): Promise<void> {
	requireStyle(styleName, ctx)
	const variables = parseVarFlags(varFlags)
	setStyleVariables(styleName, variables, ctx.configDir)

	console.log(dedent.withOptions({ alignValues: true })`
		Default variable overrides saved for ${chalk.cyan(styleName)}:

		  ${Object.entries(variables)
				.map(([key, value]) => `${chalk.cyan(`--${key}`)}: ${value}`)
				.join('\n')}

		${chalk.dim('These will be applied when rendering with this style.')}
	`)
}

/** Show info for a specific style including configurable variables. */
async function showStyleInfo(
	styleName: string,
	ctx: StyleContext,
): Promise<void> {
	const style = requireStyle(styleName, ctx)
	const css = readFileSync(style.path, 'utf-8')
	const variables = parseCssVariables(css)
	const savedOverrides = getStyleVariables(styleName, ctx.configDir)

	console.log(
		chalk.bold(
			`Style: ${chalk.cyan(styleName)}${style.isLocal ? ` (overridden in ${relative(ctx.cwd, style.path)})` : ''}\n`,
		),
	)

	if (variables.length === 0) {
		console.log(chalk.dim('No configurable CSS variables found.'))
	} else {
		console.log(chalk.bold('Configurable variables:'))
		for (const v of variables) {
			const varName = v.name.slice(2) // Remove -- prefix
			const override = savedOverrides[varName]

			console.log(`    ${chalk.cyan(varName)}`)
			if (override && override !== v.value) {
				console.log(
					`      ${chalk.dim(v.value)} ${chalk.yellow('→')} ${chalk.green(override)}`,
				)
			} else {
				console.log(`      ${chalk.dim(v.value)}`)
			}
		}
	}
	console.log('')
	console.log(dedent`
		Override with:
		    ${chalk.blue(`m8 resume.md --var ${variables[0]?.name.slice(2) ?? 'font-family'}="value"`)}

		Set default override:
		    ${chalk.blue(`m8 style ${styleName} --set ${variables[0]?.name.slice(2) ?? 'font-family'}="value"`)}

		Reset specific variable:
		    ${chalk.blue(`m8 style ${styleName} --reset ${variables[0]?.name.slice(2) ?? 'font-family'}`)}

		Reset all overrides:
		    ${chalk.blue(`m8 style ${styleName} --reset-all`)}

		Or customize fully:
		    ${chalk.blue(`m8 eject ${styleName}`)}
	`)
}

/** Set the global default style. */
async function setDefaultStyle(
	styleName: string,
	ctx: StyleContext,
): Promise<void> {
	requireStyle(styleName, ctx)
	writeGlobalConfig({ defaultStyle: styleName }, ctx.configDir)

	console.log(dedent`
		Default style set to ${chalk.cyan(styleName)}
		${chalk.dim(`Config saved to ${getConfigPath()}`)}
	`)
}

/** List all available styles. */
async function listAllStyles(cwd: string): Promise<void> {
	const styles = listStyles(cwd)
	const defaultStyle = getDefaultStyle()

	console.log(chalk.bold('Available styles:'))

	for (const s of styles) {
		const isDefault = s.name === defaultStyle
		const styleNameStr = isDefault ? chalk.cyan(s.name) : s.name
		let markerStr =
			s.isLocal ? chalk.yellow(` (overridden in ${relative(cwd, s.path)})`) : ''
		console.log(`    ${styleNameStr}${markerStr}`)
	}
	console.log('')

	console.log(dedent`
		Usage:
		    ${chalk.blue('m8 resume.md --style <name>')}

		View style details:
		    ${chalk.blue('m8 style <name>')}

		Set default style:
		    ${chalk.blue('m8 style --default <name>')}

		Customize a style:
		    ${chalk.blue('m8 eject <name>')}  Copy to ./styles/ for editing
	`)
}

/** Format "style not found" error message. */
function formatStyleNotFoundError(
	notFoundStyleName: string,
	availableStyles: StyleInfo[],
): string {
	return dedent.withOptions({ alignValues: true })`
		${chalk.red(`Error: Style '${notFoundStyleName}' not found.`)}

		Available styles:
		    ${availableStyles.map(s => s.name).join('\n')}
	`
}

/** Format "style name required" error message. */
function formatStyleNameRequired(
	optionName: string,
	usageExample: string,
): string {
	return dedent`
		${chalk.red(`Error: A style name is required when using ${optionName}`)}

		Usage:
		    ${chalk.blue(usageExample)}
	`
}
