import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineLoader } from 'vitepress'
import {
	parseFrontmatterFromString,
	extractTagMap,
} from '../../../src/core/frontmatter.js'
import { resolveView } from '../../../src/core/view/resolve.js'
import { generateHtml } from '../../../src/core/html-generator.js'
import type { DocumentContext } from '../../../src/core/types.js'
import type { ViewLayer } from '../../../src/core/view/types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface PlaygroundData {
	markdown: string
	html: string
	defaultPdfUrl?: string
	defaultPageCount?: number
}

declare const data: PlaygroundData
export { data }

export default defineLoader({
	watch: [
		resolve(__dirname, 'playground-default.md'),
		resolve(__dirname, '../../public/playground/meta.json'),
	],
	async load(watchedFiles): Promise<PlaygroundData> {
		const mdPath = watchedFiles[0]
		const markdown = readFileSync(mdPath, 'utf-8')
		const parsed = parseFrontmatterFromString(markdown)
		if (!parsed.ok)
			throw new Error(`Default resume parse error: ${parsed.error}`)

		const layer: ViewLayer = {}
		if (parsed.config) {
			if (parsed.config.sections) layer.sections = parsed.config.sections
			if (parsed.config['bullet-order'])
				layer.bulletOrder = parsed.config['bullet-order']
			if (parsed.config.vars) layer.vars = parsed.config.vars
			if (parsed.config.style) layer.style = parsed.config.style
		}

		const view = resolveView([layer])
		view.pages = null
		view.format = 'html'

		const doc: DocumentContext = {
			content: parsed.content,
			icons: parsed.config?.icons,
			tagMap: extractTagMap(parsed.config?.tags),
			baseDir: resolve(__dirname, '../../..'),
		}

		const html = await generateHtml(doc, view)

		let defaultPdfUrl: string | undefined
		let defaultPageCount: number | undefined
		const metaPath = resolve(__dirname, '../../public/playground/meta.json')
		if (existsSync(metaPath)) {
			const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as {
				pageCount?: number
			}
			defaultPdfUrl = '/playground/default.pdf'
			defaultPageCount = typeof meta.pageCount === 'number' ? meta.pageCount : 1
		}

		return { markdown, html, defaultPdfUrl, defaultPageCount }
	},
})
