import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseFrontmatterFromString } from '../dist/core/frontmatter.js'
import { resolveView } from '../dist/core/view/resolve.js'
import { generateHtml } from '../dist/core/html-generator.js'

async function run() {
	const markdown = `---\n#debug: true\n---\n# Font test\n\nThis is Inter (body), **bold**, _italic_.\n\n\`\`\`js\n// Source Code Pro block\nconsole.log("hello")\n\`\`\`\n\n_Merriweather sample text_\n`

	const parsed = parseFrontmatterFromString(markdown)
	if (!parsed.ok) {
		console.error('Frontmatter parse failed', parsed.error)
		process.exit(1)
	}

	const layer = {}
	if (parsed.config) {
		if (parsed.config.sections) layer.sections = parsed.config.sections
		if (parsed.config.vars) layer.vars = parsed.config.vars
		if (parsed.config.style) layer.style = parsed.config.style
		if (parsed.config.pages) layer.pages = parsed.config.pages
		if (parsed.config.css) {
			const inline = parsed.config.css.filter(
				e => !e.trimEnd().toLowerCase().endsWith('.css'),
			)
			if (inline.length > 0) layer.css = inline
		}
	}

	const view = resolveView([layer])
	view.format = 'html'

	const doc = {
		content: parsed.content,
		icons: parsed.config?.icons,
		tagMap: undefined,
		baseDir: process.cwd(),
	}

	const html = await generateHtml(doc, view, { tailwind: 'compile' })
	const out = path.resolve(process.cwd(), 'tmp-render.html')
	writeFileSync(out, html, 'utf8')
	console.log('Wrote HTML to', out)
}

run().catch(err => {
	console.error(err)
	process.exit(1)
})
