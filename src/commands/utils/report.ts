import chalk from 'chalk'
import { dirname, relative } from 'node:path'
import type { OutputFormat, RenderResult } from '../../core/renderer.js'

interface TaskResult {
	label: string
	results: Map<OutputFormat, RenderResult>
}

function formatDuration(ms: number): string {
	if (ms < 1000) {
		return `${Math.round(ms)}ms`
	}

	const seconds = ms / 1000
	if (seconds < 60) {
		return `${seconds.toFixed(2)}s`
	}

	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = seconds - minutes * 60
	return `${minutes}m ${remainingSeconds.toFixed(1)}s`
}

export function reportResults(
	taskResults: TaskResult[],
	cwd: string,
	startTime: number,
): void {
	let allSuccess = true
	let totalFiles = 0
	const outputDirs = new Set<string>()

	const maxLabelWidth = Math.max(
		0,
		...taskResults.map(({ label }) => label.length),
	)

	for (const { label, results } of taskResults) {
		const formatParts: string[] = []
		const errors: string[] = []

		for (const [format, result] of results) {
			const tag = format.toUpperCase()
			if (result.success) {
				totalFiles++
				const relDir = relative(cwd, dirname(result.outputPath)) || '.'
				outputDirs.add(relDir)
				formatParts.push(`${tag} ${chalk.green('✓')}`)
			} else {
				formatParts.push(`${tag} ${chalk.red('✗')}`)
				errors.push(`${tag}: ${result.error}`)
				allSuccess = false
			}
		}

		const prefix = label ? `  ${label.padEnd(maxLabelWidth)} ` : '  '
		console.log(`${prefix}${formatParts.join('  ')}`)

		for (const err of errors) {
			console.log(chalk.red(`${''.padEnd(maxLabelWidth + 4)}${err}`))
		}
	}

	console.log('')

	const renderDuration = formatDuration(performance.now() - startTime)
	const fileCount = `${totalFiles} file${totalFiles !== 1 ? 's' : ''}`
	const outputDir =
		outputDirs.size === 1 ?
			` \u2192 ${chalk.cyan([...outputDirs][0]!)}${[...outputDirs][0] === '.' ? '' : '/'}`
		:	''

	if (allSuccess) {
		console.log(
			`${chalk.green('Done!')} ${fileCount}${outputDir} ${chalk.gray(`(Time: ${renderDuration})`)}`,
		)
	} else {
		console.log(
			`${chalk.red('Some formats failed.')} ${chalk.gray(`(Time: ${renderDuration})`)}`,
		)
		throw new Error('Some formats failed to render')
	}
}
