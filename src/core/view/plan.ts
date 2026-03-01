import { resolve, dirname, basename, join } from 'node:path'
import type { ResolvedView } from './types.js'
import type { OutputFormat } from '../renderer.js'
import { cartesian } from '../../lib/solver/cartesian.js'
import { cleanupPath, stripDocExtension } from '../renderer.js'
import { expandTemplate } from '../../lib/string-template/index.js'

export interface RenderPlan {
	view: ResolvedView
	outputPath: string
	format: OutputFormat
	label: string
}

export type OutputStrategy =
	| { dir: string; name: string }
	| { template: string; cwd: string }

/**
 * Expand a base view across views × langs × formats into a flat list of
 * render plans. Each plan carries a concrete view (with selects/lang set),
 * an output path, and a format.
 *
 * Output path is determined by the strategy:
 * - `{ dir, name }`: suffix-based naming, e.g. `dir/name-frontend-en.pdf`
 * - `{ template, cwd }`: template expansion, e.g. `output/{view}-{lang}.pdf`
 */
export function planRenders(
	baseView: ResolvedView,
	cssPaths: string[],
	variables: Record<string, string>,
	views: string[],
	langs: string[],
	formats: OutputFormat[],
	output: OutputStrategy,
): RenderPlan[] {
	const plans: RenderPlan[] = []
	const isTemplate = 'template' in output
	const hasMultipleViews = views.length > 1
	const hasMultipleLangs = langs.length > 1

	const effectiveViews: Array<string | undefined> =
		views.length > 0 ? views : [undefined]
	const effectiveLangs: Array<string | undefined> =
		langs.length > 0 ? langs : [undefined]

	for (const [viewName, lang] of cartesian(effectiveViews, effectiveLangs)) {
		const showView = isTemplate ? !!viewName : hasMultipleViews && !!viewName
		const showLang = isTemplate ? !!lang : hasMultipleLangs && !!lang

		const labelParts = [showView && viewName, showLang && lang].filter(
			Boolean,
		) as string[]
		const label = labelParts.length > 0 ? `[${labelParts.join(', ')}]` : ''

		const resolved: ResolvedView = {
			...baseView,
			selects: viewName ? [viewName] : baseView.selects,
			style: variables,
			css: cssPaths,
			lang: lang ?? baseView.lang,
		}

		let outputDir: string
		let outputName: string

		if (isTemplate) {
			const expanded = cleanupPath(
				expandTemplate(output.template, {
					view: viewName ?? '',
					lang: lang ?? '',
				}),
			)
			const resolvedPath = resolve(output.cwd, expanded)
			outputDir = dirname(resolvedPath)
			outputName = stripDocExtension(basename(resolvedPath))
		} else {
			outputDir = output.dir
			const suffixParts = [
				hasMultipleViews && viewName,
				hasMultipleLangs && lang,
			].filter(Boolean) as string[]
			outputName =
				suffixParts.length > 0 ?
					`${output.name}-${suffixParts.join('-')}`
				:	output.name
		}

		for (const format of formats) {
			const ext = format === 'docx' ? 'docx' : format
			plans.push({
				view: resolved,
				outputPath: join(outputDir, `${outputName}.${ext}`),
				format,
				label,
			})
		}
	}

	return plans
}
