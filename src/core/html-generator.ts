/**
 * HTML Generator Module
 * Converts markdown content to standalone HTML with embedded CSS
 */

import { existsSync } from 'node:fs'
import { resolve, isAbsolute } from 'node:path'
import jsBeautify from 'js-beautify'
const { html: beautifyHtml } = jsBeautify
import { generateVariablesCSS } from '../lib/css-engine/css-variables.js'
import { getBundledStylesDir, DEFAULT_STYLESHEET } from './styles.js'
import { resolveCssImports } from '../lib/css-engine/css-resolver.js'
import { compileTailwindCSS } from '../lib/css-engine/tailwind.js'
import { markdownRenderer } from './markdown.js'
import { assemblePipeline } from './dom-processors/index.js'
import type { VarsEnv } from '../lib/mdit-plugins/variable-substitution/index.js'
import type { ResolvedView } from './view/types.js'
import type { DocumentContext } from './types.js'

/**
 * Resolve CSS file paths from view config and document base directory.
 * The default stylesheet is always included first, user CSS cascades on top.
 */
export function resolveCssPaths(
	css: string[] | null,
	baseDir: string,
): string[] {
	if (!css || css.length === 0) return [DEFAULT_STYLESHEET]

	const userPaths = css.map(p => {
		const absolutePath = isAbsolute(p) ? p : resolve(baseDir, p)
		if (!existsSync(absolutePath)) {
			throw new Error(`CSS file not found: ${absolutePath}`)
		}
		return absolutePath
	})

	return [DEFAULT_STYLESHEET, ...userPaths]
}

function resolveBaseCSS(
	cssPaths: string[],
	variables: Record<string, string>,
): string {
	const resolvedCSS = cssPaths
		.map(p => resolveCssImports(p, getBundledStylesDir()))
		.join('\n')
	const variablesCSS =
		Object.keys(variables).length > 0 ? generateVariablesCSS(variables) : ''

	return resolvedCSS + '\n' + variablesCSS
}

function assembleHtml(body: string, css: string): string {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${css}
</style>
</head>
<body>
${body}
</body>
</html>`

	return beautifyHtml(html, {
		indent_with_tabs: true,
		indent_size: 1,
		max_preserve_newlines: 1,
		preserve_newlines: true,
		wrap_line_length: 0,
		unformatted: ['code', 'pre', 'script', 'style'],
		content_unformatted: ['pre', 'code'],
		extra_liners: ['head', 'body', '/html'],
	})
}

/**
 * Convert markdown to standalone HTML with embedded CSS.
 * Resolves CSS paths internally from view.css + doc.baseDir.
 */
export async function generateHtml(
	doc: DocumentContext,
	view: ResolvedView,
): Promise<string> {
	const cssPaths = resolveCssPaths(view.css, doc.baseDir)
	const env: { iconOverrides?: Record<string, string> } & VarsEnv = {
		iconOverrides: doc.icons,
		vars: view.vars,
	}
	const rawBody = await markdownRenderer.renderAsync(doc.content, env)

	const baseCSS = resolveBaseCSS(cssPaths, view.style)
	const pipeline = assemblePipeline(view, doc)
	const body = pipeline(rawBody)

	const tailwindCSS = await compileTailwindCSS(body)
	const combinedCSS = tailwindCSS + '\n' + baseCSS

	return assembleHtml(body, combinedCSS)
}
