/**
 * Generates default.pdf and meta.json in docs/public/playground/ from
 * playground-default.md. Run from repo root before docs build so the
 * playground can show the default without calling the API.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	parseFrontmatterFromString,
	extractTagMap,
} from '../src/core/frontmatter.js'
import { resolveView } from '../src/core/view/resolve.js'
import { generateHtml } from '../src/core/html-generator.js'
import { fitToPagesOnPage } from '../src/core/page-fit/index.js'
import { A4_WIDTH_PX } from '../src/core/page-fit/types.js'
import type { FitResult } from '../src/core/page-fit/index.js'
import type { DocumentContext } from '../src/core/types.js'
import type { ViewLayer } from '../src/core/view/types.js'
import { browserPool } from '../src/lib/browser-pool/index.js'
import { countPdfPages } from '../src/lib/pdf-kit/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const themeDir = join(rootDir, 'docs', '.vitepress', 'theme')
const outDir = join(rootDir, 'docs', 'public', 'playground')
const mdPath = join(themeDir, 'playground-default.md')
const pdfPath = join(outDir, 'default.pdf')
const metaPath = join(outDir, 'meta.json')

async function main(): Promise<void> {
	const markdown = readFileSync(mdPath, 'utf-8')
	const parsed = parseFrontmatterFromString(markdown)
	if (!parsed.ok) throw new Error(`Parse error: ${parsed.error}`)

	const layer: ViewLayer = {}
	if (parsed.config) {
		if (parsed.config.sections) layer.sections = parsed.config.sections
		if (parsed.config['bullet-order'])
			layer.bulletOrder = parsed.config['bullet-order']
		if (parsed.config.vars) layer.vars = parsed.config.vars
		if (parsed.config.style) layer.style = parsed.config.style
		if (parsed.config.pages) layer.pages = parsed.config.pages
		if (parsed.config.css) {
			const inline = parsed.config.css.filter(
				(entry: string) => !entry.trimEnd().toLowerCase().endsWith('.css'),
			)
			if (inline.length > 0) layer.css = inline
		}
	}

	const view = resolveView([layer])
	view.format = 'html'

	const doc: DocumentContext = {
		content: parsed.content,
		icons: parsed.config?.icons,
		tagMap: extractTagMap(parsed.config?.tags),
		baseDir: rootDir,
	}

	const needsPageFit = view.pages !== null
	const html = await generateHtml(doc, view, {
		tailwind: needsPageFit ? 'compile' : 'cdn',
	})

	let finalHtml = html
	let pageFit: Pick<FitResult, 'originalPages' | 'finalPages'> | undefined

	if (needsPageFit) {
		const browser = await browserPool.acquire()
		try {
			const page = await browser.newPage()
			try {
				await page.setViewportSize({ width: A4_WIDTH_PX, height: 1123 })
				await page.setContent(html, { waitUntil: 'domcontentloaded' })
				const result = await fitToPagesOnPage(page, html, view.pages!)
				finalHtml = result.html
				pageFit = {
					originalPages: result.originalPages,
					finalPages: result.finalPages,
				}
			} finally {
				await page.close()
			}
		} finally {
			browserPool.release(browser)
		}
	}

	const browser = await browserPool.acquire()
	let pageCount: number
	try {
		const page = await browser.newPage()
		try {
			await page.setViewportSize({ width: A4_WIDTH_PX, height: 1123 })
			await page.setContent(finalHtml, { waitUntil: 'domcontentloaded' })
			const pdfBuffer = await page.pdf({
				preferCSSPageSize: true,
				printBackground: true,
			})
			pageCount = pageFit?.finalPages ?? countPdfPages(Buffer.from(pdfBuffer))
			if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
			writeFileSync(pdfPath, Buffer.from(pdfBuffer))
		} finally {
			await page.close()
		}
	} finally {
		browserPool.release(browser)
	}

	writeFileSync(metaPath, JSON.stringify({ pageCount }, null, 2), 'utf-8')
	console.log(`Wrote ${pdfPath} (${pageCount} page(s)) and ${metaPath}`)
	await browserPool.closeAll()
}

main().catch(err => {
	console.error(err)
	process.exit(1)
})
