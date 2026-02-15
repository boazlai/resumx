/**
 * Inject a CSS style block into an HTML string before </head>.
 *
 * @param html - Full HTML document string
 * @param overrides - CSS variable overrides as key-value pairs
 * @returns HTML with injected style block
 */
export function injectVariableOverrides(
	html: string,
	overrides: Record<string, string>,
): string {
	const entries = Object.entries(overrides)
	if (entries.length === 0) return html

	const declarations = entries
		.map(([key, value]) => `  --${key}: ${value};`)
		.join('\n')
	const styleBlock = `<style>:root {\n${declarations}\n}</style>\n`

	return html.replace('</head>', `${styleBlock}</head>`)
}
